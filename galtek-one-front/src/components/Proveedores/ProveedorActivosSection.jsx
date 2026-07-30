import React, { useState } from "react";
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
  TextAreaField,
  TextField,
} from "./ProveedorAdvancedShared";

const api = new APIfetchApi();

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
  return Array.isArray(item?.historial) ? item.historial.length : 0;
}

export default function ProveedorActivosSection({
  proveedor,
  items = [],
  documentos = [],
  onRefresh,
  showToast,
}) {
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
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!String(form.nombre || "").trim()) nextErrors.nombre = "El nombre es obligatorio.";
    if (form.depositoGarantia != null && Number(form.depositoGarantia) < 0) {
      nextErrors.depositoGarantia = "No puede ser negativo.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const refreshAfterChange = async () => {
    setRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setRefreshing(false);
    }
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
      subtitle="Equipo, exhibidores, evidencias e historial operativo."
      icon="pi pi-th-large"
      addLabel="Agregar activo"
      onAdd={() => {
        setForm(createActivoForm());
        setErrors({});
      }}
    >
      {form ? (
        <div className="prov-adv-form">
          <div className="prov-form-grid">
            <TextField
              label="Nombre"
              value={form.nombre}
              onChange={(value) => update("nombre", value)}
              error={errors.nombre}
              placeholder="Ej. Enfriador Coca-Cola 2 puertas"
            />
            <label className="prov-field">
              <span>Tipo</span>
              <Dropdown
                value={form.tipo}
                options={ACTIVO_TIPO_OPTIONS}
                onChange={(event) => update("tipo", event.value)}
                placeholder="Selecciona tipo"
              />
            </label>
            <TextField
              label="Número de serie"
              value={form.numeroSerie}
              onChange={(value) => update("numeroSerie", value)}
              placeholder="Ej. CC-2026-0001"
            />
            <label className="prov-field">
              <span>Fecha de entrega</span>
              <Calendar
                value={localDateToValue(form.fechaEntrega)}
                onChange={(event) => update("fechaEntrega", valueToLocalDate(event.value))}
                dateFormat="dd/mm/yy"
                showIcon
                placeholder="15/07/2026"
                className="prov-date-calendar"
                panelClassName="prov-date-panel"
                disabled={editing && Boolean(form.fechaEntrega)}
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
                  placeholder="Ej. Bueno, rayado, puerta floja, falla termostato"
                />
                <TextField
                  label="Ubicación inicial en tienda"
                  value={form.ubicacionTienda}
                  onChange={(value) => update("ubicacionTienda", value)}
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
                placeholder="$0.00"
              />
              {errors.depositoGarantia ? <small className="prov-field-error">{errors.depositoGarantia}</small> : null}
            </label>
            <TextAreaField
              label="Condiciones del préstamo"
              value={form.condicionesPrestamo}
              onChange={(value) => update("condicionesPrestamo", value)}
              className="prov-field-wide"
              placeholder="Ej. Comodato condicionado a compra mínima semanal y uso exclusivo del proveedor."
            />
            <TextAreaField
              label="Notas"
              value={form.notas}
              onChange={(value) => update("notas", value)}
              className="prov-field-wide"
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

            return (
              <article
                className={`prov-adv-card prov-asset-card ${isUpdating ? "is-updating" : ""}`}
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
                  onEdit={() => {
                    setForm(createActivoForm(item));
                    setErrors({});
                  }}
                  extra={
                    <>
                      <Button
                        icon="pi pi-directions"
                        className="prov-row-action"
                        onClick={() => setStateItem(item)}
                        disabled={isUpdating}
                        aria-label="Cambiar estado"
                        tooltip="Cambiar estado"
                        tooltipOptions={{ position: "top" }}
                      />
                      <Button
                        icon="pi pi-exclamation-triangle"
                        className="prov-row-action"
                        onClick={() => setIncidentItem(item)}
                        disabled={isUpdating}
                        aria-label="Registrar incidente"
                        tooltip="Registrar incidente"
                        tooltipOptions={{ position: "top" }}
                      />
                      <Button
                        icon="pi pi-history"
                        className="prov-row-action"
                        onClick={() => setHistoryItem(item)}
                        disabled={isUpdating}
                        aria-label="Ver historial"
                        tooltip="Ver historial"
                        tooltipOptions={{ position: "top" }}
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

      <ProveedorActivoHistoryModal
        visible={Boolean(historyItem)}
        activo={historyItem}
        documentos={documentos}
        onHide={() => setHistoryItem(null)}
      />
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
