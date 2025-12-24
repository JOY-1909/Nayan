from fastapi import APIRouter, WebSocket
from helpers.dataProcessing import DataProcessor
import json
from fastapi.responses import JSONResponse
from workers.camera_DB import cameraDB
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class CameraInput(BaseModel):
    modelNo: str
    brand: str
    ipAddress: str
    nickName: str
    camUsername: Optional[str] = ""
    camPassword: Optional[str] = ""
    imageLink: Optional[str] = ""
    latitude: str
    longitude: str
    link: Optional[str] = ""

@router.get("/getCameras")
async def getAllCameras():
    try:
    # Await the asynchronous method call
        cameras = cameraDB.getAllCameras()
        return JSONResponse(content={"data": cameras})
    except Exception as e:
        print("error in getAllcameras",e)

@router.post("/addCamera")
async def addCamera(camera: CameraInput):
    try:
        result = cameraDB.addCamera(camera.dict())
        return JSONResponse(content={"success": True, "message": "Camera added successfully", "data": result})
    except Exception as e:
        print("error in addCamera", e)
        return JSONResponse(content={"success": False, "message": str(e)}, status_code=500)
