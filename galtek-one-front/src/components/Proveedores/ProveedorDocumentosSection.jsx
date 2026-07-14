import React, { useRef, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";
import { readApiPayload } from "./proveedoresUtils";
import {
  DOCUMENTO_ESTADO_OPTIONS,
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
  ConfirmActionDialog,
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

function DocumentoPreviewDialog({ documento, onHide }) {
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
          <div className="prov-document-preview-toolbar">
            <FileMetaStrip documento={documento} locked />
            <Button
              label="Descargar"
              icon="pi pi-download"
              className="prov-soft-btn prov-document-download-btn"
              onClick={() => downloadDocumento(documento)}
              disabled={!canDownload(documento)}
            />
          </div>
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

function DocumentoHistoryDialog({ documento, onHide, onPreview }) {
  const events = documento?.historial || [];
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
                      <i className={event.tipoEvento === "NUEVA_VERSION" ? "pi pi-refresh" : event.tipoEvento === "ARCHIVADO" ? "pi pi-ban" : "pi pi-history"} />
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
              <span>Nuevo archivo</span>
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
            placeholder="Ej. Se recibio contrato firmado por el proveedor; conservar version anterior como evidencia."
          />
          {errors.motivo ? <small className="prov-field-error">{errors.motivo}</small> : null}
        </div>
      ) : null}
    </Dialog>
  );
}

export default function ProveedorDocumentosSection({
  proveedor,
  items = [],
  onRefresh,
  showToast,
}) {
  const fileInputRef = useRef(null);
  const versionFileInputRef = useRef(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
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
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!String(form.nombre || "").trim()) nextErrors.nombre = "El nombre es obligatorio.";
    if (!editing && !form.archivoBase64) nextErrors.archivo = "Selecciona el archivo del documento.";
    if (!editing && form.tamanoBytes != null && Number(form.tamanoBytes) > MAX_DOCUMENT_BYTES) {
      nextErrors.archivo = "Maximo 25 MB.";
    }
    if (!editing && form.mimeType && !DOCUMENTO_MIME_OPTIONS.some((option) => option.value === form.mimeType)) {
      nextErrors.archivo = "Formato no permitido.";
    }
    setErrors(nextErrors);
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

  const archive = async () => {
    if (!confirm) return;

    setSaving(true);
    try {
      const response = await api.fetchApi(
        {},
        "DELETE",
        undefined,
        getDocumentoUrl(proveedor.idProveedor, confirm.idProveedorDocumento)
      );
      await readApiPayload(response, "archivar documento");
      showToast("success", "Documentos", "Documento archivado.");
      setConfirm(null);
      await onRefresh();
    } catch (error) {
      showToast("error", "Documentos", error?.message || "No se pudo completar.");
    } finally {
      setSaving(false);
    }
  };

  const restore = async (item) => {
    if (!item) return;

    setSaving(true);
    try {
      const response = await api.fetchApi(
        {},
        "PUT",
        buildDocumentoPayload({ ...createDocumentoForm(item), estadoDocumento: "ACTIVO" }),
        getDocumentoUrl(proveedor.idProveedor, item.idProveedorDocumento)
      );
      await readApiPayload(response, "desarchivar documento");
      showToast("success", "Documentos", "Documento restaurado.");
      await onRefresh();
    } catch (error) {
      showToast("error", "Documentos", error?.message || "No se pudo restaurar.");
    } finally {
      setSaving(false);
    }
  };

  const openVersion = (item) => {
    setVersionItem(item);
    setVersionErrors({});
    setVersionForm({ motivo: "", archivoNombre: "", archivoBase64: "", mimeType: "", tamanoBytes: null });
  };

  return (
    <AdvancedSection
      title="Documentos"
      subtitle="Contratos, comodatos, listas y evidencias guardados en base de datos."
      icon="pi pi-file"
      addLabel="Agregar documento"
      addDisabled={saving || versionSaving}
      onAdd={() => {
        setForm(createDocumentoForm());
        setErrors({});
      }}
    >
      {saving ? (
        <div className="prov-adv-sync">
          <i className="pi pi-spin pi-spinner" />
          Actualizando documentos...
        </div>
      ) : null}

      {form ? (
        <div className="prov-adv-form">
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
              placeholder="Ej. Comodato enfriador Coca-Cola"
            />
            <label className="prov-field">
              <span>Tipo</span>
              <Dropdown
                value={form.tipo}
                options={DOCUMENTO_TIPO_OPTIONS}
                onChange={(event) => update("tipo", event.value)}
              />
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
                <div className={`prov-document-uploader prov-field-wide ${errors.archivo ? "has-error" : ""}`}>
                  <div>
                    <span>Archivo obligatorio</span>
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

            <label className="prov-field">
              <span>Estado</span>
              <Dropdown
                value={form.estadoDocumento}
                options={DOCUMENTO_ESTADO_OPTIONS}
                onChange={(event) => update("estadoDocumento", event.value)}
              />
            </label>
            <TextAreaField
              label="Descripcion"
              value={form.descripcion}
              onChange={(value) => update("descripcion", value)}
              className="prov-field-wide"
              placeholder="Ej. Contrato firmado, lista vigente o evidencia relacionada al proveedor."
            />
          </div>
          <AdvancedFormActions
            editing={editing}
            saving={saving}
            onCancel={() => setForm(null)}
            onSave={save}
          />
        </div>
      ) : null}

      {items.length ? (
        <div className="prov-adv-card-grid">
          {items.map((item) => {
            const storedInDb = Boolean(item.archivoBase64);
            const isArchived = String(item.estadoDocumento || "").toUpperCase() === "ARCHIVADO";
            return (
              <article className="prov-adv-card prov-document-card" key={item.idProveedorDocumento || item.nombre}>
                <div className="prov-adv-card-main">
                  <div>
                    <strong title={item.nombre}>{item.nombre || "Documento"}</strong>
                    <span title={item.archivoNombre || item.rutaDocumento}>
                      {enumText(item.tipo)} - {item.archivoNombre || (storedInDb ? "Base de datos" : "Sin archivo")}
                    </span>
                  </div>
                  <Tag
                    value={enumText(item.estadoDocumento)}
                    severity={item.estadoDocumento === "ACTIVO" ? "success" : "secondary"}
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
                  onEdit={() => {
                    setForm(createDocumentoForm(item));
                    setErrors({});
                  }}
                  onArchive={isArchived ? null : () => setConfirm(item)}
                  archiveLabel="Archivar documento"
                  disabled={saving || versionSaving}
                  extra={
                    <>
                      <Button
                        icon="pi pi-eye"
                        className="prov-row-action"
                        onClick={() => setPreview(item)}
                        disabled={!storedInDb || saving || versionSaving}
                        aria-label="Vista previa"
                        tooltip="Vista previa"
                        tooltipOptions={{ position: "top" }}
                      />
                      <Button
                        icon="pi pi-download"
                        className="prov-row-action"
                        onClick={() => downloadDocumento(item)}
                        disabled={!canDownload(item) || saving || versionSaving}
                        aria-label="Descargar"
                        tooltip="Descargar"
                        tooltipOptions={{ position: "top" }}
                      />
                      <Button
                        icon="pi pi-refresh"
                        className="prov-row-action"
                        onClick={() => openVersion(item)}
                        disabled={!storedInDb || saving || versionSaving}
                        aria-label="Nueva version"
                        tooltip="Nueva version"
                        tooltipOptions={{ position: "top" }}
                      />
                      <Button
                        icon="pi pi-history"
                        className="prov-row-action"
                        onClick={() => setHistory(item)}
                        disabled={saving || versionSaving}
                        aria-label="Historial"
                        tooltip="Historial"
                        tooltipOptions={{ position: "top" }}
                      />
                      {isArchived ? (
                        <Button
                          icon="pi pi-undo"
                          className="prov-row-action"
                          onClick={() => restore(item)}
                          disabled={saving || versionSaving}
                          aria-label="Restaurar documento"
                          tooltip="Restaurar documento"
                          tooltipOptions={{ position: "top" }}
                        />
                      ) : null}
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
      <DocumentoHistoryDialog
        documento={history}
        onHide={() => setHistory(null)}
        onPreview={setPreview}
      />
      <DocumentoVersionDialog
        item={versionItem}
        form={versionForm}
        errors={versionErrors}
        loading={versionSaving}
        fileInputRef={versionFileInputRef}
        onPickFile={() => versionFileInputRef.current?.click()}
        onFileChange={handleVersionFile}
        onChange={(field, value) => {
          setVersionForm((prev) => ({ ...prev, [field]: value }));
          setVersionErrors((prev) => ({ ...prev, [field]: "" }));
        }}
        onCancel={() => {
          setVersionItem(null);
          setVersionErrors({});
          setVersionForm({ motivo: "", archivoNombre: "", archivoBase64: "", mimeType: "", tamanoBytes: null });
        }}
        onSave={saveVersion}
      />

      <ConfirmActionDialog
        visible={Boolean(confirm)}
        title="Archivar documento"
        detail="El documento quedara archivado y se conservara como historial del proveedor."
        loading={saving}
        onCancel={() => setConfirm(null)}
        onConfirm={archive}
      />
    </AdvancedSection>
  );
}
