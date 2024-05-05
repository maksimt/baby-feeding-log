from fastapi import FastAPI, HTTPException, Request
from models import Event, FeedingEvent, PoopEvent, SpitUpEvent, create_event_object
from fastapi.middleware.cors import CORSMiddleware

import json
from typing import List, Union
import logging
from fastapi import FastAPI, HTTPException

app = FastAPI()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

@app.exception_handler(Exception)
async def exception_handler(request, exc):
    logging.error("Unhandled exception occurred", exc_info=True)
    return {"detail": "An internal error occurred."}

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://10.154.71.199:7988"],  # URL of the frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = "/app/data/feedings.jsonl"

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

def load_events():
    events = []
    try:
        with open(DATA_FILE, 'r') as file:
            for line in file:
                event_data = json.loads(line)
                events.append(create_event_object(event_data))
    except FileNotFoundError:
        print(f"Warning: {DATA_FILE} not found.")
    except Exception as e:
        print(f"Error reading {DATA_FILE}: {str(e)}")
    return events

@app.get("/events/", response_model=List[Union[Event,FeedingEvent,PoopEvent,SpitUpEvent]])
async def get_events():
    events = load_events()
    # Sort events by timestamp in reverse order and return the first 100
    return sorted(events, key=lambda x: x.timestamp, reverse=True)[:100]

