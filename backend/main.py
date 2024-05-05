import tempfile
import shutil
import os

import pandas as pd

from fastapi import FastAPI, HTTPException, Request
from models import Event, FeedingEvent, PoopEvent, SpitUpEvent, create_event_object
from fastapi.middleware.cors import CORSMiddleware
import plotly.graph_objects as go
from fastapi.responses import HTMLResponse
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


@app.get("/events/cumulative-history-plot", response_class=HTMLResponse)
async def get_cummulative_history_plot(tz: str):
    # Create an empty figure
    df = events_dataframe()
    logging.info("Plotting df %s", df.info())

    # Filter for 'feeding' events
    df_feeding = df[df['event_type'] == 'feeding']

    # Convert timestamps to datetime and extract date and hour
    df_feeding['datetime'] = pd.to_datetime(df_feeding['timestamp'], unit='s', utc=True).dt.tz_convert(tz)
    df_feeding['date'] = df_feeding['datetime'].dt.date
    df_feeding['hour'] = df_feeding['datetime'].dt.hour

    df_feeding = df_feeding.sort_values(by=['date', 'hour'])

    # Group by date and hour, then calculate the cumulative sum of amount_oz
    df_feeding['cumulative_amount'] = df_feeding.groupby(['date'])['amount_oz'].cumsum()

    # Filter for the most recent 7 days
    max_date = df_feeding['date'].max()
    min_date = max_date - pd.Timedelta(days=6)
    df_feeding = df_feeding[(df_feeding['date'] >= min_date) & (df_feeding['date'] <= max_date)]

    # Create a plot
    fig = go.Figure()

    for date in df_feeding['date'].unique():
        df_date = df_feeding[df_feeding['date'] == date].sort_values('hour')
        fig.add_trace(go.Scatter(x=df_date['hour'], y=df_date['cumulative_amount'], mode='lines+markers', name=str(date)))

    fig.update_layout(
        title='Cumulative Feeding Amount by Hour of Day',
        xaxis_title=f'Hour of Day ({tz})',
        yaxis_title='Cumulative Amount (oz)',
        legend_title=f'Date ({tz})'
    )
    
    # You can customize your figure here with data and layout
    html = fig.to_html(include_plotlyjs='cdn', full_html=True)
    logging.info(f"Generated HTML length: {len(html)} bytes")
    # Return the HTML representation of the figure
    return html

def events_dataframe() -> pd.DataFrame:
    records = []
    with open(DATA_FILE, 'r') as file:
        for line in file:
            if line.startswith(DELETED_INDICATOR):
                continue
            records.append(json.loads(line))
    df = pd.DataFrame.from_records(records)
    return df
