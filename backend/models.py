from typing import List, Optional
from pydantic import BaseModel, ValidationError, validator, HttpUrl


class Event(BaseModel):
    timestamp: int
    event_type: str
    notes: str
    id: str
    picture_links: List[str] = []

    @validator("event_type", pre=True, always=True)
    def set_event_type(cls, v):
        if v not in [
            "feeding",
            "poop",
            "spit up",
            "breastfeeding",
            "milestone",
            "bath",
            "other",
            "incomplete_feeding",
            "weight_recorded",
        ]:
            raise ValueError("Invalid event type")
        return v


class FeedingEvent(Event):
    amount_oz: float


class BreastFeedingEvent(Event):
    time_left: int
    time_right: int


class MilestoneEvent(Event):
    description: str
    picture_link: str = ""


class BathEvent(Event):
    # No additional fields needed for bath events
    pass


class OtherEvent(Event):
    description: str


class PoopEvent(Event):
    consistency: str
    time_since_last_poop: str = ""
    total_oz_since_last_poop: float = float("nan")


class SpitUpEvent(Event):
    amount_ml: float


class WeightRecordedEvent(Event):
    weight_kg: float
    picture_links: Optional[List[str]]


class IncompleteFeedingEvent(Event):
    pass


def create_event_object(data: dict) -> Event:
    event_type = data.get("event_type")
    try:
        if event_type == "feeding":
            return FeedingEvent(**data)
        elif event_type == "breastfeeding":
            return BreastFeedingEvent(**data)
        elif event_type == "milestone":
            return MilestoneEvent(**data)
        elif event_type == "bath":
            return BathEvent(**data)
        elif event_type == "other":
            return OtherEvent(**data)
        elif event_type == "poop":
            return PoopEvent(**data)
        elif event_type == "spit up":
            return SpitUpEvent(**data)
        elif event_type == "weight_recorded":
            return WeightRecordedEvent(**data)
        elif event_type == "incomplete_feeding":
            return IncompleteFeedingEvent(**data)
        else:
            raise ValidationError("Unsupported event type")
    except ValidationError:
        return Event(**data)
