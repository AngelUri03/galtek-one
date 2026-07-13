import React, { useEffect, useMemo, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { confirmDialog } from "primereact/confirmdialog";
import {
  OVERRIDE_RISK_OPTIONS,
  effectiveLabel,
  groupEffectivePermissions,
  hasCriticalChanges,
  moduleOptionsFromEffective,
  permissionIcon,
  riskClass,
  safeTrim,
  userAvatarContent,
} from "./overridesUtils";

function createDraft(permisos = []) {
  return permisos.reduce((acc, permission) => {
    acc[permission.idPermiso] = {
      efecto: permission.override || null,
      motivo: permission.motivo || "",
    };
    return acc;
  }, {});
}

function snapshotDraft(draft) {
  return JSON.stringify(
    Object.keys(draft || {})
      .sort((a, b) => Number(a) - Number(b))
      .map((id) => ({
        id: Number(id),
        efecto: draft[id]?.efecto || null,
        motivo: draft[id]?.motivo || "",
      }))
  );
}

function Avatar({ user }) {
  const initials = userAvatarContent(user);
  const image = user?.imagen || user?.avatarUrl;
  return (
    <span className={`uov-avatar-large ${image ? "has-image" : "has-initials"}`}>
      {image ? (
        <img src={image} alt="Avatar" />
      ) : (
        initials
      )}
    </span>
  );
}

function PermissionItem({ permission, draft, disabled, onEffectChange, onReasonChange }) {
  const current = draft?.[permission.idPermiso] || { efecto: null, motivo: "" };
  const selectedEffect = current.efecto || null;
  const hasOverride = selectedEffect === "PERMITIR" || selectedEffect === "DENEGAR";
  const effective =
    selectedEffect === "PERMITIR" || (permission.permitidoPorRol && selectedEffect !== "DENEGAR");
  const needsReason = hasOverride;
  const reasonInvalid = needsReason && safeTrim(current.motivo).length > 0 && safeTrim(current.motivo).length < 5;

  const sourceLabel =
    selectedEffect === "PERMITIR"
      ? "Agregado extra"
      : selectedEffect === "DENEGAR"
        ? "Denegado extra"
        : permission.permitidoPorRol
          ? "Heredado por rol"
          : "Sin permiso por rol";

  const action = permission.noOverrideable
    ? { value: null, label: "Solo rol", icon: "pi pi-lock", className: "is-locked", disabled: true }
    : hasOverride
      ? { value: null, label: "Heredar", icon: "pi pi-replay", className: "is-inherit" }
      : effective
        ? { value: "DENEGAR", label: "Denegar", icon: "pi pi-ban", className: "is-deny" }
        : { value: "PERMITIR", label: "Permitir", icon: "pi pi-check", className: "is-allow" };

  return (
    <article className={`uov-permission-item ${selectedEffect ? "has-override" : ""}`}>
      <div className="uov-permission-main">
        <i className={`uov-permission-icon ${permissionIcon(permission)}`} />
        <div>
          <strong>{permission.nombre || permission.clave}</strong>
          <span>{permission.descripcion || permission.clave}</span>
          <small>{permission.clave}</small>
        </div>
      </div>

      <div className="uov-permission-state">
        <span className={`uov-base-pill ${effective ? "is-on" : "is-off"}`}>{sourceLabel}</span>
        <span className={`uov-status-tag ${effective ? "is-on" : "is-off"}`}>
          {effectiveLabel(effective)}
        </span>
        <span className={`uov-risk-pill ${riskClass(permission.riesgo)}`}>{permission.riesgo}</span>
      </div>

      <button
        type="button"
        className={`uov-permission-action-btn ${action.className}`}
        onClick={() => onEffectChange(permission, action.value)}
        disabled={disabled || action.disabled}
        aria-label={`${action.label} override para ${permission.nombre || permission.clave}`}
        title={permission.noOverrideable ? "Este permiso critico solo puede administrarse desde Roles." : undefined}
      >
        <i className={action.icon} />
        <span>{action.label}</span>
      </button>

      {needsReason ? (
        <label className={`uov-reason-field ${reasonInvalid ? "is-invalid" : ""}`}>
          <span>Motivo de la excepcion</span>
          <textarea
            value={current.motivo}
            onChange={(event) => onReasonChange(permission, event.target.value)}
            placeholder="Ej. Autorizado para cubrir cierre de caja en turno vespertino."
            maxLength={500}
            disabled={disabled}
          />
          <small>{safeTrim(current.motivo).length}/500</small>
        </label>
      ) : null}
    </article>
  );
}

function PermissionGroup({ group, draft, expanded, disabled, onToggle, onEffectChange, onReasonChange }) {
  const activeCount = group.items.filter((permission) => draft?.[permission.idPermiso]?.efecto).length;
  const allowedCount = group.items.filter((permission) => {
    const effect = draft?.[permission.idPermiso]?.efecto || null;
    return effect === "PERMITIR" || (permission.permitidoPorRol && effect !== "DENEGAR");
  }).length;

  return (
    <article className={`uov-permission-group ${expanded ? "is-expanded" : ""}`}>
      <header>
        <button type="button" className="uov-permission-group-main" onClick={onToggle} aria-expanded={expanded}>
          <span className="uov-module-icon"><i className={group.icon} /></span>
          <span>
            <strong>{group.module}</strong>
            <small>{allowedCount} de {group.items.length} efectivos - {activeCount} overrides</small>
          </span>
        </button>
        <Button
          icon={expanded ? "pi pi-chevron-up" : "pi pi-chevron-down"}
          className="uov-icon-btn uov-icon-btn--small"
          onClick={onToggle}
          tooltip={expanded ? "Contraer" : "Expandir"}
          tooltipOptions={{ position: "top" }}
          aria-label={expanded ? "Contraer modulo" : "Expandir modulo"}
          type="button"
        />
      </header>
      {expanded ? (
        <div className="uov-permission-list">
          {group.items.map((permission) => (
            <PermissionItem
              key={permission.idPermiso}
              permission={permission}
              draft={draft}
              disabled={disabled}
              onEffectChange={onEffectChange}
              onReasonChange={onReasonChange}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}

export default function OverrideManagementModal({
  visible,
  user,
  detail,
  saving,
  onHide,
  onSave,
}) {
  const [draft, setDraft] = useState({});
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("TODOS");
  const [riskFilter, setRiskFilter] = useState("TODOS");
  const [expanded, setExpanded] = useState({});

  const permisos = useMemo(() => detail?.permisos || [], [detail?.permisos]);
  const protectedUser = user?.rolProtegido || detail?.usuario?.protegido;

  useEffect(() => {
    if (!visible) return;
    const next = createDraft(permisos);
    setDraft(next);
    setInitialSnapshot(snapshotDraft(next));
    setSearch("");
    setModuleFilter("TODOS");
    setRiskFilter("TODOS");
  }, [permisos, visible]);

  const moduleOptions = useMemo(() => moduleOptionsFromEffective(permisos), [permisos]);

  const groups = useMemo(() => {
    const query = safeTrim(search).toLowerCase();
    const filtered = permisos.filter((permission) => {
      const matchesSearch =
        !query ||
        [permission.nombre, permission.clave, permission.descripcion, permission.modulo, permission.accion]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesModule = moduleFilter === "TODOS" || permission.modulo === moduleFilter;
      const matchesRisk = riskFilter === "TODOS" || permission.riesgo === riskFilter;
      return matchesSearch && matchesModule && matchesRisk;
    });
    return groupEffectivePermissions(filtered);
  }, [moduleFilter, permisos, riskFilter, search]);

  useEffect(() => {
    setExpanded((prev) => {
      const next = {};
      groups.forEach((group, index) => {
        const hasOverride = group.items.some((permission) => draft?.[permission.idPermiso]?.efecto);
        next[group.module] = prev[group.module] ?? (hasOverride || index === 0);
      });
      return next;
    });
  }, [draft, groups]);

  const dirty = useMemo(
    () => Boolean(initialSnapshot && snapshotDraft(draft) !== initialSnapshot),
    [draft, initialSnapshot]
  );

  const changes = useMemo(() => {
    const initial = createDraft(permisos);
    return permisos
      .map((permission) => {
        const current = draft[permission.idPermiso] || { efecto: null, motivo: "" };
        const original = initial[permission.idPermiso] || { efecto: null, motivo: "" };
        const currentEffect = current.efecto || null;
        const originalEffect = original.efecto || null;
        const currentReason = safeTrim(current.motivo);
        const originalReason = safeTrim(original.motivo);
        if (currentEffect === originalEffect && currentReason === originalReason) return null;
        return {
          idPermiso: permission.idPermiso,
          efecto: currentEffect || "HEREDADO",
          motivo: currentEffect ? currentReason : undefined,
        };
      })
      .filter(Boolean);
  }, [draft, permisos]);

  const updateEffect = (permission, effect) => {
    if (protectedUser || saving) return;
    setDraft((prev) => ({
      ...prev,
      [permission.idPermiso]: {
        efecto: effect || null,
        motivo: effect ? prev[permission.idPermiso]?.motivo || "" : "",
      },
    }));
  };

  const updateReason = (permission, motivo) => {
    setDraft((prev) => ({
      ...prev,
      [permission.idPermiso]: {
        ...(prev[permission.idPermiso] || {}),
        motivo,
      },
    }));
  };

  const requestHide = () => {
    if (!dirty || protectedUser) {
      onHide();
      return;
    }
    confirmDialog({
      header: "Descartar cambios",
      message: "Hay cambios sin guardar en los overrides. Si continuas se perderan.",
      icon: "pi pi-exclamation-triangle",
      className: "uov-confirm-dialog",
      acceptClassName: "uov-primary-btn",
      rejectClassName: "uov-text-btn",
      acceptLabel: "Descartar",
      rejectLabel: "Cancelar",
      accept: onHide,
    });
  };

  const discardChanges = () => {
    const next = createDraft(permisos);
    setDraft(next);
    setInitialSnapshot(snapshotDraft(next));
  };

  const expandAll = () => {
    const next = {};
    groups.forEach((group) => {
      next[group.module] = true;
    });
    setExpanded(next);
  };

  const collapseAll = () => {
    const next = {};
    groups.forEach((group) => {
      next[group.module] = false;
    });
    setExpanded(next);
  };

  const submit = () => {
    if (!dirty || protectedUser || saving) return;
    const invalid = changes.find((change) => {
      if (change.efecto === "HEREDADO") return false;
      const reasonLength = safeTrim(change.motivo).length;
      return reasonLength < 5 || reasonLength > 500;
    });
    if (invalid) {
      onSave(null, "Cada permiso permitido o denegado necesita un motivo de 5 a 500 caracteres.");
      return;
    }

    const doSave = async () => {
      const ok = await onSave(changes);
      if (ok) onHide();
    };

    if (hasCriticalChanges(changes, permisos)) {
      confirmDialog({
        header: "Confirmar override critico",
        message: "Vas a cambiar excepciones sobre permisos sensibles. Revisa el motivo antes de guardar.",
        icon: "pi pi-exclamation-triangle",
        className: "uov-confirm-dialog",
        acceptClassName: "uov-primary-btn",
        rejectClassName: "uov-text-btn",
        acceptLabel: "Guardar",
        rejectLabel: "Cancelar",
        accept: doSave,
      });
      return;
    }

    doSave();
  };

  return (
    <Dialog
      header="Gestionar overrides"
      visible={visible}
      onHide={requestHide}
      modal
      draggable={false}
      dismissableMask
      className="uov-dialog uov-management-dialog"
      style={{ width: "82rem", maxWidth: "96vw" }}
    >
      <div className="uov-management-body">
        <section className="uov-management-head">
          <div className="uov-modal-hero">
            <Avatar user={user} />
            <div>
              <span className="uov-section-kicker">{protectedUser ? "Protegido" : "Overrides de usuario"}</span>
              <strong>{user?.nombreUsuario || detail?.usuario?.nombreUsuario || "Usuario"}</strong>
              <small>@{user?.usuario || detail?.usuario?.usuario || "-"} - {detail?.rol?.nombreRol || user?.nombreRol || "Sin rol"}</small>
            </div>
            <span className={`uov-status-tag ${user?.activo ? "is-on" : "is-off"}`}>
              {user?.activo ? "Activo" : "Inactivo"}
            </span>
          </div>
          <div className="uov-modal-stats">
            <article><span>Heredados</span><strong>{detail?.resumen?.permisosHeredados ?? 0}</strong></article>
            <article><span>Overrides</span><strong>{detail?.resumen?.overridesActivos ?? 0}</strong></article>
            <article><span>Cambios</span><strong>{changes.length}</strong></article>
          </div>
        </section>

        {protectedUser ? (
          <div className="uov-security-note">
            <i className="pi pi-shield" />
            <span>El Administrador es rol de recuperacion. Sus permisos se administran solo desde Roles.</span>
          </div>
        ) : null}

        <section className="uov-permissions-card">
          <div className="uov-permission-controls">
            <label className="uov-filter uov-filter--search">
              <span>Buscador</span>
              <div className="uov-search-wrap">
                <i className="pi pi-search" />
                <InputText
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar permiso, clave o accion"
                  disabled={saving}
                />
              </div>
            </label>
            <label className="uov-filter">
              <span>Modulo</span>
              <Dropdown
                value={moduleFilter}
                options={moduleOptions}
                onChange={(event) => setModuleFilter(event.value)}
                disabled={saving}
                panelClassName="uov-select-panel"
              />
            </label>
            <label className="uov-filter">
              <span>Riesgo</span>
              <Dropdown
                value={riskFilter}
                options={OVERRIDE_RISK_OPTIONS}
                onChange={(event) => setRiskFilter(event.value)}
                disabled={saving}
                panelClassName="uov-select-panel"
              />
            </label>
            <div className="uov-card-actions uov-permission-actions">
              <Button icon="pi pi-plus" className="uov-soft-btn uov-mini-action" onClick={expandAll} disabled={!groups.length} tooltip="Expandir todo" tooltipOptions={{ position: "top" }} type="button" />
              <Button icon="pi pi-minus" className="uov-soft-btn uov-mini-action" onClick={collapseAll} disabled={!groups.length} tooltip="Contraer todo" tooltipOptions={{ position: "top" }} type="button" />
            </div>
          </div>

          <div className="uov-permission-scroll">
            {groups.length ? (
              groups.map((group) => (
                <PermissionGroup
                  key={group.module}
                  group={group}
                  draft={draft}
                  expanded={expanded[group.module] === true}
                  disabled={saving || protectedUser}
                  onToggle={() =>
                    setExpanded((prev) => ({ ...prev, [group.module]: prev[group.module] !== true }))
                  }
                  onEffectChange={updateEffect}
                  onReasonChange={updateReason}
                />
              ))
            ) : (
              <div className="uov-inline-empty">
                <i className="pi pi-search" />
                <strong>Sin permisos visibles</strong>
                <span>Ajusta la busqueda, modulo o riesgo.</span>
              </div>
            )}
          </div>
        </section>

        <footer className="uov-dialog-footer">
          <Button label="Cancelar" className="uov-text-btn" onClick={requestHide} disabled={saving} type="button" />
          {dirty ? (
            <Button label="Descartar cambios" icon="pi pi-refresh" className="uov-soft-btn" onClick={discardChanges} disabled={saving} type="button" />
          ) : null}
          <Button
            label={saving ? "Guardando..." : "Guardar overrides"}
            icon={saving ? "pi pi-spin pi-spinner" : "pi pi-check"}
            className="uov-primary-btn"
            onClick={submit}
            disabled={saving || protectedUser || !dirty}
            type="button"
          />
        </footer>
      </div>
    </Dialog>
  );
}
