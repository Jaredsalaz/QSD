from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import models
from database import engine
from routes import router
from pdf_routes import router as pdf_router

# Create DB Tables if they don't exist
models.Base.metadata.create_all(bind=engine)

# Ensure PDF storage directory exists
PDF_STORAGE_DIR = os.getenv("PDF_STORAGE_DIR", os.path.join(os.path.dirname(__file__), "pdf_storage"))
os.makedirs(PDF_STORAGE_DIR, exist_ok=True)

app = FastAPI(title="QSD Government App", version="1.0.0")

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production specify the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")
app.include_router(pdf_router, prefix="/api")

@app.get("/")
def health_check():
    return {"status": "ok", "app": "QSD Backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8888, reload=True)

