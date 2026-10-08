from fastapi import APIRouter, Depends, HTTPException, Response, status

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.schema.reports import (
    ReportCreate,
    ReportRead,
    ReportUpdate
)
from app.models.report import Report
from app.models.user import User
from app.models.enums import UserRole
from app.models.work_order import WorkOrder
from app.dependencies import get_db, get_current_user, require_role

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("", response_model=list[ReportRead])
async def list_reports(
    db : AsyncSession = Depends(get_db),
    _ : User = Depends(get_current_user)
)->list[Report]:
    results = await db.execute(select(Report).order_by(Report.id))
    return list(results.scalars().all())

@router.post("", response_model=ReportRead, status_code=status.HTTP_201_CREATED)
async def post_report(
    payload : ReportCreate,
    db : AsyncSession = Depends(get_db),
    _ : User = Depends(require_role(UserRole.ADMIN, UserRole.TECHNICIAN))
)->Report:
    work_order = await db.get(WorkOrder, payload.work_order_id)
    if work_order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(f"WorkOrder '{payload.work_order_id}' not found")
        )
    report = Report(**payload.model_dump())
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report

@router.get("/{id}", response_model=ReportRead)
async def get_report_by_id(
    id : int,
    db : AsyncSession = Depends(get_db),
    _ : User = Depends(get_current_user)
)->Report:
    report = await db.get(Report, id)
    if report is None: 
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND,
            detail=(f"Report '{id}' not found")
        )
    return report

@router.patch("/{id}", response_model=ReportRead)
async def update_report(
    id : int,
    payload : ReportUpdate,
    db : AsyncSession = Depends(get_db),
    _ : User = Depends(require_role(UserRole.ADMIN, UserRole.TECHNICIAN))
)->Report:
    report = await db.get(Report, id)
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(f"Report Log '{id}' not found")
        )
    updates = payload.model_dump(exclude_unset=True)
    if "work_order_id" in updates:
        work_order = await db.get(WorkOrder, updates["work_order_id"])
        if work_order is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"WorkOrder '{updates['work_order_id']}' not found"
            )

    for field, value in updates.items():
        setattr(report, field, value)
    await db.commit()
    await db.refresh(report)
    return report

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(
    id : int,
    db : AsyncSession = Depends(get_db),
    _ : User = Depends(require_role(UserRole.ADMIN))
)->Response:
    report = await db.get(Report, id)
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(f"Report Log '{id}' not found")
        )
    await db.delete(report)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)