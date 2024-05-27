import subprocess


from fastapi import FastAPI, HTTPException
from subprocess import run, CalledProcessError
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # anti-pattern; just using this to avoid config
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/webcam/restart")
async def restart_webcam_service():
    try:
        # Run the system command to restart the webcam service
        result = run(
            ["sudo", "systemctl", "restart", "babymonitor.service"],
            check=True,
            capture_output=True,
            text=True,
        )
        result = run(
            ["sudo", "systemctl", "restart", "motioneye.service"],
            check=True,
            capture_output=True,
            text=True,
        )
        return {
            "status": "success",
            "message": "Webcam service restarted successfully",
            "output": result.stdout,
        }
    except CalledProcessError as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to restart webcam service: {e.stderr}"
        )


@app.get("/webcam/")
async def webcam_status():
    try:
        # Run the system command to restart the webcam service
        assert is_service_active("babymonitor.service")
        logs = get_service_logs()
        success = False
        for line in logs:
            if "Opening" in line and "segment" in line:
                success = True
                break
        return {"status": success, "logs": logs}
    except CalledProcessError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get status of webcam service: {e.stderr}",
        )


def get_service_logs(service_name="babymonitor.service", lines=20):
    # Use subprocess to run the journalctl command
    result = subprocess.run(
        ["journalctl", "-u", service_name, "-n", str(lines)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )

    if result.returncode == 0:
        return result.stdout
    else:
        return f"Failed to get logs: {result.stderr}"


def is_service_active(service_name="babymonitor.service") -> bool:
    result = subprocess.run(
        ["systemctl", "is-active", service_name],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    if result.returncode == 0:
        return result.stdout.strip() == "active"
    else:
        return False


# Other routes and logic...

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8123)
