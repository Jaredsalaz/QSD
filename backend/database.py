import os
from dotenv import load_dotenv
load_dotenv()
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Database URL. If running locally, you need postgres to be running
# User will need to provide actual user/pwd. Default to postgres/postgres 
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:Neymar18*@localhost:5432/qsd_db")

# Fly.io and others provide postgres:// but SQLAlchemy 1.4+ requires postgresql://
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
