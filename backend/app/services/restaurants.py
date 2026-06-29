import re
import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import MenuCategory, Restaurant, User
from app.services.knowledge import rebuild_structured_knowledge


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


def list_restaurants(db: Session, user: User) -> list[Restaurant]:
    statement = select(Restaurant).order_by(Restaurant.created_at.desc())
    if user.role != "SUPER_ADMIN":
        statement = statement.where(Restaurant.owner_id == user.id)
    return list(db.scalars(statement))


def create_restaurant(
    db: Session,
    restaurant_data: dict[str, object],
    user: User,
) -> Restaurant:
    slug = normalize_slug(str(restaurant_data.get("slug") or restaurant_data["name"]))
    if db.scalar(select(Restaurant).where(Restaurant.slug == slug)):
        raise HTTPException(status_code=409, detail="Website slug already exists")

    data = restaurant_data.copy()
    data.pop("slug", None)
    owner_id = data.get("owner_id")
    if user.role == "SUPER_ADMIN":
        if owner_id and not db.get(User, owner_id):
            raise HTTPException(status_code=404, detail="Owner not found")
    else:
        data["owner_id"] = user.id
    if data.get("owner_id") and not db.get(User, data["owner_id"]):
        raise HTTPException(status_code=404, detail="Owner not found")

    restaurant = Restaurant(**data, slug=slug)
    db.add(restaurant)
    db.commit()
    return restaurant


def update_restaurant(
    db: Session,
    restaurant_id: int,
    restaurant: Restaurant,
    restaurant_data: dict[str, object],
    user: User,
) -> Restaurant:
    data = restaurant_data.copy()
    if user.role != "SUPER_ADMIN":
        data["owner_id"] = restaurant.owner_id

    slug = normalize_slug(str(data["slug"]))
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
    return restaurant


def delete_restaurant(db: Session, restaurant_id: int) -> None:
    restaurant = db.get(Restaurant, restaurant_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    db.delete(restaurant)
    db.commit()


def normalize_slug(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or f"restaurant-{uuid.uuid4().hex[:8]}"
