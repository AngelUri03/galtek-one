import React, { useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "primereact/sidebar";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Toast } from "primereact/toast";

import "../../style/components/Inventario/ModalEditarProducto.css";

const deepClone = (obj) => (obj ? JSON.parse(JSON.stringify(obj)) : null);

const stockFromLotes = (lotes) =>
  Array.isArray(lotes)
    ? lotes.reduce((sum, l) => sum + (Number(l?.cantidad) || 0), 0)
    : 0;

const formatMoney = (v) => {
  const n = Number(v);
  if (Number.isNaN(n)) return "—";
  return `$${n.toFixed(2)}`;
};

export default function ModalEditarProducto({
  open,
  producto,
  onHide,
  onSave,
  categoriasOptions = [],
  proveedoresOptions = [],
  unidadesOptions = [],
  almacenesOptions = [],
}) {
  const toast = useRef(null);
  const [form, setForm] = useState(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!open) return;
    const cloned = deepClone(producto);
    setForm(cloned);
    setDirty(false);
  }, [open, producto]);

  const update = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setDirty(true);
  };

  const stockTotal = useMemo(() => {
    if (!form) return 0;
    return form.stock ?? stockFromLotes(form.lotes);
  }, [form]);

  const showToast = (severity, summary, detail) => {
    toast.current?.show({ severity, summary, detail, life: 2000 });
  };

  const validate = () => {
    const sku = (form?.sku || "").trim();
    const nombre = (form?.nombre || "").trim();

    if (!sku) {
      showToast("warn", "Validación", "El SKU es requerido.");
      return false;
    }
    if (!nombre) {
      showToast("warn", "Validación", "El nombre es requerido.");
      return false;
    }

    const pc = Number(form?.precioCompra);
    const pv = Number(form?.precioVenta);
    if (!Number.isFinite(pc) || pc < 0) {
      showToast("warn", "Validación", "Precio de compra inválido.");
      return false;
    }
    if (!Number.isFinite(pv) || pv <= 0) {
      showToast("warn", "Validación", "El precio de venta debe ser mayor a 0.");
      return false;
    }
    if (pv < pc) {
      showToast("warn", "Validación", "El precio de venta no debe ser menor al de compra.");
      return false;
    }

    return true;
  };

  const handleSave = () => {
    if (!form || !validate()) return;

    const lotes = Array.isArray(form.lotes) ? form.lotes : [];
    const stock = stockFromLotes(lotes);

    const payload = {
      ...form,
      sku: form.sku?.trim(),
      nombre: form.nombre?.trim(),
      categoriaId: form.categoriaId,
      proveedorId: form.proveedorId,
      unidadId: form.unidadId,
      lotes,
      stock,
    };

    onSave?.(payload);
    setDirty(false);
  };

  const customHeader = (
    <div className="prov-editor-header">
      <span>EDICIÓN DE PRODUCTO</span>
      <strong>{form?.nombre || "Cargando..."}</strong>
    </div>
  );

  return (
    <>
      <Toast ref={toast} />

      <Sidebar
        visible={open}
        position="right"
        onHide={() => onHide?.()}
        header={customHeader}
        className="prov-editor-sidebar p-sidebar-md"
        dismissable={false}
      >
        {!form ? (
          <div className="prov-editor-loading">Cargando producto…</div>
        ) : (
          <div className="prov-editor">
            <div className="prov-editor-body">
              {/* STATUS BAR */}
              <div className="prov-chip-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                <span className="prov-muted-pill">Stock: <b>{stockTotal}</b></span>
                <span className={form.activo ? "prov-asset-status is-active" : "prov-asset-status is-inactive"}>
                  {form.activo ? "Activo" : "Descontinuado"}
                </span>
                {dirty && <span className="prov-asset-status is-warning">Con Cambios</span>}
              </div>

              {/* SECCIÓN 1: IDENTIDAD */}
              <div className="prov-editor-section">
                <div className="prov-editor-section-head">
                  <span>1</span>
                  <h3>Identidad del Producto</h3>
                </div>

                <div className="prov-form-grid">
                  <div className="prov-field">
                    <span>SKU / Código *</span>
                    <InputText
                      value={form.sku || ""}
                      onChange={(e) => update({ sku: e.target.value })}
                      placeholder="SKU-001"
                    />
                  </div>

                  <div className="prov-field">
                    <span>Nombre *</span>
                    <InputText
                      value={form.nombre || ""}
                      onChange={(e) => update({ nombre: e.target.value })}
                      placeholder="Nombre del producto"
                    />
                  </div>

                  <div className="prov-field">
                    <span>Categoría</span>
                    <Dropdown
                      value={form.categoriaId ?? null}
                      onChange={(e) => update({ categoriaId: e.value })}
                      options={categoriasOptions}
                      placeholder="Seleccionar"
                    />
                  </div>

                  <div className="prov-field">
                    <span>Proveedor</span>
                    <Dropdown
                      value={form.proveedorId ?? null}
                      onChange={(e) => update({ proveedorId: e.value })}
                      options={proveedoresOptions}
                      placeholder="Seleccionar"
                      filter
                    />
                  </div>

                  <div className="prov-field">
                    <span>Unidad de Medida</span>
                    <Dropdown
                      value={form.unidadId ?? null}
                      onChange={(e) => update({ unidadId: e.value })}
                      options={unidadesOptions}
                      placeholder="Seleccionar"
                    />
                  </div>

                  <div className="prov-field" style={{ alignSelf: "end" }}>
                    <label className="prov-check-chip is-selected" style={{ height: "40px" }}>
                      <Checkbox
                        checked={!!form.activo}
                        onChange={(e) => update({ activo: e.checked })}
                      />
                      <span>Estatus Activo</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: PRECIOS */}
              <div className="prov-editor-section">
                <div className="prov-editor-section-head">
                  <span>2</span>
                  <h3>Estructura de Precios</h3>
                </div>

                <div className="prov-form-grid">
                  <div className="prov-field">
                    <span>Precio Compra ($)</span>
                    <InputNumber
                      value={form.precioCompra}
                      onValueChange={(e) => update({ precioCompra: e.value ?? 0 })}
                      mode="currency"
                      currency="MXN"
                      min={0}
                    />
                  </div>

                  <div className="prov-field">
                    <span>Precio Venta ($) *</span>
                    <InputNumber
                      value={form.precioVenta}
                      onValueChange={(e) => update({ precioVenta: e.value ?? 0 })}
                      mode="currency"
                      currency="MXN"
                      min={0}
                    />
                  </div>
                </div>

                <div className="prov-adv-form" style={{ marginTop: "12px" }}>
                  <div className="prov-detail-info-grid is-three">
                    <div className="prov-detail-info-item">
                      <span>Costo Compra</span>
                      <strong>{formatMoney(form.precioCompra)}</strong>
                    </div>
                    <div className="prov-detail-info-item">
                      <span>Precio Venta</span>
                      <strong>{formatMoney(form.precioVenta)}</strong>
                    </div>
                    <div className="prov-detail-info-item">
                      <span>Margen Bruto</span>
                      <strong style={{ color: "#0a7463" }}>
                        {formatMoney((Number(form.precioVenta) || 0) - (Number(form.precioCompra) || 0))}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="prov-editor-footer">
              <Button
                type="button"
                label="Revertir"
                icon="pi pi-undo"
                className="prov-soft-btn"
                disabled={!dirty}
                onClick={() => {
                  setForm(deepClone(producto));
                  setDirty(false);
                  showToast("info", "Edición", "Cambios revertidos.");
                }}
              />
              <Button type="button" label="Cancelar" className="prov-soft-btn" onClick={onHide} />
              <Button
                type="button"
                label="Guardar Cambios"
                icon="pi pi-check"
                className="prov-primary-btn"
                onClick={handleSave}
              />
            </div>
          </div>
        )}
      </Sidebar>
    </>
  );
}