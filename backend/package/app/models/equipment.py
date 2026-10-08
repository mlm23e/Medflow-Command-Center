from __future__ import annotations
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Enum, ForeignKey, Integer, String, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from decimal import Decimal

from .base import Base
from .enums import EquipStatus

if TYPE_CHECKING:
    from .hospital import Hospital
    from .work_order import WorkOrder

class Equipment(Base):
    __tablename__ = "equipment"

    __table_args__ = (
        CheckConstraint(
            "charge_level BETWEEN 0 AND 100",
            name="charge_level_range"
        ),
    )

    id : Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        nullable=False
    )

    serial_number : Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False
    )

    model : Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    status : Mapped["EquipStatus"] = mapped_column(
        Enum(
            EquipStatus,
            name="equip_status",
            values_callable = lambda enum_cls : [member.value for member in enum_cls]
        ),
        default=EquipStatus.AVAILABLE,
        nullable = False
    )

    charge_level : Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        default = 100,
        nullable=False
    )

    facility_id : Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "hospitals.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    facility : Mapped["Hospital"] = relationship(
        back_populates="equipment"
    )

    work_orders : Mapped[list["WorkOrder"]] = relationship(
        back_populates="equipment",
        passive_deletes=True
    )

    def __repr__(self) -> str:
        return (f"Equipment(id={self.id}, "
                f"serial_number={self.serial_number!r}, "
                f"model={self.model!r}, "
                f"status={self.status.value}, "
                f"cash_level={self.charge_level}, "
                f"branch_id={self.facility_id})")