import json

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models import MenuCategory, MenuItem, Restaurant, RestaurantImage, Theme, User
from app.services.knowledge import rebuild_structured_knowledge

THEMES = [
    {
        "key": "elegant",
        "name": "Elegant Fine Dining",
        "description": "Black, gold, editorial typography and luxury spacing.",
        "primary_color": "#c6a15b",
        "secondary_color": "#2c2925",
        "background_color": "#11110f",
        "text_color": "#f7f2e8",
        "font_family": "Cormorant Garamond",
        "button_style": "pill",
        "homepage_style": "editorial",
        "menu_style": "refined",
        "gallery_style": "masonry",
    },
    {
        "key": "cafe",
        "name": "Modern Café",
        "description": "Warm beige, cozy cards and friendly modern details.",
        "primary_color": "#8b5e3c",
        "secondary_color": "#d9c3a5",
        "background_color": "#f4ecdf",
        "text_color": "#30271f",
        "font_family": "Inter",
        "button_style": "soft",
        "homepage_style": "cards",
        "menu_style": "cards",
        "gallery_style": "grid",
    },
    {
        "key": "fast-food",
        "name": "Pizza & Fast Food",
        "description": "Energetic red-orange colors with bold menu calls to action.",
        "primary_color": "#e5482d",
        "secondary_color": "#ffb000",
        "background_color": "#fff7e8",
        "text_color": "#201914",
        "font_family": "Inter",
        "button_style": "bold",
        "homepage_style": "menu-first",
        "menu_style": "cards",
        "gallery_style": "wide",
    },
    {
        "key": "japanese",
        "name": "Minimal Japanese / Asian",
        "description": "Monochrome, precise spacing and calm premium typography.",
        "primary_color": "#111111",
        "secondary_color": "#c53d31",
        "background_color": "#fafafa",
        "text_color": "#171717",
        "font_family": "Inter",
        "button_style": "square",
        "homepage_style": "minimal",
        "menu_style": "minimal",
        "gallery_style": "filmstrip",
    },
    {
        "key": "mediterranean",
        "name": "Mediterranean Family",
        "description": "Olive, beige and terracotta for a generous family atmosphere.",
        "primary_color": "#c84b31",
        "secondary_color": "#6b7048",
        "background_color": "#f7f3ea",
        "text_color": "#1b1b18",
        "font_family": "Cormorant Garamond",
        "button_style": "pill",
        "homepage_style": "story",
        "menu_style": "list",
        "gallery_style": "grid",
    },
]


def seed_demo_data(db: Session) -> None:
    for data in THEMES:
        if not db.scalar(select(Theme).where(Theme.key == data["key"])):
            db.add(Theme(**data))
    db.flush()

    admin = db.scalar(select(User).where(User.email == settings.admin_email))
    if not admin:
        admin = User(
            email=settings.admin_email,
            name="RestaurantAI Admin",
            role="SUPER_ADMIN",
            password_hash=hash_password(settings.admin_password),
        )
        db.add(admin)
    else:
        admin.role = "SUPER_ADMIN"
        admin.name = admin.name or "RestaurantAI Admin"
        admin.is_active = True

    owner = db.scalar(select(User).where(User.email == settings.demo_owner_email))
    if not owner:
        owner = User(
            email=settings.demo_owner_email,
            name="Bella Napoli Owner",
            role="RESTAURANT_OWNER",
            password_hash=hash_password(settings.demo_owner_password),
        )
        db.add(owner)
    db.flush()

    restaurant = db.scalar(select(Restaurant).order_by(Restaurant.id).limit(1))
    theme = db.scalar(select(Theme).where(Theme.key == "mediterranean"))
    opening_hours = json.dumps(
        {
            "monday": "Closed",
            "tuesday": "17:00-22:30",
            "wednesday": "17:00-22:30",
            "thursday": "17:00-22:30",
            "friday": "12:00-23:00",
            "saturday": "12:00-23:00",
            "sunday": "12:00-22:00",
        }
    )
    if not restaurant:
        restaurant = Restaurant(
            owner_id=owner.id,
            theme_id=theme.id if theme else None,
            name="Bella Napoli",
            slug="bella-napoli",
            tagline="Wood-fired pizza, made with heart.",
            description=(
                "A warm neighborhood pizzeria serving slow-fermented dough, Italian classics, "
                "and seasonal ingredients in the heart of Berlin."
            ),
            story="Our dough rests for 48 hours. Our tomatoes come from San Marzano, and every guest is welcomed like family.",
            address="Sonnenallee 42",
            city="Berlin",
            postal_code="12045",
            phone="+49 30 555 0123",
            email="ciao@bellanapoli.demo",
            opening_hours=opening_hours,
            instagram_url="https://instagram.com/",
            hero_image=(
                "https://images.unsplash.com/photo-1579751626657-72bc17010498"
                "?auto=format&fit=crop&w=1800&q=85"
            ),
        )
        db.add(restaurant)
        db.flush()
    else:
        restaurant.owner_id = restaurant.owner_id or owner.id
        restaurant.theme_id = restaurant.theme_id or (theme.id if theme else None)
        restaurant.slug = "bella-napoli" if restaurant.slug.startswith("restaurant-") else restaurant.slug
        restaurant.story = restaurant.story or "Wood-fired food, Italian warmth, and a table for everyone."
        if not restaurant.opening_hours.strip().startswith("{"):
            restaurant.opening_hours = opening_hours

    if not db.scalar(
        select(MenuItem).join(MenuCategory).where(MenuCategory.restaurant_id == restaurant.id)
    ):
        pizza = MenuCategory(
            restaurant_id=restaurant.id,
            name="Wood-fired Pizza",
            description="48-hour fermented dough, baked hot in a wood-fired oven.",
            sort_order=1,
        )
        starters = MenuCategory(
            restaurant_id=restaurant.id,
            name="Antipasti",
            description="Small plates to share.",
            sort_order=0,
        )
        desserts = MenuCategory(
            restaurant_id=restaurant.id,
            name="Dolci",
            description="A sweet Italian finish.",
            sort_order=2,
        )
        db.add_all([pizza, starters, desserts])
        db.flush()
        db.add_all(
            [
                MenuItem(category_id=starters.id, name="Burrata Pugliese", description="Creamy burrata, cherry tomatoes, basil oil.", price=11.5, is_vegetarian=True, allergens="milk"),
                MenuItem(category_id=starters.id, name="Focaccia Rosmarino", description="House-baked focaccia, rosemary and olive oil.", price=6.5, is_vegan=True, is_vegetarian=True, allergens="gluten"),
                MenuItem(category_id=pizza.id, name="Margherita", description="San Marzano tomato, fior di latte and basil.", price=12.5, is_vegetarian=True, allergens="gluten, milk"),
                MenuItem(category_id=pizza.id, name="Diavola", description="Tomato, mozzarella, spicy beef salami and chili.", price=15.5, is_halal=True, allergens="gluten, milk"),
                MenuItem(category_id=pizza.id, name="Ortolana", description="Tomato, grilled vegetables and vegan mozzarella.", price=14.5, is_vegan=True, is_vegetarian=True, allergens="gluten"),
                MenuItem(category_id=desserts.id, name="Tiramisù", description="Espresso, mascarpone, cocoa and savoiardi.", price=7.5, is_vegetarian=True, allergens="gluten, egg, milk"),
            ]
        )

    if not db.scalar(select(RestaurantImage).where(RestaurantImage.restaurant_id == restaurant.id)):
        images = [
            "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=85",
            "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=1200&q=85",
            "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1200&q=85",
        ]
        db.add_all(
            [
                RestaurantImage(restaurant_id=restaurant.id, image_type="gallery", url=url, sort_order=index)
                for index, url in enumerate(images)
            ]
        )

    db.commit()

    from app.models import KnowledgeChunk

    if not db.scalar(select(KnowledgeChunk).where(KnowledgeChunk.restaurant_id == restaurant.id)):
        rebuild_structured_knowledge(db, restaurant.id)
