import React, { useMemo, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";
import { formatDate, readApiPayload } from "./proveedoresUtils";
import {
  ACUERDO_ESTADO_OPTIONS,
  ACUERDO_TIPO_OPTIONS,
  buildAcuerdoPayload,
  createAcuerdoForm,
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

function getAcuerdoUrl(idProveedor, idAcuerdo) {
  return idAcuerdo
    ? `${endpoints.proveedores}/${idProveedor}/acuerdos/${idAcuerdo}`
    : `${endpoints.proveedores}/${idProveedor}/acuerdos`;
}

export default function ProveedorAcuerdosSection({
  proveedor,
  items,
  documentos,
  onRefresh,
  showToast,
}) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [errors, setErrors] = useState({});

  const editing = Boolean(form?.idProveedorAcuerdo);
  const documentoOptions = useMemo(
    () =>
      documentos.map((documento) => ({
        label: documento.nombre || "Documento",
        value: documento.idProveedorDocumento,
      })),
    [documentos]
  );

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!String(form.descripcion || "").trim()) {
      nextErrors.descripcion = "La descripcion es obligatoria.";
    }
    if (form.fechaInicio && form.fechaVigencia && form.fechaVigencia < form.fechaInicio) {
      nextErrors.fechaVigencia = "La vigencia no puede ser anterior al inicio.";
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
        buildAcuerdoPayload(form),
        getAcuerdoUrl(proveedor.idProveedor, form.idProveedorAcuerdo)
      );
      await readApiPayload(response, "guardar acuerdo");
      showToast("success", "Acuerdos", "Acuerdo guardado.");
      setForm(null);
      await onRefresh();
    } catch (error) {
      showToast("error", "Acuerdos", error?.message || "No se pudo guardar.");
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
        getAcuerdoUrl(proveedor.idProveedor, confirm.idProveedorAcuerdo)
      );
      await readApiPayload(response, "archivar acuerdo");
      showToast("success", "Acuerdos", "Acuerdo archivado.");
      setConfirm(null);
      await onRefresh();
    } catch (error) {
      showToast("error", "Acuerdos", error?.message || "No se pudo completar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdvancedSection
      title="Acuerdos comerciales"
      subtitle="Tratos importantes sin duplicar reportes ni compras."
      icon="pi pi-verified"
      addLabel="Agregar acuerdo"
      onAdd={() => {
        setForm(createAcuerdoForm());
        setErrors({});
      }}
    >
      {form ? (
        <div className="prov-adv-form">
          <div className="prov-form-grid">
            <label className="prov-field">
              <span>Tipo de acuerdo</span>
              <Dropdown
                value={form.tipo}
                options={ACUERDO_TIPO_OPTIONS}
                onChange={(event) => update("tipo", event.value)}
              />
            </label>
            <label className="prov-field">
              <span>Estado</span>
              <Dropdown
                value={form.estadoAcuerdo}
                options={ACUERDO_ESTADO_OPTIONS}
                onChange={(event) => update("estadoAcuerdo", event.value)}
              />
            </label>
            <TextField
              label="Fecha de inicio"
              type="date"
              value={form.fechaInicio}
              onChange={(value) => update("fechaInicio", value)}
            />
            <TextField
              label="Vigencia"
              type="date"
              value={form.fechaVigencia}
              onChange={(value) => update("fechaVigencia", value)}
              error={errors.fechaVigencia}
            />
            <label className="prov-field prov-field-wide">
              <span>Documento relacionado</span>
              <Dropdown
                value={form.idProveedorDocumento}
                options={documentoOptions}
                onChange={(event) => update("idProveedorDocumento", event.value)}
                showClear
                placeholder="Sin documento"
              />
            </label>
            <TextAreaField
              label="Descripcion"
              value={form.descripcion}
              onChange={(value) => update("descripcion", value)}
              className="prov-field-wide"
            />
            {errors.descripcion ? <small className="prov-field-error">{errors.descripcion}</small> : null}
            <TextAreaField
              label="Notas"
              value={form.notas}
              onChange={(value) => update("notas", value)}
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
            <article className="prov-adv-card" key={item.idProveedorAcuerdo || item.descripcion}>
              <div className="prov-adv-card-main">
                <div>
                  <strong title={item.descripcion}>{item.descripcion || "Acuerdo"}</strong>
                  <span>{enumText(item.tipo)}</span>
                </div>
                <Tag
                  value={enumText(item.estadoAcuerdo)}
                  severity={item.estadoAcuerdo === "ACTIVO" ? "success" : "secondary"}
                  className="prov-state-tag"
                />
              </div>
              <div className="prov-adv-meta-grid">
                <span>Inicio <strong>{formatDate(item.fechaInicio)}</strong></span>
                <span>Vigencia <strong>{formatDate(item.fechaVigencia)}</strong></span>
                <span>Documento <strong>{item.documentoRelacionado?.nombre || "--"}</strong></span>
                <span>Notas <strong>{item.notas || "--"}</strong></span>
              </div>
              <AdvancedCardActions
                onEdit={() => {
                  setForm(createAcuerdoForm(item));
                  setErrors({});
                }}
                onArchive={() => setConfirm(item)}
                archiveLabel="Archivar acuerdo"
              />
            </article>
          ))}
        </div>
      ) : (
        <AdvancedEmpty text="Sin acuerdos. Registra credito, cambios, descuentos, entregas o pedidos minimos." />
      )}

      <ConfirmActionDialog
        visible={Boolean(confirm)}
        title="Archivar acuerdo"
        detail="El acuerdo se conservara como historial y dejara de mostrarse como trato activo."
        loading={saving}
        onCancel={() => setConfirm(null)}
        onConfirm={archive}
      />
    </AdvancedSection>
  );
}
