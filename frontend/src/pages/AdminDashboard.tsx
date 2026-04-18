import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Trash2, LogOut, Pencil, X } from 'lucide-react';
import logoPequeno from '../assets/Logo pequeño.jpeg';
import MapPicker from '../components/MapPicker';

const AdminDashboard = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const navigate = useNavigate();

  const fetchRecords = async () => {
    try {
      const token = localStorage.getItem('qsd_admin_token');
      if (!token) return navigate('/admin');
      
      const res = await api.get('/admin/records', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecords(res.data);
    } catch (err: any) {
      if (err.response?.status === 401) navigate('/admin');
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro lógicamente? No se borrará de la base de datos, solo se ocultará.')) return;
    try {
      const token = localStorage.getItem('qsd_admin_token');
      await api.delete(`/admin/records/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRecords(); 
    } catch (err) {
      alert('Error eliminando registro.');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('qsd_admin_token');
      await api.put(`/admin/records/${editingRecord.id}`, editingRecord, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingRecord(null);
      fetchRecords();
    } catch (err) {
      alert('Error al guardar cambios.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('qsd_admin_token');
    navigate('/admin');
  };

  return (
    <div className="container min-h-screen" style={{ maxWidth: '100%', padding: '1rem' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src={logoPequeno} alt="QSD Logo" style={{ height: '50px', objectFit: 'contain', borderRadius: '4px' }} />
            <h2 style={{ color: 'var(--gold-opaque)', margin: 0 }}>Registros Gubernamentales</h2>
          </div>
          <button className="btn-secondary" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LogOut size={18} /> Salir
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.1)', fontSize: '0.85rem' }}>
                <th style={{ padding: '1rem' }}>ID</th>
                <th style={{ padding: '1rem' }}>Nombre</th>
                <th style={{ padding: '1rem' }}>Paterno</th>
                <th style={{ padding: '1rem' }}>Materno</th>
                <th style={{ padding: '1rem' }}>F. Nacimiento</th>
                <th style={{ padding: '1rem' }}>Secretaría</th>
                <th style={{ padding: '1rem' }}>Cargo</th>
                <th style={{ padding: '1rem' }}>Teléfono</th>
                <th style={{ padding: '1rem' }}>Correo</th>
                <th style={{ padding: '1rem' }}>Redes Sociales</th>
                <th style={{ padding: '1rem' }}>Código Postal</th>
                <th style={{ padding: '1rem' }}>Domicilio</th>
                <th style={{ padding: '1rem' }}>Latitud</th>
                <th style={{ padding: '1rem' }}>Longitud</th>
                <th style={{ padding: '1rem' }}>Creado en</th>
                <th style={{ padding: '1rem' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.05)', fontSize: '0.85rem' }}>
                  <td style={{ padding: '1rem' }}>{record.id.split('-')[0]}...</td>
                  <td style={{ padding: '1rem' }}>{record.name}</td>
                  <td style={{ padding: '1rem' }}>{record.paternal_name}</td>
                  <td style={{ padding: '1rem' }}>{record.maternal_name}</td>
                  <td style={{ padding: '1rem' }}>{record.date_of_birth}</td>
                  <td style={{ padding: '1rem' }}>{record.secretary}</td>
                  <td style={{ padding: '1rem' }}>{record.position}</td>
                  <td style={{ padding: '1rem' }}>{record.phone}</td>
                  <td style={{ padding: '1rem' }}>{record.email}</td>
                  <td style={{ padding: '1rem' }}>{record.social_media || '-'}</td>
                  <td style={{ padding: '1rem' }}>{record.zip_code}</td>
                  <td style={{ padding: '1rem' }}>{record.address}</td>
                  <td style={{ padding: '1rem' }}>{record.latitude}</td>
                  <td style={{ padding: '1rem' }}>{record.longitude}</td>
                  <td style={{ padding: '1rem' }}>{new Date(record.created_at).toLocaleString()}</td>
                  <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setEditingRecord({...record})} className="btn-secondary" style={{ padding: '0.4rem 0.6rem' }} title="Editar registro">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => handleDelete(record.id)} className="btn-danger" title="Eliminar lógicamente">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={16} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No hay registros activos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* EDIT MODAL */}
      {editingRecord && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel" style={{ width: '95%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
              <h3 style={{ color: 'var(--gold-opaque)' }}>Editar Registro Completo</h3>
              <button onClick={() => setEditingRecord(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="var(--text-main)" /></button>
            </div>
            
            <form onSubmit={handleSaveEdit}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Nombre</label>
                  <input required className="form-control" value={editingRecord.name} onChange={(e) => setEditingRecord({...editingRecord, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Ap. Paterno</label>
                  <input required className="form-control" value={editingRecord.paternal_name} onChange={(e) => setEditingRecord({...editingRecord, paternal_name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Ap. Materno</label>
                  <input required className="form-control" value={editingRecord.maternal_name} onChange={(e) => setEditingRecord({...editingRecord, maternal_name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha de Nacimiento</label>
                  <input type="date" required className="form-control" value={editingRecord.date_of_birth} onChange={(e) => setEditingRecord({...editingRecord, date_of_birth: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <input required className="form-control" value={editingRecord.phone} onChange={(e) => setEditingRecord({...editingRecord, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Correo Electrónico</label>
                  <input type="email" required className="form-control" value={editingRecord.email} onChange={(e) => setEditingRecord({...editingRecord, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Secretaría</label>
                  <input required className="form-control" value={editingRecord.secretary} onChange={(e) => setEditingRecord({...editingRecord, secretary: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Cargo</label>
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
                <label className="form-label">Domicilio</label>
                <input required className="form-control" value={editingRecord.address} onChange={(e) => setEditingRecord({...editingRecord, address: e.target.value})} />
              </div>

              {/* MAPA INCORPORADO PARA LA UBICACIÓN */}
              <div className="form-group">
                <MapPicker 
                  initialLat={editingRecord.latitude} 
                  initialLng={editingRecord.longitude}
                  onLocationSelect={(lat, lng) => setEditingRecord({...editingRecord, latitude: lat, longitude: lng})} 
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Guardar Todos Los Cambios</button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
