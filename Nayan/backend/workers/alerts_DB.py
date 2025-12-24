from workers.database import supabase
import json
import os
from datetime import datetime

# Path for local alerts storage as fallback
ALERTS_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "alerts.json")
COMPLAINTS_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "complaints.json")

def ensure_data_dir():
    """Ensure the data directory exists"""
    data_dir = os.path.dirname(ALERTS_FILE)
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)

def load_local_alerts():
    """Load alerts from local JSON file"""
    ensure_data_dir()
    if os.path.exists(ALERTS_FILE):
        try:
            with open(ALERTS_FILE, 'r') as f:
                return json.load(f)
        except:
            return []
    return []

def save_local_alerts(alerts):
    """Save alerts to local JSON file"""
    ensure_data_dir()
    with open(ALERTS_FILE, 'w') as f:
        json.dump(alerts, f, indent=2)

def load_local_complaints():
    """Load complaints from local JSON file"""
    ensure_data_dir()
    if os.path.exists(COMPLAINTS_FILE):
        try:
            with open(COMPLAINTS_FILE, 'r') as f:
                return json.load(f)
        except:
            return []
    return []

def save_local_complaints(complaints):
    """Save complaints to local JSON file"""
    ensure_data_dir()
    with open(COMPLAINTS_FILE, 'w') as f:
        json.dump(complaints, f, indent=2)

class alertsDB:

    @staticmethod
    def getAlerts():
        """Get all alerts - uses local storage"""
        try:
            alerts = load_local_alerts()
            # Sort by timestamp, newest first
            alerts.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            return alerts
        except Exception as e:
            print(f"Error getting alerts: {e}")
            return []
    
    @staticmethod
    def insertAlerts(alert_data):
        """Insert a new alert"""
        try:
            alerts = load_local_alerts()
            # Add ID and timestamp if not present
            if 'id' not in alert_data:
                alert_data['id'] = len(alerts) + 1
            if 'timestamp' not in alert_data:
                alert_data['timestamp'] = datetime.now().isoformat()
            if 'read_status' not in alert_data:
                alert_data['read_status'] = 0
            
            alerts.append(alert_data)
            save_local_alerts(alerts)
            print(f"Alert inserted: {alert_data}")
            return True
        except Exception as e:
            print(f"Error inserting alert: {e}")
            return False
            
    @staticmethod
    def updateReadStatus(id):
        """Update read status of an alert"""
        try:
            alerts = load_local_alerts()
            for alert in alerts:
                if alert.get('id') == id:
                    alert['read_status'] = 1
            save_local_alerts(alerts)
        except Exception as e:
            print(f"Error updating read status: {e}")

    @staticmethod
    def addComplaint(complaint: dict):
        """Add a complaint"""
        try:
            complaints = load_local_complaints()
            complaint_data = {
                "id": len(complaints) + 1,
                "description": complaint.get("description", ""),
                "proof_link": complaint.get("proof_link", ""),
                "timestamp": datetime.now().isoformat(),
                "status": "pending"
            }
            complaints.append(complaint_data)
            save_local_complaints(complaints)
            return True
        except Exception as e:
            print(f"Error adding complaint: {e}")
            return False

    @staticmethod
    def getComplaints():
        """Get all complaints"""
        try:
            return load_local_complaints()
        except Exception as e:
            print(f"Error getting complaints: {e}")
            return []