import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";
import { formatDate, moneyOrDash, readApiPayload } from "./proveedoresUtils";
import {
  ACTIVO_TIPO_OPTIONS,
  buildActivoPayload,
  createActivoForm,
  enumText,
} from "./proveedorAdvancedUtils";
import ProveedorActivoEvidencePicker from "./ProveedorActivoEvidencePicker";
import ProveedorActivoHistoryModal from "./ProveedorActivoHistoryModal";
import ProveedorActivoIncidentModal from "./ProveedorActivoIncidentModal";
import ProveedorActivoStateModal from "./ProveedorActivoStateModal";
import {
  AdvancedCardActions,
  AdvancedEmpty,
  AdvancedFormActions,
  AdvancedSection,
  FieldLabel,
  TextAreaField,
  TextField,
} from "./ProveedorAdvancedShared";

const api = new APIfetchApi();

const ACTIVO_FIELD_LIMITS = {
  nombre: 90,
  numeroSerie: 60,
  estadoFisico: 90,
  ubicacionTienda: 90,
  condicionesPrestamo: 420,
  notas: 420,
};

function limitActivoValue(field, value) {
  const limit = ACTIVO_FIELD_LIMITS[field];
  if (!limit || typeof value !== "string") return value;
  return value.slice(0, limit);
}

function focusFirstFormError(root, errors) {
  const firstField = Object.keys(errors).find((field) => errors[field]);
  if (!firstField || !root) return;

  window.requestAnimationFrame(() => {
    const field = root.querySelector(`[data-field-key="${firstField}"]`);
    if (!field) return;
    field.scrollIntoView({ behavior: "smooth", block: "center" });
    const control = field.querySelector("input, textarea, button, .p-dropdown, .p-calendar, .p-inputnumber-input");
    control?.focus?.({ preventScroll: true });
  });
}

function getActivoUrl(idProveedor, idActivo) {
  return idActivo
    ? `${endpoints.proveedores}/${idProveedor}/activos/${idActivo}`
    : `${endpoints.proveedores}/${idProveedor}/activos`;
}

function getActivoEstadoUrl(idProveedor, idActivo) {
  return `${getActivoUrl(idProveedor, idActivo)}/estado`;
}

function getActivoIncidenteUrl(idProveedor, idActivo) {
  return `${getActivoUrl(idProveedor, idActivo)}/incidentes`;
}

function localDateToValue(value) {
  if (!value) return null;
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function valueToLocalDate(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function activoState(item) {
  const raw = String(item?.estadoActivoPrestado || "RECIBIDO").trim().toUpperCase();
  const state = raw === "DANADO" ? "RETIRADO_DANO" : raw;
  if (item?.estatus === false && !["DEVUELTO", "PERDIDO"].includes(state)) return "INACTIVO";
  return state;
}

function activoStateClass(item) {
  const state = activoState(item);
  if (state === "EN_TIENDA" || state === "EN_EXHIBICION") return "is-active";
  if (state === "RECIBIDO") return "is-neutral";
  if (state === "RETIRADO_DANO" || state === "REPARACION") return "is-warning";
  return "is-inactive";
}

function historyCount(item) {
  const count = Number(item?.historialCount ?? item?.historialEventosCount);
  if (Number.isFinite(count)) return count;
  return Array.isArray(item?.historial) ? item.historial.length : 0;
}

export function ProveedorActivoFormView({
  proveedor,
  item = null,
  showToast,
  onCancel,
  onSaved,
  onDirtyChange,
}) {
  const formRef = useRef(null);
  const [form, setForm] = useState(() => createActivoForm(item));
  const [initialSnapshot, setInitialSnapshot] = useState(() =>
    JSON.stringify(createActivoForm(item))
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const editing = Boolean(form?.idProveedorActivo);

  useEffect(() => {
    const nextForm = createActivoForm(item);
    setForm(nextForm);
    setInitialSnapshot(JSON.stringify(nextForm));
    setErrors({});
  }, [item]);

  const currentSnapshot = useMemo(() => JSON.stringify(form), [form]);
  const dirty = Boolean(initialSnapshot && currentSnapshot !== initialSnapshot);

  useEffect(() => {
    onDirtyChange?.(dirty);
    return () => onDirtyChange?.(false);
  }, [dirty, onDirtyChange]);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: limitActivoValue(field, value) }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!String(form.nombre || "").trim()) nextErrors.nombre = "El nombre es obligatorio.";
    if (!String(form.tipo || "").trim()) nextErrors.tipo = "Selecciona un tipo.";
    if (!String(form.fechaEntrega || "").trim()) nextErrors.fechaEntrega = "Indica la fecha de entrega.";
    if (!editing && !String(form.estadoFisico || "").trim()) {
      nextErrors.estadoFisico = "Indica el estado fisico inicial.";
    }
    if (!editing && !String(form.ubicacionTienda || "").trim()) {
      nextErrors.ubicacionTienda = "Indica donde queda el activo.";
    }
    if (form.depositoGarantia != null && Number(form.depositoGarantia) < 0) {
      nextErrors.depositoGarantia = "No puede ser negativo.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      focusFirstFormError(formRef.current, nextErrors);
      return false;
    }
    return true;
  };

  const save = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const response = await api.fetchApi(
        {},
        editing ? "PUT" : "POST",
        buildActivoPayload(form),
        getActivoUrl(proveedor.idProveedor, form.idProveedorActivo)
      );
      const saved = await readApiPayload(response, "guardar activo");
      showToast?.(
        "success",
        "Activos prestados",
        editing ? "Activo actualizado correctamente." : "Activo agregado correctamente."
      );
      onDirtyChange?.(false);
      await onSaved?.(saved);
    } catch (error) {
      showToast?.("error", "Activos prestados", error?.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="prov-workspace-form prov-asset-workspace-form" ref={formRef}>
      <div className="prov-form-grid prov-workspace-form-body">
        <TextField
          label="Nombre"
          value={form.nombre}
          onChange={(value) => update("nombre", value)}
          error={errors.nombre}
          required
          fieldKey="nombre"
          maxLength={ACTIVO_FIELD_LIMITS.nombre}
          placeholder="Ej. Enfriador Coca-Cola 2 puertas"
          autoFocus
        />
        <label className={`prov-field ${errors.tipo ? "has-error" : ""}`} data-field-key="tipo">
          <FieldLabel required>Tipo</FieldLabel>
          <Dropdown
            value={form.tipo}
            options={ACTIVO_TIPO_OPTIONS}
            onChange={(event) => update("tipo", event.value)}
            placeholder="Selecciona tipo"
            aria-invalid={errors.tipo ? "true" : undefined}
          />
          {errors.tipo ? <small className="prov-field-error">{errors.tipo}</small> : null}
        </label>
        <TextField
          label="Numero de serie"
          value={form.numeroSerie}
          onChange={(value) => update("numeroSerie", value)}
          fieldKey="numeroSerie"
          maxLength={ACTIVO_FIELD_LIMITS.numeroSerie}
          placeholder="Ej. CC-2026-0001"
        />
        <label className={`prov-field ${errors.fechaEntrega ? "has-error" : ""}`} data-field-key="fechaEntrega">
          <FieldLabel required>Fecha de entrega</FieldLabel>
          <Calendar
            value={localDateToValue(form.fechaEntrega)}
            onChange={(event) => update("fechaEntrega", valueToLocalDate(event.value))}
            dateFormat="dd/mm/yy"
            showIcon
            placeholder="15/07/2026"
            className="prov-date-calendar"
            panelClassName="prov-date-panel"
            disabled={editing && Boolean(form.fechaEntrega)}
            inputProps={{
              "aria-invalid": errors.fechaEntrega ? "true" : undefined,
              "aria-required": true,
            }}
          />
          {editing && form.fechaEntrega ? (
            <small className="prov-field-hint">La entrega original queda fija para auditoria.</small>
          ) : null}
          {errors.fechaEntrega ? <small className="prov-field-error">{errors.fechaEntrega}</small> : null}
        </label>
        <label className="prov-field">
          <span>Fecha de regreso</span>
          <Calendar
            value={localDateToValue(form.fechaRegreso)}
            onChange={(event) => update("fechaRegreso", valueToLocalDate(event.value))}
            dateFormat="dd/mm/yy"
            showIcon
            placeholder="15/07/2026"
            className="prov-date-calendar"
            panelClassName="prov-date-panel"
          />
        </label>

        {editing ? (
          <>
            <div className="prov-field prov-readonly-field">
              <span>Estado fisico actual</span>
              <strong>{form.estadoFisico || "--"}</strong>
              <small>Se actualiza con Incidente o Cambiar estado.</small>
            </div>
            <div className="prov-field prov-readonly-field">
              <span>Ubicacion actual</span>
              <strong>{form.ubicacionTienda || "--"}</strong>
              <small>Se actualiza con Incidente o Cambiar estado.</small>
            </div>
          </>
        ) : (
          <>
            <TextField
              label="Estado fisico inicial"
              value={form.estadoFisico}
              onChange={(value) => update("estadoFisico", value)}
              error={errors.estadoFisico}
              required
              fieldKey="estadoFisico"
              maxLength={ACTIVO_FIELD_LIMITS.estadoFisico}
              placeholder="Ej. Bueno, rayado, puerta floja, falla termostato"
            />
            <TextField
              label="Ubicacion inicial en tienda"
              value={form.ubicacionTienda}
              onChange={(value) => update("ubicacionTienda", value)}
              error={errors.ubicacionTienda}
              required
              fieldKey="ubicacionTienda"
              maxLength={ACTIVO_FIELD_LIMITS.ubicacionTienda}
              placeholder="Ej. Entrada, pasillo frio, mostrador, fachada"
            />
          </>
        )}

        <label className={`prov-field ${errors.depositoGarantia ? "has-error" : ""}`} data-field-key="depositoGarantia">
          <span>Deposito o garantia</span>
          <InputNumber
            value={form.depositoGarantia}
            onValueChange={(event) => update("depositoGarantia", event.value)}
            mode="currency"
            currency="MXN"
            locale="es-MX"
            min={0}
            max={9999999}
            placeholder="$0.00"
          />
          {errors.depositoGarantia ? (
            <small className="prov-field-error">{errors.depositoGarantia}</small>
          ) : null}
        </label>
        <TextAreaField
          label="Condiciones del prestamo"
          value={form.condicionesPrestamo}
          onChange={(value) => update("condicionesPrestamo", value)}
          className="prov-field-wide"
          fieldKey="condicionesPrestamo"
          maxLength={ACTIVO_FIELD_LIMITS.condicionesPrestamo}
          placeholder="Ej. Comodato condicionado a compra minima semanal y uso exclusivo del proveedor."
        />
        <TextAreaField
          label="Notas"
          value={form.notas}
          onChange={(value) => update("notas", value)}
          className="prov-field-wide"
          fieldKey="notas"
          maxLength={ACTIVO_FIELD_LIMITS.notas}
          placeholder="Ej. Revisar limpieza semanal, conservar comodato y evidencia de movimientos."
        />
        {!editing ? (
          <div className="prov-field-wide">
            <ProveedorActivoEvidencePicker
              evidences={form.evidencias || []}
              onChange={(value) => update("evidencias", value)}
              disabled={saving}
              label="Evidencias iniciales"
            />
          </div>
        ) : null}
      </div>
      <AdvancedFormActions
        editing={editing}
        saving={saving}
        onCancel={onCancel}
        onSave={save}
        saveLabel={editing ? "Guardar activo" : "Agregar activo"}
        className="prov-workspace-editor-footer"
        editorStyle
      />
    </div>
  );
}

export default function ProveedorActivosSection({
  proveedor,
  items = [],
  documentos = [],
  onRefresh,
  showToast,
  highlightedActivoId,
  readOnly = false,
  onOpenForm,
  onOpenHistory,
}) {
  const inlineFormRef = useRef(null);
  const [form, setForm] = useState(null);
  const [savingForm, setSavingForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingActivo, setUpdatingActivo] = useState(null);
  const [historyItem, setHistoryItem] = useState(null);
  const [stateItem, setStateItem] = useState(null);
  const [stateSaving, setStateSaving] = useState(false);
  const [incidentItem, setIncidentItem] = useState(null);
  const [incidentSaving, setIncidentSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const editing = Boolean(form?.idProveedorActivo);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: limitActivoValue(field, value) }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!String(form.nombre || "").trim()) nextErrors.nombre = "El nombre es obligatorio.";
    if (!String(form.tipo || "").trim()) nextErrors.tipo = "Selecciona un tipo.";
    if (!String(form.fechaEntrega || "").trim()) nextErrors.fechaEntrega = "Indica la fecha de entrega.";
    if (!editing && !String(form.estadoFisico || "").trim()) {
      nextErrors.estadoFisico = "Indica el estado fisico inicial.";
    }
    if (!editing && !String(form.ubicacionTienda || "").trim()) {
      nextErrors.ubicacionTienda = "Indica donde queda el activo.";
    }
    if (form.depositoGarantia != null && Number(form.depositoGarantia) < 0) {
      nextErrors.depositoGarantia = "No puede ser negativo.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      focusFirstFormError(inlineFormRef.current, nextErrors);
      return false;
    }
    return true;
  };

  const refreshAfterChange = async () => {
    setRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setRefreshing(false);
    }
  };

  const openForm = (item = null) => {
    if (readOnly) {
      showToast?.("info", "Proveedor archivado", "Los activos quedan solo como historial.");
      return;
    }
    if (onOpenForm) {
      onOpenForm(item);
      return;
    }
    setForm(createActivoForm(item));
    setErrors({});
  };

  const save = async () => {
    if (!validate()) return;

    setSavingForm(true);
    try {
      const response = await api.fetchApi(
        {},
        editing ? "PUT" : "POST",
        buildActivoPayload(form),
        getActivoUrl(proveedor.idProveedor, form.idProveedorActivo)
      );
      await readApiPayload(response, "guardar activo");
      showToast("success", "Activos prestados", "Activo guardado.");
      setForm(null);
      await refreshAfterChange();
    } catch (error) {
      showToast("error", "Activos prestados", error?.message || "No se pudo guardar.");
    } finally {
      setSavingForm(false);
    }
  };

  const changeState = async (payload) => {
    if (!stateItem?.idProveedorActivo) return;

    setStateSaving(true);
    setUpdatingActivo({ id: stateItem.idProveedorActivo, action: "estado" });
    try {
      const response = await api.fetchApi(
        {},
        "PUT",
        payload,
        getActivoEstadoUrl(proveedor.idProveedor, stateItem.idProveedorActivo)
      );
      await readApiPayload(response, "cambiar estado de activo");
      showToast("success", "Activos prestados", "Movimiento guardado.");
      setStateItem(null);
      await refreshAfterChange();
    } catch (error) {
      showToast("error", "Activos prestados", error?.message || "No se pudo cambiar el estado.");
    } finally {
      setStateSaving(false);
      setUpdatingActivo(null);
    }
  };

  const reportIncident = async (payload) => {
    if (!incidentItem?.idProveedorActivo) return;

    setIncidentSaving(true);
    setUpdatingActivo({ id: incidentItem.idProveedorActivo, action: "incidente" });
    try {
      const response = await api.fetchApi(
        {},
        "POST",
        payload,
        getActivoIncidenteUrl(proveedor.idProveedor, incidentItem.idProveedorActivo)
      );
      await readApiPayload(response, "registrar incidente de activo");
      showToast("success", "Activos prestados", "Incidente registrado.");
      setIncidentItem(null);
      await refreshAfterChange();
    } catch (error) {
      showToast("error", "Activos prestados", error?.message || "No se pudo registrar el incidente.");
    } finally {
      setIncidentSaving(false);
      setUpdatingActivo(null);
    }
  };

  return (
    <AdvancedSection
      title="Activos prestados"
      subtitle={
        readOnly
          ? "Consulta historica de equipo, evidencias e historial de uso."
          : "Equipo, exhibidores, evidencias e historial de uso."
      }
      icon="pi pi-th-large"
      addLabel="Agregar activo"
      onAdd={readOnly ? null : () => openForm(null)}
    >
      {form ? (
        <div className="prov-adv-form" ref={inlineFormRef}>
          <div className="prov-form-grid">
            <TextField
              label="Nombre"
              value={form.nombre}
              onChange={(value) => update("nombre", value)}
              error={errors.nombre}
              required
              fieldKey="nombre"
              maxLength={ACTIVO_FIELD_LIMITS.nombre}
              placeholder="Ej. Enfriador Coca-Cola 2 puertas"
            />
            <label className={`prov-field ${errors.tipo ? "has-error" : ""}`} data-field-key="tipo">
              <FieldLabel required>Tipo</FieldLabel>
              <Dropdown
                value={form.tipo}
                options={ACTIVO_TIPO_OPTIONS}
                onChange={(event) => update("tipo", event.value)}
                placeholder="Selecciona tipo"
                aria-invalid={errors.tipo ? "true" : undefined}
              />
              {errors.tipo ? <small className="prov-field-error">{errors.tipo}</small> : null}
            </label>
            <TextField
              label="Número de serie"
              value={form.numeroSerie}
              onChange={(value) => update("numeroSerie", value)}
              fieldKey="numeroSerie"
              maxLength={ACTIVO_FIELD_LIMITS.numeroSerie}
              placeholder="Ej. CC-2026-0001"
            />
            <label className={`prov-field ${errors.fechaEntrega ? "has-error" : ""}`} data-field-key="fechaEntrega">
              <FieldLabel required>Fecha de entrega</FieldLabel>
              {errors.fechaEntrega ? <small className="prov-field-error">{errors.fechaEntrega}</small> : null}
              <Calendar
                value={localDateToValue(form.fechaEntrega)}
                onChange={(event) => update("fechaEntrega", valueToLocalDate(event.value))}
                dateFormat="dd/mm/yy"
                showIcon
                placeholder="15/07/2026"
                className="prov-date-calendar"
                panelClassName="prov-date-panel"
                disabled={editing && Boolean(form.fechaEntrega)}
                inputProps={{
                  "aria-invalid": errors.fechaEntrega ? "true" : undefined,
                  "aria-required": true,
                }}
              />
              {editing && form.fechaEntrega ? (
                <small className="prov-field-hint">La entrega original queda fija para auditoría.</small>
              ) : null}
            </label>
            <label className="prov-field">
              <span>Fecha de regreso</span>
              <Calendar
                value={localDateToValue(form.fechaRegreso)}
                onChange={(event) => update("fechaRegreso", valueToLocalDate(event.value))}
                dateFormat="dd/mm/yy"
                showIcon
                placeholder="15/07/2026"
                className="prov-date-calendar"
                panelClassName="prov-date-panel"
              />
            </label>

            {editing ? (
              <>
                <div className="prov-field prov-readonly-field">
                  <span>Estado físico actual</span>
                  <strong>{form.estadoFisico || "--"}</strong>
                  <small>Se actualiza con Incidente o Cambiar estado.</small>
                </div>
                <div className="prov-field prov-readonly-field">
                  <span>Ubicación actual</span>
                  <strong>{form.ubicacionTienda || "--"}</strong>
                  <small>Se actualiza con Incidente o Cambiar estado.</small>
                </div>
              </>
            ) : (
              <>
                <TextField
                  label="Estado físico inicial"
                  value={form.estadoFisico}
                  onChange={(value) => update("estadoFisico", value)}
                  error={errors.estadoFisico}
                  required
                  fieldKey="estadoFisico"
                  maxLength={ACTIVO_FIELD_LIMITS.estadoFisico}
                  placeholder="Ej. Bueno, rayado, puerta floja, falla termostato"
                />
                <TextField
                  label="Ubicación inicial en tienda"
                  value={form.ubicacionTienda}
                  onChange={(value) => update("ubicacionTienda", value)}
                  error={errors.ubicacionTienda}
                  required
                  fieldKey="ubicacionTienda"
                  maxLength={ACTIVO_FIELD_LIMITS.ubicacionTienda}
                  placeholder="Ej. Entrada, pasillo frío, mostrador, fachada"
                />
              </>
            )}

            <label className="prov-field">
              <span>Depósito o garantía</span>
              <InputNumber
                value={form.depositoGarantia}
                onValueChange={(event) => update("depositoGarantia", event.value)}
                mode="currency"
                currency="MXN"
                locale="es-MX"
                min={0}
                max={9999999}
                placeholder="$0.00"
              />
              {errors.depositoGarantia ? <small className="prov-field-error">{errors.depositoGarantia}</small> : null}
            </label>
            <TextAreaField
              label="Condiciones del préstamo"
              value={form.condicionesPrestamo}
              onChange={(value) => update("condicionesPrestamo", value)}
              className="prov-field-wide"
              fieldKey="condicionesPrestamo"
              maxLength={ACTIVO_FIELD_LIMITS.condicionesPrestamo}
              placeholder="Ej. Comodato condicionado a compra mínima semanal y uso exclusivo del proveedor."
            />
            <TextAreaField
              label="Notas"
              value={form.notas}
              onChange={(value) => update("notas", value)}
              className="prov-field-wide"
              fieldKey="notas"
              maxLength={ACTIVO_FIELD_LIMITS.notas}
              placeholder="Ej. Revisar limpieza semanal, conservar comodato y evidencia de movimientos."
            />
            {!editing ? (
              <div className="prov-field-wide">
                <ProveedorActivoEvidencePicker
                  evidences={form.evidencias || []}
                  onChange={(value) => update("evidencias", value)}
                  disabled={savingForm}
                  label="Evidencias iniciales"
                />
              </div>
            ) : null}
          </div>
          <AdvancedFormActions
            editing={editing}
            saving={savingForm}
            onCancel={() => setForm(null)}
            onSave={save}
          />
        </div>
      ) : null}

      {refreshing ? (
        <div className="prov-adv-sync">
          <i className="pi pi-spin pi-spinner" />
          <span>Actualizando registros...</span>
        </div>
      ) : null}

      {items.length ? (
        <div className="prov-adv-card-grid">
          {items.map((item) => {
            const isUpdating = updatingActivo?.id === item.idProveedorActivo;
            const isHighlighted =
              highlightedActivoId &&
              Number(highlightedActivoId) === Number(item.idProveedorActivo);

            return (
              <article
                className={`prov-adv-card prov-asset-card ${isUpdating ? "is-updating" : ""} ${
                  isHighlighted ? "is-highlighted" : ""
                }`}
                key={item.idProveedorActivo || item.nombre}
              >
                <div className="prov-adv-card-main">
                  <div>
                    <strong title={item.nombre}>{item.nombre || "Activo prestado"}</strong>
                    <span title={item.numeroSerie || item.ubicacionTienda}>
                      {enumText(item.tipo)}
                      {item.numeroSerie ? ` · Serie ${item.numeroSerie}` : ""}
                    </span>
                  </div>
                  <span className={`prov-asset-status ${isUpdating ? "is-updating" : activoStateClass(item)}`}>
                    {isUpdating ? (
                      <>
                        <i className="pi pi-spin pi-spinner" />
                        Actualizando
                      </>
                    ) : (
                      enumText(activoState(item))
                    )}
                  </span>
                </div>
                <div className="prov-adv-meta-grid">
                  <span>Entrega <strong>{formatDate(item.fechaEntrega)}</strong></span>
                  <span>Regreso <strong>{formatDate(item.fechaRegreso)}</strong></span>
                  <span>Ubicación <strong>{item.ubicacionTienda || "--"}</strong></span>
                  <span>Garantía <strong>{moneyOrDash(item.depositoGarantia)}</strong></span>
                  <span>Estado físico <strong>{item.estadoFisico || "--"}</strong></span>
                  <span>Historial <strong>{historyCount(item)} eventos</strong></span>
                </div>
                <AdvancedCardActions
                  disabled={isUpdating}
                  onEdit={readOnly ? null : () => openForm(item)}
                  extra={
                    <>
                      {!readOnly ? (
                        <>
                          <Button
                            icon="pi pi-directions"
                            className="prov-row-action"
                            onClick={() => setStateItem(item)}
                            disabled={isUpdating}
                            aria-label="Cambiar estado"
                            tooltip="Cambiar estado"
                            tooltipOptions={{ position: "top", className: "prov-action-tooltip" }}
                          />
                          <Button
                            icon="pi pi-exclamation-triangle"
                            className="prov-row-action"
                            onClick={() => setIncidentItem(item)}
                            disabled={isUpdating}
                            aria-label="Registrar incidente"
                            tooltip="Registrar incidente"
                            tooltipOptions={{ position: "top", className: "prov-action-tooltip" }}
                          />
                        </>
                      ) : null}
                      <Button
                        icon="pi pi-history"
                        className="prov-row-action"
                        onClick={() => (onOpenHistory ? onOpenHistory(item) : setHistoryItem(item))}
                        disabled={isUpdating}
                        aria-label="Ver historial"
                        tooltip="Ver historial"
                        tooltipOptions={{ position: "top", className: "prov-action-tooltip" }}
                      />
                    </>
                  }
                />
              </article>
            );
          })}
        </div>
      ) : (
        <AdvancedEmpty text="Sin activos prestados. Registra enfriadores, stands, lonas o equipo del proveedor." />
      )}

      {!onOpenHistory ? (
        <ProveedorActivoHistoryModal
          visible={Boolean(historyItem)}
          activo={historyItem}
          documentos={documentos}
          onHide={() => setHistoryItem(null)}
        />
      ) : null}
      <ProveedorActivoStateModal
        visible={Boolean(stateItem)}
        activo={stateItem}
        loading={stateSaving}
        onHide={() => {
          if (!stateSaving) setStateItem(null);
        }}
        onSubmit={changeState}
      />
      <ProveedorActivoIncidentModal
        visible={Boolean(incidentItem)}
        activo={incidentItem}
        loading={incidentSaving}
        onHide={() => {
          if (!incidentSaving) setIncidentItem(null);
        }}
        onSubmit={reportIncident}
      />
    </AdvancedSection>
  );
}
