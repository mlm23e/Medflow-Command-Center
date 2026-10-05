from fastapi import APIRouter, Depends, HTTPException, Response, status, Query

from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Hospital, User, Equipment
from app.models.enums import UserRole, EquipStatus
from app.dependencies import get_db, get_current_user, require_role
from app.schema.hospitals import HospitalRead, HospitalCreate, HospitalUpdate, MaintenanceFlagRead

router = APIRouter(prefix="/hospitals", tags=["hospitals"])

@router.get("", response_model=list[HospitalRead])
async def list_hospitals(
    db : AsyncSession = Depends(get_db),
    _ : User = Depends(get_current_user)
)->list[Hospital]:
    statement = select(Hospital).order_by(Hospital.id)
    result = await db.execute(statement)
    return list(result.scalars().all())

@router.post("", response_model=HospitalRead, status_code=status.HTTP_201_CREATED)
async def post_hospital(
    payload : HospitalCreate,
    db : AsyncSession = Depends(get_db),
    _ : User = Depends(require_role(UserRole.ADMIN))
)->Hospital:
    if payload.supervisor_id is not None:
        supervisor = await db.get(User, payload.supervisor_id)
        if supervisor is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(f"User '{payload.supervisor_id}' not found")
            )

    hospital = Hospital(**payload.model_dump())
    db.add(hospital)
    await db.commit()
    await db.refresh(hospital)
    return hospital

@router.get("/maintenance-flags", response_model = list[MaintenanceFlagRead])
async def hospitals_with_maintenance_flags(
    db : AsyncSession = Depends(get_db),
    _ : User = Depends(get_current_user)
)->list[MaintenanceFlagRead]:
    equipment_total = func.count(Equipment.id)
    maintenance_equipment = func.sum(
        case((Equipment.status == EquipStatus.MAINTENANCE, 1), else_=0)
    )
    statement = (
        select(
            Hospital.id,
            Hospital.name,
            equipment_total.label("equipment_total"),
            maintenance_equipment.label("maintenance_total"),
            (maintenance_equipment * 100.0 / equipment_total).label("maintenance_rate")
        )
        .join(Equipment, Equipment.facility_id == Hospital.id)
        .group_by(Hospital.id, Hospital.name)
        .having(maintenance_equipment * 100 > equipment_total * 30)
        .order_by(Hospital.id)
    )
    result = await db.execute(statement)
    return [MaintenanceFlagRead(**row) for row in result.mappings().all()]


@router.get("/{hospital_id}", response_model=HospitalRead)
async def get_hospital_by_id(
    hospital_id : int,
    db : AsyncSession = Depends(get_db),
    _ : User = Depends(get_current_user)
) -> Hospital:
    hospital = await db.get(Hospital, hospital_id)
    if hospital is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(f"Hospital '{hospital_id}' not found")
        )
    return hospital

@router.patch("/{hospital_id}", response_model=HospitalRead)
async def update_hospital(
    hospital_id : int,
    payload : HospitalUpdate,
    db : AsyncSession = Depends(get_db),
    _ : User = Depends(require_role(UserRole.ADMIN))
)->Hospital:
    hospital = await db.get(Hospital, hospital_id)
    if hospital is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(f"Hospital '{hospital_id}' not found")
        )
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(hospital, field, value)
    await db.commit()
    await db.refresh(hospital)
    return hospital

@router.delete("/{hospital_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_hospital(
    hospital_id : int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN))
)->Response:
    hospital = await db.get(Hospital, hospital_id)
    if hospital is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(f"Hospital '{hospital_id}' not found")
        )
    await db.delete(hospital)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

