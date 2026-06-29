from pathlib import Path

import pytest
from fastapi import HTTPException

from app.core.config import settings
from app.services.storage import get_storage_service


@pytest.fixture()
def local_storage(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(settings, "storage_provider", "local")
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))
    return get_storage_service()


def test_local_image_upload_stores_safe_url_and_file(local_storage) -> None:
    stored = local_storage.save_image(
        restaurant_id=7,
        content=b"fake-png",
        original_filename="hero image.png",
        content_type="image/png",
    )

    assert stored.url.startswith("/uploads/7/")
    assert stored.url.endswith(".png")
    assert Path(stored.path).exists()
    assert Path(stored.path).read_bytes() == b"fake-png"


def test_image_upload_rejects_invalid_content_type(local_storage) -> None:
    with pytest.raises(HTTPException) as error:
        local_storage.save_image(
            restaurant_id=7,
            content=b"<script>",
            original_filename="logo.png",
            content_type="text/html",
        )

    assert error.value.status_code == 400


def test_image_upload_rejects_dangerous_extension(local_storage) -> None:
    with pytest.raises(HTTPException) as error:
        local_storage.save_image(
            restaurant_id=7,
            content=b"not-safe",
            original_filename="logo.php",
            content_type="image/png",
        )

    assert error.value.status_code == 400


def test_image_upload_rejects_extension_content_type_mismatch(local_storage) -> None:
    with pytest.raises(HTTPException) as error:
        local_storage.save_image(
            restaurant_id=7,
            content=b"not-a-jpeg",
            original_filename="hero.jpg",
            content_type="image/png",
        )

    assert error.value.status_code == 400


def test_image_upload_rejects_oversized_file(local_storage) -> None:
    with pytest.raises(HTTPException) as error:
        local_storage.save_image(
            restaurant_id=7,
            content=b"x" * (8 * 1024 * 1024 + 1),
            original_filename="hero.png",
            content_type="image/png",
        )

    assert error.value.status_code == 413


def test_video_upload_stores_safe_url_and_file(local_storage) -> None:
    stored = local_storage.save_video(
        restaurant_id=7,
        content=b"fake-mp4",
        original_filename="loading screen.mp4",
        content_type="video/mp4",
    )

    assert stored.url.startswith("/uploads/7/videos/")
    assert stored.url.endswith(".mp4")
    assert Path(stored.path).exists()
    assert Path(stored.path).read_bytes() == b"fake-mp4"


def test_video_upload_rejects_invalid_content_type(local_storage) -> None:
    with pytest.raises(HTTPException) as error:
        local_storage.save_video(
            restaurant_id=7,
            content=b"not-video",
            original_filename="loading.mp4",
            content_type="video/quicktime",
        )

    assert error.value.status_code == 400


def test_video_upload_rejects_dangerous_extension(local_storage) -> None:
    with pytest.raises(HTTPException) as error:
        local_storage.save_video(
            restaurant_id=7,
            content=b"not-safe",
            original_filename="loading.php",
            content_type="video/mp4",
        )

    assert error.value.status_code == 400


def test_video_upload_rejects_oversized_file(local_storage) -> None:
    with pytest.raises(HTTPException) as error:
        local_storage.save_video(
            restaurant_id=7,
            content=b"x" * (5 * 1024 * 1024 + 1),
            original_filename="loading.mp4",
            content_type="video/mp4",
        )

    assert error.value.status_code == 413


def test_document_upload_uses_safe_unique_filename(local_storage) -> None:
    stored = local_storage.save_document(
        restaurant_id=7,
        content=b"restaurant policy",
        original_filename="../reservation policy.txt",
    )

    assert stored.url.startswith("/uploads/7/documents/")
    assert stored.filename.endswith("-reservation-policy.txt")
    assert ".." not in stored.filename
    assert Path(stored.path).exists()


def test_document_upload_rejects_dangerous_extension(local_storage) -> None:
    with pytest.raises(HTTPException) as error:
        local_storage.save_document(
            restaurant_id=7,
            content=b"dangerous",
            original_filename="policy.php",
        )

    assert error.value.status_code == 400


def test_document_upload_rejects_oversized_file(local_storage) -> None:
    with pytest.raises(HTTPException) as error:
        local_storage.save_document(
            restaurant_id=7,
            content=b"x" * (10 * 1024 * 1024 + 1),
            original_filename="policy.txt",
        )

    assert error.value.status_code == 413
