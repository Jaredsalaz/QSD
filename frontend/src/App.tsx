import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import RegistrationForm from './components/RegistrationForm';
import OTPModal, { SuccessScreen } from './components/OTPModal';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import { ShieldAlert } from 'lucide-react';
import logoPequeno from './assets/Logo pequeño.jpeg';

const MainPortal = () => {
  const [showOTP, setShowOTP] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [otpData, setOtpData] = useState({ email: '', regData: null });
  const navigate = useNavigate();

  const handleOTPSent = (email: string, regData: any) => {
    setOtpData({ email, regData });
    setShowOTP(true);
  };

  const handleSuccess = () => {
    setShowOTP(false);
    setShowSuccess(true);
  };

  const handleReset = () => {
    setShowSuccess(false);
    setOtpData({ email: '', regData: null });
  };

  return (
    <div className="container min-h-screen flex-center" style={{ flexDirection: 'column' }}>
      
      <div style={{ position: 'absolute', top: '1.5rem', left: '2rem' }}>
         <img src={logoPequeno} alt="Icono QSD" style={{ height: '50px', borderRadius: '4px' }} />
      </div>

      {showSuccess ? (
        <SuccessScreen onReset={handleReset} />
      ) : (
        <RegistrationForm onOTPSent={handleOTPSent} />
      )}

      {showOTP && (
        <OTPModal 
          email={otpData.email} 
          regData={otpData.regData} 
          onSuccess={handleSuccess} 
          onCancel={() => setShowOTP(false)}
        />
      )}
      
      <div style={{ marginTop: '3rem', textAlign: 'center' }}>
         <button onClick={() => navigate('/admin')} className="btn-secondary" style={{ border: 'none', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.03)' }}>
            <ShieldAlert size={16} style={{ marginRight: '0.5rem' }} /> Acceso Administrativo
         </button>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPortal />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
};

export default App;
