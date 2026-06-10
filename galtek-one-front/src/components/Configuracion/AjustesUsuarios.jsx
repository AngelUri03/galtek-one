// AjustesUsuarios.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { ToggleButton } from "primereact/togglebutton";
import { Dropdown } from "primereact/dropdown";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";

import AjustesUsuariosCrear from "./AjustesUsuariosCrear";
import "../../style/components/Configuracion/AjustesUsuarios.css";

const api = new APIfetchApi();

/* ========================= */
/*          HELPERS          */
/* ========================= */

const buildDataUrlFromBase64 = (raw, fallbackMime = "image/png") => {
  if (!raw) return null;
  const s = String(raw).trim();
  if (s.startsWith("data:image/")) return s;
  if (s.includes(";base64,")) return `data:${s}`;
  const clean = s.replace(/\s/g, "");
  return `data:${fallbackMime};base64,${clean}`;
};

function resolveUsuariosURL() {
  if (endpoints && endpoints.usuarios) return endpoints.usuarios;

  const base = (process.env.REACT_APP_API_BASE_URL || "").trim();
  if (base) return `${base.replace(/\/+$/, "")}/usuarios`;

  return endpoints.usuarios;
}

function resolveUsuarioImagenURL(idUsuario) {
  const usuarios = resolveUsuariosURL();
  return `${usuarios.replace(/\/+$/, "")}/${idUsuario}/imagen`;
}

function resolveUsuariosPermisosURL(idUsuario) {
  if (endpoints?.usuariosPermisos) {
    return `${endpoints.usuariosPermisos.replace(/\/+$/, "")}/${idUsuario}`;
  }
  return null;
}

function readAuthSesion() {
  const raw = sessionStorage.getItem("auth_session");
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

const normalizePerm = (p) => ({
  idPermiso: p?.idPermiso ?? p?.id_permiso ?? p?.id,
  clave: p?.clave ?? "",
  nombre: p?.nombre ?? p?.name ?? p?.clave ?? "",
  descripcion: p?.descripcion ?? "",
  modulo: (p?.modulo ?? "GENERAL").toUpperCase(),
  accion: (p?.accion ?? "").toUpperCase(),
});

const normalizeRole = (r) => ({
  idRol: r?.idRol ?? r?.id_rol ?? r?.id,
  nombreRol: r?.nombreRol ?? r?.nombre ?? r?.rol ?? "",
  activo: r?.activo ?? r?.estatus ?? true,
  permisos: Array.isArray(r?.permisos) ? r.permisos.map(normalizePerm) : [],
});

const safeTrim = (s) => String(s ?? "").trim();

const findSessionUserId = (userList) => {
  const auth = readAuthSesion();
  if (!auth || !Array.isArray(userList) || userList.length === 0) return null;

  const sessionUsuario = safeTrim(auth.usuario).toLowerCase();
  const sessionNombre = safeTrim(auth.nombreUsuario).toLowerCase();

  // 1) match por "usuario" (login)
  if (sessionUsuario) {
    const hit = userList.find(
      (u) => safeTrim(u.usuario).toLowerCase() === sessionUsuario
    );
    if (hit?.idUsuario != null) return hit.idUsuario;
  }

  // 2) fallback por nombre
  if (sessionNombre) {
    const hit = userList.find(
      (u) => safeTrim(u.nombreUsuario).toLowerCase() === sessionNombre
    );
    if (hit?.idUsuario != null) return hit.idUsuario;
  }

  return null;
};

/* ========================= */
/*        COMPONENT          */
/* ========================= */

export default function AjustesUsuarios() {
  const toast = useRef(null);

  // token: prioriza auth_sesion.token si existe
  const authSesion = readAuthSesion();
  const token = authSesion?.token;

  const [loading, setLoading] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [savingPerms, setSavingPerms] = useState(false);

  const [q, setQ] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);

  const [showCrear, setShowCrear] = useState(false);

  const [editor, setEditor] = useState({
    idUsuario: null,
    nombreUsuario: "",
    usuario: "",
    correo: "",
    telefono: "",
    activo: true,
    idRol: null,
    imagen: null,
  });

  const [imgFile, setImgFile] = useState(null);
  const [imgPreview, setImgPreview] = useState(null);

  const [overrides, setOverrides] = useState(new Map());
  const [permSearch, setPermSearch] = useState("");

  /* ========================= */
  /*          FETCH            */
  /* ========================= */

  const fetchRoles = async () => {
    const res = await api.fetchApi(null, "GET", null, endpoints.roles);
    if (!res || !res.ok) throw new Error("Roles no ok");
    const json = await res.json();
    const list = Array.isArray(json?.data) ? json.data : [];
    const norm = list.map(normalizeRole);
    setRoles(norm);
    return norm;
  };

  const fetchPermisos = async () => {
    const res = await api.fetchApi(null, "GET", null, endpoints.permisos);
    if (!res || !res.ok) throw new Error("Permisos no ok");
    const json = await res.json();
    const list = Array.isArray(json?.data) ? json.data : [];
    const norm = list.map(normalizePerm);
    setPermisos(norm);
    return norm;
  };

  const cargarUsuarios = async () => {
    const res = await api.fetchApi(null, "GET", undefined, endpoints.usuarios);
    if (!res || !res.ok) throw new Error("Usuarios no ok");
    const payload = await res.json();

    const lista = (payload.data || []).map((u) => {
      const b64 = u.avatarUrl || u.imagenBase64 || u.imagen || null;

      return {
        idUsuario: u.idUsuario,
        nombreUsuario: u.nombreUsuario,
        usuario: u.usuario,
        correo: u.correo || "",
        telefono: u.telefono || "",
        imagen: buildDataUrlFromBase64(b64, "image/png"),
        idRol: u?.rol?.idRol ?? u?.rol?.id ?? null,
        rolNombre: u?.rol?.nombreRol ?? u?.rol?.nombre ?? "",
        activo: u?.estatus ?? true,
      };
    });

    setUsuarios(lista);
    return lista;
  };

  // Asegura SIEMPRE un usuario seleccionado
  const ensureSelection = (userList, preferredId) => {
    if (!Array.isArray(userList) || userList.length === 0) {
      setSelectedUserId(null);
      return null;
    }

    // 1) si me pasan uno válido, úsalo
    if (
      preferredId != null &&
      userList.some((u) => u.idUsuario === preferredId)
    ) {
      setSelectedUserId(preferredId);
      return preferredId;
    }

    // 2) intenta session
    const sessionId = findSessionUserId(userList);
    if (sessionId != null && userList.some((u) => u.idUsuario === sessionId)) {
      setSelectedUserId(sessionId);
      return sessionId;
    }

    // 3) fallback: primero
    const firstId = userList[0]?.idUsuario ?? null;
    setSelectedUserId(firstId);
    return firstId;
  };

  const loadAll = async (keepUserId) => {
    setLoading(true);
    try {
      const [, , userList] = await Promise.all([
        fetchPermisos(),
        fetchRoles(),
        cargarUsuarios(),
      ]);

      ensureSelection(userList, keepUserId ?? selectedUserId);
    } catch (e) {
      console.error(e);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar Usuarios/Roles/Permisos.",
        life: 2600,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ========================= */
  /*          MEMO             */
  /* ========================= */

  const filteredUsuarios = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return usuarios;
    return usuarios.filter((u) => {
      const a = (u.nombreUsuario || "").toLowerCase();
      const b = (u.usuario || "").toLowerCase();
      return a.includes(qq) || b.includes(qq);
    });
  }, [q, usuarios]);

  const selectedUser = useMemo(() => {
    if (!selectedUserId) return null;
    return usuarios.find((u) => u.idUsuario === selectedUserId) || null;
  }, [selectedUserId, usuarios]);

  // Si por cualquier razón el selectedUserId quedó inválido, lo reparamos en caliente
  useEffect(() => {
    if (!usuarios.length) return;
    if (!selectedUserId) {
      ensureSelection(usuarios, null);
      return;
    }
    const exists = usuarios.some((u) => u.idUsuario === selectedUserId);
    if (!exists) ensureSelection(usuarios, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarios, selectedUserId]);

  const selectedRole = useMemo(() => {
    const idRol = editor.idRol ?? selectedUser?.idRol ?? null;
    if (!idRol) return null;
    return roles.find((r) => r.idRol === idRol) || null;
  }, [roles, editor.idRol, selectedUser?.idRol]);

  /* ========================= */
  /*        SYNC EDITOR        */
  /* ========================= */

  useEffect(() => {
    if (!selectedUser) return;

    setEditor({
      idUsuario: selectedUser.idUsuario,
      nombreUsuario: selectedUser.nombreUsuario || "",
      usuario: selectedUser.usuario || "",
      correo: selectedUser.correo || "",
      telefono: selectedUser.telefono || "",
      activo: selectedUser.activo !== false,
      idRol: selectedUser.idRol ?? null,
      imagen: selectedUser.imagen || null,
    });

    setImgFile(null);
    setImgPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });

    setOverrides(new Map());
    setPermSearch("");
  }, [selectedUser]);

  useEffect(() => {
    return () => {
      if (imgPreview?.startsWith("blob:")) URL.revokeObjectURL(imgPreview);
    };
  }, [imgPreview]);

  const updateEditor = (patch) => setEditor((p) => ({ ...p, ...patch }));

  /* ========================= */
  /*       IMAGE PICK          */
  /* ========================= */

  const onPickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      toast.current?.show({
        severity: "warn",
        summary: "Imagen inválida",
        detail: "Selecciona un archivo de imagen (PNG/JPG).",
        life: 2200,
      });
      return;
    }
    if (file.size > 2_500_000) {
      toast.current?.show({
        severity: "warn",
        summary: "Imagen pesada",
        detail: "Máximo 2.5 MB.",
        life: 2200,
      });
      return;
    }

    setImgFile(file);
    const url = URL.createObjectURL(file);
    setImgPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });
  };

  /* ========================= */
  /*   PERMISOS + OVERRIDES    */
  /* ========================= */

  const baseRolePermIds = useMemo(() => {
    const set = new Set();
    (selectedRole?.permisos || []).forEach((p) => {
      if (p?.idPermiso != null) set.add(Number(p.idPermiso));
    });
    return set;
  }, [selectedRole]);

  const setOverride = (idPermiso, efecto, motivo) => {
    setOverrides((prev) => {
      const next = new Map(prev);

      if (!efecto || efecto === "NONE") {
        next.delete(idPermiso);
        return next;
      }

      next.set(idPermiso, {
        efecto,
        motivo: (motivo ?? next.get(idPermiso)?.motivo ?? "").toString(),
      });
      return next;
    });
  };

  const setMotivo = (idPermiso, motivo) => {
    setOverrides((prev) => {
      const next = new Map(prev);
      const cur = next.get(idPermiso);
      if (!cur) return next;
      next.set(idPermiso, { ...cur, motivo: motivo ?? "" });
      return next;
    });
  };

  const overrideRowList = useMemo(() => {
    const list = permisos || [];
    const s = permSearch.trim().toLowerCase();

    const filtered = !s
      ? list
      : list.filter((p) => {
          const a = (p.nombre || "").toLowerCase();
          const b = (p.clave || "").toLowerCase();
          const c = (p.descripcion || "").toLowerCase();
          const d = (p.modulo || "").toLowerCase();
          const e = (p.accion || "").toLowerCase();
          return (
            a.includes(s) ||
            b.includes(s) ||
            c.includes(s) ||
            d.includes(s) ||
            e.includes(s)
          );
        });

    return filtered.map((p) => {
      const id = Number(p.idPermiso);
      const base = baseRolePermIds.has(id);
      const ov = overrides.get(id) || null;
      const effective =
        ov?.efecto === "DENY" ? false : ov?.efecto === "ALLOW" ? true : base;

      return {
        idPermiso: id,
        modulo: p.modulo,
        accion: p.accion,
        clave: p.clave,
        nombre: p.nombre,
        descripcion: p.descripcion,
        base,
        override: ov?.efecto || "NONE",
        motivo: ov?.motivo || "",
        effective,
      };
    });
  }, [permisos, permSearch, baseRolePermIds, overrides]);

  const effectiveCount = useMemo(() => {
    let c = 0;
    overrideRowList.forEach((r) => {
      if (r.effective) c++;
    });
    return c;
  }, [overrideRowList]);

  const overridesCount = useMemo(() => overrides.size, [overrides]);

  /* ========================= */
  /*          GUARDAR          */
  /* ========================= */

  const validateEditor = () => {
    const nombre = safeTrim(editor.nombreUsuario).replace(/\s+/g, " ");
    const usuario = safeTrim(editor.usuario).replace(/\s+/g, "");
    const correo = safeTrim(editor.correo);
    const telefono = safeTrim(editor.telefono);

    if (!nombre || nombre.length < 3) {
      toast.current?.show({
        severity: "warn",
        summary: "Falta nombre",
        detail: "El nombre debe tener al menos 3 caracteres.",
        life: 2400,
      });
      return null;
    }

    if (!usuario || usuario.length < 3) {
      toast.current?.show({
        severity: "warn",
        summary: "Falta usuario",
        detail: "El usuario (login) debe tener al menos 3 caracteres.",
        life: 2400,
      });
      return null;
    }

    if (!editor.idRol) {
      toast.current?.show({
        severity: "warn",
        summary: "Falta rol",
        detail: "Selecciona un rol para el usuario.",
        life: 2400,
      });
      return null;
    }

    // correo opcional, pero si viene, valida básico
    if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      toast.current?.show({
        severity: "warn",
        summary: "Correo inválido",
        detail: "Revisa el correo (formato).",
        life: 2400,
      });
      return null;
    }

    return { nombre, usuario, correo, telefono };
  };

  const guardarCambios = async () => {
    if (!selectedUser?.idUsuario) return;
    if (savingUser || savingPerms) return;

    const v = validateEditor();
    if (!v) return;

    setSavingUser(true);
    try {
      // PERFIL (sin modal, sin confirm)
      const body = {
        nombreUsuario: v.nombre,
        usuario: v.usuario,
        correo: v.correo,
        telefono: v.telefono,
        rol: { idRol: Number(editor.idRol) },
        estatus: !!editor.activo,
      };

      const res = await api.fetchApi(
        {
          "Content-Type": "application/json",
        },
        "PUT",
        body,
        `${resolveUsuariosURL().replace(/\/+$/, "")}/${selectedUser.idUsuario}`
      );

      if (!res || !res.ok) throw new Error("No se pudo actualizar usuario.");

      // Imagen
      if (imgFile) {
        try {
          const url = resolveUsuarioImagenURL(selectedUser.idUsuario);
          const fd = new FormData();
          fd.append("imagen", imgFile);

          const up = await fetch(url, {
            method: "POST",
            headers: {
              user: authSesion?.usuario || "",
              Authorization: `Bearer ${token}`,
            },
            body: fd,
          });

          if (!up.ok) {
            toast.current?.show({
              severity: "warn",
              summary: "Imagen",
              detail: "Se guardó el usuario, pero no se pudo subir la imagen.",
              life: 2400,
            });
          }
        } catch {
          toast.current?.show({
            severity: "warn",
            summary: "Imagen",
            detail: "Se guardó el usuario, pero no se pudo subir la imagen.",
            life: 2400,
          });
        }
      }

      toast.current?.show({
        severity: "success",
        summary: "Listo",
        detail: "Usuario actualizado.",
        life: 1600,
      });

      await loadAll(selectedUser.idUsuario);
    } catch (e) {
      console.error(e);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: e?.message || "No se pudo guardar.",
        life: 2600,
      });
      return;
    } finally {
      setSavingUser(false);
    }

    // PERMISOS (overrides)
    const url = resolveUsuariosPermisosURL(selectedUser.idUsuario);
    if (!url) return;

    const payloadOverrides = Array.from(overrides.entries()).map(
      ([idPermiso, v]) => ({
        idPermiso: Number(idPermiso),
        efecto: v.efecto,
        motivo: (v.motivo || "").toString().slice(0, 180),
      })
    );

    setSavingPerms(true);
    try {
      const res = await api.fetchApi(
        {
          "Content-Type": "application/json",
        },
        "PUT",
        { permisos: payloadOverrides },
        url
      );

      if (!res || !res.ok)
        throw new Error("No se pudieron guardar permisos específicos.");

      toast.current?.show({
        severity: "success",
        summary: "Permisos",
        detail: "Overrides guardados.",
        life: 1600,
      });
    } catch (e) {
      console.error(e);
      toast.current?.show({
        severity: "warn",
        summary: "Permisos",
        detail:
          e?.message ||
          "No se pudieron guardar overrides (endpoint pendiente).",
        life: 2600,
      });
    } finally {
      setSavingPerms(false);
    }
  };

  /* ========================= */
  /*          ELIMINAR         */
  /* ========================= */

  const eliminarUsuario = () => {
    if (!selectedUser?.idUsuario) return;

    confirmDialog({
      header: "Confirmar eliminación",
      icon: "pi pi-exclamation-triangle",
      message: (
        <div style={{ lineHeight: 1.35 }}>
          <div>
            ¿Eliminar a <b>{selectedUser.nombreUsuario}</b>?
          </div>
          <div style={{ opacity: 0.78, marginTop: 6 }}>
            Esta acción no se puede deshacer.
          </div>
        </div>
      ),
      acceptLabel: "Eliminar",
      rejectLabel: "Cancelar",
      className: "au-cdlg",
      acceptClassName: "arx-btn arx-btn--danger",
      rejectClassName: "arx-btn arx-btn--ghost",
      accept: async () => {
        try {
          const res = await api.fetchApi(
            {},
            "DELETE",
            undefined,
            `${resolveUsuariosURL().replace(/\/+$/, "")}/${
              selectedUser.idUsuario
            }`
          );

          if (!res || !res.ok)
            throw new Error("No se pudo eliminar el usuario.");

          toast.current?.show({
            severity: "success",
            summary: "Eliminado",
            detail: "Usuario eliminado correctamente.",
            life: 1700,
          });

          // recarga y asegura selección (session si existe, si no, primero)
          await loadAll(null);
        } catch (e) {
          console.error(e);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: e?.message || "No se pudo eliminar el usuario.",
            life: 2600,
          });
        }
      },
    });
  };

  /* ========================= */
  /*        RENDER HELPERS     */
  /* ========================= */

  const UserCard = ({ u }) => {
    const active = u.idUsuario === selectedUserId;

    return (
      <button
        type="button"
        className={`au-user ${active ? "is-active" : ""}`}
        onClick={() => {
          // NO permitimos deseleccionar: siempre set a un id
          setSelectedUserId(u.idUsuario);
        }}
        disabled={loading || savingUser || savingPerms}
        title={`${u.nombreUsuario} (@${u.usuario || "—"})`}
      >
        <div className="au-user-left">
          <div className="au-user-mini-avatar">
            {u.imagen ? (
              <img
                src={u.imagen}
                alt="avatar"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <i className="pi pi-user" />
            )}
          </div>

          <div className="au-user-text">
            <div className="au-user-name">{u.nombreUsuario}</div>
            <div className="au-user-sub">@{u.usuario || "—"}</div>
          </div>
        </div>

        <div className="au-user-right">
          <span className={`au-tag ${u.activo ? "is-on" : "is-off"}`}>
            {u.activo ? "Activo" : "Inactivo"}
          </span>
        </div>
      </button>
    );
  };

  const overrideBody = (row) => {
    const val = row.override || "NONE";
    return (
      <div
        className={`au-ovCell ${
          val === "ALLOW" ? "is-allow" : val === "DENY" ? "is-deny" : ""
        }`}
      >
        <Dropdown
          value={val}
          options={[
            { label: "Heredado", value: "NONE" },
            { label: "Permitir", value: "ALLOW" },
            { label: "Denegar", value: "DENY" },
          ]}
          optionLabel="label"
          optionValue="value"
          className="au-ovDD"
          onChange={(e) => setOverride(row.idPermiso, e.value, row.motivo)}
          disabled={loading || savingUser || savingPerms || !selectedUser}
        />
      </div>
    );
  };

  const motivoBody = (row) => {
    const disabled = row.override === "NONE";
    return (
      <InputText
        value={row.motivo || ""}
        onChange={(e) => setMotivo(row.idPermiso, e.target.value)}
        placeholder={disabled ? "—" : "Motivo (opcional)"}
        className={`au-ovMotivo ${disabled ? "is-disabled" : ""}`}
        disabled={
          disabled || loading || savingUser || savingPerms || !selectedUser
        }
      />
    );
  };

  const baseBody = (row) => (
    <span className={`au-pill ${row.base ? "is-on" : "is-off"}`}>
      {row.base ? "Sí" : "No"}
    </span>
  );

  const effectiveBody = (row) => (
    <span
      className={`au-pill au-pill--strong ${
        row.effective ? "is-on" : "is-off"
      }`}
    >
      {row.effective ? "Permitido" : "Denegado"}
    </span>
  );

  const hasUsers = filteredUsuarios.length > 0;

  /* ========================= */
  /*            UI             */
  /* ========================= */

  return (
    <div className="au-wrap">
      <Toast ref={toast} />
      <ConfirmDialog draggable={false} className="au-cdlg" />

      <div className="au-layout">
        <aside className="au-left">
          <div className="au-left-head">
            <div className="au-left-title">
              Usuarios{" "}
              <span className="au-pill-count">{filteredUsuarios.length}</span>
            </div>

            <div className="au-left-actions">
              <Button
                icon="pi pi-user-plus"
                label="Nuevo"
                className="arx-btn arx-btn--primary"
                onClick={(e) => {
                  setShowCrear(true);
                  e.currentTarget.blur();
                }}
                disabled={loading || savingUser || savingPerms}
                type="button"
              />
            </div>
          </div>

          <div className="au-search">
            <i className="pi pi-search" />
            <InputText
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar usuario…"
              aria-label="Buscar usuario"
              disabled={loading}
            />
          </div>

          <div className={`au-list ${!hasUsers ? "is-empty" : ""}`}>
            {filteredUsuarios.map((u) => (
              <UserCard key={u.idUsuario} u={u} />
            ))}

            {!hasUsers && (
              <div className="au-empty">
                <i className="pi pi-info-circle" />
                <div>
                  <div className="au-empty-title">Sin usuarios</div>
                  <div className="au-empty-sub">
                    Crea el primero con “Nuevo”.
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT */}
        <main className="au-right">
          <div className="au-surface">
            {/* PERFIL compacto */}
            <section className="au-card au-card--perfil au-card--perfil-compact">
              <div className="au-card-head au-card-head--tight">
                <div className="au-card-head-left">
                  <div className="au-card-title">Perfil</div>
                  <div className="au-card-sub">
                    Configura la información de este perfil
                  </div>
                </div>

                <div className="au-actions">
                  <Button
                    icon="pi pi-trash"
                    label="Eliminar"
                    className="arx-btn arx-btn--danger"
                    onClick={(e) => {
                      eliminarUsuario();
                      e.currentTarget.blur();
                    }}
                    disabled={
                      !selectedUser || loading || savingUser || savingPerms
                    }
                    type="button"
                  />

                  <Button
                    icon="pi pi-save"
                    label="Guardar"
                    className="arx-btn arx-btn--primary"
                    onClick={(e) => {
                      guardarCambios(); // ✅ sin modal
                      e.currentTarget.blur();
                    }}
                    disabled={
                      !selectedUser || loading || savingUser || savingPerms
                    }
                    type="button"
                  />
                </div>
              </div>

              {/* Si no hay usuarios, no se rompe */}
              {!selectedUser ? (
                <div className="au-emptyWide">
                  <div className="au-empty au-empty--fill">
                    <i className="pi pi-info-circle" />
                    <div>
                      <div className="au-empty-title">
                        No hay usuarios disponibles
                      </div>
                      <div className="au-empty-sub">Crea uno con “Nuevo”.</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="au-perfil2Wrap">
                  {/* Avatar ocupa 2 filas (OJO: clases ya en kebab-case) */}
                  <label
                    htmlFor="au_img"
                    className="au-avatar-pick au-avatar-pick--lg2"
                    title="Cambiar imagen"
                  >
                    <div className="au-avatar au-avatar--lg2">
                      {imgPreview ? (
                        <img src={imgPreview} alt="preview" />
                      ) : editor.imagen ? (
                        <img src={editor.imagen} alt="avatar" />
                      ) : (
                        <i className="pi pi-user" />
                      )}
                    </div>

                    <span className="au-avatar-hover au-avatar-hover--lg2">
                      <i className="pi pi-upload" />
                    </span>
                  </label>

                  <input
                    id="au_img"
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={onPickImage}
                    disabled={loading || savingUser || savingPerms}
                  />

                  {/* ===== FILA 1: nombre, usuario, rol ===== */}
                  <div className="au-perfil-row-1">
                    <span className="au-fld au-fld--name">
                      <span className="au-fld-top">Nombre completo</span>
                      <InputText
                        value={editor.nombreUsuario}
                        onChange={(e) =>
                          updateEditor({ nombreUsuario: e.target.value })
                        }
                        placeholder="Escribe el nombre…"
                        disabled={loading || savingUser || savingPerms}
                        className="au-inp"
                      />
                    </span>

                    <span className="au-fld au-fld--user">
                      <span className="au-fld-top">Usuario</span>
                      <InputText
                        value={editor.usuario}
                        onChange={(e) =>
                          updateEditor({ usuario: e.target.value })
                        }
                        placeholder="usuario"
                        disabled={loading || savingUser || savingPerms}
                        className="au-inp"
                      />
                    </span>

                    <span className="au-fld au-fld--role">
                      <span className="au-fld-top">Rol</span>
                      <Dropdown
                        value={editor.idRol}
                        options={roles.map((r) => ({
                          label: r.nombreRol,
                          value: r.idRol,
                        }))}
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Selecciona rol"
                        className="au-roleDD au-roleDD--inline au-roleDD--strong"
                        onChange={(e) => updateEditor({ idRol: e.value })}
                        disabled={loading || savingUser || savingPerms}
                      />
                    </span>
                  </div>

                  {/* ===== FILA 2: correo, teléfono, estatus, contraseña ===== */}
                  <div className="au-perfil-row-2">
                    <span className="au-fld au-fld--mail">
                      <span className="au-fld-top">Correo</span>
                      <InputText
                        value={editor.correo || ""}
                        onChange={(e) =>
                          updateEditor({ correo: e.target.value })
                        }
                        placeholder="correo@dominio.com"
                        disabled={loading || savingUser || savingPerms}
                        className="au-inp"
                      />
                    </span>

                    <span className="au-fld au-fld--tel">
                      <span className="au-fld-top">Teléfono</span>
                      <InputText
                        value={editor.telefono || ""}
                        onChange={(e) =>
                          updateEditor({ telefono: e.target.value })
                        }
                        placeholder="(opcional)"
                        disabled={loading || savingUser || savingPerms}
                        className="au-inp"
                      />
                    </span>

                    {/* Estatus resaltado */}
                    <div className="au-fld au-fld--status">
                      <span className="au-fld-top">Estatus</span>

                      <div
                        className={`au-statusPill ${
                          editor.activo ? "is-on" : "is-off"
                        }`}
                      >
                        <div className="au-statusLeft">
                          <i
                            className={`pi ${
                              editor.activo ? "pi-check-circle" : "pi-ban"
                            }`}
                          />
                          <span className="au-statusText">
                            {editor.activo ? "Activo" : "Inactivo"}
                          </span>
                        </div>

                        <ToggleButton
                          checked={!!editor.activo}
                          onChange={(e) => updateEditor({ activo: !!e.value })}
                          onLabel="ON"
                          offLabel="OFF"
                          onIcon="pi pi-check"
                          offIcon="pi pi-times"
                          className="au-toggle au-toggle--pill"
                          disabled={loading || savingUser || savingPerms}
                        />
                      </div>
                    </div>

                    {/* Botón contraseña (solo botón, modal después) */}
                    <div className="au-fld au-fld--action au-fld--pass">
                      <span className="au-fld-top">Contraseña</span>
                      <Button
                        icon="pi pi-key"
                        label="Administrar"
                        className="arx-btn arx-btn--primary au-passBtn au-passBtn--strong"
                        type="button"
                        onClick={(e) => {
                          // TODO: abrir modal nuevo después
                          // setShowPasswordModal(true);
                          e.currentTarget.blur();
                        }}
                        disabled={
                          !selectedUser || loading || savingUser || savingPerms
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* PERMISOS con más espacio */}
            <section className="au-card au-card--perms">
              <div className="au-card-head au-card-head--tight">
                <div className="au-card-head-left">
                  <div className="au-card-title">Permisos</div>
                  <div className="au-card-sub">
                    Efectivos: <b>{effectiveCount}</b> • Overrides:{" "}
                    <b>{overridesCount}</b>
                  </div>
                </div>

                <div className="au-permActions">
                  <Button
                    icon="pi pi-times"
                    label="Limpiar overrides"
                    className="arx-btn arx-btn--ghost"
                    type="button"
                    onClick={(e) => {
                      setOverrides(new Map());
                      e.currentTarget.blur();
                    }}
                    disabled={
                      !selectedUser ||
                      loading ||
                      savingUser ||
                      savingPerms ||
                      overrides.size === 0
                    }
                  />
                </div>
              </div>

              <div className="au-permSearchRow au-permSearchRow--tight">
                <div className="au-search au-search--wide">
                  <i className="pi pi-search" />
                  <InputText
                    value={permSearch}
                    onChange={(e) => setPermSearch(e.target.value)}
                    placeholder="Buscar permiso…"
                    disabled={!selectedUser || loading}
                  />
                </div>
              </div>

              <div className="au-tableWrap">
                <DataTable
                  value={overrideRowList}
                  className="au-table"
                  scrollable
                  scrollHeight="flex"
                  dataKey="idPermiso"
                  stripedRows
                  emptyMessage={
                    selectedUser
                      ? "Sin permisos para mostrar."
                      : "Selecciona un usuario."
                  }
                >
                  <Column
                    field="modulo"
                    header="Módulo"
                    style={{ width: "160px" }}
                    body={(row) => (
                      <span className="au-chip">{row.modulo}</span>
                    )}
                  />
                  <Column
                    field="accion"
                    header="Acción"
                    style={{ width: "140px" }}
                    body={(row) => (
                      <span className="au-chip au-chip--soft">
                        {row.accion || "—"}
                      </span>
                    )}
                  />
                  <Column
                    header="Permiso"
                    body={(row) => (
                      <div className="au-permName">
                        <div className="au-permTitle">{row.nombre}</div>
                        <div className="au-permSub">
                          <span className="au-mono">{row.clave}</span>
                          {row.descripcion ? (
                            <span className="au-dot">•</span>
                          ) : null}
                          {row.descripcion ? (
                            <span className="au-dim">{row.descripcion}</span>
                          ) : null}
                        </div>
                      </div>
                    )}
                  />
                  <Column
                    header="Base"
                    style={{ width: "110px" }}
                    body={baseBody}
                  />
                  <Column
                    header="Override"
                    style={{ width: "190px" }}
                    body={overrideBody}
                  />
                  <Column
                    header="Motivo"
                    style={{ width: "240px" }}
                    body={motivoBody}
                  />
                  <Column
                    header="Efectivo"
                    style={{ width: "130px" }}
                    body={effectiveBody}
                  />
                </DataTable>
              </div>

              <div className="au-permFoot au-permFoot--tight">
                <div className="au-footHint">
                  <i className="pi pi-info-circle" />
                  <span>
                    <b>Heredado</b> usa rol • <b>Permitir/Denegar</b> crea
                    override por usuario
                  </span>
                </div>

                <Button
                  icon="pi pi-save"
                  label="Guardar todo"
                  className="arx-btn arx-btn--primary"
                  type="button"
                  onClick={(e) => {
                    guardarCambios(); // ✅ sin modal
                    e.currentTarget.blur();
                  }}
                  disabled={
                    !selectedUser || loading || savingUser || savingPerms
                  }
                />
              </div>
            </section>
          </div>
        </main>
      </div>

      <AjustesUsuariosCrear
        visible={showCrear}
        onHide={() => setShowCrear(false)}
        onCreated={async () => {
          setShowCrear(false);
          // al crear: intenta reseleccionar al de sesión; si no, respeta el actual; si no, primero
          await loadAll(selectedUserId);
        }}
      />
    </div>
  );
}
