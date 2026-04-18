from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from database import get_db
import models, schemas, utils
from jose import jwt, JWTError

router = APIRouter()

# --- Auth Dependency ---
def get_current_admin(token: str = Depends(utils.ALGORITHM), db: Session = Depends(get_db)):
    # Standard Dependency reading token from Header - For simplicity here we assume token is passed directly or decoded safely
    # If using FastAPI's OAuth2PasswordBearer, we define it here.
    pass

from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/admin/login")

def get_current_admin(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, utils.SECRET_KEY, algorithms=[utils.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    admin = db.query(models.Admin).filter(models.Admin.email == email).first()
    if admin is None:
        raise credentials_exception
    return admin

# --- Public Endpoints ---

@router.post("/register", response_model=schemas.RegistryResponse)
def register(req: schemas.RegistryCreate, db: Session = Depends(get_db)):
    # Ensure no duplicates via email
    existing_user = db.query(models.UserRegistry).filter(
        models.UserRegistry.email == req.email, 
        models.UserRegistry.is_deleted == False
    ).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="El correo ya se encuentra registrado.")
    
    new_registry = models.UserRegistry(**req.dict())
    db.add(new_registry)
    db.commit()
    db.refresh(new_registry)
    
    return new_registry

# --- Admin Endpoints ---

@router.post("/admin/login")
def admin_login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    admin = db.query(models.Admin).filter(models.Admin.email == req.email).first()
    if not admin or not utils.verify_password(req.password, admin.hashed_password):
         raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    token = utils.create_access_token(data={"sub": admin.email})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/admin/records", response_model=list[schemas.RegistryResponse])
def get_all_records(db: Session = Depends(get_db), current_admin: models.Admin = Depends(get_current_admin)):
    records = db.query(models.UserRegistry).filter(models.UserRegistry.is_deleted == False).all()
    return records

@router.put("/admin/records/{record_id}", response_model=schemas.RegistryResponse)
def update_record(record_id: str, payload: schemas.RegistryUpdate, db: Session = Depends(get_db), current_admin: models.Admin = Depends(get_current_admin)):
    record = db.query(models.UserRegistry).filter(models.UserRegistry.id == record_id).first()
    if not record or record.is_deleted:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
        
    for key, value in payload.dict().items():
        setattr(record, key, value)
    
    db.commit()
    db.refresh(record)
    return record

@router.delete("/admin/records/{record_id}")
def delete_record(record_id: str, db: Session = Depends(get_db), current_admin: models.Admin = Depends(get_current_admin)):
    record = db.query(models.UserRegistry).filter(models.UserRegistry.id == record_id).first()
    if not record or record.is_deleted:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
        
    record.is_deleted = True
    db.commit()
    return {"message": "Registro eliminado lógicamente"}
