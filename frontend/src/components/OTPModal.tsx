import React, { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api';
import { Mail, CheckCircle2 } from 'lucide-react';

interface OTPModalProps {
  email: string;
  regData: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const OTPModal: React.FC<OTPModalProps> = ({ email, regData, onSuccess, onCancel }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/register/verify', {
        email,
        otp_code: otp,
        registry_data: regData
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Código incorrecto o expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000
    }}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-panel"
        style={{ maxWidth: '400px', width: '90%', textAlign: 'center' }}
      >
        <Mail size={48} color="var(--gold-opaque)" style={{ marginBottom: '1rem' }} />
        <h3 style={{ marginBottom: '1rem' }}>Verificación de Correo</h3>
        <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
          Hemos enviado un código OTP a <strong>{email}</strong>. Ingresa el código para completar tu registro.
        </p>

        {error && <p className="error-text" style={{ marginBottom: '1rem' }}>{error}</p>}

        <form onSubmit={handleVerify}>
          <input 
            type="text" 
            className="form-control" 
            style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem', marginBottom: '1.5rem' }}
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="000000"
            required
          />
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onCancel}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Verificando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export const SuccessScreen = ({ onReset }: { onReset: () => void }) => (
  <motion.div 
    initial={{ scale: 0.8, opacity: 0 }} 
    animate={{ scale: 1, opacity: 1 }} 
    className="flex-center" 
    style={{ minHeight: '60vh', flexDirection: 'column' }}
  >
    <CheckCircle2 size={80} color="var(--gold-opaque)" style={{ marginBottom: '1.5rem' }} />
    <h2 style={{ marginBottom: '1rem' }}>¡Registro Exitoso!</h2>
    <p style={{ textAlign: 'center', color: 'var(--text-muted)', maxWidth: '400px', marginBottom: '2rem' }}>
      Tus datos han sido guardados correctamente de forma segura en nuestro sistema.
    </p>
    <button className="btn-primary" onClick={onReset}>
      Nuevo Registro
    </button>
  </motion.div>
);

export default OTPModal;
