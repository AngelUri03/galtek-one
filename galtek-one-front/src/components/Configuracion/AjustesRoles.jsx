import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { ToggleButton } from "primereact/togglebutton";
import { Tree } from "primereact/tree";
import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";

import "../../style/components/Configuracion/AjustesRoles.css";

const api = new APIfetchApi();

const groupBy = (arr, keyFn) =>
  arr.reduce((acc, item) => {
    const k = keyFn(item);
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});

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
  idEmpresa: r?.idEmpresa ?? r?.id_empresa ?? null,
  permisos: Array.isArray(r?.permisos) ? r.permisos.map(normalizePerm) : [],
});

function guessDefaultRolePayload() {
  return {
    idRol: null,
    nombreRol: "",
    activo: true,
    permisos: new Set(),
  };
}

function toneFromAccion(accion) {
  const a = (accion || "").toUpperCase();
  if (a === "VER") return "ver";
  if (a === "COBRAR") return "cobrar";
  if (a === "CANCELAR") return "cancelar";
  if (a === "DEVOLUCION") return "devolucion";
  if (a === "DESCUENTO") return "descuento";
  if (a === "PRECIO_MANUAL") return "precio_manual";
  if (a === "IMPRIMIR_TICKET") return "imprimir";
  if (a === "REIMPRIMIR_TICKET") return "reimprimir";
  if (a === "AJUSTAR") return "ajustar";
  if (a === "MOVIMIENTOS") return "movimientos";
  if (a === "KARDEX") return "kardex";
  if (a === "CREAR") return "crear";
  if (a === "EDITAR") return "editar";
  if (a === "ELIMINAR") return "eliminar";
  if (a === "PRECIO_EDITAR") return "precio_editar";
  if (a === "COSTO_VER") return "costo_ver";
  if (a === "COSTO_EDITAR") return "costo_editar";
  if (a === "EXPORTAR") return "exportar";
  if (a === "RESET_PASSWORD") return "reset_password";
  return "otro";
}

const MODULE_ICON = {
  AUDITORIA: "pi pi-shield",
  CATEGORIAS: "pi pi-tags",
  CLIENTES: "pi pi-users",
  COMPRAS: "pi pi-shopping-cart",
  CONFIGURACION: "pi pi-cog",
  GRAFICAS: "pi pi-chart-line",
  INVENTARIO: "pi pi-box",
  PRODUCTOS: "pi pi-qrcode",
  PROVEEDORES: "pi pi-truck",
  REPORTES: "pi pi-file",
  ROLES: "pi pi-id-card",
  TIENDA: "pi pi-shop",
  UNIDADES: "pi pi-sliders-h",
  USUARIOS: "pi pi-user",
  VENTAS: "pi pi-wallet",
};

const ACTION_ICON = {
  AJUSTAR: "pi pi-sliders-h",
  CANCELAR: "pi pi-times-circle",
  COBRAR: "pi pi-credit-card",
  COSTO_EDITAR: "pi pi-pencil",
  COSTO_VER: "pi pi-eye",
  CREAR: "pi pi-plus-circle",
  DESCUENTO: "pi pi-percentage",
  DEVOLUCION: "pi pi-replay",
  EDITAR: "pi pi-pencil",
  ELIMINAR: "pi pi-trash",
  EXPORTAR: "pi pi-upload",
  IMPRIMIR_TICKET: "pi pi-print",
  KARDEX: "pi pi-book",
  MOVIMIENTOS: "pi pi-arrows-v",
  PRECIO_EDITAR: "pi pi-pencil",
  PRECIO_MANUAL: "pi pi-dollar",
  REIMPRIMIR_TICKET: "pi pi-print",
  RESET_PASSWORD: "pi pi-key",
  VER: "pi pi-eye",
};

const isCheckedVal = (v) => v === true || v?.checked === true;
const isPartialVal = (v) => v?.partialChecked === true;

const AjustesRoles = forwardRef(function AjustesRoles(_, ref) {
  const toast = useRef(null);

  const [loading, setLoading] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [savingPerms, setSavingPerms] = useState(false);

  const [q, setQ] = useState("");
  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);

  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [editor, setEditor] = useState(guessDefaultRolePayload());

  const [selectionKeys, setSelectionKeys] = useState({});
  const [expandedKeys, setExpandedKeys] = useState({});
  const [permSearch, setPermSearch] = useState("");

  const [collapsingKeys, setCollapsingKeys] = useState({});
  const collapseTimersRef = useRef({});

  const filteredRoles = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return roles;
    return roles.filter((r) => (r.nombreRol || "").toLowerCase().includes(qq));
  }, [q, roles]);

  const pickedCount = useMemo(
    () => editor.permisos?.size || 0,
    [editor.permisos]
  );

  // ===========================
  // API
  // ===========================
  const fetchPermisos = async () => {
    const res = await api.fetchApi(null, "GET", null, endpoints.permisos);
    if (!res) throw new Error("Sin respuesta permisos");
    if (!res.ok) throw new Error("Permisos no ok");
    const json = await res.json();
    const list = Array.isArray(json?.data) ? json.data : [];
    const norm = list.map(normalizePerm);
    setPermisos(norm);
    return norm;
  };

  const fetchRoles = async () => {
    const res = await api.fetchApi(null, "GET", null, endpoints.roles);
    if (!res) throw new Error("Sin respuesta roles");
    if (!res.ok) throw new Error("Roles no ok");
    const json = await res.json();
    const list = Array.isArray(json?.data) ? json.data : [];
    const norm = list.map(normalizeRole);
    setRoles(norm);
    return norm;
  };

  const loadAll = async (keepRoleId) => {
    setLoading(true);
    try {
      await Promise.all([fetchPermisos(), fetchRoles()]);
      setSelectedRoleId((prev) => keepRoleId ?? prev ?? null);
    } catch (err) {
      console.error(err);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar Roles/Permisos.",
        life: 2500,
      });
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    refresh: async () => {
      const keep = selectedRoleId;
      await loadAll(keep);
    },
  }));

  useEffect(() => {
    loadAll();
  }, []);

  const permIdByClave = useMemo(() => {
    const m = new Map();
    (permisos || []).forEach((p) => {
      if (p?.clave) m.set(p.clave, Number(p.idPermiso));
    });
    return m;
  }, [permisos]);

  // ===========================
  // Tree nodes base
  // ===========================
  const permisosByModulo = useMemo(() => {
    const list = permisos || [];
    const groups = groupBy(list, (p) => p.modulo || "GENERAL");
    return Object.entries(groups)
      .map(([modulo, items]) => ({
        modulo,
        items: items.sort((a, b) =>
          (a.nombre || "").localeCompare(b.nombre || "")
        ),
      }))
      .sort((a, b) => a.modulo.localeCompare(b.modulo));
  }, [permisos]);

  const baseTreeNodes = useMemo(() => {
    return permisosByModulo.map((g) => ({
      key: `mod:${g.modulo}`,
      label: g.modulo,
      data: { type: "mod", modulo: g.modulo },
      children: g.items.map((p) => ({
        key: `perm:${p.clave}`,
        label: p.nombre,
        data: {
          type: "perm",
          clave: p.clave,
          accion: p.accion,
          descripcion: p.descripcion,
          modulo: p.modulo,
          tone: toneFromAccion(p.accion),
        },
      })),
    }));
  }, [permisosByModulo]);

  const filteredBaseNodes = useMemo(() => {
    const s = permSearch.trim().toLowerCase();
    if (!s) return baseTreeNodes;

    return baseTreeNodes
      .map((mod) => {
        const children = (mod.children || []).filter((c) => {
          const name = (c.label || "").toLowerCase();
          const desc = (c.data?.descripcion || "").toLowerCase();
          const clave = (c.data?.clave || "").toLowerCase();
          const accion = (c.data?.accion || "").toLowerCase();
          return (
            name.includes(s) ||
            desc.includes(s) ||
            clave.includes(s) ||
            accion.includes(s)
          );
        });
        if (!children.length) return null;
        return { ...mod, children };
      })
      .filter(Boolean);
  }, [permSearch, baseTreeNodes]);

  // ===========================
  // Helpers
  // ===========================
  const setFromSelectionKeys = (sk) => {
    const s = new Set();
    Object.keys(sk || {}).forEach((k) => {
      if (!k.startsWith("perm:")) return;
      if (!isCheckedVal(sk[k])) return;

      const clave = k.replace("perm:", "");
      const id = permIdByClave.get(clave);
      if (id != null) s.add(id);
    });
    return s;
  };

  const buildSelectionKeysFromSet = (setPermIds, nodes) => {
    const ids = setPermIds || new Set();
    const next = {};

    (nodes || []).forEach((mod) => {
      const children = mod.children || [];
      if (!children.length) return;

      let checkedCount = 0;

      children.forEach((c) => {
        const clave = c?.data?.clave;
        const id = clave ? permIdByClave.get(clave) : null;

        if (id != null && ids.has(id)) {
          next[`perm:${clave}`] = { checked: true };
          checkedCount++;
        }
      });

      if (checkedCount === 0) return;

      if (checkedCount === children.length) {
        next[mod.key] = { checked: true };
      } else {
        next[mod.key] = { checked: false, partialChecked: true };
      }
    });

    return next;
  };

  // ===========================
  // Toggle
  // ===========================
  useEffect(() => {
    return () => {
      const timers = collapseTimersRef.current || {};
      Object.values(timers).forEach((t) => clearTimeout(t));
      collapseTimersRef.current = {};
    };
  }, []);

  const onTreeToggle = (e) => {
    const next = e.value || {};
    const prev = expandedKeys || {};

    const willCollapse = Object.keys(prev).filter((k) => prev[k] && !next[k]);

    if (!willCollapse.length) {
      setExpandedKeys(next);
      return;
    }

    setCollapsingKeys((prevC) => {
      const copy = { ...(prevC || {}) };
      willCollapse.forEach((k) => (copy[k] = true));
      return copy;
    });

    setExpandedKeys((prevE) => {
      const keepOpen = { ...(prevE || {}) };
      willCollapse.forEach((k) => (keepOpen[k] = true));
      Object.keys(next).forEach((k) => (keepOpen[k] = next[k]));
      return keepOpen;
    });

    const DURATION = 460;
    willCollapse.forEach((k) => {
      if (collapseTimersRef.current[k])
        clearTimeout(collapseTimersRef.current[k]);

      collapseTimersRef.current[k] = setTimeout(() => {
        setExpandedKeys((curr) => {
          const copy = { ...(curr || {}) };
          delete copy[k];
          return copy;
        });

        setCollapsingKeys((curr) => {
          const copy = { ...(curr || {}) };
          delete copy[k];
          return copy;
        });

        delete collapseTimersRef.current[k];
      }, DURATION);
    });
  };

  // ===========================
  // Role
  // ===========================
  useEffect(() => {
    if (!selectedRoleId) return;

    const role = roles.find((r) => r.idRol === selectedRoleId);
    if (!role) return;

    const setPerms = new Set(
      (role?.permisos || []).map((p) => Number(p?.idPermiso)).filter(Boolean)
    );

    setEditor({
      idRol: role.idRol,
      nombreRol: role.nombreRol,
      activo: role.activo ?? 1,
      permisos: setPerms,
    });

    setSelectionKeys(buildSelectionKeysFromSet(setPerms, baseTreeNodes));

    const exp = {};
    baseTreeNodes.forEach((n) => {
      const anyChecked = (n.children || []).some((c) => {
        const clave = c.data?.clave;
        const id = clave ? permIdByClave.get(clave) : null;
        return id != null && setPerms.has(id);
      });
      if (anyChecked) exp[n.key] = true;
    });
    setExpandedKeys(exp);

    setCollapsingKeys({});
  }, [selectedRoleId, roles, baseTreeNodes]);

  const onNewRole = () => {
    setSelectedRoleId(null);
    const empty = new Set();
    setEditor({ idRol: null, nombreRol: "", activo: 1, permisos: empty });
    setSelectionKeys({});
    setExpandedKeys({});
    setPermSearch("");
    setCollapsingKeys({});
  };

  const onPickRole = (r) => setSelectedRoleId(r.idRol);

  const onSelectionChange = (e) => {
    const next = e.value || {};
    setSelectionKeys(next);

    const s = setFromSelectionKeys(next);
    setEditor((prev) => ({ ...prev, permisos: s }));
  };

  const togglePermByClave = (clave) => {
    if (!clave) return;

    const id = permIdByClave.get(clave);
    if (id == null) return;

    const nextSet = new Set(editor.permisos || []);
    if (nextSet.has(id)) nextSet.delete(id);
    else nextSet.add(id);

    setEditor((prev) => ({ ...prev, permisos: nextSet }));
    setSelectionKeys(buildSelectionKeysFromSet(nextSet, baseTreeNodes));
  };

  const toggleModuloNode = (modNode) => {
    const ids = (modNode?.children || [])
      .map((c) => permIdByClave.get(c?.data?.clave))
      .filter((v) => v != null);

    if (!ids.length) return;

    const nextSet = new Set(editor.permisos || []);
    const allChecked = ids.every((id) => nextSet.has(id));

    if (allChecked) ids.forEach((id) => nextSet.delete(id));
    else ids.forEach((id) => nextSet.add(id));

    setEditor((prev) => ({ ...prev, permisos: nextSet }));
    setSelectionKeys(buildSelectionKeysFromSet(nextSet, baseTreeNodes));
  };

  const onNodeRowClick = (e, node) => {
    if (e.target.closest(".p-tree-toggler")) return;

    if (
      e.target.closest(".p-checkbox") ||
      e.target.closest(".p-checkbox-box") ||
      e.target.closest(".p-checkbox-icon")
    ) {
      return;
    }

    const isMod = node?.data?.type === "mod";
    if (isMod) toggleModuloNode(node);
    else togglePermByClave(node?.data?.clave);
  };

  const resolveNodeIcon = (node) => {
    const isMod = node?.data?.type === "mod";
    if (isMod) {
      const key = (node?.data?.modulo || node?.label || "")
        .toString()
        .trim()
        .toUpperCase();
      return MODULE_ICON[key] || "pi pi-folder";
    }
    const action = (node?.data?.accion || "").toString().trim().toUpperCase();
    return ACTION_ICON[action] || "pi pi-lock";
  };

  const decorateNodes = (nodes) =>
    (nodes || []).map((n) => {
      const st = selectionKeys?.[n.key];
      const isC = isCheckedVal(st);
      const isP = isPartialVal(st);
      const isCollapsing = !!collapsingKeys?.[n.key];

      const className = [
        "arx-treenodeContent",
        isC ? "is-checked" : "",
        isP ? "is-partial" : "",
        isCollapsing ? "is-collapsing" : "",
      ]
        .filter(Boolean)
        .join(" ");

      const children = Array.isArray(n.children)
        ? decorateNodes(n.children)
        : n.children;

      return { ...n, className, children };
    });

  const treeNodes = useMemo(
    () => decorateNodes(filteredBaseNodes),
    [filteredBaseNodes, selectionKeys, collapsingKeys]
  );

  // ===========================
  // Node template
  // ===========================
  const TreeNodeTemplate = (node) => {
    const isMod = node?.data?.type === "mod";
    const iconClass = resolveNodeIcon(node);

    if (isMod) {
      return (
        <div
          className="arx-tree-hit"
          onClick={(e) => onNodeRowClick(e, node)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onNodeRowClick(e, node);
          }}
        >
          <div className="arx-tree-node">
            <div className="arx-tree-left">
              <i className={`arx-tree-icon ${iconClass}`} />
              <span className="arx-tree-label">{node.label}</span>
            </div>

            <span className="arx-tree-count">
              {Array.isArray(node.children) ? node.children.length : 0}
            </span>
          </div>
        </div>
      );
    }

    const desc = node?.data?.descripcion || "";
    return (
      <div
        className="arx-tree-hit"
        onClick={(e) => onNodeRowClick(e, node)}
        title={desc}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onNodeRowClick(e, node);
        }}
      >
        <div className="arx-tree-node">
          <div className="arx-tree-left">
            <i className={`arx-tree-icon ${iconClass}`} />
            <div className="arx-tree-order-text">
              <div className="arx-tree-label">{node.label}</div>
              <div className="arx-tree-sublabel">
                {desc || node?.data?.clave}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const RoleCard = ({ r }) => {
    const active = r.idRol === selectedRoleId;
    const permCount = Array.isArray(r?.permisos) ? r.permisos.length : 0;

    return (
      <button
        type="button"
        className={`arx-role ${active ? "is-active" : ""}`}
        onClick={() => onPickRole(r)}
        disabled={loading || savingRole || savingPerms}
        title={r.nombreRol}
      >
        <div className="arx-role-text">
          <span className="arx-role-name">{r.nombreRol}</span>
          <span className="arx-role-meta">
            {permCount} {permCount === 1 ? "permiso" : "permisos"}
          </span>
        </div>

        <span className={`arx-role-state ${r.activo ? "is-on" : "is-off"}`}>
          {r.activo ? "Activo" : "Inactivo"}
        </span>
      </button>
    );
  };

  // ===========================
  // Guardar
  // ===========================
  const saveRole = async () => {
    if (savingRole) return;

    const nombre = (editor.nombreRol || "").trim().replace(/\s+/g, " ");
    if (!nombre) {
      toast.current?.show({
        severity: "warn",
        summary: "Falta nombre",
        detail: "Escribe el nombre del rol.",
        life: 2200,
      });
      return;
    }

    if (nombre.length < 3) {
      toast.current?.show({
        severity: "warn",
        summary: "Nombre muy corto",
        detail: "El nombre del rol debe tener al menos 3 caracteres.",
        life: 2400,
      });
      return;
    }

    const dup = roles.some((r) => {
      if (!r?.nombreRol) return false;
      if (editor.idRol && r.idRol === editor.idRol) return false;
      return r.nombreRol.trim().toLowerCase() === nombre.toLowerCase();
    });
    if (dup) {
      toast.current?.show({
        severity: "warn",
        summary: "Nombre repetido",
        detail: "Ya existe un rol con ese nombre.",
        life: 2600,
      });
      return;
    }

    setSavingRole(true);
    try {
      const isNew = !editor.idRol;

      const payload = {
        nombreRol: nombre,
        estatus: !!editor.activo,
      };

      const url = isNew
        ? endpoints.roles
        : `${endpoints.roles}/${editor.idRol}`;
      const method = isNew ? "POST" : "PUT";

      const res = await api.fetchApi(null, method, payload, url);

      if (!res || !res.ok) {
        const t = res ? await res.text().catch(() => "") : "";
        throw new Error(t ? t.substring(0, 180) : "No se pudo guardar el rol.");
      }

      const json = await res.json().catch(() => null);

      toast.current?.show({
        severity: "success",
        summary: "Listo",
        detail: isNew ? "Rol creado." : "Rol actualizado.",
        life: 1700,
      });

      const list = await fetchRoles();

      let nextId = editor.idRol;
      if (isNew) {
        nextId = json?.data?.idRol ?? null;
        if (!nextId) {
          const found = list.find(
            (x) => (x.nombreRol || "").toLowerCase() === nombre.toLowerCase()
          );
          nextId = found?.idRol ?? null;
        }
      }

      if (nextId) setSelectedRoleId(nextId);
    } catch (err) {
      console.error(err);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err?.message || "No se pudo guardar el rol.",
        life: 2600,
      });
    } finally {
      setSavingRole(false);
    }
  };

  const savePermisos = async () => {
    if (!editor.idRol) {
      toast.current?.show({
        severity: "warn",
        summary: "Primero guarda el rol",
        detail: "Necesitas un rol creado para asignar permisos.",
        life: 2400,
      });
      return;
    }
    if (savingPerms) return;

    const count = editor.permisos?.size || 0;
    if (count === 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Sin permisos",
        detail:
          "Vas a dejar el rol sin permisos. ¿Seguro? (Puedes guardar así).",
        life: 2600,
      });
    }

    setSavingPerms(true);
    try {
      const payload = {
        permisos: Array.from(editor.permisos || []),
      };

      const res = await api.fetchApi(
        null,
        "PUT",
        payload,
        `${endpoints.rolesPermisos}/${editor.idRol}`
      );

      if (!res || !res.ok) {
        const t = res ? await res.text().catch(() => "") : "";
        throw new Error(
          t ? t.substring(0, 180) : "No se pudieron guardar permisos."
        );
      }

      toast.current?.show({
        severity: "success",
        summary: "Listo",
        detail: "Permisos actualizados.",
        life: 1700,
      });

      await fetchRoles();
    } catch (err) {
      console.error(err);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err?.message || "No se pudieron guardar permisos.",
        life: 2600,
      });
    } finally {
      setSavingPerms(false);
    }
  };

  const deleteRole = async () => {
    if (!editor.idRol) return;

    if (savingRole || savingPerms) {
      toast.current?.show({
        severity: "warn",
        summary: "Espera",
        detail: "Termina el guardado antes de eliminar.",
        life: 2200,
      });
      return;
    }

    const roleName = (editor.nombreRol || "").trim() || `ID ${editor.idRol}`;

    confirmDialog({
      header: "Confirmar eliminación",
      message: (
        <div style={{ lineHeight: 1.35 }}>
          <div>
            ¿Seguro que deseas eliminar el rol <b>{roleName}</b>?
          </div>
          <div style={{ opacity: 0.8, marginTop: 6 }}>
            Esta acción no se puede deshacer.
          </div>
        </div>
      ),
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Eliminar",
      rejectLabel: "Cancelar",
      className: "arx-cdlg",
      acceptClassName: "arx-btn arx-btn--danger arx-cdlg-accept",
      rejectClassName: "arx-btn arx-btn--ghost-danger",
      accept: async () => {
        setSavingRole(true);
        try {
          const res = await api.fetchApi(
            null,
            "DELETE",
            null,
            `${endpoints.roles}/${editor.idRol}`
          );

          if (!res || !res.ok) {
            let msg = "No se pudo eliminar el rol.";
            try {
              const json = await res.json();
              msg = json?.message || json?.error || msg;
            } catch {
              const t = await res.text().catch(() => "");
              if (t) msg = t.substring(0, 180);
            }
            throw new Error(msg);
          }

          toast.current?.show({
            severity: "success",
            summary: "Eliminado",
            detail: "Rol eliminado correctamente.",
            life: 1800,
          });

          await fetchRoles();
          onNewRole();
        } catch (err) {
          console.error(err);
          toast.current?.show({
            severity: "error",
            summary: "No se pudo eliminar",
            detail: err?.message || "El rol no se pudo eliminar.",
            life: 3200,
          });
        } finally {
          setSavingRole(false);
        }
      },
    });
  };

  const hasPerms = baseTreeNodes.length > 0;
  const hasResults = treeNodes.length > 0;
  const isFiltering = permSearch.trim().length > 0;

  return (
    <div className="arx-wrap">
      <Toast ref={toast} />
      <ConfirmDialog draggable={false} className="arx-cdlg"/>
      <div className="arx-layout">
        <aside className="arx-left">
          <div className="arx-left-head">
            <div className="arx-left-title">
              Roles <span className="arx-pill">{filteredRoles.length}</span>
            </div>

            <div className="arx-left-actions">
              <Button
                icon="pi pi-plus"
                label="Nuevo"
                className="arx-btn arx-btn--primary"
                onClick={onNewRole}
                disabled={loading || savingRole || savingPerms}
                type="button"
              />
            </div>
          </div>

          <div className="arx-search">
            <i className="pi pi-search" />
            <InputText
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar rol…"
              aria-label="Buscar rol"
            />
          </div>

          <div
            className={`arx-list ${!filteredRoles.length ? "is-empty" : ""}`}
          >
            {filteredRoles.map((r) => (
              <RoleCard key={r.idRol} r={r} />
            ))}

            {!filteredRoles.length && (
              <div className="arx-empty">
                <i className="pi pi-info-circle" />
                <div>
                  <div className="arx-empty-title">Sin roles</div>
                  <div className="arx-empty-sub">
                    Crea el primero con “Nuevo”.
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        <main className="arx-right">
          <div className="arx-surface">
            <section className="arx-card arx-card--role">
              <div className="arx-card-head">
                <div className="arx-card-head-left">
                  <div className="arx-card-title">
                    {editor.idRol ? "Editar rol" : "Nuevo rol"}
                  </div>
                  <div className="arx-card-sub">
                    Configura nombre y estatus del rol.
                  </div>
                </div>

                <div className="arx-role-actions">
                  {editor.idRol ? (
                    <Button
                      icon="pi pi-trash"
                      label="Eliminar"
                      className="arx-btn arx-btn--danger"
                      onClick={(e) => {
                        deleteRole();
                        e.currentTarget.blur();
                      }}
                      disabled={loading || savingRole || savingPerms}
                      type="button"
                    />
                  ) : null}

                  <Button
                    icon="pi pi-save"
                    label="Guardar rol"
                    className="arx-btn arx-btn--primary"
                    onClick={(e) => {
                      saveRole();
                      e.currentTarget.blur();
                    }}
                    disabled={loading || savingRole}
                    type="button"
                  />
                </div>
              </div>

              <div className="arx-role-form">
                <span className="arx-field">
                  <InputText
                    id="rol_nombre"
                    value={editor.nombreRol}
                    placeholder={
                      editor.nombreRol?.length ? "" : "Nombre del rol"
                    }
                    onChange={(e) =>
                      setEditor((prev) => ({
                        ...prev,
                        nombreRol: e.target.value,
                      }))
                    }
                    disabled={loading || savingRole || savingPerms}
                  />
                </span>

                <div className="arx-toggle-wrap">
                  <div className="arx-toggle-info">
                    <div className="arx-toggle-title">Estatus</div>
                    <div className="arx-toggle-sub">
                      Habilita o deshabilita el rol.
                    </div>
                  </div>

                  <ToggleButton
                    checked={!!editor.activo}
                    onChange={(e) =>
                      setEditor((prev) => ({
                        ...prev,
                        activo: !!e.value,
                      }))
                    }
                    onLabel="Activo"
                    offLabel="Inactivo"
                    onIcon="pi pi-check"
                    offIcon="pi pi-times"
                    className="arx-toggle"
                    disabled={loading || savingRole || savingPerms}
                  />
                </div>
              </div>
            </section>

            <section className="arx-card arx-card--perms">
              <div className="arx-card-head">
                <div className="arx-card-head-left">
                  <div className="arx-card-title">Permisos</div>
                  <div className="arx-card-sub">
                    {pickedCount} {pickedCount === 1 ? "permiso" : "permisos"}{" "}
                    asignados
                  </div>
                </div>

                <div className="arx-perm-actions">
                  <Button
                    icon="pi pi-plus"
                    label="Expandir"
                    className="arx-btn arx-btn--ghost"
                    type="button"
                    disabled={loading || savingPerms || !baseTreeNodes.length}
                    onClick={(e) => {
                      const exp = {};
                      baseTreeNodes.forEach((n) => (exp[n.key] = true));
                      setExpandedKeys(exp);
                      setCollapsingKeys({});
                      e.currentTarget.blur();
                    }}
                  />
                  <Button
                    icon="pi pi-minus"
                    label="Contraer"
                    className="arx-btn arx-btn--ghost"
                    type="button"
                    disabled={loading || savingPerms || !baseTreeNodes.length}
                    onClick={(e) => {
                      setCollapsingKeys(() => {
                        const copy = {};
                        Object.keys(expandedKeys || {}).forEach((k) => {
                          if (expandedKeys?.[k]) copy[k] = true;
                        });
                        return copy;
                      });

                      const D = 340;
                      window.setTimeout(() => {
                        setExpandedKeys({});
                        setCollapsingKeys({});
                      }, D);

                      e.currentTarget.blur();
                    }}
                  />
                  <Button
                    icon="pi pi-times"
                    label="Limpiar"
                    className="arx-btn arx-btn--ghost"
                    type="button"
                    disabled={loading || savingPerms || !baseTreeNodes.length}
                    onClick={(e) => {
                      const empty = new Set();
                      setEditor((prev) => ({ ...prev, permisos: empty }));
                      setSelectionKeys({});
                      e.currentTarget.blur();
                    }}
                  />
                  <Button
                    icon="pi pi-check"
                    label="Todo"
                    className="arx-btn arx-btn--ghost"
                    type="button"
                    disabled={loading || savingPerms || !permisos.length}
                    onClick={(e) => {
                      const nextSet = new Set(
                        permisos.map((p) => Number(p.idPermiso)).filter(Boolean)
                      );
                      setEditor((prev) => ({ ...prev, permisos: nextSet }));
                      setSelectionKeys(
                        buildSelectionKeysFromSet(nextSet, baseTreeNodes)
                      );
                      e.currentTarget.blur();
                    }}
                  />

                  <Button
                    icon="pi pi-save"
                    label="Guardar"
                    className="arx-btn arx-btn--primary"
                    onClick={(e) => {
                      savePermisos();
                      e.currentTarget.blur();
                    }}
                    disabled={loading || savingPerms}
                    type="button"
                  />
                </div>
              </div>

              <div className="arx-tree-wrap">
                <div className="arx-tree-search">
                  <div className="arx-search arx-tree-searchbar">
                    <i className="pi pi-search" />
                    <InputText
                      value={permSearch}
                      onChange={(e) => setPermSearch(e.target.value)}
                      placeholder="Buscar permiso…"
                      aria-label="Buscar permiso"
                    />
                  </div>
                </div>

                {hasPerms && hasResults ? (
                  <div className="arx-tree-scroll">
                    <Tree
                      value={treeNodes}
                      selectionMode="checkbox"
                      selectionKeys={selectionKeys}
                      expandedKeys={expandedKeys}
                      onToggle={onTreeToggle}
                      onSelectionChange={onSelectionChange}
                      nodeTemplate={TreeNodeTemplate}
                      className="arx-tree"
                      disabled={loading || savingRole || savingPerms}
                    />
                  </div>
                ) : (
                  <div className="arx-tree-empty">
                    <div className="arx-empty arx-empty--wide arx-empty--fill">
                      <i
                        className={`pi ${
                          hasPerms ? "pi-search" : "pi-exclamation-triangle"
                        }`}
                      />
                      <div>
                        <div className="arx-empty-title">
                          {hasPerms ? "Sin resultados" : "Sin permisos"}
                        </div>
                        <div className="arx-empty-sub">
                          {hasPerms
                            ? isFiltering
                              ? "No hay coincidencias con tu búsqueda. Ajusta el texto para encontrar permisos."
                              : "No hay permisos para mostrar."
                            : "No se encontraron permisos. Revisa el endpoint de permisos o tu sesión."}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
});

export default AjustesRoles;
