from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(ORMModel):
    id: int
    email: EmailStr
    name: str
    role: str
    is_active: bool
    created_at: datetime


class UserCreate(BaseModel):
    email: EmailStr
    name: str = ""
    password: str = Field(min_length=8)
    role: str = "RESTAURANT_OWNER"


class ThemeOut(ORMModel):
    id: int
    key: str
    name: str
    description: str
    primary_color: str
    secondary_color: str
    background_color: str
    text_color: str
    font_family: str
    button_style: str
    homepage_style: str
    menu_style: str
    gallery_style: str


class MenuItemBase(BaseModel):
    name: str
    description: str = ""
    price: Decimal = Field(ge=0)
    image_url: str = ""
    is_available: bool = True
    is_vegan: bool = False
    is_vegetarian: bool = False
    is_halal: bool = False
    allergens: str = ""


class MenuItemCreate(MenuItemBase):
    category_id: int


class MenuItemUpdate(MenuItemBase):
    category_id: int


class MenuItemOut(MenuItemBase, ORMModel):
    id: int
    category_id: int


class CategoryBase(BaseModel):
    name: str
    description: str = ""
    sort_order: int = 0


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(CategoryBase):
    pass


class CategoryOut(CategoryBase, ORMModel):
    id: int
    items: list[MenuItemOut] = Field(default_factory=list)


class ImageOut(ORMModel):
    id: int
    restaurant_id: int
    image_type: str
    url: str
    alt_text: str
    sort_order: int
    created_at: datetime


class ImageUrlCreate(BaseModel):
    image_type: Literal["logo", "hero", "gallery", "food"] = "gallery"
    url: str = Field(min_length=1, max_length=1000)
    alt_text: str = ""
    sort_order: int | None = None


class RestaurantBase(BaseModel):
    name: str
    slug: str
    tagline: str = ""
    description: str = ""
    story: str = ""
    address: str = ""
    city: str = ""
    postal_code: str = ""
    phone: str = ""
    email: EmailStr
    google_maps_url: str = ""
    facebook_url: str = ""
    instagram_url: str = ""
    tiktok_url: str = ""
    opening_hours: str = "{}"
    logo_url: str = ""
    hero_image: str = ""
    loading_video_url: str = ""
    loading_video_filename: str = ""
    loading_video_size_bytes: int = 0
    reservation_url: str = ""
    primary_color: str = ""
    secondary_color: str = ""
    background_color: str = ""
    text_color: str = ""
    font_family: str = ""
    button_style: str = ""
    homepage_style: str = ""
    menu_style: str = ""
    gallery_style: str = ""
    reservations_enabled: bool = True
    ordering_enabled: bool = True
    delivery_enabled: bool = True
    pickup_enabled: bool = True
    dine_in_enabled: bool = True
    chatbot_enabled: bool = True
    ai_name: str = ""
    ai_welcome_message: str = ""
    ai_tone: str = ""
    ai_allowed_topics: str = ""
    ai_fallback_message: str = ""
    ai_escalation_message: str = ""
    ai_language: str = ""
    ai_safety_instructions: str = ""
    is_published: bool = True


class RestaurantCreate(RestaurantBase):
    owner_id: int | None = None
    theme_id: int | None = None


class RestaurantUpdate(RestaurantBase):
    owner_id: int | None = None
    theme_id: int | None = None


class RestaurantSummary(ORMModel):
    id: int
    owner_id: int | None
    theme_id: int | None
    name: str
    slug: str
    city: str
    email: str
    hero_image: str
    is_published: bool
    created_at: datetime


class PublicRestaurantSummary(ORMModel):
    id: int
    name: str
    slug: str
    city: str
    hero_image: str
    is_published: bool
    created_at: datetime


class SetupChecklist(BaseModel):
    information: bool
    opening_hours: bool
    branding: bool
    menu: bool
    design: bool
    chatbot: bool


class RestaurantOverview(RestaurantSummary):
    owner_name: str = ""
    owner_email: str = ""
    theme_name: str = ""
    menu_items: int = 0
    image_count: int = 0
    reservation_count: int = 0
    new_reservations: int = 0
    new_orders: int = 0
    conversation_count: int = 0
    unanswered_count: int = 0
    setup_percent: int = 0
    checklist: SetupChecklist


class RestaurantOut(RestaurantBase, ORMModel):
    id: int
    owner_id: int | None
    theme_id: int | None
    created_at: datetime
    owner: UserOut | None = None
    theme: ThemeOut | None = None
    categories: list[CategoryOut] = Field(default_factory=list)
    images: list[ImageOut] = Field(default_factory=list)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    conversation_id: str | None = None


class ChatResponse(BaseModel):
    answer: str
    conversation_id: str
    unanswered: bool = False
    sources: list[str] = Field(default_factory=list)


class RestaurantFaqBase(BaseModel):
    question: str = Field(min_length=1, max_length=500)
    answer: str = Field(min_length=1)
    is_active: bool = True
    sort_order: int = 0


class RestaurantFaqCreate(RestaurantFaqBase):
    pass


class RestaurantFaqUpdate(RestaurantFaqBase):
    pass


class RestaurantFaqFromMessageCreate(RestaurantFaqBase):
    pass


class RestaurantFaqOut(RestaurantFaqBase, ORMModel):
    id: int
    restaurant_id: int
    source_message_id: int | None
    created_at: datetime
    updated_at: datetime


class MessageReviewUpdate(BaseModel):
    is_reviewed: bool = True


class ContactCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str = ""
    party_size: int | None = Field(default=None, ge=1, le=100)
    requested_at: str = ""
    message: str = ""


class ContactOut(ContactCreate, ORMModel):
    id: int
    restaurant_id: int
    status: str
    created_at: datetime


class ReservationStatusUpdate(BaseModel):
    status: str


class MessageOut(ORMModel):
    id: int
    role: str
    content: str
    is_unanswered: bool
    is_reviewed: bool = False
    created_at: datetime


class ConversationOut(ORMModel):
    id: str
    restaurant_id: int
    visitor_name: str
    visitor_email: str
    is_test: bool = False
    created_at: datetime
    updated_at: datetime
    messages: list[MessageOut]


class DocumentOut(ORMModel):
    id: int
    restaurant_id: int
    filename: str
    content_type: str
    status: str
    created_at: datetime


class DashboardStats(BaseModel):
    restaurants: int
    owners: int
    reservations: int
    conversations: int
    unanswered: int
    new_orders: int = 0


class OrderItemCreate(BaseModel):
    menu_item_id: int
    quantity: int = Field(ge=1, le=50)
    notes: str = ""


class DeliveryAddressCreate(BaseModel):
    street: str
    postal_code: str
    city: str
    instructions: str = ""


class OrderCreate(BaseModel):
    order_type: str
    customer_name: str
    customer_phone: str
    customer_email: EmailStr | None = None
    notes: str = ""
    items: list[OrderItemCreate] = Field(min_length=1)
    delivery_address: DeliveryAddressCreate | None = None


class OrderItemOut(ORMModel):
    id: int
    menu_item_id: int | None
    item_name: str
    unit_price: Decimal
    quantity: int
    line_total: Decimal
    notes: str


class DeliveryAddressOut(ORMModel):
    id: int
    street: str
    postal_code: str
    city: str
    instructions: str
    latitude: Decimal | None
    longitude: Decimal | None
    approximate_distance_km: Decimal | None


class DriverOut(ORMModel):
    id: int
    restaurant_id: int
    name: str
    phone: str
    is_active: bool
    created_at: datetime


class DriverCreate(BaseModel):
    name: str
    phone: str


class DeliveryAssignmentOut(ORMModel):
    id: int
    driver_id: int
    status: str
    assigned_at: datetime
    updated_at: datetime
    driver: DriverOut


class OrderStatusOut(ORMModel):
    id: int
    status: str
    note: str
    created_at: datetime


class OrderOut(ORMModel):
    id: int
    public_id: str
    restaurant_id: int
    order_type: str
    status: str
    customer_name: str
    customer_phone: str
    customer_email: str
    notes: str
    subtotal: Decimal
    delivery_fee: Decimal
    total: Decimal
    estimated_minutes: int | None
    rejection_reason: str
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemOut]
    delivery_address: DeliveryAddressOut | None
    delivery_assignment: DeliveryAssignmentOut | None
    status_history: list[OrderStatusOut] = Field(default_factory=list)


class OrderStatusUpdate(BaseModel):
    status: str
    estimated_minutes: int | None = Field(default=None, ge=0, le=300)
    rejection_reason: str = ""


class DeliveryAssignmentCreate(BaseModel):
    driver_id: int


class DeliveryStatusUpdate(BaseModel):
    status: str
