from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Order, OrderStatus


ALLOWED_ORDER_TRANSITIONS = {
    "NEW": {"ACCEPTED", "REJECTED"},
    "ACCEPTED": {"PREPARING", "REJECTED"},
    "PREPARING": {"READY", "REJECTED"},
    "READY": {"PICKED_UP", "DELIVERING", "COMPLETED"},
    "DELIVERING": {"DELIVERED"},
    "PICKED_UP": {"COMPLETED"},
    "DELIVERED": {"COMPLETED"},
    "REJECTED": set(),
    "COMPLETED": set(),
}


def validate_order_transition(current_status: str, new_status: str) -> str:
    next_status = new_status.upper()
    if next_status != current_status and next_status not in ALLOWED_ORDER_TRANSITIONS.get(
        current_status, set()
    ):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot move order from {current_status} to {next_status}",
        )
    return next_status


def update_order_status(
    db: Session,
    order: Order,
    new_status: str,
    *,
    estimated_minutes: int | None = None,
    rejection_reason: str = "",
    note: str | None = None,
    driver_id: int | None = None,
) -> Order:
    next_status = validate_order_transition(order.status, new_status)
    changed = next_status != order.status
    order.status = next_status

    if estimated_minutes is not None:
        order.estimated_minutes = estimated_minutes
    if next_status == "REJECTED":
        order.rejection_reason = rejection_reason
    if changed:
        history_note = note
        if history_note is None:
            history_note = rejection_reason if next_status == "REJECTED" else ""
        db.add(
            OrderStatus(
                order_id=order.id,
                status=next_status,
                note=history_note,
            )
        )
    if order.delivery_assignment:
        if driver_id is not None:
            order.delivery_assignment.driver_id = driver_id
        if next_status == "DELIVERING":
            order.delivery_assignment.status = "ON_THE_WAY"
        elif next_status in {"DELIVERED", "COMPLETED"}:
            order.delivery_assignment.status = "DELIVERED"

    return order
