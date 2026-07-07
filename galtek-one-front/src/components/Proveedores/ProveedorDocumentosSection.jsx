import React, { useMemo, useState } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
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

function getDocumentoUrl(idProveedor, idDocumento) {
  return idDocumento
    ? `${endpoints.proveedores}/${idProveedor}/documentos/${idDocumento}`
    : `${endpoints.proveedores}/${idProveedor}/documentos`;
}

function canOpen(ruta) {
  return /^https?:\/\//i.test(String(ruta || ""));
}

function bytesLabel(value) {
  if (!value) return "--";
  const mb = Number(value) / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.round(Number(value) / 1024)} KB`;
}

export default function ProveedorDocumentosSection({
  proveedor,
  items,
  activos,
  onRefresh,
  showToast,
}) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [errors, setErrors] = useState({});

  const editing = Boolean(form?.idProveedorDocumento);
  const activoOptions = useMemo(
    () =>
      activos.map((activo) => ({
        label: activo.nombre || "Activo prestado",
        value: activo.idProveedorActivo,
      })),
    [activos]
  );

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!String(form.nombre || "").trim()) nextErrors.nombre = "El nombre es obligatorio.";
    if (form.tamanoBytes != null && Number(form.tamanoBytes) > MAX_DOCUMENT_BYTES) {
      nextErrors.tamanoBytes = "Maximo 25 MB.";
    }
    if (form.tamanoBytes != null && Number(form.tamanoBytes) < 0) {
      nextErrors.tamanoBytes = "No puede ser negativo.";
    }
    if (
      form.mimeType &&
      !DOCUMENTO_MIME_OPTIONS.some((option) => option.value === form.mimeType)
    ) {
      nextErrors.mimeType = "Formato no permitido.";
    }
    setErrors(nextErrors);
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
      await readApiPayload(response, "guardar documento");
      showToast("success", "Documentos", "Documento guardado.");
      setForm(null);
      await onRefresh();
    } catch (error) {
      showToast("error", "Documentos", error?.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
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

  return (
    <AdvancedSection
      title="Documentos"
      subtitle="Contratos, comodatos, listas y evidencias por referencia persistente."
      icon="pi pi-file"
      addLabel="Agregar documento"
      onAdd={() => {
        setForm(createDocumentoForm());
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
            />
            <label className="prov-field">
              <span>Tipo</span>
              <Dropdown
                value={form.tipo}
                options={DOCUMENTO_TIPO_OPTIONS}
                onChange={(event) => update("tipo", event.value)}
              />
            </label>
            <TextField
              label="Ruta o URL persistente"
              value={form.rutaDocumento}
              onChange={(value) => update("rutaDocumento", value)}
              className="prov-field-wide"
            />
            <label className="prov-field">
              <span>Formato</span>
              <Dropdown
                value={form.mimeType}
                options={DOCUMENTO_MIME_OPTIONS}
                onChange={(event) => update("mimeType", event.value)}
                showClear
                placeholder="Sin definir"
              />
              {errors.mimeType ? <small className="prov-field-error">{errors.mimeType}</small> : null}
            </label>
            <label className="prov-field">
              <span>Tamano</span>
              <InputNumber
                value={form.tamanoBytes}
                onValueChange={(event) => update("tamanoBytes", event.value)}
                min={0}
                suffix=" bytes"
              />
              {errors.tamanoBytes ? <small className="prov-field-error">{errors.tamanoBytes}</small> : null}
            </label>
            <label className="prov-field">
              <span>Activo relacionado</span>
              <Dropdown
                value={form.idProveedorActivo}
                options={activoOptions}
                onChange={(event) => update("idProveedorActivo", event.value)}
                showClear
                placeholder="Sin activo"
              />
            </label>
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
          {items.map((item) => (
            <article className="prov-adv-card" key={item.idProveedorDocumento || item.nombre}>
              <div className="prov-adv-card-main">
                <div>
                  <strong title={item.nombre}>{item.nombre || "Documento"}</strong>
                  <span title={item.rutaDocumento}>{enumText(item.tipo)} - {item.rutaDocumento || "Sin ruta"}</span>
                </div>
                <Tag
                  value={enumText(item.estadoDocumento)}
                  severity={item.estadoDocumento === "ACTIVO" ? "success" : "secondary"}
                  className="prov-state-tag"
                />
              </div>
              <div className="prov-adv-meta-grid">
                <span>Formato <strong>{item.mimeType || "--"}</strong></span>
                <span>Tamano <strong>{bytesLabel(item.tamanoBytes)}</strong></span>
                <span>Activo <strong>{item.activo?.nombre || "--"}</strong></span>
                <span>Descripcion <strong>{item.descripcion || "--"}</strong></span>
              </div>
              <AdvancedCardActions
                onEdit={() => {
                  setForm(createDocumentoForm(item));
                  setErrors({});
                }}
                onArchive={() => setConfirm(item)}
                archiveLabel="Archivar documento"
                extra={
                  canOpen(item.rutaDocumento) ? (
                    <Button
                      icon="pi pi-external-link"
                      className="prov-row-action"
                      onClick={() => window.open(item.rutaDocumento, "_blank", "noopener,noreferrer")}
                      aria-label="Abrir documento"
                      tooltip="Abrir documento"
                      tooltipOptions={{ position: "top" }}
                    />
                  ) : null
                }
              />
            </article>
          ))}
        </div>
      ) : (
        <AdvancedEmpty text="Sin documentos. Registra contratos, comodatos o referencias persistentes." />
      )}

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
