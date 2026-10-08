from __future__ import annotations
from typing import TYPE_CHECKING

from datetime import datetime
from sqlalchemy import Integer, Text, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

if TYPE_CHECKING:
    from .work_order import WorkOrder

class Report(Base):
    __tablename__ = "reports"

    id : Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    work_order_id : Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            column="work_orders.id", 
            ondelete="CASCADE"
        ),
        nullable=False
    )

    file_url : Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    notes : Mapped[str] = mapped_column(
        Text,
        nullable=True
    )

    timestamp : Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now(),
        nullable=False
    )

    work_order : Mapped["WorkOrder"] = relationship(
        back_populates="report"
    )

    def __repr__(self):
        return (f"Report("
                f"work_order_id={self.work_order_id}, "
                f"file_url={self.file_url!r})"
        )