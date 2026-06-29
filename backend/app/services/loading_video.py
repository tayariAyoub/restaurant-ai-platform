from sqlalchemy.orm import Session

from app.models import Restaurant
from app.services.storage import get_storage_service


def display_upload_filename(filename: str | None, fallback: str) -> str:
    safe_name = (filename or fallback).replace("\\", "/").split("/")[-1].strip()
    return safe_name[:255] or fallback


def upload_loading_video(
    db: Session,
    restaurant: Restaurant,
    content: bytes,
    filename: str | None,
    content_type: str | None,
) -> Restaurant:
    storage = get_storage_service()
    stored = storage.save_video(restaurant.id, content, filename, content_type)
    previous_url = restaurant.loading_video_url
    restaurant.loading_video_url = stored.url
    restaurant.loading_video_filename = display_upload_filename(filename, stored.filename)
    restaurant.loading_video_size_bytes = len(content)
    db.commit()
    db.refresh(restaurant)
    if previous_url and previous_url != stored.url:
        storage.delete_url(previous_url)
    return restaurant


def delete_loading_video(db: Session, restaurant: Restaurant) -> Restaurant:
    previous_url = restaurant.loading_video_url
    restaurant.loading_video_url = ""
    restaurant.loading_video_filename = ""
    restaurant.loading_video_size_bytes = 0
    db.commit()
    db.refresh(restaurant)
    if previous_url:
        get_storage_service().delete_url(previous_url)
    return restaurant
