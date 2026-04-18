import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  type: 'confirm' | 'success' | 'error';
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onClose: () => void;
}

const AlertModal: React.FC<AlertModalProps> = ({ 
  isOpen, 
  type, 
  title, 
  message, 
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar', 
  onConfirm, 
  onClose 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={type === 'confirm' ? undefined : onClose}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} 
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="glass-panel"
            style={{ width: '100%', maxWidth: '400px', padding: '2rem', position: 'relative', textAlign: 'center', backgroundColor: '#fff' }}
          >
            {type !== 'confirm' && (
              <button 
                onClick={onClose} 
                style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            )}

            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              {type === 'success' && <CheckCircle2 size={60} color="#28a745" />}
              {type === 'confirm' && <AlertCircle size={60} color="var(--gold-opaque)" />}
              {type === 'error' && <AlertCircle size={60} color="#dc3545" />}
            </div>

            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: 'var(--text-main)' }}>{title}</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.5' }}>{message}</p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              {type === 'confirm' ? (
                <>
                  <button className="btn-secondary" style={{ flex: 1, padding: '0.6rem' }} onClick={onClose}>{cancelText}</button>
                  <button className="btn-primary" style={{ flex: 1, padding: '0.6rem' }} onClick={onConfirm}>{confirmText}</button>
                </>
              ) : (
                <button className="btn-primary" style={{ width: '100%' }} onClick={onClose}>Aceptar</button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AlertModal;
