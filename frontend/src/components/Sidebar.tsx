import React from 'react';
import { List, UserPlus, LogOut, ClipboardList } from 'lucide-react';
import logoPequeno from '../assets/Logo pequeño.jpeg';

interface SidebarProps {
  currentView: 'LIST' | 'REGISTER' | 'AUDIT';
  onViewChange: (view: 'LIST' | 'REGISTER' | 'AUDIT') => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onLogout }) => {
  const role = localStorage.getItem('qsd_admin_role') || 'ADMIN';
  const isDev = role === 'DEV';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={logoPequeno} alt="QSD Logo" style={{ height: '40px', borderRadius: '4px' }} />
        <h2 style={{ fontSize: '1.25rem', color: 'var(--gold-opaque)', fontWeight: 700 }}>QSD Panel</h2>
      </div>

      <nav className="sidebar-nav">
        <div 
          className={`sidebar-item ${currentView === 'LIST' ? 'active' : ''}`}
          onClick={() => onViewChange('LIST')}
        >
          <List size={22} />
          <span>Lista de Registros</span>
        </div>
        
        <div 
          className={`sidebar-item ${currentView === 'REGISTER' ? 'active' : ''}`}
          onClick={() => onViewChange('REGISTER')}
        >
          <UserPlus size={22} />
          <span>Nuevo Registro</span>
        </div>

        {isDev && (
          <div 
            className={`sidebar-item ${currentView === 'AUDIT' ? 'active' : ''}`}
            onClick={() => onViewChange('AUDIT')}
          >
            <ClipboardList size={22} />
            <span>Bitácora</span>
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="logout-item" onClick={onLogout}>
          <LogOut size={22} />
          <span>Cerrar Sesión</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
