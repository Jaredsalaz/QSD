import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import AlertModal from './AlertModal';
import {
  FolderPlus, Upload, Folder, FileText, Download,
  Trash2, ChevronRight, Home, CheckCircle2, XCircle, BookOpen,
} from 'lucide-react';

// ─── Types ────────────────────────────────────
interface LibraryFolder {
  id: string;
  name: string;
  parent_id: string | null;
  created_by: string;
  created_at: string;
}

interface LibraryFileItem {
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

// ─── Hourglass Loader ─────────────
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


let uploadIdCounter = 0;

const LibraryDrive = () => {
  // ─── State ────────────────────────────────
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<{ id: string; name: string }[]>([]);
  const [folders, setFolders] = useState<LibraryFolder[]>([]);
  const [files, setFiles] = useState<LibraryFileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Upload
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        api.get(`/library/folders${folderParams}`),
        api.get(`/library/files${fileParams}`),
      ]);
      setFolders(foldersRes.data);
      setFiles(filesRes.data);
    } catch (err) {
      console.error('Error loading Library contents', err);
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
      const res = await api.get(`/library/folders/${folderId}/breadcrumb`);
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
    setCurrentFolderId(folderId);
  };

  // ─── Create Folder ────────────────────────
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const formData = new FormData();
      formData.append('name', newFolderName.trim());
      if (currentFolderId) formData.append('parent_id', currentFolderId);
      await api.post('/library/folders', formData);
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
  const confirmDeleteFolder = (folder: LibraryFolder) => {
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
      await api.delete(`/library/folders/${folderId}`);
      fetchContents(currentFolderId);
    } catch {
      setAlert({ isOpen: true, type: 'error', title: 'Error', message: 'No se pudo eliminar la carpeta.' });
    }
  };

  // ─── Delete File ──────────────────────────
  const confirmDeleteFile = (file: LibraryFileItem) => {
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
      await api.delete(`/library/files/${fileId}`);
      fetchContents(currentFolderId);
    } catch {
      setAlert({ isOpen: true, type: 'error', title: 'Error', message: 'No se pudo eliminar el archivo.' });
    }
  };

  // ─── Download File ────────────────────────
  const handleDownload = async (file: LibraryFileItem) => {
    try {
      const res = await api.get(`/library/files/${file.id}/download`, { responseType: 'blob' });
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
    Array.from(fileList).forEach(f => {
      if (f.name.toLowerCase().endsWith('.pdf')) {
        validFiles.push(f);
      }
    });

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
      await api.post('/library/upload', formData, {
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
      setTimeout(() => {
        setUploadQueue(prev => prev.filter(u => u.id !== item.id));
      }, 3000);
    } catch (err: any) {
      setUploadQueue(prev =>
        prev.map(u =>
          u.id === item.id
            ? { ...u, status: 'error', errorMsg: err.response?.data?.detail || 'Error' }
            : u
        )
      );
    }
  };

  // ─── Render ───────────────────────────────
  return (
    <motion.div
      key="library-view"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="pdf-toolbar">
        <button className="btn-primary" style={{ height: 44 }} onClick={() => setShowNewFolderModal(true)}>
          <FolderPlus size={18} /> Nueva Carpeta
        </button>
        <button
          className="btn-secondary"
          style={{ height: 44, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={18} /> Subir Ley / Artículo
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => { if (e.target.files) processFiles(e.target.files); e.target.value = ''; }}
        />
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gold-opaque)', fontWeight: 600 }}>
          <BookOpen size={20} /> Biblioteca de Leyes
        </div>
      </div>

      <div className="pdf-breadcrumb">
        <span
          className={`pdf-breadcrumb-item ${!currentFolderId ? 'active' : ''}`}
          onClick={() => navigateToFolder(null)}
        >
          <Home size={15} style={{ marginRight: 4, verticalAlign: 'middle' }} />
          Biblioteca
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

      <div
        className={`pdf-dropzone ${isDragActive ? 'drag-active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragActive(false); if (e.dataTransfer.files) processFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="pdf-dropzone-icon">
          <BookOpen size={40} color="var(--gold-opaque)" />
        </div>
        <div className="pdf-dropzone-text">
          Sube leyes, artículos o reglamentos en PDF aquí<br />
          o <strong>haz clic para seleccionar</strong>
        </div>
      </div>

      {/* Upload Queue */}
      <AnimatePresence>
        {uploadQueue.length > 0 && (
          <div className="pdf-upload-queue">
            {uploadQueue.map(item => (
              <div key={item.id} className={`pdf-upload-item ${item.status}`}>
                {item.status === 'uploading' ? <HourglassLoader /> : item.status === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                <div className="pdf-upload-info">
                  <div className="pdf-upload-name">{item.file.name}</div>
                  <div className="pdf-progress-track"><div className="pdf-progress-fill" style={{ width: `${item.progress}%` }} /></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Content Grid */}
      {isLoading ? (
        <div className="pdf-empty"><HourglassLoader /><span>Cargando biblioteca...</span></div>
      ) : (folders.length === 0 && files.length === 0) ? (
        <div className="pdf-empty">
          <BookOpen size={56} />
          <span>La biblioteca está vacía</span>
          <span style={{ fontSize: '0.85rem' }}>Organiza las leyes por carpetas o sube archivos PDF directamente</span>
        </div>
      ) : (
        <div className="pdf-grid">
          {folders.map(folder => (
            <motion.div key={folder.id} className="pdf-grid-item" whileHover={{ scale: 1.02 }} onClick={() => navigateToFolder(folder.id)}>
              <div className="item-actions">
                <button className="delete-btn" onClick={(e) => { e.stopPropagation(); confirmDeleteFolder(folder); }}><Trash2 size={14} /></button>
              </div>
              <div className="item-icon folder"><Folder size={26} /></div>
              <div className="item-name">{folder.name}</div>
            </motion.div>
          ))}
          {files.map(file => (
            <motion.div key={file.id} className="pdf-grid-item" whileHover={{ scale: 1.02 }} onClick={() => handleDownload(file)}>
              <div className="item-actions">
                <button onClick={(e) => { e.stopPropagation(); handleDownload(file); }}><Download size={14} /></button>
                <button className="delete-btn" onClick={(e) => { e.stopPropagation(); confirmDeleteFile(file); }}><Trash2 size={14} /></button>
              </div>
              <div className="item-icon file"><FileText size={26} /></div>
              <div className="item-name">{file.original_name}</div>
              <div className="item-meta">{formatSize(file.file_size)}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* New Folder Modal */}
      <AnimatePresence>
        {showNewFolderModal && (
          <div className="pdf-modal-overlay" onClick={() => setShowNewFolderModal(false)}>
            <div className="pdf-modal" onClick={(e) => e.stopPropagation()}>
              <h3 style={{ marginBottom: '1.5rem' }}>Nueva Carpeta de Biblioteca</h3>
              <input className="form-control" placeholder="Nombre de la carpeta" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} autoFocus />
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowNewFolderModal(false)}>Cancelar</button>
                <button className="btn-primary" style={{ flex: 2 }} onClick={handleCreateFolder}>Crear</button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AlertModal
        isOpen={alert.isOpen}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={() => { if (alert.onConfirm) alert.onConfirm(); setAlert({ ...alert, isOpen: false }); }}
        onClose={() => setAlert({ ...alert, isOpen: false })}
      />
    </motion.div>
  );
};

export default LibraryDrive;
