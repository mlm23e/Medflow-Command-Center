from pydantic import BaseModel, ConfigDict, Field

from app.models import UserRole

class Token(BaseModel):
    access_token : str
    token_type : str = "bearer"

class UserBase(BaseModel):
    username : str = Field(min_length=3, max_length=150)
    first_name : str = Field(min_length=1, max_length=150)
    last_name : str = Field(min_length=1, max_length=150)
    role : UserRole
    facility_id : int | None = None

class UserCreate(UserBase):
    """Shape of POST/users"""
    password : str = Field(min_length=8)

class UserRead(UserBase):
    id : int
    model_config = ConfigDict(from_attributes=True)

class UserUpdate(BaseModel):
    username : str | None = Field(default= None, min_length=3, max_length=150)
    password : str | None = Field(default = None, min_length=8)
    first_name : str | None = Field(default= None, min_length=1, max_length=150)
    last_name : str | None = Field(default=None, min_length=1, max_length=150)
    role : UserRole | None = None
    facility_id : int | None = None

class ActiveCallsRead(BaseModel):
    technician_id : int
    first_name : str
    last_name : str
    active_call_count : int