import uuid
from sqlalchemy import Column, String, Date, DateTime, Boolean, Text, Enum
import enum
from sqlalchemy.dialects.postgresql import UUID
from database import Base
import datetime

class UserRegistry(Base):
    __tablename__ = "registries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(100), nullable=False)
    paternal_name = Column(String(100), nullable=False)
    maternal_name = Column(String(100), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    secretary = Column(String(200), nullable=False)
    position = Column(String(200), nullable=False)
    phone = Column(String(50), nullable=False)
    email = Column(String(200), unique=True, index=True, nullable=False)
    social_media = Column(String(200), nullable=True)
    address = Column(String(500), nullable=False)
    latitude = Column(String(100), nullable=True)
    longitude = Column(String(100), nullable=True)
    zip_code = Column(String(20), nullable=False)
    
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Admin(Base):
    __tablename__ = "admins"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(200), unique=True, index=True, nullable=False)
    hashed_password = Column(String(300), nullable=False)
    role = Column(String(20), default="ADMIN", nullable=False)  # ADMIN | DEV

class ActionType(str, enum.Enum):
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    admin_email = Column(String(200), nullable=False, index=True)
    action = Column(String(20), nullable=False)  # CREATE, UPDATE, DELETE
    citizen_id = Column(String(100), nullable=False)
    citizen_name = Column(String(300), nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
