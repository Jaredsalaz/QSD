from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from database import get_db
import models, schemas, utils
from jose import jwt, JWTError
from typing import List

router = APIRouter()

# --- Auth Dependency ---
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

# --- Helper: Log Action ---
def log_action(db: Session, admin_email: str, action: str, citizen_id: str, citizen_name: str, details: str = None):
    entry = models.AuditLog(
        admin_email=admin_email,
        action=action,
        citizen_id=str(citizen_id),
        citizen_name=citizen_name,
        details=details,
    )
    db.add(entry)
    db.commit()

# --- Public Endpoints ---

@router.post("/register", response_model=schemas.RegistryResponse)
def register(req: schemas.RegistryCreate, db: Session = Depends(get_db), current_admin: models.Admin = Depends(get_current_admin)):
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
    
    full_name = f"{new_registry.name} {new_registry.paternal_name} {new_registry.maternal_name}"
    log_action(db, current_admin.email, "CREATE", new_registry.id, full_name, f"Correo: {new_registry.email}")
    
    return new_registry

# --- Admin Endpoints ---

@router.post("/admin/login")
def admin_login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    admin = db.query(models.Admin).filter(models.Admin.email == req.email).first()
    if not admin or not utils.verify_password(req.password, admin.hashed_password):
         raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    token = utils.create_access_token(data={"sub": admin.email})
    return {"access_token": token, "token_type": "bearer", "role": admin.role}

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
    
    full_name = f"{record.name} {record.paternal_name} {record.maternal_name}"
    log_action(db, current_admin.email, "UPDATE", record.id, full_name, f"Correo: {record.email}")
    
    return record

@router.delete("/admin/records/{record_id}")
def delete_record(record_id: str, db: Session = Depends(get_db), current_admin: models.Admin = Depends(get_current_admin)):
    record = db.query(models.UserRegistry).filter(models.UserRegistry.id == record_id).first()
    if not record or record.is_deleted:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    
    full_name = f"{record.name} {record.paternal_name} {record.maternal_name}"
    record.is_deleted = True
    db.commit()
    
    log_action(db, current_admin.email, "DELETE", record_id, full_name, "Eliminación lógica")
    
    return {"message": "Registro eliminado lógicamente"}

# --- Audit Log Endpoint (DEV only) ---

@router.get("/admin/audit-log")
def get_audit_log(db: Session = Depends(get_db), current_admin: models.Admin = Depends(get_current_admin)):
    if current_admin.role != "DEV":
        raise HTTPException(status_code=403, detail="Acceso restringido a desarrolladores")
    logs = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).limit(500).all()
    return [
        {
            "id": str(log.id),
            "admin_email": log.admin_email,
            "action": log.action,
            "citizen_id": log.citizen_id,
            "citizen_name": log.citizen_name,
            "details": log.details,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
        }
        for log in logs
    ]
