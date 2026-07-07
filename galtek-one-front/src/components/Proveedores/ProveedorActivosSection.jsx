import React, { useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Tag } from "primereact/tag";
import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";
import { formatDate, moneyOrDash, readApiPayload } from "./proveedoresUtils";
import {
  ACTIVO_ESTADO_OPTIONS,
  ACTIVO_TIPO_OPTIONS,
  buildActivoPayload,
  createActivoForm,
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

function getActivoUrl(idProveedor, idActivo) {
  return idActivo
    ? `${endpoints.proveedores}/${idProveedor}/activos/${idActivo}`
    : `${endpoints.proveedores}/${idProveedor}/activos`;
}

export default function ProveedorActivosSection({
  proveedor,
  items,
  onRefresh,
  showToast,
}) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
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
      await readApiPayload(response, "guardar activo");
      showToast("success", "Activos prestados", "Activo guardado.");
      setForm(null);
      await onRefresh();
    } catch (error) {
      showToast("error", "Activos prestados", error?.message || "No se pudo guardar.");
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
        getActivoUrl(proveedor.idProveedor, confirm.idProveedorActivo)
      );
      await readApiPayload(response, "desactivar activo");
      showToast("success", "Activos prestados", "Activo desactivado.");
      setConfirm(null);
      await onRefresh();
    } catch (error) {
      showToast("error", "Activos prestados", error?.message || "No se pudo completar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdvancedSection
      title="Activos prestados"
      subtitle="Equipo, exhibidores y condiciones de prestamo."
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
            />
            <label className="prov-field">
              <span>Tipo</span>
              <Dropdown
                value={form.tipo}
                options={ACTIVO_TIPO_OPTIONS}
                onChange={(event) => update("tipo", event.value)}
              />
            </label>
            <TextField
              label="Numero de serie"
              value={form.numeroSerie}
              onChange={(value) => update("numeroSerie", value)}
            />
            <TextField
              label="Fecha de entrega"
              type="date"
              value={form.fechaEntrega}
              onChange={(value) => update("fechaEntrega", value)}
            />
            <TextField
              label="Estado fisico"
              value={form.estadoFisico}
              onChange={(value) => update("estadoFisico", value)}
              placeholder="Bueno, rayado, requiere revision"
            />
            <TextField
              label="Ubicacion en tienda"
              value={form.ubicacionTienda}
              onChange={(value) => update("ubicacionTienda", value)}
              placeholder="Entrada, pasillo frio, caja"
            />
            <label className="prov-field">
              <span>Deposito o garantia</span>
              <InputNumber
                value={form.depositoGarantia}
                onValueChange={(event) => update("depositoGarantia", event.value)}
                mode="currency"
                currency="MXN"
                locale="es-MX"
                min={0}
              />
              {errors.depositoGarantia ? <small className="prov-field-error">{errors.depositoGarantia}</small> : null}
            </label>
            <label className="prov-field">
              <span>Estado</span>
              <Dropdown
                value={form.estadoActivoPrestado}
                options={ACTIVO_ESTADO_OPTIONS}
                onChange={(event) => update("estadoActivoPrestado", event.value)}
              />
            </label>
            <TextAreaField
              label="Condiciones del prestamo"
              value={form.condicionesPrestamo}
              onChange={(value) => update("condicionesPrestamo", value)}
              className="prov-field-wide"
            />
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
            <article className="prov-adv-card" key={item.idProveedorActivo || item.nombre}>
              <div className="prov-adv-card-main">
                <div>
                  <strong title={item.nombre}>{item.nombre || "Activo prestado"}</strong>
                  <span title={item.numeroSerie || item.ubicacionTienda}>
                    {enumText(item.tipo)}
                    {item.numeroSerie ? ` - Serie ${item.numeroSerie}` : ""}
                  </span>
                </div>
                <Tag
                  value={enumText(item.estadoActivoPrestado)}
                  severity={item.estadoActivoPrestado === "EN_TIENDA" ? "success" : "warning"}
                  className="prov-state-tag"
                />
              </div>
              <div className="prov-adv-meta-grid">
                <span>Entrega <strong>{formatDate(item.fechaEntrega)}</strong></span>
                <span>Ubicacion <strong>{item.ubicacionTienda || "--"}</strong></span>
                <span>Garantia <strong>{moneyOrDash(item.depositoGarantia)}</strong></span>
                <span>Estado fisico <strong>{item.estadoFisico || "--"}</strong></span>
              </div>
              <AdvancedCardActions
                onEdit={() => {
                  setForm(createActivoForm(item));
                  setErrors({});
                }}
                onArchive={() => setConfirm(item)}
                archiveLabel="Desactivar activo"
              />
            </article>
          ))}
        </div>
      ) : (
        <AdvancedEmpty text="Sin activos prestados. Registra enfriadores, stands, lonas o equipo del proveedor." />
      )}

      <ConfirmActionDialog
        visible={Boolean(confirm)}
        title="Desactivar activo"
        detail="El activo se conserva en el historial del proveedor y dejara de contarse como activo vigente."
        loading={saving}
        onCancel={() => setConfirm(null)}
        onConfirm={archive}
      />
    </AdvancedSection>
  );
}
