import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db
import models
from routes import get_current_admin

router = APIRouter(prefix="/library", tags=["Library Module"])

# Storage directory for library (laws, articles, etc.)
LIBRARY_STORAGE_DIR = os.getenv("LIBRARY_STORAGE_DIR", os.path.join(os.path.dirname(__file__), "library_storage"))

def ensure_storage():
    os.makedirs(LIBRARY_STORAGE_DIR, exist_ok=True)

ensure_storage()

def log_library_action(db: Session, admin_email: str, action: str, resource_id: str, resource_name: str, details: str = None):
    entry = models.AuditLog(
        admin_email=admin_email,
        action=action,
        citizen_id=str(resource_id),
        citizen_name=resource_name,
        details=details,
    )
    db.add(entry)
    db.commit()

# ──────────────────────────────────────────────
# FOLDERS
# ──────────────────────────────────────────────

@router.get("/folders")
def list_folders(
    parent_id: str = Query(None),
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin),
):
    query = db.query(models.LibraryFolder).filter(models.LibraryFolder.is_deleted == False)
    if parent_id:
        query = query.filter(models.LibraryFolder.parent_id == parent_id)
    else:
        query = query.filter(models.LibraryFolder.parent_id == None)
    
    folders = query.order_by(models.LibraryFolder.name).all()
    return [
        {
            "id": str(f.id),
            "name": f.name,
            "parent_id": str(f.parent_id) if f.parent_id else None,
            "created_by": f.created_by,
            "created_at": f.created_at.isoformat() if f.created_at else None,
        }
        for f in folders
    ]

@router.post("/folders")
def create_folder(
    name: str = Form(...),
    parent_id: str = Form(None),
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin),
):
    if parent_id:
        parent = db.query(models.LibraryFolder).filter(
            models.LibraryFolder.id == parent_id,
            models.LibraryFolder.is_deleted == False,
        ).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Carpeta no encontrada")

    folder = models.LibraryFolder(
        name=name.strip(),
        parent_id=parent_id if parent_id else None,
        created_by=current_admin.email,
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)

    log_library_action(db, current_admin.email, "CREATE", folder.id, f"Biblioteca Carpeta: {folder.name}",
                       f"[Biblioteca] Carpeta creada")

    return {
        "id": str(folder.id),
        "name": folder.name,
        "parent_id": str(folder.parent_id) if folder.parent_id else None,
    }

@router.put("/folders/{folder_id}")
def rename_folder(
    folder_id: str,
    name: str = Form(...),
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin),
):
    folder = db.query(models.LibraryFolder).filter(
        models.LibraryFolder.id == folder_id,
        models.LibraryFolder.is_deleted == False,
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Carpeta no encontrada")

    old_name = folder.name
    folder.name = name.strip()
    db.commit()

    log_library_action(db, current_admin.email, "UPDATE", folder.id, f"Biblioteca Carpeta: {folder.name}",
                       f"[Biblioteca] Carpeta renombrada de '{old_name}' a '{folder.name}'")

    return {"id": str(folder.id), "name": folder.name}

@router.delete("/folders/{folder_id}")
def delete_folder(
    folder_id: str,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin),
):
    folder = db.query(models.LibraryFolder).filter(
        models.LibraryFolder.id == folder_id,
        models.LibraryFolder.is_deleted == False,
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Carpeta no encontrada")

    _soft_delete_library_folder_recursive(db, folder_id)

    log_library_action(db, current_admin.email, "DELETE", folder.id, f"Biblioteca Carpeta: {folder.name}",
                       f"[Biblioteca] Carpeta eliminada lógicamente")

    return {"message": "Carpeta eliminada"}

def _soft_delete_library_folder_recursive(db: Session, folder_id: str):
    db.query(models.LibraryFile).filter(
        models.LibraryFile.folder_id == folder_id,
        models.LibraryFile.is_deleted == False,
    ).update({"is_deleted": True})

    children = db.query(models.LibraryFolder).filter(
        models.LibraryFolder.parent_id == folder_id,
        models.LibraryFolder.is_deleted == False,
    ).all()

    for child in children:
        _soft_delete_library_folder_recursive(db, str(child.id))

    db.query(models.LibraryFolder).filter(models.LibraryFolder.id == folder_id).update({"is_deleted": True})
    db.commit()

# ──────────────────────────────────────────────
# FILES
# ──────────────────────────────────────────────

@router.get("/files")
def list_files(
    folder_id: str = Query(None),
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin),
):
    query = db.query(models.LibraryFile).filter(models.LibraryFile.is_deleted == False)
    if folder_id:
        query = query.filter(models.LibraryFile.folder_id == folder_id)
    else:
        query = query.filter(models.LibraryFile.folder_id == None)

    files = query.order_by(models.LibraryFile.original_name).all()
    return [
        {
            "id": str(f.id),
            "original_name": f.original_name,
            "file_size": f.file_size,
            "folder_id": str(f.folder_id) if f.folder_id else None,
            "uploaded_by": f.uploaded_by,
            "created_at": f.created_at.isoformat() if f.created_at else None,
        }
        for f in files
    ]

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    folder_id: str = Form(None),
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo PDF")

    if folder_id:
        folder = db.query(models.LibraryFolder).filter(
            models.LibraryFolder.id == folder_id,
            models.LibraryFolder.is_deleted == False,
        ).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Carpeta no encontrada")

    stored_name = f"{uuid.uuid4().hex}.pdf"
    file_path = os.path.join(LIBRARY_STORAGE_DIR, stored_name)

    # Filename deduplication
    original_filename = file.filename
    base_name, extension = os.path.splitext(original_filename)
    counter = 1
    unique_name = original_filename
    while True:
        existing = db.query(models.LibraryFile).filter(
            models.LibraryFile.original_name == unique_name,
            models.LibraryFile.folder_id == (folder_id if folder_id else None),
            models.LibraryFile.is_deleted == False
        ).first()
        if not existing:
            break
        unique_name = f"{base_name} ({counter}){extension}"
        counter += 1

    total_size = 0
    try:
        with open(file_path, "wb") as buffer:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk: break
                buffer.write(chunk)
                total_size += len(chunk)
    except Exception as e:
        if os.path.exists(file_path): os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))

    pdf_file = models.LibraryFile(
        original_name=unique_name,
        stored_name=stored_name,
        file_path=file_path,
        file_size=total_size,
        folder_id=folder_id if folder_id else None,
        uploaded_by=current_admin.email,
    )
    db.add(pdf_file)
    db.commit()
    db.refresh(pdf_file)

    log_library_action(db, current_admin.email, "CREATE", pdf_file.id, f"Ley/Articulo: {unique_name}",
                       f"[Biblioteca] Archivo subido")

    return {"id": str(pdf_file.id), "original_name": pdf_file.original_name}

@router.delete("/files/{file_id}")
def delete_file(
    file_id: str,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin),
):
    pdf_file = db.query(models.LibraryFile).filter(
        models.LibraryFile.id == file_id,
        models.LibraryFile.is_deleted == False,
    ).first()
    if not pdf_file:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    pdf_file.is_deleted = True
    db.commit()

    log_library_action(db, current_admin.email, "DELETE", pdf_file.id, f"Biblioteca: {pdf_file.original_name}",
                       f"[Biblioteca] Archivo eliminado")

    return {"message": "Eliminado"}

@router.get("/files/{file_id}/download")
def download_file(
    file_id: str,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin),
):
    pdf_file = db.query(models.LibraryFile).filter(
        models.LibraryFile.id == file_id,
        models.LibraryFile.is_deleted == False,
    ).first()
    if not pdf_file or not os.path.exists(pdf_file.file_path):
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    return FileResponse(path=pdf_file.file_path, filename=pdf_file.original_name, media_type="application/pdf")

@router.get("/folders/{folder_id}/breadcrumb")
def get_breadcrumb(
    folder_id: str,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin),
):
    breadcrumb = []
    current_id = folder_id
    depth = 0
    while current_id and depth < 10:
        folder = db.query(models.LibraryFolder).filter(models.LibraryFolder.id == current_id, models.LibraryFolder.is_deleted == False).first()
        if not folder: break
        breadcrumb.insert(0, {"id": str(folder.id), "name": folder.name})
        current_id = str(folder.parent_id) if folder.parent_id else None
        depth += 1
    return breadcrumb
