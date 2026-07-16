import React, { useEffect, useMemo, useState } from "react";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { InputText } from "primereact/inputtext";
import {
  ACTIVO_ESTADO_OPTIONS,
  ACTIVO_FLOW_TRANSITIONS,
  enumText,
  trim,
} from "./proveedorAdvancedUtils";
import ProveedorActivoEvidencePicker from "./ProveedorActivoEvidencePicker";

function normalizeState(activo) {
  const state = String(activo?.estadoActivoPrestado || "RECIBIDO").trim().toUpperCase();
  const normalized = state === "DANADO" ? "RETIRADO_DANO" : state;
  if (activo?.estatus === false && !["DEVUELTO", "PERDIDO"].includes(normalized)) return "INACTIVO";
  return normalized;
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

export default function ProveedorActivoStateModal({
  visible,
  activo,
  loading,
  onHide,
  onSubmit,
}) {
  const currentState = normalizeState(activo);
  const options = useMemo(() => {
    const allowed = ACTIVO_FLOW_TRANSITIONS[currentState] || [];
    return allowed
      .map((value) => ACTIVO_ESTADO_OPTIONS.find((option) => option.value === value))
      .filter(Boolean);
  }, [currentState]);

  const [estadoNuevo, setEstadoNuevo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estadoFisico, setEstadoFisico] = useState("");
  const [ubicacionTienda, setUbicacionTienda] = useState("");
  const [fechaRegreso, setFechaRegreso] = useState("");
  const [evidences, setEvidences] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!visible) return;
    setEstadoNuevo(options[0]?.value || "");
    setDescripcion("");
    setEstadoFisico("");
    setUbicacionTienda("");
    setFechaRegreso("");
    setEvidences([]);
    setErrors({});
  }, [visible, options]);

  const submit = () => {
    const nextErrors = {};
    if (!estadoNuevo) nextErrors.estadoNuevo = "Selecciona el nuevo estado.";
    if (!trim(descripcion)) nextErrors.descripcion = "Agrega el motivo o detalle del movimiento.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    onSubmit?.({
      estadoNuevo,
      descripcion: trim(descripcion),
      estadoFisico: trim(estadoFisico),
      ubicacionTienda: trim(ubicacionTienda),
      fechaRegreso: trim(fechaRegreso),
      evidencias: evidences.map((evidence) => ({
        evidenciaNombre: evidence.name,
        evidenciaMimeType: evidence.mimeType,
        evidenciaBase64: evidence.base64,
        evidenciaTamanoBytes: evidence.size,
      })),
    });
  };

  return (
    <Dialog
      header="Cambiar estado del activo"
      visible={visible}
      onHide={onHide}
      modal
      draggable={false}
      dismissableMask
      focusOnShow={false}
      closeButtonProps={{ tabIndex: -1 }}
      className="prov-advanced-dialog prov-asset-state-dialog"
      style={{ width: "42rem", maxWidth: "calc(100vw - 2rem)" }}
      footer={
        <div className="prov-dialog-footer">
          <Button
            label="Cancelar"
            className="p-button-text prov-text-btn"
            onClick={onHide}
            disabled={loading}
          />
          <Button
            label="Guardar movimiento"
            icon="pi pi-check"
            className="prov-primary-btn"
            onClick={submit}
            loading={loading}
          />
        </div>
      }
    >
      <div className="prov-asset-state-shell">
        <div className="prov-asset-state-current">
          <span>Estado actual</span>
          <strong>{enumText(currentState)}</strong>
        </div>

        <label className={`prov-field ${errors.estadoNuevo ? "has-error" : ""}`}>
          <span>Nuevo estado</span>
          <Dropdown
            value={estadoNuevo}
            options={options}
            onChange={(event) => {
              setEstadoNuevo(event.value);
              setErrors((prev) => ({ ...prev, estadoNuevo: "" }));
            }}
            placeholder="Selecciona el movimiento"
            disabled={!options.length || loading}
          />
          {errors.estadoNuevo ? <small className="prov-field-error">{errors.estadoNuevo}</small> : null}
        </label>

        <label className={`prov-field ${errors.descripcion ? "has-error" : ""}`}>
          <span>Motivo y detalle</span>
          <InputTextarea
            value={descripcion}
            onChange={(event) => {
              setDescripcion(event.target.value);
              setErrors((prev) => ({ ...prev, descripcion: "" }));
            }}
            rows={3}
            autoResize
            placeholder="Ej. Se retiró del mostrador por falla en bisagra; proveedor programó revisión."
            disabled={loading}
          />
          {errors.descripcion ? <small className="prov-field-error">{errors.descripcion}</small> : null}
        </label>

        <div className="prov-form-grid prov-form-grid-compact">
          <label className="prov-field">
            <span>Estado físico después del movimiento</span>
            <InputText
              value={estadoFisico}
              onChange={(event) => setEstadoFisico(event.target.value)}
              placeholder={activo?.estadoFisico || "Ej. Bueno, rayado, reparado, golpe lateral"}
              disabled={loading}
            />
          </label>
          <label className="prov-field">
            <span>Ubicación después del movimiento</span>
            <InputText
              value={ubicacionTienda}
              onChange={(event) => setUbicacionTienda(event.target.value)}
              placeholder={activo?.ubicacionTienda || "Ej. Mostrador, bodega, entrada, exterior"}
              disabled={loading}
            />
          </label>
          {estadoNuevo === "DEVUELTO" ? (
            <label className="prov-field">
              <span>Fecha de regreso</span>
              <Calendar
                value={localDateToValue(fechaRegreso)}
                onChange={(event) => setFechaRegreso(valueToLocalDate(event.value))}
                dateFormat="dd/mm/yy"
                showIcon
                placeholder="15/07/2026"
                className="prov-date-calendar"
                panelClassName="prov-date-panel"
              />
            </label>
          ) : null}
        </div>

        <ProveedorActivoEvidencePicker
          evidences={evidences}
          onChange={setEvidences}
          disabled={loading}
        />
      </div>
    </Dialog>
  );
}
