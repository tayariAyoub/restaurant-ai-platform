from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import ContactRequest, Conversation, KnowledgeChunk, Message, Order, Restaurant
from app.schemas import RestaurantOverview, SetupChecklist


def build_restaurant_overview(db: Session, restaurant: Restaurant) -> RestaurantOverview:
    menu_items = sum(len(category.items) for category in restaurant.categories)
    information = all(
        [
            restaurant.name,
            restaurant.description,
            restaurant.phone,
            restaurant.email,
            restaurant.address,
            restaurant.city,
        ]
    )
    opening_hours = restaurant.opening_hours not in {"", "{}"}
    branding = bool(restaurant.logo_url and restaurant.hero_image and restaurant.images)
    menu = menu_items > 0
    design = bool(restaurant.theme_id or restaurant.primary_color)
    chatbot = bool(
        db.scalar(
            select(func.count(KnowledgeChunk.id)).where(
                KnowledgeChunk.restaurant_id == restaurant.id
            )
        )
    )
    checklist = SetupChecklist(
        information=information,
        opening_hours=opening_hours,
        branding=branding,
        menu=menu,
        design=design,
        chatbot=chatbot,
    )
    completed = sum(checklist.model_dump().values())
    reservation_count = db.scalar(
        select(func.count(ContactRequest.id)).where(
            ContactRequest.restaurant_id == restaurant.id
        )
    ) or 0
    new_reservations = db.scalar(
        select(func.count(ContactRequest.id)).where(
            ContactRequest.restaurant_id == restaurant.id,
            ContactRequest.status == "new",
        )
    ) or 0
    conversation_count = db.scalar(
        select(func.count(Conversation.id)).where(
            Conversation.restaurant_id == restaurant.id,
            Conversation.is_test.is_(False),
        )
    ) or 0
    unanswered_count = db.scalar(
        select(func.count(Message.id))
        .join(Conversation)
        .where(
            Conversation.restaurant_id == restaurant.id,
            Conversation.is_test.is_(False),
            Message.is_unanswered.is_(True),
            Message.is_reviewed.is_(False),
        )
    ) or 0
    return RestaurantOverview(
        id=restaurant.id,
        owner_id=restaurant.owner_id,
        theme_id=restaurant.theme_id,
        name=restaurant.name,
        slug=restaurant.slug,
        city=restaurant.city,
        email=restaurant.email,
        hero_image=restaurant.hero_image,
        is_published=restaurant.is_published,
        created_at=restaurant.created_at,
        owner_name=restaurant.owner.name if restaurant.owner else "",
        owner_email=restaurant.owner.email if restaurant.owner else "",
        theme_name=restaurant.theme.name if restaurant.theme else "",
        menu_items=menu_items,
        image_count=len(restaurant.images),
        reservation_count=reservation_count,
        new_reservations=new_reservations,
        new_orders=db.scalar(
            select(func.count(Order.id)).where(
                Order.restaurant_id == restaurant.id,
                Order.status == "NEW",
            )
        )
        or 0,
        conversation_count=conversation_count,
        unanswered_count=unanswered_count,
        setup_percent=round(completed / 6 * 100),
        checklist=checklist,
    )
