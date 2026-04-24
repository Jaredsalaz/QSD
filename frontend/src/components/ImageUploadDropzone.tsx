import React, { useRef } from 'react';
import { Upload, CheckCircle } from 'lucide-react';

interface ImageUploadDropzoneProps {
  label: string;
  isUploaded: boolean;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ImageUploadDropzone: React.FC<ImageUploadDropzoneProps> = ({ label, isUploaded, onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="form-group" style={{ marginBottom: '1rem' }}>
      <label className="form-label">{label}</label>
      
      <div 
        onClick={handleClick}
        style={{
          border: isUploaded ? '2px solid var(--gold-opaque)' : '2px dashed rgba(212, 175, 55, 0.4)',
          borderRadius: '12px',
          padding: '1.5rem 1rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: isUploaded ? 'rgba(212, 175, 55, 0.05)' : 'rgba(0, 0, 0, 0.02)',
          transition: 'all 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem'
        }}
        onMouseEnter={(e) => {
          if (!isUploaded) {
            e.currentTarget.style.background = 'rgba(212, 175, 55, 0.08)';
            e.currentTarget.style.borderColor = 'var(--gold-opaque)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isUploaded) {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)';
            e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)';
          }
        }}
      >
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef}
          onChange={onFileSelect}
          style={{ display: 'none' }} 
        />
        
        {isUploaded ? (
          <>
            <CheckCircle size={28} color="var(--gold-opaque)" />
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--gold-opaque)' }}>
              Imagen Subida Correctamente
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Haz clic para reemplazar
            </span>
          </>
        ) : (
          <>
            <Upload size={28} color="var(--gold-opaque)" style={{ opacity: 0.7 }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-main)' }}>
              Haz clic para subir imagen
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              PNG, JPG o JPEG (Máx. 5MB)
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default ImageUploadDropzone;
