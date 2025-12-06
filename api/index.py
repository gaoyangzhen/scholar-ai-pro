import sys
import os

# Add backend directory to sys.path for Vercel
# Go up one level from 'api' to root, then into 'backend'
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_path = os.path.join(root_dir, 'backend')
sys.path.insert(0, backend_path)

# Import the FastAPI app from backend_server
from backend_server import app

# This is required for Vercel to find the app instance
