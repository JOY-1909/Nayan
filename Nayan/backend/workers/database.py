import os
from supabase import create_client, Client

url: str = "https://vikjfvifgiiffvzayvws.supabase.co"
key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpa2pmdmlmZ2lpZmZ2emF5dndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NzgyODIsImV4cCI6MjA4MjA1NDI4Mn0.Iga2C2h5cAXGfZbG2zb2lVkVKoyaByzgD_y-VdFRBDs"

supabase: Client = create_client(url, key)

