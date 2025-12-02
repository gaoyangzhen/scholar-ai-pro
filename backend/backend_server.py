import os
import uvicorn
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import google.generativeai as genai
from dotenv import load_dotenv
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from sqlalchemy.orm import Session
import io
import vercel_blob

# Import database and auth modules
from database import init_db, get_db, User, HistoryRecord, GlossaryTerm, ReferenceDocument
from auth import verify_password, get_password_hash, create_access_token, verify_token

# Load environment variables
load_dotenv()

# Initialize database
init_db()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class PolishRequest(BaseModel):
    text: str
    model: str
    apiKey: Optional[str] = None

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    fullName: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class HistorySaveRequest(BaseModel):
    type: str
    title: str
    content: Optional[dict] = None
    score: Optional[int] = None
    words: Optional[int] = None

class GlossaryItemRequest(BaseModel):
    source: str
    target: str
    category: Optional[str] = None

# Helper: Get current user from token
def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.email == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

def get_gemini_model(model_name: str, api_key: str):
    genai.configure(api_key=api_key)
    # Map frontend model names to Gemini model names if necessary
    target_model = "gemini-1.5-pro" if "pro" in model_name else "gemini-1.5-flash"
    return genai.GenerativeModel(target_model)

# ===== Authentication Endpoints =====

from email_validator import validate_email, EmailNotValidError

# ... (keep existing imports)

@app.post("/api/register")
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user"""
    # 1. Strict Email Validation
    try:
        validate_email(request.email, check_deliverability=False)
    except EmailNotValidError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Check if user already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate password length
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Create new user
    hashed_password = get_password_hash(request.password)
    new_user = User(
        email=request.email,
        password_hash=hashed_password,
        full_name=request.fullName
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # NO Auto-Login: Do not return token
    return {
        "success": True,
        "message": "Registration successful. Please login."
    }

@app.post("/api/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login user"""
    # Find user
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # Create access token
    access_token = create_access_token(data={"sub": user.email})
    
    return {
        "success": True,
        "token": access_token,
        "user": {
            "email": user.email,
            "fullName": user.full_name,
            "id": user.id
        }
    }

# ===== AI Endpoints =====

# Helper: Get relevant glossary terms
def get_relevant_glossary_terms(text: str, user_id: int, db: Session) -> str:
    """Find glossary terms that appear in the text"""
    terms = db.query(GlossaryTerm).filter(GlossaryTerm.user_id == user_id).all()
    relevant_terms = []
    
    for term in terms:
        if term.source.lower() in text.lower():
            relevant_terms.append(f"{term.source} -> {term.target}")
            
    if not relevant_terms:
        return ""
        
    return "\n".join(relevant_terms)

class TranslateRequest(BaseModel):
    text: str
    targetLang: str
    model: str
    apiKey: Optional[str] = None

@app.post("/api/polish")
async def polish_text(
    request: PolishRequest, 
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    # Try to get key from request, then fallback to env var
    api_key = request.apiKey or os.getenv("GEMINI_API_KEY")
    
    if not api_key:
        raise HTTPException(status_code=401, detail="API Key is required. Please provide it in the UI or set GEMINI_API_KEY in backend/.env")
    
    # Try to get user for glossary (optional)
    glossary_context = ""
    try:
        if authorization:
            user = get_current_user(authorization, db)
            terms = get_relevant_glossary_terms(request.text, user.id, db)
            if terms:
                glossary_context = f"\n\nUse the following glossary terms:\n{terms}"
    except:
        pass # Ignore auth errors for polish, just skip glossary

    try:
        model = get_gemini_model(request.model, api_key)
        
        prompt = f"""
        Please polish the following academic text to make it more professional, clear, and concise. 
        Maintain the original meaning but improve the flow and vocabulary.{glossary_context}
        
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

@app.post("/api/translate")
async def translate_text(
    request: TranslateRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    # Try to get key from request, then fallback to env var
    api_key = request.apiKey or os.getenv("GEMINI_API_KEY")
    
    if not api_key:
        raise HTTPException(status_code=401, detail="API Key is required.")
    
    # Try to get user for glossary (optional)
    glossary_context = ""
    try:
        if authorization:
            user = get_current_user(authorization, db)
            terms = get_relevant_glossary_terms(request.text, user.id, db)
            if terms:
                glossary_context = f"\n\nUse the following glossary terms:\n{terms}"
    except:
        pass 

    try:
        model = get_gemini_model(request.model, api_key)
        
        prompt = f"""
        Please translate the following academic text to {request.targetLang}.
        Ensure accuracy and academic tone.{glossary_context}
        
        Text to translate:
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
        import pypdf
        
        # Read file content
        content = await file.read()
        full_text = ""
        pages_analyzed = 0
        
        # Parse PDF content
        if file.filename.endswith('.pdf'):
            try:
                pdf_file = io.BytesIO(content)
                reader = pypdf.PdfReader(pdf_file)
                pages_analyzed = len(reader.pages)
                
                for page in reader.pages:
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

@app.post("/api/chat-doc")
async def chat_doc(
    file: Optional[UploadFile] = File(None),
    question: str = Form(...),
    model: str = Form(...),
    apiKey: Optional[str] = Form(None)
):
    """Chat with a document"""
    final_api_key = apiKey or os.getenv("GEMINI_API_KEY")
    if not final_api_key:
        raise HTTPException(status_code=401, detail="API Key is required")

    try:
        context_text = ""
        if file:
            import pypdf
            content = await file.read()
            if file.filename.endswith('.pdf'):
                try:
                    pdf_file = io.BytesIO(content)
                    reader = pypdf.PdfReader(pdf_file)
                    for page in reader.pages:
                        text = page.extract_text()
                        if text:
                            context_text += text + "\n"
                except Exception as e:
                    print(f"PDF Error: {e}")
            elif file.filename.endswith(('.txt', '.md')):
                context_text = content.decode('utf-8', errors='ignore')
        
        # Construct prompt
        model_instance = get_gemini_model(model, final_api_key)
        
        prompt = f"""
        You are an intelligent academic assistant. 
        
        Context from document:
        {context_text[:50000]}  # Limit context size
        
        User Question: {question}
        
        Please answer the question based on the provided document context. If the answer is not in the context, use your general knowledge but mention that it's not in the document.
        """
        
        response = model_instance.generate_content(prompt)
        return response.text

    except Exception as e:
        print(f"ChatDoc Error: {e}")
        return f"Error: {str(e)}"

# ===== Glossary Endpoints =====

@app.get("/api/glossary")
async def get_glossary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all glossary terms for current user"""
    terms = db.query(GlossaryTerm).filter(GlossaryTerm.user_id == current_user.id).order_by(GlossaryTerm.created_at.desc()).all()
    return [
        {
            "id": str(t.id),
            "source": t.source,
            "target": t.target,
            "category": t.category,
            "createdAt": t.created_at.isoformat()
        }
        for t in terms
    ]

@app.post("/api/glossary")
async def add_glossary_term(
    term: GlossaryItemRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a new glossary term"""
    new_term = GlossaryTerm(
        user_id=current_user.id,
        source=term.source,
        target=term.target,
        category=term.category
    )
    db.add(new_term)
    db.commit()
    db.refresh(new_term)
    return {
        "id": str(new_term.id),
        "source": new_term.source,
        "target": new_term.target,
        "category": new_term.category,
        "createdAt": new_term.created_at.isoformat()
    }

@app.delete("/api/glossary/{term_id}")
async def delete_glossary_term(
    term_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a glossary term"""
    term = db.query(GlossaryTerm).filter(GlossaryTerm.id == term_id, GlossaryTerm.user_id == current_user.id).first()
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")
    
    db.delete(term)
    db.commit()
    return {"success": True}

# ===== References Endpoints =====

@app.get("/api/references")
async def get_references(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all reference documents for current user"""
    docs = db.query(ReferenceDocument).filter(ReferenceDocument.user_id == current_user.id).order_by(ReferenceDocument.upload_date.desc()).all()
    return [
        {
            "id": str(d.id),
            "filename": d.filename,
            "fileType": d.file_type,
            "uploadDate": d.upload_date.isoformat(),
            "size": "Unknown" # In a real app, store size
        }
        for d in docs
    ]

@app.post("/api/references/upload")
async def upload_reference(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a reference document"""
    # Upload to Vercel Blob
    try:
        content = await file.read()
        # vercel_blob.put returns { url: str, ... }
        blob = vercel_blob.put(file.filename, content, options={'access': 'public'})
        file_path = blob['url']
    except Exception as e:
        print(f"Blob upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    
    # Determine file type
    file_ext = os.path.splitext(file.filename)[1]
    file_type = file_ext.lstrip('.').lower()
    if file_type not in ['pdf', 'txt', 'md']:
        file_type = 'other'

    # Save to DB
    new_doc = ReferenceDocument(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path, # Stores the Blob URL
        file_type=file_type
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    return {
        "id": str(new_doc.id),
        "filename": new_doc.filename,
        "fileType": new_doc.file_type,
        "uploadDate": new_doc.upload_date.isoformat()
    }

@app.delete("/api/references/{doc_id}")
async def delete_reference(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a reference document"""
    doc = db.query(ReferenceDocument).filter(ReferenceDocument.id == doc_id, ReferenceDocument.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete file from Blob Storage
    if doc.file_path and doc.file_path.startswith("http"):
        try:
            vercel_blob.delete(doc.file_path)
        except Exception as e:
            print(f"Error deleting blob: {e}")
    # Fallback for old local files (optional)
    elif os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception as e:
            print(f"Error deleting local file: {e}")
    
    db.delete(doc)
    db.commit()
    return {"success": True}

# ===== User Data Endpoints =====

@app.post("/api/history/save")
async def save_history(
    request: HistorySaveRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save a history record for the current user"""
    new_record = HistoryRecord(
        user_id=current_user.id,
        type=request.type,
        title=request.title,
        content=request.content,
        score=request.score,
        words=request.words
    )
    
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    
    return {"success": True, "id": new_record.id}

@app.get("/api/history")
async def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all history records for the current user"""
    records = db.query(HistoryRecord).filter(
        HistoryRecord.user_id == current_user.id
    ).order_by(HistoryRecord.created_at.desc()).all()
    
    return {
        "records": [
            {
                "id": r.id,
                "type": r.type,
                "title": r.title,
                "date": r.created_at.isoformat(),
                "score": r.score,
                "words": r.words
            }
            for r in records
        ]
    }

if __name__ == "__main__":
    uvicorn.run("backend_server:app", host="0.0.0.0", port=8000, reload=True)
