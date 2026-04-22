from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import date, datetime
from uuid import UUID

class RegistryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    paternal_name: str = Field(..., min_length=1, max_length=100)
    maternal_name: str = Field(..., min_length=1, max_length=100)
    date_of_birth: date
    secretary: str = Field(..., min_length=1, max_length=200)
    position: str = Field(..., min_length=1, max_length=200)
    phone: str = Field(..., min_length=7, max_length=50)
    email: EmailStr
    social_media: Optional[str] = None
    address: str = Field(..., min_length=5, max_length=500)
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    zip_code: str = Field(..., min_length=2, max_length=20)

class RegistryCreate(RegistryBase):
    pass

class RegistryUpdate(RegistryBase):
    pass

class RegistryResponse(RegistryBase):
    id: UUID
    is_deleted: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
