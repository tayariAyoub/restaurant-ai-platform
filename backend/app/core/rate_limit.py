import logging
import time
from collections import defaultdict, deque
from collections.abc import Callable
from dataclasses import dataclass

from fastapi import Depends, HTTPException, Request, status

from app.core.config import settings

logger = logging.getLogger("restaurantai.rate_limit")


@dataclass(frozen=True)
class RateLimitRule:
    name: str
    limit: int
    window_seconds: int = 60


class InMemoryRateLimiter:
    def __init__(self) -> None:
        self._hits: dict[tuple[str, str], deque[float]] = defaultdict(deque)

    def check(self, key: str, rule: RateLimitRule) -> tuple[bool, int]:
        now = time.monotonic()
        window_start = now - rule.window_seconds
        bucket = self._hits[(rule.name, key)]
        while bucket and bucket[0] <= window_start:
            bucket.popleft()
        if rule.limit <= 0:
            return False, rule.window_seconds
        if len(bucket) >= rule.limit:
            retry_after = max(1, int(rule.window_seconds - (now - bucket[0])))
            return False, retry_after
        bucket.append(now)
        return True, 0

    def reset(self) -> None:
        self._hits.clear()


limiter = InMemoryRateLimiter()


def client_ip(request: Request) -> str:
    if settings.trust_proxy_headers:
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",", 1)[0].strip()
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip.strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def rate_limit(rule_factory: Callable[[], RateLimitRule]):
    def dependency(request: Request) -> None:
        rule = rule_factory()
        ip = client_ip(request)
        allowed, retry_after = limiter.check(ip, rule)
        if allowed:
            return
        logger.warning(
            "Rate limit exceeded",
            extra={
                "rate_limit": rule.name,
                "client_ip": ip,
                "path": request.url.path,
                "retry_after": retry_after,
            },
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "message": "Too many requests. Please wait a moment and try again.",
                "retry_after_seconds": retry_after,
            },
            headers={"Retry-After": str(retry_after)},
        )

    return Depends(dependency)


def chat_rule() -> RateLimitRule:
    return RateLimitRule("public_chat", settings.rate_limit_chat_per_minute)


def reservations_rule() -> RateLimitRule:
    return RateLimitRule("public_reservations", settings.rate_limit_reservations_per_minute)


def orders_rule() -> RateLimitRule:
    return RateLimitRule("public_orders", settings.rate_limit_orders_per_minute)


def public_rule() -> RateLimitRule:
    return RateLimitRule("public_general", settings.rate_limit_public_per_minute)


def auth_rule() -> RateLimitRule:
    return RateLimitRule("auth_login", settings.rate_limit_auth_per_minute)
