import React, { useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "primereact/sidebar";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";

import "../../style/components/Inventario/ModalAgregarProducto.css";

const clampInt = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
};

const toMoney = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, n);
};

const sumLotes = (lotes) =>
  Array.isArray(lotes) ? lotes.reduce((s, l) => s + (Number(l?.cantidad) || 0), 0) : 0;

const computeEstado = (stock, critico, bajo) => {
  const s = Number(stock) || 0;
  const c = Number(critico) || 0;
  const b = Number(bajo) || 0;
  if (s <= 0) return "AGOTADO";
  if (s <= c) return "CRITICO";
  if (s <= b) return "BAJO";
  return "OPTIMO";
};

const newEmptyForm = () => ({
  sku: "",
  nombre: "",
  descripcion: "",
  direccion: "",
  categoria: null,
  proveedor: null,
  almacen: null,
  unidad: null,
  precioCompra: 0,
  precioVenta: 0,
  esPesaje: false,
  umbrales: { critico: 5, bajo: 12 },
  activo: true,
  imagen: "https://via.placeholder.com/120x120.png?text=Producto",
  lotes: [],
  stock: 0,
  updatedAt: new Date(),
});

export default function ModalAgregarProducto({
  open,
  onHide,
  onCreate,
  categoriasOptions = [],
  proveedoresOptions = [],
  almacenesOptions = [],
  unidadesOptions = [],
}) {
  const toast = useRef(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(newEmptyForm());
  const [dirty, setDirty] = useState(false);
  const [editingLote, setEditingLote] = useState(null);
  const [askClose, setAskClose] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(newEmptyForm());
    setDirty(false);
    setEditingLote(null);
    setAskClose(false);
  }, [open]);

  const stockCalc = useMemo(() => sumLotes(form.lotes), [form.lotes]);

  const estado = useMemo(() => {
    const c = form.umbrales?.critico ?? 5;
    const b = form.umbrales?.bajo ?? 12;
    return computeEstado(stockCalc, c, b);
  }, [stockCalc, form.umbrales]);

  const profit = useMemo(() => {
    const buy = Number(form.precioCompra) || 0;
    const sell = Number(form.precioVenta) || 0;
    return sell - buy;
  }, [form.precioCompra, form.precioVenta]);

  const margin = useMemo(() => {
    const sell = Number(form.precioVenta) || 0;
    if (sell <= 0) return 0;
    return (profit / sell) * 100;
  }, [profit, form.precioVenta]);

  const showToast = (severity, summary, detail) =>
    toast.current?.show({ severity, summary, detail, life: 2400 });

  const patch = (p) => {
    setForm((f) => ({ ...f, ...p, updatedAt: new Date() }));
    setDirty(true);
  };

  const patchUmbral = (p) => {
    setForm((f) => ({
      ...f,
      umbrales: { ...(f.umbrales || {}), ...p },
      updatedAt: new Date(),
    }));
    setDirty(true);
  };

  const normalizeSku = (sku) =>
    String(sku || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "-")
      .replace(/[^A-Z0-9-_]/g, "");

  const suggestSku = () => {
    const base = (form.nombre || "PROD")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "-")
      .replace(/[^A-Z0-9-_]/g, "")
      .slice(0, 10);
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    const rand = 1000 + (values[0] % 9000);
    return `${base || "PROD"}-${rand}`;
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("error", "Error", "Selecciona una imagen válida.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => patch({ imagen: event.target.result });
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const nombre = String(form.nombre || "").trim();
    const sku = normalizeSku(form.sku);
    const cat = form.categoria;
    const prov = form.proveedor;
    const alm = form.almacen;
    const unidad = form.unidad;

    const pc = toMoney(form.precioCompra);
    const pv = toMoney(form.precioVenta);

    const c = clampInt(form.umbrales?.critico ?? 5);
    const b = clampInt(form.umbrales?.bajo ?? 12);

    if (!nombre) return { ok: false, msg: "El nombre es obligatorio." };
    if (!sku) return { ok: false, msg: "El SKU es obligatorio." };
    if (!cat) return { ok: false, msg: "La categoría es obligatoria." };
    if (!prov) return { ok: false, msg: "El proveedor es obligatorio." };
    if (!alm) return { ok: false, msg: "El almacén es obligatorio." };
    if (!unidad) return { ok: false, msg: "La unidad de medida es obligatoria." };

    if (pv <= 0) return { ok: false, msg: "El precio de venta debe ser mayor a 0." };
    if (pc < 0) return { ok: false, msg: "El precio de compra no puede ser negativo." };
    if (pc > pv) return { ok: false, msg: "El precio de compra no puede ser mayor al de venta." };
    if (b < c) return { ok: false, msg: "El umbral bajo debe ser mayor o igual al crítico." };

    return { ok: true, sku, nombre, cat, prov, alm, unidad, pc, pv, c, b };
  };

  const addLote = () => {
    const nuevo = { id: `tmp-${Date.now()}`, cantidad: 1, fechaExp: null, ubicacion: "" };
    patch({ lotes: [...(form.lotes || []), nuevo] });
    setEditingLote(nuevo);
  };

  const removeLote = (l) => {
    patch({ lotes: (form.lotes || []).filter((x) => x.id !== l.id) });
    if (editingLote?.id === l.id) setEditingLote(null);
  };

  const saveLote = () => {
    if (!editingLote) return;
    const qty = clampInt(editingLote.cantidad);
    if (qty <= 0) {
      showToast("warn", "Lote", "La cantidad debe ser mayor a 0.");
      return;
    }
    const next = [...(form.lotes || [])];
    const idx = next.findIndex((x) => x.id === editingLote.id);
    if (idx >= 0) {
      next[idx] = {
        ...editingLote,
        cantidad: qty,
        ubicacion: String(editingLote.ubicacion || "").trim(),
        fechaExp: editingLote.fechaExp ? new Date(editingLote.fechaExp) : null,
      };
    }
    patch({ lotes: next });
    setEditingLote(null);
  };

  const tryHide = () => {
    if (dirty) {
      setAskClose(true);
      return;
    }
    onHide?.();
  };

  const handleCreate = () => {
    const v = validate();
    if (!v.ok) {
      showToast("error", "Validación", v.msg);
      return;
    }

    const nuevo = {
      nombreProducto: String(form.nombre).trim(),
      codigoBarras: normalizeSku(form.sku),
      descripcion: String(form.descripcion || form.nombre).trim(),
      direccion: String(form.direccion || "ND").trim(),
      esPesaje: form.esPesaje || false,
      estatus: form.activo !== false,
      imagen: form.imagen || null,
      categoria: form.categoria,
      proveedor: form.proveedor,
      almacen: form.almacen,
      unidad: form.unidad,
      precioVenta: toMoney(form.precioVenta),
      precioCompra: toMoney(form.precioCompra),
      umbrales: {
        critico: clampInt(form.umbrales?.critico ?? 5),
        bajo: clampInt(form.umbrales?.bajo ?? 12),
      },
      lotes: (form.lotes || []).map((l) => ({
        cantidad: clampInt(l.cantidad),
        ubicacion: String(l.ubicacion || "").trim(),
        fechaExp: l.fechaExp ? new Date(l.fechaExp) : null,
      })),
      stock: stockCalc,
    };

    onCreate?.(nuevo);
  };

  const customHeader = (
    <div className="prov-editor-header">
      <span>NUEVO PRODUCTO</span>
      <strong>Alta en Inventario</strong>
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
        <div className="prov-editor">
          <div className="prov-editor-body">

            {/* SECCIÓN 1: DATOS BÁSICOS */}
            <div className="prov-editor-section">
              <div className="prov-editor-section-head">
                <span>1</span>
                <h3>Información General</h3>
              </div>

              <div className="prov-form-grid">
                <div className="prov-field">
                  <span>SKU / Código *</span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <InputText
                      value={form.sku}
                      onChange={(e) => patch({ sku: e.target.value })}
                      placeholder="Ej: ABC-123"
                    />
                    <Button
                      type="button"
                      icon="pi pi-sparkles"
                      className="prov-icon-btn"
                      onClick={() => patch({ sku: suggestSku() })}
                      tooltip="Generar SKU"
                    />
                  </div>
                </div>

                <div className="prov-field">
                  <span>Nombre del producto *</span>
                  <InputText
                    value={form.nombre}
                    onChange={(e) => patch({ nombre: e.target.value })}
                    placeholder="Ej: Coca Cola 600ml"
                  />
                </div>

                <div className="prov-field">
                  <span>Categoría *</span>
                  <Dropdown
                    value={form.categoria}
                    onChange={(e) => patch({ categoria: e.value })}
                    options={categoriasOptions}
                    placeholder="Seleccionar"
                    className="prov-filter-panel"
                  />
                </div>

                <div className="prov-field">
                  <span>Proveedor *</span>
                  <Dropdown
                    value={form.proveedor}
                    onChange={(e) => patch({ proveedor: e.value })}
                    options={proveedoresOptions}
                    placeholder="Seleccionar"
                    filter
                    className="prov-filter-panel"
                  />
                </div>

                <div className="prov-field">
                  <span>Almacén Base *</span>
                  <Dropdown
                    value={form.almacen}
                    onChange={(e) => patch({ almacen: e.value })}
                    options={almacenesOptions}
                    placeholder="Seleccionar"
                  />
                </div>

                <div className="prov-field">
                  <span>Unidad de Medida *</span>
                  <Dropdown
                    value={form.unidad}
                    onChange={(e) => patch({ unidad: e.value })}
                    options={unidadesOptions}
                    placeholder="Seleccionar"
                  />
                </div>

                <div className="prov-field prov-field-wide">
                  <span>Descripción</span>
                  <InputText
                    value={form.descripcion}
                    onChange={(e) => patch({ descripcion: e.target.value })}
                    placeholder="Detalles opcionales del producto..."
                  />
                </div>

                <div className="prov-field prov-field-wide" style={{ flexDirection: "row", gap: "16px", alignItems: "center" }}>
                  <label className="prov-check-chip is-selected">
                    <Checkbox
                      checked={!!form.activo}
                      onChange={(e) => patch({ activo: e.checked })}
                    />
                    <span>Producto Activo</span>
                  </label>

                  <label className="prov-check-chip">
                    <Checkbox
                      checked={!!form.esPesaje}
                      onChange={(e) => patch({ esPesaje: e.checked })}
                    />
                    <span>Venta a granel / pesaje</span>
                  </label>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: PRECIOS Y MÁRGENES */}
            <div className="prov-editor-section">
              <div className="prov-editor-section-head">
                <span>2</span>
                <h3>Precios y Márgenes</h3>
              </div>

              <div className="prov-form-grid">
                <div className="prov-field">
                  <span>Precio Compra ($)</span>
                  <InputNumber
                    value={form.precioCompra}
                    onValueChange={(e) => patch({ precioCompra: toMoney(e.value) })}
                    mode="currency"
                    currency="MXN"
                    min={0}
                  />
                </div>

                <div className="prov-field">
                  <span>Precio Venta ($) *</span>
                  <InputNumber
                    value={form.precioVenta}
                    onValueChange={(e) => patch({ precioVenta: toMoney(e.value) })}
                    mode="currency"
                    currency="MXN"
                    min={0}
                  />
                </div>
              </div>

              <div className="prov-chip-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginTop: "12px" }}>
                <span className="prov-muted-pill">Utilidad: <b>${profit.toFixed(2)}</b></span>
                <span className="prov-muted-pill">Margen: <b>{margin.toFixed(1)}%</b></span>
                <span className={profit < 0 ? "prov-asset-status is-warning" : "prov-asset-status is-active"}>
                  {profit < 0 ? "Pérdida Detectada" : "Margen Válido"}
                </span>
              </div>
            </div>

            {/* SECCIÓN 3: UMBRALES DE ALERTA */}
            <div className="prov-editor-section">
              <div className="prov-editor-section-head">
                <span>3</span>
                <h3>Alertas de Stock</h3>
              </div>

              <div className="prov-form-grid">
                <div className="prov-field">
                  <span>Umbral Crítico</span>
                  <InputNumber
                    value={form.umbrales?.critico ?? 5}
                    onValueChange={(e) => patchUmbral({ critico: clampInt(e.value) })}
                    showButtons
                    min={0}
                  />
                </div>

                <div className="prov-field">
                  <span>Umbral Bajo</span>
                  <InputNumber
                    value={form.umbrales?.bajo ?? 12}
                    onValueChange={(e) => patchUmbral({ bajo: clampInt(e.value) })}
                    showButtons
                    min={0}
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 4: CONTROL DE LOTES */}
            <div className="prov-editor-section">
              <div className="prov-editor-section-head" style={{ justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span>4</span>
                  <h3>Lotes e Inventario Inicial</h3>
                </div>
                <Button
                  type="button"
                  label="Agregar Lote"
                  icon="pi pi-plus"
                  className="prov-soft-btn"
                  onClick={addLote}
                />
              </div>

              <DataTable value={form.lotes} size="small" className="prov-table" emptyMessage="Sin lotes registrados.">
                <Column field="cantidad" header="Cantidad" body={(l) => <strong>{l.cantidad}</strong>} />
                <Column
                  field="fechaExp"
                  header="Caducidad"
                  body={(l) => (l.fechaExp ? new Date(l.fechaExp).toLocaleDateString("es-MX") : "—")}
                />
                <Column field="ubicacion" header="Ubicación" />
                <Column
                  header="Acciones"
                  body={(row) => (
                    <div className="prov-row-actions">
                      <Button
                        type="button"
                        icon="pi pi-pencil"
                        className="prov-row-action"
                        onClick={() => setEditingLote({ ...row })}
                      />
                      <Button
                        type="button"
                        icon="pi pi-trash"
                        className="prov-row-action prov-menu-danger"
                        onClick={() => removeLote(row)}
                      />
                    </div>
                  )}
                />
              </DataTable>

              {editingLote && (
                <div className="prov-adv-form" style={{ marginTop: "12px" }}>
                  <div className="prov-form-grid">
                    <div className="prov-field">
                      <span>Cantidad</span>
                      <InputNumber
                        value={editingLote.cantidad}
                        onValueChange={(e) => setEditingLote((x) => ({ ...x, cantidad: clampInt(e.value) }))}
                        min={1}
                      />
                    </div>
                    <div className="prov-field">
                      <span>Fecha Caducidad</span>
                      <Calendar
                        value={editingLote.fechaExp ? new Date(editingLote.fechaExp) : null}
                        onChange={(e) => setEditingLote((x) => ({ ...x, fechaExp: e.value }))}
                        showIcon
                        dateFormat="dd/mm/yy"
                      />
                    </div>
                    <div className="prov-field prov-field-wide">
                      <span>Ubicación</span>
                      <InputText
                        value={editingLote.ubicacion}
                        onChange={(e) => setEditingLote((x) => ({ ...x, ubicacion: e.target.value }))}
                        placeholder="Pasillo / Anaquel..."
                      />
                    </div>
                  </div>
                  <div className="prov-adv-form-actions">
                    <Button type="button" label="Guardar Lote" className="prov-primary-btn" onClick={saveLote} />
                    <Button type="button" label="Cancelar" className="prov-soft-btn" onClick={() => setEditingLote(null)} />
                  </div>
                </div>
              )}
            </div>

          </div>

    {/* FOOTER DEL SIDEBAR CON CALLBACKS FUNCIONALES */}
          <div className="prov-editor-footer">
            <Button 
              type="button"
              label="Cancelar" 
              className="prov-soft-btn" 
              onClick={() => onHide?.()} 
            />
            <Button 
              type="button"
              label="Crear Producto" 
              icon="pi pi-check" 
              className="prov-primary-btn" 
              onClick={handleCreate} 
            />
          </div>
        </div>
      </Sidebar>
    </>
  );
}