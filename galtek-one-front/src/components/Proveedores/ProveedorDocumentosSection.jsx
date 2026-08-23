import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";
import { readApiPayload } from "./proveedoresUtils";
import { ModalSurface } from "../common/OverlaySurfaces";
import {
  DOCUMENTO_MIME_OPTIONS,
  DOCUMENTO_TIPO_OPTIONS,
  MAX_DOCUMENT_BYTES,
  buildDocumentoPayload,
  createDocumentoForm,
  enumText,
  trim,
} from "./proveedorAdvancedUtils";
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

const MIME_BY_EXTENSION = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  csv: "text/csv",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ppt: "application/vnd.ms-powerpoint",
  txt: "text/plain",
};

const ACCEPTED_EXTENSIONS = Object.keys(MIME_BY_EXTENSION).map((extension) => `.${extension}`);
const ACCEPTED_FILES = [...DOCUMENTO_MIME_OPTIONS.map((option) => option.value), ...ACCEPTED_EXTENSIONS].join(",");

const DOCUMENTO_FIELD_LIMITS = {
  nombre: 120,
  descripcion: 520,
  motivo: 420,
};

function limitDocumentoValue(field, value) {
  const limit = DOCUMENTO_FIELD_LIMITS[field];
  if (!limit || typeof value !== "string") return value;
  return value.slice(0, limit);
}

function focusFirstDocumentFormError(root, errors) {
  const firstField = Object.keys(errors).find((field) => errors[field]);
  if (!firstField || !root) return;

  window.requestAnimationFrame(() => {
    const field = root.querySelector(`[data-field-key="${firstField}"]`);
    if (!field) return;
    field.scrollIntoView({ behavior: "smooth", block: "center" });
    const control = field.querySelector("input, textarea, button, .p-dropdown");
    control?.focus?.({ preventScroll: true });
  });
}

function getDocumentoUrl(idProveedor, idDocumento) {
  return idDocumento
    ? `${endpoints.proveedores}/${idProveedor}/documentos/${idDocumento}`
    : `${endpoints.proveedores}/${idProveedor}/documentos`;
}

function bytesLabel(value) {
  if (!value) return "--";
  const mb = Number(value) / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(Number(value) / 1024))} KB`;
}

function mimeLabel(value) {
  return DOCUMENTO_MIME_OPTIONS.find((option) => option.value === value)?.label || value || "--";
}

function documentDataUrl(documento) {
  if (!documento?.archivoBase64 || !documento?.mimeType) return "";
  return `data:${documento.mimeType};base64,${documento.archivoBase64}`;
}

function canDownload(documento) {
  return Boolean(documentDataUrl(documento));
}

function extensionForMime(mime) {
  const extensions = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "application/vnd.ms-excel": ".xls",
    "text/csv": ".csv",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
    "application/vnd.ms-powerpoint": ".ppt",
    "text/plain": ".txt",
  };
  return extensions[mime] || "";
}

function fileNameFor(documento) {
  const fromServer = documento?.archivoNombre;
  if (fromServer) return fromServer;
  const mime = documento?.mimeType || "";
  const extension = extensionForMime(mime);
  const name = documento?.nombre || "documento-proveedor";
  return name.toLowerCase().endsWith(extension) ? name : `${name}${extension}`;
}

function downloadDocumento(documento) {
  const dataUrl = documentDataUrl(documento);
  if (!dataUrl) return;
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileNameFor(documento);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function extensionFromName(name) {
  const parts = String(name || "").toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() : "";
}

function detectMime(file) {
  if (file.type && DOCUMENTO_MIME_OPTIONS.some((option) => option.value === file.type)) {
    return file.type;
  }
  return MIME_BY_EXTENSION[extensionFromName(file.name)] || "";
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || "");
      resolve(value.includes(",") ? value.split(",").pop() : value);
    };
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
}

function decodeText(documento) {
  try {
    const binary = atob(documento.archivoBase64 || "");
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return "No se pudo generar la vista previa del texto.";
  }
}

function parseCsv(text) {
  return String(text || "")
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(0, 12)
    .map((row) => row.split(",").slice(0, 8));
}

function formatDateTime(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).replace("T", " ");
  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fileKind(documento) {
  const mime = String(documento?.mimeType || "");
  if (mime.startsWith("image/")) return { label: "Imagen", icon: "pi pi-image", tone: "image" };
  if (mime === "application/pdf") return { label: "PDF", icon: "pi pi-file-pdf", tone: "pdf" };
  if (mime.includes("spreadsheet") || mime.includes("excel") || mime === "text/csv") return { label: "Hoja de calculo", icon: "pi pi-table", tone: "sheet" };
  if (mime.includes("word")) return { label: "Documento Word", icon: "pi pi-file-word", tone: "word" };
  if (mime.includes("presentation") || mime.includes("powerpoint")) return { label: "Presentacion", icon: "pi pi-desktop", tone: "slides" };
  if (mime === "text/plain") return { label: "Texto", icon: "pi pi-align-left", tone: "text" };
  return { label: "Archivo", icon: "pi pi-file", tone: "file" };
}

function documentoEstado(item) {
  return String(item?.estadoDocumento || "ACTIVO").trim().toUpperCase();
}

function documentoEstadoSeverity(item) {
  const state = documentoEstado(item);
  if (state === "ACTIVO") return "success";
  if (state === "INACTIVO") return "warning";
  return "secondary";
}

function documentoFlowDefaultAction(item) {
  const state = documentoEstado(item);
  if (state === "ACTIVO") return "desactivar";
  if (state === "INACTIVO") return "reactivar";
  return null;
}

function documentoFlowSummary(item, action) {
  const state = documentoEstado(item);
  if (state === "ARCHIVADO") {
    return "Este documento ya esta archivado y solo permite consultar historial.";
  }
  if (action === "archivar") {
    return "Archivar conserva el historial, pero bloquea el documento de forma definitiva.";
  }
  if (action === "reactivar") {
    return "Reactivar devuelve el documento al flujo normal de operacion.";
  }
  if (state === "ACTIVO") {
    return "El documento activo puede pausarse temporalmente o archivarse como historico definitivo.";
  }
  return "El documento inactivo puede volver al flujo normal o archivarse definitivamente.";
}

function documentoFlowConfirmLabel(action) {
  if (action === "reactivar") return "Activar documento";
  if (action === "archivar") return "Archivar documento";
  return "Desactivar documento";
}

function documentoFlowConfirmIcon(action) {
  if (action === "reactivar") return "pi pi-play";
  if (action === "archivar") return "pi pi-folder";
  return "pi pi-pause";
}

function historyDocument(event, prefix) {
  return {
    nombre: prefix === "anterior" ? event.archivoAnteriorNombre : event.archivoNuevoNombre,
    archivoNombre: prefix === "anterior" ? event.archivoAnteriorNombre : event.archivoNuevoNombre,
    mimeType: prefix === "anterior" ? event.archivoAnteriorMimeType : event.archivoNuevoMimeType,
    tamanoBytes: prefix === "anterior" ? event.archivoAnteriorTamanoBytes : event.archivoNuevoTamanoBytes,
    archivoBase64: prefix === "anterior" ? event.archivoAnteriorBase64 : event.archivoNuevoBase64,
  };
}

function parseDetail(detail) {
  return String(detail || "")
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const index = row.indexOf(":");
      if (index < 0) return { label: "Cambio", value: row };
      return { label: row.slice(0, index), value: row.slice(index + 1).trim() };
    });
}

function FileMetaStrip({ documento, locked = false }) {
  const kind = fileKind(documento);
  return (
    <div className={`prov-document-file-strip is-${kind.tone}`}>
      <span className="prov-document-file-icon">
        <i className={kind.icon} />
      </span>
      <div>
        <strong title={fileNameFor(documento)}>{fileNameFor(documento)}</strong>
        <span>{kind.label} - {mimeLabel(documento?.mimeType)} - {bytesLabel(documento?.tamanoBytes)}</span>
      </div>
      {locked ? <em>Archivo protegido</em> : null}
    </div>
  );
}

function FormatBadge({ documento }) {
  const kind = fileKind(documento);
  return (
    <strong className={`prov-document-format-badge is-${kind.tone}`}>
      <i className={kind.icon} />
      {mimeLabel(documento?.mimeType)}
    </strong>
  );
}

function DocumentHistoryHero({ documento, eventCount }) {
  const kind = fileKind(documento);
  return (
    <div className={`prov-document-history-identity is-${kind.tone}`}>
      <span>
        <i className={kind.icon} />
      </span>
      <div>
        <strong title={fileNameFor(documento)}>{fileNameFor(documento)}</strong>
        <small>{kind.label} - {bytesLabel(documento?.tamanoBytes)}</small>
      </div>
      <em>{eventCount} {eventCount === 1 ? "evento" : "eventos"}</em>
    </div>
  );
}

function CsvPreview({ documento }) {
  const rows = parseCsv(decodeText(documento));
  if (!rows.length) return <pre className="prov-document-text-preview">Sin contenido para previsualizar.</pre>;
  return (
    <div className="prov-document-csv-preview">
      <table>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td key={`cell-${rowIndex}-${cellIndex}`}>{cell || "--"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OfficePreview({ documento }) {
  const kind = fileKind(documento);
  return (
    <div className={`prov-document-office-preview is-${kind.tone}`}>
      <span>
        <i className={kind.icon} />
      </span>
      <strong>{fileNameFor(documento)}</strong>
      <p>{kind.label} guardado en base de datos. La vista previa completa depende de la aplicacion instalada; el archivo original queda disponible para descarga.</p>
      <div>
        <small>Formato</small>
        <b>{mimeLabel(documento?.mimeType)}</b>
      </div>
      <div>
        <small>Tamano</small>
        <b>{bytesLabel(documento?.tamanoBytes)}</b>
      </div>
    </div>
  );
}

export function DocumentoPreviewDialog({ documento, onHide }) {
  const dataUrl = documentDataUrl(documento);
  const mime = String(documento?.mimeType || "");
  const isImage = mime.startsWith("image/");
  const isPdf = mime === "application/pdf";
  const isCsv = mime === "text/csv";
  const isText = mime === "text/plain";
  const isNativePreview = isImage || isPdf || isCsv || isText;

  return (
    <Dialog
      header="Vista previa del documento"
      visible={Boolean(documento)}
      onHide={onHide}
      modal
      draggable={false}
      dismissableMask
      focusOnShow={false}
      closeButtonProps={{ tabIndex: -1 }}
      className="prov-advanced-dialog prov-document-preview-dialog"
      style={{ width: "min(78rem, calc(100vw - 2rem))" }}
    >
      {documento ? (
        <div className="prov-document-preview-shell">
          <div className="prov-document-preview-body">
            {isImage ? <img src={dataUrl} alt={documento.nombre || "Documento"} /> : null}
            {isPdf ? <iframe title={documento.nombre || "Documento PDF"} src={dataUrl} /> : null}
            {isCsv ? <CsvPreview documento={documento} /> : null}
            {isText ? <pre className="prov-document-text-preview">{decodeText(documento)}</pre> : null}
            {!isNativePreview ? <OfficePreview documento={documento} /> : null}
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}

export function DocumentoHistoryContent({ documento, onPreview }) {
  const events = documento?.historial || [];
  return (
    <>
      {documento ? (
        <div className="prov-document-history">
          <div className="prov-document-history-hero">
            <DocumentHistoryHero documento={documento} eventCount={events.length} />
          </div>

          {events.length ? (
            <div className="prov-document-timeline">
              {events.map((event) => {
                const beforeRows = parseDetail(event.detalleAnterior);
                const afterRows = parseDetail(event.detalleNuevo);
                const previousDoc = historyDocument(event, "anterior");
                const nextDoc = historyDocument(event, "nuevo");
                const hasVersionFiles = previousDoc.archivoBase64 || nextDoc.archivoBase64;
                return (
                  <article key={event.idProveedorDocumentoHistorial || `${event.tipoEvento}-${event.fechaEvento}`} className="prov-document-history-event">
                    <span className="prov-document-history-icon">
                      <i className={event.tipoEvento === "NUEVA_VERSION" ? "pi pi-refresh" : event.tipoEvento === "ARCHIVADO" ? "pi pi-folder" : "pi pi-history"} />
                    </span>
                    <div>
                      <div className="prov-document-history-title">
                        <div>
                          <strong>{enumText(event.tipoEvento)}</strong>
                          <span>{formatDateTime(event.fechaEvento || event.fechaCreacion)} - {event.usuarioCreacion || "Sistema"}</span>
                        </div>
                        <span className="prov-document-event-pill">{enumText(event.tipoEvento)}</span>
                      </div>
                      {event.descripcion ? <p>{event.descripcion}</p> : null}
                      {beforeRows.length || afterRows.length ? (
                        <div className="prov-document-diff">
                          <div>
                            <small>Antes</small>
                            {beforeRows.length ? beforeRows.map((row) => (
                              <span key={`before-${row.label}-${row.value}`}><b>{row.label}</b>{row.value || "--"}</span>
                            )) : <em>Sin valor anterior</em>}
                          </div>
                          <div>
                            <small>Despues</small>
                            {afterRows.length ? afterRows.map((row) => (
                              <span key={`after-${row.label}-${row.value}`}><b>{row.label}</b>{row.value || "--"}</span>
                            )) : <em>Sin cambio detallado</em>}
                          </div>
                        </div>
                      ) : null}
                      {hasVersionFiles ? (
                        <div className="prov-document-version-files">
                          {previousDoc.archivoBase64 ? (
                            <div>
                              <small>Archivo anterior</small>
                              <FileMetaStrip documento={previousDoc} />
                              <div className="prov-document-version-actions">
                                <Button
                                  label="Vista previa"
                                  icon="pi pi-eye"
                                  className="prov-soft-btn prov-document-download-btn"
                                  onClick={() => onPreview(previousDoc)}
                                />
                                <Button
                                  label="Descargar anterior"
                                  icon="pi pi-download"
                                  className="prov-soft-btn prov-document-download-btn"
                                  onClick={() => downloadDocumento(previousDoc)}
                                />
                              </div>
                            </div>
                          ) : null}
                          {nextDoc.archivoBase64 ? (
                            <div>
                              <small>Archivo nuevo</small>
                              <FileMetaStrip documento={nextDoc} />
                              <div className="prov-document-version-actions">
                                <Button
                                  label="Vista previa"
                                  icon="pi pi-eye"
                                  className="prov-soft-btn prov-document-download-btn"
                                  onClick={() => onPreview(nextDoc)}
                                />
                                <Button
                                  label="Descargar nuevo"
                                  icon="pi pi-download"
                                  className="prov-soft-btn prov-document-download-btn"
                                  onClick={() => downloadDocumento(nextDoc)}
                                />
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <AdvancedEmpty text="Este documento aun no tiene historial registrado." />
          )}
        </div>
      ) : null}
    </>
  );
}

function DocumentoHistoryDialog({ documento, onHide, onPreview }) {
  return (
    <Dialog
      header="Historial del documento"
      visible={Boolean(documento)}
      onHide={onHide}
      modal
      draggable={false}
      dismissableMask
      focusOnShow={false}
      closeButtonProps={{ tabIndex: -1 }}
      className="prov-advanced-dialog prov-document-history-dialog"
      style={{ width: "min(70rem, calc(100vw - 2rem))" }}
    >
      <DocumentoHistoryContent documento={documento} onPreview={onPreview} />
    </Dialog>
  );
}

function DocumentoVersionDialog({
  item,
  form,
  errors,
  loading,
  fileInputRef,
  onPickFile,
  onFileChange,
  onChange,
  onCancel,
  onSave,
}) {
  return (
    <Dialog
      header="Nueva version del documento"
      visible={Boolean(item)}
      onHide={onCancel}
      modal
      draggable={false}
      dismissableMask
      focusOnShow={false}
      closeButtonProps={{ tabIndex: -1 }}
      className="prov-advanced-dialog prov-document-version-dialog"
      style={{ width: "min(46rem, calc(100vw - 2rem))" }}
      footer={
        <div className="prov-dialog-footer">
          <Button
            label="Cancelar"
            className="p-button-text prov-text-btn"
            onClick={onCancel}
            disabled={loading}
          />
          <Button
            label="Registrar version"
            icon="pi pi-check"
            className="prov-primary-btn"
            onClick={onSave}
            loading={loading}
          />
        </div>
      }
    >
      {item ? (
        <div className="prov-document-version-body">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FILES}
            className="prov-hidden-file"
            onChange={onFileChange}
          />
          {loading ? (
            <div className="prov-adv-sync">
              <i className="pi pi-spin pi-spinner" />
              Registrando nueva version...
            </div>
          ) : null}
          <div>
            <span className="prov-document-version-label">Version actual protegida</span>
            <FileMetaStrip documento={item} locked />
          </div>
          <div className={`prov-document-uploader ${errors.archivo ? "has-error" : ""}`}>
            <div>
              <FieldLabel required>Nuevo archivo</FieldLabel>
              <strong>{form.archivoNombre || "Selecciona la version firmada o corregida"}</strong>
              <small>PDF, imagen, Excel, Word, PowerPoint, CSV o texto - maximo 25 MB.</small>
            </div>
            <Button
              label={form.archivoBase64 ? "Cambiar seleccion" : "Seleccionar archivo"}
              icon="pi pi-upload"
              className="prov-soft-btn"
              onClick={onPickFile}
              disabled={loading}
            />
          </div>
          {errors.archivo ? <small className="prov-field-error">{errors.archivo}</small> : null}
          {form.archivoBase64 ? (
            <div className="prov-document-meta-readonly">
              <span>Formato <strong>{mimeLabel(form.mimeType)}</strong></span>
              <span>Tamano <strong>{bytesLabel(form.tamanoBytes)}</strong></span>
              <span>Registro <strong>Nueva version auditada</strong></span>
            </div>
          ) : null}
          <TextAreaField
            label="Motivo de la nueva version"
            value={form.motivo}
            onChange={(value) => onChange("motivo", value)}
            error={errors.motivo}
            required
            fieldKey="motivo"
            maxLength={DOCUMENTO_FIELD_LIMITS.motivo}
            placeholder="Ej. Se recibio contrato firmado por el proveedor; conservar version anterior como evidencia."
          />
        </div>
      ) : null}
    </Dialog>
  );
}

export function ProveedorDocumentoFormView({
  proveedor,
  item = null,
  showToast,
  onCancel,
  onSaved,
  onDirtyChange,
}) {
  const fileInputRef = useRef(null);
  const formRef = useRef(null);
  const [form, setForm] = useState(() => createDocumentoForm(item));
  const [initialSnapshot, setInitialSnapshot] = useState(() =>
    JSON.stringify(createDocumentoForm(item))
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const editing = Boolean(form?.idProveedorDocumento);

  useEffect(() => {
    const nextForm = createDocumentoForm(item);
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
    setForm((prev) => ({ ...prev, [field]: limitDocumentoValue(field, value) }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const readFileIntoForm = async (file) => {
    const mimeType = detectMime(file);
    if (!mimeType) {
      setErrors((prev) => ({ ...prev, archivo: "Formato no permitido." }));
      return;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      setErrors((prev) => ({ ...prev, archivo: "Maximo 25 MB." }));
      return;
    }

    try {
      const archivoBase64 = await fileToBase64(file);
      setForm((prev) => ({
        ...prev,
        archivoNombre: file.name,
        archivoBase64,
        mimeType,
        tamanoBytes: file.size,
      }));
      setErrors((prev) => ({ ...prev, archivo: "" }));
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        archivo: error.message || "No se pudo cargar el archivo.",
      }));
    }
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || editing) return;
    await readFileIntoForm(file);
  };

  const validate = () => {
    const nextErrors = {};
    if (!String(form.nombre || "").trim()) nextErrors.nombre = "El nombre es obligatorio.";
    if (!String(form.tipo || "").trim()) nextErrors.tipo = "Selecciona un tipo.";
    if (!editing && !form.archivoBase64) {
      nextErrors.archivo = "Selecciona el archivo del documento.";
    }
    if (!editing && form.tamanoBytes != null && Number(form.tamanoBytes) > MAX_DOCUMENT_BYTES) {
      nextErrors.archivo = "Maximo 25 MB.";
    }
    if (
      !editing &&
      form.mimeType &&
      !DOCUMENTO_MIME_OPTIONS.some((option) => option.value === form.mimeType)
    ) {
      nextErrors.archivo = "Formato no permitido.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      focusFirstDocumentFormError(formRef.current, nextErrors);
      return false;
    }
    return Object.keys(nextErrors).length === 0;
  };

  const save = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const response = await api.fetchApi(
        {},
        editing ? "PUT" : "POST",
        buildDocumentoPayload(form),
        getDocumentoUrl(proveedor.idProveedor, form.idProveedorDocumento)
      );
      const saved = await readApiPayload(response, "guardar documento");
      showToast?.(
        "success",
        "Documentos",
        editing ? "Documento actualizado correctamente." : "Documento agregado correctamente."
      );
      onDirtyChange?.(false);
      await onSaved?.(saved);
    } catch (error) {
      showToast?.("error", "Documentos", error?.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="prov-workspace-form prov-document-workspace-form" ref={formRef}>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FILES}
        className="prov-hidden-file"
        onChange={handleFile}
      />
      <div className="prov-form-grid prov-workspace-form-body">
        <TextField
          label="Nombre del documento"
          value={form.nombre}
          onChange={(value) => update("nombre", value)}
          error={errors.nombre}
          required
          fieldKey="nombre"
          maxLength={DOCUMENTO_FIELD_LIMITS.nombre}
          placeholder="Ej. Comodato enfriador Coca-Cola"
          autoFocus
        />
        <label className={`prov-field ${errors.tipo ? "has-error" : ""}`} data-field-key="tipo">
          <FieldLabel required>Tipo</FieldLabel>
          <Dropdown
            value={form.tipo}
            options={DOCUMENTO_TIPO_OPTIONS}
            onChange={(event) => update("tipo", event.value)}
            placeholder="Selecciona tipo"
            aria-invalid={errors.tipo ? "true" : undefined}
            aria-required
          />
          {errors.tipo ? <small className="prov-field-error">{errors.tipo}</small> : null}
        </label>

        {editing ? (
          <div className="prov-field-wide">
            <span className="prov-document-version-label">Archivo original protegido</span>
            <FileMetaStrip documento={form} locked />
            <p className="prov-document-lock-note">
              El archivo no se reemplaza desde edicion. Para una copia firmada o corregida usa
              Nueva version y quedara auditada.
            </p>
          </div>
        ) : (
          <>
            <div
              className={`prov-document-uploader prov-field-wide ${errors.archivo ? "has-error" : ""}`}
              data-field-key="archivo"
            >
              <div>
                <FieldLabel required>Archivo obligatorio</FieldLabel>
                <strong>{form.archivoNombre || "Sin archivo seleccionado"}</strong>
                <small>PDF, imagen, Excel, Word, PowerPoint, CSV o texto - maximo 25 MB.</small>
              </div>
              <Button
                label={form.archivoBase64 ? "Cambiar archivo" : "Seleccionar archivo"}
                icon="pi pi-upload"
                className="prov-soft-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
              />
            </div>
            {errors.archivo ? (
              <small className="prov-field-error prov-field-wide">{errors.archivo}</small>
            ) : null}
          </>
        )}

        <div className="prov-document-meta-readonly prov-field-wide">
          <span>Formato <strong>{mimeLabel(form.mimeType)}</strong></span>
          <span>Tamano <strong>{bytesLabel(form.tamanoBytes)}</strong></span>
          <span>
            Almacenamiento <strong>{form.archivoBase64 ? "Base de datos" : "Sin contenido cargado"}</strong>
          </span>
        </div>

        <TextAreaField
          label="Descripcion"
          value={form.descripcion}
          onChange={(value) => update("descripcion", value)}
          className="prov-field-wide"
          fieldKey="descripcion"
          maxLength={DOCUMENTO_FIELD_LIMITS.descripcion}
          placeholder="Ej. Contrato firmado, lista vigente o evidencia relacionada al proveedor."
        />
      </div>
      <AdvancedFormActions
        editing={editing}
        saving={saving}
        onCancel={onCancel}
        onSave={save}
        saveLabel={editing ? "Guardar documento" : "Agregar documento"}
        className="prov-workspace-editor-footer"
        editorStyle
      />
    </div>
  );
}

export default function ProveedorDocumentosSection({
  proveedor,
  items = [],
  onRefresh,
  showToast,
  highlightedDocumentoId,
  readOnly = false,
  onOpenForm,
  onOpenHistory,
}) {
  const fileInputRef = useRef(null);
  const versionFileInputRef = useRef(null);
  const inlineFormRef = useRef(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [documentFlow, setDocumentFlow] = useState(null);
  const [preview, setPreview] = useState(null);
  const [history, setHistory] = useState(null);
  const [versionItem, setVersionItem] = useState(null);
  const [versionForm, setVersionForm] = useState({
    motivo: "",
    archivoNombre: "",
    archivoBase64: "",
    mimeType: "",
    tamanoBytes: null,
  });
  const [versionErrors, setVersionErrors] = useState({});
  const [versionSaving, setVersionSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const editing = Boolean(form?.idProveedorDocumento);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: limitDocumentoValue(field, value) }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!String(form.nombre || "").trim()) nextErrors.nombre = "El nombre es obligatorio.";
    if (!String(form.tipo || "").trim()) nextErrors.tipo = "Selecciona un tipo.";
    if (!editing && !form.archivoBase64) nextErrors.archivo = "Selecciona el archivo del documento.";
    if (!editing && form.tamanoBytes != null && Number(form.tamanoBytes) > MAX_DOCUMENT_BYTES) {
      nextErrors.archivo = "Maximo 25 MB.";
    }
    if (!editing && form.mimeType && !DOCUMENTO_MIME_OPTIONS.some((option) => option.value === form.mimeType)) {
      nextErrors.archivo = "Formato no permitido.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      focusFirstDocumentFormError(inlineFormRef.current, nextErrors);
      return false;
    }
    return Object.keys(nextErrors).length === 0;
  };

  const validateVersion = () => {
    const nextErrors = {};
    if (!trim(versionForm.motivo)) nextErrors.motivo = "El motivo es obligatorio.";
    if (!versionForm.archivoBase64) nextErrors.archivo = "Selecciona el nuevo archivo.";
    if (versionForm.tamanoBytes != null && Number(versionForm.tamanoBytes) > MAX_DOCUMENT_BYTES) {
      nextErrors.archivo = "Maximo 25 MB.";
    }
    if (versionForm.mimeType && !DOCUMENTO_MIME_OPTIONS.some((option) => option.value === versionForm.mimeType)) {
      nextErrors.archivo = "Formato no permitido.";
    }
    setVersionErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const pickFile = () => {
    if (!editing) fileInputRef.current?.click();
  };

  const readFileInto = async (file, onSuccess, onError) => {
    const mimeType = detectMime(file);
    if (!mimeType) {
      onError("Formato no permitido.");
      return;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      onError("Maximo 25 MB.");
      return;
    }

    try {
      const archivoBase64 = await fileToBase64(file);
      onSuccess({
        archivoNombre: file.name,
        archivoBase64,
        mimeType,
        tamanoBytes: file.size,
      });
    } catch (error) {
      onError(error.message || "No se pudo cargar el archivo.");
    }
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || editing) return;
    await readFileInto(
      file,
      (fileState) => {
        setForm((prev) => ({ ...prev, ...fileState }));
        setErrors((prev) => ({ ...prev, archivo: "" }));
      },
      (message) => setErrors((prev) => ({ ...prev, archivo: message }))
    );
  };

  const handleVersionFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await readFileInto(
      file,
      (fileState) => {
        setVersionForm((prev) => ({ ...prev, ...fileState }));
        setVersionErrors((prev) => ({ ...prev, archivo: "" }));
      },
      (message) => setVersionErrors((prev) => ({ ...prev, archivo: message }))
    );
  };

  const save = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const response = await api.fetchApi(
        {},
        editing ? "PUT" : "POST",
        buildDocumentoPayload(form),
        getDocumentoUrl(proveedor.idProveedor, form.idProveedorDocumento)
      );
      await readApiPayload(response, "guardar documento");
      showToast("success", "Documentos", editing ? "Metadatos guardados." : "Documento guardado.");
      setForm(null);
      await onRefresh();
    } catch (error) {
      showToast("error", "Documentos", error?.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const saveVersion = async () => {
    if (!versionItem || !validateVersion()) return;

    setVersionSaving(true);
    try {
      const response = await api.fetchApi(
        {},
        "PUT",
        {
          motivo: trim(versionForm.motivo),
          archivoNombre: trim(versionForm.archivoNombre),
          archivoBase64: trim(versionForm.archivoBase64),
          mimeType: trim(versionForm.mimeType),
        },
        `${getDocumentoUrl(proveedor.idProveedor, versionItem.idProveedorDocumento)}/version`
      );
      await readApiPayload(response, "registrar nueva version");
      showToast("success", "Documentos", "Nueva version registrada.");
      setVersionItem(null);
      setVersionForm({ motivo: "", archivoNombre: "", archivoBase64: "", mimeType: "", tamanoBytes: null });
      await onRefresh();
    } catch (error) {
      showToast("error", "Documentos", error?.message || "No se pudo registrar la version.");
    } finally {
      setVersionSaving(false);
    }
  };

  const archiveDocumento = async (item) => {
    if (!item) return false;

    setSaving(true);
    try {
      const response = await api.fetchApi(
        {},
        "DELETE",
        undefined,
        getDocumentoUrl(proveedor.idProveedor, item.idProveedorDocumento)
      );
      await readApiPayload(response, "archivar documento");
      showToast("success", "Documentos", "Documento archivado como historico.");
      await onRefresh();
      return true;
    } catch (error) {
      showToast("error", "Documentos", error?.message || "No se pudo completar.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const changeDocumentoEstado = async (item, estadoDocumento, successMessage) => {
    if (!item) return false;

    setSaving(true);
    try {
      const response = await api.fetchApi(
        {},
        "PUT",
        buildDocumentoPayload({ ...createDocumentoForm(item), estadoDocumento }),
        getDocumentoUrl(proveedor.idProveedor, item.idProveedorDocumento)
      );
      await readApiPayload(response, "cambiar estado de documento");
      showToast("success", "Documentos", successMessage);
      await onRefresh();
      return true;
    } catch (error) {
      showToast("error", "Documentos", error?.message || "No se pudo cambiar el estado.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const openDocumentFlow = (item) => {
    if (readOnly) {
      showToast?.("info", "Proveedor archivado", "Los documentos quedan solo como historial.");
      return;
    }
    const selectedAction = documentoFlowDefaultAction(item);
    if (!selectedAction) return;
    setDocumentFlow({ item, selectedAction, archiveConfirmed: false });
  };

  const confirmDocumentFlow = async () => {
    if (!documentFlow?.item || !documentFlow.selectedAction) return;
    if (documentFlow.selectedAction === "archivar" && !documentFlow.archiveConfirmed) {
      showToast?.("warn", "Confirmacion requerida", "Confirma que el documento quedara como historial definitivo.");
      return;
    }

    let completed = false;
    if (documentFlow.selectedAction === "archivar") {
      completed = await archiveDocumento(documentFlow.item);
    } else if (documentFlow.selectedAction === "reactivar") {
      completed = await changeDocumentoEstado(documentFlow.item, "ACTIVO", "Documento reactivado.");
    } else {
      completed = await changeDocumentoEstado(documentFlow.item, "INACTIVO", "Documento inactivado.");
    }

    if (completed) setDocumentFlow(null);
  };

  const openVersion = (item) => {
    if (readOnly) {
      showToast?.("info", "Proveedor archivado", "Los documentos quedan solo como historial.");
      return;
    }
    if (documentoEstado(item) !== "ACTIVO") {
      showToast?.("info", "Documento sin operacion", "Reactiva el documento antes de registrar una nueva version.");
      return;
    }
    setVersionItem(item);
    setVersionErrors({});
    setVersionForm({ motivo: "", archivoNombre: "", archivoBase64: "", mimeType: "", tamanoBytes: null });
  };

  const openForm = (item = null) => {
    if (readOnly) {
      showToast?.("info", "Proveedor archivado", "Los documentos quedan solo como historial.");
      return;
    }
    if (item && documentoEstado(item) !== "ACTIVO") {
      showToast?.("info", "Documento sin operacion", "Solo los documentos activos pueden editarse.");
      return;
    }
    if (onOpenForm) {
      onOpenForm(item);
      return;
    }
    setForm(createDocumentoForm(item));
    setErrors({});
  };

  const documentFlowState = documentoEstado(documentFlow?.item);
  const documentFlowAction = documentFlow?.selectedAction || null;
  const documentFlowArchive = documentFlowAction === "archivar";
  const documentFlowConfirmDisabled =
    saving ||
    versionSaving ||
    !documentFlowAction ||
    documentFlowState === "ARCHIVADO" ||
    (documentFlowArchive && !documentFlow?.archiveConfirmed);

  return (
    <AdvancedSection
      title="Documentos"
      subtitle={
        readOnly
          ? "Consulta historica de contratos, comodatos, listas y evidencias."
          : "Contratos, comodatos, listas y evidencias guardados en base de datos."
      }
      icon="pi pi-file"
      addLabel="Agregar documento"
      addDisabled={saving || versionSaving}
      onAdd={readOnly ? null : () => openForm(null)}
    >
      {saving ? (
        <div className="prov-adv-sync">
          <i className="pi pi-spin pi-spinner" />
          Actualizando documentos...
        </div>
      ) : null}

      {form ? (
        <div className="prov-adv-form" ref={inlineFormRef}>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FILES}
            className="prov-hidden-file"
            onChange={handleFile}
          />
          <div className="prov-form-grid">
            <TextField
              label="Nombre del documento"
              value={form.nombre}
              onChange={(value) => update("nombre", value)}
              error={errors.nombre}
              required
              fieldKey="nombre"
              maxLength={DOCUMENTO_FIELD_LIMITS.nombre}
              placeholder="Ej. Comodato enfriador Coca-Cola"
            />
            <label className={`prov-field ${errors.tipo ? "has-error" : ""}`} data-field-key="tipo">
              <FieldLabel required>Tipo</FieldLabel>
              <Dropdown
                value={form.tipo}
                options={DOCUMENTO_TIPO_OPTIONS}
                onChange={(event) => update("tipo", event.value)}
                placeholder="Selecciona tipo"
                aria-invalid={errors.tipo ? "true" : undefined}
                aria-required
              />
              {errors.tipo ? <small className="prov-field-error">{errors.tipo}</small> : null}
            </label>

            {editing ? (
              <div className="prov-field-wide">
                <span className="prov-document-version-label">Archivo original protegido</span>
                <FileMetaStrip documento={form} locked />
                <p className="prov-document-lock-note">
                  El archivo no se reemplaza desde edicion. Para una copia firmada o corregida usa Nueva version y quedara auditada.
                </p>
              </div>
            ) : (
              <>
                <div
                  className={`prov-document-uploader prov-field-wide ${errors.archivo ? "has-error" : ""}`}
                  data-field-key="archivo"
                >
                  <div>
                    <FieldLabel required>Archivo obligatorio</FieldLabel>
                    <strong>{form.archivoNombre || "Sin archivo seleccionado"}</strong>
                    <small>PDF, imagen, Excel, Word, PowerPoint, CSV o texto - maximo 25 MB.</small>
                  </div>
                  <Button
                    label={form.archivoBase64 ? "Cambiar archivo" : "Seleccionar archivo"}
                    icon="pi pi-upload"
                    className="prov-soft-btn"
                    onClick={pickFile}
                    disabled={saving}
                  />
                </div>
                {errors.archivo ? <small className="prov-field-error prov-field-wide">{errors.archivo}</small> : null}
              </>
            )}

            <div className="prov-document-meta-readonly prov-field-wide">
              <span>Formato <strong>{mimeLabel(form.mimeType)}</strong></span>
              <span>Tamano <strong>{bytesLabel(form.tamanoBytes)}</strong></span>
              <span>Almacenamiento <strong>{form.archivoBase64 ? "Base de datos" : "Sin contenido cargado"}</strong></span>
            </div>

            <TextAreaField
              label="Descripcion"
              value={form.descripcion}
              onChange={(value) => update("descripcion", value)}
              className="prov-field-wide"
              fieldKey="descripcion"
              maxLength={DOCUMENTO_FIELD_LIMITS.descripcion}
              placeholder="Ej. Contrato firmado, lista vigente o evidencia relacionada al proveedor."
            />
          </div>
          <AdvancedFormActions
            editing={editing}
            saving={saving}
            onCancel={() => setForm(null)}
            onSave={save}
            saveLabel={editing ? "Guardar documento" : "Agregar documento"}
          />
        </div>
      ) : null}

      {items.length ? (
        <div className="prov-adv-card-grid">
          {items.map((item) => {
            const storedInDb = Boolean(item.archivoBase64);
            const estado = documentoEstado(item);
            const isActive = estado === "ACTIVO";
            const isInactive = estado === "INACTIVO";
            const isArchived = estado === "ARCHIVADO";
            const isHighlighted =
              highlightedDocumentoId &&
              Number(highlightedDocumentoId) === Number(item.idProveedorDocumento);
            return (
              <article
                className={`prov-adv-card prov-document-card ${
                  isHighlighted ? "is-highlighted" : ""
                }`}
                key={item.idProveedorDocumento || item.nombre}
              >
                <div className="prov-adv-card-main">
                  <div>
                    <strong title={item.nombre}>{item.nombre || "Documento"}</strong>
                    <span title={item.archivoNombre || item.rutaDocumento}>
                      {enumText(item.tipo)} - {item.archivoNombre || (storedInDb ? "Base de datos" : "Sin archivo")}
                    </span>
                  </div>
                  <Tag
                    value={enumText(item.estadoDocumento)}
                    severity={documentoEstadoSeverity(item)}
                    className="prov-state-tag"
                  />
                </div>
                <div className="prov-adv-meta-grid">
                  <span className="prov-document-format-cell">
                    Formato
                    <FormatBadge documento={item} />
                  </span>
                  <span>Tamano <strong>{bytesLabel(item.tamanoBytes)}</strong></span>
                  <span>Historial <strong>{item.historial?.length || 0} eventos</strong></span>
                  <span>Descripcion <strong>{item.descripcion || "--"}</strong></span>
                </div>
                <AdvancedCardActions
                  onEdit={readOnly || !isActive ? null : () => openForm(item)}
                  disabled={saving || versionSaving}
                  extra={
                    <>
                      {isActive && !readOnly ? (
                        <>
                          <Button
                            icon="pi pi-eye"
                            className="prov-row-action"
                            onClick={() => setPreview(item)}
                            disabled={!storedInDb || saving || versionSaving}
                            aria-label="Vista previa"
                            tooltip="Vista previa"
                            tooltipOptions={{ position: "top", className: "prov-action-tooltip" }}
                          />
                          <Button
                            icon="pi pi-download"
                            className="prov-row-action"
                            onClick={() => downloadDocumento(item)}
                            disabled={!canDownload(item) || saving || versionSaving}
                            aria-label="Descargar"
                            tooltip="Descargar"
                            tooltipOptions={{ position: "top", className: "prov-action-tooltip" }}
                          />
                          <Button
                            icon="pi pi-refresh"
                            className="prov-row-action"
                            onClick={() => openVersion(item)}
                            disabled={!storedInDb || saving || versionSaving}
                            aria-label="Nueva version"
                            tooltip="Nueva version"
                            tooltipOptions={{ position: "top", className: "prov-action-tooltip" }}
                          />
                        </>
                      ) : null}
                      {!readOnly && !isArchived ? (
                        <Button
                          icon="pi pi-trash"
                          className="prov-row-action is-danger"
                          onClick={() => openDocumentFlow(item)}
                          disabled={saving || versionSaving}
                          aria-label="Opciones de estado del documento"
                          tooltip={isInactive ? "Activar o archivar" : "Desactivar o archivar"}
                          tooltipOptions={{ position: "top", className: "prov-action-tooltip" }}
                        />
                      ) : null}
                      <Button
                        icon="pi pi-history"
                        className="prov-row-action"
                        onClick={() => (onOpenHistory ? onOpenHistory(item) : setHistory(item))}
                        disabled={saving || versionSaving}
                        aria-label="Historial"
                        tooltip="Historial"
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
        <AdvancedEmpty text="Sin documentos. Registra contratos, comodatos, listas o evidencias del proveedor." />
      )}

      <DocumentoPreviewDialog documento={preview} onHide={() => setPreview(null)} />
      {!onOpenHistory ? (
        <DocumentoHistoryDialog
          documento={history}
          onHide={() => setHistory(null)}
          onPreview={setPreview}
        />
      ) : null}
      <DocumentoVersionDialog
        item={versionItem}
        form={versionForm}
        errors={versionErrors}
        loading={versionSaving}
        fileInputRef={versionFileInputRef}
        onPickFile={() => versionFileInputRef.current?.click()}
        onFileChange={handleVersionFile}
        onChange={(field, value) => {
          setVersionForm((prev) => ({ ...prev, [field]: limitDocumentoValue(field, value) }));
          setVersionErrors((prev) => ({ ...prev, [field]: "" }));
        }}
        onCancel={() => {
          setVersionItem(null);
          setVersionErrors({});
          setVersionForm({ motivo: "", archivoNombre: "", archivoBase64: "", mimeType: "", tamanoBytes: null });
        }}
        onSave={saveVersion}
      />

      <ModalSurface
        visible={Boolean(documentFlow)}
        title="Opciones del documento"
        onHide={() => {
          if (!saving && !versionSaving) setDocumentFlow(null);
        }}
        size="small"
        className="prov-confirm-dialog"
        footer={
          <>
            <Button
              label="Cancelar"
              className="p-button-text prov-text-btn"
              onClick={() => setDocumentFlow(null)}
              disabled={saving || versionSaving}
            />
            <Button
              label={documentoFlowConfirmLabel(documentFlowAction)}
              icon={documentoFlowConfirmIcon(documentFlowAction)}
              className={documentFlowArchive ? "prov-danger-btn" : "prov-primary-btn"}
              onClick={confirmDocumentFlow}
              loading={saving}
              disabled={documentFlowConfirmDisabled}
            />
          </>
        }
      >
        <div className="prov-safe-action-body">
          <div className={`prov-delete-policy ${documentFlowArchive ? "is-danger" : ""}`}>
            <i className={documentoFlowConfirmIcon(documentFlowAction)} />
            <div>
              <strong>
                {documentFlowArchive
                  ? "Archivar documento"
                  : documentFlowAction === "reactivar"
                    ? "Activar documento"
                    : "Desactivar documento"}
              </strong>
              <p>{documentoFlowSummary(documentFlow?.item, documentFlowAction)}</p>
            </div>
          </div>

          <div className="prov-removal-options">
            {documentFlowState === "ACTIVO" ? (
              <button
                type="button"
                className={documentFlowAction === "desactivar" ? "is-selected" : ""}
                onClick={() => setDocumentFlow((prev) => ({ ...prev, selectedAction: "desactivar", archiveConfirmed: false }))}
              >
                <i className="pi pi-pause" />
                <span>
                  <strong>Desactivar</strong>
                  <small>Pausa temporal</small>
                </span>
              </button>
            ) : null}
            {documentFlowState === "INACTIVO" ? (
              <button
                type="button"
                className={documentFlowAction === "reactivar" ? "is-selected" : ""}
                onClick={() => setDocumentFlow((prev) => ({ ...prev, selectedAction: "reactivar", archiveConfirmed: false }))}
              >
                <i className="pi pi-play" />
                <span>
                  <strong>Activar</strong>
                  <small>Vuelve al flujo</small>
                </span>
              </button>
            ) : null}
            {documentFlowState !== "ARCHIVADO" ? (
              <button
                type="button"
                className={`is-danger ${documentFlowArchive ? "is-selected" : ""}`}
                onClick={() => setDocumentFlow((prev) => ({ ...prev, selectedAction: "archivar", archiveConfirmed: false }))}
              >
                <i className="pi pi-folder" />
                <span>
                  <strong>Archivar</strong>
                  <small>Historial definitivo</small>
                </span>
              </button>
            ) : null}
          </div>

          {documentFlowArchive ? (
            <label className="prov-archive-confirm">
              <span>
                <i className="pi pi-exclamation-triangle" />
              </span>
              <div>
                <strong>No se podra usar este documento.</strong>
                <small>No podras editarlo, descargarlo, versionarlo ni reactivarlo.</small>
                <em>
                  <input
                    type="checkbox"
                    checked={Boolean(documentFlow?.archiveConfirmed)}
                    onChange={(event) =>
                      setDocumentFlow((prev) => ({ ...prev, archiveConfirmed: event.target.checked }))
                    }
                  />
                  Confirmo que este documento quedara como historial definitivo.
                </em>
              </div>
            </label>
          ) : null}
        </div>
      </ModalSurface>
    </AdvancedSection>
  );
}
