import os
import psycopg2
from dotenv import load_dotenv
from urllib.parse import urlparse

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:Neymar18*@localhost:5432/qsd_db")

def fix_indices():
    result = urlparse(DATABASE_URL)
    conn = psycopg2.connect(
        dbname=result.path[1:],
        user=result.username,
        password=result.password,
        host=result.hostname,
        port=result.port
    )
    conn.autocommit = True
    cur = conn.cursor()
    
    try:
        print("Checking for unique indices on email...")
        cur.execute("""
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = 'registries' AND indexdef LIKE '%UNIQUE%';
        """)
        indices = cur.fetchall()
        for (idx_name,) in indices:
            if 'email' in idx_name:
                print(f"Dropping unique index: {idx_name}")
                cur.execute(f"DROP INDEX {idx_name}")
        
        print("Creating a non-unique index on email for performance (since we removed the unique one)...")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_registries_email_non_unique ON registries (email)")
        
        print("Indexing updated_at for faster sorting...")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_registries_updated_at ON registries (updated_at)")

        print("Indices updated successfully.")
    except Exception as e:
        print(f"Error updating indices: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    fix_indices()
