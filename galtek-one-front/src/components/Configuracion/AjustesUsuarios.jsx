import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";

import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";
import { useAuth } from "../../auth/AuthContext";
import { encryptRSAOAEPToBase64 } from "../../utils/rsa";

import AjustesUsuariosCrear from "./AjustesUsuariosCrear";
import UsuarioDetailModal from "./Usuarios/UsuarioDetailModal";
import UsuarioEditorPanel from "./Usuarios/UsuarioEditorPanel";
import UsuarioPasswordModal from "./Usuarios/UsuarioPasswordModal";
import UsuariosFilters from "./Usuarios/UsuariosFilters";
import UsuariosSummary from "./Usuarios/UsuariosSummary";
import UsuariosTable from "./Usuarios/UsuariosTable";
import {
  fileToDataUrl,
  getRoleName,
  isCurrentSessionUser,
  normalizePermiso,
  normalizeRole,
  normalizeUsuario,
  readAuthSession,
  readPayload,
  resolveUsuarioPasswordURL,
  resolveUsuarioStatusURL,
  resolveUsuariosURL,
  safeTrim,
  userSearchText,
  validateUserEditor,
} from "./Usuarios/usuariosUtils";

import "../../style/components/Configuracion/AjustesUsuarios.css";

const api = new APIfetchApi();
const emptyFilters = { estado: "TODOS", rol: "TODOS", contacto: "TODOS" };

function createEditor(user) {
  if (!user) {
    return {
      idUsuario: null,
      nombreUsuario: "",
      usuario: "",
      correo: "",
      telefono: "",
      activo: true,
      idRol: null,
      imagen: null,
    };
  }

  return {
    idUsuario: user.idUsuario,
    nombreUsuario: user.nombreUsuario || "",
    usuario: user.usuario || "",
    correo: user.correo || "",
    telefono: user.telefono || "",
    activo: user.activo !== false,
    idRol: user.idRol ?? null,
    imagen: user.imagen || null,
  };
}

function editorSnapshot(editor) {
  return JSON.stringify({
    nombreUsuario: safeTrim(editor.nombreUsuario),
    usuario: safeTrim(editor.usuario),
    correo: safeTrim(editor.correo),
    telefono: safeTrim(editor.telefono),
    activo: editor.activo !== false,
    idRol: editor.idRol ?? null,
  });
}

function parseApiError(error, fallback) {
  return error?.message || fallback || "No se pudo completar la accion.";
}

const AjustesUsuarios = forwardRef(function AjustesUsuarios(_, ref) {
  const toast = useRef(null);
  const session = readAuthSession();
  const { updateSession } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [mutatingStatus, setMutatingStatus] = useState(false);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(emptyFilters);

  const [editor, setEditor] = useState(createEditor(null));
  const [initialEditorSnapshot, setInitialEditorSnapshot] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [createVisible, setCreateVisible] = useState(false);
  const [detailUser, setDetailUser] = useState(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [passwordUser, setPasswordUser] = useState(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const showToast = useCallback((severity, summary, detail) => {
    toast.current?.show({ severity, summary, detail, life: 2800 });
  }, []);

  const selectedUser = useMemo(
    () => usuarios.find((user) => user.idUsuario === selectedUserId) || null,
    [selectedUserId, usuarios]
  );

  const selectedRole = useMemo(
    () => roles.find((role) => Number(role.idRol) === Number(editor.idRol)) || null,
    [editor.idRol, roles]
  );

  const detailRole = useMemo(
    () => roles.find((role) => Number(role.idRol) === Number(detailUser?.idRol)) || null,
    [detailUser?.idRol, roles]
  );

  const dirty = useMemo(
    () => Boolean(imageFile) || Boolean(initialEditorSnapshot && editorSnapshot(editor) !== initialEditorSnapshot),
    [editor, imageFile, initialEditorSnapshot]
  );

  const stats = useMemo(
    () => ({
      total: usuarios.length,
      activos: usuarios.filter((user) => user.activo).length,
      inactivos: usuarios.filter((user) => !user.activo).length,
      roles: roles.length,
      sinRol: usuarios.filter((user) => !user.idRol).length,
    }),
    [roles.length, usuarios]
  );

  const canResetPasswords = useMemo(() => {
    const role = safeTrim(session?.rol).toLowerCase();
    return role.includes("admin");
  }, [session?.rol]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return usuarios.filter((user) => {
      const roleName = getRoleName(roles, user.idRol, user.rolNombre || "");
      const matchesSearch = !query || userSearchText(user, roleName).includes(query);
      const matchesEstado =
        filters.estado === "TODOS" ||
        (filters.estado === "ACTIVOS" && user.activo) ||
        (filters.estado === "INACTIVOS" && !user.activo);
      const matchesRol =
        filters.rol === "TODOS" ||
        (filters.rol === "SIN_ROL" && !user.idRol) ||
        Number(filters.rol) === Number(user.idRol);
      const matchesContacto =
        filters.contacto === "TODOS" ||
        (filters.contacto === "CON_CORREO" && Boolean(safeTrim(user.correo))) ||
        (filters.contacto === "SIN_CORREO" && !safeTrim(user.correo)) ||
        (filters.contacto === "CON_TELEFONO" && Boolean(safeTrim(user.telefono))) ||
        (filters.contacto === "SIN_TELEFONO" && !safeTrim(user.telefono));

      return matchesSearch && matchesEstado && matchesRol && matchesContacto;
    });
  }, [filters, roles, search, usuarios]);

  const syncEditor = useCallback((user) => {
    const nextEditor = createEditor(user);
    setEditor(nextEditor);
    setInitialEditorSnapshot(editorSnapshot(nextEditor));
    setImageFile(null);
    setImagePreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const ensureSelection = useCallback((list, preferredId) => {
    if (!list.length) {
      setSelectedUserId(null);
      syncEditor(null);
      return;
    }

    const currentUser = list.find((user) => user.idUsuario === preferredId);
    const sessionUser = list.find(
      (user) => safeTrim(user.usuario).toLowerCase() === safeTrim(session?.usuario).toLowerCase()
    );
    const next = currentUser || sessionUser || list[0];
    setSelectedUserId(next.idUsuario);
    syncEditor(next);
  }, [session?.usuario, syncEditor]);

  const loadAll = useCallback(
    async (preferredId = selectedUserId) => {
      setLoading(true);
      setLoadError("");

      try {
        const [usuariosData, rolesData, permisosData] = await Promise.all([
          api.fetchApi({}, "GET", undefined, endpoints.usuarios).then((res) =>
            readPayload(res, "No se pudo cargar usuarios.")
          ),
          api.fetchApi({}, "GET", undefined, endpoints.roles).then((res) =>
            readPayload(res, "No se pudo cargar roles.")
          ),
          api.fetchApi({}, "GET", undefined, endpoints.permisos).then((res) =>
            readPayload(res, "No se pudo cargar permisos.")
          ),
        ]);

        const permisos = (Array.isArray(permisosData) ? permisosData : []).map((item) =>
          normalizePermiso(item)
        );
        const catalogMap = new Map(
          permisos
            .filter((permission) => permission.idPermiso != null)
            .map((permission) => [Number(permission.idPermiso), permission])
        );
        const nextRoles = (Array.isArray(rolesData) ? rolesData : [])
          .map((role) => normalizeRole(role, catalogMap))
          .filter((role) => role.idRol != null);
        const nextUsers = (Array.isArray(usuariosData) ? usuariosData : [])
          .map(normalizeUsuario)
          .filter((user) => user.idUsuario != null);

        setRoles(nextRoles);
        setUsuarios(nextUsers);
        ensureSelection(nextUsers, preferredId);

        const currentUser = nextUsers.find(
          (user) =>
            Number(user.idUsuario) === Number(session?.idUsuario) ||
            safeTrim(user.usuario).toLowerCase() === safeTrim(session?.usuario).toLowerCase()
        );

        if (currentUser) {
          updateSession({
            idUsuario: currentUser.idUsuario,
            nombreUsuario: currentUser.nombreUsuario,
            correo: currentUser.correo,
            telefono: currentUser.telefono,
            rol: getRoleName(nextRoles, currentUser.idRol, currentUser.rolNombre || session?.rol),
            avatarUrl: currentUser.raw?.avatarUrl || currentUser.imagen || session?.avatarUrl || null,
          });
        }
      } catch (error) {
        console.error("Error cargando usuarios:", error);
        const message = parseApiError(error, "No se pudo cargar usuarios.");
        setLoadError(message);
        showToast("error", "Usuarios", message);
      } finally {
        setLoading(false);
      }
    },
    [ensureSelection, selectedUserId, session, showToast, updateSession]
  );

  useImperativeHandle(
    ref,
    () => ({
      refresh: () => loadAll(selectedUserId),
    }),
    [loadAll, selectedUserId]
  );

  useEffect(() => {
    loadAll(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  useEffect(() => {
    if (!selectedUserId && usuarios.length) {
      ensureSelection(usuarios, null);
    }
  }, [ensureSelection, selectedUserId, usuarios]);

  const selectUser = (user) => {
    if (!user) return;
    setSelectedUserId(user.idUsuario);
    syncEditor(user);
  };

  const openDetail = (user) => {
    if (!user) return;
    selectUser(user);
    setDetailUser(user);
  };

  const openEdit = (user) => {
    if (!user) return;
    selectUser(user);
    setEditorVisible(true);
  };

  const updateEditor = (patch) => {
    setEditor((prev) => ({ ...prev, ...patch }));
  };

  const changeImage = (file, error) => {
    if (error) {
      showToast("warn", "Imagen", error);
      return;
    }
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });
  };

  const performSave = async () => {
    if (!selectedUser?.idUsuario || saving) return;

    const valid = validateUserEditor(editor);
    if (valid.message) {
      showToast("warn", "Usuarios", valid.message);
      return;
    }

    setSaving(true);
    try {
      const avatarUrl = imageFile ? await fileToDataUrl(imageFile) : null;
      const body = {
        nombreUsuario: valid.nombre,
        usuario: valid.usuario,
        correo: valid.correo,
        telefono: valid.telefono,
        rol: { idRol: Number(editor.idRol) },
        activo: editor.activo ? 1 : 0,
        estatus: editor.activo !== false,
      };

      if (avatarUrl) {
        body.avatarUrl = avatarUrl;
      }

      const response = await api.fetchApi(
        {},
        "PUT",
        body,
        `${resolveUsuariosURL().replace(/\/+$/, "")}/${selectedUser.idUsuario}`
      );
      await readPayload(response, "No se pudo guardar el usuario.");

      showToast("success", "Usuarios", "Usuario actualizado.");
      await loadAll(selectedUser.idUsuario);
      setEditorVisible(false);
    } catch (error) {
      console.error("Error guardando usuario:", error);
      showToast("error", "Usuarios", parseApiError(error, "No se pudo guardar."));
    } finally {
      setSaving(false);
    }
  };

  const requestSave = () => {
    if (!dirty) return;
    if (selectedUser?.activo !== editor.activo) {
      confirmDialog({
        header: editor.activo ? "Reactivar usuario" : "Desactivar usuario",
        message: editor.activo
          ? "El usuario volvera a poder operar el sistema."
          : "El usuario no podra entrar ni operar el sistema hasta reactivarlo.",
        icon: "pi pi-exclamation-triangle",
        className: "au-confirm-dialog",
        acceptClassName: "au-primary-btn",
        rejectClassName: "au-text-btn",
        acceptLabel: editor.activo ? "Reactivar" : "Desactivar",
        rejectLabel: "Cancelar",
        accept: performSave,
      });
      return;
    }

    performSave();
  };

  const toggleStatus = (user) => {
    if (!user || mutatingStatus || isCurrentSessionUser(user, session)) return;
    const nextActive = !user.activo;

    confirmDialog({
      header: nextActive ? "Reactivar usuario" : "Desactivar usuario",
      message: nextActive
        ? `${user.nombreUsuario} volvera a estar disponible para operar.`
        : `${user.nombreUsuario} no podra entrar ni operar el sistema.`,
      icon: "pi pi-exclamation-triangle",
      className: "au-confirm-dialog",
      acceptClassName: "au-primary-btn",
      rejectClassName: "au-text-btn",
      acceptLabel: nextActive ? "Reactivar" : "Desactivar",
      rejectLabel: "Cancelar",
      accept: async () => {
        setMutatingStatus(true);
        try {
          const response = await api.fetchApi(
            {},
            "PUT",
            undefined,
            resolveUsuarioStatusURL(user.idUsuario, nextActive)
          );
          await readPayload(response, "No se pudo cambiar el estado.");
          showToast("success", "Usuarios", nextActive ? "Usuario reactivado." : "Usuario desactivado.");
          await loadAll(user.idUsuario);
        } catch (error) {
          console.error("Error cambiando estado:", error);
          showToast("error", "Usuarios", parseApiError(error, "No se pudo cambiar el estado."));
        } finally {
          setMutatingStatus(false);
        }
      },
    });
  };

  const openPassword = (user) => {
    if (!canResetPasswords) {
      showToast(
        "warn",
        "Password",
        "Solo un administrador puede restablecer passwords temporales."
      );
      return;
    }
    setPasswordError("");
    setPasswordUser(user);
  };

  const submitPassword = async (password) => {
    if (!passwordUser?.idUsuario) return;
    setPasswordSaving(true);
    setPasswordError("");

    try {
      const keyResponse = await api.fetchApi({}, "GET", undefined, endpoints.authPublicKey);
      const keyPayload = await readPayload(keyResponse, "No se pudo obtener la llave publica.");
      const encryptedPassword = await encryptRSAOAEPToBase64(keyPayload, password);

      const response = await api.fetchApi(
        {},
        "PUT",
        { password: encryptedPassword },
        resolveUsuarioPasswordURL(passwordUser.idUsuario)
      );
      await readPayload(response, "No se pudo actualizar password.");

      await loadAll(passwordUser.idUsuario);
      showToast("success", "Usuarios", "Password temporal aplicada.");
      return true;
    } catch (error) {
      console.error("Error actualizando password:", error);
      const message = parseApiError(error, "No se pudo actualizar password.");
      setPasswordError(message);
      showToast("error", "Usuarios", message);
      return false;
    } finally {
      setPasswordSaving(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setFilters(emptyFilters);
  };

  const updateFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="au-wrap">
      <Toast ref={toast} className="au-toast" />
      <ConfirmDialog draggable={false} />

      <UsuariosSummary stats={stats} loading={loading && !usuarios.length} />

      <UsuariosFilters
        search={search}
        filters={filters}
        roles={roles}
        loading={loading}
        onSearchChange={setSearch}
        onFilterChange={updateFilter}
        onClear={clearFilters}
        onCreate={() => setCreateVisible(true)}
      />

      <section className="au-workspace">
        <UsuariosTable
          users={filteredUsers}
          roles={roles}
          loading={loading || mutatingStatus || saving}
          error={loadError}
          selectedId={selectedUserId}
          onRetry={() => loadAll(selectedUserId)}
          onView={openDetail}
          onEdit={openEdit}
          onPassword={openPassword}
          canResetPasswords={canResetPasswords}
          onToggleStatus={toggleStatus}
        />
      </section>

      <AjustesUsuariosCrear
        visible={createVisible}
        onHide={() => setCreateVisible(false)}
        onCreated={async (created) => {
          await loadAll(created?.idUsuario || null);
        }}
      />

      <UsuarioPasswordModal
        visible={Boolean(passwordUser)}
        user={passwordUser}
        saving={passwordSaving}
        error={passwordError}
        onHide={() => {
          if (!passwordSaving) setPasswordUser(null);
        }}
        onSubmit={submitPassword}
      />

      <UsuarioDetailModal
        visible={Boolean(detailUser)}
        user={detailUser}
        role={detailRole}
        roles={roles}
        onHide={() => setDetailUser(null)}
      />

      <Dialog
        header="Editar usuario"
        visible={editorVisible}
        onHide={() => setEditorVisible(false)}
        modal
        draggable={false}
        dismissableMask
        className="au-dialog au-editor-dialog"
        style={{ width: "82rem", maxWidth: "96vw" }}
      >
        <UsuarioEditorPanel
          user={selectedUser}
          editor={editor}
          roles={roles}
          selectedRole={selectedRole}
          loading={loading}
          saving={saving}
          dirty={dirty}
          imagePreview={imagePreview}
          onChange={updateEditor}
          onImageChange={changeImage}
          onSave={requestSave}
          onPassword={openPassword}
          canResetPasswords={canResetPasswords}
          onToggleStatus={toggleStatus}
        />
      </Dialog>
    </div>
  );
});

export default AjustesUsuarios;
