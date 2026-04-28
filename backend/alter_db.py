from database import engine
from sqlalchemy import text

def update_production_db():
    with engine.connect() as conn:
        print("--- Actualizando base de datos en VPS ---")
        
        # 1. Agregar columnas para la INE
        try:
            conn.execute(text("ALTER TABLE registries ADD COLUMN ine_front_url VARCHAR(500);"))
            conn.commit()
            print("[+] Agregada columna 'ine_front_url' en registries")
        except Exception as e:
            conn.rollback()
            print("[-] Nota (ine_front_url):", str(e).split('\n')[0])
            
        try:
            conn.execute(text("ALTER TABLE registries ADD COLUMN ine_back_url VARCHAR(500);"))
            conn.commit()
            print("[+] Agregada columna 'ine_back_url' en registries")
        except Exception as e:
            conn.rollback()
            print("[-] Nota (ine_back_url):", str(e).split('\n')[0])
            
        # 2. Agregar columna de Rol a admins (por si también falta en el VPS)
        try:
            conn.execute(text("ALTER TABLE admins ADD COLUMN role VARCHAR(20) DEFAULT 'ADMIN' NOT NULL;"))
            conn.commit()
            print("[+] Agregada columna 'role' en admins")
        except Exception as e:
            conn.rollback()
            print("[-] Nota (admins.role):", str(e).split('\n')[0])

        # 3. Agregar columna de observación
        try:
            conn.execute(text("ALTER TABLE registries ADD COLUMN observation TEXT;"))
            conn.commit()
            print("[+] Agregada columna 'observation' en registries")
        except Exception as e:
            conn.rollback()
            print("[-] Nota (observation):", str(e).split('\n')[0])
            
        print("--- Actualización finalizada ---")

if __name__ == "__main__":
    update_production_db()
