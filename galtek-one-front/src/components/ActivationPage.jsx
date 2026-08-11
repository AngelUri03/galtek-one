import React, { useRef, useState, useEffect } from "react";
import { Toast } from "primereact/toast";
import { useDevice } from "../auth/DeviceContext";
import { useNavigate } from "react-router-dom";
import "../style/components/Login/Login.css";
import "../style/components/Login/ActivationPage.css";

const ActivationPage = () => {
  const { isActivated, machineCodeBase64, lockReason, activateDevice, deviceError } = useDevice();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const toast = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isActivated) {
      navigate("/login", { replace: true });
    }
  }, [isActivated, navigate]);

  const showToast = (severity, summary, detail, life = 4000) => {
    toast.current?.show({ severity, summary, detail, life });
  };

  const handleCopy = () => {
    if (machineCodeBase64) {
      navigator.clipboard.writeText(machineCodeBase64)
        .then(() => showToast("success", "Copiado", "Codigo de maquina copiado al portapapeles"))
        .catch(() => showToast("error", "Error", "No se pudo copiar al portapapeles"));
    }
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    if (!token || token.trim() === "") {
      showToast("error", "Error", "El token de activacion es requerido");
      return;
    }

    setLoading(true);
    const result = await activateDevice(token.trim());
    setLoading(false);

    if (result.success) {
      showToast("success", "Activado", "El dispositivo ha sido activado correctamente");
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);
    } else {
      showToast("error", "Error de Activacion", result.message);
    }
  };

  let errorTitle = "BIENVENIDO A GALTEK POS";
  let errorDesc = (
    <>
      <p style={{marginBottom: '0.5rem'}}><strong>¿Que sucedio?</strong> El sistema no cuenta con una licencia activa instalada en este equipo.</p>
      <p><strong>¿Que puedo hacer?</strong> Contacte a nuestro equipo de ventas y comparta su Codigo de Maquina para emitir su primera licencia de uso.</p>
    </>
  );

  if (lockReason === "ERR_JWT_EXPIRED") {
    errorTitle = "SUSCRIPCION VENCIDA";
    errorDesc = (
      <>
        <p style={{marginBottom: '0.5rem'}}><strong>¿Que sucedio?</strong> El periodo de uso de su licencia ha concluido. El sistema se ha pausado, pero su informacion esta a salvo.</p>
        <p><strong>¿Que puedo hacer?</strong> Si requiere una renovacion, comparta su Codigo de Maquina con su asesor para adquirir una nueva suscripcion.</p>
      </>
    );
  } else if (lockReason === "ERR_JWT_TAMPERED" || lockReason === "ERR_JWT_MALFORMED") {
    errorTitle = "FALLO DE INTEGRIDAD";
    errorDesc = (
      <>
        <p style={{marginBottom: '0.5rem'}}><strong>¿Que sucedio?</strong> Hemos detectado una anomalia critica en la validacion del token. Por protocolos de seguridad, el sistema se ha pausado preventivamente.</p>
        <p><strong>¿Que puedo hacer?</strong> Comuniquese inmediatamente con soporte tecnico de Galtek para recibir asistencia especializada.</p>
      </>
    );
  } else if (lockReason === "HARDWARE_MISMATCH") {
    errorTitle = "CAMBIO DE HARDWARE DETECTADO";
    errorDesc = (
      <>
        <p style={{marginBottom: '0.5rem'}}><strong>¿Que sucedio?</strong> La huella digital de este equipo no coincide con la licencia original.</p>
        <p><strong>¿Que puedo hacer?</strong> Si cambio de componentes o mudo el sistema, solicite una re-vinculacion autorizada compartiendo su Codigo de Maquina.</p>
      </>
    );
  } else if (lockReason && lockReason !== "ACTIVATION_REQUIRED") {
    errorTitle = "SISTEMA BLOQUEADO";
    errorDesc = <p>Error de verificacion: {lockReason}</p>;
  }

  return (
    <div className="login-container">
      <video autoPlay loop muted playsInline className="video-background">
        <source src="/videos/videofondo.mp4" type="video/mp4" />
      </video>

      <div className="login-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', padding: '20px' }}>
        <Toast ref={toast} />
        
        <div className="activation-card">
          <div className="activation-title">{errorTitle}</div>

          {deviceError ? (
            <div className="activation-error-state">
              <div className="error-icon-wrapper">
                <i className="pi pi-server"></i>
              </div>
              <h3 className="error-title">Servicio No Disponible</h3>
              <p className="error-desc">No se puede conectar con el backend de validacion local. Verifique que el servicio este corriendo.</p>
              <button 
                type="button" 
                className="activate-submit-btn" 
                onClick={() => window.location.reload()}
                style={{ marginTop: '1rem', width: 'auto', padding: '10px 20px', background: '#3b82f6', border: 'none' }}
              >
                <i className="pi pi-refresh" style={{ marginRight: '8px' }}></i> Reintentar
              </button>
            </div>
          ) : (
            <form onSubmit={handleActivate} style={{ marginTop: '1.5rem' }}>
              <div className="activation-subtitle" style={{ color: lockReason && lockReason !== "ACTIVATION_REQUIRED" ? '#fca5a5' : '#9ca3af', textAlign: 'left', lineHeight: '1.5' }}>
                {errorDesc}
              </div>

              <div style={{ marginTop: '1rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                {!showCode ? (
                  <button 
                    type="button" 
                    className="copy-btn" 
                    onClick={() => setShowCode(true)}
                    style={{ background: 'transparent', border: '1px solid #4b5563', color: '#d1d5db', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    <i className="pi pi-eye"></i> Mostrar Codigo de Maquina
                  </button>
                ) : (
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label className="activation-input-label" style={{ marginBottom: 0 }}>Codigo de Maquina de este Equipo:</label>
                      <button 
                        type="button" 
                        onClick={() => setShowCode(false)}
                        style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <i className="pi pi-eye-slash"></i> Ocultar
                      </button>
                    </div>
                    <div className="code-box-wrapper" style={{ animation: 'fadeIn 0.3s' }}>
                      <div className="code-text">
                        {machineCodeBase64 || "Generando codigo..."}
                      </div>
                      <button type="button" className="copy-btn" onClick={handleCopy}>
                        <i className="pi pi-copy"></i> Copiar Codigo
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="activation-input-label">Pegar Token de Activacion/Renovacion:</label>
                <textarea
                  className="jwt-input"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Pegue aqui el nuevo Token entregado por soporte..."
                  spellCheck="false"
                ></textarea>
              </div>

              <button 
                type="submit" 
                className="activate-submit-btn" 
                disabled={loading}
              >
                {loading ? (
                  <><i className="pi pi-spin pi-spinner"></i> Procesando...</>
                ) : (
                  <><i className="pi pi-check-circle"></i> {lockReason === "ACTIVATION_REQUIRED" ? "Activar Dispositivo" : "Reactivar Sistema"}</>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivationPage;

