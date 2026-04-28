import uuid
from sqlalchemy import Column, String, Date, DateTime, Boolean, Text, Enum, BigInteger, ForeignKey
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
    email = Column(String(200), index=True, nullable=False) # Unique constraint removed to support logical deletes (validation handled in logic)
    social_media = Column(String(200), nullable=True)
    address = Column(String(500), nullable=False)
    latitude = Column(String(100), nullable=True)
    longitude = Column(String(100), nullable=True)
    zip_code = Column(String(20), nullable=False)
    ine_front_url = Column(String(500), nullable=True)
    ine_back_url = Column(String(500), nullable=True)
    observation = Column(Text, nullable=True)
    
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

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

class PdfFolder(Base):
    __tablename__ = "pdf_folders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(255), nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("pdf_folders.id"), nullable=True)  # null = root
    created_by = Column(String(200), nullable=False)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class PdfFile(Base):
    __tablename__ = "pdf_files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    original_name = Column(String(500), nullable=False)
    stored_name = Column(String(500), nullable=False)  # UUID-based name on disk
    file_path = Column(String(1000), nullable=False)    # full path on disk
    file_size = Column(BigInteger, nullable=False)       # bytes
    folder_id = Column(UUID(as_uuid=True), ForeignKey("pdf_folders.id"), nullable=True)  # null = root
    uploaded_by = Column(String(200), nullable=False)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class LibraryFolder(Base):
    __tablename__ = "library_folders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(255), nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("library_folders.id"), nullable=True)  # null = root
    created_by = Column(String(200), nullable=False)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class LibraryFile(Base):
    __tablename__ = "library_files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    original_name = Column(String(500), nullable=False)
    stored_name = Column(String(500), nullable=False)  # UUID-based name on disk
    file_path = Column(String(1000), nullable=False)    # full path on disk
    file_size = Column(BigInteger, nullable=False)       # bytes
    folder_id = Column(UUID(as_uuid=True), ForeignKey("library_folders.id"), nullable=True)  # null = root
    uploaded_by = Column(String(200), nullable=False)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
