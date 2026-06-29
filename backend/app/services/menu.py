from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import MenuCategory, MenuItem
from app.services.knowledge import rebuild_structured_knowledge


def create_category(
    db: Session, restaurant_id: int, category_data: dict[str, object]
) -> MenuCategory:
    category = MenuCategory(restaurant_id=restaurant_id, **category_data)
    db.add(category)
    return category


def update_category(
    db: Session,
    restaurant_id: int,
    category_id: int,
    category_data: dict[str, object],
) -> MenuCategory:
    category = db.get(MenuCategory, category_id)
    if not category or category.restaurant_id != restaurant_id:
        raise HTTPException(status_code=404, detail="Category not found")
    for key, value in category_data.items():
        setattr(category, key, value)
    return category


def delete_category(db: Session, restaurant_id: int, category_id: int) -> None:
    category = db.get(MenuCategory, category_id)
    if not category or category.restaurant_id != restaurant_id:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(category)


def create_menu_item(
    db: Session, restaurant_id: int, item_data: dict[str, object]
) -> MenuItem:
    category = db.get(MenuCategory, item_data["category_id"])
    if not category or category.restaurant_id != restaurant_id:
        raise HTTPException(status_code=404, detail="Category not found")
    item = MenuItem(**item_data)
    db.add(item)
    return item


def update_menu_item(
    db: Session,
    restaurant_id: int,
    item_id: int,
    item_data: dict[str, object],
) -> MenuItem:
    item = get_menu_item(db, restaurant_id, item_id)
    category = db.get(MenuCategory, item_data["category_id"])
    if not category or category.restaurant_id != restaurant_id:
        raise HTTPException(status_code=404, detail="Menu item not found")
    for key, value in item_data.items():
        setattr(item, key, value)
    return item


def delete_menu_item(db: Session, restaurant_id: int, item_id: int) -> None:
    item = get_menu_item(db, restaurant_id, item_id)
    db.delete(item)


def get_menu_item(db: Session, restaurant_id: int, item_id: int) -> MenuItem:
    item = db.scalar(
        select(MenuItem)
        .join(MenuCategory)
        .where(MenuItem.id == item_id, MenuCategory.restaurant_id == restaurant_id)
    )
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return item


def rebuild_menu_knowledge(db: Session, restaurant_id: int) -> None:
    rebuild_structured_knowledge(db, restaurant_id)
