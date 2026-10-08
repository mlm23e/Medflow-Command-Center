from pydantic import ConfigDict, BaseModel, Field
from datetime import datetime

class ReportBase(BaseModel):
    work_order_id : int = Field(ge = 1)
    file_url : str = Field(min_length=1)
    notes : str | None = None

class ReportCreate(ReportBase):
    """Shape of POST/reports"""

class ReportRead(BaseModel):
    id : int
    work_order_id : int
    file_url : str
    notes : str | None = None
    timestamp : datetime
    model_config = ConfigDict(from_attributes=True)

class ReportUpdate(BaseModel):
    work_order_id : int | None = Field(default = None, ge=1)
    file_url : str | None = Field(default = None, min_length=1)
    notes : str | None = None