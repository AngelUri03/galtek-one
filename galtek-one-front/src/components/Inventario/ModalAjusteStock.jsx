import React, { useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "primereact/sidebar";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Message } from "primereact/message";
import { Calendar } from "primereact/calendar";

import "../../style/components/Inventario/ModalAjusteStock.css";

const MOTIVOS = [
  { label: "Merma", value: "MERMA" },
  { label: "Pérdida", value: "PERDIDA" },
  { label: "Devolución", value: "DEVOLUCION" },
  { label: "Corrección", value: "CORRECCION" },
  { label: "Entrada manual", value: "ENTRADA" },
  { label: "Salida manual", value: "SALIDA" },
];

const clampInt = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
};

const sumLotes = (lotes) =>
  Array.isArray(lotes)
    ? lotes.reduce((s, l) => s + (Number(l?.cantidad) || 0), 0)
    : 0;

const computeEstado = (stock, critico, bajo) => {
  const s = Number(stock) || 0;
  if (s <= 0) return "AGOTADO";
  if (s <= (Number(critico) || 0)) return "CRITICO";
  if (s <= (Number(bajo) || 0)) return "BAJO";
  return "OPTIMO";
};

export default function ModalAjusteStock({ open, producto, onHide, onApply, almacenesOptions = [] }) {
  const toast = useRef(null);

  const [scope, setScope] = useState("TOTAL"); // TOTAL | LOTE | NUEVO_LOTE
  const [loteSel, setLoteSel] = useState(null);
  const [direction, setDirection] = useState("IN"); // IN | OUT
  const [cantidad, setCantidad] = useState(0);
  const [motivo, setMotivo] = useState(MOTIVOS[0].value);
  const [dirty, setDirty] = useState(false);

  const [ubicacion, setUbicacion] = useState(null);
  const [fechaExp, setFechaExp] = useState(null);

  useEffect(() => {
    if (!open || !producto) return;

    if (producto.lotes && producto.lotes.length > 0) {
      setScope("LOTE");
      setLoteSel(producto.lotes.length === 1 ? producto.lotes[0].id : null);
    } else {
      setScope("TOTAL");
      setLoteSel(null);
    }

    setDirection("IN");
    setCantidad(0);
    setMotivo(MOTIVOS[0].value);
    setUbicacion(null);
    setFechaExp(null);
    setDirty(false);
  }, [open, producto]);

  const lotesOptions = useMemo(() => {
    const lotes = producto?.lotes || [];
    return lotes.map((l) => ({
      label: `${l.lote || l.id} — ${Number(l.cantidad) || 0} uds — ${l.ubicacion || "—"}`,
      value: l.id,
    }));
  }, [producto]);

  const selectedLote = useMemo(() => {
    if (!producto?.lotes || !loteSel) return null;
    return producto.lotes.find((l) => l.id === loteSel) || null;
  }, [producto, loteSel]);

  const stockTotalActual = useMemo(() => {
    if (!producto) return 0;
    return producto.stock ?? sumLotes(producto.lotes);
  }, [producto]);

  const stockTargetActual = useMemo(() => {
    if (!producto) return 0;
    if (scope === "TOTAL") return Number(stockTotalActual) || 0;
    if (scope === "NUEVO_LOTE") return 0;
    return Number(selectedLote?.cantidad) || 0;
  }, [producto, scope, stockTotalActual, selectedLote]);

  const signedDelta = useMemo(() => {
    const c = clampInt(cantidad);
    return (direction === "IN" || scope === "NUEVO_LOTE") ? c : -c;
  }, [cantidad, direction, scope]);

  const stockTargetFinal = useMemo(() => {
    const next = (Number(stockTargetActual) || 0) + (Number(signedDelta) || 0);
    return Math.max(0, next);
  }, [stockTargetActual, signedDelta]);

  const stockTotalFinal = useMemo(() => {
    if (!producto) return 0;
    if (scope === "TOTAL" || scope === "NUEVO_LOTE") {
      return Math.max(0, (Number(stockTotalActual) || 0) + (Number(signedDelta) || 0));
    }
    if (!selectedLote) return Number(stockTotalActual) || 0;
    const before = Number(selectedLote.cantidad) || 0;
    const after = Math.max(0, before + (Number(signedDelta) || 0));
    return Math.max(0, Number(stockTotalActual) - before + after);
  }, [producto, scope, stockTotalActual, selectedLote, signedDelta]);

  const estadoPreview = useMemo(() => {
    const u = producto?.umbrales || {};
    return computeEstado(stockTotalFinal, u.critico ?? 5, u.bajo ?? 12);
  }, [producto, stockTotalFinal]);

  const canApply = useMemo(() => {
    const c = clampInt(cantidad);
    if (c <= 0) return false;
    if (scope === "LOTE") return Boolean(loteSel);
    if (scope === "NUEVO_LOTE") return Boolean(ubicacion);
    return true;
  }, [cantidad, scope, loteSel, ubicacion]);

  const showToast = (severity, summary, detail) =>
    toast.current?.show({ severity, summary, detail, life: 2200 });

  const apply = () => {
    if (!producto || !canApply) return;
    const delta = Number(signedDelta) || 0;
    const p = JSON.parse(JSON.stringify(producto));

    if (scope === "TOTAL") {
      p.stock = Math.max(0, (Number(p.stock) || 0) + delta);
    } else if (scope === "LOTE") {
      const idx = (p.lotes || []).findIndex((x) => x.id === loteSel);
      if (idx >= 0) {
        p.lotes[idx].cantidad = Math.max(0, (Number(p.lotes[idx].cantidad) || 0) + delta);
        p.stock = sumLotes(p.lotes);
      }
    } else if (scope === "NUEVO_LOTE") {
      p.stock = (Number(p.stock) || 0) + delta;
    }

    onApply?.(p, { scope, loteSel, direction, cantidad, motivo, delta, ubicacion, fechaExp });
    setDirty(false);
  };

  const customHeader = (
    <div className="prov-editor-header">
      <span>AJUSTE DE INVENTARIO</span>
      <strong>{producto?.nombre || "Ajustar Stock"}</strong>
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
        {!producto ? (
          <div className="prov-editor-loading">Cargando...</div>
        ) : (
          <div className="prov-editor">
            <div className="prov-editor-body">
              {/* HERO PREVIEW */}
              <div className="prov-detail-hero">
                <div>
                  <span className="prov-eyebrow">Estado Resultante</span>
                  <h2 style={{ color: "#0a7463" }}>{estadoPreview}</h2>
                </div>
                <div className="prov-detail-hero-contact">
                  <span>Stock Total Final</span>
                  <strong>{stockTotalFinal} Unidades</strong>
                </div>
              </div>

              {/* TABS DE MODO */}
              <div className="msas-tabs">
                {!lotesOptions.length && (
                  <button
                    type="button"
                    className={`msas-tab ${scope === "TOTAL" ? "is-active" : ""}`}
                    onClick={() => { setScope("TOTAL"); setLoteSel(null); setDirty(true); }}
                  >
                    Stock Total
                  </button>
                )}
                <button
                  type="button"
                  className={`msas-tab ${scope === "LOTE" ? "is-active" : ""}`}
                  onClick={() => { setScope("LOTE"); setDirty(true); }}
                  disabled={!lotesOptions.length}
                >
                  Por Lote
                </button>
                <button
                  type="button"
                  className={`msas-tab ${scope === "NUEVO_LOTE" ? "is-active" : ""}`}
                  onClick={() => { setScope("NUEVO_LOTE"); setLoteSel(null); setDirty(true); }}
                >
                  + Nuevo Lote
                </button>
              </div>

              {/* OPCIÓN LOTE EXISTENTE */}
              {scope === "LOTE" && (
                <div className="prov-field">
                  <span>Seleccionar Lote *</span>
                  <Dropdown
                    value={loteSel}
                    onChange={(e) => { setLoteSel(e.value); setDirty(true); }}
                    options={lotesOptions}
                    placeholder="Selecciona un lote"
                    filter
                  />
                </div>
              )}

              {/* DETALLES DEL MOVIMIENTO */}
              <div className="prov-editor-section">
                <div className="prov-editor-section-head">
                  <span>1</span>
                  <h3>Detalle del Movimiento</h3>
                </div>

                {scope !== "NUEVO_LOTE" && (
                  <div className="msas-seg">
                    <button
                      type="button"
                      className={`msas-seg-btn ${direction === "IN" ? "is-active" : ""}`}
                      onClick={() => { setDirection("IN"); setDirty(true); }}
                    >
                      + Entrada
                    </button>
                    <button
                      type="button"
                      className={`msas-seg-btn ${direction === "OUT" ? "is-active" : ""}`}
                      onClick={() => { setDirection("OUT"); setDirty(true); }}
                    >
                      − Salida
                    </button>
                  </div>
                )}

                <div className="prov-form-grid">
                  <div className="prov-field">
                    <span>Cantidad *</span>
                    <InputNumber
                      value={cantidad}
                      onValueChange={(e) => { setCantidad(clampInt(e.value)); setDirty(true); }}
                      min={1}
                      showButtons
                    />
                  </div>

                  {scope === "NUEVO_LOTE" ? (
                    <>
                      <div className="prov-field">
                        <span>Almacén / Ubicación *</span>
                        <Dropdown
                          value={ubicacion}
                          onChange={(e) => { setUbicacion(e.value); setDirty(true); }}
                          options={almacenesOptions}
                          placeholder="Seleccionar"
                        />
                      </div>
                      <div className="prov-field prov-field-wide">
                        <span>Fecha Expiración</span>
                        <Calendar
                          value={fechaExp}
                          onChange={(e) => { setFechaExp(e.value); setDirty(true); }}
                          showIcon
                          dateFormat="dd/mm/yy"
                          placeholder="Opcional"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="prov-field">
                      <span>Motivo</span>
                      <Dropdown
                        value={motivo}
                        onChange={(e) => { setMotivo(e.value); setDirty(true); }}
                        options={MOTIVOS}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="prov-editor-footer">
              <Button type="button" label="Cancelar" className="prov-soft-btn" onClick={onHide} />
              <Button
                type="button"
                label="Aplicar Ajuste"
                icon="pi pi-check"
                className="prov-primary-btn"
                disabled={!canApply}
                onClick={apply}
              />
            </div>
          </div>
        )}
      </Sidebar>
    </>
  );
}