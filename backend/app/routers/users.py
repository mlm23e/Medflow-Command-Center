from fastapi import APIRouter, Depends, HTTPException, Response, status

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db, require_role
from app.models import User, UserRole, Hospital, WorkOrder, OrderStatus
from app.schema.user import UserRead, UserUpdate, UserCreate, ActiveCallsRead
from app.security import hash_password

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserRead])
async def list_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN))
) -> list[User]:
    result = await db.execute(select(User).order_by(User.id))
    return list(result.scalars().all())

@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def post_user(
    payload : UserCreate,
    db : AsyncSession = Depends(get_db),
    _ : User = Depends(require_role(UserRole.ADMIN))
)->User:
    username = payload.username.strip().lower()
    existing = await db.execute(
        select(User).where(func.lower(User.username) == username)
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{payload.username}' is already taken"
        )

    if payload.facility_id is not None and await db.get(Hospital, payload.facility_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hospital '{payload.facility_id}' not found"
        )

    user = User(
        username=username,
        first_name=payload.first_name,
        last_name=payload.last_name,
        role=payload.role,
        branch_id=payload.facility_id,
        hashed_password=hash_password(payload.password)
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.get("/active-calls/{technician_id}", response_model=list[ActiveCallsRead])
async def technicians_with_active_calls(
    technician_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[ActiveCallsRead]:
    active_call_count = func.count(WorkOrder.id)
    statement = (
        select(
            User.id.label("technician_id"),
            User.first_name,
            User.last_name,
            active_call_count.label("active_call_count"),
        )
        .join(Hospital, Hospital.id == User.facility_id)
        .join(WorkOrder, WorkOrder.technician_id == User.id)
        .where(
            User.role == UserRole.TECHNICIAN,
            WorkOrder.status.in_(
                [OrderStatus.PENDING, OrderStatus.IN_PROGRESS]
            ),
        )
        .group_by(User.id, User.first_name, User.last_name)
        .order_by(User.id)
    )

    result = await db.execute(statement)
    return [
        ActiveCallsRead(**row)
        for row in result.mappings().all()
    ]


@router.get("/{user_id}", response_model=UserRead)
async def get_user_by_id(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
) -> User:
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail=f"User '{user_id}' not found")
    return user


@router.patch("/{user_id}", response_model=UserRead)
async def update_user(
    user_id: int,
    payload: UserUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN))
) -> User:
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail=f"User '{user_id}' not found")

    updates = payload.model_dump(exclude_unset=True)
    if "facility_id" in updates and updates["facility_id"] is not None:
        facility = await db.get(Hospital, updates["facility_id"])
        if facility is None:
            raise HTTPException(
                status_code=404,
                detail=f"Hospital '{updates['facility_id']}' not found"
            )
    if "username" in updates:
        updates["username"] = updates["username"].strip().lower()
    if "password" in updates:
        updates["hashed_password"] = hash_password(updates.pop("password"))
    if "username" in updates:
        existing = await db.execute(
            select(User).where(
                func.lower(User.username) == updates["username"],
                User.id != user_id
            )
        )
        if existing.scalar_one_or_none() is not None:
            raise HTTPException(status_code=400, detail="Username is already taken")

    for field, value in updates.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN))
) -> Response:
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail=f"User '{user_id}' not found")

    await db.delete(user)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
