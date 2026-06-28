import json

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models import MenuCategory, MenuItem, Restaurant, RestaurantFaq, RestaurantImage, Theme, User
from app.services.knowledge import rebuild_structured_knowledge

THEMES = [
    {
        "key": "elegant",
        "name": "Michelin Fine Dining",
        "description": "Black, gold, editorial typography, cinematic hero treatment, and luxury spacing.",
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
        "key": "ultraviolet-luxury",
        "name": "Ultraviolet Luxury",
        "description": "Dark cinematic fine dining, immersive storytelling, dramatic gallery treatment, and emotional luxury pacing.",
        "primary_color": "#b78cff",
        "secondary_color": "#20d6d2",
        "background_color": "#05030b",
        "text_color": "#f7f2ff",
        "font_family": "Cormorant Garamond",
        "button_style": "pill",
        "homepage_style": "immersive",
        "menu_style": "refined",
        "gallery_style": "masonry",
    },
    {
        "key": "cafe",
        "name": "Modern Café",
        "description": "Warm neutral tones, friendly cards, and polished all-day hospitality.",
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
        "key": "italian-warm",
        "name": "Italian Warm",
        "description": "Terracotta, olive, generous storytelling, and a menu built around fire and family.",
        "primary_color": "#c84b31",
        "secondary_color": "#6b7048",
        "background_color": "#f7f3ea",
        "text_color": "#1b1b18",
        "font_family": "Cormorant Garamond",
        "button_style": "pill",
        "homepage_style": "story",
        "menu_style": "cards",
        "gallery_style": "grid",
    },
    {
        "key": "japanese",
        "name": "Sushi Minimal",
        "description": "Monochrome, precise spacing, quiet detail, and calm premium typography.",
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
        "key": "steakhouse-dark",
        "name": "Steakhouse Dark",
        "description": "Dark premium dining, flame-led visuals, cellar tones, and refined steakhouse service.",
        "primary_color": "#b86b35",
        "secondary_color": "#8a1f1d",
        "background_color": "#120d0a",
        "text_color": "#f7efe5",
        "font_family": "Cormorant Garamond",
        "button_style": "bold",
        "homepage_style": "nocturne",
        "menu_style": "refined",
        "gallery_style": "masonry",
    },
    {
        "key": "vegan-natural",
        "name": "Vegan Natural",
        "description": "Natural greens, seasonal produce, ingredient clarity, and gentle premium warmth.",
        "primary_color": "#496b3a",
        "secondary_color": "#b98f4b",
        "background_color": "#f3f0e4",
        "text_color": "#1f2a1b",
        "font_family": "Inter",
        "button_style": "soft",
        "homepage_style": "seasonal",
        "menu_style": "cards",
        "gallery_style": "masonry",
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
        theme = db.scalar(select(Theme).where(Theme.key == data["key"]))
        if not theme:
            db.add(Theme(**data))
        else:
            for field, value in data.items():
                setattr(theme, field, value)
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
            ai_name="Bella AI Maitre d'",
            ai_welcome_message=(
                "Good evening. Tell me your mood, allergies, timing, or occasion, "
                "and I will guide you through Bella Napoli's menu."
            ),
            ai_tone="Warm Italian hospitality, concise, confident, and careful with allergy advice.",
            ai_allowed_topics="Menu recommendations, prices, allergens, opening hours, ordering, pickup, delivery, reservations, address, and restaurant story.",
            ai_fallback_message="I do not have that detail yet. Please contact Bella Napoli directly.",
            ai_escalation_message="For urgent reservations, allergy safety, or special requests, please call Bella Napoli directly.",
            ai_language="English",
            ai_safety_instructions="Do not invent prices, allergens, opening hours, discounts, or reservation availability.",
        )
        db.add(restaurant)
        db.flush()
    else:
        restaurant.owner_id = owner.id
        restaurant.theme_id = restaurant.theme_id or (theme.id if theme else None)
        restaurant.slug = "bella-napoli" if restaurant.slug.startswith("restaurant-") else restaurant.slug
        restaurant.story = restaurant.story or "Wood-fired food, Italian warmth, and a table for everyone."
        restaurant.ai_name = restaurant.ai_name or "Bella AI Maitre d'"
        restaurant.ai_welcome_message = restaurant.ai_welcome_message or (
            "Good evening. Tell me your mood, allergies, timing, or occasion, "
            "and I will guide you through Bella Napoli's menu."
        )
        restaurant.ai_tone = restaurant.ai_tone or "Warm Italian hospitality, concise, confident, and careful with allergy advice."
        restaurant.ai_allowed_topics = restaurant.ai_allowed_topics or "Menu recommendations, prices, allergens, opening hours, ordering, pickup, delivery, reservations, address, and restaurant story."
        restaurant.ai_fallback_message = restaurant.ai_fallback_message or "I do not have that detail yet. Please contact Bella Napoli directly."
        restaurant.ai_escalation_message = restaurant.ai_escalation_message or "For urgent reservations, allergy safety, or special requests, please call Bella Napoli directly."
        restaurant.ai_language = restaurant.ai_language or "English"
        restaurant.ai_safety_instructions = restaurant.ai_safety_instructions or "Do not invent prices, allergens, opening hours, discounts, or reservation availability."
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

    created_faqs = False
    if not db.scalar(select(RestaurantFaq).where(RestaurantFaq.restaurant_id == restaurant.id)):
        db.add_all(
            [
                RestaurantFaq(
                    restaurant_id=restaurant.id,
                    question="Can I reserve a table?",
                    answer="Yes. Guests can send a reservation request through the website or call the restaurant directly for urgent table requests.",
                    sort_order=0,
                ),
                RestaurantFaq(
                    restaurant_id=restaurant.id,
                    question="What should guests do about allergies?",
                    answer="Guests should tell the restaurant about allergies before ordering and confirm final allergen safety with staff.",
                    sort_order=1,
                ),
            ]
        )
        created_faqs = True

    db.commit()

    from app.models import KnowledgeChunk

    if created_faqs or not db.scalar(select(KnowledgeChunk).where(KnowledgeChunk.restaurant_id == restaurant.id)):
        rebuild_structured_knowledge(db, restaurant.id)
