from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import ContactRequest, Conversation


def list_conversations(
    db: Session, restaurant_id: int, *, include_test: bool = False
) -> list[Conversation]:
    statement = (
        select(Conversation)
        .where(Conversation.restaurant_id == restaurant_id)
        .options(selectinload(Conversation.messages))
        .order_by(Conversation.updated_at.desc())
    )
    if not include_test:
        statement = statement.where(Conversation.is_test.is_(False))
    return list(db.scalars(statement))


def list_reservations(db: Session, restaurant_id: int) -> list[ContactRequest]:
    return list(
        db.scalars(
            select(ContactRequest)
            .where(ContactRequest.restaurant_id == restaurant_id)
            .order_by(ContactRequest.created_at.desc())
        )
    )


def update_reservation_status(
    db: Session, restaurant_id: int, reservation_id: int, status: str
) -> ContactRequest:
    reservation = db.get(ContactRequest, reservation_id)
    if not reservation or reservation.restaurant_id != restaurant_id:
        raise HTTPException(status_code=404, detail="Reservation not found")
    reservation.status = status
    return reservation
