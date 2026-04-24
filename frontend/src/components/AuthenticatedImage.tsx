import React, { useState, useEffect } from 'react';
import api from '../api';
import { Loader2, Image as ImageIcon } from 'lucide-react';

interface AuthenticatedImageProps {
  src: string;
  alt: string;
  style?: React.CSSProperties;
}

const AuthenticatedImage: React.FC<AuthenticatedImageProps> = ({ src, alt, style }) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let url = '';
    const fetchImage = async () => {
      try {
        // Fetch the image as a blob using the authenticated API instance
        const response = await api.get(src, { responseType: 'blob' });
        url = URL.createObjectURL(response.data);
        setObjectUrl(url);
      } catch (err) {
        console.error('Error fetching image:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (src) {
        fetchImage();
    }

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [src]);

  if (loading) {
      return (
          <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.02)', border: '1px dashed rgba(0,0,0,0.1)' }}>
              <Loader2 className="spinner" size={24} color="var(--gold-opaque)" />
          </div>
      );
  }
  
  if (!objectUrl) {
      return (
          <div style={{ ...style, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,0,0,0.05)', border: '1px dashed rgba(255,0,0,0.2)', color: 'red' }}>
              <ImageIcon size={24} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
              <span style={{ fontSize: '0.8rem' }}>Error al cargar</span>
          </div>
      );
  }

  return <img src={objectUrl} alt={alt} style={style} />;
};

export default AuthenticatedImage;
