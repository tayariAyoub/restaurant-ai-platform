from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Restaurant, RestaurantImage
from app.services.storage import get_storage_service


def upload_image(
    db: Session,
    restaurant: Restaurant,
    content: bytes,
    filename: str | None,
    content_type: str | None,
    *,
    image_type: str,
    alt_text: str,
) -> RestaurantImage:
    stored = get_storage_service().save_image(
        restaurant.id,
        content,
        filename,
        content_type,
    )
    image = RestaurantImage(
        restaurant_id=restaurant.id,
        image_type=image_type,
        url=stored.url,
        alt_text=alt_text,
        sort_order=len(restaurant.images),
    )
    apply_featured_image_fields(restaurant, image.image_type, image.url)
    db.add(image)
    db.commit()
    db.refresh(image)
    return image


def add_image_url(
    db: Session,
    restaurant: Restaurant,
    *,
    image_type: str,
    url: str,
    alt_text: str,
    sort_order: int | None = None,
) -> RestaurantImage:
    image = RestaurantImage(
        restaurant_id=restaurant.id,
        image_type=image_type,
        url=url.strip(),
        alt_text=alt_text.strip(),
        sort_order=sort_order if sort_order is not None else len(restaurant.images),
    )
    apply_featured_image_fields(restaurant, image.image_type, image.url)
    db.add(image)
    db.commit()
    db.refresh(image)
    return image


def delete_image(db: Session, restaurant: Restaurant, image_id: int) -> None:
    image = db.get(RestaurantImage, image_id)
    if not image or image.restaurant_id != restaurant.id:
        raise HTTPException(status_code=404, detail="Image not found")
    if restaurant.logo_url == image.url:
        restaurant.logo_url = ""
    if restaurant.hero_image == image.url:
        restaurant.hero_image = ""
    get_storage_service().delete_url(image.url)
    db.delete(image)
    db.commit()


def apply_featured_image_fields(
    restaurant: Restaurant, image_type: str, url: str
) -> None:
    if image_type == "logo":
        restaurant.logo_url = url
    elif image_type == "hero":
        restaurant.hero_image = url
