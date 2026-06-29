import re
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.security import hash_password
from app.dependencies import get_current_user, require_super_admin
from app.models import (
    ContactRequest,
    Conversation,
    DeliveryAssignment,
    DeliveryDriver,
    KnowledgeChunk,
    KnowledgeDocument,
    MenuCategory,
    MenuItem,
    Message,
    Order,
    Restaurant,
    RestaurantFaq,
    RestaurantImage,
    Theme,
    User,
)
from app.schemas import (
    CategoryCreate,
    CategoryOut,
    CategoryUpdate,
    ChatRequest,
    ChatResponse,
    ContactOut,
    ConversationOut,
    DashboardStats,
    DeliveryAssignmentCreate,
    DeliveryStatusUpdate,
    DriverCreate,
    DriverOut,
    DocumentOut,
    ImageOut,
    ImageUrlCreate,
    MenuItemCreate,
    MenuItemOut,
    MenuItemUpdate,
    OrderOut,
    OrderStatusUpdate,
    ReservationStatusUpdate,
    MessageOut,
    MessageReviewUpdate,
    RestaurantCreate,
    RestaurantFaqCreate,
    RestaurantFaqFromMessageCreate,
    RestaurantFaqOut,
    RestaurantFaqUpdate,
    RestaurantOut,
    RestaurantOverview,
    RestaurantSummary,
    RestaurantUpdate,
    ThemeOut,
    UserCreate,
    UserOut,
)
from app.api.public import chat_for_restaurant
from app.services import delivery, guest_activity, menu
from app.services.analytics import build_restaurant_overview
from app.services.knowledge import (
    chunk_text,
    create_embeddings,
    extract_upload_text,
    rebuild_structured_knowledge,
)
from app.services.orders import update_order_status
from app.services.storage import get_storage_service, validate_document_upload

router = APIRouter(prefix="/admin", tags=["admin"])


def restaurant_query():
    return select(Restaurant).options(
        selectinload(Restaurant.owner),
        selectinload(Restaurant.theme),
        selectinload(Restaurant.images),
        selectinload(Restaurant.categories).selectinload(MenuCategory.items),
    )


def get_restaurant_for_user(db: Session, restaurant_id: int, user: User) -> Restaurant:
    restaurant = db.scalar(restaurant_query().where(Restaurant.id == restaurant_id))
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    if user.role != "SUPER_ADMIN" and restaurant.owner_id != user.id:
        raise HTTPException(status_code=403, detail="You cannot access this restaurant")
    restaurant.categories.sort(key=lambda category: category.sort_order)
    restaurant.images.sort(key=lambda image: image.sort_order)
    return restaurant


def display_upload_filename(filename: str | None, fallback: str) -> str:
    safe_name = (filename or fallback).replace("\\", "/").split("/")[-1].strip()
    return safe_name[:255] or fallback


def normalize_slug(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or f"restaurant-{uuid.uuid4().hex[:8]}"


@router.get("/dashboard", response_model=DashboardStats)
def dashboard(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> DashboardStats:
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


@router.get("/users", response_model=list[UserOut])
def users(
    db: Session = Depends(get_db), _: User = Depends(require_super_admin)
) -> list[User]:
    return list(db.scalars(select(User).order_by(User.created_at.desc())))


@router.post("/users", response_model=UserOut, status_code=201)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
) -> User:
    if db.scalar(select(User).where(User.email == payload.email)):
        raise HTTPException(status_code=409, detail="Email already exists")
    if payload.role not in {"SUPER_ADMIN", "RESTAURANT_OWNER"}:
        raise HTTPException(status_code=400, detail="Invalid role")
    user = User(
        email=payload.email,
        name=payload.name,
        role=payload.role,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/themes", response_model=list[ThemeOut])
def themes(
    db: Session = Depends(get_db), _: User = Depends(get_current_user)
) -> list[Theme]:
    return list(db.scalars(select(Theme).order_by(Theme.id)))


@router.get("/restaurants", response_model=list[RestaurantSummary])
def restaurants(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> list[Restaurant]:
    statement = select(Restaurant).order_by(Restaurant.created_at.desc())
    if user.role != "SUPER_ADMIN":
        statement = statement.where(Restaurant.owner_id == user.id)
    return list(db.scalars(statement))


@router.get("/restaurants-overview", response_model=list[RestaurantOverview])
def restaurants_overview(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> list[RestaurantOverview]:
    statement = restaurant_query().order_by(Restaurant.created_at.desc())
    if user.role != "SUPER_ADMIN":
        statement = statement.where(Restaurant.owner_id == user.id)
    return [
        build_restaurant_overview(db, restaurant)
        for restaurant in db.scalars(statement).unique()
    ]


@router.post("/restaurants", response_model=RestaurantOut, status_code=201)
def create_restaurant(
    payload: RestaurantCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Restaurant:
    slug = normalize_slug(payload.slug or payload.name)
    if db.scalar(select(Restaurant).where(Restaurant.slug == slug)):
        raise HTTPException(status_code=409, detail="Website slug already exists")
    data = payload.model_dump(exclude={"slug"})
    if user.role == "SUPER_ADMIN":
        if payload.owner_id and not db.get(User, payload.owner_id):
            raise HTTPException(status_code=404, detail="Owner not found")
    else:
        data["owner_id"] = user.id
    if data.get("owner_id") and not db.get(User, data["owner_id"]):
        raise HTTPException(status_code=404, detail="Owner not found")
    restaurant = Restaurant(**data, slug=slug)
    db.add(restaurant)
    db.commit()
    return get_restaurant_for_user(db, restaurant.id, user)


@router.get("/restaurants/{restaurant_id}", response_model=RestaurantOut)
def restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Restaurant:
    return get_restaurant_for_user(db, restaurant_id, user)


@router.put("/restaurants/{restaurant_id}", response_model=RestaurantOut)
def update_restaurant(
    restaurant_id: int,
    payload: RestaurantUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Restaurant:
    restaurant = get_restaurant_for_user(db, restaurant_id, user)
    data = payload.model_dump()
    if user.role != "SUPER_ADMIN":
        data["owner_id"] = restaurant.owner_id
    slug = normalize_slug(data["slug"])
    duplicate = db.scalar(
        select(Restaurant).where(Restaurant.slug == slug, Restaurant.id != restaurant_id)
    )
    if duplicate:
        raise HTTPException(status_code=409, detail="Website slug already exists")
    data["slug"] = slug
    for key, value in data.items():
        setattr(restaurant, key, value)
    db.commit()
    rebuild_structured_knowledge(db, restaurant.id)
    return get_restaurant_for_user(db, restaurant.id, user)


@router.delete("/restaurants/{restaurant_id}", status_code=204)
def delete_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
) -> None:
    restaurant = db.get(Restaurant, restaurant_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    db.delete(restaurant)
    db.commit()


@router.post(
    "/restaurants/{restaurant_id}/categories", response_model=CategoryOut, status_code=201
)
def add_category(
    restaurant_id: int,
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> MenuCategory:
    get_restaurant_for_user(db, restaurant_id, user)
    category = menu.create_category(db, restaurant_id, payload.model_dump())
    db.commit()
    db.refresh(category)
    return category


@router.put(
    "/restaurants/{restaurant_id}/categories/{category_id}", response_model=CategoryOut
)
def update_category(
    restaurant_id: int,
    category_id: int,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> MenuCategory:
    get_restaurant_for_user(db, restaurant_id, user)
    category = menu.update_category(db, restaurant_id, category_id, payload.model_dump())
    db.commit()
    db.refresh(category)
    menu.rebuild_menu_knowledge(db, restaurant_id)
    return category


@router.delete("/restaurants/{restaurant_id}/categories/{category_id}", status_code=204)
def delete_category(
    restaurant_id: int,
    category_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    get_restaurant_for_user(db, restaurant_id, user)
    menu.delete_category(db, restaurant_id, category_id)
    db.commit()
    menu.rebuild_menu_knowledge(db, restaurant_id)


@router.post(
    "/restaurants/{restaurant_id}/menu-items", response_model=MenuItemOut, status_code=201
)
def add_menu_item(
    restaurant_id: int,
    payload: MenuItemCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> MenuItem:
    get_restaurant_for_user(db, restaurant_id, user)
    item = menu.create_menu_item(db, restaurant_id, payload.model_dump())
    db.commit()
    db.refresh(item)
    menu.rebuild_menu_knowledge(db, restaurant_id)
    return item


@router.put(
    "/restaurants/{restaurant_id}/menu-items/{item_id}", response_model=MenuItemOut
)
def update_menu_item(
    restaurant_id: int,
    item_id: int,
    payload: MenuItemUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> MenuItem:
    get_restaurant_for_user(db, restaurant_id, user)
    item = menu.update_menu_item(db, restaurant_id, item_id, payload.model_dump())
    db.commit()
    db.refresh(item)
    menu.rebuild_menu_knowledge(db, restaurant_id)
    return item


@router.delete("/restaurants/{restaurant_id}/menu-items/{item_id}", status_code=204)
def delete_menu_item(
    restaurant_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    get_restaurant_for_user(db, restaurant_id, user)
    menu.delete_menu_item(db, restaurant_id, item_id)
    db.commit()
    menu.rebuild_menu_knowledge(db, restaurant_id)


@router.post("/restaurants/{restaurant_id}/images", response_model=ImageOut, status_code=201)
async def upload_image(
    restaurant_id: int,
    file: UploadFile = File(...),
    image_type: str = Form("gallery"),
    alt_text: str = Form(""),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RestaurantImage:
    restaurant = get_restaurant_for_user(db, restaurant_id, user)
    content = await file.read()
    stored = get_storage_service().save_image(
        restaurant_id,
        content,
        file.filename,
        file.content_type,
    )
    image = RestaurantImage(
        restaurant_id=restaurant_id,
        image_type=image_type,
        url=stored.url,
        alt_text=alt_text,
        sort_order=len(restaurant.images),
    )
    if image_type == "logo":
        restaurant.logo_url = stored.url
    elif image_type == "hero":
        restaurant.hero_image = stored.url
    db.add(image)
    db.commit()
    db.refresh(image)
    return image


@router.post("/restaurants/{restaurant_id}/image-url", response_model=ImageOut, status_code=201)
def add_image_url(
    restaurant_id: int,
    payload: ImageUrlCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RestaurantImage:
    restaurant = get_restaurant_for_user(db, restaurant_id, user)
    image = RestaurantImage(
        restaurant_id=restaurant_id,
        image_type=payload.image_type,
        url=payload.url.strip(),
        alt_text=payload.alt_text.strip(),
        sort_order=payload.sort_order if payload.sort_order is not None else len(restaurant.images),
    )
    if image.image_type == "logo":
        restaurant.logo_url = image.url
    elif image.image_type == "hero":
        restaurant.hero_image = image.url
    db.add(image)
    db.commit()
    db.refresh(image)
    return image


@router.post("/restaurants/{restaurant_id}/loading-video", response_model=RestaurantOut)
async def upload_loading_video(
    restaurant_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Restaurant:
    restaurant = get_restaurant_for_user(db, restaurant_id, user)
    content = await file.read()
    storage = get_storage_service()
    stored = storage.save_video(restaurant_id, content, file.filename, file.content_type)
    previous_url = restaurant.loading_video_url
    restaurant.loading_video_url = stored.url
    restaurant.loading_video_filename = display_upload_filename(file.filename, stored.filename)
    restaurant.loading_video_size_bytes = len(content)
    db.commit()
    db.refresh(restaurant)
    if previous_url and previous_url != stored.url:
        storage.delete_url(previous_url)
    return restaurant


@router.delete("/restaurants/{restaurant_id}/loading-video", response_model=RestaurantOut)
def delete_loading_video(
    restaurant_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Restaurant:
    restaurant = get_restaurant_for_user(db, restaurant_id, user)
    previous_url = restaurant.loading_video_url
    restaurant.loading_video_url = ""
    restaurant.loading_video_filename = ""
    restaurant.loading_video_size_bytes = 0
    db.commit()
    db.refresh(restaurant)
    if previous_url:
        get_storage_service().delete_url(previous_url)
    return restaurant


@router.delete("/restaurants/{restaurant_id}/images/{image_id}", status_code=204)
def delete_image(
    restaurant_id: int,
    image_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    restaurant = get_restaurant_for_user(db, restaurant_id, user)
    image = db.get(RestaurantImage, image_id)
    if not image or image.restaurant_id != restaurant_id:
        raise HTTPException(status_code=404, detail="Image not found")
    if restaurant.logo_url == image.url:
        restaurant.logo_url = ""
    if restaurant.hero_image == image.url:
        restaurant.hero_image = ""
    get_storage_service().delete_url(image.url)
    db.delete(image)
    db.commit()


@router.post(
    "/restaurants/{restaurant_id}/documents", response_model=DocumentOut, status_code=201
)
async def upload_document(
    restaurant_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> KnowledgeDocument:
    get_restaurant_for_user(db, restaurant_id, user)
    content = await file.read()
    validate_document_upload(content, file.filename)
    try:
        chunks = chunk_text(extract_upload_text(file, content))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not chunks:
        raise HTTPException(status_code=400, detail="No readable text found")
    stored = get_storage_service().save_document(restaurant_id, content, file.filename)
    document = KnowledgeDocument(
        restaurant_id=restaurant_id,
        filename=stored.filename,
        content_type=file.content_type or "application/octet-stream",
    )
    db.add(document)
    db.flush()
    embeddings = create_embeddings(chunks)
    db.add_all(
        [
            KnowledgeChunk(
                document_id=document.id,
                restaurant_id=restaurant_id,
                source=stored.filename,
                content=chunk,
                embedding=embedding,
            )
            for chunk, embedding in zip(chunks, embeddings, strict=True)
        ]
    )
    db.commit()
    db.refresh(document)
    return document


@router.get("/restaurants/{restaurant_id}/documents", response_model=list[DocumentOut])
def documents(
    restaurant_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[KnowledgeDocument]:
    get_restaurant_for_user(db, restaurant_id, user)
    return list(
        db.scalars(
            select(KnowledgeDocument)
            .where(KnowledgeDocument.restaurant_id == restaurant_id)
            .order_by(KnowledgeDocument.created_at.desc())
        )
    )


@router.get("/restaurants/{restaurant_id}/faqs", response_model=list[RestaurantFaqOut])
def faqs(
    restaurant_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[RestaurantFaq]:
    get_restaurant_for_user(db, restaurant_id, user)
    return list(
        db.scalars(
            select(RestaurantFaq)
            .where(RestaurantFaq.restaurant_id == restaurant_id)
            .order_by(RestaurantFaq.sort_order, RestaurantFaq.created_at)
        )
    )


@router.post("/restaurants/{restaurant_id}/faqs", response_model=RestaurantFaqOut, status_code=201)
def create_faq(
    restaurant_id: int,
    payload: RestaurantFaqCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RestaurantFaq:
    get_restaurant_for_user(db, restaurant_id, user)
    faq = RestaurantFaq(restaurant_id=restaurant_id, **payload.model_dump())
    db.add(faq)
    db.commit()
    db.refresh(faq)
    rebuild_structured_knowledge(db, restaurant_id)
    return faq


@router.put("/restaurants/{restaurant_id}/faqs/{faq_id}", response_model=RestaurantFaqOut)
def update_faq(
    restaurant_id: int,
    faq_id: int,
    payload: RestaurantFaqUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RestaurantFaq:
    get_restaurant_for_user(db, restaurant_id, user)
    faq = db.get(RestaurantFaq, faq_id)
    if not faq or faq.restaurant_id != restaurant_id:
        raise HTTPException(status_code=404, detail="FAQ not found")
    for key, value in payload.model_dump().items():
        setattr(faq, key, value)
    db.commit()
    db.refresh(faq)
    rebuild_structured_knowledge(db, restaurant_id)
    return faq


@router.delete("/restaurants/{restaurant_id}/faqs/{faq_id}", status_code=204)
def delete_faq(
    restaurant_id: int,
    faq_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    get_restaurant_for_user(db, restaurant_id, user)
    faq = db.get(RestaurantFaq, faq_id)
    if not faq or faq.restaurant_id != restaurant_id:
        raise HTTPException(status_code=404, detail="FAQ not found")
    db.delete(faq)
    db.commit()
    rebuild_structured_knowledge(db, restaurant_id)


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


@router.patch(
    "/restaurants/{restaurant_id}/messages/{message_id}/review",
    response_model=MessageOut,
)
def review_unanswered_message(
    restaurant_id: int,
    message_id: int,
    payload: MessageReviewUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Message:
    get_restaurant_for_user(db, restaurant_id, user)
    message = get_public_unanswered_message(db, restaurant_id, message_id)
    message.is_reviewed = payload.is_reviewed
    db.commit()
    db.refresh(message)
    return message


@router.post(
    "/restaurants/{restaurant_id}/messages/{message_id}/faq",
    response_model=RestaurantFaqOut,
    status_code=201,
)
def convert_unanswered_message_to_faq(
    restaurant_id: int,
    message_id: int,
    payload: RestaurantFaqFromMessageCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RestaurantFaq:
    get_restaurant_for_user(db, restaurant_id, user)
    message = get_public_unanswered_message(db, restaurant_id, message_id)
    faq = RestaurantFaq(
        restaurant_id=restaurant_id,
        source_message_id=message.id,
        **payload.model_dump(),
    )
    message.is_reviewed = True
    db.add(faq)
    db.commit()
    db.refresh(faq)
    rebuild_structured_knowledge(db, restaurant_id)
    return faq


@router.post("/restaurants/{restaurant_id}/ai-test", response_model=ChatResponse)
def test_ai_response(
    restaurant_id: int,
    payload: ChatRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ChatResponse:
    restaurant = get_restaurant_for_user(db, restaurant_id, user)
    return chat_for_restaurant(restaurant, payload, db, is_test=True)


@router.get("/restaurants/{restaurant_id}/conversations", response_model=list[ConversationOut])
def conversations(
    restaurant_id: int,
    include_test: bool = False,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Conversation]:
    get_restaurant_for_user(db, restaurant_id, user)
    return guest_activity.list_conversations(db, restaurant_id, include_test=include_test)


@router.get("/restaurants/{restaurant_id}/reservations", response_model=list[ContactOut])
def reservations(
    restaurant_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[ContactRequest]:
    get_restaurant_for_user(db, restaurant_id, user)
    return guest_activity.list_reservations(db, restaurant_id)


@router.patch(
    "/restaurants/{restaurant_id}/reservations/{reservation_id}",
    response_model=ContactOut,
)
def update_reservation(
    restaurant_id: int,
    reservation_id: int,
    payload: ReservationStatusUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ContactRequest:
    get_restaurant_for_user(db, restaurant_id, user)
    reservation = guest_activity.update_reservation_status(
        db, restaurant_id, reservation_id, payload.status
    )
    db.commit()
    db.refresh(reservation)
    return reservation


def order_query():
    return select(Order).options(
        selectinload(Order.items),
        selectinload(Order.delivery_address),
        selectinload(Order.delivery_assignment).selectinload(DeliveryAssignment.driver),
        selectinload(Order.status_history),
    )


@router.get("/restaurants/{restaurant_id}/orders", response_model=list[OrderOut])
def orders(
    restaurant_id: int,
    status: str | None = None,
    order_type: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Order]:
    get_restaurant_for_user(db, restaurant_id, user)
    statement = order_query().where(Order.restaurant_id == restaurant_id)
    if status:
        statement = statement.where(Order.status == status.upper())
    if order_type:
        statement = statement.where(Order.order_type == order_type.upper())
    return list(db.scalars(statement.order_by(Order.created_at.desc())).unique())


@router.patch("/restaurants/{restaurant_id}/orders/{order_id}", response_model=OrderOut)
def update_order(
    restaurant_id: int,
    order_id: int,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Order:
    get_restaurant_for_user(db, restaurant_id, user)
    order = db.get(Order, order_id)
    if not order or order.restaurant_id != restaurant_id:
        raise HTTPException(status_code=404, detail="Order not found")
    update_order_status(
        db,
        order,
        payload.status,
        estimated_minutes=payload.estimated_minutes,
        rejection_reason=payload.rejection_reason,
    )
    db.commit()
    return db.scalar(order_query().where(Order.id == order.id))


@router.get("/restaurants/{restaurant_id}/drivers", response_model=list[DriverOut])
def drivers(
    restaurant_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[DeliveryDriver]:
    get_restaurant_for_user(db, restaurant_id, user)
    return delivery.list_drivers(db, restaurant_id)


@router.post(
    "/restaurants/{restaurant_id}/drivers", response_model=DriverOut, status_code=201
)
def create_driver(
    restaurant_id: int,
    payload: DriverCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DeliveryDriver:
    get_restaurant_for_user(db, restaurant_id, user)
    driver = delivery.create_driver(db, restaurant_id, payload.model_dump())
    db.commit()
    db.refresh(driver)
    return driver


@router.delete("/restaurants/{restaurant_id}/drivers/{driver_id}", status_code=204)
def delete_driver(
    restaurant_id: int,
    driver_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    get_restaurant_for_user(db, restaurant_id, user)
    delivery.delete_driver(db, restaurant_id, driver_id)
    db.commit()


@router.post(
    "/restaurants/{restaurant_id}/orders/{order_id}/assign-driver",
    response_model=OrderOut,
)
def assign_driver(
    restaurant_id: int,
    order_id: int,
    payload: DeliveryAssignmentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Order:
    get_restaurant_for_user(db, restaurant_id, user)
    order = delivery.assign_driver_to_order(db, restaurant_id, order_id, payload.driver_id)
    db.commit()
    return db.scalar(order_query().where(Order.id == order.id))


@router.patch(
    "/restaurants/{restaurant_id}/orders/{order_id}/delivery-status",
    response_model=OrderOut,
)
def update_delivery_status(
    restaurant_id: int,
    order_id: int,
    payload: DeliveryStatusUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Order:
    get_restaurant_for_user(db, restaurant_id, user)
    order = delivery.update_delivery_status(db, restaurant_id, order_id, payload.status)
    db.commit()
    return db.scalar(order_query().where(Order.id == order.id))
