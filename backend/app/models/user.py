from __future__ import annotations
from typing import TYPE_CHECKING

from sqlalchemy import Integer, Enum, String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base
from .enums import UserRole

if TYPE_CHECKING:
    from .hospital import Hospital
    from .work_order import WorkOrder

class User(Base):
    __tablename__ = "users"

    id : Mapped[int] = mapped_column(
        Integer,
        primary_key = True
    )

    username : Mapped[str] = mapped_column(
        String(150),
        nullable = False
    )

    hashed_password : Mapped[str] = mapped_column(
        Text,
        nullable = False
    )

    first_name : Mapped[str] = mapped_column(
        String(150),
        nullable = False
    )

    last_name : Mapped[str] = mapped_column(
        String(150),
        nullable = False
    )

    role : Mapped[UserRole] = mapped_column(
        Enum(
            UserRole,
            name = "user_role",
            values_callable = lambda enum_cls : [member.value for member in enum_cls]
        ),
        nullable = False
    )

    facility_id : Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            column="hospitals.id",
            ondelete="SET NULL"
        ),
        nullable = True
    )

    facility : Mapped["Hospital | None"] = relationship(
        back_populates="users",
        foreign_keys="[User.facility_id]"
    )

    work_orders : Mapped[list["WorkOrder"]] = relationship(
        back_populates="technician",
        foreign_keys="WorkOrder.technician_id"
    )

    supervised_hospital : Mapped["Hospital | None"] = relationship(
        back_populates="supervisor",
        foreign_keys="Hospital.supervisor_id"
    )

    def __repr__(self) -> str:
        return (f"User(id={self.id}, "
                f"username={self.username!r}, "
                f"role={self.role.value}, "
                f"facility_id={self.facility_id})")