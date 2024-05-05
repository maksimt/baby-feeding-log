from pydantic import BaseModel, validator

class Event(BaseModel):
    timestamp: int
    event_type: str
    notes: str

class FeedingEvent(Event):
    amount_ml: int

class PoopEvent(Event):
    consistency: str

class SpitUpEvent(Event):
    volume: str  # Could be 'small', 'medium', 'large'

# Validate event types and ensure correct data is provided
@validator('event_type')
def validate_event_type(cls, v, values, **kwargs):
    if v not in ['feeding', 'poop', 'spit up']:
        raise ValueError("Invalid event type")
    return v
