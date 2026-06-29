from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import DeliveryAssignment, DeliveryDriver, Order, OrderStatus


VALID_DELIVERY_STATUSES = {"ASSIGNED", "ON_THE_WAY", "DELIVERED"}


def list_drivers(db: Session, restaurant_id: int) -> list[DeliveryDriver]:
    return list(
        db.scalars(
            select(DeliveryDriver)
            .where(DeliveryDriver.restaurant_id == restaurant_id)
            .order_by(DeliveryDriver.name)
        )
    )


def create_driver(
    db: Session, restaurant_id: int, driver_data: dict[str, object]
) -> DeliveryDriver:
    driver = DeliveryDriver(restaurant_id=restaurant_id, **driver_data)
    db.add(driver)
    return driver


def delete_driver(db: Session, restaurant_id: int, driver_id: int) -> None:
    driver = db.get(DeliveryDriver, driver_id)
    if not driver or driver.restaurant_id != restaurant_id:
        raise HTTPException(status_code=404, detail="Driver not found")
    active_assignment = db.scalar(
        select(DeliveryAssignment).where(
            DeliveryAssignment.driver_id == driver_id,
            DeliveryAssignment.status != "DELIVERED",
        )
    )
    if active_assignment:
        raise HTTPException(status_code=409, detail="Driver has an active delivery")
    db.delete(driver)


def assign_driver_to_order(
    db: Session, restaurant_id: int, order_id: int, driver_id: int
) -> Order:
    order = db.get(Order, order_id)
    driver = db.get(DeliveryDriver, driver_id)
    if not order or order.restaurant_id != restaurant_id or order.order_type != "DELIVERY":
        raise HTTPException(status_code=404, detail="Delivery order not found")
    if not driver or driver.restaurant_id != restaurant_id or not driver.is_active:
        raise HTTPException(status_code=404, detail="Driver not found")

    assignment = order.delivery_assignment
    if assignment:
        assignment.driver_id = driver.id
        assignment.status = "ASSIGNED"
    else:
        db.add(DeliveryAssignment(order_id=order.id, driver_id=driver.id))
    return order


def validate_delivery_status(status: str) -> str:
    normalized_status = status.upper()
    if normalized_status not in VALID_DELIVERY_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid delivery status")
    return normalized_status


def update_delivery_status(
    db: Session, restaurant_id: int, order_id: int, status: str
) -> Order:
    order = db.get(Order, order_id)
    if not order or order.restaurant_id != restaurant_id or not order.delivery_assignment:
        raise HTTPException(status_code=404, detail="Delivery assignment not found")

    next_status = validate_delivery_status(status)
    order.delivery_assignment.status = next_status
    if next_status == "ON_THE_WAY":
        order.status = "DELIVERING"
    elif next_status == "DELIVERED":
        order.status = "DELIVERED"
    db.add(
        OrderStatus(
            order_id=order.id,
            status=order.status,
            note=f"Driver status: {next_status}",
        )
    )
    return order
