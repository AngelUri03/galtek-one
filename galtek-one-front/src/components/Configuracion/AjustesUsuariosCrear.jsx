import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";

import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";
import { encryptRSAOAEPToBase64 } from "../../utils/rsa";
import {
  fileToDataUrl,
  isValidEmail,
  isValidPhone,
  readAuthSession,
  readPayload,
  resolveUsuariosURL,
  safeTrim,
  validateImageFile,
} from "./Usuarios/usuariosUtils";

const api = new APIfetchApi();

function normalizeRoleOption(role) {
  return {
    label: role?.nombreRol || role?.nombre || "Rol",
    value: role?.idRol ?? role?.id,
  };
}

function isPemPublicKey(pem) {
  return typeof pem === "string" && pem.includes("BEGIN PUBLIC KEY");
}

function slug(value) {
  return safeTrim(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function roleCode(roleLabel) {
  const role = slug(roleLabel);
  if (!role) return "";

  const aliases = [
    ["administrador", "admin"],
    ["cajero", "caja"],
    ["vendedor", "ventas"],
    ["supervisor", "super"],
    ["encargado", "enc"],
    ["gerente", "ger"],
    ["invitado", "inv"],
  ];

  const hit = aliases.find(([needle]) => role.includes(needle));
  return hit ? hit[1] : role.split(" ")[0].slice(0, 8);
}

function suggestLogin(nombreUsuario, roleLabel) {
  const nameParts = slug(nombreUsuario).split(" ").filter(Boolean);
  const role = roleCode(roleLabel);
  const first = nameParts[0] || "";
  const last = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
  const identity = last ? `${first[0] || ""}${last}` : first;

  if (!identity || !role) return "";
  return `${identity}-${role}`;
}

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint32Array(4);

  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * alphabet.length);
    }
  }

  const token = Array.from(bytes)
    .map((value) => alphabet[value % alphabet.length])
    .join("");

  return `Galtek-${token}`;
}

export default function AjustesUsuariosCrear({ visible, onHide, onCreated }) {
  const toast = useRef(null);
  const session = readAuthSession();

  const [form, setForm] = useState({
    nombreUsuario: "",
    usuario: "",
    correo: "",
    telefono: "",
    idRol: null,
  });
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [error, setError] = useState("");
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [usuarioTouched, setUsuarioTouched] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [createdId, setCreatedId] = useState(null);
  const created = Boolean(createdId);

  const roleOptions = useMemo(
    () => roles.map(normalizeRoleOption).filter((role) => role.value != null),
    [roles]
  );

  const selectedRoleLabel = useMemo(
    () => roleOptions.find((role) => Number(role.value) === Number(form.idRol))?.label || "",
    [form.idRol, roleOptions]
  );

  const updateForm = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setError("");
  };

  const reset = () => {
    setForm({
      nombreUsuario: "",
      usuario: "",
      correo: "",
      telefono: "",
      idRol: null,
    });
    setError("");
    setCopied(false);
    setCreatedId(null);
    setUsuarioTouched(false);
    setTemporaryPassword(generateTemporaryPassword());
    setFotoFile(null);
    setFotoPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
  };

  useEffect(() => {
    if (!visible) return;
    reset();
    let active = true;

    async function loadRoles() {
      setRolesLoading(true);
      try {
        const response = await api.fetchApi({}, "GET", undefined, endpoints.roles);
        const payload = await readPayload(response, "No se pudo cargar roles.");
        if (active) setRoles(Array.isArray(payload) ? payload : []);
      } catch (err) {
        console.error("Error cargando roles:", err);
        if (active) {
          setRoles([]);
          setError("No se pudieron cargar los roles.");
        }
      } finally {
        if (active) setRolesLoading(false);
      }
    }

    loadRoles();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (!visible || usuarioTouched || created) return;
    const suggested = suggestLogin(form.nombreUsuario, selectedRoleLabel);
    setForm((prev) => (prev.usuario === suggested ? prev : { ...prev, usuario: suggested }));
  }, [created, form.nombreUsuario, selectedRoleLabel, usuarioTouched, visible]);

  useEffect(() => {
    return () => {
      if (fotoPreview?.startsWith("blob:")) URL.revokeObjectURL(fotoPreview);
    };
  }, [fotoPreview]);

  const showToast = (severity, summary, detail) => {
    toast.current?.show({ severity, summary, detail, life: 2800 });
  };

  const copyPassword = async () => {
    if (!temporaryPassword || !navigator.clipboard) {
      setError("No se pudo copiar la password temporal.");
      return;
    }

    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("No se pudo copiar la password temporal.");
    }
  };

  const regeneratePassword = () => {
    if (created || loading) return;
    setTemporaryPassword(generateTemporaryPassword());
    setCopied(false);
  };

  const onSelectFoto = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || created) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      showToast("warn", "Imagen", validationError);
      return;
    }

    setFotoFile(file);
    const url = URL.createObjectURL(file);
    setFotoPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });
  };

  const validate = () => {
    const nombreUsuario = safeTrim(form.nombreUsuario).replace(/\s+/g, " ");
    const usuario = safeTrim(form.usuario).replace(/\s+/g, "");
    const correo = safeTrim(form.correo);
    const telefono = safeTrim(form.telefono);

    if (nombreUsuario.length < 3) return "El nombre debe tener al menos 3 caracteres.";
    if (!form.idRol) return "Selecciona un rol.";
    if (usuario.length < 3) return "El usuario debe tener al menos 3 caracteres.";
    if (!temporaryPassword || temporaryPassword.length < 6)
      return "Genera una password temporal valida.";
    if (!isValidEmail(correo)) return "Revisa el correo capturado.";
    if (!isValidPhone(telefono)) return "Revisa el telefono capturado.";

    return { nombreUsuario, usuario, correo, telefono };
  };

  const crearUsuario = async () => {
    setError("");

    const valid = validate();
    if (typeof valid === "string") {
      setError(valid);
      showToast("warn", "Usuarios", valid);
      return;
    }

    if (!session?.token || session?.idEmpresa == null) {
      const message = "Tu sesion no es valida. Inicia sesion nuevamente.";
      setError(message);
      showToast("error", "Sesion", message);
      return;
    }

    setLoading(true);
    try {
      const avatarUrl = fotoFile ? await fileToDataUrl(fotoFile) : null;
      const keyResponse = await api.fetchApi({}, "GET", undefined, endpoints.authPublicKey);
      const publicKey = await readPayload(keyResponse, "No se pudo obtener la llave publica.");
      if (!isPemPublicKey(publicKey)) {
        throw new Error("Formato de llave publica inesperado.");
      }

      const encryptedPassword = await encryptRSAOAEPToBase64(publicKey, temporaryPassword);
      const body = {
        nombreUsuario: valid.nombreUsuario,
        usuario: valid.usuario,
        correo: valid.correo,
        telefono: valid.telefono,
        password: encryptedPassword,
        activo: 1,
        estatus: true,
        rol: { idRol: Number(form.idRol) },
      };

      if (avatarUrl) {
        body.avatarUrl = avatarUrl;
      }

      const response = await api.fetchApi({}, "POST", body, resolveUsuariosURL());
      const created = await readPayload(response, "No se pudo crear el usuario.");
      const nextCreatedId = created?.idUsuario ?? created?.id ?? null;

      setCreatedId(nextCreatedId || true);
      showToast("success", "Usuarios", "Usuario creado con password temporal.");
      onCreated?.({ idUsuario: nextCreatedId });
    } catch (err) {
      console.error("Error creando usuario:", err);
      const message = err?.message || "No se pudo crear el usuario.";
      setError(message);
      showToast("error", "Usuarios", message);
    } finally {
      setLoading(false);
    }
  };

  const header = (
    <div className="au-modal-header">
      <div>
        <span>Nuevo usuario</span>
        <strong>Agregar usuario</strong>
      </div>
      <button className="au-modal-close" type="button" onClick={onHide} aria-label="Cerrar">
        <i className="pi pi-times" />
      </button>
    </div>
  );

  const footer = (
    <div className="au-dialog-footer">
      {created ? null : (
        <Button label="Cancelar" className="au-text-btn" onClick={onHide} disabled={loading} />
      )}
      {created ? (
        <Button label="Listo" icon="pi pi-check" className="au-primary-btn" onClick={onHide} />
      ) : (
        <Button
          label={loading ? "Creando..." : "Crear usuario"}
          icon={loading ? "pi pi-spin pi-spinner" : "pi pi-user-plus"}
          className="au-primary-btn"
          onClick={crearUsuario}
          disabled={loading || rolesLoading}
        />
      )}
    </div>
  );

  return (
    <Dialog
      header={header}
      visible={visible}
      onHide={onHide}
      modal
      closable={false}
      draggable={false}
      dismissableMask={!loading}
      className="au-dialog au-create-dialog"
      style={{ width: "52rem", maxWidth: "94vw" }}
      footer={footer}
    >
      <Toast ref={toast} />

      <div className="au-create-body">
        <section className="au-create-avatar-card">
          <label className="au-create-avatar">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={onSelectFoto}
              disabled={created}
            />
            <span className="au-avatar-large">
              {fotoPreview ? <img src={fotoPreview} alt="Preview" /> : <i className="pi pi-user" />}
            </span>
          </label>
          <div>
            <strong>Perfil inicial</strong>
            <span>El avatar es opcional y puede cambiarse despues desde editar usuario.</span>
          </div>
          {created ? <span className="au-status-tag is-on">Creado</span> : null}
        </section>

        <div className="au-create-grid">
          <label className="au-field">
            <span>Nombre completo</span>
            <InputText
              value={form.nombreUsuario}
              onChange={(event) => updateForm({ nombreUsuario: event.target.value })}
              disabled={loading || created}
              autoFocus
            />
          </label>

          <label className="au-field">
            <span>Rol</span>
            <Dropdown
              value={form.idRol}
              options={roleOptions}
              onChange={(event) => updateForm({ idRol: event.value })}
              placeholder={rolesLoading ? "Cargando roles" : "Selecciona rol"}
              loading={rolesLoading}
              disabled={loading || rolesLoading || created}
              panelClassName="au-select-panel"
            />
          </label>

          <label className="au-field is-wide">
            <span>Usuario / login sugerido</span>
            <InputText
              value={form.usuario}
              onChange={(event) => {
                setUsuarioTouched(true);
                updateForm({ usuario: event.target.value });
              }}
              disabled={loading || created}
              placeholder="Se genera con nombre y rol"
            />
            <small>
              Se sugiere con el nombre y rol inicial. Si lo ajustas manualmente, ya no se actualiza solo.
            </small>
          </label>

          <label className="au-field">
            <span>Correo</span>
            <InputText
              value={form.correo}
              onChange={(event) => updateForm({ correo: event.target.value })}
              disabled={loading || created}
              placeholder="correo@dominio.com"
            />
          </label>

          <label className="au-field">
            <span>Telefono</span>
            <InputText
              value={form.telefono}
              onChange={(event) => updateForm({ telefono: event.target.value })}
              disabled={loading || created}
              placeholder="5551234567"
            />
          </label>

          <section className="au-create-temp-card is-wide">
            <div>
              <strong>Password temporal</strong>
              <span>Copiala y entregala al usuario. Al iniciar sesion se le pedira cambiarla.</span>
            </div>
            <div className="au-temp-password-box">
              <InputText value={temporaryPassword} readOnly className="au-temp-password-input" />
              <Button
                icon={copied ? "pi pi-check" : "pi pi-copy"}
                label={copied ? "Copiado" : "Copiar"}
                className="au-soft-btn"
                onClick={copyPassword}
                disabled={!temporaryPassword}
                type="button"
              />
              <Button
                icon="pi pi-refresh"
                className="au-icon-btn"
                onClick={regeneratePassword}
                disabled={loading || created}
                type="button"
                aria-label="Generar otra password temporal"
              />
            </div>
          </section>
        </div>

        {error ? <div className="au-form-error">{error}</div> : null}
      </div>
    </Dialog>
  );
}
