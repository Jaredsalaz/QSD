import React, { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api';
import MapPicker from './MapPicker';
import logoRegistro from '../assets/logo.jpeg';

interface RegistrationFormProps {
  onRegistrationSuccess: () => void;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onRegistrationSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    paternal_name: '',
    maternal_name: '',
    date_of_birth: '',
    secretary: '',
    position: '',
    phone: '',
    email: '',
    social_media: '',
    address: '',
    latitude: '',
    longitude: '',
    zip_code: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const setCoordinates = (lat: string, lng: string) => {
    setFormData({ ...formData, latitude: lat, longitude: lng });
  };

  const validate = () => {
    for (const [key, value] of Object.entries(formData)) {
      if (key !== 'social_media' && key !== 'latitude' && key !== 'longitude' && !value) {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validate()) {
      setError('Por favor llena todos los campos obligatorios.');
      return;
    }
    
    setLoading(true);
    try {
      // Direct registration backend call
      await api.post('/register', formData);
      onRegistrationSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al completar el registro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="glass-panel"
      style={{ padding: '2rem' }}
    >
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--gold-opaque)', fontSize: '1.5rem', fontWeight: 600 }}>Captura de Nuevo Ciudadano</h2>
        <p style={{ color: 'var(--text-muted)' }}>Ingrese los datos para el registro oficial en la base de datos QSD</p>
      </div>
      
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="error-text" style={{textAlign: 'center', marginBottom: '1rem', fontSize: '1rem', padding: '1rem', background: 'rgba(255,0,0,0.1)', borderRadius:'8px'}}>
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input type="text" name="name" className="form-control" onChange={handleChange} placeholder="Ej. Juan" required />
          </div>
          <div className="form-group">
            <label className="form-label">Apellido Paterno</label>
            <input type="text" name="paternal_name" className="form-control" onChange={handleChange} placeholder="Ej. Pérez" required />
          </div>
          <div className="form-group">
            <label className="form-label">Apellido Materno</label>
            <input type="text" name="maternal_name" className="form-control" onChange={handleChange} placeholder="Ej. López" required />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha de Nacimiento</label>
            <input type="date" name="date_of_birth" className="form-control" onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Secretaría</label>
            <input type="text" name="secretary" className="form-control" onChange={handleChange} placeholder="Ej. Secretaría de Hacienda" required />
          </div>
          <div className="form-group">
            <label className="form-label">Cargo</label>
            <input type="text" name="position" className="form-control" onChange={handleChange} placeholder="Ej. Dirección General" required />
          </div>
          <div className="form-group">
            <label className="form-label">Teléfono</label>
            <input type="tel" name="phone" className="form-control" onChange={handleChange} placeholder="Ej. 55 1234 5678" required />
          </div>
          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
            <input type="email" name="email" className="form-control" onChange={handleChange} placeholder="Ej. correo@ejemplo.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Redes Sociales (Opcional)</label>
            <input type="text" name="social_media" className="form-control" onChange={handleChange} placeholder="Ej. @Micuenta" />
          </div>
          <div className="form-group">
            <label className="form-label">Código Postal</label>
            <input type="text" name="zip_code" className="form-control" onChange={handleChange} placeholder="Ej. 01000" required />
          </div>
        </div>

        <div className="form-group" style={{marginTop: '1rem'}}>
          <label className="form-label">Domicilio Actual</label>
          <input type="text" name="address" className="form-control" onChange={handleChange} placeholder="Ej. Av. Reforma 123, Ciudad" required />
        </div>

        <MapPicker onLocationSelect={setCoordinates} />

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', maxWidth: '300px' }}>
            {loading ? 'Verificando...' : 'Registrar'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default RegistrationForm;
