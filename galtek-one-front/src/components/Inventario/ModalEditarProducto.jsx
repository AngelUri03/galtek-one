import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
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
  categoriasOptions = [], // [{label,value}]
  proveedoresOptions = [], // [{label,value}]
  unidadesOptions = [], // [{label,value}]
  almacenesOptions = [], // [{label,value}]
}) {
  const toast = useRef(null);

  const [form, setForm] = useState(null);
  const [dirty, setDirty] = useState(false);

  // Lote editor (panel interno)
  const [editingLote, setEditingLote] = useState(null);

  useEffect(() => {
    if (!open) return;
    const cloned = deepClone(producto);
    setForm(cloned);
    setEditingLote(null);
    setDirty(false);
  }, [open, producto]);

  const update = (patch) => {
    setForm((f) => {
      const next = { ...f, ...patch };
      return next;
    });
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
      showToast("warn", "Validación", "SKU es requerido.");
      return false;
    }
    if (!nombre) {
      showToast("warn", "Validación", "Nombre es requerido.");
      return false;
    }

    const pc = Number(form?.precioCompra);
    const pv = Number(form?.precioVenta);
    if (!Number.isFinite(pc) || pc < 0) {
      showToast("warn", "Validación", "Precio compra inválido.");
      return false;
    }
    if (!Number.isFinite(pv) || pv < 0) {
      showToast("warn", "Validación", "Precio venta inválido.");
      return false;
    }
    if (Number.isFinite(pc) && Number.isFinite(pv) && pv < pc) {
      showToast("warn", "Validación", "Precio venta no debería ser menor a compra.");
      return false;
    }

    return true;
  };

  const handleSave = () => {
    if (!form) return;
    if (!validate()) return;

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

  const header = (
    <div className="medp-header">
      <div className="medp-header-left">
        <div className="medp-title">Editar producto</div>
        <div className="medp-subtitle" title={form?.nombre || ""}>
          {form?.nombre || "—"}
        </div>
      </div>

      <div className="medp-header-right">
        <span className="medp-chip medp-chip--soft">
          Stock: <b className="tabular">{Number(stockTotal) || 0}</b>
        </span>
        <span className={`medp-chip ${form?.activo ? "medp-chip--activo" : "medp-chip--inactivo"}`}>
          {form?.activo ? "Activo" : "Descontinuado"}
        </span>
        {dirty ? <span className="medp-chip medp-chip--dirty">Cambios sin guardar</span> : null}
      </div>
    </div>
  );

  const footer = (
    <div className="medp-footer">
      <Button className="medp-btn medp-btn--cancel" label="Cerrar" onClick={onHide} />
      <div className="grow" />
      <Button
        className="medp-btn medp-btn--ghost"
        icon="pi pi-undo"
        label="Revertir"
        disabled={!dirty}
        onClick={() => {
          setForm(deepClone(producto));
          setEditingLote(null);
          setDirty(false);
          showToast("info", "Edición", "Cambios revertidos.");
        }}
      />
      <Button
        className="medp-btn medp-btn--apply"
        icon="pi pi-save"
        label="Guardar"
        disabled={!form}
        onClick={handleSave}
      />
    </div>
  );

  if (!open) return null;

  return (
    <>
      <Toast ref={toast} />

      <Dialog
        header={header}
        visible={open}
        onHide={onHide}
        modal
        closable
        draggable={false}
        className="medp-dialog"
        footer={footer}
      >
        {!form ? (
          <div className="medp-loading">Cargando…</div>
        ) : (
          <div className="medp-wrap">
            {/* TOP GRID */}
            <div className="medp-grid">
              {/* Card: Identidad */}
              <div className="medp-card medp-card--identity">
                <div className="medp-cardTitle">
                  Identidad
                  <span className="medp-cardHint">Datos base del producto</span>
                </div>

                <div className="medp-formGrid">
                  <div className="medp-field">
                    <label>SKU</label>
                    <InputText
                      className="medp-control medp-it"
                      value={form.sku || ""}
                      onChange={(e) => update({ sku: e.target.value })}
                      placeholder="Ej: SKU-001"
                    />
                  </div>

                  <div className="medp-field medp-field--wide">
                    <label>Nombre</label>
                    <InputText
                      className="medp-control medp-it"
                      value={form.nombre || ""}
                      onChange={(e) => update({ nombre: e.target.value })}
                      placeholder="Nombre del producto"
                    />
                  </div>

                  <div className="medp-field">
                    <label>Categoría</label>
                    <Dropdown
                      className="medp-control medp-dd"
                      value={form.categoriaId ?? null}
                      onChange={(e) => update({ categoriaId: e.value })}
                      options={categoriasOptions}
                      placeholder="Selecciona categoría"
                      panelClassName="medp-dd-panel"
                      emptyMessage="No hay categorías disponibles"
                    />
                  </div>

                  <div className="medp-field">
                    <label>Proveedor</label>
                    <Dropdown
                      className="medp-control medp-dd"
                      value={form.proveedorId ?? null}
                      onChange={(e) => update({ proveedorId: e.value })}
                      options={proveedoresOptions}
                      placeholder="Selecciona proveedor"
                      panelClassName="medp-dd-panel"
                      filter
                      emptyMessage="No hay proveedores disponibles"
                    />
                  </div>

                  <div className="medp-field">
                    <label>Unidad</label>
                    <Dropdown
                      className="medp-control medp-dd"
                      value={form.unidadId ?? null}
                      onChange={(e) => update({ unidadId: e.value })}
                      options={unidadesOptions}
                      placeholder="Selecciona unidad"
                      panelClassName="medp-dd-panel"
                      emptyMessage="No hay unidades disponibles"
                    />
                  </div>

                  <div className="medp-field medp-field--toggle">
                    <label>Estado</label>
                    <div className="medp-toggleRow">
                      <Checkbox
                        inputId="medp-activo"
                        checked={!!form.activo}
                        onChange={(e) => update({ activo: e.checked })}
                      />
                      <label htmlFor="medp-activo" className="medp-toggleLabel">
                        {form.activo ? "Activo" : "Descontinuado"}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card: Precios */}
              <div className="medp-card medp-card--pricing">
                <div className="medp-cardTitle">
                  Precios
                  <span className="medp-cardHint">Compra / Venta</span>
                </div>

                <div className="medp-formGrid medp-formGrid--pricing">
                  <div className="medp-field">
                    <label>Precio compra</label>
                    <InputNumber
                      className="medp-control medp-num"
                      value={form.precioCompra}
                      onValueChange={(e) => update({ precioCompra: e.value ?? 0 })}
                      mode="decimal"
                      min={0}
                      maxFractionDigits={2}
                      placeholder="0.00"
                      showButtons
                    />
                  </div>

                  <div className="medp-field">
                    <label>Precio venta</label>
                    <InputNumber
                      className="medp-control medp-num"
                      value={form.precioVenta}
                      onValueChange={(e) => update({ precioVenta: e.value ?? 0 })}
                      mode="decimal"
                      min={0}
                      maxFractionDigits={2}
                      placeholder="0.00"
                      showButtons
                    />
                  </div>

                  <div className="medp-field medp-field--wide">
                    <div className="medp-pricePreview">
                      <div className="medp-priceLine">
                        <span className="medp-muted">Compra</span>
                        <b className="tabular">{formatMoney(form.precioCompra)}</b>
                      </div>
                      <div className="medp-priceLine">
                        <span className="medp-muted">Venta</span>
                        <b className="tabular">{formatMoney(form.precioVenta)}</b>
                      </div>
                      <div className="medp-priceLine medp-priceLine--profit">
                        <span className="medp-muted">Margen</span>
                        <b className="tabular">
                          {(() => {
                            const pc = Number(form.precioCompra);
                            const pv = Number(form.precioVenta);
                            if (!Number.isFinite(pc) || !Number.isFinite(pv)) return "—";
                            return formatMoney(pv - pc);
                          })()}
                        </b>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

                {/* Glass overlay para el sheet */}
                {editingLote ? <div className="medp-loteSheet-backdrop" onClick={() => setEditingLote(null)} /> : null}
              </div>
            </div>
        )}
      </Dialog>
    </>
  );
}