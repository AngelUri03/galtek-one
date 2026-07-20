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
import OverrideDetailModal from "./Overrides/OverrideDetailModal";
import OverrideManagementModal from "./Overrides/OverrideManagementModal";
import OverridesFilters from "./Overrides/OverridesFilters";
import OverridesSummary from "./Overrides/OverridesSummary";
import OverridesUsersTable from "./Overrides/OverridesUsersTable";
import {
  filterOverrideUsers,
  normalizeEffectivePayload,
  normalizeOverrideUser,
  readPayload,
  resolveEffectivePermissionsURL,
  resolveOverridesSummaryURL,
  resolveUserOverridesURL,
  roleOptionsFromUsers,
} from "./Overrides/overridesUtils";

import "../../style/components/Configuracion/AjustesOverrides.css";

const api = new APIfetchApi();
const emptyFilters = {
  scope: "TODOS",
  rol: "TODOS",
  estado: "TODOS",
  efecto: "TODOS",
};

const confirmCopy = (title, text) => (
  <div className="uov-confirm-copy">
    <strong>{title}</strong>
    <span>{text}</span>
  </div>
);

const AjustesOverrides = forwardRef(function AjustesOverrides(_, ref) {
  const toast = useRef(null);

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(emptyFilters);
  const [detailVisible, setDetailVisible] = useState(false);
  const [manageVisible, setManageVisible] = useState(false);

  const selectedUser = useMemo(
    () => users.find((user) => Number(user.idUsuario) === Number(selectedId)) || null,
    [selectedId, users]
  );

  const roleOptions = useMemo(() => roleOptionsFromUsers(users), [users]);
  const filteredUsers = useMemo(
    () => filterOverrideUsers(users, search, filters),
    [filters, search, users]
  );

  const showToast = useCallback((severity, summary, detailText) => {
    toast.current?.show({ severity, summary, detail: detailText, life: 3200 });
  }, []);

  const loadSummary = useCallback(
    async (preferredId = selectedId) => {
      setLoading(true);
      setLoadError("");
      try {
        const payload = await api
          .fetchApi({}, "GET", undefined, resolveOverridesSummaryURL())
          .then((response) => readPayload(response, "No se pudo cargar overrides."));
        const nextUsers = (Array.isArray(payload?.usuarios) ? payload.usuarios : [])
          .map(normalizeOverrideUser)
          .filter((user) => user.idUsuario != null);
        setUsers(nextUsers);
        setStats(payload?.resumen || {});

        const preferred =
          nextUsers.find((user) => Number(user.idUsuario) === Number(preferredId)) ||
          nextUsers.find((user) => user.overridesActivos > 0) ||
          nextUsers[0] ||
          null;
        setSelectedId(preferred?.idUsuario ?? null);
        return preferred;
      } catch (error) {
        console.error("Error cargando overrides:", error);
        const message = error?.message || "No se pudo cargar overrides.";
        setLoadError(message);
        showToast("error", "Overrides", message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [selectedId, showToast]
  );

  const loadDetail = useCallback(
    async (userOrId) => {
      const idUsuario = typeof userOrId === "object" ? userOrId?.idUsuario : userOrId;
      if (!idUsuario) return null;
      setSelectedId(idUsuario);
      setDetailLoading(true);
      setDetailError("");
      try {
        const payload = await api
          .fetchApi({}, "GET", undefined, resolveEffectivePermissionsURL(idUsuario))
          .then((response) => readPayload(response, "No se pudieron cargar permisos efectivos."));
        const normalized = normalizeEffectivePayload(payload);
        setDetail(normalized);
        return normalized;
      } catch (error) {
        console.error("Error cargando permisos efectivos:", error);
        const message = error?.message || "No se pudieron cargar permisos efectivos.";
        setDetailError(message);
        showToast("error", "Overrides", message);
        return null;
      } finally {
        setDetailLoading(false);
      }
    },
    [showToast]
  );

  useImperativeHandle(
    ref,
    () => ({
      refresh: async () => {
        const preferred = await loadSummary(selectedId);
        if (preferred?.idUsuario) await loadDetail(preferred.idUsuario);
      },
    }),
    [loadDetail, loadSummary, selectedId]
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      const preferred = await loadSummary(null);
      if (alive && preferred?.idUsuario) await loadDetail(preferred.idUsuario);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setSearch("");
    setFilters(emptyFilters);
  };

  const openManage = async (user) => {
    if (!user || user.rolProtegido) return;
    const currentDetail =
      Number(selectedId) === Number(user.idUsuario) && detail
        ? detail
        : await loadDetail(user.idUsuario);
    if (!currentDetail) return;
    setDetailVisible(false);
    setManageVisible(true);
  };

  const openDetail = async (user) => {
    if (!user) return;
    const currentDetail =
      Number(selectedId) === Number(user.idUsuario) && detail
        ? detail
        : await loadDetail(user.idUsuario);
    if (!currentDetail) return;
    setDetailVisible(true);
  };

  const saveOverrides = async (changes, validationMessage, targetUserId) => {
    if (validationMessage) {
      showToast("warn", "Overrides", validationMessage);
      return false;
    }
    const idUsuario = targetUserId || selectedUser?.idUsuario;
    if (!idUsuario || !Array.isArray(changes) || !changes.length) return false;

    setSaving(true);
    try {
      const payload = await api
        .fetchApi({}, "PUT", { overrides: changes }, resolveUserOverridesURL(idUsuario))
        .then((response) => readPayload(response, "No se pudieron guardar overrides."));
      const normalized = normalizeEffectivePayload(payload);
      setDetail(normalized);
      await loadSummary(idUsuario);
      showToast("success", "Overrides", "Overrides guardados.");
      return true;
    } catch (error) {
      console.error("Error guardando overrides:", error);
      showToast("error", "Overrides", error?.message || "No se pudieron guardar overrides.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const clearAllOverrides = async (user) => {
    if (!user?.idUsuario || !user.overridesActivos) return;
    const currentDetail =
      Number(selectedId) === Number(user.idUsuario) && detail
        ? detail
        : await loadDetail(user.idUsuario);
    if (!currentDetail?.overridesActivos?.length) return;

    confirmDialog({
      header: "Limpiar overrides",
      message: confirmCopy(
        "Todas las excepciones activas volveran a heredar del rol.",
        "No se borran usuarios, roles ni permisos. Solo se desactivan las excepciones puntuales."
      ),
      icon: "pi pi-exclamation-triangle",
      className: "uov-confirm-dialog",
      acceptClassName: "uov-primary-btn",
      rejectClassName: "uov-text-btn",
      acceptLabel: "Limpiar overrides",
      rejectLabel: "Cancelar",
      accept: async () => {
        const changes = currentDetail.overridesActivos.map((override) => ({
          idPermiso: override.idPermiso,
          efecto: "HEREDADO",
        }));
        await saveOverrides(changes, undefined, user.idUsuario);
      },
    });
  };

  return (
    <div className="uov-wrap">
      <Toast ref={toast} className="uov-toast" />
      <ConfirmDialog draggable={false} />

      <OverridesSummary stats={stats} loading={loading && !users.length} />

      <OverridesFilters
        search={search}
        filters={filters}
        roleOptions={roleOptions}
        loading={loading}
        onSearchChange={setSearch}
        onFilterChange={updateFilter}
        onClear={clearFilters}
      />

      <section className="uov-workspace">
        <OverridesUsersTable
          users={filteredUsers}
          loading={loading || saving}
          error={loadError}
          selectedId={selectedId}
          onRetry={async () => {
            const preferred = await loadSummary(selectedId);
            if (preferred?.idUsuario) await loadDetail(preferred.idUsuario);
          }}
          onSelect={openDetail}
          onManage={openManage}
          onClear={clearAllOverrides}
        />
      </section>

      <OverrideDetailModal
        visible={detailVisible}
        user={selectedUser}
        detail={detail}
        loading={detailLoading}
        error={detailError}
        onHide={() => setDetailVisible(false)}
        onRetry={loadDetail}
      />

      <OverrideManagementModal
        visible={manageVisible}
        user={selectedUser}
        detail={detail}
        saving={saving}
        onHide={() => setManageVisible(false)}
        onSave={saveOverrides}
      />
    </div>
  );
});

export default AjustesOverrides;
