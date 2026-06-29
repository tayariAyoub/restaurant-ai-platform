from sqlalchemy.orm import Session

from app.api.public import chat_for_restaurant
from app.models import Restaurant
from app.schemas import ChatRequest, ChatResponse


def run_test_chat(
    db: Session, restaurant: Restaurant, payload: ChatRequest
) -> ChatResponse:
    return chat_for_restaurant(restaurant, payload, db, is_test=True)
