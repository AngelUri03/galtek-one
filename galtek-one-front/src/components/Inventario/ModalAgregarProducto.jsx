import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";
import { Message } from "primereact/message";
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
  Array.isArray(lotes)
    ? lotes.reduce((s, l) => s + (Number(l?.cantidad) || 0), 0)
    : 0;

const computeEstado = (stock, critico, bajo) => {
  const s = Number(stock) || 0;
  const c = Number(critico) || 0;
  const b = Number(bajo) || 0;

  if (s <= 0) return "AGOTADO";
  if (s <= c) return "CRITICO";
  if (s <= b) return "BAJO";
  return "OPTIMO";
};

const estadoMeta = (estado) => {
  const map = {
    AGOTADO: { label: "Agotado", cls: "map-chip map-chip--agotado" },
    CRITICO: { label: "Crítico", cls: "map-chip map-chip--critico" },
    BAJO: { label: "Bajo", cls: "map-chip map-chip--bajo" },
    OPTIMO: { label: "Óptimo", cls: "map-chip map-chip--optimo" },
  };
  return map[estado] || { label: estado, cls: "map-chip" };
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

  // Editor de lote
  const [editingLote, setEditingLote] = useState(null);

  // Confirm close (soft)
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

  const estadoChip = useMemo(() => estadoMeta(estado), [estado]);

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
      showToast("error", "Error", "Debes seleccionar un archivo de imagen válido.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      patch({ imagen: event.target.result });
    };
    reader.onerror = () => {
      showToast("error", "Error", "No se pudo leer la imagen.");
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (e) => {
    e.stopPropagation();
    patch({ imagen: "https://via.placeholder.com/120x120.png?text=Producto" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
    if (pc > pv) return { ok: false, msg: "El precio de compra no puede ser mayor que el precio de venta." };

    if (b < c) return { ok: false, msg: "El umbral 'bajo' debe ser mayor o igual a 'crítico'." };

    for (const l of form.lotes || []) {
      if ((Number(l.cantidad) || 0) <= 0)
        return { ok: false, msg: "Hay un lote con cantidad 0 o negativa. Corrígelo o elimínalo." };
    }

    return { ok: true, sku, nombre, cat, prov, alm, unidad, pc, pv, c, b };
  };

  const addLote = () => {
    const nuevo = {
      id: `tmp-${Date.now()}`,
      cantidad: 0,
      fechaExp: null,
      ubicacion: "",
    };
    const next = [...(form.lotes || []), nuevo];
    patch({ lotes: next });
    setEditingLote(nuevo);
  };

  const removeLote = (l) => {
    const next = (form.lotes || []).filter((x) => x.id !== l.id);
    patch({ lotes: next });
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

  const header = (
    <div className="map-header">
      <div className="map-header-left">
        <div className="map-title">Agregar producto</div>
        <div className="map-subtitle">Crea un producto con lotes y umbrales listos.</div>
      </div>

      <div className="map-header-right">
        <span className="map-chip map-chip--soft">
          Stock: <b className="tabular">{stockCalc}</b>
        </span>
        <span className={estadoChip.cls}>{estadoChip.label}</span>
        <span className="map-chip map-chip--soft">
          Margen:{" "}
          <b className="tabular">
            {Number.isFinite(margin) ? `${margin.toFixed(1)}%` : "0.0%"}
          </b>
        </span>
        {dirty ? <span className="map-chip map-chip--dirty">Cambios sin guardar</span> : null}
      </div>
    </div>
  );

  const tryHide = () => {
    if (dirty) {
      setAskClose(true);
      return;
    }
    onHide?.();
  };

  const footer = (
    <div className="map-footer">
      <Button className="map-btn map-btn--cancel" label="Cerrar" onClick={tryHide} />
      <div className="grow" />

      <Button
        className="map-btn map-btn--ghost"
        icon="pi pi-bolt"
        label="SKU sugerido"
        onClick={() => {
          const sku = normalizeSku(form.sku) ? normalizeSku(form.sku) : suggestSku();
          patch({ sku });
          showToast("info", "SKU", "SKU generado / normalizado.");
        }}
      />

      <Button
        className="map-btn map-btn--apply"
        icon="pi pi-check"
        label="Crear producto"
        onClick={() => {
          const v = validate();
          if (!v.ok) {
            showToast("error", "Validación", v.msg);
            return;
          }

          const nuevo = {
            // Campos exactos de ProductosEntity
            nombreProducto: String(form.nombre).trim(),
            codigoBarras: normalizeSku(form.sku),
            descripcion: String(form.descripcion || form.nombre).trim(),
            direccion: String(form.direccion || "ND").trim(),
            esPesaje: form.esPesaje || false,
            estatus: form.activo !== false,
            imagen: form.imagen || null,
            // FK como IDs (JPA los resuelve)
            categoria: form.categoria,   // idCategoria del Dropdown
            proveedor: form.proveedor,   // idProveedor del Dropdown
            almacen: form.almacen,       // idAlmacen del Dropdown
            unidad: form.unidad,         // idUnidad del Dropdown
            // Precios
            precioVenta: toMoney(form.precioVenta),
            precioCompra: toMoney(form.precioCompra),
            // Umbrales de alertas
            umbrales: {
              critico: clampInt(form.umbrales?.critico ?? 5),
              bajo: clampInt(form.umbrales?.bajo ?? 12),
            },
            // Lotes: idLote lo asigna el backend (AUTOINCREMENTAL)
            lotes: (form.lotes || []).map((l) => ({
              cantidad: clampInt(l.cantidad),
              ubicacion: String(l.ubicacion || "").trim(),
              fechaExp: l.fechaExp ? new Date(l.fechaExp) : null,
            })),
            stock: stockCalc,
          };

          onCreate?.(nuevo);
        }}
      />
    </div>
  );

  const loteActions = (row) => (
    <div className="map-rowActions">
      <Button
        icon="pi pi-pencil"
        className="map-iconBtn"
        tooltip="Editar"
        tooltipOptions={{ position: "top" }}
        onClick={() => setEditingLote({ ...row })}
      />
      <Button
        icon="pi pi-trash"
        className="map-iconBtn danger"
        tooltip="Eliminar"
        tooltipOptions={{ position: "top" }}
        onClick={() => removeLote(row)}
      />
    </div>
  );

  const lotesEmpty = (
    <div className="map-empty">
      <div className="map-emptyTitle">Sin lotes</div>
      <div className="map-emptyText">
        Puedes crear el producto sin lotes (stock 0) o agregar lotes para controlar caducidades.
      </div>
      <Button className="map-btn map-btn--ghost" icon="pi pi-plus" label="Agregar lote" onClick={addLote} />
    </div>
  );

  return (
    <>
      <Toast ref={toast} />

      <Dialog
        header={header}
        visible={open}
        onHide={tryHide}
        modal
        closable
        draggable={false}
        className="map-dialog"
        footer={footer}
      >
        <div className="map-wrap">
          {/* 2-column layout */}
          <div className="map-grid">
            {/* Left: campos */}
            <div className="map-col">
              <div className="map-card">
                <div className="map-cardTitle">
                  Datos del producto <span className="map-cardHint">Requeridos</span>
                </div>

                <div className="map-cardBody">
                  <div className="map-fields">
                    <div className="map-field">
                      <label className="map-label">SKU</label>
                      <div className="map-inline">
                        <InputText
                          className="map-control map-input"
                          value={form.sku}
                          onChange={(e) => {
                            patch({ sku: e.target.value });
                          }}
                          placeholder="Ej: ABC-123"
                        />
                        <Button
                          className="map-miniBtn"
                          icon="pi pi-sparkles"
                          tooltip="Generar SKU"
                          tooltipOptions={{ position: "top" }}
                          onClick={() => patch({ sku: suggestSku() })}
                        />
                      </div>
                      <div className="map-help">Se normaliza a MAYÚSCULAS, sin espacios raros.</div>
                    </div>

                    <div className="map-field">
                      <label className="map-label">Nombre</label>
                      <InputText
                        className="map-control map-input"
                        value={form.nombre}
                        onChange={(e) => patch({ nombre: e.target.value })}
                        placeholder="Ej: Coca Cola 600ml"
                      />
                    </div>

                    <div className="map-field">
                      <label className="map-label">Categoría</label>
                      <Dropdown
                        className="map-control map-dd"
                        value={form.categoria}
                        onChange={(e) => patch({ categoria: e.value })}
                        options={categoriasOptions}
                        placeholder="Selecciona"
                        panelClassName="map-dd-panel"
                        emptyMessage="No hay categorías disponibles"
                      />
                    </div>

                    <div className="map-field">
                      <label className="map-label">Proveedor</label>
                      <Dropdown
                        className="map-control map-dd"
                        value={form.proveedor}
                        onChange={(e) => patch({ proveedor: e.value })}
                        options={proveedoresOptions}
                        placeholder="Selecciona"
                        panelClassName="map-dd-panel"
                        filter
                        emptyMessage="No hay proveedores disponibles"
                      />
                    </div>

                    <div className="map-field">
                      <label className="map-label">Almacén Base</label>
                      <Dropdown
                        className="map-control map-dd"
                        value={form.almacen}
                        onChange={(e) => patch({ almacen: e.value })}
                        options={almacenesOptions}
                        placeholder="Selecciona almacén"
                        panelClassName="map-dd-panel"
                        emptyMessage="No hay almacenes disponibles"
                      />
                    </div>

                    <div className="map-field">
                      <label className="map-label">Unidad de medida</label>
                      <Dropdown
                        className="map-control map-dd"
                        value={form.unidad}
                        onChange={(e) => patch({ unidad: e.value })}
                        options={unidadesOptions}
                        placeholder="Selecciona unidad"
                        panelClassName="map-dd-panel"
                        emptyMessage="No hay unidades disponibles"
                      />
                    </div>

                    <div className="map-field map-field--row">
                      <div className="map-check">
                        <Checkbox
                          inputId="map-activo"
                          checked={!!form.activo}
                          onChange={(e) => patch({ activo: e.checked })}
                        />
                        <label htmlFor="map-activo">Producto activo</label>
                      </div>

                      <div className="map-check">
                        <Checkbox
                          inputId="map-esPesaje"
                          checked={!!form.esPesaje}
                          onChange={(e) => patch({ esPesaje: e.checked })}
                        />
                        <label htmlFor="map-esPesaje">Venta a granel / pesaje</label>
                      </div>

                      <div className="map-previewImg" onClick={() => fileInputRef.current?.click()} style={{ cursor: "pointer", position: "relative" }}>
                        <img src={form.imagen} alt="img" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />
                        <div className="map-previewImgHint">Cambiar Imagen</div>
                        {form.imagen && !form.imagen.includes("placeholder") && (
                           <Button
                             icon="pi pi-times"
                             className="p-button-rounded p-button-danger p-button-text p-button-sm"
                             style={{ position: "absolute", top: "-5px", right: "-5px", background: "white", padding: "0.2rem" }}
                             onClick={removeImage}
                             tooltip="Quitar imagen"
                           />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          style={{ display: "none" }}
                          onChange={handleImageChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="map-card">
                <div className="map-cardTitle">
                  Precios <span className="map-cardHint">Validación de margen</span>
                </div>

                <div className="map-cardBody">
                  <div className="map-fields map-fields--2">
                    <div className="map-field">
                      <label className="map-label">Precio compra</label>
                      <InputNumber
                        className="map-control map-num"
                        value={form.precioCompra}
                        onValueChange={(e) => patch({ precioCompra: toMoney(e.value) })}
                        mode="currency"
                        currency="MXN"
                        min={0}
                      />
                    </div>

                    <div className="map-field">
                      <label className="map-label">Precio venta</label>
                      <InputNumber
                        className="map-control map-num"
                        value={form.precioVenta}
                        onValueChange={(e) => patch({ precioVenta: toMoney(e.value) })}
                        mode="currency"
                        currency="MXN"
                        min={0}
                      />
                    </div>
                  </div>

                  <div className="map-metrics">
                    <span className="map-chip map-chip--soft">
                      Utilidad: <b className="tabular">${(Number.isFinite(profit) ? profit : 0).toFixed(2)}</b>
                    </span>
                    <span className="map-chip map-chip--soft">
                      Margen: <b className="tabular">{Number.isFinite(margin) ? `${margin.toFixed(1)}%` : "0.0%"}</b>
                    </span>
                    {profit < 0 ? (
                      <span className="map-chip map-chip--warn">Compra &gt; venta</span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="map-card">
                <div className="map-cardTitle">
                  Alertas de stock <span className="map-cardHint">Por producto</span>
                </div>

                <div className="map-cardBody">
                  <div className="map-fields map-fields--2">
                    <div className="map-field">
                      <label className="map-label">Umbral crítico</label>
                      <InputNumber
                        className="map-control map-num"
                        value={form.umbrales?.critico ?? 5}
                        onValueChange={(e) => patchUmbral({ critico: clampInt(e.value) })}
                        showButtons
                        min={0}
                      />
                    </div>

                    <div className="map-field">
                      <label className="map-label">Umbral bajo</label>
                      <InputNumber
                        className="map-control map-num"
                        value={form.umbrales?.bajo ?? 12}
                        onValueChange={(e) => patchUmbral({ bajo: clampInt(e.value) })}
                        showButtons
                        min={0}
                      />
                    </div>
                  </div>

                  {Number(form.umbrales?.bajo ?? 12) < Number(form.umbrales?.critico ?? 5) ? (
                    <div className="map-warning">
                      <i className="pi pi-exclamation-triangle" />
                      <span>“Bajo” debe ser mayor o igual a “Crítico”.</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Right: lotes */}
            <div className="map-col">
              <div className="map-card">
                <div className="map-cardTitle">
                  Lotes <span className="map-cardHint">Opcional</span>
                </div>

                <div className="map-cardBody">
                  <div className="map-cardTopRow">
                    <div className="map-muted">
                      Controla caducidades y ubicaciones. Stock = suma de lotes.
                    </div>
                    <Button
                      className="map-btn map-btn--ghost"
                      icon="pi pi-plus"
                      label="Agregar lote"
                      onClick={addLote}
                    />
                  </div>

                  <DataTable
                    value={form.lotes}
                    size="small"
                    className="map-table"
                    emptyMessage={lotesEmpty}
                    stripedRows
                  >
                    <Column
                      header="#"
                      body={(_, opts) => <span className="tabular map-muted">{opts.rowIndex + 1}</span>}
                      style={{ width: "3rem" }}
                    />
                    <Column
                      field="cantidad"
                      header="Cantidad"
                      body={(l) => <span className="tabular">{Number(l.cantidad) || 0}</span>}
                      style={{ width: "8rem" }}
                    />
                    <Column
                      field="fechaExp"
                      header="Caducidad"
                      body={(l) =>
                        l.fechaExp
                          ? new Date(l.fechaExp).toLocaleDateString("es-MX", { dateStyle: "medium" })
                          : "—"
                      }
                      style={{ width: "12rem" }}
                    />
                    <Column field="ubicacion" header="Ubicación" />
                    <Column header="Acciones" body={loteActions} style={{ width: "7.5rem" }} />
                  </DataTable>

                  {editingLote ? (
                    <div className="map-editor">
                      <div className="map-editorTitle">
                        Datos del lote{" "}
                        <span className="map-editorHint">
                          El ID lo asigna el sistema automáticamente
                        </span>
                      </div>

                      <div className="map-editorGrid">
                        <div className="map-field">
                          <label className="map-label">Cantidad</label>
                          <InputNumber
                            className="map-control map-num"
                            value={editingLote.cantidad}
                            onValueChange={(e) =>
                              setEditingLote((x) => ({ ...x, cantidad: clampInt(e.value) }))
                            }
                            min={1}
                            showButtons
                          />
                        </div>

                        <div className="map-field">
                          <label className="map-label">Caducidad</label>
                          <Calendar
                            className="map-control map-cal"
                            value={editingLote.fechaExp ? new Date(editingLote.fechaExp) : null}
                            onChange={(e) =>
                              setEditingLote((x) => ({ ...x, fechaExp: e.value }))
                            }
                            showIcon
                            dateFormat="dd/mm/yy"
                            placeholder="Opcional"
                          />
                        </div>

                        <div className="map-field">
                          <label className="map-label">Ubicación</label>
                          <InputText
                            className="map-control map-input"
                            value={editingLote.ubicacion}
                            onChange={(e) =>
                              setEditingLote((x) => ({ ...x, ubicacion: e.target.value }))
                            }
                            placeholder="Rack, pasillo… (opcional)"
                          />
                        </div>
                      </div>

                      <div className="map-editorFooter">
                        <Button
                          className="map-btn map-btn--apply"
                          icon="pi pi-check"
                          label="Guardar lote"
                          onClick={saveLote}
                        />
                        <Button
                          className="map-btn map-btn--cancel"
                          label="Cancelar"
                          onClick={() => setEditingLote(null)}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="map-card map-card--preview">
                <div className="map-cardTitle">
                  Resumen <span className="map-cardHint">Antes de crear</span>
                </div>
                <div className="map-cardBody">
                  <div className="map-summary">
                    <span className="map-chip map-chip--soft">
                      Stock final: <b className="tabular">{stockCalc}</b>
                    </span>
                    <span className={estadoChip.cls}>{estadoChip.label}</span>
                    <span className="map-chip map-chip--soft">
                      Crítico ≤ <b className="tabular">{clampInt(form.umbrales?.critico ?? 5)}</b>
                    </span>
                    <span className="map-chip map-chip--soft">
                      Bajo ≤ <b className="tabular">{clampInt(form.umbrales?.bajo ?? 12)}</b>
                    </span>
                  </div>

                  <div className="map-summaryHint">
                    Se creará con <b>{form.activo ? "estatus activo" : "estatus descontinuado"}</b> y
                    fecha de actualización actual.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Confirm close */}
          {askClose ? (
            <div className="map-confirmOverlay" role="dialog" aria-modal="true">
              <div className="map-confirmCard">
                <div className="map-confirmTitle">¿Cerrar sin guardar?</div>
                <div className="map-confirmText">
                  Tienes cambios sin guardar. Si cierras, se perderá la información capturada.
                </div>

                <div className="map-confirmBtns">
                  <Button
                    className="map-btn map-btn--cancel"
                    label="Seguir editando"
                    onClick={() => setAskClose(false)}
                  />
                  <Button
                    className="map-btn map-btn--danger"
                    icon="pi pi-times"
                    label="Cerrar"
                    onClick={() => {
                      setAskClose(false);
                      onHide?.();
                    }}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </Dialog>
    </>
  );
}
