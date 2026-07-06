import logging
import smtplib
from decimal import Decimal, InvalidOperation
from email.message import EmailMessage
from typing import Any

from app.core.config import settings
from app.models import ContactRequest, Order, Restaurant

logger = logging.getLogger("restaurantai.notifications")


def notify_new_order(restaurant: Restaurant, order: Order) -> bool:
    subject = f"New order for {restaurant.name}"
    body = "\n".join(
        [
            f"Restaurant: {restaurant.name}",
            "Type: New public order",
            f"Customer name: {order.customer_name}",
            f"Customer email: {order.customer_email or '-'}",
            f"Customer phone: {order.customer_phone or '-'}",
            f"Order mode: {order.order_type}",
            f"Public order ID: {order.public_id}",
            f"Total: {format_price(order.total)}",
            admin_hint("orders", restaurant.id),
        ]
    )
    return send_notification("order", subject, body)


def notify_new_contact_request(restaurant: Restaurant, request: ContactRequest) -> bool:
    subject = f"New reservation request for {restaurant.name}"
    body = "\n".join(
        [
            f"Restaurant: {restaurant.name}",
            "Type: New reservation/contact request",
            f"Customer name: {request.name}",
            f"Customer email: {request.email or '-'}",
            f"Customer phone: {request.phone or '-'}",
            f"Requested date/time: {request.requested_at or '-'}",
            f"Party size: {request.party_size or '-'}",
            f"Message: {request.message or '-'}",
            admin_hint("reservations", restaurant.id),
        ]
    )
    return send_notification("reservation", subject, body)


def send_notification(kind: str, subject: str, body: str, config: Any = settings) -> bool:
    missing = missing_notification_config(config)
    if missing:
        logger.info(
            "Skipping %s email notification: missing %s.",
            kind,
            ", ".join(missing),
        )
        return False

    try:
        send_email(config, subject, body)
    except Exception:
        logger.exception("Failed to send %s email notification.", kind)
        return False

    logger.info("Sent %s email notification.", kind)
    return True


def missing_notification_config(config: Any) -> list[str]:
    required_values = {
        "SMTP_HOST": getattr(config, "smtp_host", ""),
        "SMTP_FROM_EMAIL": getattr(config, "smtp_from_email", ""),
        "NOTIFICATION_TO_EMAIL": getattr(config, "notification_to_email", ""),
    }
    return [name for name, value in required_values.items() if not clean(value)]


def send_email(config: Any, subject: str, body: str) -> None:
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = clean(getattr(config, "smtp_from_email", ""))
    message["To"] = clean(getattr(config, "notification_to_email", ""))
    message.set_content(body)

    host = clean(getattr(config, "smtp_host", ""))
    port = int(getattr(config, "smtp_port", 587) or 587)
    username = clean(getattr(config, "smtp_username", ""))
    password = clean(getattr(config, "smtp_password", ""))
    use_tls = bool(getattr(config, "smtp_use_tls", True))

    if port == 465:
        with smtplib.SMTP_SSL(host, port, timeout=10) as smtp:
            login_if_configured(smtp, username, password)
            smtp.send_message(message)
        return

    with smtplib.SMTP(host, port, timeout=10) as smtp:
        if use_tls:
            smtp.starttls()
        login_if_configured(smtp, username, password)
        smtp.send_message(message)


def login_if_configured(smtp: smtplib.SMTP, username: str, password: str) -> None:
    if username and password:
        smtp.login(username, password)


def admin_hint(section: str, restaurant_id: int) -> str:
    base_url = clean(settings.admin_base_url).rstrip("/")
    if not base_url:
        return "Admin: Open the RestaurantAI admin dashboard to review this request."
    return f"Admin: {base_url}/admin/restaurants/{restaurant_id}/{section}"


def format_price(value: object) -> str:
    try:
        amount = Decimal(str(value))
    except (InvalidOperation, ValueError):
        return str(value)
    return f"EUR {amount:.2f}"


def clean(value: object) -> str:
    return str(value or "").strip()
