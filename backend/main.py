from fastapi import FastAPI, HTTPException
from models import FeedingEvent
import json

app = FastAPI()

DATA_FILE = "../data/feedings.jsonl"

@app.post("/add-feeding/")
def add_feeding(feeding: FeedingEvent):
    try:
        with open(DATA_FILE, "a") as file:
            file.write(feeding.json() + "\n")
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
