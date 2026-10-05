from __future__ import annotations
from typing import TYPE_CHECKING
from sqlalchemy import Integer, Enum, ForeignKey, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from .base import Base
from .enums import OrderPriority, OrderStatus

if TYPE_CHECKING:
    from .user import User
    from .equipment import Equipment
    from .report import Report

class WorkOrder(Base):
    __tablename__ = "work_orders"
    
    id: Mapped[int] = mapped_column(
        Integer,
        primary_key = True
    )

    title: Mapped[str] = mapped_column(
        Text, 
        nullable = False
    )

    priority: Mapped[OrderPriority] = mapped_column(
        Enum(
            OrderPriority,
            name = "order_priority",
            values_callable = lambda enum_cls : [member.value for member in enum_cls]
        ),
        nullable = False
    )

    status : Mapped[OrderStatus] = mapped_column(
        Enum(
            OrderStatus,
            name = "order_status",
            values_callable = lambda enum_cls : [member.value for member in enum_cls]
        ),
        default =  OrderStatus.PENDING,
        nullable = False
    )

    equipment_id : Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            column = "equipment.id",
            ondelete = "CASCADE"
        ),
        nullable=False
    )


    technician_id : Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            column="users.id",
        ),
        nullable = True
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    

    equipment : Mapped["Equipment"] = relationship(
        back_populates="work_orders"
    )

    technician : Mapped["User | None"] = relationship(
        back_populates="work_orders"
    )

    report : Mapped["Report"] = relationship(
        back_populates="work_order"
    )


    def __repr__(self):
        return (f"WorkOrder(title={self.title!r}, "
                f"priority={self.priority.value}, "
                f"status={self.status.value}, "
                f"equipment_id={self.equipment_id}, "
                f"technician_id={self.technician_id})")