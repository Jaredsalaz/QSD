import requests
import json

BASE_URL = "http://localhost:8000/api" # Adjust if necessary

# To test this, I would need a valid token. 
# Since I cannot easily get a token for a headless test without credentials, 
# I will instead check the code logic and assume the manual check I added to routes.py is sufficient.
# However, I can verify the DB constraint is actually gone by trying to insert two identical emails via a direct DB script.

import os
import psycopg2
from dotenv import load_dotenv
from urllib.parse import urlparse

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:Neymar18*@localhost:5432/qsd_db")

def verify_constraint_gone():
    result = urlparse(DATABASE_URL)
    conn = psycopg2.connect(
        dbname=result.path[1:],
        user=result.username,
        password=result.password,
        host=result.hostname,
        port=result.port
    )
    conn.autocommit = False
    cur = conn.cursor()
    
    email = "verification_test@example.com"
    
    try:
        print(f"Attempting to insert first record with email {email}...")
        cur.execute("""
            INSERT INTO registries (id, name, paternal_name, maternal_name, date_of_birth, secretary, position, phone, email, address, zip_code, is_deleted)
            VALUES (gen_random_uuid(), 'Test', 'One', 'One', '1990-01-01', 'Sec', 'Pos', '1234567890', %s, 'Addr', '12345', true)
        """, (email,))
        
        print(f"Attempting to insert second record with SAME email {email} (both deleted)...")
        cur.execute("""
            INSERT INTO registries (id, name, paternal_name, maternal_name, date_of_birth, secretary, position, phone, email, address, zip_code, is_deleted)
            VALUES (gen_random_uuid(), 'Test', 'Two', 'Two', '1990-01-01', 'Sec', 'Pos', '1234567890', %s, 'Addr', '12345', true)
        """, (email,))
        
        conn.commit()
        print("Success! Multiple records with same email allowed (constraint is gone).")
        
        # Cleanup
        cur.execute("DELETE FROM registries WHERE email = %s", (email,))
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"Failed: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    verify_constraint_gone()
