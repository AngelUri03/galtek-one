import React, { useEffect, useMemo, useState } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import {
  actionIcon,
  groupPermissions,
  isCriticalPermission,
  moduleOptionsFromPermissions,
  permissionRiskClass,
  permissionRiskLabel,
  safeTrim,
} from "./rolesUtils";

function PermissionItem({ permission, checked, disabled, readOnly, onToggle }) {
  const blocked = disabled || readOnly;

  return (
    <button
      type="button"
      className={`ar-permission-item ${checked ? "is-selected" : ""} ${readOnly ? "is-readonly" : ""}`}
      onClick={() => {
        if (blocked) return;
        onToggle(permission);
      }}
      disabled={disabled}
      aria-disabled={readOnly}
      title={permission.descripcion || permission.clave}
    >
      <span className="ar-permission-check" aria-hidden="true">
        {checked ? <i className="pi pi-check" /> : null}
      </span>
      <i className={`ar-permission-icon ${actionIcon(permission)}`} />
      <span className="ar-permission-copy">
        <strong>{permission.nombre || permission.clave}</strong>
        <small>{permission.descripcion || permission.clave || "Sin descripcion"}</small>
      </span>
      <span className="ar-permission-meta">
        <span className={`ar-risk-tag ${permissionRiskClass(permission)}`}>{permissionRiskLabel(permission)}</span>
        <span className="ar-permission-key">{permission.clave || permission.accion || "-"}</span>
      </span>
    </button>
  );
}

function PermissionGroup({
  group,
  selectedIds,
  expanded,
  disabled,
  readOnly,
  onToggleExpanded,
  onTogglePermission,
  onSelectModule,
  onClearModule,
}) {
  const ids = group.items
    .map((permission) => Number(permission.idPermiso))
    .filter((value) => Number.isFinite(value));
  const selectedCount = ids.filter((id) => selectedIds.has(id)).length;
  const complete = ids.length > 0 && selectedCount === ids.length;
  const partial = selectedCount > 0 && !complete;
  const criticalCount = group.items.filter(isCriticalPermission).length;

  return (
    <article
      className={[
        "ar-permission-group",
        expanded ? "is-expanded" : "",
        complete ? "is-complete" : "",
        partial ? "is-partial" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header>
        <button
          type="button"
          className="ar-permission-group-main"
          onClick={onToggleExpanded}
          disabled={disabled}
          aria-expanded={expanded}
        >
          <span className="ar-permission-module-icon">
            <i className={group.icon} />
          </span>
          <span>
            <strong>{group.module}</strong>
            <small>
              {selectedCount} de {ids.length} permisos
            </small>
          </span>
        </button>

        <div className="ar-permission-group-summary">
          {criticalCount ? (
            <span
              className="ar-risk-tag is-critico"
              title={`${criticalCount} permisos sensibles en este modulo`}
            >
              {criticalCount} sensibles
            </span>
          ) : null}
          <span className="ar-chip is-muted">{selectedCount} activos</span>
        </div>

        <div className="ar-permission-group-actions">
          <Button
            icon={expanded ? "pi pi-chevron-up" : "pi pi-chevron-down"}
            className="ar-icon-btn ar-icon-btn--small"
            tooltip={expanded ? "Contraer" : "Expandir"}
            tooltipOptions={{ position: "top" }}
            aria-label={expanded ? "Contraer modulo" : "Expandir modulo"}
            onClick={onToggleExpanded}
            disabled={disabled}
            type="button"
          />
          {!readOnly ? (
            <>
              <Button
                icon="pi pi-check"
                className="ar-icon-btn ar-icon-btn--small"
                tooltip="Seleccionar modulo"
                tooltipOptions={{ position: "top" }}
                aria-label="Seleccionar modulo"
                onClick={onSelectModule}
                disabled={disabled || complete}
                type="button"
              />
              <Button
                icon="pi pi-times"
                className="ar-icon-btn ar-icon-btn--small"
                tooltip="Limpiar modulo"
                tooltipOptions={{ position: "top" }}
                aria-label="Limpiar modulo"
                onClick={onClearModule}
                disabled={disabled || selectedCount === 0}
                type="button"
              />
            </>
          ) : null}
        </div>
      </header>

      {expanded ? (
        <div className="ar-permission-list">
          {group.items.map((permission) => (
            <PermissionItem
              key={permission.idPermiso || permission.clave}
              permission={permission}
              checked={selectedIds.has(Number(permission.idPermiso))}
              disabled={disabled}
              readOnly={readOnly}
              onToggle={onTogglePermission}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}

export default function RolPermissionsPanel({
  permisos,
  selectedIds,
  disabled,
  dirty,
  readOnly = false,
  onTogglePermission,
  onSelectModule,
  onClearModule,
  onSelectAll,
  onClearAll,
}) {
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("TODOS");
  const [expanded, setExpanded] = useState({});

  const moduleOptions = useMemo(() => moduleOptionsFromPermissions(permisos), [permisos]);

  const groups = useMemo(() => {
    const query = safeTrim(search).toLowerCase();
    const filtered = permisos.filter((permission) => {
      const matchesModule = moduleFilter === "TODOS" || permission.modulo === moduleFilter;
      const matchesSearch =
        !query ||
        [
          permission.nombre,
          permission.clave,
          permission.descripcion,
          permission.modulo,
          permission.accion,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      return matchesModule && matchesSearch;
    });

    return groupPermissions(filtered);
  }, [moduleFilter, permisos, search]);

  useEffect(() => {
    setExpanded((prev) => {
      const next = {};
      groups.forEach((group) => {
        next[group.module] = prev[group.module] === true;
      });
      return next;
    });
  }, [groups]);

  const selectedCount = selectedIds.size;
  const hasPermissions = permisos.length > 0;
  const hasResults = groups.length > 0;

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

  return (
    <section className="ar-permissions-card">
      <div className="ar-card-head">
        <div>
          <span className="ar-section-kicker">Permisos base</span>
          <h3>Permisos del rol</h3>
          <p>
            {selectedCount} de {permisos.length} permisos seleccionados
            {dirty ? " - cambios pendientes" : ""}
          </p>
        </div>

        <div className="ar-card-actions">
          <Button
            icon="pi pi-plus"
            className="ar-soft-btn ar-mini-action ar-mini-icon-action"
            tooltip="Expandir todo"
            tooltipOptions={{ position: "top" }}
            aria-label="Expandir todo"
            onClick={expandAll}
            disabled={disabled || !hasResults}
            type="button"
          />
          <Button
            icon="pi pi-minus"
            className="ar-soft-btn ar-mini-action ar-mini-icon-action"
            tooltip="Contraer todo"
            tooltipOptions={{ position: "top" }}
            aria-label="Contraer todo"
            onClick={collapseAll}
            disabled={disabled || !hasResults}
            type="button"
          />
          {!readOnly ? (
            <>
              <Button
                icon="pi pi-check"
                label="Todo"
                className="ar-soft-btn ar-mini-action"
                onClick={onSelectAll}
                disabled={disabled || !hasPermissions || selectedCount === permisos.length}
                type="button"
              />
              <Button
                icon="pi pi-times"
                label="Limpiar"
                className="ar-soft-btn ar-mini-action"
                onClick={onClearAll}
                disabled={disabled || !selectedCount}
                type="button"
              />
            </>
          ) : null}
        </div>
      </div>

      <div className="ar-permission-controls">
        <label className="ar-filter ar-filter--search">
          <span>Buscador</span>
          <div className="ar-search-wrap">
            <i className="pi pi-search" />
            <InputText
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar permiso, clave o accion"
              disabled={disabled}
            />
          </div>
        </label>

        <label className="ar-filter">
          <span>Modulo</span>
          <Dropdown
            value={moduleFilter}
            options={moduleOptions}
            onChange={(event) => setModuleFilter(event.value)}
            disabled={disabled}
            panelClassName="ar-select-panel"
          />
        </label>
      </div>

      <div className="ar-permission-scroll">
        {hasPermissions && hasResults ? (
          groups.map((group) => (
            <PermissionGroup
              key={group.module}
              group={group}
              selectedIds={selectedIds}
              expanded={expanded[group.module] === true}
              disabled={disabled}
              readOnly={readOnly}
              onToggleExpanded={() =>
                setExpanded((prev) => ({ ...prev, [group.module]: prev[group.module] !== true }))
              }
              onTogglePermission={onTogglePermission}
              onSelectModule={() => onSelectModule(group)}
              onClearModule={() => onClearModule(group)}
            />
          ))
        ) : (
          <div className="ar-inline-empty">
            <i className={`pi ${hasPermissions ? "pi-search" : "pi-lock"}`} />
            <strong>{hasPermissions ? "Sin resultados" : "Sin permisos"}</strong>
            <span>
              {hasPermissions
                ? "Ajusta la busqueda o el modulo para ver permisos."
                : "No se encontro catalogo de permisos para asignar."}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
