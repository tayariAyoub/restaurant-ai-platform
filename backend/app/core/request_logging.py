import logging
import re
import time
import uuid
from collections.abc import Awaitable, Callable

from fastapi import Request, Response

logger = logging.getLogger("restaurantai.requests")

REQUEST_ID_PATTERN = re.compile(r"^[a-zA-Z0-9._:-]{1,80}$")


def get_or_create_request_id(request: Request) -> str:
    incoming_request_id = request.headers.get("x-request-id", "").strip()
    if REQUEST_ID_PATTERN.fullmatch(incoming_request_id):
        return incoming_request_id
    return uuid.uuid4().hex


async def request_logging_middleware(
    request: Request, call_next: Callable[[Request], Awaitable[Response]]
) -> Response:
    request_id = get_or_create_request_id(request)
    request.state.request_id = request_id
    started = time.perf_counter()
    status_code = 500
    try:
        response = await call_next(request)
        status_code = response.status_code
        response.headers["X-Request-ID"] = request_id
        return response
    except Exception:
        logger.exception(
            "Request failed",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": status_code,
                "duration_ms": round((time.perf_counter() - started) * 1000, 2),
                "client_ip": request.client.host if request.client else "unknown",
            },
        )
        raise
    finally:
        logger.info(
            "Request completed",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": status_code,
                "duration_ms": round((time.perf_counter() - started) * 1000, 2),
                "client_ip": request.client.host if request.client else "unknown",
            },
        )
