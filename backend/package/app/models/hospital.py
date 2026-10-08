from __future__ import annotations
from typing import TYPE_CHECKING

from sqlalchemy import Integer, Enum, ForeignKey, String, CheckConstraint
from sqlalchemy.orm import mapped_column, Mapped, relationship

from .base import Base
from .enums import Region

if TYPE_CHECKING:
    from .user import User
    from .equipment import Equipment

class Hospital(Base):
    __tablename__ = "hospitals"

    __table_args__ = (
        CheckConstraint(
            "capacity >= 0",
            name="capacity_check"
        ),
    )

    id : Mapped[int] = mapped_column(
        Integer, 
        primary_key=True
    )

    name : Mapped[str] = mapped_column(
        String(250),
        nullable=False
    )

    location_region : Mapped["Region"] = mapped_column(
        Enum(
            Region,
            name="region",
            values_callable=lambda enum_cls : [member.value for member in enum_cls]
        ), 
        nullable=False
    )

    capacity : Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    supervisor_id : Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    supervisor : Mapped["User | None"] = relationship(
        back_populates="supervised_hospital",
        foreign_keys="[Hospital.supervisor_id]"
    )

    equipment : Mapped[list["Equipment"]] = relationship(
        back_populates="facility",
        foreign_keys="Equipment.facility_id"
    )

    users : Mapped[list["User"]] = relationship(
        back_populates="facility",
        foreign_keys="User.facility_id"
    )

    def __repr__(self) -> str:
        supervisor_name = "None"
        if self.supervisor is not None:
            supervisor_name = f"{self.supervisor.first_name} {self.supervisor.last_name}"
        return (f"Hospital("
                f"name={self.name!r}, "
                f"region={self.location_region.value}, "
                f"capacity={self.capacity}, "
                f"supervisor={supervisor_name})"
        )