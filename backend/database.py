from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

# Database configuration
DATABASE_URL = "sqlite:///./scholar_ai.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
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
    chinese = Column(String, nullable=False)
    english = Column(String, nullable=False)
    note = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    user = relationship("User", back_populates="glossary_terms")

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
