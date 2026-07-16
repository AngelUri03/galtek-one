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
import { Toast } from "primereact/toast";

import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";
import RolDetailModal from "./Roles/RolDetailModal";
import RolEditModal from "./Roles/RolEditModal";
import RolPermissionsModal from "./Roles/RolPermissionsModal";
import RolesFilters from "./Roles/RolesFilters";
import RolesSummary from "./Roles/RolesSummary";
import RolesTable from "./Roles/RolesTable";
import {
  filterRoles,
  isProtectedRole,
  moduleOptionsFromPermissions,
  normalizePermiso,
  normalizeRole,
  readPayload,
  summarizeRoles,
  validateRoleEditor,
} from "./Roles/rolesUtils";

import "../../style/components/Configuracion/AjustesRoles.css";

const api = new APIfetchApi();
const emptyFilters = { estado: "TODOS", tipo: "TODOS", modulo: "TODOS" };

const confirmCopy = (title, text) => (
  <div className="ar-confirm-copy">
    <strong>{title}</strong>
    <span>{text}</span>
  </div>
);

const AjustesRoles = forwardRef(function AjustesRoles(_, ref) {
  const toast = useRef(null);

  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(emptyFilters);

  const [createVisible, setCreateVisible] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [detailRole, setDetailRole] = useState(null);
  const [permissionsRole, setPermissionsRole] = useState(null);

  const showToast = useCallback((severity, summary, detail) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  }, []);

  const stats = useMemo(() => summarizeRoles(roles, permisos), [permisos, roles]);
  const moduleOptions = useMemo(() => moduleOptionsFromPermissions(permisos), [permisos]);
  const filteredRoles = useMemo(
    () => filterRoles(roles, search, filters),
    [filters, roles, search]
  );

  const loadAll = useCallback(
    async (preferredId = selectedRoleId) => {
      setLoading(true);
      setLoadError("");

      try {
        const [permisosData, rolesData] = await Promise.all([
          api.fetchApi({}, "GET", undefined, endpoints.permisos).then((response) =>
            readPayload(response, "No se pudo cargar permisos.")
          ),
          api.fetchApi({}, "GET", undefined, endpoints.roles).then((response) =>
            readPayload(response, "No se pudo cargar roles.")
          ),
        ]);

        const nextPermisos = (Array.isArray(permisosData) ? permisosData : [])
          .map((permission) => normalizePermiso(permission))
          .filter((permission) => permission.idPermiso != null);
        const catalogMap = new Map(nextPermisos.map((permission) => [Number(permission.idPermiso), permission]));
        const nextRoles = (Array.isArray(rolesData) ? rolesData : [])
          .map((role) => normalizeRole(role, catalogMap))
          .filter((role) => role.idRol != null);

        setPermisos(nextPermisos);
        setRoles(nextRoles);

        const preferred =
          nextRoles.find((role) => Number(role.idRol) === Number(preferredId)) ||
          nextRoles.find((role) => Number(role.idRol) === Number(selectedRoleId)) ||
          nextRoles[0] ||
          null;
        setSelectedRoleId(preferred?.idRol ?? null);
      } catch (error) {
        console.error("Error cargando roles:", error);
        const message = error?.message || "No se pudo cargar roles.";
        setLoadError(message);
        showToast("error", "Roles", message);
      } finally {
        setLoading(false);
      }
    },
    [selectedRoleId, showToast]
  );

  useImperativeHandle(
    ref,
    () => ({
      refresh: () => loadAll(selectedRoleId),
    }),
    [loadAll, selectedRoleId]
  );

  useEffect(() => {
    loadAll(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setSearch("");
    setFilters(emptyFilters);
  };

  const openDetail = (role) => {
    setSelectedRoleId(role?.idRol ?? null);
    setDetailRole(role);
  };

  const openEdit = (role) => {
    if (isProtectedRole(role)) {
      setSelectedRoleId(role?.idRol ?? null);
      setDetailRole(role);
      showToast("info", "Roles", "El rol Administrador es protegido y solo puede consultarse.");
      return;
    }
    setSelectedRoleId(role?.idRol ?? null);
    setEditRole(role);
  };

  const openPermissions = (role) => {
    setSelectedRoleId(role?.idRol ?? null);
    setPermissionsRole(role);
  };

  const saveRole = async (editor) => {
    if (saving || deleting) return false;
    if (editor?.idRol) {
      const currentRole = roles.find((role) => Number(role.idRol) === Number(editor.idRol));
      if (isProtectedRole(currentRole)) {
        showToast("warn", "Roles", "El rol Administrador es protegido y no puede modificarse.");
        return false;
      }
    }

    const validation = validateRoleEditor(editor, roles);
    if (validation.message) {
      showToast("warn", "Roles", validation.message);
      return false;
    }

    setSaving(true);
    try {
      const isNew = !editor.idRol;
      const response = await api.fetchApi(
        {},
        isNew ? "POST" : "PUT",
        { nombreRol: validation.nombreRol, estatus: validation.estatus },
        isNew ? endpoints.roles : `${endpoints.roles}/${editor.idRol}`
      );
      const payload = await readPayload(response, "No se pudo guardar el rol.");

      let nextId = payload?.idRol ?? editor.idRol ?? null;
      if (!nextId && isNew) {
        const refreshed = await api.fetchApi({}, "GET", undefined, endpoints.roles).then((res) =>
          readPayload(res, "No se pudo confirmar el rol creado.")
        );
        const found = (Array.isArray(refreshed) ? refreshed : []).find(
          (role) => String(role?.nombreRol || "").toLowerCase() === validation.nombreRol.toLowerCase()
        );
        nextId = found?.idRol ?? null;
      }

      showToast("success", "Roles", isNew ? "Rol creado." : "Rol actualizado.");
      await loadAll(nextId);
      return true;
    } catch (error) {
      console.error("Error guardando rol:", error);
      showToast("error", "Roles", error?.message || "No se pudo guardar el rol.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const savePermissions = async (role, selectedIds) => {
    if (!role?.idRol || saving || deleting) return false;
    if (isProtectedRole(role)) {
      showToast("warn", "Roles", "El rol Administrador es critico. Sus permisos no pueden modificarse.");
      return false;
    }

    setSaving(true);
    try {
      const response = await api.fetchApi(
        {},
        "PUT",
        { permisos: Array.from(selectedIds || []) },
        `${endpoints.rolesPermisos}/${role.idRol}`
      );
      await readPayload(response, "No se pudieron guardar permisos.");
      showToast("success", "Roles", "Permisos actualizados.");
      await loadAll(role.idRol);
      return true;
    } catch (error) {
      console.error("Error guardando permisos:", error);
      showToast("error", "Roles", error?.message || "No se pudieron guardar permisos.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = (role) => {
    if (!role || saving || deleting) return;
    if (isProtectedRole(role)) {
      showToast("warn", "Roles", "El rol Administrador es protegido y no se puede desactivar.");
      return;
    }

    const nextActive = !role.activo;
    confirmDialog({
      header: nextActive ? "Reactivar rol" : "Desactivar rol",
      message: confirmCopy(
        nextActive ? "El rol volvera a estar disponible." : "El rol quedara fuera de operacion.",
        "Los permisos no se borran. Si hay usuarios con este rol, su acceso operativo puede cambiar."
      ),
      icon: "pi pi-exclamation-triangle",
      className: "ar-confirm-dialog",
      acceptClassName: "ar-primary-btn",
      rejectClassName: "ar-text-btn",
      acceptLabel: nextActive ? "Reactivar" : "Desactivar",
      rejectLabel: "Cancelar",
      accept: async () => {
        setSaving(true);
        try {
          const response = await api.fetchApi(
            {},
            "PUT",
            { nombreRol: role.nombreRol, estatus: nextActive },
            `${endpoints.roles}/${role.idRol}`
          );
          await readPayload(response, "No se pudo cambiar el estado.");
          showToast("success", "Roles", nextActive ? "Rol reactivado." : "Rol desactivado.");
          await loadAll(role.idRol);
        } catch (error) {
          console.error("Error cambiando estado de rol:", error);
          showToast("error", "Roles", error?.message || "No se pudo cambiar el estado.");
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const deleteRole = (role) => {
    if (!role?.idRol || saving || deleting) return;
    if (isProtectedRole(role)) {
      showToast("warn", "Roles", "El rol Administrador es protegido y no se puede eliminar.");
      return;
    }

    confirmDialog({
      header: "Eliminar rol",
      message: confirmCopy(
        `Eliminar ${role.nombreRol || "este rol"}`,
        "Si hay usuarios asignados, el servidor bloqueara la eliminacion. Puedes desactivarlo si ya no se usara."
      ),
      icon: "pi pi-exclamation-triangle",
      className: "ar-confirm-dialog",
      acceptClassName: "ar-primary-btn",
      rejectClassName: "ar-text-btn",
      acceptLabel: "Eliminar",
      rejectLabel: "Cancelar",
      accept: async () => {
        setDeleting(true);
        try {
          const response = await api.fetchApi({}, "DELETE", undefined, `${endpoints.roles}/${role.idRol}`);
          await readPayload(response, "No se pudo eliminar el rol.");
          showToast("success", "Roles", "Rol eliminado.");
          await loadAll(null);
        } catch (error) {
          console.error("Error eliminando rol:", error);
          const message = String(error?.message || "");
          showToast(
            "error",
            "Roles",
            message.includes("usuarios")
              ? "No se puede eliminar porque hay usuarios asignados a este rol. Puedes desactivarlo si ya no se usara."
              : message || "No se pudo eliminar el rol."
          );
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  return (
    <div className="ar-wrap">
      <Toast ref={toast} className="ar-toast" />
      <ConfirmDialog draggable={false} />

      <RolesSummary stats={stats} loading={loading && !roles.length} />

      <RolesFilters
        search={search}
        filters={filters}
        moduleOptions={moduleOptions}
        loading={loading}
        onSearchChange={setSearch}
        onFilterChange={updateFilter}
        onClear={clearFilters}
        onCreate={() => setCreateVisible(true)}
      />

      <section className="ar-workspace">
        <RolesTable
          roles={filteredRoles}
          loading={loading || saving || deleting}
          error={loadError}
          selectedId={selectedRoleId}
          onRetry={() => loadAll(selectedRoleId)}
          onView={openDetail}
          onEdit={openEdit}
          onPermissions={openPermissions}
          onToggleStatus={toggleStatus}
          onDelete={deleteRole}
        />
      </section>

      <RolEditModal
        visible={createVisible}
        role={null}
        roles={roles}
        saving={saving}
        onHide={() => setCreateVisible(false)}
        onSave={saveRole}
      />

      <RolEditModal
        visible={Boolean(editRole)}
        role={editRole}
        roles={roles}
        saving={saving}
        onHide={() => setEditRole(null)}
        onSave={saveRole}
      />

      <RolPermissionsModal
        visible={Boolean(permissionsRole)}
        role={permissionsRole}
        permisos={permisos}
        saving={saving}
        onHide={() => setPermissionsRole(null)}
        onSave={savePermissions}
      />

      <RolDetailModal
        visible={Boolean(detailRole)}
        role={detailRole}
        onHide={() => setDetailRole(null)}
      />
    </div>
  );
});

export default AjustesRoles;
