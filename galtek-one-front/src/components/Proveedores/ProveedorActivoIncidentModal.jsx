import React, { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";
import { InputText } from "primereact/inputtext";
import ProveedorActivoEvidencePicker from "./ProveedorActivoEvidencePicker";
import { enumText, trim } from "./proveedorAdvancedUtils";

function normalizeState(activo) {
  const state = String(activo?.estadoActivoPrestado || "RECIBIDO").trim().toUpperCase();
  if (state === "DANADO") return "RETIRADO_DANO";
  return state;
}

export default function ProveedorActivoIncidentModal({
  visible,
  activo,
  loading,
  onHide,
  onSubmit,
}) {
  const [descripcion, setDescripcion] = useState("");
  const [estadoFisico, setEstadoFisico] = useState("");
  const [ubicacionTienda, setUbicacionTienda] = useState("");
  const [evidences, setEvidences] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!visible) return;
    setDescripcion("");
    setEstadoFisico("");
    setUbicacionTienda("");
    setEvidences([]);
    setErrors({});
  }, [visible]);

  const submit = () => {
    const nextErrors = {};
    if (!trim(descripcion)) nextErrors.descripcion = "Agrega el detalle del incidente.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    onSubmit?.({
      descripcion: trim(descripcion),
      estadoFisico: trim(estadoFisico),
      ubicacionTienda: trim(ubicacionTienda),
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
      header="Registrar incidente del activo"
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
            label="Guardar incidente"
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
          <span>Estado operativo</span>
          <strong>{enumText(normalizeState(activo))}</strong>
        </div>

        <label className={`prov-field ${errors.descripcion ? "has-error" : ""}`}>
          <span>Detalle del incidente</span>
          <InputTextarea
            value={descripcion}
            onChange={(event) => {
              setDescripcion(event.target.value);
              setErrors((prev) => ({ ...prev, descripcion: "" }));
            }}
            rows={3}
            autoResize
            placeholder="Ej. Se detectó golpe en la puerta durante turno vespertino; se notificó al encargado."
            disabled={loading}
          />
          {errors.descripcion ? <small className="prov-field-error">{errors.descripcion}</small> : null}
        </label>

        <div className="prov-form-grid prov-form-grid-compact">
          <label className="prov-field">
            <span>Estado físico reportado</span>
            <InputText
              value={estadoFisico}
              onChange={(event) => setEstadoFisico(event.target.value)}
              placeholder={activo?.estadoFisico || "Ej. Rayado, golpe lateral, puerta floja"}
              disabled={loading}
            />
          </label>
          <label className="prov-field">
            <span>Ubicación al registrar</span>
            <InputText
              value={ubicacionTienda}
              onChange={(event) => setUbicacionTienda(event.target.value)}
              placeholder={activo?.ubicacionTienda || "Ej. Mostrador, pasillo, bodega"}
              disabled={loading}
            />
          </label>
        </div>

        <ProveedorActivoEvidencePicker
          evidences={evidences}
          onChange={setEvidences}
          disabled={loading}
          label="Evidencias del incidente"
        />
      </div>
    </Dialog>
  );
}
