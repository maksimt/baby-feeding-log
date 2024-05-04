from fastapi import FastAPI, HTTPException
from models import FeedingEvent
from fastapi.middleware.cors import CORSMiddleware

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

@app.post("/add-feeding/")
def add_feeding(feeding: FeedingEvent):
    try:
        with open(DATA_FILE, "a") as file:
            file.write(feeding.json() + "\n")
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
