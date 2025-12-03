from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

import os

# Database configuration
# Database configuration
# Check for POSTGRES_URL (Vercel Postgres default) or DATABASE_URL
# Fallback to SQLite: use /tmp on Vercel (read-only FS), otherwise local file
if os.environ.get("VERCEL"):
    DEFAULT_SQLITE = "sqlite:////tmp/scholar_ai.db"
else:
    DEFAULT_SQLITE = "sqlite:///./scholar_ai.db"

DATABASE_URL = os.getenv("POSTGRES_URL") or os.getenv("DATABASE_URL") or DEFAULT_SQLITE

# Handle Postgres URL format for SQLAlchemy (postgres:// -> postgresql://)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Connect args: check_same_thread is only for SQLite
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# User model
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    history_records = relationship("HistoryRecord", back_populates="user")
    glossary_terms = relationship("GlossaryTerm", back_populates="user")
    reference_documents = relationship("ReferenceDocument", back_populates="user")

# History record model
class HistoryRecord(Base):
    __tablename__ = "history_records"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)  # 'review' or 'editor'
    title = Column(String, nullable=False)
    content = Column(JSON, nullable=True)  # Store full analysis data
    score = Column(Integer, nullable=True)
    words = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    user = relationship("User", back_populates="history_records")

# Glossary term model
class GlossaryTerm(Base):
    __tablename__ = "glossary_terms"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    source = Column(String, nullable=False)
    target = Column(String, nullable=False)
    category = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    user = relationship("User", back_populates="glossary_terms")

# Reference document model
class ReferenceDocument(Base):
    __tablename__ = "reference_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)  # Path to stored file
    file_type = Column(String, nullable=False)  # pdf, txt, md
    upload_date = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    user = relationship("User", back_populates="reference_documents")

# Create all tables
def init_db():
    Base.metadata.create_all(bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
