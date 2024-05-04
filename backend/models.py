from pydantic import BaseModel
from typing import Optional

class FeedingEvent(BaseModel):
    version: int = 1  # This is for handling schema evolution
    timestamp: str
    amount_ml: float
    notes: Optional[str] = None
