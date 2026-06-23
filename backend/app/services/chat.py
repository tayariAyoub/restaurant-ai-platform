import re

from openai import OpenAI
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import KnowledgeChunk
from app.services.knowledge import create_embeddings

FALLBACK = (
    "I don't have this information. Please contact the restaurant directly."
)


def retrieve_context(db: Session, restaurant_id: int, question: str, limit: int = 6) -> list[str]:
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
        return [chunk.content for chunk in db.scalars(statement)]

    # Local development fallback: simple token overlap retrieval.
    tokens = set(re.findall(r"\w+", question.lower()))
    chunks = db.scalars(
        select(KnowledgeChunk).where(KnowledgeChunk.restaurant_id == restaurant_id)
    ).all()
    ranked = sorted(
        chunks,
        key=lambda chunk: len(tokens & set(re.findall(r"\w+", chunk.content.lower()))),
        reverse=True,
    )
    return [chunk.content for chunk in ranked[:limit] if chunk.content]


def answer_question(db: Session, restaurant_id: int, question: str) -> tuple[str, bool]:
    if not settings.openai_api_key:
        return (
            "The AI assistant is not configured yet. Please contact the restaurant directly, "
            "or ask the owner to add an OpenAI API key.",
            True,
        )

    context = retrieve_context(db, restaurant_id, question)
    if not context:
        return FALLBACK, True

    client = OpenAI(api_key=settings.openai_api_key)
    context_text = "\n\n".join(context)
    response = client.chat.completions.create(
        model=settings.openai_chat_model,
        temperature=0.1,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are the restaurant's friendly customer assistant. Answer ONLY from the "
                    "provided restaurant context. Never invent menu items, prices, policies, "
                    "allergen safety, opening hours, or reservation availability. If the answer "
                    f"is absent or uncertain, reply exactly with: {FALLBACK} Keep answers concise. "
                    "For allergy questions, remind the customer to confirm with restaurant staff. "
                    "You may suggest available menu items from context and guide the customer to "
                    "use the website's Add to order buttons and checkout, but never claim an order "
                    "was placed or change the cart yourself."
                ),
            },
            {
                "role": "user",
                "content": f"RESTAURANT CONTEXT:\n{context_text}\n\nQUESTION:\n{question}",
            },
        ],
    )
    answer = response.choices[0].message.content
    final = answer.strip() if answer else FALLBACK
    return final, final == FALLBACK
