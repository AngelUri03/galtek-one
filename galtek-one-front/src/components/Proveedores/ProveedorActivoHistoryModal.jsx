import React, { useMemo, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { formatDate } from "./proveedoresUtils";
import { enumText } from "./proveedorAdvancedUtils";

function activoIdFromDocument(documento) {
  return documento?.activo?.idProveedorActivo || documento?.idProveedorActivo || null;
}

function eventTitle(tipoEvento) {
  const type = String(tipoEvento || "").trim().toUpperCase();
  const titles = {
    RECIBIDO: "Activo recibido",
    EN_TIENDA: "Colocado en tienda",
    EN_EXHIBICION: "Colocado en exhibición",
    RETIRADO_DANO: "Retirado por daño",
    DANADO: "Retirado por daño",
    REPARACION: "En reparación",
    DEVUELTO: "Devuelto al proveedor",
    PERDIDO: "Marcado como perdido",
    INCIDENTE: "Incidente registrado",
    EDICION: "Datos editados",
    DESACTIVADO: "Desactivado",
    REACTIVADO: "Reactivado",
    ESTADO_FISICO: "Estado físico actualizado",
    CAMBIO_ESTADO: "Cambio de estado",
  };
  return titles[type] || enumText(type);
}

function eventIcon(tipoEvento) {
  const type = String(tipoEvento || "").trim().toUpperCase();
  if (type === "RETIRADO_DANO" || type === "DANADO" || type === "INCIDENTE") return "pi pi-exclamation-triangle";
  if (type === "REPARACION") return "pi pi-wrench";
  if (type === "DEVUELTO") return "pi pi-replay";
  if (type === "PERDIDO" || type === "DESACTIVADO") return "pi pi-pause-circle";
  if (type === "EN_EXHIBICION") return "pi pi-th-large";
  if (type === "EDICION") return "pi pi-pencil";
  if (type === "ESTADO_FISICO") return "pi pi-camera";
  return "pi pi-check-circle";
}

function evidenceSrc(evidence) {
  if (!evidence?.evidenciaBase64 || !evidence?.evidenciaMimeType) return "";
  return `data:${evidence.evidenciaMimeType};base64,${evidence.evidenciaBase64}`;
}

function eventEvidences(event) {
  const rows = Array.isArray(event?.evidencias) ? event.evidencias.filter((item) => item?.evidenciaBase64) : [];
  if (rows.length) return rows;
  if (!event?.evidenciaBase64) return [];
  return [
    {
      evidenciaNombre: event.evidenciaNombre,
      evidenciaMimeType: event.evidenciaMimeType,
      evidenciaBase64: event.evidenciaBase64,
      evidenciaTamanoBytes: event.evidenciaTamanoBytes,
    },
  ];
}

function downloadEvidence(evidence) {
  const src = evidenceSrc(evidence);
  if (!src) return;
  const link = document.createElement("a");
  link.href = src;
  link.download = evidence.evidenciaNombre || "evidencia-activo";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function formatDateTime(value) {
  if (!value) return "Sin dato";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatDate(value);
  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeEvents(activo, documentos) {
  const persisted = (activo?.historial || []).map((event) => ({
    ...event,
    key: `hist-${event.idProveedorActivoHistorial || event.fechaEvento || event.tipoEvento}`,
    icon: eventIcon(event.tipoEvento),
    title: eventTitle(event.tipoEvento),
    date: event.fechaEvento || event.fechaCreacion || event.fechaModificacion,
    detail: event.descripcion || `${enumText(event.estadoAnterior)} -> ${enumText(event.estadoNuevo)}`,
  }));

  const docs = documentos
    .filter((documento) => Number(activoIdFromDocument(documento)) === Number(activo?.idProveedorActivo))
    .map((documento) => ({
      key: `doc-${documento.idProveedorDocumento || documento.nombre}`,
      icon: documento.tipo === "EVIDENCIA" ? "pi pi-camera" : "pi pi-file",
      title: enumText(documento.tipo),
      date: documento.fechaCreacion || documento.fechaModificacion,
      detail: documento.descripcion || documento.nombre || documento.archivoNombre || "Documento relacionado",
      documento,
    }));

  if (persisted.length || docs.length) return [...persisted, ...docs];

  return [
    {
      key: "empty-created",
      icon: "pi pi-check-circle",
      title: "Activo registrado",
      date: activo?.fechaEntrega || activo?.fechaCreacion,
      detail: "Aún no tiene movimientos registrados en historial.",
    },
  ];
}

export default function ProveedorActivoHistoryModal({ visible, activo, documentos = [], onHide }) {
  const events = useMemo(() => normalizeEvents(activo, documentos), [activo, documentos]);
  const [preview, setPreview] = useState(null);

  return (
    <>
      <Dialog
        header="Historial del activo"
        visible={visible}
        onHide={onHide}
        modal
        draggable={false}
        dismissableMask
        focusOnShow={false}
        closeButtonProps={{ tabIndex: -1 }}
        className="prov-advanced-dialog prov-asset-history-dialog"
        style={{ width: "62rem", maxWidth: "calc(100vw - 2rem)" }}
      >
        <div className="prov-asset-history-shell">
          <div className="prov-asset-history-hero">
            <span className="prov-adv-icon">
              <i className="pi pi-history" />
            </span>
            <div>
              <h3>{activo?.nombre || "Activo prestado"}</h3>
              <p>{enumText(activo?.tipo)}{activo?.numeroSerie ? ` · Serie ${activo.numeroSerie}` : ""}</p>
            </div>
            <span className="prov-asset-history-count">{events.length} eventos</span>
          </div>

          <div className="prov-asset-timeline">
            {events.map((event) => {
              const evidences = eventEvidences(event);
              const showStateTransition = Boolean(event.estadoAnterior && event.estadoNuevo);
              const showAuditDiff = Boolean(event.detalleAnterior && event.detalleNuevo);
              return (
                <article className="prov-asset-timeline-row" key={event.key}>
                  <span className="prov-asset-timeline-icon">
                    <i className={event.icon} />
                  </span>
                  <div className="prov-asset-timeline-card">
                    <div className="prov-asset-timeline-head">
                      <div>
                        <strong>{event.title}</strong>
                        <span>{formatDateTime(event.date)}{event.usuarioCreacion ? ` · ${event.usuarioCreacion}` : ""}</span>
                      </div>
                      {event.estadoNuevo ? (
                        <span className="prov-asset-state-pill">{enumText(event.estadoNuevo)}</span>
                      ) : null}
                    </div>
                    <p>{event.detail}</p>
                    {showStateTransition ? (
                      <div className="prov-asset-state-line">
                        <span>{enumText(event.estadoAnterior)}</span>
                        <i className="pi pi-arrow-right" />
                        <span>{enumText(event.estadoNuevo)}</span>
                      </div>
                    ) : null}
                    {showAuditDiff ? (
                      <div className="prov-asset-audit-diff">
                        <div>
                          <strong>Antes</strong>
                          <pre>{event.detalleAnterior || "--"}</pre>
                        </div>
                        <div>
                          <strong>Después</strong>
                          <pre>{event.detalleNuevo || "--"}</pre>
                        </div>
                      </div>
                    ) : null}
                    {evidences.length ? (
                      <div className="prov-asset-evidence-gallery">
                        {evidences.map((evidence, index) => {
                          const src = evidenceSrc(evidence);
                          return (
                            <article className="prov-asset-evidence-preview" key={`${event.key}-evidence-${index}`}>
                              <button
                                type="button"
                                className="prov-image-thumb-btn"
                                onClick={() => setPreview({ ...evidence, dataUrl: src })}
                              >
                                <img src={src} alt={evidence.evidenciaNombre || "Evidencia del activo"} />
                              </button>
                              <div>
                                <strong>{evidence.evidenciaNombre || "Evidencia del movimiento"}</strong>
                                <span>{evidence.evidenciaMimeType} · {evidence.evidenciaTamanoBytes || 0} bytes</span>
                                <Button
                                  label="Descargar"
                                  icon="pi pi-download"
                                  className="prov-soft-btn prov-download-btn"
                                  onClick={() => downloadEvidence(evidence)}
                                />
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </Dialog>

      <Dialog
        header={preview?.evidenciaNombre || "Vista previa"}
        visible={Boolean(preview)}
        onHide={() => setPreview(null)}
        modal
        draggable={false}
        dismissableMask
        focusOnShow={false}
        closeButtonProps={{ tabIndex: -1 }}
        className="prov-advanced-dialog prov-image-preview-dialog"
        style={{ width: "min(74rem, calc(100vw - 2rem))" }}
      >
        {preview ? (
          <div className="prov-image-preview-body">
            <img src={preview.dataUrl} alt={preview.evidenciaNombre || "Evidencia del activo"} />
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
