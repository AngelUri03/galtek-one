import React, { useEffect, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Avatar } from "primereact/avatar";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api"; // no se modifica
import { encryptRSAOAEPToBase64 } from "../../utils/rsa";

import "./Css/CrearUsuario.css";

const api = new APIfetchApi();

/** Resolver URL sin modificar API */
function resolveUsuariosURL() {
  if (endpoints && endpoints.usuarios) return endpoints.usuarios;

  const base = (process.env.REACT_APP_API_BASE_URL || "").trim();
  if (base) return `${base.replace(/\/+$/, "")}/usuarios`;

  return endpoints.usuarios;
}

/** Construye URL de imagen por usuario (si tu backend lo soporta) */
function resolveUsuarioImagenURL(idUsuario) {
  // Ajusta si tu endpoint es distinto:
  // /usuarios/{id}/imagen
  const usuarios = resolveUsuariosURL();
  return `${usuarios.replace(/\/+$/, "")}/${idUsuario}/imagen`;
}

function isPemPublicKey(pem) {
  return typeof pem === "string" && pem.includes("BEGIN PUBLIC KEY");
}

function readAuthSession() {
  try {
    const raw = sessionStorage.getItem("auth_session");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const normalizeRoleOption = (role) => ({
  label: role?.nombreRol || role?.nombre || "Rol",
  value: role?.idRol ?? role?.id,
});

export default function AjustesUsuariosCrear({
  visible,
  onHide,
  onCreated,
  empresaId,
}) {
  const toast = useRef(null);
  const authSession = readAuthSession();
  const token = authSession?.token;
  const sessionEmpresaId = empresaId ?? authSession?.idEmpresa;

  const [nombre, setNombre] = useState("");
  const [usuario, setUsuario] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [fotoPreview, setFotoPreview] = useState(null); // blob url
  const [fotoFile, setFotoFile] = useState(null);

  const [roles, setRoles] = useState([]);

  const showSuccess = (detail = "Usuario creado correctamente") => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail,
      life: 2600,
    });
  };

  const showError = (detail) => {
    toast.current?.show({
      severity: "error",
      summary: "Error",
      detail: detail || "Ocurrió un error",
      life: 3200,
    });
  };

  const reset = () => {
    setNombre("");
    setUsuario("");
    setTelefono("");
    setPassword("");
    setRol(null);
    setError("");
    setFotoFile(null);

    setFotoPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
  };

  useEffect(() => {
    // Al abrir, resetea (para que siempre sea un modal “nuevo”)
    if (visible) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    let activo = true;

    async function cargarRoles() {
      try {
        const res = await api.fetchApi({}, "GET", undefined, endpoints.roles);
        if (!res?.ok) {
          if (activo) setRoles([]);
          return;
        }
        const payload = await res.json();
        const options = (Array.isArray(payload?.data) ? payload.data : [])
          .map(normalizeRoleOption)
          .filter((item) => item.value != null);
        if (activo) setRoles(options);
      } catch (error) {
        console.error("Error cargando roles:", error);
        if (activo) setRoles([]);
      }
    }

    cargarRoles();
    return () => {
      activo = false;
    };
  }, [visible]);

  useEffect(() => {
    return () => {
      // cleanup blob
      if (fotoPreview?.startsWith("blob:")) URL.revokeObjectURL(fotoPreview);
    };
  }, [fotoPreview]);

  const onSelectFoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación ligera
    const isImg = file.type?.startsWith("image/");
    if (!isImg) {
      const msg = "Selecciona un archivo de imagen (PNG/JPG).";
      setError(msg);
      showError(msg);
      return;
    }
    if (file.size > 2_500_000) {
      const msg = "La imagen es muy pesada (máx 2.5 MB).";
      setError(msg);
      showError(msg);
      return;
    }

    setFotoFile(file);

    // preview
    const url = URL.createObjectURL(file);
    setFotoPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });
  };

  const validate = () => {
    const n = nombre.trim().replace(/\s+/g, " ");
    const u = usuario.trim().replace(/\s+/g, "");
    const t = telefono.trim();

    if (!n || n.length < 3) return "Completa el nombre (mínimo 3 caracteres).";
    if (!password || password.length < 6)
      return "La contraseña debe tener al menos 6 caracteres.";
    if (!rol) return "Selecciona un rol.";
    // usuario es opcional (si viene vacío se deriva), pero si lo ponen que sea decente:
    if (u && u.length < 3)
      return "El usuario (login) debe tener al menos 3 caracteres.";

    // teléfono opcional, pero si viene que sea “razonable”
    if (t && t.length < 7) return "El teléfono parece muy corto.";

    return null;
  };

  const uploadImagenIfAny = async (idUsuario) => {
    if (!fotoFile || !idUsuario) return;

    try {
      const url = resolveUsuarioImagenURL(idUsuario);
      const fd = new FormData();
      fd.append("imagen", fotoFile);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          user: authSession?.usuario || "",
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });

      // Si el endpoint no existe, no rompas la creación del usuario
      if (!res.ok) {
        // opcional: muestra warning suave
        toast.current?.show({
          severity: "warn",
          summary: "Imagen",
          detail: "El usuario se creó, pero no se pudo subir la imagen.",
          life: 2500,
        });
      }
    } catch {
      toast.current?.show({
        severity: "warn",
        summary: "Imagen",
        detail: "El usuario se creó, pero no se pudo subir la imagen.",
        life: 2500,
      });
    }
  };

  const crearUsuario = async () => {
    setError("");

    const msg = validate();
    if (msg) {
      setError(msg);
      showError(msg);
      return;
    }

    if (!token || !sessionEmpresaId) {
      const m = "Tu sesión no es válida o expiró. Inicia sesión nuevamente.";
      setError(m);
      showError(m);
      return;
    }

    const n = nombre.trim().replace(/\s+/g, " ");
    const u = usuario.trim().replace(/\s+/g, "");
    const t = telefono.trim();

    // Deriva usuario si no se puso
    const usuarioDerivado = u || (n.split(/\s+/)[0] || "").toLowerCase();

    setLoading(true);
    try {
      // 1) Llave pública
      const resKey = await api.fetchApi(
        { "Content-Type": "application/json" },
        "GET",
        undefined,
        endpoints.authPublicKey
      );

      if (!resKey) {
        const m =
          "No se pudo contactar al servidor para obtener la llave pública.";
        setError(m);
        showError(m);
        return;
      }

      if (!resKey.ok) {
        const ttt = await resKey.text().catch(() => "");
        const m = `No se pudo obtener la llave pública: ${resKey.status} ${ttt}`;
        setError(m);
        showError(m);
        return;
      }

      const keyPayload = await resKey.json().catch(() => null);
      const pemPublic = keyPayload?.data;

      if (!isPemPublicKey(pemPublic)) {
        const m = "Formato de llave pública inesperado.";
        setError(m);
        showError(m);
        return;
      }

      // 2) Cifrar contraseña
      const encryptedPassword = await encryptRSAOAEPToBase64(
        pemPublic,
        password
      );

      // 3) Payload (mantengo tu estructura)
      const body = {
        nombreUsuario: n,
        estatus: true,
        activo: 1,
        password: encryptedPassword,
        empresa: { idEmpresa: Number(sessionEmpresaId) },
        rol: { idRol: Number(rol) },
        telefono: t || "5555555555",
        usuario: usuarioDerivado,
      };

      // 4) POST /usuarios
      const usuariosURL = resolveUsuariosURL();

      const res = await api.fetchApi(
        {},
        "POST",
        body,
        usuariosURL
      );

      if (!res) {
        const m = "No se pudo conectar con el servidor.";
        setError(m);
        showError(m);
        return;
      }

      if (res.status === 401) {
        const m = "Tu sesión expiró o no es válida. Inicia sesión nuevamente.";
        setError(m);
        showError(m);
        return;
      }

      // ✅ Prioriza el 500 con mensaje fijo (tu regla)
      if (res.status === 500) {
        const m = "Categoria no encontrada";
        setError(m);
        showError(m);
        return;
      }

      if (!res.ok) {
        let detalle = "";
        try {
          const ct = res.headers.get("content-type") || "";
          if (ct.includes("application/json")) {
            const j = await res.json();
            detalle = j?.message || j?.error || j?.detail || "";
          } else {
            detalle = await res.text();
          }
        } catch {}
        const m = `Error ${res.status}: ${detalle || "Solicitud rechazada."}`;
        setError(m);
        showError(m);
        return;
      }

      // 5) leer respuesta (para idUsuario, si viene)
      let createdId = null;
      try {
        const json = await res.json();
        createdId = json?.data?.idUsuario ?? json?.data?.id ?? null;
      } catch {}

      // 6) subir imagen si hay (NO bloquea)
      if (createdId) await uploadImagenIfAny(createdId);

      showSuccess();

      // callback para refrescar lista desde AjustesUsuarios
      onCreated?.({ idUsuario: createdId });

      // cerrar “bonito”
      window.setTimeout(() => onHide?.(), 450);
    } catch (e) {
      console.error(e);
      const m = "Ocurrió un error inesperado.";
      setError(m);
      showError(m);
    } finally {
      setLoading(false);
    }
  };

  const headerTemplate = (
    <div className="spm-header">
      <div className="spm-titleWrap">
        <div className="spm-title">Crear usuario</div>
        <div className="spm-sub">Alta rápida con rol. La foto es opcional.</div>
      </div>

      <button
        className="spm-close"
        aria-label="Cerrar"
        onClick={onHide}
        type="button"
      >
        <i className="pi pi-times" />
      </button>
    </div>
  );

  return (
    <Dialog
      header={headerTemplate}
      visible={visible}
      onHide={onHide}
      modal
      closable={false}
      blockScroll
      position="center"
      draggable={false}
      resizable={false}
      maximizable={false}
      appendTo={document.body}
      style={{ width: "560px", minHeight: "690px" }}
      contentClassName="spm-content"
    >
      <Toast ref={toast} />

      <div className="login-box-modal">
        {/* Avatar + upload */}
        <div className="avatar-row">
          <div className="avatar-right">
            <label
              htmlFor="input-foto"
              className="avatar-upload"
              title="Subir imagen"
            >
              <Avatar
                image={fotoPreview || undefined}
                icon={!fotoPreview ? "pi pi-user" : undefined}
                shape="circle"
                className="crear-avatar"
              />
              <span className="avatar-hover">
                <i className="pi pi-upload" />
              </span>
            </label>

            <input
              id="input-foto"
              type="file"
              accept="image/*"
              onChange={onSelectFoto}
              hidden
            />
          </div>
        </div>

        {/* Campos */}
        <InputText
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre completo*"
          className="w-full p-inputtext-sm"
          style={{ width: "86%", height: "2.65rem" }}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter") crearUsuario();
          }}
        />

        <InputText
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          placeholder="Usuario (login) (opcional)"
          className="w-full p-inputtext-sm"
          style={{ width: "86%", height: "2.65rem", marginTop: ".6rem" }}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter") crearUsuario();
          }}
        />

        <InputText
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="Teléfono (opcional)"
          className="w-full p-inputtext-sm"
          style={{ width: "86%", height: "2.65rem", marginTop: ".6rem" }}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter") crearUsuario();
          }}
        />

        <Password
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña*"
          toggleMask
          feedback={false}
          className="w-full p-inputtext-sm"
          style={{ width: "86%", height: "2.65rem", marginTop: ".6rem" }}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter") crearUsuario();
          }}
        />

        <Dropdown
          value={rol}
          onChange={(e) => setRol(e.value)}
          options={roles}
          optionLabel="label"
          optionValue="value"
          placeholder="Seleccionar rol*"
          className="dropdown-crear"
          style={{ width: "86%", marginTop: ".6rem" }}
          disabled={loading}
        />

        {/* Acciones */}
        <div
          style={{ width: "86%", display: "flex", gap: 10, marginTop: ".9rem" }}
        >
          <Button
            label="Cancelar"
            icon="pi pi-times"
            className="w-full uxi-btn uxi-btn--ghost"
            onClick={onHide}
            disabled={loading}
            type="button"
            style={{ height: "3rem" }}
          />
          <Button
            label={loading ? "Creando..." : "Crear usuario"}
            icon={loading ? "pi pi-spin pi-spinner" : "pi pi-user-plus"}
            className="w-full boton-verde"
            onClick={crearUsuario}
            disabled={loading}
            type="button"
            style={{ height: "3rem" }}
          />
        </div>

        {error ? (
          <small
            className="p-error text-center"
            style={{ display: "block", marginTop: ".7rem" }}
          >
            {error}
          </small>
        ) : (
          <small
            style={{
              display: "block",
              marginTop: ".7rem",
              opacity: 0.72,
              textAlign: "center",
            }}
          >
            * Campos obligatorios
          </small>
        )}
      </div>
    </Dialog>
  );
}
