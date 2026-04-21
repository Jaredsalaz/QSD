import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db
import models
from routes import get_current_admin

router = APIRouter(prefix="/pdf", tags=["PDF Drive"])

# Storage directory — on VPS this will be /app/pdf_storage
PDF_STORAGE_DIR = os.getenv("PDF_STORAGE_DIR", os.path.join(os.path.dirname(__file__), "pdf_storage"))

def ensure_storage():
    os.makedirs(PDF_STORAGE_DIR, exist_ok=True)

ensure_storage()

# ──────────────────────────────────────────────
# Helper: Audit log for PDF operations
# ──────────────────────────────────────────────
def log_pdf_action(db: Session, admin_email: str, action: str, resource_id: str, resource_name: str, details: str = None):
    entry = models.AuditLog(
        admin_email=admin_email,
        action=action,
        citizen_id=str(resource_id),     # reusing citizen_id field for resource id
        citizen_name=resource_name,       # reusing citizen_name for resource name
        details=details,
    )
    db.add(entry)
    db.commit()

# ──────────────────────────────────────────────
# FOLDERS
# ──────────────────────────────────────────────

@router.get("/folders")
def list_folders(
    parent_id: str = Query(None, description="Parent folder ID, null for root"),
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin),
):
    query = db.query(models.PdfFolder).filter(models.PdfFolder.is_deleted == False)
    if parent_id:
        query = query.filter(models.PdfFolder.parent_id == parent_id)
    else:
        query = query.filter(models.PdfFolder.parent_id == None)
    
    folders = query.order_by(models.PdfFolder.name).all()
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
    # Validate parent exists if provided
    if parent_id:
        parent = db.query(models.PdfFolder).filter(
            models.PdfFolder.id == parent_id,
            models.PdfFolder.is_deleted == False,
        ).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Carpeta padre no encontrada")

    folder = models.PdfFolder(
        name=name.strip(),
        parent_id=parent_id if parent_id else None,
        created_by=current_admin.email,
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)

    log_pdf_action(db, current_admin.email, "CREATE", folder.id, f"Carpeta: {folder.name}",
                   f"[PDF Drive] Carpeta creada en {'raíz' if not parent_id else f'carpeta {parent_id}'}")

    return {
        "id": str(folder.id),
        "name": folder.name,
        "parent_id": str(folder.parent_id) if folder.parent_id else None,
        "created_by": folder.created_by,
        "created_at": folder.created_at.isoformat() if folder.created_at else None,
    }


@router.put("/folders/{folder_id}")
def rename_folder(
    folder_id: str,
    name: str = Form(...),
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin),
):
    folder = db.query(models.PdfFolder).filter(
        models.PdfFolder.id == folder_id,
        models.PdfFolder.is_deleted == False,
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Carpeta no encontrada")

    old_name = folder.name
    folder.name = name.strip()
    db.commit()
    db.refresh(folder)

    log_pdf_action(db, current_admin.email, "UPDATE", folder.id, f"Carpeta: {folder.name}",
                   f"[PDF Drive] Carpeta renombrada de '{old_name}' a '{folder.name}'")

    return {"id": str(folder.id), "name": folder.name}


@router.delete("/folders/{folder_id}")
def delete_folder(
    folder_id: str,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin),
):
    folder = db.query(models.PdfFolder).filter(
        models.PdfFolder.id == folder_id,
        models.PdfFolder.is_deleted == False,
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Carpeta no encontrada")

    # Recursive soft-delete: mark all children folders and files as deleted
    _soft_delete_folder_recursive(db, folder_id)

    log_pdf_action(db, current_admin.email, "DELETE", folder.id, f"Carpeta: {folder.name}",
                   f"[PDF Drive] Carpeta eliminada lógicamente (y su contenido recursivo)")

    return {"message": "Carpeta eliminada correctamente"}


def _soft_delete_folder_recursive(db: Session, folder_id: str):
    """Recursively soft-delete a folder and all its children."""
    # Soft-delete all files in this folder
    db.query(models.PdfFile).filter(
        models.PdfFile.folder_id == folder_id,
        models.PdfFile.is_deleted == False,
    ).update({"is_deleted": True})

    # Find child folders
    children = db.query(models.PdfFolder).filter(
        models.PdfFolder.parent_id == folder_id,
        models.PdfFolder.is_deleted == False,
    ).all()

    for child in children:
        _soft_delete_folder_recursive(db, str(child.id))

    # Soft-delete this folder
    db.query(models.PdfFolder).filter(
        models.PdfFolder.id == folder_id,
    ).update({"is_deleted": True})

    db.commit()


# ──────────────────────────────────────────────
# FILES
# ──────────────────────────────────────────────

@router.get("/files")
def list_files(
    folder_id: str = Query(None, description="Folder ID, null for root"),
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin),
):
    query = db.query(models.PdfFile).filter(models.PdfFile.is_deleted == False)
    if folder_id:
        query = query.filter(models.PdfFile.folder_id == folder_id)
    else:
        query = query.filter(models.PdfFile.folder_id == None)

    files = query.order_by(models.PdfFile.original_name).all()
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
    # Validate PDF
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos PDF")

    if file.content_type and file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Tipo de contenido inválido. Solo PDF.")

    # Validate folder exists if provided
    if folder_id:
        folder = db.query(models.PdfFolder).filter(
            models.PdfFolder.id == folder_id,
            models.PdfFolder.is_deleted == False,
        ).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Carpeta no encontrada")

    # Generate unique stored name
    file_ext = ".pdf"
    stored_name = f"{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(PDF_STORAGE_DIR, stored_name)

    # Stream write to disk — no size limit
    total_size = 0
    try:
        with open(file_path, "wb") as buffer:
            while True:
                chunk = await file.read(1024 * 1024)  # 1MB chunks
                if not chunk:
                    break
                buffer.write(chunk)
                total_size += len(chunk)
    except Exception as e:
        # Clean up on failure
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Error al guardar archivo: {str(e)}")

    # Save metadata to DB
    pdf_file = models.PdfFile(
        original_name=file.filename,
        stored_name=stored_name,
        file_path=file_path,
        file_size=total_size,
        folder_id=folder_id if folder_id else None,
        uploaded_by=current_admin.email,
    )
    db.add(pdf_file)
    db.commit()
    db.refresh(pdf_file)

    log_pdf_action(db, current_admin.email, "CREATE", pdf_file.id, f"PDF: {file.filename}",
                   f"[PDF Drive] Archivo subido ({_format_size(total_size)}) en {'raíz' if not folder_id else f'carpeta {folder_id}'}")

    return {
        "id": str(pdf_file.id),
        "original_name": pdf_file.original_name,
        "file_size": pdf_file.file_size,
        "folder_id": str(pdf_file.folder_id) if pdf_file.folder_id else None,
        "uploaded_by": pdf_file.uploaded_by,
        "created_at": pdf_file.created_at.isoformat() if pdf_file.created_at else None,
    }


@router.delete("/files/{file_id}")
def delete_file(
    file_id: str,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin),
):
    pdf_file = db.query(models.PdfFile).filter(
        models.PdfFile.id == file_id,
        models.PdfFile.is_deleted == False,
    ).first()
    if not pdf_file:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    # Soft delete — keep the record and the actual file on disk
    pdf_file.is_deleted = True
    db.commit()

    log_pdf_action(db, current_admin.email, "DELETE", pdf_file.id, f"PDF: {pdf_file.original_name}",
                   f"[PDF Drive] Archivo eliminado lógicamente ({_format_size(pdf_file.file_size)})")

    return {"message": "Archivo eliminado correctamente"}


@router.get("/files/{file_id}/download")
def download_file(
    file_id: str,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin),
):
    pdf_file = db.query(models.PdfFile).filter(
        models.PdfFile.id == file_id,
        models.PdfFile.is_deleted == False,
    ).first()
    if not pdf_file:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    if not os.path.exists(pdf_file.file_path):
        raise HTTPException(status_code=404, detail="Archivo no encontrado en el sistema de archivos")

    return FileResponse(
        path=pdf_file.file_path,
        filename=pdf_file.original_name,
        media_type="application/pdf",
    )


# ──────────────────────────────────────────────
# SEARCH
# ──────────────────────────────────────────────

@router.get("/search")
def search_files(
    q: str = Query(..., min_length=1, description="Search query"),
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin),
):
    files = db.query(models.PdfFile).filter(
        models.PdfFile.is_deleted == False,
        models.PdfFile.original_name.ilike(f"%{q}%"),
    ).order_by(models.PdfFile.original_name).limit(50).all()

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


# ──────────────────────────────────────────────
# BREADCRUMB HELPER
# ──────────────────────────────────────────────

@router.get("/folders/{folder_id}/breadcrumb")
def get_breadcrumb(
    folder_id: str,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin),
):
    """Build the breadcrumb path from root to the given folder."""
    breadcrumb = []
    current_id = folder_id
    max_depth = 20  # safety limit

    while current_id and max_depth > 0:
        folder = db.query(models.PdfFolder).filter(
            models.PdfFolder.id == current_id,
            models.PdfFolder.is_deleted == False,
        ).first()
        if not folder:
            break
        breadcrumb.insert(0, {"id": str(folder.id), "name": folder.name})
        current_id = str(folder.parent_id) if folder.parent_id else None
        max_depth -= 1

    return breadcrumb


# ──────────────────────────────────────────────
# UTILS
# ──────────────────────────────────────────────

def _format_size(size_bytes: int) -> str:
    """Human-readable file size."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"
