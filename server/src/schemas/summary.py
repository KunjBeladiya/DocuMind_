from pydantic import BaseModel
from datetime import datetime

class SummaryCreate(BaseModel):
    type: str  # SHORT / DETAILED / BULLET


class SummaryResponse(BaseModel):
    id: str
    type: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True