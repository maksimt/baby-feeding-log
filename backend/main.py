import uuid
import os
from pathlib import Path
from plots import cumulative_history_plot, add_interpoop_stats, interpoop_evolution_plot
from data_access import (
    DATA_FILE,
    DELETED_INDICATOR,
    events_dataframe,
    load_events,
    update_data_file,
)
from models import *
from fastapi import FastAPI, HTTPException, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
import json
from typing import List, Union, Optional
import logging
from fastapi import Query

app = FastAPI()

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

IMAGES_DIR = Path("data/images")
IMAGES_DIR.mkdir(parents=True, exist_ok=True)


@app.exception_handler(Exception)
async def exception_handler(request, exc):
    logging.error("Unhandled exception occurred", exc_info=True)
    return {"detail": "An internal error occurred."}


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # anti-pattern; just using this to avoid config
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/events/")
async def create_event(event: Request):
    try:
        json_value = await event.json()
        json_value["id"] = str(uuid.uuid4())
        logging.info("Got event %s", json_value)
        with open(DATA_FILE, "a") as file:
            file.write(json.dumps(json_value) + "\n")
        return {"success": True, "event_id": json_value["id"]}
    except Exception as e:
        logging.exception(e)
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/events/{id}")
async def update_event(id: str, updated_event: Request):
    try:
        json_value = await updated_event.json()
        updated = False
        lines = []
        with open(DATA_FILE, "r") as file:
            for line in file:
                if id in line and not line.startswith(DELETED_INDICATOR):
                    event = json.loads(line)
                    # Update the event with new data
                    for key, value in json_value.items():
                        if value is not None:
                            event[key] = value
                    line = json.dumps(event) + "\n"
                    updated = True
                lines.append(line)
        if updated:
            update_data_file(lines, DATA_FILE)
            return {"success": True, "msg": "Event updated"}
        else:
            raise HTTPException(status_code=404, detail="Event not found")
    except Exception as e:
        logging.exception(e)
        raise HTTPException(status_code=500, detail="Failed to update event")


@app.post("/events/{event_id}/images")
async def upload_images(event_id: str, images: List[UploadFile] = File(...)):
    try:
        event_images_dir = IMAGES_DIR / event_id
        event_images_dir.mkdir(parents=True, exist_ok=True)

        for image in images:
            image_id = str(uuid.uuid4())
            image_path = event_images_dir / f"{image_id}.png"
            with open(image_path, "wb") as img_file:
                img_file.write(await image.read())

        return {"success": True}
    except Exception as e:
        logging.exception(e)
        raise HTTPException(status_code=500, detail="Failed to upload images")


@app.get("/images/{event_id}/{image_id}")
async def get_image(event_id: str, image_id: str):
    image_path = IMAGES_DIR / event_id / f"{image_id}"
    if image_path.exists():
        return FileResponse(image_path)
    raise HTTPException(status_code=404, detail="Image not found")


@app.get(
    "/events/",
    response_model=List[
        Union[
            Event,
            FeedingEvent,
            PoopEvent,
            SpitUpEvent,
            BreastFeedingEvent,
            MilestoneEvent,
            OtherEvent,
            BathEvent,
            WeightRecordedEvent,
            IncompleteFeedingEvent,
        ]
    ],
)
async def get_events(
    limit: Optional[int] = Query(
        None, description="Number of most recent events to return"
    ),
    event_type: Optional[str] = Query(None, description="Type of events to return"),
):
    events = load_events()

    # Filter events by type if specified
    if event_type:
        events = [event for event in events if event.event_type == event_type]

    # Sort events by timestamp in reverse order
    sorted_events = sorted(events, key=lambda x: x.timestamp, reverse=True)

    if limit:
        sorted_events = sorted_events[:limit]

    df_interpoop = add_interpoop_stats(events_dataframe())

    for e in sorted_events:
        if e.event_type == "poop":
            try:
                interpoop = df_interpoop[df_interpoop.timestamp == e.timestamp].iloc[0]
            except IndexError:
                interpoop = None
            if interpoop is not None:
                e.time_since_last_poop = str(interpoop.time_since_last_poop)
                e.total_oz_since_last_poop = interpoop.total_oz_since_last_poop

        # Include image URLs in the response
        event_images_dir = IMAGES_DIR / e.id
        picture_links = (
            [e.picture_link] if hasattr(e, "picture_link") and e.picture_link else []
        )
        if event_images_dir.exists():
            picture_links += [
                f"/images/{e.id}/{img.name}" for img in event_images_dir.iterdir()
            ]
        e.picture_links = picture_links

    return sorted_events


@app.delete("/events/{id}")
async def delete_event(id: str):
    try:
        # Attempt to find and remove the event with the given ID
        lines = []
        with open(DATA_FILE, "r") as file:
            for line in file:
                if id in line:
                    line = DELETED_INDICATOR + line
                lines.append(line)
        update_data_file(lines, DATA_FILE)
        return {"success": True, "msg": "Event deleted"}
    except Exception as e:
        logging.exception(e)
        raise HTTPException(status_code=500, detail="Failed to delete event")


@app.get("/events/cumulative-history-plot", response_class=HTMLResponse)
async def get_cumulative_history_plot(tz: str, milkOz: float):
    df = events_dataframe()
    logging.info("Plotting df %s", df.info())

    fig = cumulative_history_plot(tz=tz, oz_per_15_minutes_boobs=milkOz, df=df)
    html = fig.to_html(include_plotlyjs="cdn", full_html=True)
    return html


@app.get("/events/interpoop-evolution-plot", response_class=HTMLResponse)
async def get_interpoop_evolution_plot(tz: str):
    df = events_dataframe()
    logging.info("Plotting df %s", df.info())

    fig = interpoop_evolution_plot(df, tz)
    html = fig.to_html(include_plotlyjs="cdn", full_html=True)
    return html
