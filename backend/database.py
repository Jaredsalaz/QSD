import os
from dotenv import load_dotenv
load_dotenv()
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Database URL. If running locally, you need postgres to be running
# User will need to provide actual user/pwd. Default to postgres/postgres 
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:Neymar18*@localhost:5432/qsd_db")

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
