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
        import pdfplumber
        import io
        
        # Read file content
        content = await file.read()
        full_text = ""
        pages_analyzed = 0
        
        # Parse PDF content
        if file.filename.endswith('.pdf'):
            try:
                with pdfplumber.open(io.BytesIO(content)) as pdf:
                    pages_analyzed = len(pdf.pages)
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            full_text += page_text + "\n\n"
                
                print(f"[INFO] Extracted {len(full_text)} characters from {pages_analyzed} pages")
            except Exception as pdf_error:
                print(f"[WARNING] PDF parsing failed: {pdf_error}")
                raise HTTPException(status_code=400, detail=f"PDF parsing failed: {str(pdf_error)}")
        
        # Parse text files
        elif file.filename.endswith(('.txt', '.md')):
            full_text = content.decode('utf-8', errors='ignore')
            pages_analyzed = 1
        
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, TXT, or MD files.")
        
        if not full_text.strip():
            raise HTTPException(status_code=400, detail="No text content found in the document.")
        
        # Configure Gemini
        import google.generativeai as genai
        genai.configure(api_key=final_api_key)
        target_model = "gemini-1.5-pro" if "pro" in model else "gemini-1.5-flash"
        gemini_model = genai.GenerativeModel(target_model)
        
        # Create comprehensive review prompt
        prompt = f"""You are an expert reviewer for top-tier academic journals (e.g., Nature, Science, IEEE).

Please review this academic paper comprehensively:

Document Statistics:
- Total Characters: {len(full_text)}
- Total Words: {len(full_text.split())}
- Total Pages: {pages_analyzed}

Full Document Content:
{full_text[:100000]}

Please provide:
1. Overall Score (0-100)
2. Detailed review covering:
   - Novelty & Contribution
   - Methodology Rigor
   - Results & Discussion Quality
   - Language & Structure
3. Specific improvement suggestions with line/section references

Confirm you have read the ENTIRE document by mentioning specific content from different sections."""
        
        # Generate AI review
        response = gemini_model.generate_content(prompt)
        
        # Parse response (simplified - in production you'd want better parsing)
        review_text = response.text
        
        # Extract score (basic pattern matching - improve in production)
        score = 85  # Default if not found
        import re
        score_match = re.search(r'(?:score|rating):\s*(\d+)', review_text, re.IGNORECASE)
        if score_match:
            score = int(score_match.group(1))
        
        response_data = {
            "score": score,
            "review": review_text,
            "pages_analyzed": pages_analyzed,
            "word_count": len(full_text.split()),
            "character_count": len(full_text),
            "diffs": [],  # You can enhance this to extract specific suggestions
            "metadata": {
                "filename": file.filename,
                "model_used": target_model,
                "analysis_complete": True
            }
        }
        
        return response_data

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("backend_server:app", host="0.0.0.0", port=8000, reload=True)
