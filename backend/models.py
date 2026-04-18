import uuid
from sqlalchemy import Column, String, Date, DateTime, Boolean, Text
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

class OTPVerification(Base):
    __tablename__ = "otp_verifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(200), unique=True, index=True, nullable=False)
    otp_code = Column(String(10), nullable=False)
    expires_at = Column(DateTime, nullable=False)
