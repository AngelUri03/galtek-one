import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Avatar } from 'primereact/avatar';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';

import { APIfetchApi } from '../../API/APIfetch';
// Asegúrate de que la ruta de importación sea correcta según tu estructura
import CrearUsuarioModal from './CrearUsuario'; 
import { encryptRSAOAEPToBase64 } from "../../utils/rsa";
import { endpoints } from "../../API/api";
import { useAuth } from "../../auth/AuthContext";

import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import './Css/SeleccionUsuario.css';

const api = new APIfetchApi();

// Convertir Base64 a DataURL
function buildDataUrlFromBase64(b64) {
  if (!b64) return null;
  return `data:image/png;base64,${b64}`;
}

// Resolver URL de usuarios
function resolveUsuariosURL() {
  const base = (process.env.REACT_APP_API_BASE_URL || '').trim();
  if (base) return `${base.replace(/\/+$/, '')}/usuarios`;
  return endpoints.usuarios;
}

export default function SeleccionPerfil({ visible, onHide, onSuccess }) {
  const { login } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadError, setLoadError] = useState('');
  // const [showCrear, setShowCrear] = useState(false); // No se usa en el render actual

  const toast = useRef(null);

  // Cargar usuarios
  useEffect(() => {
    if (!visible) return;

    const fetchUsuarios = async () => {
      setLoadingUsers(true);
      setLoadError('');

      try {
        const url = resolveUsuariosURL();
        const headers = { user: 'paco' };
        const res = await api.fetchApi(headers, 'GET', undefined, url);

        if (!res || !res.ok) {
          setLoadError('No fue posible cargar usuarios');
          return;
        }

        const payload = await res.json();

        const lista = payload.data?.map((u, idx) => ({
          id: u.idUsuario ?? idx,
          nombre: u.nombreUsuario || u.usuario || `Usuario ${idx + 1}`,
          usuarioLogin: u.usuario,
          imagen: buildDataUrlFromBase64(u.imagenBase64),
          raw: u
        })) || [];

        setUsuarios(lista);
        if (!usuarioSeleccionado && lista.length > 0) setUsuarioSeleccionado(lista[0]);

      } catch (err) {
        console.error(err);
        setLoadError('Error al cargar usuarios');
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsuarios();
  }, [visible]);

 // Plantilla compacta para los items
  const itemTemplate = option => (
    // Quitamos padding: '6px' y reducimos gap
    <div className="flex align-items-center gap-2 w-full"> 
      {/* Cambiamos size="large" por estilo fijo más pequeño (ej. 28px) o size="normal" */}
      <Avatar 
        image={option.imagen || 'default-avatar.png'} 
        shape="circle" 
        style={{ width: '28px', height: '28px' }} // Avatar más pequeño
      />
      <span style={{ color: '#000', fontSize: '0.9rem' }}>{option.nombre}</span>
    </div>
  );

  // Plantilla para el valor seleccionado (input visible)
  const valueTemplate = (option) => {
    if (option) {
      return (
        <span 
          style={{ 
            color: '#000',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%' // Ocupa todo el ancho disponible menos el padding del padre
          }}
        >
          {option.nombre}
        </span>
      );
    }
    return <span style={{ color: '#888' }}>Selecciona un usuario</span>;
  };

  const handleClose = () => onHide?.();

  // ✨ LOGIN SILENCIOSO — Cambia de usuario sin ir al login
  const handleIngresar = async () => {
    setError("");

    if (!usuarioSeleccionado || !contrasena) {
      setError('Debes seleccionar un usuario y escribir la contraseña.');
      return;
    }

    try {
      // 1. Obtener llave pública
      const resKey = await api.fetchApi(
        { "Content-Type": "application/json" },
        "GET",
        undefined,
        endpoints.authPublicKey
      );

      const keyPayload = await resKey.json().catch(() => null);
      const pemPublic = keyPayload?.data;

      if (!pemPublic) {
        setError("No se pudo obtener la llave pública.");
        return;
      }

      // 2. Cifrar contraseña
      const encryptedPassword = await encryptRSAOAEPToBase64(
        pemPublic,
        contrasena
      );

      // 3. Intentar login
      const loginBody = {
        usuario: usuarioSeleccionado.usuarioLogin,
        password: encryptedPassword
      };

      const resLogin = await api.fetchApi(
        { "Content-Type": "application/json" },
        "POST",
        loginBody,
        endpoints.authLogin
      );

      const payload = await resLogin.json().catch(() => null);

      if (!resLogin.ok || payload?.statusCode !== 200) {
        setError("Contraseña incorrecta o usuario inválido.");
        return;
      }

      // 4. Cerrar sesión actual (opcional según lógica de negocio)
      const oldToken = sessionStorage.getItem("token");

      if (oldToken) {
        try {
          await api.fetchApi(
            {
              "Content-Type": "application/json",
              Authorization: `Bearer ${oldToken}`,
            },
            "POST",
            undefined,
            endpoints.authLogout
          );
        } catch (err) {
          console.warn("Error cerrando sesión anterior:", err);
        }
      }

      sessionStorage.removeItem("token");

      // 5. Iniciar sesión con el nuevo usuario
      const newToken = payload.data.token;

      const newUserData = {
        token: newToken,
        usuario: payload.data.usuario,
        nombreUsuario: payload.data.nombreUsuario,
        rol: payload.data.rol,
        idEmpresa: payload.data.idEmpresa
      };

      login(newUserData);

      // 6. Avisar arriba del cambio
      onSuccess?.({ usuario: usuarioSeleccionado.raw });

      // 7. Toast de éxito
      toast.current?.show({
        severity: "success",
        summary: "Usuario cambiado",
        detail: `Ahora eres ${usuarioSeleccionado.nombre}`,
        life: 2000
      });

      // 8. Refrescar pantalla luego del toast
      setTimeout(() => window.location.reload(), 2200);

      // 9. Cerrar modal
      onHide?.();

    } catch (err) {
      console.error(err);
      setError("Ocurrió un error validando las credenciales.");
    }
  };

  const headerTemplate = (
    <div className="spm-header">
      <span className="spm-title">Cambiar usuario</span>
      <button className="spm-close" aria-label="Cerrar" onClick={handleClose}>
        <i className="pi pi-times" />
      </button>
    </div>
  );

  return (
    <>
      {/* 🔔 TOAST GLOBAL */}
      <Toast ref={toast} />

      <Dialog
        header={headerTemplate}
        visible={visible}
        onHide={handleClose}
        modal
        closable={false}
        blockScroll
        position="center"
        draggable={false}
        resizable={false}
        appendTo={document.body}
        style={{ width: '520px', minHeight: '550px' }}
        contentClassName="spm-content"
      >
        <div className="login-box-modal">

          <div className="login-avatar-modal">
            {usuarioSeleccionado?.imagen ? (
              <img
                src={usuarioSeleccionado.imagen}
                alt="Usuario"
                className="avatar-img"
              />
            ) : (
              <span className="pi pi-user avatar-icon" />
            )}
          </div>

          <Dropdown
            value={usuarioSeleccionado}
            onChange={(e) => setUsuarioSeleccionado(e.value)}
            options={usuarios}
            optionLabel="nombre"
            placeholder="Selecciona un usuario"
            className="dropdown-simple"
            itemTemplate={itemTemplate}   // <--- Agregado para personalizar la lista
            valueTemplate={valueTemplate} // <--- Agregado para personalizar input y EVITAR CHOQUE
          />

          <Password
            placeholder="Contraseña del usuario"
            toggleMask
            feedback={false}
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            className="w-full p-inputtext-sm"
            // Nota: Este width del 112% parece ser un ajuste manual específico tuyo para alinear bordes
            style={{ width: '112%', height: '2.5rem' }} 
          />

          <Button
            label="Ingresar"
            className="w-full boton-verde"
            onClick={handleIngresar}
            style={{ width: '80%', height: '3rem', marginTop: '0.5rem' }}
          />

          {error && <small className="p-error text-center">{error}</small>}
        </div>
      </Dialog>
    </>
  );
}
