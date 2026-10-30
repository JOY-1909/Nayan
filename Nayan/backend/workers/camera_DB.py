from workers.database import supabase
import os
import json

CAMERAS_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "cameras.json")

def load_local_cameras():
    """Load cameras from local JSON file as fallback"""
    if os.path.exists(CAMERAS_FILE):
        try:
            with open(CAMERAS_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading local cameras: {e}")
            return []
    return []

def save_local_cameras(cameras):
    """Save cameras to local JSON file"""
    try:
        with open(CAMERAS_FILE, 'w') as f:
            json.dump(cameras, f, indent=4)
    except Exception as e:
        print(f"Error saving local cameras: {e}")

class cameraDB:

    @staticmethod
    def getActiveCamera():
        # Query the camera table for rows where status is 'A'
        try:
            response = supabase.table("camera").select("*").eq("status", "A").execute()
            if response and response.data:
                return response.data
        except Exception as e:
            print(f"Supabase unavailable for getActiveCamera, using local fallback: {e}")
        
        cameras = load_local_cameras()
        return [c for c in cameras if c.get("status") == "A"]
    
    @staticmethod
    def updateCameraStatus():
        # Update the status of all cameras to 'X'
        try:
            response = supabase.table("camera").update({"status": "X"}).neq("status", "X").execute()
            if response:
                print("Camera status updated successfully.")
                return
        except Exception as e:
            print(f"Supabase unavailable for updateCameraStatus, using local fallback: {e}")
        
        cameras = load_local_cameras()
        for c in cameras:
            c["status"] = "X"
        save_local_cameras(cameras)

    @staticmethod
    def getAllCameras():
        # Query the camera table
        try:
            response = supabase.table("camera").select("*").execute()
            if response and response.data:
                print("Cameras from Supabase:", response.data)
                return response.data
        except Exception as e:
            print(f"Supabase unavailable for getAllCameras, using local fallback: {e}")
        
        cameras = load_local_cameras()
        print("Cameras from local JSON fallback:", cameras)
        return cameras

    @staticmethod
    def addCamera(camera_data):
        # Add a new camera to the database
        camera_record = {
            "Name": camera_data.get("nickName", ""),
            "modelNo": camera_data.get("modelNo", ""),
            "brand": camera_data.get("brand", ""),
            "ipAddress": camera_data.get("ipAddress", ""),
            "link": camera_data.get("link") or f"http://{camera_data.get('ipAddress', '')}/video",
            "lat": camera_data.get("latitude", ""),
            "lon": camera_data.get("longitude", ""),
            "camUsername": camera_data.get("camUsername", ""),
            "camPassword": camera_data.get("camPassword", ""),
            "status": "A"
        }
        try:
            response = supabase.table("camera").insert(camera_record).execute()
            if response and response.data:
                print("Camera added to Supabase:", response.data)
                return response.data
        except Exception as e:
            print(f"Supabase unavailable for addCamera, saving to local JSON: {e}")
        
        cameras = load_local_cameras()
        camera_record["id"] = (max([c.get("id", 0) for c in cameras] or [0])) + 1
        cameras.append(camera_record)
        save_local_cameras(cameras)
        print("Camera added to local fallback:", camera_record)
        return [camera_record]

