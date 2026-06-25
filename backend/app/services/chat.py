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
MIN_TOKEN_OVERLAP = 2


def question_tokens(text: str) -> set[str]:
    return {
        token
        for token in re.findall(r"\w+", text.lower())
        if len(token) > 2 and token not in {"the", "and", "for", "you", "are", "with", "this", "that"}
    }


def normalize_answer(answer: str | None) -> tuple[str, bool]:
    final = answer.strip() if answer else FALLBACK
    fallback_markers = [
        FALLBACK.lower(),
        "i don't have this information",
        "i do not have this information",
        "not provided in the context",
        "not available in the context",
    ]
    if any(marker in final.lower() for marker in fallback_markers):
        return FALLBACK, True
    return final, False


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
    tokens = question_tokens(question)
    chunks = db.scalars(
        select(KnowledgeChunk).where(KnowledgeChunk.restaurant_id == restaurant_id)
    ).all()
    scored = [
        (len(tokens & question_tokens(chunk.content)), chunk.content)
        for chunk in chunks
        if chunk.content
    ]
    ranked = sorted(scored, key=lambda item: item[0], reverse=True)
    if not ranked or ranked[0][0] < MIN_TOKEN_OVERLAP:
        return []
    return [content for score, content in ranked[:limit] if score > 0]


def answer_question(db: Session, restaurant_id: int, question: str) -> tuple[str, bool]:
    if not settings.openai_api_key:
        return (
            "The AI Maître d' is not configured yet. Please contact the restaurant directly, "
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
                    "You are the restaurant's AI Maître d'. Answer warmly and ONLY from the "
                    "provided restaurant context for this single restaurant. Never use general "
                    "restaurant knowledge, outside assumptions, or data from another restaurant. "
                    "Never invent menu items, prices, policies, "
                    "allergen safety, opening hours, or reservation availability. If the answer "
                    f"is absent or uncertain, reply exactly with: {FALLBACK} Keep answers concise. "
                    "For allergy questions, remind the customer to confirm with restaurant staff. "
                    "You may suggest available menu items from context and guide the customer to "
                    "use the website's Add to order buttons and checkout, but never claim an order "
                    "was placed or change the cart yourself. For reservation questions, explain "
                    "what the context says and guide the customer to the reservation form; never "
                    "promise availability unless it is explicitly in context."
                ),
            },
            {
                "role": "user",
                "content": f"RESTAURANT CONTEXT:\n{context_text}\n\nQUESTION:\n{question}",
            },
        ],
    )
    return normalize_answer(response.choices[0].message.content)
