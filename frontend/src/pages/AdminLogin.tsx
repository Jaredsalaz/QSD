import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Lock } from 'lucide-react';
import logoRegistro from '../assets/logo.jpeg';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/admin/login', {
        email,
        password
      });
      localStorage.setItem('qsd_admin_token', res.data.access_token);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Credenciales inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container min-h-screen flex-center">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel"
        style={{ width: '100%', maxWidth: '400px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src={logoRegistro} alt="QSD Logo" style={{ height: '80px', objectFit: 'contain', marginBottom: '1rem' }} />
          <h2 style={{ color: 'var(--gold-opaque)' }}>Panel Administrativo</h2>
          <div style={{ display: 'inline-flex', padding: '0.5rem', borderRadius: '50%', background: 'rgba(212, 175, 55, 0.1)', marginTop: '0.5rem' }}>
             <Lock size={20} color="var(--gold-opaque)" />
          </div>
        </div>

        {error && <p className="error-text" style={{ textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Correo Administrativo</label>
            <input 
              type="email" 
              className="form-control" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input 
              type="password" 
              className="form-control" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
