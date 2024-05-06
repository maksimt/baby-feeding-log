import logging

from pydantic import BaseModel, ValidationError, validator
from typing import Type, Optional


class Event(BaseModel):
    timestamp: int
    event_type: str
    notes: str

    @validator("event_type", pre=True, always=True)
    def set_event_type(cls, v):
        if v not in ["feeding", "poop", "spit up"]:
            raise ValueError("Invalid event type")
        return v


class FeedingEvent(Event):
    amount_oz: float


class PoopEvent(Event):
    consistency: str


class SpitUpEvent(Event):
    amount_ml: float


def create_event_object(data: dict) -> Event:
    event_type = data.get("event_type")
    try:
        if event_type == "feeding":
            return FeedingEvent(**data)
        elif event_type == "poop":
            return PoopEvent(**data)
        elif event_type == "spit up":
            return SpitUpEvent(**data)
        else:
            raise ValidationError("Unsupported event type")
    except ValidationError:
        return Event(**data)
