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
    OrderStatus,
    Restaurant,
    RestaurantImage,
    Theme,
    User,
)
from app.schemas import (
    CategoryCreate,
    CategoryOut,
    CategoryUpdate,
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
    RestaurantCreate,
    RestaurantOut,
    RestaurantOverview,
    RestaurantSummary,
    SetupChecklist,
    RestaurantUpdate,
    ThemeOut,
    UserCreate,
    UserOut,
)
from app.services.knowledge import (
    chunk_text,
    create_embeddings,
    extract_upload_text,
    rebuild_structured_knowledge,
)
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


def normalize_slug(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or f"restaurant-{uuid.uuid4().hex[:8]}"


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
            Conversation.restaurant_id == restaurant.id
        )
    ) or 0
    unanswered_count = db.scalar(
        select(func.count(Message.id))
        .join(Conversation)
        .where(
            Conversation.restaurant_id == restaurant.id,
            Message.is_unanswered.is_(True),
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
            select(func.count(Conversation.id)).where(Conversation.restaurant_id.in_(restaurant_ids))
        )
        or 0,
        unanswered=db.scalar(
            select(func.count(Message.id))
            .join(Conversation)
            .where(
                Conversation.restaurant_id.in_(restaurant_ids),
                Message.is_unanswered.is_(True),
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
    category = MenuCategory(restaurant_id=restaurant_id, **payload.model_dump())
    db.add(category)
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
    category = db.get(MenuCategory, category_id)
    if not category or category.restaurant_id != restaurant_id:
        raise HTTPException(status_code=404, detail="Category not found")
    for key, value in payload.model_dump().items():
        setattr(category, key, value)
    db.commit()
    db.refresh(category)
    rebuild_structured_knowledge(db, restaurant_id)
    return category


@router.delete("/restaurants/{restaurant_id}/categories/{category_id}", status_code=204)
def delete_category(
    restaurant_id: int,
    category_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    get_restaurant_for_user(db, restaurant_id, user)
    category = db.get(MenuCategory, category_id)
    if not category or category.restaurant_id != restaurant_id:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(category)
    db.commit()
    rebuild_structured_knowledge(db, restaurant_id)


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
    category = db.get(MenuCategory, payload.category_id)
    if not category or category.restaurant_id != restaurant_id:
        raise HTTPException(status_code=404, detail="Category not found")
    item = MenuItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    rebuild_structured_knowledge(db, restaurant_id)
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
    item = db.get(MenuItem, item_id)
    category = db.get(MenuCategory, payload.category_id)
    if not item or not category or category.restaurant_id != restaurant_id:
        raise HTTPException(status_code=404, detail="Menu item not found")
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    rebuild_structured_knowledge(db, restaurant_id)
    return item


@router.delete("/restaurants/{restaurant_id}/menu-items/{item_id}", status_code=204)
def delete_menu_item(
    restaurant_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    get_restaurant_for_user(db, restaurant_id, user)
    item = db.scalar(
        select(MenuItem)
        .join(MenuCategory)
        .where(MenuItem.id == item_id, MenuCategory.restaurant_id == restaurant_id)
    )
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    db.delete(item)
    db.commit()
    rebuild_structured_knowledge(db, restaurant_id)


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
                source=safe_name,
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


@router.get("/restaurants/{restaurant_id}/conversations", response_model=list[ConversationOut])
def conversations(
    restaurant_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Conversation]:
    get_restaurant_for_user(db, restaurant_id, user)
    return list(
        db.scalars(
            select(Conversation)
            .where(Conversation.restaurant_id == restaurant_id)
            .options(selectinload(Conversation.messages))
            .order_by(Conversation.updated_at.desc())
        )
    )


@router.get("/restaurants/{restaurant_id}/reservations", response_model=list[ContactOut])
def reservations(
    restaurant_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[ContactRequest]:
    get_restaurant_for_user(db, restaurant_id, user)
    return list(
        db.scalars(
            select(ContactRequest)
            .where(ContactRequest.restaurant_id == restaurant_id)
            .order_by(ContactRequest.created_at.desc())
        )
    )


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
    reservation = db.get(ContactRequest, reservation_id)
    if not reservation or reservation.restaurant_id != restaurant_id:
        raise HTTPException(status_code=404, detail="Reservation not found")
    reservation.status = payload.status
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


ALLOWED_ORDER_TRANSITIONS = {
    "NEW": {"ACCEPTED", "REJECTED"},
    "ACCEPTED": {"PREPARING", "REJECTED"},
    "PREPARING": {"READY", "REJECTED"},
    "READY": {"PICKED_UP", "DELIVERING", "COMPLETED"},
    "DELIVERING": {"DELIVERED"},
    "PICKED_UP": {"COMPLETED"},
    "DELIVERED": {"COMPLETED"},
    "REJECTED": set(),
    "COMPLETED": set(),
}


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
    next_status = payload.status.upper()
    if next_status != order.status and next_status not in ALLOWED_ORDER_TRANSITIONS.get(
        order.status, set()
    ):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot move order from {order.status} to {next_status}",
        )
    changed = next_status != order.status
    order.status = next_status
    if payload.estimated_minutes is not None:
        order.estimated_minutes = payload.estimated_minutes
    if next_status == "REJECTED":
        order.rejection_reason = payload.rejection_reason
    if changed:
        db.add(
            OrderStatus(
                order_id=order.id,
                status=next_status,
                note=payload.rejection_reason if next_status == "REJECTED" else "",
            )
        )
    if order.delivery_assignment:
        if next_status == "DELIVERING":
            order.delivery_assignment.status = "ON_THE_WAY"
        elif next_status in {"DELIVERED", "COMPLETED"}:
            order.delivery_assignment.status = "DELIVERED"
    db.commit()
    return db.scalar(order_query().where(Order.id == order.id))


@router.get("/restaurants/{restaurant_id}/drivers", response_model=list[DriverOut])
def drivers(
    restaurant_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[DeliveryDriver]:
    get_restaurant_for_user(db, restaurant_id, user)
    return list(
        db.scalars(
            select(DeliveryDriver)
            .where(DeliveryDriver.restaurant_id == restaurant_id)
            .order_by(DeliveryDriver.name)
        )
    )


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
    driver = DeliveryDriver(restaurant_id=restaurant_id, **payload.model_dump())
    db.add(driver)
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
    driver = db.get(DeliveryDriver, driver_id)
    if not driver or driver.restaurant_id != restaurant_id:
        raise HTTPException(status_code=404, detail="Driver not found")
    active_assignment = db.scalar(
        select(DeliveryAssignment).where(
            DeliveryAssignment.driver_id == driver_id,
            DeliveryAssignment.status != "DELIVERED",
        )
    )
    if active_assignment:
        raise HTTPException(status_code=409, detail="Driver has an active delivery")
    db.delete(driver)
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
    order = db.get(Order, order_id)
    driver = db.get(DeliveryDriver, payload.driver_id)
    if not order or order.restaurant_id != restaurant_id or order.order_type != "DELIVERY":
        raise HTTPException(status_code=404, detail="Delivery order not found")
    if not driver or driver.restaurant_id != restaurant_id or not driver.is_active:
        raise HTTPException(status_code=404, detail="Driver not found")
    assignment = order.delivery_assignment
    if assignment:
        assignment.driver_id = driver.id
        assignment.status = "ASSIGNED"
    else:
        db.add(DeliveryAssignment(order_id=order.id, driver_id=driver.id))
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
    order = db.scalar(order_query().where(Order.id == order_id))
    if not order or order.restaurant_id != restaurant_id or not order.delivery_assignment:
        raise HTTPException(status_code=404, detail="Delivery assignment not found")
    status = payload.status.upper()
    if status not in {"ASSIGNED", "ON_THE_WAY", "DELIVERED"}:
        raise HTTPException(status_code=400, detail="Invalid delivery status")
    order.delivery_assignment.status = status
    if status == "ON_THE_WAY":
        order.status = "DELIVERING"
    elif status == "DELIVERED":
        order.status = "DELIVERED"
    db.add(OrderStatus(order_id=order.id, status=order.status, note=f"Driver status: {status}"))
    db.commit()
    return db.scalar(order_query().where(Order.id == order.id))
