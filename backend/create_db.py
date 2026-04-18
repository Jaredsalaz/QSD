import os
from dotenv import load_dotenv
load_dotenv()
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from urllib.parse import urlparse
from database import SessionLocal, engine
from models import Admin
from utils import get_password_hash
import models

# Standard local dev URL, defaults to postgres user without password if pgadmin local
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:Neymar18*@localhost:5432/qsd_db")

def create_database():
    import urllib.parse
    result = urllib.parse.urlparse(DATABASE_URL)
    username = result.username
    password = result.password
    database = result.path[1:]
    hostname = result.hostname
    port = result.port

    print(f"Checking if database '{database}' exists on {hostname}:{port}...")

    try:
        # connect to default postgres db to create new one
        conn = psycopg2.connect(
            dbname='postgres',
            user=username,
            password=password,
            host=hostname,
            port=port
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        cur.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{database}'")
        exists = cur.fetchone()
        
        if not exists:
            print(f"Creating database {database}...")
            cur.execute(f'CREATE DATABASE {database}')
        else:
            print(f"Database {database} already exists.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error creating DB. You might need to create it manually in pgAdmin. Details: {e}")

def seed_admin():
    print("Generating tables mapping...")
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    admin_email = "admin@qsd.com"
    existing_admin = db.query(Admin).filter(Admin.email == admin_email).first()
    if not existing_admin:
        print(f"Seeding admin user {admin_email}...")
        hashed_pw = get_password_hash("QSDgris123")
        new_admin = Admin(email=admin_email, hashed_password=hashed_pw)
        db.add(new_admin)
        db.commit()
        print("Admin user seeded successfully.")
    else:
        print(f"Admin user {admin_email} already exists.")
    db.close()

if __name__ == "__main__":
    create_database()
    seed_admin()
