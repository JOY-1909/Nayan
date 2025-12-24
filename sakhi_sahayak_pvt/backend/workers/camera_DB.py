from workers.database import supabase

class cameraDB:

    @staticmethod
    def getActiveCamera():
        # Query the camera table for rows where status is 'A'
        response = supabase.table("camera").select("*").eq("status", "A").execute()
        print(response.data)
        return response.data
    
    @staticmethod
    def updateCameraStatus():
        # Update the status of all cameras to 'X'
        response = supabase.table("camera").update({"status": "X"}).neq("status", "X").execute()
        
        if response:
            print("Camera status updated successfully.")
        else:
            print(f"Failed to update camera status: {response.error_message}")

    @staticmethod
    def getAllCameras():
        # Query the camera table
        response = supabase.table("camera").select("*").execute()
        print("Cameras from Supabase:", response.data)
        return response.data

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
        response = supabase.table("camera").insert(camera_record).execute()
        print("Camera added:", response.data)
        return response.data
