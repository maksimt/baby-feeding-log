from fastapi import FastAPI, HTTPException
from models import Event
from fastapi.middleware.cors import CORSMiddleware

import json
from typing import List
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
def create_event(event: Event):
    try:
        with open(DATA_FILE, "a") as file:
            file.write(event.json() + "\n")
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def load_events():
    events = []
    try:
        with open(DATA_FILE, 'r') as file:
            for line in file:
                event_data = json.loads(line)
                events.append(Event(**event_data))
    except FileNotFoundError:
        print(f"Warning: {DATA_FILE} not found.")
    except Exception as e:
        print(f"Error reading {DATA_FILE}: {str(e)}")
    return events

@app.get("/events/", response_model=List[Event])
async def get_events():
    events = load_events()
    # Sort events by timestamp in reverse order and return the first 100
    return sorted(events, key=lambda x: x.timestamp, reverse=True)[:100]

