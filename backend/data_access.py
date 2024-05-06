import logging
import os
import shutil
import tempfile
import pandas as pd


import json

from models import create_event_object

DELETED_INDICATOR = "#"
DATA_FILE = "/app/data/feedings.jsonl"


def events_dataframe() -> pd.DataFrame:
    records = []
    with open(DATA_FILE, "r") as file:
        for line in file:
            if line.startswith(DELETED_INDICATOR):
                continue
            records.append(json.loads(line))
    df = pd.DataFrame.from_records(records)
    return df


def update_data_file(lines, data_file_path):
    # Step 1: Write to a temporary file
    with tempfile.NamedTemporaryFile(mode="w", delete=False) as tmp_file:
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


def load_events():
    events = []
    try:
        with open(DATA_FILE, "r") as file:
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
