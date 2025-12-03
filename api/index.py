import sys
import os

# Add backend directory to sys.path for Vercel
backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
sys.path.insert(0, backend_path)

# Import the FastAPI app from backend_server
from backend_server import app

# This is required for Vercel to find the app instance
