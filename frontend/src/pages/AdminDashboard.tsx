import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Trash2, Pencil, X, Search, UserCheck, MessageSquare, Phone, Mail } from 'lucide-react';
import MapPicker from '../components/MapPicker';
import Sidebar from '../components/Sidebar';
import RegistrationForm from '../components/RegistrationForm';
import AlertModal from '../components/AlertModal';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale/es';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('es', es);

const AdminDashboard = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [currentView, setCurrentView] = useState<'LIST' | 'REGISTER'>('LIST');
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Alert API state
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

  const fetchRecords = async () => {
    try {
      const res = await api.get('/admin/records');
      setRecords(res.data);
    } catch (err: any) {
      if (err.response?.status === 401) navigate('/admin');
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

  const confirmDelete = (id: string) => {
    setAlert({
      isOpen: true,
      type: 'confirm',
      title: 'Eliminar Registro',
      message: '¿Estás seguro de eliminar este registro permanentemente de la vista?',
      onConfirm: () => handleDelete(id)
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/records/${id}`);
      setAlert({
        isOpen: true,
        type: 'success',
        title: 'Registro Eliminado',
        message: 'El ciudadano ha sido removido exitosamente de la lista activa.'
      });
      fetchRecords(); 
    } catch (err) {
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo eliminar el registro en este momento.'
      });
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/admin/records/${editingRecord.id}`, editingRecord);
      setEditingRecord(null);
      setAlert({
        isOpen: true,
        type: 'success',
        title: 'Actualización Exitosa',
        message: 'La información del ciudadano ha sido actualizada correctamente en el servidor.'
      });
      fetchRecords();
    } catch (err) {
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error de Guardado',
        message: 'Ocurrió un problema al intentar guardar los cambios.'
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('qsd_admin_token');
    navigate('/admin');
  };

  const handleRegistrationSuccess = () => {
    setShowSuccess(true);
    fetchRecords();
  };

  const filteredRecords = records.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.paternal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-layout">
      <Sidebar 
        currentView={currentView} 
        onViewChange={(view) => {
          setCurrentView(view);
          setShowSuccess(false);
        }} 
        onLogout={handleLogout} 
      />

      <main className="main-content">
        <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {currentView === 'LIST' ? 'Gestión de Registros' : 'Nuevo Registro de Ciudadano'}
            </h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {currentView === 'LIST' ? `Total: ${records.length} registros activos` : 'Completa el formulario para dar de alta un nuevo perfil'}
            </p>
          </div>
          
          {currentView === 'LIST' && (
            <div style={{ position: 'relative', width: '300px' }}>
              <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nombre o correo..." 
                className="form-control" 
                style={{ paddingLeft: '3rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
        </header>

        <AnimatePresence mode="wait">
          {currentView === 'LIST' ? (
            <motion.div 
              key="list-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="glass-panel"
              style={{ padding: '0', overflow: 'hidden' }}
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
                    {filteredRecords.map((record) => (
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
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.address}</div>
                        </td>
                        <td style={{ padding: '1.5rem 1rem' }}>
                           <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
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
                    {filteredRecords.length === 0 && (
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
            </motion.div>
          ) : (
            <motion.div 
              key="register-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{ maxWidth: '900px', margin: '0 auto' }}
            >
              <RegistrationForm onRegistrationSuccess={handleRegistrationSuccess} />
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
                      onChange={(date) => setEditingRecord({...editingRecord, date_of_birth: date?.toISOString().split('T')[0]})}
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
      </main>
    </div>
  );
};

export default AdminDashboard;
