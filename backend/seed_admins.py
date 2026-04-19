import os
from database import SessionLocal
from models import Admin
from utils import get_password_hash
import models
from database import engine

def seed_multiple_admins():
    # Asegurar que las tablas existen
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Lista de administradores a crear
    admins_to_create = [
        {"email": "dev@qsd.com.mx",        "password": "Dev_QSD2026!", "role": "DEV"},   # Desarrollador
        {"email": "jczepeda@qsd.com.mx",   "password": "Zepeda_26QSD", "role": "ADMIN"},
        {"email": "gzavala@qsd.com.mx",    "password": "Zavala2026",   "role": "ADMIN"},
        {"email": "aasancho@qsd.com.mx",   "password": "Sancho_QSD",   "role": "ADMIN"},
        {"email": "lacen@qsd.com.mx",      "password": "Cen2026_QSD",  "role": "ADMIN"},
    ]
    
    print("Iniciando creación de administradores...")
    
    for admin_data in admins_to_create:
        email = admin_data["email"]
        password = admin_data["password"]
        
        existing = db.query(Admin).filter(Admin.email == email).first()
        if not existing:
            hashed_pw = get_password_hash(password)
            new_admin = Admin(email=email, hashed_password=hashed_pw, role=admin_data.get("role", "ADMIN"))
            db.add(new_admin)
            print(f"[+] Administrador creado: {email} (rol: {admin_data.get('role', 'ADMIN')})")
        else:
            print(f"[-] El administrador {email} ya existe.")
            
    try:
        db.commit()
        print("\n¡Proceso completado con éxito!")
    except Exception as e:
        db.rollback()
        print(f"\n[!] Error al guardar en la base de datos: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_multiple_admins()
