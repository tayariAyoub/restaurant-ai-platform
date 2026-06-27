import re
import uuid
from dataclasses import dataclass
from pathlib import Path

from fastapi import HTTPException, status

from app.core.config import settings

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": {".jpg", ".jpeg"},
    "image/png": {".png"},
    "image/webp": {".webp"},
    "image/gif": {".gif"},
}
DEFAULT_IMAGE_EXTENSION = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
DANGEROUS_EXTENSIONS = {
    ".bat",
    ".cmd",
    ".com",
    ".dll",
    ".exe",
    ".html",
    ".js",
    ".jsp",
    ".msi",
    ".php",
    ".ps1",
    ".py",
    ".scr",
    ".sh",
    ".svg",
}
MAX_IMAGE_BYTES = 8 * 1024 * 1024
MAX_DOCUMENT_BYTES = 10 * 1024 * 1024


@dataclass(frozen=True)
class StoredFile:
    url: str
    filename: str
    path: str


class LocalStorageProvider:
    def __init__(self, root: str) -> None:
        self.root = Path(root)

    def save(self, restaurant_id: int, content: bytes, filename: str, folder: str = "") -> StoredFile:
        safe_name = safe_filename(filename)
        directory = self.root / str(restaurant_id)
        if folder:
            directory = directory / safe_path_segment(folder)
        directory.mkdir(parents=True, exist_ok=True)
        path = directory / safe_name
        path.write_bytes(content)
        relative_path = "/".join(part for part in [str(restaurant_id), folder, safe_name] if part)
        return StoredFile(
            url=f"/uploads/{relative_path}",
            filename=safe_name,
            path=str(path),
        )

    def delete_url(self, url: str) -> None:
        if not url.startswith("/uploads/"):
            return
        relative = Path(url.removeprefix("/uploads/"))
        target = (self.root / relative).resolve()
        root = self.root.resolve()
        if root not in target.parents and target != root:
            return
        target.unlink(missing_ok=True)


class StorageService:
    def __init__(self, provider: LocalStorageProvider) -> None:
        self.provider = provider

    def save_image(self, restaurant_id: int, content: bytes, original_filename: str | None, content_type: str | None) -> StoredFile:
        filename = validate_image_upload(content, original_filename, content_type)
        return self.provider.save(restaurant_id, content, filename)

    def save_document(self, restaurant_id: int, content: bytes, original_filename: str | None) -> StoredFile:
        filename = validate_document_upload(content, original_filename)
        return self.provider.save(restaurant_id, content, filename, folder="documents")

    def delete_url(self, url: str) -> None:
        self.provider.delete_url(url)


def get_storage_service() -> StorageService:
    if settings.storage_provider != "local":
        raise RuntimeError(f"Unsupported storage provider: {settings.storage_provider}")
    return StorageService(LocalStorageProvider(settings.upload_dir))


def validate_image_upload(content: bytes, original_filename: str | None, content_type: str | None) -> str:
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Upload JPG, PNG, WEBP, or GIF images")
    if len(content) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Image is larger than 8 MB")

    raw_name = Path(original_filename or "").name
    suffix = Path(raw_name).suffix.lower()
    if suffix in DANGEROUS_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File extension is not allowed")
    if suffix and suffix not in ALLOWED_IMAGE_TYPES[content_type]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image extension does not match the uploaded file type")
    suffix = suffix or DEFAULT_IMAGE_EXTENSION[content_type]
    return f"{uuid.uuid4().hex}{suffix}"


def validate_document_upload(content: bytes, original_filename: str | None) -> str:
    if len(content) > MAX_DOCUMENT_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File is larger than 10 MB")
    return safe_original_filename(original_filename or "upload.txt")


def safe_original_filename(filename: str) -> str:
    name = Path(filename).name.strip() or "upload.txt"
    suffix = Path(name).suffix.lower()
    if suffix in DANGEROUS_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File extension is not allowed")
    stem = Path(name).stem or "upload"
    return f"{uuid.uuid4().hex}-{safe_path_segment(stem)}{suffix}"


def safe_filename(filename: str) -> str:
    name = Path(filename).name.strip()
    if not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Filename is required")
    suffix = Path(name).suffix.lower()
    if suffix in DANGEROUS_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File extension is not allowed")
    stem = safe_path_segment(Path(name).stem)
    return f"{stem}{suffix}"


def safe_path_segment(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9._-]+", "-", value).strip(".-_")
    return cleaned[:120] or "upload"
