import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Trash2, Pencil, X, Search, UserCheck, MessageSquare, Phone, Mail, ChevronLeft, ChevronRight, Filter, Loader2, FileDown, ClipboardList, Eye } from 'lucide-react';
import MapPicker from '../components/MapPicker';
import Sidebar from '../components/Sidebar';
import RegistrationForm from '../components/RegistrationForm';
import ImageUploadDropzone from '../components/ImageUploadDropzone';
import AuthenticatedImage from '../components/AuthenticatedImage';
import PdfDrive from '../components/PdfDrive';
import AlertModal from '../components/AlertModal';
import ReportModal from '../components/ReportModal';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale/es';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('es', es);

const AdminDashboard = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [viewingRecord, setViewingRecord] = useState<any | null>(null);
  const [currentView, setCurrentView] = useState<'LIST' | 'REGISTER' | 'AUDIT' | 'PDF'>('LIST');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [currentAuditPage, setCurrentAuditPage] = useState(1);
  const itemsPerPage = 10;

  // Filter State
  const [selectedSecretary, setSelectedSecretary] = useState('ALL');
  
  // Key to force reset of registration form
  const [regFormKey, setRegFormKey] = useState(0);

  // Alert state
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    type: 'success' | 'confirm' | 'error';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const navigate = useNavigate();
  const adminEmail = localStorage.getItem('qsd_admin_email') || 'Administrador';

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/records');
      setRecords(res.data);
    } catch (err: any) {
      if (err.response?.status === 401) navigate('/admin');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/admin/audit-log');
      setAuditLogs(res.data);
    } catch (err) {
      console.error('Error cargando bitácora', err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('qsd_admin_token');
    if (!token) {
      navigate('/admin');
    } else {
      fetchRecords();
    }
  }, [navigate]);

  // Derived Values
  const secretaries = useMemo(() => {
    const set = new Set(records.map(r => r.secretary));
    return Array.from(set).sort();
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchesSearch = 
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.paternal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSecretary = selectedSecretary === 'ALL' || r.secretary === selectedSecretary;
      
      return matchesSearch && matchesSecretary;
    });
  }, [records, searchTerm, selectedSecretary]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage]);

  const confirmDelete = (id: string) => {
    setAlert({
      isOpen: true,
      type: 'confirm',
      title: 'Eliminar Registro',
      message: '¿Estás seguro de eliminar este registro?',
      onConfirm: () => handleDelete(id)
    });
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      await api.delete(`/admin/records/${id}`);
      setAlert({
        isOpen: true,
        type: 'success',
        title: 'Registro Eliminado',
        message: 'El ciudadano ha sido removido exitosamente.'
      });
      fetchRecords(); 
    } catch (err) {
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo eliminar el registro.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.put(`/admin/records/${editingRecord.id}`, editingRecord);
      setEditingRecord(null);
      setAlert({
        isOpen: true,
        type: 'success',
        title: 'Actualización Exitosa',
        message: 'La información ha sido actualizada correctamente.'
      });
      fetchRecords();
    } catch (err) {
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error de Guardado',
        message: 'Ocurrió un problema al guardar los cambios.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUploadEdit = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'ine_front_url' | 'ine_back_url') => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    if (!file.type.startsWith('image/')) {
       setAlert({ isOpen: true, type: 'error', title: 'Error', message: 'Por favor sube solo imágenes.' });
       return;
    }
    
    const uploadData = new FormData();
    uploadData.append('file', file);
    
    setIsLoading(true);
    try {
      const res = await api.post('/upload-image', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setEditingRecord((prev: any) => ({ ...prev, [fieldName]: res.data.filename }));
    } catch (err: any) {
      setAlert({ isOpen: true, type: 'error', title: 'Error de Subida', message: 'No se pudo subir la imagen.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('qsd_admin_token');
    localStorage.removeItem('qsd_admin_role');
    localStorage.removeItem('qsd_admin_email');
    navigate('/admin');
  };

  const handleRegistrationSuccess = () => {
    setAlert({
      isOpen: true,
      type: 'confirm',
      title: 'Registro Exitoso',
      message: 'El ciudadano ha sido dado de alta. ¿Qué deseas hacer ahora?',
      onConfirm: () => {
        setRegFormKey(prev => prev + 1);
        setAlert({ ...alert, isOpen: false });
      }
    });
    fetchRecords();
  };

  const ACTION_COLORS: Record<string, string> = {
    CREATE: '#22c55e',
    UPDATE: '#f59e0b',
    DELETE: '#ef4444',
  };
  const ACTION_LABELS: Record<string, string> = {
    CREATE: 'Alta',
    UPDATE: 'Actualización',
    DELETE: 'Eliminación',
  };

  const totalAuditPages = Math.ceil(auditLogs.length / itemsPerPage);
  const paginatedAuditLogs = useMemo(() => {
    const start = (currentAuditPage - 1) * itemsPerPage;
    return auditLogs.slice(start, start + itemsPerPage);
  }, [auditLogs, currentAuditPage]);

  return (
    <div className="dashboard-layout">
      <Sidebar 
        currentView={currentView} 
        onViewChange={(view) => {
          setCurrentView(view);
          setCurrentPage(1);
          setCurrentAuditPage(1);
          if (view === 'AUDIT') fetchAuditLogs();
        }} 
        onLogout={handleLogout} 
      />

      <main className="main-content">
        <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {currentView === 'LIST' ? 'Gestión de Registros' : currentView === 'REGISTER' ? 'Nuevo Registro de Ciudadano' : currentView === 'PDF' ? 'Unidad de Documentos PDF' : 'Bitácora de Auditoría'}
            </h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {currentView === 'LIST' ? `Total: ${filteredRecords.length} encontrados` : currentView === 'REGISTER' ? 'Completa el formulario para dar de alta un nuevo perfil' : currentView === 'PDF' ? 'Gestiona, organiza y comparte archivos PDF de seguridad' : `${auditLogs.length} eventos registrados`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                height: '45px',
                padding: '0 1rem',
                borderRadius: '12px',
                background: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                color: 'var(--gold-opaque)',
                fontWeight: 600,
              }}
              title={`Sesión activa: ${adminEmail}`}
            >
              <UserCheck size={16} />
              <span>{adminEmail}</span>
            </div>

            {currentView === 'LIST' && (
              <>
              {/* Reports Button */}
              <button 
                onClick={() => setIsReportModalOpen(true)}
                className="btn-secondary" 
                style={{ height: '45px', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(212,175,55,0.1)', borderColor: 'rgba(212,175,55,0.3)' }}
              >
                <FileDown size={18} color="var(--gold-opaque)" />
                <span style={{ color: 'var(--gold-opaque)' }}>Reportes</span>
              </button>

              {/* Filter */}
              <div style={{ position: 'relative' }}>
                <Filter style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
                <select 
                  className="form-control" 
                  style={{ paddingLeft: '2.5rem', width: '200px', height: '45px' }}
                  value={selectedSecretary}
                  onChange={(e) => {
                    setSelectedSecretary(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="ALL">Todas las Secretarías</option>
                  {secretaries.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  className="form-control" 
                  style={{ paddingLeft: '3rem', width: '250px', height: '45px' }}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              </>
            )}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
            >
              <Loader2 className="spinner" size={48} color="var(--gold-opaque)" />
              <span style={{ color: 'var(--gold-opaque)', fontWeight: 600 }}>Cargando...</span>
            </motion.div>
          )}

          {currentView === 'LIST' ? (
            <motion.div 
              key="list-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="glass-panel"
              style={{ padding: '0', overflow: 'hidden', opacity: isLoading ? 0.3 : 1 }}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ background: 'rgba(0,0,0,0.02)' }}>
                    <tr style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
                      <th style={{ padding: '1.25rem 1rem' }}>Ciudadano</th>
                      <th style={{ padding: '1.25rem 1rem' }}>Contacto y Redes</th>
                      <th style={{ padding: '1.25rem 1rem' }}>Dependencia / Cargo</th>
                      <th style={{ padding: '1.25rem 1rem' }}>Ubicación</th>
                      <th style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRecords.map((record) => (
                      <tr key={record.id} style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.03)' }}>
                        <td style={{ padding: '1.5rem 1rem' }}>
                          <div style={{ fontWeight: 600, fontSize: '1rem' }}>{record.name} {record.paternal_name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {record.id.split('-')[0]}</div>
                        </td>
                        <td style={{ padding: '1.5rem 1rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                               <Mail size={14} color="var(--gold-opaque)" /> {record.email}
                             </div>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                               <Phone size={14} color="var(--gold-opaque)" /> {record.phone}
                             </div>
                             {record.social_media && (
                               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--gold-opaque)' }}>
                                 <MessageSquare size={14} /> {record.social_media}
                               </div>
                             )}
                          </div>
                        </td>
                        <td style={{ padding: '1.5rem 1rem' }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{record.secretary}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{record.position}</div>
                        </td>
                        <td style={{ padding: '1.5rem 1rem' }}>
                          <div style={{ fontSize: '0.9rem' }}>CP: {record.zip_code}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '220px', lineHeight: '1.4' }}>{record.address}</div>
                        </td>
                        <td style={{ padding: '1.5rem 1rem' }}>
                           <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button onClick={() => setViewingRecord(record)} className="btn-secondary" style={{ padding: '0.5rem', border: 'none', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }} title="Ver detalles">
                              <Eye size={18} />
                            </button>
                            <button onClick={() => setEditingRecord({...record})} className="btn-secondary" style={{ padding: '0.5rem', border: 'none', background: 'rgba(212, 175, 55, 0.1)', color: 'var(--gold-opaque)' }}>
                              <Pencil size={18} />
                            </button>
                            <button onClick={() => confirmDelete(record.id)} className="btn-danger" style={{ padding: '0.5rem', border: 'none' }}>
                              <Trash2 size={18} />
                            </button>
                           </div>
                        </td>
                      </tr>
                    ))}
                    {paginatedRecords.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <Search size={48} opacity={0.2} />
                            <span>No se encontraron registros.</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {filteredRecords.length > 0 && (
                <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Mostrando <span style={{ fontWeight: 600 }}>{paginatedRecords.length}</span> de <span style={{ fontWeight: 600 }}>{filteredRecords.length}</span>
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                      className="btn-secondary" 
                      style={{ padding: '0.5rem 1rem', opacity: currentPage === 1 ? 0.5 : 1 }}
                    >
                      <ChevronLeft size={18} /> Anterior
                    </button>
                    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', padding: '0 1rem' }}>
                      <span style={{ fontWeight: 600 }}>{currentPage}</span> / {totalPages}
                    </div>
                    <button 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                      className="btn-secondary" 
                      style={{ padding: '0.5rem 1rem', opacity: currentPage === totalPages ? 0.5 : 1 }}
                    >
                      Siguiente <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : currentView === 'REGISTER' ? (
            <motion.div 
              key={`register-view-${regFormKey}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{ maxWidth: '900px', margin: '0 auto' }}
            >
              <RegistrationForm key={regFormKey} onRegistrationSuccess={handleRegistrationSuccess} />
            </motion.div>
          ) : currentView === 'PDF' ? (
            <PdfDrive />
          ) : (
            /* AUDIT LOG VIEW */
            <motion.div
              key="audit-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-panel"
              style={{ padding: 0, overflow: 'hidden' }}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ background: 'rgba(0,0,0,0.02)' }}>
                    <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <th style={{ padding: '1.25rem 1rem' }}>Acción</th>
                      <th style={{ padding: '1.25rem 1rem' }}>Ciudadano</th>
                      <th style={{ padding: '1.25rem 1rem' }}>Administrador</th>
                      <th style={{ padding: '1.25rem 1rem' }}>Detalles</th>
                      <th style={{ padding: '1.25rem 1rem' }}>Fecha y Hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAuditLogs.map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                        <td style={{ padding: '1.25rem 1rem' }}>
                          <span style={{ display: 'inline-block', padding: '0.3rem 0.8rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, background: `${ACTION_COLORS[log.action]}22`, color: ACTION_COLORS[log.action] }}>
                            {ACTION_LABELS[log.action] || log.action}
                          </span>
                        </td>
                        <td style={{ padding: '1.25rem 1rem', fontWeight: 500 }}>{log.citizen_name}</td>
                        <td style={{ padding: '1.25rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{log.admin_email}</td>
                        <td style={{ padding: '1.25rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{log.details || '—'}</td>
                        <td style={{ padding: '1.25rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {log.timestamp ? new Date(log.timestamp).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }) : '—'}
                        </td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <ClipboardList size={48} opacity={0.2} />
                            <span>No hay eventos registrados aún.</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Audit Pagination Controls */}
              {auditLogs.length > 0 && (
                <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Mostrando <span style={{ fontWeight: 600 }}>{paginatedAuditLogs.length}</span> de <span style={{ fontWeight: 600 }}>{auditLogs.length}</span>
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      disabled={currentAuditPage === 1}
                      onClick={() => setCurrentAuditPage(p => p - 1)}
                      className="btn-secondary" 
                      style={{ padding: '0.5rem 1rem', opacity: currentAuditPage === 1 ? 0.5 : 1 }}
                    >
                      <ChevronLeft size={18} /> Anterior
                    </button>
                    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', padding: '0 1rem' }}>
                      <span style={{ fontWeight: 600 }}>{currentAuditPage}</span> / {totalAuditPages}
                    </div>
                    <button 
                      disabled={currentAuditPage === totalAuditPages}
                      onClick={() => setCurrentAuditPage(p => p + 1)}
                      className="btn-secondary" 
                      style={{ padding: '0.5rem 1rem', opacity: currentAuditPage === totalAuditPages ? 0.5 : 1 }}
                    >
                      Siguiente <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* REFINED EDIT MODAL */}
        {editingRecord && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel" style={{ width: '95%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', background: '#fff', padding: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '0.5rem', background: 'rgba(212,175,55,0.1)', borderRadius: '8px' }}>
                    <UserCheck color="var(--gold-opaque)" />
                  </div>
                  <h3 style={{ color: 'var(--text-main)', margin: 0 }}>Modificar Perfil de Ciudadano</h3>
                </div>
                <button onClick={() => setEditingRecord(null)} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex' }}>
                   <X size={20} color="var(--text-main)" />
                </button>
              </div>
              
              <form onSubmit={handleSaveEdit}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Nombre</label>
                    <input required className="form-control" value={editingRecord.name} onChange={(e) => setEditingRecord({...editingRecord, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Apellido Paterno</label>
                    <input required className="form-control" value={editingRecord.paternal_name} onChange={(e) => setEditingRecord({...editingRecord, paternal_name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Apellido Materno</label>
                    <input required className="form-control" value={editingRecord.maternal_name} onChange={(e) => setEditingRecord({...editingRecord, maternal_name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fecha de Nacimiento</label>
                    <DatePicker
                      selected={editingRecord.date_of_birth ? new Date(editingRecord.date_of_birth + 'T12:00:00') : null}
                      onChange={(date: Date | null) => setEditingRecord({...editingRecord, date_of_birth: date?.toISOString().split('T')[0]})}
                      dateFormat="dd/MM/yyyy"
                      className="form-control"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      locale="es"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono</label>
                    <input required className="form-control" value={editingRecord.phone} onChange={(e) => setEditingRecord({...editingRecord, phone: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Correo Institucional</label>
                    <input type="email" required className="form-control" value={editingRecord.email} onChange={(e) => setEditingRecord({...editingRecord, email: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Secretaría / Dependencia</label>
                    <input required className="form-control" value={editingRecord.secretary} onChange={(e) => setEditingRecord({...editingRecord, secretary: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cargo / Puesto</label>
                    <input required className="form-control" value={editingRecord.position} onChange={(e) => setEditingRecord({...editingRecord, position: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Redes Sociales</label>
                    <input className="form-control" value={editingRecord.social_media || ''} onChange={(e) => setEditingRecord({...editingRecord, social_media: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Código Postal</label>
                    <input required className="form-control" value={editingRecord.zip_code} onChange={(e) => setEditingRecord({...editingRecord, zip_code: e.target.value})} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Domicilio Detallado</label>
                  <input required className="form-control" value={editingRecord.address} onChange={(e) => setEditingRecord({...editingRecord, address: e.target.value})} />
                </div>

                <div className="grid-2" style={{ marginBottom: '1rem' }}>
                   <ImageUploadDropzone 
                     label="INE Frontal (Actualizar)" 
                     isUploaded={!!editingRecord.ine_front_url} 
                     onFileSelect={(e) => handleFileUploadEdit(e, 'ine_front_url')} 
                   />
                   <ImageUploadDropzone 
                     label="INE Reverso (Actualizar)" 
                     isUploaded={!!editingRecord.ine_back_url} 
                     onFileSelect={(e) => handleFileUploadEdit(e, 'ine_back_url')} 
                   />
                </div>

                <div className="form-group" style={{ height: '300px', marginBottom: '2.5rem' }}>
                  <label className="form-label">Geolocalización</label>
                  <MapPicker 
                    initialLat={editingRecord.latitude} 
                    initialLng={editingRecord.longitude}
                    onLocationSelect={(lat, lng) => setEditingRecord({...editingRecord, latitude: lat, longitude: lng})} 
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                   <button type="button" onClick={() => setEditingRecord(null)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                   <button type="submit" className="btn-primary" style={{ flex: 2 }}>Actualizar Registro</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* VIEW MODAL */}
        {viewingRecord && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel" style={{ width: '95%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', background: '#fff', padding: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '1rem' }}>
                <h3 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.5rem' }}>Detalles del Ciudadano</h3>
                <button onClick={() => setViewingRecord(null)} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex' }}>
                   <X size={20} color="var(--text-main)" />
                </button>
              </div>
              
              <div className="grid-2" style={{ gap: '1.5rem' }}>
                <div>
                  <h4 style={{ color: 'var(--gold-opaque)', marginBottom: '1rem' }}>Información Personal</h4>
                  <p><strong>Nombre Completo:</strong> {viewingRecord.name} {viewingRecord.paternal_name} {viewingRecord.maternal_name}</p>
                  <p><strong>Fecha de Nacimiento:</strong> {viewingRecord.date_of_birth}</p>
                  <p><strong>Secretaría / Dependencia:</strong> {viewingRecord.secretary}</p>
                  <p><strong>Cargo / Puesto:</strong> {viewingRecord.position}</p>
                </div>
                <div>
                  <h4 style={{ color: 'var(--gold-opaque)', marginBottom: '1rem' }}>Contacto y Ubicación</h4>
                  <p><strong>Teléfono:</strong> {viewingRecord.phone}</p>
                  <p><strong>Correo:</strong> {viewingRecord.email}</p>
                  <p><strong>Redes Sociales:</strong> {viewingRecord.social_media || 'N/A'}</p>
                  <p><strong>Código Postal:</strong> {viewingRecord.zip_code}</p>
                  <p><strong>Dirección:</strong> {viewingRecord.address}</p>
                </div>
              </div>

              <div style={{ marginTop: '2rem' }}>
                <h4 style={{ color: 'var(--gold-opaque)', marginBottom: '1rem' }}>Identificación Oficial (INE)</h4>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                   {viewingRecord.ine_front_url ? (
                     <div style={{ flex: '1 1 300px' }}>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>Frente:</p>
                        <AuthenticatedImage src={`/images/${viewingRecord.ine_front_url}`} alt="INE Frente" style={{ width: '100%', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', minHeight: '200px' }} />
                     </div>
                   ) : (
                     <p style={{ color: 'var(--text-muted)' }}>No se subió foto frontal.</p>
                   )}

                   {viewingRecord.ine_back_url ? (
                     <div style={{ flex: '1 1 300px' }}>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>Reverso:</p>
                        <AuthenticatedImage src={`/images/${viewingRecord.ine_back_url}`} alt="INE Reverso" style={{ width: '100%', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', minHeight: '200px' }} />
                     </div>
                   ) : (
                     <p style={{ color: 'var(--text-muted)' }}>No se subió foto reverso.</p>
                   )}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        <ReportModal 
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          data={filteredRecords} // Intelligent: Exports what you see filtered
        />

        <AlertModal 
          isOpen={alert.isOpen}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          confirmText={alert.title === 'Registro Exitoso' ? 'Registrar Otro' : 'Confirmar'}
          cancelText={alert.title === 'Registro Exitoso' ? 'Ver Lista' : 'Cancelar'}
          onConfirm={() => {
            if (alert.onConfirm) alert.onConfirm();
            setAlert({ ...alert, isOpen: false });
          }}
          onClose={() => {
            if (alert.title === 'Registro Exitoso') {
              setCurrentView('LIST');
            }
            setAlert({ ...alert, isOpen: false });
          }}
        />
      </main>
    </div>
  );
};

export default AdminDashboard;
