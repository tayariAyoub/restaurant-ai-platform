from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models import ContactRequest, Conversation, Message, Order, Restaurant, Theme, User
from app.schemas import DashboardStats


VALID_ADMIN_ROLES = {"SUPER_ADMIN", "RESTAURANT_OWNER"}


def build_dashboard_stats(db: Session, user: User) -> DashboardStats:
    restaurant_filter = [] if user.role == "SUPER_ADMIN" else [Restaurant.owner_id == user.id]
    restaurant_ids = select(Restaurant.id).where(*restaurant_filter)
    return DashboardStats(
        restaurants=db.scalar(select(func.count(Restaurant.id)).where(*restaurant_filter)) or 0,
        owners=db.scalar(select(func.count(User.id)).where(User.role == "RESTAURANT_OWNER"))
        if user.role == "SUPER_ADMIN"
        else 1,
        reservations=db.scalar(
            select(func.count(ContactRequest.id)).where(
                ContactRequest.restaurant_id.in_(restaurant_ids)
            )
        )
        or 0,
        conversations=db.scalar(
            select(func.count(Conversation.id)).where(
                Conversation.restaurant_id.in_(restaurant_ids),
                Conversation.is_test.is_(False),
            )
        )
        or 0,
        unanswered=db.scalar(
            select(func.count(Message.id))
            .join(Conversation)
            .where(
                Conversation.restaurant_id.in_(restaurant_ids),
                Conversation.is_test.is_(False),
                Message.is_unanswered.is_(True),
                Message.is_reviewed.is_(False),
            )
        )
        or 0,
        new_orders=db.scalar(
            select(func.count(Order.id)).where(
                Order.restaurant_id.in_(restaurant_ids),
                Order.status == "NEW",
            )
        )
        or 0,
    )


def list_users(db: Session) -> list[User]:
    return list(db.scalars(select(User).order_by(User.created_at.desc())))


def create_user(db: Session, user_data: dict[str, object]) -> User:
    if db.scalar(select(User).where(User.email == user_data["email"])):
        raise HTTPException(status_code=409, detail="Email already exists")
    if user_data["role"] not in VALID_ADMIN_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")
    user = User(
        email=user_data["email"],
        name=user_data["name"],
        role=user_data["role"],
        password_hash=hash_password(user_data["password"]),
    )
    db.add(user)
    return user


def list_themes(db: Session) -> list[Theme]:
    return list(db.scalars(select(Theme).order_by(Theme.id)))
