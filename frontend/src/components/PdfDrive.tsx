import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import AlertModal from './AlertModal';
import {
  Search, FolderPlus, Upload, Folder, FileText, Download,
  Trash2, X, ChevronRight, Home, CheckCircle2, XCircle, HardDrive,
} from 'lucide-react';

// ─── Types ────────────────────────────────────
interface PdfFolder {
  id: string;
  name: string;
  parent_id: string | null;
  created_by: string;
  created_at: string;
}

interface PdfFileItem {
  id: string;
  original_name: string;
  file_size: number;
  folder_id: string | null;
  uploaded_by: string;
  created_at: string;
}

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMsg?: string;
}

// ─── Hourglass Loader (from user) ─────────────
const HourglassLoader = () => (
  <div className="pdf-loader-wrap">
    <svg viewBox="0 0 56 56">
      <defs>
        <clipPath id="sand-mound-top">
          <path d="M 14.613 13.087 C 15.814 12.059 19.3 8.039 20.3 6.539 C 21.5 4.789 21.5 2.039 21.5 2.039 L 3 2.039 C 3 2.039 3 4.789 4.2 6.539 C 5.2 8.039 8.686 12.059 9.887 13.087 C 11 14.039 12.25 14.039 12.25 14.039 C 12.25 14.039 13.5 14.039 14.613 13.087 Z" className="loader__sand-mound-top" />
        </clipPath>
        <clipPath id="sand-mound-bottom">
          <path d="M 14.613 20.452 C 15.814 21.48 19.3 25.5 20.3 27 C 21.5 28.75 21.5 31.5 21.5 31.5 L 3 31.5 C 3 31.5 3 28.75 4.2 27 C 5.2 25.5 8.686 21.48 9.887 20.452 C 11 19.5 12.25 19.5 12.25 19.5 C 12.25 19.5 13.5 19.5 14.613 20.452 Z" className="loader__sand-mound-bottom" />
        </clipPath>
        <style>{`
          .loader__model,
          .loader__motion-thick,
          .loader__motion-medium,
          .loader__motion-thin,
          .loader__sand-drop,
          .loader__sand-fill,
          .loader__sand-grain-left,
          .loader__sand-grain-right,
          .loader__sand-line-left,
          .loader__sand-line-right,
          .loader__sand-mound-top,
          .loader__sand-mound-bottom,
          .loader__glare-top,
          .loader__glare-bottom {
            animation-duration: 2s;
            animation-timing-function: cubic-bezier(0.83,0,0.17,1);
            animation-iteration-count: infinite;
          }
          .loader__model { animation-name: loader-flip; transform-origin: 12.25px 16.75px; }
          .loader__motion-thick, .loader__motion-medium, .loader__motion-thin { transform-origin: 26px 26px; }
          .loader__motion-thick { animation-name: motion-thick; }
          .loader__motion-medium { animation-name: motion-medium; }
          .loader__motion-thin { animation-name: motion-thin; }
          .loader__sand-drop { animation-name: sand-drop; }
          .loader__sand-fill { animation-name: sand-fill; }
          .loader__sand-grain-left { animation-name: sand-grain-left; }
          .loader__sand-grain-right { animation-name: sand-grain-right; }
          .loader__sand-line-left { animation-name: sand-line-left; }
          .loader__sand-line-right { animation-name: sand-line-right; }
          .loader__sand-mound-top { animation-name: sand-mound-top; }
          .loader__sand-mound-bottom { animation-name: sand-mound-bottom; transform-origin: 12.25px 31.5px; }
          .loader__glare-top { animation-name: glare-top; }
          .loader__glare-bottom { animation-name: glare-bottom; }
          @keyframes loader-flip { from { transform: translate(13.75px,9.25px) rotate(-180deg); } 24%, to { transform: translate(13.75px,9.25px) rotate(0); } }
          @keyframes glare-top { from { stroke: rgba(255,255,255,0); } 24%, to { stroke: white; } }
          @keyframes glare-bottom { from { stroke: white; } 24%, to { stroke: rgba(255,255,255,0); } }
          @keyframes motion-thick { from { animation-timing-function: cubic-bezier(0.33,0,0.67,0); stroke: rgba(255,255,255,0); stroke-dashoffset: 153.94; transform: rotate(0.67turn); } 20% { animation-timing-function: cubic-bezier(0.33,1,0.67,1); stroke: rgb(32,32,32); stroke-dashoffset: 141.11; transform: rotate(1turn); } 40%, to { stroke: rgba(255,255,255,0); stroke-dashoffset: 153.94; transform: rotate(1.33turn); } }
          @keyframes motion-medium { from, 8% { animation-timing-function: cubic-bezier(0.33,0,0.67,0); stroke: rgba(255,255,255,0); stroke-dashoffset: 153.94; transform: rotate(0.5turn); } 20% { animation-timing-function: cubic-bezier(0.33,1,0.67,1); stroke: white; stroke-dashoffset: 147.53; transform: rotate(0.83turn); } 32%, to { stroke: rgba(255,255,255,0); stroke-dashoffset: 153.94; transform: rotate(1.17turn); } }
          @keyframes motion-thin { from, 4% { animation-timing-function: cubic-bezier(0.33,0,0.67,0); stroke: rgba(255,255,255,0); stroke-dashoffset: 153.94; transform: rotate(0.33turn); } 24% { animation-timing-function: cubic-bezier(0.33,1,0.67,1); stroke: rgb(53,53,53); stroke-dashoffset: 134.7; transform: rotate(0.67turn); } 44%, to { stroke: rgba(255,255,255,0); stroke-dashoffset: 153.94; transform: rotate(1turn); } }
          @keyframes sand-drop { from, 10% { animation-timing-function: cubic-bezier(0.12,0,0.39,0); stroke-dashoffset: 1; } 70%, to { stroke-dashoffset: -107; } }
          @keyframes sand-fill { from, 10% { animation-timing-function: cubic-bezier(0.12,0,0.39,0); stroke-dashoffset: 55; } 70%, to { stroke-dashoffset: -54; } }
          @keyframes sand-grain-left { from, 10% { animation-timing-function: cubic-bezier(0.12,0,0.39,0); stroke-dashoffset: 29; } 70%, to { stroke-dashoffset: -22; } }
          @keyframes sand-grain-right { from, 10% { animation-timing-function: cubic-bezier(0.12,0,0.39,0); stroke-dashoffset: 27; } 70%, to { stroke-dashoffset: -24; } }
          @keyframes sand-line-left { from, 10% { animation-timing-function: cubic-bezier(0.12,0,0.39,0); stroke-dashoffset: 53; } 70%, to { stroke-dashoffset: -55; } }
          @keyframes sand-line-right { from, 10% { animation-timing-function: cubic-bezier(0.12,0,0.39,0); stroke-dashoffset: 14; } 70%, to { stroke-dashoffset: -24.5; } }
          @keyframes sand-mound-top { from, 10% { animation-timing-function: linear; transform: translate(0,0); } 15% { animation-timing-function: cubic-bezier(0.12,0,0.39,0); transform: translate(0,1.5px); } 51%, to { transform: translate(0,13px); } }
          @keyframes sand-mound-bottom { from, 31% { animation-timing-function: cubic-bezier(0.61,1,0.88,1); transform: scale(1,0); } 56%, to { transform: scale(1,1); } }
        `}</style>
      </defs>
      <g transform="translate(2,2)">
        <g transform="rotate(-90,26,26)" strokeLinecap="round" strokeDashoffset="153.94" strokeDasharray="153.94 153.94" stroke="hsl(0,0%,100%)" fill="none">
          <circle transform="rotate(0,26,26)" r="24.5" cy={26} cx={26} strokeWidth="2.5" className="loader__motion-thick" />
          <circle transform="rotate(90,26,26)" r="24.5" cy={26} cx={26} strokeWidth="1.75" className="loader__motion-medium" />
          <circle transform="rotate(180,26,26)" r="24.5" cy={26} cx={26} strokeWidth={1} className="loader__motion-thin" />
        </g>
        <g transform="translate(13.75,9.25)" className="loader__model">
          <path d="M 1.5 2 L 23 2 C 23 2 22.5 8.5 19 12 C 16 15.5 13.5 13.5 13.5 16.75 C 13.5 20 16 18 19 21.5 C 22.5 25 23 31.5 23 31.5 L 1.5 31.5 C 1.5 31.5 2 25 5.5 21.5 C 8.5 18 11 20 11 16.75 C 11 13.5 8.5 15.5 5.5 12 C 2 8.5 1.5 2 1.5 2 Z" fill="hsl(42,90%,85%)" />
          <g strokeLinecap="round" stroke="hsl(35,90%,90%)">
            <line y2="20.75" x2={12} y1="15.75" x1={12} strokeDasharray="0.25 33.75" strokeWidth={1} className="loader__sand-grain-left" />
            <line y2="21.75" x2="12.5" y1="16.75" x1="12.5" strokeDasharray="0.25 33.75" strokeWidth={1} className="loader__sand-grain-right" />
            <line y2="31.5" x2="12.25" y1={18} x1="12.25" strokeDasharray="0.5 107.5" strokeWidth={1} className="loader__sand-drop" />
            <line y2="31.5" x2="12.25" y1="14.75" x1="12.25" strokeDasharray="54 54" strokeWidth="1.5" className="loader__sand-fill" />
            <line y2="31.5" x2={12} y1={16} x1={12} strokeDasharray="1 107" strokeWidth={1} stroke="hsl(35,90%,83%)" className="loader__sand-line-left" />
            <line y2="31.5" x2="12.5" y1={16} x1="12.5" strokeDasharray="12 96" strokeWidth={1} stroke="hsl(35,90%,83%)" className="loader__sand-line-right" />
            <g strokeWidth={0} fill="hsl(35,90%,90%)">
              <path d="M 12.25 15 L 15.392 13.486 C 21.737 11.168 22.5 2 22.5 2 L 2 2.013 C 2 2.013 2.753 11.046 9.009 13.438 L 12.25 15 Z" clipPath="url(#sand-mound-top)" />
              <path d="M 12.25 18.5 L 15.392 20.014 C 21.737 22.332 22.5 31.5 22.5 31.5 L 2 31.487 C 2 31.487 2.753 22.454 9.009 20.062 Z" clipPath="url(#sand-mound-bottom)" />
            </g>
          </g>
          <g strokeWidth={2} strokeLinecap="round" opacity="0.7" fill="none">
            <path d="M 19.437 3.421 C 19.437 3.421 19.671 6.454 17.914 8.846 C 16.157 11.238 14.5 11.5 14.5 11.5" stroke="hsl(0,0%,100%)" className="loader__glare-top" />
            <path transform="rotate(180,12.25,16.75)" d="M 19.437 3.421 C 19.437 3.421 19.671 6.454 17.914 8.846 C 16.157 11.238 14.5 11.5 14.5 11.5" stroke="hsla(0,0%,100%,0)" className="loader__glare-bottom" />
          </g>
          <rect height={2} width="24.5" fill="hsl(42,90%,50%)" />
          <rect height={1} width="19.5" y="0.5" x="2.5" ry="0.5" rx="0.5" fill="hsl(42,90%,57.5%)" />
          <rect height={2} width="24.5" y="31.5" fill="hsl(42,90%,50%)" />
          <rect height={1} width="19.5" y={32} x="2.5" ry="0.5" rx="0.5" fill="hsl(42,90%,57.5%)" />
        </g>
      </g>
    </svg>
  </div>
);

// ─── Helpers ──────────────────────────────────
const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const formatDate = (iso: string): string => {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
};

let uploadIdCounter = 0;

// ═══════════════════════════════════════════════
// PDF DRIVE COMPONENT
// ═══════════════════════════════════════════════
const PdfDrive = () => {
  // ─── State ────────────────────────────────
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<{ id: string; name: string }[]>([]);
  const [folders, setFolders] = useState<PdfFolder[]>([]);
  const [files, setFiles] = useState<PdfFileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [draggingFileId, setDraggingFileId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  // Upload
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<PdfFileItem[] | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // New Folder Modal
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Alert
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    type: 'success' | 'confirm' | 'error';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ isOpen: false, type: 'success', title: '', message: '' });

  // ─── Data Fetching ────────────────────────
  const fetchContents = useCallback(async (folderId: string | null) => {
    setIsLoading(true);
    try {
      const folderParams = folderId ? `?parent_id=${folderId}` : '';
      const fileParams = folderId ? `?folder_id=${folderId}` : '';
      const [foldersRes, filesRes] = await Promise.all([
        api.get(`/pdf/folders${folderParams}`),
        api.get(`/pdf/files${fileParams}`),
      ]);
      setFolders(foldersRes.data);
      setFiles(filesRes.data);
    } catch (err) {
      console.error('Error loading PDF Drive contents', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchBreadcrumb = useCallback(async (folderId: string | null) => {
    if (!folderId) {
      setBreadcrumb([]);
      return;
    }
    try {
      const res = await api.get(`/pdf/folders/${folderId}/breadcrumb`);
      setBreadcrumb(res.data);
    } catch {
      setBreadcrumb([]);
    }
  }, []);

  useEffect(() => {
    fetchContents(currentFolderId);
    fetchBreadcrumb(currentFolderId);
  }, [currentFolderId, fetchContents, fetchBreadcrumb]);

  // ─── Navigate ─────────────────────────────
  const navigateToFolder = (folderId: string | null) => {
    setSearchResults(null);
    setSearchTerm('');
    setCurrentFolderId(folderId);
  };

  // ─── Search ───────────────────────────────
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!value.trim()) {
      setSearchResults(null);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await api.get(`/pdf/search?q=${encodeURIComponent(value.trim())}`);
        setSearchResults(res.data);
      } catch {
        setSearchResults([]);
      }
    }, 400);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults(null);
  };

  // ─── Create Folder ────────────────────────
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const formData = new FormData();
      formData.append('name', newFolderName.trim());
      if (currentFolderId) formData.append('parent_id', currentFolderId);
      await api.post('/pdf/folders', formData);
      setShowNewFolderModal(false);
      setNewFolderName('');
      fetchContents(currentFolderId);
    } catch (err: any) {
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: err.response?.data?.detail || 'No se pudo crear la carpeta.',
      });
    }
  };

  // ─── Delete Folder ────────────────────────
  const confirmDeleteFolder = (folder: PdfFolder) => {
    setAlert({
      isOpen: true,
      type: 'confirm',
      title: 'Eliminar Carpeta',
      message: `¿Estás seguro de eliminar la carpeta "${folder.name}" y todo su contenido?`,
      onConfirm: () => handleDeleteFolder(folder.id),
    });
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await api.delete(`/pdf/folders/${folderId}`);
      fetchContents(currentFolderId);
    } catch {
      setAlert({ isOpen: true, type: 'error', title: 'Error', message: 'No se pudo eliminar la carpeta.' });
    }
  };

  // ─── Delete File ──────────────────────────
  const confirmDeleteFile = (file: PdfFileItem) => {
    setAlert({
      isOpen: true,
      type: 'confirm',
      title: 'Eliminar Archivo',
      message: `¿Estás seguro de eliminar "${file.original_name}"?`,
      onConfirm: () => handleDeleteFile(file.id),
    });
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await api.delete(`/pdf/files/${fileId}`);
      fetchContents(currentFolderId);
    } catch {
      setAlert({ isOpen: true, type: 'error', title: 'Error', message: 'No se pudo eliminar el archivo.' });
    }
  };

  // ─── Download File ────────────────────────
  const handleDownload = async (file: PdfFileItem) => {
    try {
      const res = await api.get(`/pdf/files/${file.id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.original_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setAlert({ isOpen: true, type: 'error', title: 'Error', message: 'No se pudo descargar el archivo.' });
    }
  };

  // ─── Upload ───────────────────────────────
  const processFiles = (fileList: FileList | File[]) => {
    const validFiles: File[] = [];
    const invalidNames: string[] = [];

    Array.from(fileList).forEach(f => {
      if (f.name.toLowerCase().endsWith('.pdf')) {
        validFiles.push(f);
      } else {
        invalidNames.push(f.name);
      }
    });

    if (invalidNames.length > 0) {
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Archivos Rechazados',
        message: `Solo se admiten archivos PDF. Rechazados: ${invalidNames.join(', ')}`,
      });
    }

    if (validFiles.length === 0) return;

    const newItems: UploadItem[] = validFiles.map(f => ({
      id: `upload-${++uploadIdCounter}`,
      file: f,
      progress: 0,
      status: 'pending' as const,
    }));

    setUploadQueue(prev => [...prev, ...newItems]);

    newItems.forEach(item => uploadSingleFile(item));
  };

  const uploadSingleFile = async (item: UploadItem) => {
    setUploadQueue(prev =>
      prev.map(u => u.id === item.id ? { ...u, status: 'uploading' } : u)
    );

    const formData = new FormData();
    formData.append('file', item.file);
    if (currentFolderId) formData.append('folder_id', currentFolderId);

    try {
      await api.post('/pdf/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const pct = e.total ? Math.round((e.loaded * 100) / e.total) : 0;
          setUploadQueue(prev =>
            prev.map(u => u.id === item.id ? { ...u, progress: pct } : u)
          );
        },
      });

      setUploadQueue(prev =>
        prev.map(u => u.id === item.id ? { ...u, progress: 100, status: 'success' } : u)
      );
      fetchContents(currentFolderId);

      // Auto-remove successful items after 4 seconds
      setTimeout(() => {
        setUploadQueue(prev => prev.filter(u => u.id !== item.id));
      }, 4000);
    } catch (err: any) {
      setUploadQueue(prev =>
        prev.map(u =>
          u.id === item.id
            ? { ...u, status: 'error', errorMsg: err.response?.data?.detail || 'Error al subir' }
            : u
        )
      );
    }
  };

  // ─── Drag & Drop ──────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const hasExternalFiles = Array.from(e.dataTransfer.types).includes('Files');
    if (hasExternalFiles) {
      setIsDragActive(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  }, [currentFolderId]);

  const handleFileDragStart = (e: any, fileId: string) => {
    if (!e?.dataTransfer) return;
    setDraggingFileId(fileId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/x-qsd-file-id', fileId);
  };

  const handleFileDragEnd = () => {
    setDraggingFileId(null);
    setDragOverFolderId(null);
  };

  const handleFolderDragOver = (e: React.DragEvent, folderId: string) => {
    if (!draggingFileId) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolderId(folderId);
  };

  const handleFolderDragLeave = (folderId: string) => {
    if (dragOverFolderId === folderId) {
      setDragOverFolderId(null);
    }
  };

  const handleFileMoveToFolder = async (fileId: string, targetFolderId: string) => {
    const targetFile = files.find((f) => f.id === fileId);
    if (!targetFile || targetFile.folder_id === targetFolderId) return;

    const formData = new FormData();
    formData.append('folder_id', targetFolderId);

    try {
      await api.put(`/pdf/files/${fileId}/move`, formData);
      fetchContents(currentFolderId);
    } catch {
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo mover el archivo a la carpeta destino.',
      });
    }
  };

  const handleFolderDrop = async (e: React.DragEvent, folderId: string) => {
    if (!draggingFileId) return;
    e.preventDefault();
    e.stopPropagation();

    const fileId = e.dataTransfer.getData('application/x-qsd-file-id') || draggingFileId;
    setDragOverFolderId(null);
    setDraggingFileId(null);
    await handleFileMoveToFolder(fileId, folderId);
  };

  // ─── Active Uploads ───────────────────────


  // Determine displayed items
  const displayedFiles = searchResults !== null ? searchResults : files;
  const displayedFolders = searchResults !== null ? [] : folders;

  // ─── Render ───────────────────────────────
  return (
    <motion.div
      key="pdf-view"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {/* Toolbar */}
      <div className="pdf-toolbar">
        <button className="btn-primary" style={{ height: 44 }} onClick={() => setShowNewFolderModal(true)}>
          <FolderPlus size={18} /> Nueva Carpeta
        </button>
        <button
          className="btn-secondary"
          style={{ height: 44, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={18} /> Subir PDF
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => { if (e.target.files) processFiles(e.target.files); e.target.value = ''; }}
        />
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            className="form-control"
            placeholder="Buscar archivos por nombre..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Breadcrumb */}
      {searchResults === null && (
        <div className="pdf-breadcrumb">
          <span
            className={`pdf-breadcrumb-item ${!currentFolderId ? 'active' : ''}`}
            onClick={() => navigateToFolder(null)}
          >
            <Home size={15} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Inicio
          </span>
          {breadcrumb.map((b, i) => (
            <span key={b.id} style={{ display: 'inline-flex', alignItems: 'center' }}>
              <ChevronRight size={14} className="pdf-breadcrumb-sep" />
              <span
                className={`pdf-breadcrumb-item ${i === breadcrumb.length - 1 ? 'active' : ''}`}
                onClick={() => i < breadcrumb.length - 1 && navigateToFolder(b.id)}
              >
                {b.name}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Search Results Badge */}
      {searchResults !== null && (
        <div className="pdf-search-badge">
          <Search size={14} />
          {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} para "{searchTerm}"
          <button onClick={clearSearch}><X size={14} /></button>
        </div>
      )}

      {/* Drop Zone */}
      {searchResults === null && (
        <div
          className={`pdf-dropzone ${isDragActive ? 'drag-active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="pdf-dropzone-icon">
            <Upload size={40} color="var(--gold-opaque)" />
          </div>
          <div className="pdf-dropzone-text">
            Arrastra y suelta tus archivos PDF aquí<br />
            o <strong>haz clic para seleccionar</strong>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            Solo archivos .pdf — Sin límite de tamaño
          </div>
        </div>
      )}

      {/* Upload Queue */}
      <AnimatePresence>
        {uploadQueue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pdf-upload-queue"
          >
            {uploadQueue.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className={`pdf-upload-item ${item.status}`}
              >
                {/* Left: Status icon or loader */}
                {item.status === 'uploading' || item.status === 'pending' ? (
                  <HourglassLoader />
                ) : item.status === 'success' ? (
                  <div className="pdf-status-icon success">
                    <CheckCircle2 size={18} />
                  </div>
                ) : (
                  <div className="pdf-status-icon error">
                    <XCircle size={18} />
                  </div>
                )}

                {/* Center: File info + progress */}
                <div className="pdf-upload-info">
                  <div className="pdf-upload-name">{item.file.name}</div>
                  <div className="pdf-upload-size">
                    {formatSize(item.file.size)}
                    {item.status === 'error' && item.errorMsg && (
                      <span style={{ color: '#ef4444', marginLeft: '0.5rem' }}>— {item.errorMsg}</span>
                    )}
                  </div>
                  {(item.status === 'uploading' || item.status === 'pending') && (
                    <div className="pdf-progress-track">
                      <div
                        className="pdf-progress-fill"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                  {item.status === 'success' && (
                    <div className="pdf-progress-track">
                      <div className="pdf-progress-fill done" style={{ width: '100%' }} />
                    </div>
                  )}
                  {item.status === 'error' && (
                    <div className="pdf-progress-track">
                      <div className="pdf-progress-fill failed" style={{ width: '100%' }} />
                    </div>
                  )}
                </div>

                {/* Right: Percentage */}
                <span className={`pdf-upload-percent ${item.status === 'success' ? 'done' : item.status === 'error' ? 'failed' : ''}`}>
                  {item.status === 'success' ? '✓' : item.status === 'error' ? '✗' : `${item.progress}%`}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Grid */}
      {isLoading ? (
        <div className="pdf-empty">
          <HourglassLoader />
          <span style={{ marginTop: '1rem' }}>Cargando contenido...</span>
        </div>
      ) : (displayedFolders.length === 0 && displayedFiles.length === 0) ? (
        <div className="pdf-empty">
          <HardDrive size={56} />
          <span>{searchResults !== null ? 'No se encontraron archivos' : 'Esta carpeta está vacía'}</span>
          {searchResults === null && (
            <span style={{ fontSize: '0.85rem' }}>Crea una carpeta o sube un PDF para comenzar</span>
          )}
        </div>
      ) : (
        <div className="pdf-grid">
          {/* Folders */}
          {displayedFolders.map(folder => (
            <motion.div
              key={folder.id}
              className={`pdf-grid-item ${dragOverFolderId === folder.id ? 'drop-target' : ''}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => navigateToFolder(folder.id)}
              onDragOver={(e) => handleFolderDragOver(e, folder.id)}
              onDragEnter={(e) => handleFolderDragOver(e, folder.id)}
              onDragLeave={() => handleFolderDragLeave(folder.id)}
              onDrop={(e) => handleFolderDrop(e, folder.id)}
            >
              <div className="item-actions">
                <button
                  className="delete-btn"
                  title="Eliminar carpeta"
                  onClick={(e) => { e.stopPropagation(); confirmDeleteFolder(folder); }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="item-icon folder">
                <Folder size={26} />
              </div>
              <div className="item-name">{folder.name}</div>
              <div className="item-meta">{formatDate(folder.created_at)}</div>
            </motion.div>
          ))}

          {/* Files */}
          {displayedFiles.map(file => (
            <motion.div
              key={file.id}
              className={`pdf-grid-item ${draggingFileId === file.id ? 'is-dragging' : ''}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => handleDownload(file)}
              draggable={searchResults === null}
              onDragStartCapture={(e) => handleFileDragStart(e, file.id)}
              onDragEndCapture={handleFileDragEnd}
            >
              <div className="item-actions">
                <button title="Descargar" onClick={(e) => { e.stopPropagation(); handleDownload(file); }}>
                  <Download size={14} />
                </button>
                <button
                  className="delete-btn"
                  title="Eliminar archivo"
                  onClick={(e) => { e.stopPropagation(); confirmDeleteFile(file); }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="item-icon file">
                <FileText size={26} />
              </div>
              <div className="item-name">{file.original_name}</div>
              <div className="item-meta">{formatSize(file.file_size)} · {formatDate(file.created_at)}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* New Folder Modal */}
      <AnimatePresence>
        {showNewFolderModal && (
          <motion.div
            className="pdf-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNewFolderModal(false)}
          >
            <motion.div
              className="pdf-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  <FolderPlus size={20} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--gold-opaque)' }} />
                  Nueva Carpeta
                </h3>
                <button
                  onClick={() => setShowNewFolderModal(false)}
                  style={{ background: 'rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer', padding: 6, borderRadius: '50%', display: 'flex' }}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="form-group">
                <label className="form-label">Nombre de la carpeta</label>
                <input
                  className="form-control"
                  placeholder="Ej: Documentos Oficiales"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowNewFolderModal(false)}>
                  Cancelar
                </button>
                <button className="btn-primary" style={{ flex: 2 }} onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                  Crear Carpeta
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert */}
      <AlertModal
        isOpen={alert.isOpen}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={() => {
          if (alert.onConfirm) alert.onConfirm();
          setAlert({ ...alert, isOpen: false });
        }}
        onClose={() => setAlert({ ...alert, isOpen: false })}
      />
    </motion.div>
  );
};

export default PdfDrive;
