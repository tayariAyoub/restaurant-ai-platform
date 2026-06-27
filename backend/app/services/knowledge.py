import io
import re

from fastapi import UploadFile
from openai import OpenAI
from pypdf import PdfReader
from sqlalchemy import delete, select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.models import KnowledgeChunk, MenuCategory, Restaurant


def extract_upload_text(file: UploadFile, content: bytes) -> str:
    filename = (file.filename or "").lower()
    if filename.endswith(".pdf"):
        reader = PdfReader(io.BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    if filename.endswith(".txt"):
        return content.decode("utf-8", errors="replace")
    raise ValueError("Only PDF and TXT files are supported.")


def chunk_text(text: str, max_chars: int = 1200, overlap: int = 180) -> list[str]:
    clean = re.sub(r"\s+", " ", text).strip()
    if not clean:
        return []
    chunks: list[str] = []
    start = 0
    while start < len(clean):
        end = min(start + max_chars, len(clean))
        if end < len(clean):
            boundary = clean.rfind(" ", start, end)
            if boundary > start + max_chars // 2:
                end = boundary
        chunks.append(clean[start:end].strip())
        if end >= len(clean):
            break
        start = max(end - overlap, start + 1)
    return chunks


def create_embeddings(texts: list[str]) -> list[list[float] | None]:
    if not texts:
        return []
    if not settings.openai_api_key:
        return [None] * len(texts)
    client = OpenAI(api_key=settings.openai_api_key)
    response = client.embeddings.create(model=settings.openai_embedding_model, input=texts)
    return [item.embedding for item in response.data]


def rebuild_structured_knowledge(db: Session, restaurant_id: int) -> None:
    restaurant = db.scalar(
        select(Restaurant)
        .where(Restaurant.id == restaurant_id)
        .options(selectinload(Restaurant.categories).selectinload(MenuCategory.items))
    )
    if not restaurant:
        return

    db.execute(
        delete(KnowledgeChunk).where(
            KnowledgeChunk.restaurant_id == restaurant_id,
            KnowledgeChunk.document_id.is_(None),
        )
    )

    service_modes = [
        label
        for enabled, label in [
            (restaurant.reservations_enabled, "reservation requests"),
            (restaurant.ordering_enabled, "online ordering"),
            (restaurant.delivery_enabled and restaurant.ordering_enabled, "delivery"),
            (restaurant.pickup_enabled and restaurant.ordering_enabled, "pickup"),
            (restaurant.dine_in_enabled and restaurant.ordering_enabled, "dine-in ordering"),
        ]
        if enabled
    ]
    social_links = [
        link
        for link in [
            restaurant.google_maps_url,
            restaurant.instagram_url,
            restaurant.facebook_url,
            restaurant.tiktok_url,
        ]
        if link
    ]
    facts = [
        (
            "restaurant profile",
            f"Restaurant: {restaurant.name}. Tagline: {restaurant.tagline or 'not specified'}. "
            f"Description: {restaurant.description or 'not specified'}. "
            f"Story and atmosphere: {restaurant.story or 'not specified'}. "
            f"Address: {restaurant.address}, {restaurant.postal_code} {restaurant.city}. "
            f"Phone: {restaurant.phone or 'not specified'}. Email: {restaurant.email or 'not specified'}. "
            f"Website reservation URL: {restaurant.reservation_url or 'not specified'}. "
            f"Social or map links: {', '.join(social_links) if social_links else 'not specified'}.",
        ),
        ("opening hours", f"Opening hours for {restaurant.name}: {restaurant.opening_hours}"),
        (
            "service modes",
            f"Available customer service modes for {restaurant.name}: "
            f"{', '.join(service_modes) if service_modes else 'none specified'}. "
            f"Reservations enabled: {'yes' if restaurant.reservations_enabled else 'no'}. "
            f"Ordering enabled: {'yes' if restaurant.ordering_enabled else 'no'}. "
            f"Delivery enabled: {'yes' if restaurant.delivery_enabled and restaurant.ordering_enabled else 'no'}. "
            f"Pickup enabled: {'yes' if restaurant.pickup_enabled and restaurant.ordering_enabled else 'no'}. "
            f"Dine-in ordering enabled: {'yes' if restaurant.dine_in_enabled and restaurant.ordering_enabled else 'no'}.",
        ),
    ]
    for category in restaurant.categories:
        facts.append(
            (
                f"menu category: {category.name}",
                f"Menu category {category.name}. Description: {category.description or 'not specified'}.",
            )
        )
        for item in category.items:
            dietary = ", ".join(
                label
                for enabled, label in [
                    (item.is_vegan, "vegan"),
                    (item.is_vegetarian, "vegetarian"),
                    (item.is_halal, "halal"),
                ]
                if enabled
            )
            facts.append(
                (
                    f"menu: {category.name}",
                    f"Menu item in {category.name}: {item.name}. Price: EUR {item.price:.2f}. "
                    f"Description: {item.description or 'not specified'}. "
                    f"Dietary options: {dietary or 'none specified'}. "
                    f"Allergens: {item.allergens or 'not specified'}. "
                    f"Availability: {'available' if item.is_available else 'currently unavailable'}.",
                )
            )

    embeddings = create_embeddings([content for _, content in facts])
    db.add_all(
        [
            KnowledgeChunk(
                restaurant_id=restaurant_id,
                source=source,
                content=content,
                embedding=embedding,
            )
            for (source, content), embedding in zip(facts, embeddings, strict=True)
        ]
    )
    db.commit()
