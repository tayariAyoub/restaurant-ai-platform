from fastapi import HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import KnowledgeChunk, KnowledgeDocument
from app.services.knowledge import chunk_text, create_embeddings, extract_upload_text
from app.services.storage import get_storage_service, validate_document_upload


def upload_document(
    db: Session,
    restaurant_id: int,
    file: UploadFile,
    content: bytes,
) -> KnowledgeDocument:
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
                source=stored.filename,
                content=chunk,
                embedding=embedding,
            )
            for chunk, embedding in zip(chunks, embeddings, strict=True)
        ]
    )
    db.commit()
    db.refresh(document)
    return document


def list_documents(db: Session, restaurant_id: int) -> list[KnowledgeDocument]:
    return list(
        db.scalars(
            select(KnowledgeDocument)
            .where(KnowledgeDocument.restaurant_id == restaurant_id)
            .order_by(KnowledgeDocument.created_at.desc())
        )
    )
