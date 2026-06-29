from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Conversation, Message, RestaurantFaq
from app.services.knowledge import rebuild_structured_knowledge


def list_faqs(db: Session, restaurant_id: int) -> list[RestaurantFaq]:
    return list(
        db.scalars(
            select(RestaurantFaq)
            .where(RestaurantFaq.restaurant_id == restaurant_id)
            .order_by(RestaurantFaq.sort_order, RestaurantFaq.created_at)
        )
    )


def create_faq(
    db: Session, restaurant_id: int, faq_data: dict[str, object]
) -> RestaurantFaq:
    faq = RestaurantFaq(restaurant_id=restaurant_id, **faq_data)
    db.add(faq)
    return faq


def update_faq(
    db: Session,
    restaurant_id: int,
    faq_id: int,
    faq_data: dict[str, object],
) -> RestaurantFaq:
    faq = db.get(RestaurantFaq, faq_id)
    if not faq or faq.restaurant_id != restaurant_id:
        raise HTTPException(status_code=404, detail="FAQ not found")
    for key, value in faq_data.items():
        setattr(faq, key, value)
    return faq


def delete_faq(db: Session, restaurant_id: int, faq_id: int) -> None:
    faq = db.get(RestaurantFaq, faq_id)
    if not faq or faq.restaurant_id != restaurant_id:
        raise HTTPException(status_code=404, detail="FAQ not found")
    db.delete(faq)


def get_public_unanswered_message(
    db: Session, restaurant_id: int, message_id: int
) -> Message:
    message = db.scalar(
        select(Message)
        .join(Conversation)
        .where(
            Message.id == message_id,
            Conversation.restaurant_id == restaurant_id,
            Conversation.is_test.is_(False),
        )
    )
    if not message:
        raise HTTPException(status_code=404, detail="Unanswered message not found")
    if not message.is_unanswered:
        raise HTTPException(status_code=400, detail="Message is not marked unanswered")
    return message


def review_unanswered_message(
    db: Session,
    restaurant_id: int,
    message_id: int,
    is_reviewed: bool,
) -> Message:
    message = get_public_unanswered_message(db, restaurant_id, message_id)
    message.is_reviewed = is_reviewed
    return message


def convert_unanswered_message_to_faq(
    db: Session,
    restaurant_id: int,
    message_id: int,
    faq_data: dict[str, object],
) -> RestaurantFaq:
    message = get_public_unanswered_message(db, restaurant_id, message_id)
    faq = RestaurantFaq(
        restaurant_id=restaurant_id,
        source_message_id=message.id,
        **faq_data,
    )
    message.is_reviewed = True
    db.add(faq)
    return faq


def rebuild_faq_knowledge(db: Session, restaurant_id: int) -> None:
    rebuild_structured_knowledge(db, restaurant_id)
