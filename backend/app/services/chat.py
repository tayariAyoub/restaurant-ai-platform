import re
from dataclasses import dataclass

from openai import OpenAI
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import KnowledgeChunk, Restaurant
from app.services.knowledge import create_embeddings

FALLBACK = "I don't have this information. Please contact the restaurant directly."
MIN_TOKEN_OVERLAP = 2


@dataclass(frozen=True)
class ChatAnswer:
    answer: str
    unanswered: bool
    sources: list[str]


def question_tokens(text: str) -> set[str]:
    return {
        token
        for token in re.findall(r"\w+", text.lower())
        if len(token) > 2
        and token not in {"the", "and", "for", "you", "are", "with", "this", "that"}
    }


def normalize_answer(answer: str | None, fallback: str = FALLBACK) -> tuple[str, bool]:
    final = answer.strip() if answer else fallback
    fallback_markers = [
        FALLBACK.lower(),
        fallback.lower(),
        "i don't have this information",
        "i do not have this information",
        "not provided in the context",
        "not available in the context",
        "not specified in the context",
    ]
    if any(marker in final.lower() for marker in fallback_markers):
        return fallback, True
    return final, False


def retrieve_context_chunks(
    db: Session, restaurant_id: int, question: str, limit: int = 6
) -> list[KnowledgeChunk]:
    embedding = create_embeddings([question])[0]
    if embedding is not None:
        statement = (
            select(KnowledgeChunk)
            .where(
                KnowledgeChunk.restaurant_id == restaurant_id,
                KnowledgeChunk.embedding.is_not(None),
            )
            .order_by(KnowledgeChunk.embedding.cosine_distance(embedding))
            .limit(limit)
        )
        return list(db.scalars(statement))

    # Local development fallback: simple token overlap retrieval.
    tokens = question_tokens(question)
    chunks = db.scalars(
        select(KnowledgeChunk).where(KnowledgeChunk.restaurant_id == restaurant_id)
    ).all()
    scored = [
        (len(tokens & question_tokens(chunk.content)), chunk)
        for chunk in chunks
        if chunk.content
    ]
    ranked = sorted(scored, key=lambda item: item[0], reverse=True)
    if not ranked or ranked[0][0] < MIN_TOKEN_OVERLAP:
        return []
    return [chunk for score, chunk in ranked[:limit] if score > 0]


def retrieve_context(db: Session, restaurant_id: int, question: str, limit: int = 6) -> list[str]:
    return [chunk.content for chunk in retrieve_context_chunks(db, restaurant_id, question, limit)]


def source_labels(chunks: list[KnowledgeChunk]) -> list[str]:
    labels: list[str] = []
    for chunk in chunks:
        source = (chunk.source or "knowledge").lower()
        if source.startswith("menu"):
            label = "menu"
        elif "opening" in source:
            label = "opening hours"
        elif "profile" in source:
            label = "restaurant profile"
        elif "service" in source:
            label = "service settings"
        else:
            label = chunk.source or "knowledge document"
        if label not in labels:
            labels.append(label)
    return labels


def restaurant_ai_settings(restaurant: Restaurant | None) -> dict[str, str]:
    return {
        "name": (restaurant.ai_name if restaurant else "").strip() or "AI Maitre d'",
        "tone": (restaurant.ai_tone if restaurant else "").strip()
        or "premium hospitality, concise, warm, and precise",
        "allowed_topics": (restaurant.ai_allowed_topics if restaurant else "").strip()
        or (
            "menu recommendations, prices, ingredients, allergens, opening hours, address, "
            "reservations, ordering, pickup, delivery, and restaurant story"
        ),
        "fallback": (restaurant.ai_fallback_message if restaurant else "").strip() or FALLBACK,
        "escalation": (restaurant.ai_escalation_message if restaurant else "").strip()
        or "Please contact the restaurant directly for urgent help or missing information.",
        "language": (restaurant.ai_language if restaurant else "").strip()
        or "Answer in the customer's language when possible.",
        "safety": (restaurant.ai_safety_instructions if restaurant else "").strip()
        or (
            "Do not invent prices, allergens, opening hours, discounts, menu items, "
            "or reservation availability."
        ),
    }


def answer_question(db: Session, restaurant_id: int, question: str) -> ChatAnswer:
    restaurant = db.get(Restaurant, restaurant_id)
    ai_settings = restaurant_ai_settings(restaurant)
    if not settings.openai_api_key:
        return ChatAnswer(
            answer=f"{ai_settings['name']} is not configured yet. {ai_settings['escalation']}",
            unanswered=True,
            sources=[],
        )

    chunks = retrieve_context_chunks(db, restaurant_id, question)
    if not chunks:
        return ChatAnswer(ai_settings["fallback"], True, [])

    client = OpenAI(api_key=settings.openai_api_key)
    context_text = "\n\n".join(chunk.content for chunk in chunks)
    response = client.chat.completions.create(
        model=settings.openai_chat_model,
        temperature=0.1,
        messages=[
            {
                "role": "system",
                "content": (
                    f"You are {ai_settings['name']}, the restaurant's AI Maitre d'. "
                    "Answer warmly and ONLY from the provided restaurant context for this single "
                    "restaurant. Never use general restaurant knowledge, outside assumptions, "
                    "or data from another restaurant. "
                    f"Tone and personality: {ai_settings['tone']}. "
                    f"Allowed topics: {ai_settings['allowed_topics']}. "
                    f"Language preference: {ai_settings['language']}. "
                    f"Safety instructions: {ai_settings['safety']} "
                    "Never invent menu items, prices, policies, allergen safety, opening hours, "
                    "discounts, or reservation availability. If the answer is absent or uncertain, "
                    f"reply exactly with: {ai_settings['fallback']} "
                    f"When escalation is needed, use this guidance: {ai_settings['escalation']} "
                    "Keep answers concise. For allergy questions, remind the customer to confirm "
                    "with restaurant staff. You may suggest available menu items from context and "
                    "guide the customer to use the website's Add to order buttons and checkout, "
                    "but never claim an order was placed or change the cart yourself. For "
                    "reservation questions, explain what the context says and guide the customer "
                    "to the reservation form; never promise availability unless it is explicitly "
                    "in context."
                ),
            },
            {
                "role": "user",
                "content": f"RESTAURANT CONTEXT:\n{context_text}\n\nQUESTION:\n{question}",
            },
        ],
    )
    answer, unanswered = normalize_answer(
        response.choices[0].message.content, ai_settings["fallback"]
    )
    return ChatAnswer(answer, unanswered, source_labels(chunks))
