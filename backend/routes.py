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

@router.post("/register/initiate")
def initiate_registration(req: schemas.InitiateOTPRequest, db: Session = Depends(get_db)):
    # Check if email is already fully registered and not deleted
    existing_user = db.query(models.UserRegistry).filter(models.UserRegistry.email == req.email, models.UserRegistry.is_deleted == False).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El correo electrónico ya está registrado.")
    
    # Generate OTP
    otp = utils.generate_otp()
    expires = datetime.utcnow() + timedelta(minutes=15)
    
    # Save or update OTP record
    otp_record = db.query(models.OTPVerification).filter(models.OTPVerification.email == req.email).first()
    if otp_record:
        otp_record.otp_code = otp
        otp_record.expires_at = expires
    else:
        otp_record = models.OTPVerification(email=req.email, otp_code=otp, expires_at=expires)
        db.add(otp_record)
        
    db.commit()
    
    # Send email
    utils.send_email(
        req.email,
        "Tu código de verificación QSD",
        f"Tu código de verificación es: {otp}\n\nIngrésalo en la aplicación para completar tu registro."
    )
    return {"message": "OTP enviado al correo."}

@router.post("/register/verify")
def verify_registration(req: schemas.VerifyOTPRequest, db: Session = Depends(get_db)):
    otp_record = db.query(models.OTPVerification).filter(models.OTPVerification.email == req.email).first()
    
    if not otp_record or otp_record.otp_code != req.otp_code:
        raise HTTPException(status_code=400, detail="Código OTP inválido.")
    
    if otp_record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="El código OTP ha expirado.")

    # Convert Pydantic model to dict
    reg_data = req.registry_data.dict()
    
    # Ensure no duplicates via email
    existing_user = db.query(models.UserRegistry).filter(models.UserRegistry.email == reg_data['email'], models.UserRegistry.is_deleted == False).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El correo ya se encuentra registrado.")
    
    new_registry = models.UserRegistry(**reg_data)
    db.add(new_registry)
    db.commit()
    db.refresh(new_registry)
    
    # Cleanup OTP
    db.delete(otp_record)
    db.commit()
    
    # Send successful email
    conf_msg = f"¡Hola {new_registry.name}!\n\nTu registro en QSD ha sido exitoso.\n\n"
    conf_msg += f"Estos son tus datos registrados:\n"
    conf_msg += f"Nombre: {new_registry.name} {new_registry.paternal_name} {new_registry.maternal_name}\n"
    conf_msg += f"Fecha de nacimiento: {new_registry.date_of_birth}\n"
    conf_msg += f"Secretaría: {new_registry.secretary}\n"
    conf_msg += f"Cargo: {new_registry.position}\n"
    conf_msg += f"Teléfono: {new_registry.phone}\n"
    conf_msg += f"Domicilio: {new_registry.address}\n\n"
    conf_msg += f"Gracias por usar QSD."
    
    utils.send_email(new_registry.email, "Registro Exitoso en QSD", conf_msg)
    
    return {"message": "Registro exitoso.", "id": str(new_registry.id)}

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
