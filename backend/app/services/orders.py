from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import DeliveryAssignment, Order, OrderStatus


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


def order_query():
    return select(Order).options(
        selectinload(Order.items),
        selectinload(Order.delivery_address),
        selectinload(Order.delivery_assignment).selectinload(DeliveryAssignment.driver),
        selectinload(Order.status_history),
    )


def list_orders(
    db: Session,
    restaurant_id: int,
    *,
    status: str | None = None,
    order_type: str | None = None,
) -> list[Order]:
    statement = order_query().where(Order.restaurant_id == restaurant_id)
    if status:
        statement = statement.where(Order.status == status.upper())
    if order_type:
        statement = statement.where(Order.order_type == order_type.upper())
    return list(db.scalars(statement.order_by(Order.created_at.desc())).unique())


def get_order_for_restaurant(db: Session, restaurant_id: int, order_id: int) -> Order:
    order = db.get(Order, order_id)
    if not order or order.restaurant_id != restaurant_id:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


def get_order_details(db: Session, order_id: int) -> Order | None:
    return db.scalar(order_query().where(Order.id == order_id))


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


def update_admin_order_status(
    db: Session,
    restaurant_id: int,
    order_id: int,
    new_status: str,
    *,
    estimated_minutes: int | None = None,
    rejection_reason: str = "",
) -> Order:
    order = get_order_for_restaurant(db, restaurant_id, order_id)
    return update_order_status(
        db,
        order,
        new_status,
        estimated_minutes=estimated_minutes,
        rejection_reason=rejection_reason,
    )
