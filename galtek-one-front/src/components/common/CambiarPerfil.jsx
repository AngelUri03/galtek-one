import React, { useEffect, useMemo, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";

import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";
import { encryptRSAOAEPToBase64 } from "../../utils/rsa";
import { useAuth } from "../../auth/AuthContext";

import "../../style/components/common/CambiarPerfil.css";

const api = new APIfetchApi();

const toImageSrc = (b64) => {
  if (!b64 || typeof b64 !== "string") return null;
  const v = b64.trim();
  if (!v) return null;
  return v.startsWith("data:image/") ? v : `data:image/png;base64,${v}`;
};

const normalizeRoleKey = (roleName = "") =>
  roleName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");

export default function CambiarPerfil({ visible, onHide, onSuccess }) {
  const { login } = useAuth();

  // backend -> roles[{rol, usuarios[]}]
  const [roles, setRoles] = useState([]);
  const [rolActivo, setRolActivo] = useState(null);

  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [contrasena, setContrasena] = useState("");

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");

  const resetAll = () => {
    setRoles([]);
    setRolActivo(null);
    setUsuarioSeleccionado(null);
    setContrasena("");
    setLoadError("");
    setError("");
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetAll();
    onHide?.();
  };

  const usuariosDelRol = useMemo(() => {
    const found = roles.find((r) => r.rol === rolActivo);
    return found?.usuarios || [];
  }, [roles, rolActivo]);

  const canSubmit = useMemo(() => {
    return !!usuarioSeleccionado && !!contrasena && !loading && !isSubmitting;
  }, [usuarioSeleccionado, contrasena, loading, isSubmitting]);

  // ===========================
  //   FETCH (misma base Ventas)
  // ===========================
  const fetchRolesUsuarios = async () => {
    try {
      setLoading(true);
      setLoadError("");
      setError("");

      const res = await api.fetchApi({}, "GET", null, endpoints.usuariosPorRol);

      if (!res) {
        setLoadError("No se pudo contactar al servidor.");
        return;
      }

      if (!res.ok) {
        let detalle = "Error al obtener usuarios.";
        try {
          const text = await res.text();
          if (text)
            detalle += ` Detalle: ${text.substring(0, 180)}${
              text.length > 180 ? "..." : ""
            }`;
        } catch (_) {}
        setLoadError(detalle);
        return;
      }

      const json = await res.json().catch(() => null);
      const data = Array.isArray(json?.data) ? json.data : [];

      // Map robusto: roles dinámicos, usuarios con 3 campos
      const mapped = data
        .filter((r) => r && r.rol && Array.isArray(r.usuarios))
        .map((r) => ({
          rol: String(r.rol),
          rolKey: normalizeRoleKey(String(r.rol)),
          usuarios: r.usuarios.map((u, idx) => ({
            id: `${r.rol}-${u?.usuario || idx}`,
            nombreUsuario: u?.nombreUsuario || "Sin nombre",
            usuario: u?.usuario || "",
            avatarSrc: toImageSrc(u?.avatarUrl),
            raw: u,
          })),
        }))
        .filter((r) => r.usuarios.length);

      setRoles(mapped);
      setRolActivo(mapped[0]?.rol || null);
      setUsuarioSeleccionado(mapped[0]?.usuarios?.[0] || null);
    } catch (err) {
      console.error("Error inesperado al obtener usuarios:", err);
      setLoadError("Ocurrió un error al cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!visible) return;
    resetAll();
    fetchRolesUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // ===========================
  //   LOGIN
  // ===========================
  const handleIngresar = async () => {
    setError("");

    if (!usuarioSeleccionado || !contrasena) {
      setError("Selecciona un usuario y escribe la contraseña.");
      return;
    }

    try {
      setIsSubmitting(true);

      // llave pública
      const resKey = await api.fetchApi(
        {},
        "GET",
        null,
        endpoints.authPublicKey
      );

      if (!resKey) {
        setIsSubmitting(false);
        return;
      }
      if (!resKey.ok) {
        let detalle = "Error al obtener llave pública.";
        try {
          const text = await resKey.text();
          if (text)
            detalle += ` Detalle: ${text.substring(0, 180)}${
              text.length > 180 ? "..." : ""
            }`;
        } catch (_) {}
        setError("No se pudo obtener la llave pública.");
        setIsSubmitting(false);
        return;
      }

      const keyPayload = await resKey.json().catch(() => null);
      const pemPublic = keyPayload?.data;
      if (!pemPublic) {
        setError("No se pudo obtener la llave pública.");
        setIsSubmitting(false);
        return;
      }

      const encryptedPassword = await encryptRSAOAEPToBase64(
        pemPublic,
        contrasena
      );

      // login
      const loginBody = {
        usuario: usuarioSeleccionado.usuario,
        password: encryptedPassword,
      };
      const resLogin = await api.fetchApi(
        {},
        "POST",
        loginBody,
        endpoints.authLogin
      );

      if (!resLogin) {
        setIsSubmitting(false);
        return;
      }

      if (!resLogin.ok) {
        let detalle = "Error al iniciar sesión.";
        try {
          const text = await resLogin.text();
          if (text)
            detalle += ` Detalle: ${text.substring(0, 180)}${
              text.length > 180 ? "..." : ""
            }`;
        } catch (_) {}
        setError("Contraseña incorrecta o usuario inválido.");
        setIsSubmitting(false);
        return;
      }

      const payload = await resLogin.json().catch(() => null);
      if (payload?.statusCode !== 200 || !payload?.data?.token) {
        setError("Contraseña incorrecta o usuario inválido.");
        setIsSubmitting(false);
        return;
      }

      // logout previo best-effort
      const oldToken = sessionStorage.getItem("token");
      if (oldToken) {
        try {
          await api.fetchApi(
            { Authorization: `Bearer ${oldToken}` },
            "POST",
            null,
            endpoints.authLogout
          );
        } catch (_) {}
      }

      sessionStorage.removeItem("token");

      const newToken = payload.data.token;
      const newUserData = {
        token: newToken,
        usuario: payload.data.usuario,
        nombreUsuario: payload.data.nombreUsuario,
        rol: payload.data.rol,
        idEmpresa: payload.data.idEmpresa,
      };

      login(newUserData);

      onSuccess?.({ usuario: usuarioSeleccionado.raw });

      onHide?.();
      setTimeout(() => window.location.reload(), 1900);
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error validando las credenciales.");
      setIsSubmitting(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && canSubmit) handleIngresar();
  };

  const footer = (
    <div className="cpr-footer">
      <Button
        className="cpr-btn cpr-btn--cancel"
        label="Cancelar"
        onClick={handleClose}
        disabled={isSubmitting}
      />
      <Button
        className="cpr-btn cpr-btn--apply"
        icon={isSubmitting ? "pi pi-spin pi-spinner" : "pi pi-check"}
        label={isSubmitting ? "Validando…" : "Ingresar"}
        onClick={handleIngresar}
        disabled={!canSubmit}
      />
    </div>
  );

  return (
    <>
      <Dialog
        header="Cambiar usuario"
        visible={visible}
        onHide={handleClose}
        modal
        closable
        draggable={false}
        dismissableMask
        className="cpr-dialog"
        footer={footer}
      >
        <div className="cpr-layout">
          {/* LEFT: roles */}
          <aside className="cpr-roles">
            <div className="cpr-roles-head">
              <span>Roles</span>
              {loading ? (
                <span className="cpr-pill">
                  <ProgressSpinner
                    style={{ width: "14px", height: "14px" }}
                    strokeWidth="5"
                  />
                  Cargando…
                </span>
              ) : (
                <span className="cpr-pill">
                  <i className="pi pi-users" />
                  {roles.reduce(
                    (acc, r) => acc + (r.usuarios?.length || 0),
                    0
                  )}{" "}
                  usuarios
                </span>
              )}
            </div>

            <div className="cpr-roles-list">
              {roles.map((r) => {
                const active = r.rol === rolActivo;
                return (
                  <button
                    key={r.rol}
                    type="button"
                    className={`cpr-role ${active ? "is-active" : ""}`}
                    onClick={() => {
                      setRolActivo(r.rol);
                      setUsuarioSeleccionado(r.usuarios?.[0] || null);
                      setContrasena("");
                      setError("");
                    }}
                    disabled={loading || isSubmitting}
                    title={r.rol}
                  >
                    <span className="cpr-role-name">{r.rol}</span>
                    <span className="cpr-role-count">
                      {r.usuarios?.length || 0}
                    </span>
                  </button>
                );
              })}
            </div>

            {loadError && <div className="cpr-error">{loadError}</div>}
          </aside>

          {/* RIGHT: usuarios + password */}
          <section className="cpr-main">
            <div className="cpr-main-head">
              <div className="cpr-title">
                <span className="cpr-title-role">{rolActivo || "—"}</span>
                <span className="cpr-sub">Selecciona un usuario</span>
              </div>
            </div>

            <div className="cpr-users">
              {usuariosDelRol.map((u) => {
                const active = usuarioSeleccionado?.id === u.id;

                return (
                  <button
                    key={u.id}
                    type="button"
                    className={`cpr-user ${active ? "is-active" : ""}`}
                    onClick={() => {
                      setUsuarioSeleccionado(u);
                      setContrasena("");
                      setError("");
                    }}
                    disabled={loading || isSubmitting}
                  >
                    <div className="cpr-user-avatar">
                      {u.avatarSrc ? (
                        <img
                          src={u.avatarSrc}
                          alt={u.nombreUsuario}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <i className="pi pi-user" />
                      )}
                    </div>

                    <div className="cpr-user-meta">
                      <div className="cpr-user-name">{u.nombreUsuario}</div>
                      <div className="cpr-user-sub">@{u.usuario || "—"}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="cpr-auth">
              <label>Contraseña</label>
              <div className={`cpr-auth-field ${error ? "has-error" : ""}`}>
                {error && <div className="cpr-error-float">{error}</div>}
                <Password
                  className="cpr-control cpr-pass"
                  inputClassName="cpr-pass-input"
                  placeholder="Contraseña del usuario"
                  toggleMask
                  feedback={false}
                  value={contrasena}
                  onChange={(e) => {
                    setContrasena(e.target.value);
                    setError("");
                  }}
                  onKeyDown={onKeyDown}
                  disabled={!usuarioSeleccionado || loading || isSubmitting}
                />
              </div>
            </div>
          </section>
        </div>
      </Dialog>
    </>
  );
}
