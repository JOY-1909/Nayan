import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.getenv("SUPABASE_URL", "https://vikjfvifgiiffvzayvws.supabase.co")
key: str = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpa2pmdmlmZ2lpZmZ2emF5dndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NzgyODIsImV4cCI6MjA4MjA1NDI4Mn0.Iga2C2h5cAXGfZbG2zb2lVkVKoyaByzgD_y-VdFRBDs")

try:
    supabase: Client = create_client(url, key)
except Exception as e:
    print(f"Warning: Failed to initialize Supabase client ({e}). Falling back to local storage.")
    supabase = None

