FROM python:3.9-slim

WORKDIR /app
COPY backend/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/*.py /app/
COPY data/* /data/

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]
