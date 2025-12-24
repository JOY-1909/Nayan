from fastapi import APIRouter, WebSocket, HTTPException
from helpers.dataProcessing import DataProcessor
import json
from fastapi.responses import JSONResponse
from workers.alerts_DB import alertsDB
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class AlertCreate(BaseModel):
    type: str
    message: str
    source: Optional[str] = "System"
    location: Optional[dict] = None

@router.get("/")
async def getAlerts():
    alerts = alertsDB.getAlerts()
    return JSONResponse(content={"data": alerts})

@router.post("/create")
async def createAlert(alert: AlertCreate):
    """Create a new alert - used by gesture detection and other sources"""
    try:
        alert_data = {
            "type": alert.type,
            "message": alert.message,
            "source": alert.source,
            "location": alert.location
        }
        result = alertsDB.insertAlerts(alert_data)
        if result:
            return JSONResponse(content={"success": True, "message": "Alert created successfully"})
        else:
            raise HTTPException(status_code=500, detail="Failed to create alert")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating alert: {str(e)}")

@router.post("/read")
async def updateReadStatus(id: int):
    try:
        alertsDB.updateReadStatus(id)
        return JSONResponse(content={"data": "Updated successfully"})
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update read status: " + str(e))

@router.post("/complaint")
async def complaint(complaintData: dict):
    alertsDB.addComplaint(complaintData)
    return JSONResponse(content={"success": True})

@router.get("/get-complaints")
async def getComplaints():
    comps = alertsDB.getComplaints()
    return JSONResponse(content={"data": comps})
