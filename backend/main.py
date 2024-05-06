from plots import cumulative_history_plot
from data_access import (
    DATA_FILE,
    DELETED_INDICATOR,
    events_dataframe,
    load_events,
    update_data_file,
)
from fastapi import FastAPI, HTTPException, Request
from models import Event, FeedingEvent, PoopEvent, SpitUpEvent
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import json
from typing import List, Union
import logging
from fastapi import FastAPI, HTTPException

app = FastAPI()

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)


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
        logging.info("Got event %s", json_value)
        with open(DATA_FILE, "a") as file:
            file.write(json.dumps(json_value) + "\n")
        return {"success": True}
    except Exception as e:
        logging.exception(e)
        raise HTTPException(status_code=500, detail=str(e))


@app.get(
    "/events/", response_model=List[Union[Event, FeedingEvent, PoopEvent, SpitUpEvent]]
)
async def get_events():
    events = load_events()
    # Sort events by timestamp in reverse order and return the first 100
    return sorted(events, key=lambda x: x.timestamp, reverse=True)[:100]


@app.delete("/events/{timestamp}")
async def delete_event(timestamp: str):
    try:
        # Attempt to find and remove the event with the given timestamp
        lines = []
        with open(DATA_FILE, "r") as file:
            for line in file:
                if timestamp in line:
                    line = DELETED_INDICATOR + line
                lines.append(line)
        update_data_file(lines, DATA_FILE)
        return {"success": True, "msg": "Event deleted"}
    except Exception as e:
        # Log error, handle or raise more specific exceptions as needed
        print(f"An error occurred: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete event")


# Define colors for each day of the week
@app.get("/events/cumulative-history-plot", response_class=HTMLResponse)
async def get_cumulative_history_plot(tz: str):
    # Create an empty figure
    df = events_dataframe()
    logging.info("Plotting df %s", df.info())

    fig = cumulative_history_plot(tz, df)

    # You can customize your figure here with data and layout
    html = fig.to_html(include_plotlyjs="cdn", full_html=True)
    logging.info(f"Generated HTML length: {len(html)} bytes")
    # Return the HTML representation of the figure
    return html
