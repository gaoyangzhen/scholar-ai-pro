import sys
import os

# Add parent directory to sys.path for Vercel
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the FastAPI app from backend_server
from backend_server import app

# This is the entry point for Vercel Serverless Functions
# Vercel looks for a variable named 'app' or 'handler'
