import React, { useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { useDevice } from "../auth/DeviceContext";
import { useNavigate } from "react-router-dom";
import "../style/components/Login/Login.css";
import "../style/components/Login/ActivationPage.css";

const ActivationPage = () => {
  const { machineCodeBase64, lockReason, activateDevice, deviceError } = useDevice();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);
  const navigate = useNavigate();

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

  // Determinar si es un error fatal de clonacion o mismatch
  const isFatalError = lockReason && lockReason !== "ACTIVATION_REQUIRED";

  return (
    <div className="login-container">
      <video autoPlay loop muted playsInline className="video-background">
        <source src="/videos/videofondo.mp4" type="video/mp4" />
      </video>

      <div className="login-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', padding: '20px' }}>
        <Toast ref={toast} />
        
        <div className="activation-card">
          <div className="activation-title">ACTIVACION REQUERIDA</div>

          {deviceError ? (
            <div className="activation-error-state">
              <div className="error-icon-wrapper">
                <i className="pi pi-server"></i>
              </div>
              <h3 className="error-title">Servicio No Disponible</h3>
              <p className="error-desc">No se puede conectar con el backend de validacion local. Verifique que el servicio este corriendo.</p>
            </div>
          ) : isFatalError ? (
            <div className="activation-error-state">
              <div className="error-icon-wrapper">
                <i className="pi pi-shield"></i>
              </div>
              <h3 className="error-title">Hardware No Reconocido</h3>
              <p className="error-desc">Se ha detectado un cambio critico en el hardware de este equipo o la base de datos ha sido transferida irregularmente.</p>
              <div className="error-reason">
                <strong>Motivo:</strong> {lockReason}
              </div>
              <p style={{ marginTop: '1.5rem', fontWeight: 'bold', color: '#fff' }}>Contacte a soporte tecnico de Galtek.</p>
            </div>
          ) : (
            <form onSubmit={handleActivate} style={{ marginTop: '1.5rem' }}>
              <p className="activation-subtitle">
                Este software esta protegido. Contacta a soporte y proporciona el siguiente Codigo de Maquina para obtener tu licencia.
              </p>

              <div>
                <label className="activation-input-label">Codigo de Maquina de este Equipo:</label>
                <div className="code-box-wrapper">
                  <div className="code-text">
                    {machineCodeBase64 || "Generando codigo..."}
                  </div>
                  <button type="button" className="copy-btn" onClick={handleCopy}>
                    <i className="pi pi-copy"></i> Copiar Codigo
                  </button>
                </div>
              </div>

              <div>
                <label className="activation-input-label">Pegar Token de Activacion:</label>
                <textarea
                  className="jwt-input"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Pegue aqui el Token de activacion entregado por soporte..."
                  spellCheck="false"
                ></textarea>
              </div>

              <button 
                type="submit" 
                className="activate-submit-btn" 
                disabled={loading}
              >
                {loading ? (
                  <><i className="pi pi-spin pi-spinner"></i> Activando...</>
                ) : (
                  <><i className="pi pi-check-circle"></i> Activar Dispositivo</>
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

