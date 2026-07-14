import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useDevice } from '../../auth/DeviceContext';
import { ProgressSpinner } from 'primereact/progressspinner';
import "../../style/components/Login/Login.css";
import "../../style/components/Login/LoginForm.css";

const RequireActivation = () => {
  const { isChecking, isActivated, deviceError } = useDevice();
  const location = useLocation();

  if (isChecking) {
    return (
      <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <video autoPlay loop muted playsInline className="video-background">
          <source src="/videos/videofondo.mp4" type="video/mp4" />
        </video>
        <div style={{ zIndex: 10, textAlign: 'center' }}>
          <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" />
          <p style={{ color: 'white', marginTop: '20px', fontWeight: 'bold' }}>Verificando seguridad de hardware...</p>
        </div>
      </div>
    );
  }

  if (deviceError) {
    return <Navigate to="/activar" state={{ from: location }} replace />;
  }

  if (!isActivated) {
    return <Navigate to="/activar" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default RequireActivation;
