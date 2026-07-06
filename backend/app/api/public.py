from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from decimal import Decimal

from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.rate_limit import (
    chat_rule,
    orders_rule,
    public_rule,
    rate_limit,
    reservations_rule,
)
from app.models import (
    ContactRequest,
    Conversation,
    DeliveryAddress,
    MenuCategory,
    MenuItem,
    Message,
    Order,
    OrderItem,
    OrderStatus,
    Restaurant,
)
from app.schemas import (
    ChatRequest,
    ChatResponse,
    ContactCreate,
    ContactOut,
    OrderCreate,
    OrderOut,
    PublicRestaurantSummary,
    RestaurantOut,
)
from app.services.chat import answer_question
from app.services.maps import distance_km, geocode

router = APIRouter(tags=["public"])

PUBLIC_ORDER_TYPES = {"PICKUP", "EAT_IN", "DINE_IN", "DELIVERY"}
DINE_IN_ORDER_TYPES = {"EAT_IN", "DINE_IN"}


def public_restaurant_query():
    return select(Restaurant).options(
        selectinload(Restaurant.owner),
        selectinload(Restaurant.theme),
        selectinload(Restaurant.images),
        selectinload(Restaurant.categories).selectinload(MenuCategory.items),
    )


def get_public_restaurant(db: Session, slug: str | None = None) -> Restaurant:
    statement = public_restaurant_query().where(Restaurant.is_published.is_(True))
    if slug:
        statement = statement.where(Restaurant.slug == slug)
    else:
        statement = statement.order_by(Restaurant.id).limit(1)
    restaurant = db.scalar(statement)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    restaurant.categories.sort(key=lambda category: category.sort_order)
    restaurant.images.sort(key=lambda image: image.sort_order)
    return restaurant


def ensure_reservations_enabled(restaurant: Restaurant) -> None:
    if not restaurant.reservations_enabled:
        raise HTTPException(
            status_code=400,
            detail="Reservations are disabled for this restaurant",
        )


def normalize_public_order_type(order_type: str) -> str:
    normalized = order_type.strip().upper()
    return "EAT_IN" if normalized == "DINE_IN" else normalized


def ensure_ordering_enabled(restaurant: Restaurant, order_type: str) -> None:
    if not restaurant.ordering_enabled:
        raise HTTPException(
            status_code=400,
            detail="Online ordering is disabled for this restaurant",
        )
    if order_type == "PICKUP" and not restaurant.pickup_enabled:
        raise HTTPException(
            status_code=400,
            detail="Pickup ordering is disabled for this restaurant",
        )
    if order_type in DINE_IN_ORDER_TYPES and not restaurant.dine_in_enabled:
        raise HTTPException(
            status_code=400,
            detail="Dine-in ordering is disabled for this restaurant",
        )
    if order_type == "DELIVERY" and not restaurant.delivery_enabled:
        raise HTTPException(
            status_code=400,
            detail="Delivery ordering is disabled for this restaurant",
        )


@router.get(
    "/restaurant",
    response_model=RestaurantOut,
    response_model_exclude={"owner", "owner_id"},
    dependencies=[rate_limit(public_rule)],
)
def legacy_restaurant(db: Session = Depends(get_db)) -> Restaurant:
    return get_public_restaurant(db)


@router.get(
    "/restaurants",
    response_model=list[PublicRestaurantSummary],
    dependencies=[rate_limit(public_rule)],
)
def public_restaurants(db: Session = Depends(get_db)) -> list[Restaurant]:
    return list(
        db.scalars(
            select(Restaurant)
            .where(Restaurant.is_published.is_(True))
            .order_by(Restaurant.created_at.desc())
        )
    )


@router.get(
    "/restaurants/{slug}",
    response_model=RestaurantOut,
    response_model_exclude={"owner", "owner_id"},
    dependencies=[rate_limit(public_rule)],
)
def restaurant_details(slug: str, db: Session = Depends(get_db)) -> Restaurant:
    return get_public_restaurant(db, slug)


@router.post(
    "/restaurants/{slug}/reservations",
    response_model=ContactOut,
    status_code=201,
    dependencies=[rate_limit(reservations_rule)],
)
def create_reservation(
    slug: str, payload: ContactCreate, db: Session = Depends(get_db)
) -> ContactRequest:
    restaurant = get_public_restaurant(db, slug)
    ensure_reservations_enabled(restaurant)
    request = ContactRequest(restaurant_id=restaurant.id, **payload.model_dump())
    db.add(request)
    db.commit()
    db.refresh(request)
    return request


@router.post(
    "/contact",
    response_model=ContactOut,
    status_code=201,
    dependencies=[rate_limit(reservations_rule)],
)
def legacy_contact(payload: ContactCreate, db: Session = Depends(get_db)) -> ContactRequest:
    restaurant = get_public_restaurant(db)
    ensure_reservations_enabled(restaurant)
    request = ContactRequest(restaurant_id=restaurant.id, **payload.model_dump())
    db.add(request)
    db.commit()
    db.refresh(request)
    return request


def chat_for_restaurant(
    restaurant: Restaurant, payload: ChatRequest, db: Session, is_test: bool = False
) -> ChatResponse:
    conversation = (
        db.get(Conversation, payload.conversation_id) if payload.conversation_id else None
    )
    if not conversation or conversation.restaurant_id != restaurant.id or conversation.is_test != is_test:
        conversation = Conversation(restaurant_id=restaurant.id, is_test=is_test)
        db.add(conversation)
        db.flush()
    db.add(Message(conversation_id=conversation.id, role="user", content=payload.message))
    result = answer_question(
        db,
        restaurant.id,
        payload.message,
        include_setup_details=is_test,
    )
    db.add(
        Message(
            conversation_id=conversation.id,
            role="assistant",
            content=result.answer,
            is_unanswered=result.unanswered,
        )
    )
    db.commit()
    return ChatResponse(
        answer=result.answer,
        conversation_id=conversation.id,
        unanswered=result.unanswered,
        sources=result.sources,
    )


@router.post(
    "/restaurants/{slug}/chat",
    response_model=ChatResponse,
    dependencies=[rate_limit(chat_rule)],
)
def restaurant_chat(
    slug: str, payload: ChatRequest, db: Session = Depends(get_db)
) -> ChatResponse:
    return chat_for_restaurant(get_public_restaurant(db, slug), payload, db)


@router.post("/chat", response_model=ChatResponse, dependencies=[rate_limit(chat_rule)])
def legacy_chat(payload: ChatRequest, db: Session = Depends(get_db)) -> ChatResponse:
    return chat_for_restaurant(get_public_restaurant(db), payload, db)


@router.post(
    "/restaurants/{slug}/orders",
    response_model=OrderOut,
    status_code=201,
    dependencies=[rate_limit(orders_rule)],
)
def create_order(
    slug: str, payload: OrderCreate, db: Session = Depends(get_db)
) -> Order:
    restaurant = get_public_restaurant(db, slug)
    requested_order_type = payload.order_type.strip().upper()
    if requested_order_type not in PUBLIC_ORDER_TYPES:
        raise HTTPException(status_code=400, detail="Invalid order type")
    order_type = normalize_public_order_type(requested_order_type)
    ensure_ordering_enabled(restaurant, order_type)
    if order_type == "DELIVERY" and not payload.delivery_address:
        raise HTTPException(status_code=400, detail="Delivery address is required")

    ids = [item.menu_item_id for item in payload.items]
    menu_items = list(
        db.scalars(
            select(MenuItem)
            .join(MenuCategory)
            .where(
                MenuItem.id.in_(ids),
                MenuCategory.restaurant_id == restaurant.id,
                MenuItem.is_available.is_(True),
            )
        )
    )
    menu_by_id = {item.id: item for item in menu_items}
    if len(menu_by_id) != len(set(ids)):
        raise HTTPException(status_code=400, detail="One or more items are unavailable")

    subtotal = sum(
        Decimal(menu_by_id[item.menu_item_id].price) * item.quantity for item in payload.items
    )
    delivery_fee = Decimal("3.50") if order_type == "DELIVERY" else Decimal("0")
    order = Order(
        restaurant_id=restaurant.id,
        order_type=order_type,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        customer_email=str(payload.customer_email or ""),
        notes=payload.notes,
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        total=subtotal + delivery_fee,
    )
    db.add(order)
    db.flush()
    db.add(OrderStatus(order_id=order.id, status="NEW", note="Order placed by customer"))
    for requested in payload.items:
        item = menu_by_id[requested.menu_item_id]
        unit_price = Decimal(item.price)
        db.add(
            OrderItem(
                order_id=order.id,
                menu_item_id=item.id,
                item_name=item.name,
                unit_price=unit_price,
                quantity=requested.quantity,
                line_total=unit_price * requested.quantity,
                notes=requested.notes,
            )
        )

    if payload.delivery_address:
        address = payload.delivery_address
        destination_text = f"{address.street}, {address.postal_code} {address.city}"
        origin_text = f"{restaurant.address}, {restaurant.postal_code} {restaurant.city}"
        destination = geocode(destination_text)
        origin = geocode(origin_text)
        db.add(
            DeliveryAddress(
                order_id=order.id,
                street=address.street,
                postal_code=address.postal_code,
                city=address.city,
                instructions=address.instructions,
                latitude=destination[0] if destination else None,
                longitude=destination[1] if destination else None,
                approximate_distance_km=distance_km(origin, destination)
                if origin and destination
                else None,
            )
        )
    db.commit()
    return db.scalar(
        select(Order)
        .where(Order.id == order.id)
        .options(
            selectinload(Order.items),
            selectinload(Order.delivery_address),
            selectinload(Order.delivery_assignment),
            selectinload(Order.status_history),
        )
    )


@router.get(
    "/restaurants/{slug}/orders/{public_id}",
    response_model=OrderOut,
    dependencies=[rate_limit(public_rule)],
)
def order_tracking(slug: str, public_id: str, db: Session = Depends(get_db)) -> Order:
    restaurant = get_public_restaurant(db, slug)
    order = db.scalar(
        select(Order)
        .where(Order.restaurant_id == restaurant.id, Order.public_id == public_id)
        .options(
            selectinload(Order.items),
            selectinload(Order.delivery_address),
            selectinload(Order.delivery_assignment),
            selectinload(Order.status_history),
        )
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
