from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_current_user, require_role
from app.models.enums import EquipStatus, UserRole
from app.models import User, Hospital, Equipment
from app.schema.equipment import EquipmentCreate, EquipmentRead, EquipmentUpdate

router = APIRouter(prefix="/equipment", tags=["equipment"])

@router.get("", response_model = list[EquipmentRead])
async def list_equipment(
    max_charge : Decimal | None = Query(
        # this is a query parameter used for filtering all of our results
        default = None, # this makes it optional
        ge=0,
        le=100,
        description="Only returns Equipment strictly below this charge level"
    ),
    db: AsyncSession = Depends(get_db),
    # day 5 addition here
    _ : User = Depends(get_current_user)
) -> list[Equipment]:
    

    # We need to be able to interact with the DB, so we need our session object to execute those statement
    # We are DEPENDENT on the session object

    # Includes optional query paramter for filtering base on charge level (business question #3)

    # Create our statement for the DB
    statement = select(Equipment)

    # check for max_charge query paramter
    if max_charge is not None:
        statement = statement.where(Equipment.charge_level < max_charge)
    statement = statement.order_by(Equipment.id)

    result = await db.execute(statement)

    return list(result.scalars().all())

"""
Creates an Equipment object
"""
@router.post("", response_model=EquipmentRead, status_code=status.HTTP_201_CREATED)
async def post_equipment(
    payload: EquipmentCreate, 
    db : AsyncSession = Depends(get_db), 
    _ : User = Depends(require_role(UserRole.ADMIN))
) -> Equipment:
    facility = await db.get(Hospital, payload.facility_id)
    if facility is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(f"Facility '{payload.facility_id}' not found")
        )
    # we received the payload as a EquipmentCreate object
    # we need it as a Equipment object to save with the ORM
    equipment = Equipment(**payload.model_dump()) # this dumps the model into the Equipment constructor
    # the double-star (**) unpackages the model
    db.add(equipment)
    await db.commit()
    await db.refresh(equipment)
    return equipment

"""
Reads an Equipment object given its ID
"""
@router.get("/{equipment_id}", response_model=EquipmentRead)
async def get_equipment(
    equipment_id : int, 
    db : AsyncSession = Depends(get_db), 
    _ : User = Depends(get_current_user)
) -> Equipment:
    equipment = await db.get(Equipment, equipment_id)

    if equipment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail= f"Equipment '{equipment_id}' not found"
        )
    return equipment

"""
Updates an Equipment object given its ID
"""
@router.patch("/{equipment_id}", response_model=EquipmentRead)
async def update_equipment(
    equipment_id: int,
    payload: EquipmentUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN))
) -> Equipment:
    equipment = await db.get(Equipment, equipment_id)   

    if equipment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Equipment '{equipment_id}' not found"
        )
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(equipment, field, value)

    await db.commit()
    await db.refresh(equipment)
    return equipment

"""
Deletes an Equipment object given its ID
"""
@router.delete("/{equipment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_equipment(
    equipment_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN))
) -> Response:
    equipment = await db.get(Equipment, equipment_id)

    if equipment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Equipment '{equipment_id}' not found"
        )

    await db.delete(equipment)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)