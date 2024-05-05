import tempfile
import shutil
import os

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

DELETED_INDICATOR = '#'

def load_events():
    events = []
    try:
        with open(DATA_FILE, 'r') as file:
            for line in file:
                if line.startswith(DELETED_INDICATOR):
                    continue
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

@app.delete("/events/{timestamp}")
async def delete_event(timestamp: str):
    try:
        # Attempt to find and remove the event with the given timestamp
        lines = []
        with open(DATA_FILE, 'r') as file:
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
    
def update_data_file(lines, data_file_path):
    # Step 1: Write to a temporary file
    with tempfile.NamedTemporaryFile(mode='w', delete=False) as tmp_file:
        tmp_file.writelines(lines)
        temp_file_path = tmp_file.name  # Store temporary file name
    
    # Step 2: Replace the old file with the new temporary file
    try:
        shutil.move(temp_file_path, data_file_path)
        logging.info(f"Successfully updated the data file at {data_file_path}")
    except Exception as e:
        # If the move operation fails, remove the temp file
        os.remove(temp_file_path)
        logging.info(f"Failed to update the data file: {e}")
        raise
