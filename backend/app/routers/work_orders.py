from datetime import datetime

from fastapi import APIRouter, Depends, Query, HTTPException, status, Response

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schema.work_orders import (
    EquipmentReliabilityRead,
    OrderDiscrepancyRead,
    OrderCreate,
    OrderPriority,
    OrderRead,
    OrderUpdate,
    OrderStatusUpdate,
)
from app.schema.equipment import EquipmentRead
from app.models import Equipment, UserRole, User, WorkOrder, OrderPriority, OrderStatus

from app.dependencies import get_db, require_role, get_current_user

router = APIRouter(prefix="/work_orders", tags=["work_orders"])


"""
Creates a WorkOrder object
"""
@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
async def post_work_order(
    payload: OrderCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN, UserRole.TECHNICIAN))
)->WorkOrder:
    equip = await db.get(Equipment, payload.equipment_id)
    if equip is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail = (f"WorkOrder '{payload.equipment_id}' not found")
        )

    if payload.technician_id is not None:
        user = await db.get(User, payload.technician_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(f"User '{payload.technician_id}' not found")
            )

    work_order = WorkOrder(**payload.model_dump())
    db.add(work_order)
    await db.commit()
    await db.refresh(work_order)
    return work_order

"""
Reads ALL WorkOrders
"""
@router.get("", response_model=list[OrderRead])
async def list_work_orders(
    db : AsyncSession = Depends(get_db),
    _ : User = Depends(get_current_user)
)->list[WorkOrder]:
    statement = select(WorkOrder).order_by(WorkOrder.id)
    result = await db.execute(statement)
    return list(result.scalars().all())

"""
Determines the work_order call completion/failure broken down by Equipment model
(answers business question #3)
"""
@router.get("/reliability", response_model=list[EquipmentReliabilityRead])
async def atm_reliability_metric(
    db : AsyncSession = Depends(get_db),
    _ : User = Depends(get_current_user)
) -> list[EquipmentReliabilityRead]:
    statement = (
        select(
            Equipment.model.label("model"),
            func.count(WorkOrder.id).label("total_calls"),
            func.sum(
                case((WorkOrder.status == OrderStatus.COMPLETED, 1), else_=0)
            ).label("completed_calls"),
            func.sum(
                case((WorkOrder.status == OrderStatus.FAILED, 1), else_=0)
            ).label("failed_calls"),
        )
        .join(WorkOrder, WorkOrder.equipment_id == Equipment.id)
        .group_by(Equipment.model)
        .order_by(Equipment.model)
    )

    result = await db.execute(statement)
    metrics = []

    for row in result.mappings().all():
        completed_calls = int(row["completed_calls"] or 0)
        failed_calls = int(row["failed_calls"] or 0)
        resolved_calls = completed_calls + failed_calls
        completion_rate = (
            completed_calls / resolved_calls * 100 if resolved_calls else 0
        )
        failure_rate = (
            failed_calls / resolved_calls * 100 if resolved_calls else 0
        )

        metrics.append(
            EquipmentReliabilityRead(
                model=row["model"],
                total_calls=int(row["total_calls"]),
                completed_calls=completed_calls,
                failed_calls=failed_calls,
                completion_rate=completion_rate,
                failure_rate=failure_rate,
            )
        )

    return metrics

"""
Finds co-location discrepancies between the WorkOrder and User facility IDs, 
with the option to return only the discrepancies found for work_order 
calls of a certain priority
(answers business question #2)
"""
@router.get("/discrepancies", response_model=list[OrderDiscrepancyRead])
async def list_colocation_discrepancies(
    priority: OrderPriority | None = Query(
        default=None,
        description="Only return discrepancies for work orders of this priority"
    ),
    db : AsyncSession = Depends(get_db),
    _ : User = Depends(get_current_user)
):
    # Answers business question #2 (find colocation discrepancies between WorkOrder and Technician facility_id)
    statement = (
        select(
            WorkOrder.id.label("work_order_id"), 
            WorkOrder.title, 
            Equipment.id.label("equipment_id"),
            Equipment.facility_id.label("equipment_facility_id"), 
            User.facility_id.label("technician_facility_id"),
            User.id.label("technician_id")
        )
        .join(Equipment, Equipment.id == WorkOrder.equipment_id)
        .join(User, User.id == WorkOrder.technician_id)
        .where(Equipment.facility_id != User.facility_id)
    )

    if priority is not None:
        statement = statement.where(WorkOrder.priority == priority)

    statement = statement.order_by(WorkOrder.id)

    result = await db.execute(statement)
    return [dict(row) for row in result.mappings().all()]

"""
Reads WorkOrder by its ID
"""
@router.get("/{work_order_id}", response_model=OrderRead)
async def get_work_order_by_id(
    work_order_id : int,
    db : AsyncSession = Depends(get_db),
    _ : User = Depends(get_current_user)
) -> WorkOrder:
    work_order = await db.get(WorkOrder, work_order_id)
    if work_order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(f"WorkOrder '{work_order_id}' not found")
        )
    return work_order



"""
Updates a WorkOrder
"""
@router.patch("/{work_order_id}", response_model=OrderRead)
async def update_work_order(
    work_order_id : int,
    payload : OrderUpdate, 
    db : AsyncSession = Depends(get_db),
    _ : User = Depends(require_role(UserRole.ADMIN, UserRole.TECHNICIAN))
) -> WorkOrder:
    work_order = await db.get(WorkOrder, work_order_id)

    if work_order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(f"WorkOrder '{work_order_id}' not found")
        )
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(work_order, field, value)

    await db.commit()
    await db.refresh(work_order)
    return work_order


"""
Updates the WorkOrder status
"""
@router.patch("/{work_order_id}/status", response_model= OrderRead)
async def update_work_order_status(
    work_order_id : int,
    payload : OrderStatusUpdate,
    db : AsyncSession = Depends(get_db),
    _ : User = Depends(require_role(UserRole.ADMIN, UserRole.TECHNICIAN))
) -> WorkOrder:
    
    work_order = await db.get(WorkOrder, work_order_id)

    if work_order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(f"Work Order '{work_order_id}' not found")
        )

    if payload.status == OrderStatus.COMPLETED:
        work_order.completed_at = datetime.now()
    elif work_order.status == OrderStatus.COMPLETED:
        work_order.completed_at = None

    work_order.status = payload.status

    await db.commit()
    await db.refresh(work_order)

    return work_order

"""
Deletes a WorkOrder
"""
@router.delete("/{work_order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_work_order(
    work_order_id : int,
    db : AsyncSession = Depends(get_db),
    _ : User = Depends(require_role(UserRole.ADMIN, UserRole.TECHNICIAN))
)-> Response:
    work_order = await db.get(WorkOrder, work_order_id)
    if work_order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(f"Work Order '{work_order_id}' not found")
        )
    await db.delete(work_order)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)