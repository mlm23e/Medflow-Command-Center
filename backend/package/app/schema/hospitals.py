from pydantic import BaseModel, ConfigDict, Field
from decimal import Decimal
from app.models import Region

class HospitalBase(BaseModel):
    name : str = Field(min_length=1, max_length=250)
    location_region : Region
    capacity : int = Field(ge=0)
    supervisor_id : int

class HospitalCreate(HospitalBase):
    """Body for POST/hospitals"""

class HospitalRead(HospitalBase):
    id : int
    model_config = ConfigDict(from_attributes=True)

class MaintenanceFlagRead(BaseModel):
    id : int
    name : str
    equipment_total : int
    maintenance_total : int
    maintenance_rate : Decimal

class HospitalUpdate(BaseModel):
    name : str | None = Field(default=None, min_length=1, max_digits=250)
    location_region : Region | None = None
    capacity : int | None = Field(ge=0)
    supervisor_id : int | None = None