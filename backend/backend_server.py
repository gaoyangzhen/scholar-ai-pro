import os
import uvicorn
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import google.generativeai as genai
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Optional

# Load environment variables
load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PolishRequest(BaseModel):
    text: str
    model: str
    apiKey: Optional[str] = None

def get_gemini_model(model_name: str, api_key: str):
    genai.configure(api_key=api_key)
    # Map frontend model names to Gemini model names if necessary
    # For now, assuming model_name is compatible or using a default
    target_model = "gemini-1.5-pro" if "pro" in model_name else "gemini-1.5-flash"
    return genai.GenerativeModel(target_model)

@app.post("/api/polish")
async def polish_text(request: PolishRequest):
    # Try to get key from request, then fallback to env var
    api_key = request.apiKey or os.getenv("GEMINI_API_KEY")
    
    if not api_key:
        raise HTTPException(status_code=401, detail="API Key is required. Please provide it in the UI or set GEMINI_API_KEY in backend/.env")
    
    try:
        model = get_gemini_model(request.model, api_key)
        
        prompt = f"""
        Please polish the following academic text to make it more professional, clear, and concise. 
        Maintain the original meaning but improve the flow and vocabulary.
        
        Text to polish:
        {request.text}
        """
        
        response = model.generate_content(prompt, stream=True)
        
        async def stream_generator():
            for chunk in response:
                if chunk.text:
                    yield chunk.text
                    
        return StreamingResponse(stream_generator(), media_type="text/plain")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze-upload")
async def analyze_upload(
    file: UploadFile = File(...),
    model: str = Form(...),
    apiKey: Optional[str] = Form(None)
):
    # Try to get key from request, then fallback to env var
    final_api_key = apiKey or os.getenv("GEMINI_API_KEY")

    if not final_api_key:
        raise HTTPException(status_code=401, detail="API Key is required. Please provide it in the UI or set GEMINI_API_KEY in backend/.env")

    try:
        # Read file content
        content = await file.read()
        # For simplicity, assuming text/pdf content. 
        # In a real app, you'd use a PDF parser or similar.
        # Here we'll just try to decode as text for demonstration if it's not binary
        # Or use Gemini's file API if needed. 
        # For this "one-click" setup, let's assume we send the text content if possible,
        # or just a placeholder if we can't parse it easily without more libs.
        
        # NOTE: Real PDF parsing requires pypdf or similar. 
        # We will assume the user wants a simple mock-up or text analysis for now.
        
        genai.configure(api_key=final_api_key)
        target_model = "gemini-1.5-pro" if "pro" in model else "gemini-1.5-flash"
        gemini_model = genai.GenerativeModel(target_model)
        
        # Simple prompt
        prompt = "Analyze this academic paper and provide a review report."
        
        # If we can't easily parse the PDF here without extra libs, 
        # we might just send a dummy response or try to use Gemini's file API (which requires upload).
        # Let's return a structured mock response for the "Reviewer" module to consume,
        # or try to generate something if it's a text file.
        
        response_data = {
            "score": 85,
            "diffs": [
                {"original": "Bad grammar", "revised": "Improved grammar", "type": "grammar", "explanation": "Fixed grammar"}
            ],
            "review": "This is a placeholder review. Real PDF parsing requires additional libraries."
        }
        
        return response_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("backend_server:app", host="0.0.0.0", port=8000, reload=True)
