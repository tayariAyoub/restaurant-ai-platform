import logging
from http import HTTPStatus
from typing import Any

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("restaurantai.errors")


def request_id_from(request: Request) -> str:
    return str(getattr(request.state, "request_id", "unknown"))


def error_code(status_code: int) -> str:
    try:
        phrase = HTTPStatus(status_code).phrase.lower().replace(" ", "_").replace("-", "_")
    except ValueError:
        phrase = "error"
    return phrase


def error_message(detail: Any, status_code: int) -> str:
    if isinstance(detail, dict):
        message = detail.get("message") or detail.get("detail")
        if message:
            return str(message)
    if isinstance(detail, str) and detail:
        return detail
    if isinstance(detail, list):
        return "Request validation failed."
    try:
        return HTTPStatus(status_code).phrase
    except ValueError:
        return "Request failed."


def error_payload(
    *,
    status_code: int,
    detail: Any,
    request_id: str,
    code: str | None = None,
    message: str | None = None,
) -> dict[str, Any]:
    return {
        "detail": jsonable_encoder(detail),
        "error": {
            "code": code or error_code(status_code),
            "message": message or error_message(detail, status_code),
            "status_code": status_code,
            "request_id": request_id,
        },
    }


async def http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    request_id = request_id_from(request)
    return JSONResponse(
        status_code=exc.status_code,
        content=error_payload(
            status_code=exc.status_code,
            detail=exc.detail,
            request_id=request_id,
        ),
        headers=exc.headers,
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    request_id = request_id_from(request)
    return JSONResponse(
        status_code=422,
        content=error_payload(
            status_code=422,
            detail=exc.errors(),
            request_id=request_id,
            code="validation_error",
            message="Request validation failed.",
        ),
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    request_id = request_id_from(request)
    logger.exception(
        "Unhandled request exception",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
        },
    )
    return JSONResponse(
        status_code=500,
        content=error_payload(
            status_code=500,
            detail="Internal server error",
            request_id=request_id,
            code="internal_server_error",
            message="Internal server error",
        ),
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
