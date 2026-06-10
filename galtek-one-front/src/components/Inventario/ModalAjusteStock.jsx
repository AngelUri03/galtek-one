import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
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

  // "VISION UI": tabs en lugar de radios
  const [scope, setScope] = useState("TOTAL"); // TOTAL | LOTE
  const [loteSel, setLoteSel] = useState(null);

  // entrada / salida
  const [direction, setDirection] = useState("IN"); // IN | OUT
  const [cantidad, setCantidad] = useState(0);
  const [motivo, setMotivo] = useState(MOTIVOS[0].value);

  const [dirty, setDirty] = useState(false);

  // Campos nuevo lote
  const [ubicacion, setUbicacion] = useState(null);
  const [fechaExp, setFechaExp] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (!producto) return;

    if (producto.lotes && producto.lotes.length > 0) {
      setScope("LOTE");
      if (producto.lotes.length === 1) {
        setLoteSel(producto.lotes[0].id);
      } else {
        setLoteSel(null);
      }
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
      label: `${l.lote} — ${Number(l.cantidad) || 0} uds — ${l.ubicacion || "—"}`,
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
      const next = (Number(stockTotalActual) || 0) + (Number(signedDelta) || 0);
      return Math.max(0, next);
    }

    // scope === LOTE
    if (!selectedLote) return Number(stockTotalActual) || 0;

    const before = Number(selectedLote.cantidad) || 0;
    const after = Math.max(0, before + (Number(signedDelta) || 0));
    const baseTotal = Number(stockTotalActual) || 0;

    return Math.max(0, baseTotal - before + after);
  }, [producto, scope, stockTotalActual, selectedLote, signedDelta]);

  const estadoPreview = useMemo(() => {
    const u = producto?.umbrales || {};
    return computeEstado(stockTotalFinal, u.critico ?? 5, u.bajo ?? 12);
  }, [producto, stockTotalFinal]);

  const estadoMeta = useMemo(() => {
    const map = {
      AGOTADO: { label: "Agotado", cls: "msas-chip msas-chip--agotado" },
      CRITICO: { label: "Crítico", cls: "msas-chip msas-chip--critico" },
      BAJO: { label: "Bajo", cls: "msas-chip msas-chip--bajo" },
      OPTIMO: { label: "Óptimo", cls: "msas-chip msas-chip--optimo" },
    };
    return map[estadoPreview] || { label: estadoPreview, cls: "msas-chip" };
  }, [estadoPreview]);

  const canApply = useMemo(() => {
    const c = clampInt(cantidad);
    if (c <= 0) return false;

    if (scope === "LOTE") {
      return Boolean(loteSel);
    }
    if (scope === "NUEVO_LOTE") {
      return Boolean(ubicacion);
    }
    return true;
  }, [cantidad, scope, loteSel, ubicacion]);

  const warnWillClamp = useMemo(() => {
    // si intenta sacar más de lo que hay (se clamp a 0)
    if (direction !== "OUT") return false;
    const c = clampInt(cantidad);
    return c > (Number(stockTargetActual) || 0);
  }, [direction, cantidad, stockTargetActual]);

  const header = (
    <div className="msas-header">
      <div className="msas-header-left">
        <div className="msas-title">Ajustar stock</div>
        <div className="msas-subtitle" title={producto?.nombre || ""}>
          {producto?.nombre || "—"}
        </div>
      </div>

      <div className="msas-header-right">
        <span className="msas-chip msas-chip--soft">
          Stock actual: <b className="tabular">{Number(stockTotalActual) || 0}</b>
        </span>
        <span className="msas-chip msas-chip--soft">
          Final: <b className="tabular">{Number(stockTotalFinal) || 0}</b>
        </span>
        <span className={estadoMeta.cls}>{estadoMeta.label}</span>
        {dirty ? <span className="msas-chip msas-chip--dirty">Cambios sin aplicar</span> : null}
      </div>
    </div>
  );

  const showToast = (severity, summary, detail) =>
    toast.current?.show({ severity, summary, detail, life: 2200 });

  const apply = () => {
    if (!producto) return;

    if (!canApply) {
      showToast("warn", "Validación", "Completa los campos para aplicar el ajuste.");
      return;
    }

    const delta = Number(signedDelta) || 0;
    const p = JSON.parse(JSON.stringify(producto)); // clone seguro (lotes)

    // Nota: aquí podrías adjuntar historial real:
    // p.movimientos = [...(p.movimientos||[]), { scope, loteSel, direction, cantidad, motivo, at: new Date().toISOString() }]

    if (scope === "TOTAL") {
      const base = Number(p.stock ?? sumLotes(p.lotes)) || 0;
      p.stock = Math.max(0, base + delta);
    } else if (scope === "LOTE") {
      // LOTE
      const idx = (p.lotes || []).findIndex((x) => x.id === loteSel);
      if (idx >= 0) {
        const baseL = Number(p.lotes[idx].cantidad) || 0;
        p.lotes[idx].cantidad = Math.max(0, baseL + delta);
        p.stock = sumLotes(p.lotes);
      }
    } else if (scope === "NUEVO_LOTE") {
      p.stock = (Number(p.stock) || 0) + delta;
    }

    onApply?.(p, { scope, loteSel, direction, cantidad, motivo, delta, ubicacion, fechaExp });
    setDirty(false);
  };

  const footer = (
    <div className="msas-footer">
      <Button className="msas-btn msas-btn--cancel" label="Cerrar" onClick={onHide} />
      <div className="grow" />
      <Button
        className="msas-btn msas-btn--ghost"
        icon="pi pi-undo"
        label="Revertir"
        disabled={!dirty}
        onClick={() => {
          setScope("TOTAL");
          setLoteSel(null);
          setDirection("IN");
          setCantidad(0);
          setMotivo(MOTIVOS[0].value);
          setDirty(false);
          showToast("info", "Ajuste", "Cambios revertidos.");
        }}
      />
      <Button
        className="msas-btn msas-btn--apply"
        icon="pi pi-check"
        label="Aplicar"
        onClick={apply}
        disabled={!producto || !canApply}
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
        className="msas-dialog"
        footer={footer}
      >
        {!producto ? (
          <div className="msas-loading">Cargando…</div>
        ) : (
          <div className="msas-wrap">
            {/* Scope tabs (TOTAL / LOTE) */}
            <div className="msas-tabs">
              {!lotesOptions.length ? (
                <button
                  type="button"
                  className={`msas-tab ${scope === "TOTAL" ? "is-active" : ""}`}
                  onClick={() => {
                    setScope("TOTAL");
                    setLoteSel(null);
                    setDirty(true);
                  }}
                >
                  <i className="pi pi-box" />
                  Ajuste total
                </button>
              ) : null}

              <button
                type="button"
                className={`msas-tab ${scope === "LOTE" ? "is-active" : ""}`}
                onClick={() => {
                  setScope("LOTE");
                  setDirty(true);
                }}
                disabled={!lotesOptions.length}
                title={!lotesOptions.length ? "Este producto no tiene lotes" : ""}
              >
                <i className="pi pi-sitemap" />
                Por lote
              </button>

              <button
                type="button"
                className={`msas-tab ${scope === "NUEVO_LOTE" ? "is-active" : ""}`}
                onClick={() => {
                  setScope("NUEVO_LOTE");
                  setLoteSel(null);
                  setDirty(true);
                }}
              >
                <i className="pi pi-plus" />
                Nuevo lote
              </button>

              <div className="msas-tabsHint">
                Target:{" "}
                <b>
                  {scope === "TOTAL"
                    ? "Stock total"
                    : selectedLote
                    ? `Lote ${selectedLote.lote}`
                    : "Selecciona un lote"}
                </b>
              </div>
            </div>

            {/* Lote selector */}
            {scope === "LOTE" ? (
              <div className="msas-card">
                <div className="msas-cardTitle">
                  Seleccionar lote
                  <span className="msas-cardHint">Ajuste específico</span>
                </div>

                <div className="msas-cardBody">
                  <label className="msas-label">Lote</label>
                  <Dropdown
                    value={loteSel}
                    onChange={(e) => {
                      setLoteSel(e.value);
                      setDirty(true);
                    }}
                    options={lotesOptions}
                    placeholder="Selecciona un lote"
                    className="msas-control msas-dd"
                    panelClassName="msas-dd-panel"
                    disabled={!lotesOptions.length}
                    filter
                  />

                  {selectedLote ? (
                    <div className="msas-loteMeta">
                      <span className="msas-chip">
                        Actual: <b className="tabular">{Number(selectedLote.cantidad) || 0}</b>
                      </span>
                      <span className="msas-chip">
                        Ubicación: <b>{selectedLote.ubicacion || "—"}</b>
                      </span>
                      <span className="msas-chip">
                        Caducidad:{" "}
                        <b>
                          {selectedLote.fechaExp
                            ? new Date(selectedLote.fechaExp).toLocaleDateString("es-MX", { dateStyle: "medium" })
                            : "—"}
                        </b>
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* Ajuste: direction + cantidad + motivo */}
            <div className="msas-grid">
              <div className="msas-card">
                <div className="msas-cardTitle">
                  {scope === "NUEVO_LOTE" ? "Ingresar Lote Nuevo" : "Ajuste"}
                  <span className="msas-cardHint">
                    {scope === "NUEVO_LOTE" ? "Registra existencias de un nuevo lote" : "Entrada o salida"}
                  </span>
                </div>

                <div className="msas-cardBody">
                  {scope !== "NUEVO_LOTE" ? (
                    <div className="msas-seg">
                      <button
                        type="button"
                        className={`msas-seg-btn ${direction === "IN" ? "is-active" : ""}`}
                        onClick={() => {
                          setDirection("IN");
                          setDirty(true);
                        }}
                      >
                        <i className="pi pi-plus" />
                        Entrada
                      </button>
                      <button
                        type="button"
                        className={`msas-seg-btn ${direction === "OUT" ? "is-active" : ""}`}
                        onClick={() => {
                          setDirection("OUT");
                          setDirty(true);
                        }}
                      >
                        <i className="pi pi-minus" />
                        Salida
                      </button>
                    </div>
                  ) : null}

                  <div className="msas-fields">
                    <div className="msas-field">
                      <label className="msas-label">Cantidad</label>
                      <InputNumber
                        value={cantidad}
                        onValueChange={(e) => {
                          setCantidad(clampInt(e.value));
                          setDirty(true);
                        }}
                        min={0}
                        showButtons
                        placeholder="Ej: 10"
                        className="msas-control msas-num"
                      />
                      <div className="msas-help">
                        {scope === "NUEVO_LOTE" ? "Ingresarán:" : "Se aplicará:"}{" "}
                        <span className={`msas-delta ${direction === "IN" || scope === "NUEVO_LOTE" ? "in" : "out"}`}>
                          {direction === "IN" || scope === "NUEVO_LOTE" ? "+" : "−"}
                          <b className="tabular">{clampInt(cantidad)}</b>
                        </span>
                      </div>
                    </div>

                    {scope === "NUEVO_LOTE" ? (
                      <>
                        <div className="msas-field">
                          <label className="msas-label">Ubicación</label>
                          <Dropdown
                            value={ubicacion}
                            onChange={(e) => {
                              setUbicacion(e.value);
                              setDirty(true);
                            }}
                            options={almacenesOptions}
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Selecciona almacén"
                            className="msas-control msas-dd"
                            panelClassName="msas-dd-panel"
                          />
                        </div>
                        <div className="msas-field">
                          <label className="msas-label">Caducidad</label>
                          <Calendar
                            value={fechaExp}
                            onChange={(e) => {
                              setFechaExp(e.value);
                              setDirty(true);
                            }}
                            showIcon
                            readOnlyInput
                            hideOnDateTimeSelect
                            placeholder="Opcional"
                            className="msas-control msas-cal"
                            panelClassName="msas-cal-panel"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="msas-field">
                        <label className="msas-label">Motivo</label>
                        <Dropdown
                          value={motivo}
                          onChange={(e) => {
                            setMotivo(e.value);
                            setDirty(true);
                          }}
                          options={MOTIVOS}
                          className="msas-control msas-dd"
                          panelClassName="msas-dd-panel"
                          placeholder="Selecciona un motivo"
                        />
                        <div className="msas-help">Se registrará como: <b>{motivo}</b></div>
                      </div>
                    )}
                  </div>

                  {warnWillClamp ? (
                    <div className="msas-warning">
                      <i className="pi pi-info-circle" />
                      <span>
                        La salida excede el stock actual del target. El resultado se ajustará a <b>0</b>.
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Preview */}
              <div className="msas-card msas-card--preview">
                <div className="msas-cardTitle">
                  Vista previa
                  <span className="msas-cardHint">Antes → Después</span>
                </div>

                <div className="msas-cardBody">
                  <div className="msas-preview">
                    <div className="msas-previewBlock">
                      <span className="msas-muted">
                        {scope === "TOTAL" ? "Stock total actual" : "Stock lote actual"}
                      </span>
                      <div className="msas-big tabular">{Number(stockTargetActual) || 0}</div>
                    </div>

                    <div className="msas-arrow">
                      <i className="pi pi-arrow-right" />
                    </div>

                    <div className="msas-previewBlock">
                      <span className="msas-muted">
                        {scope === "TOTAL" ? "Stock total final" : "Stock lote final"}
                      </span>
                      <div className="msas-big tabular">{Number(stockTargetFinal) || 0}</div>
                    </div>
                  </div>

                  <div className="msas-previewLine">
                    <span className="msas-chip msas-chip--soft">
                      Total final: <b className="tabular">{Number(stockTotalFinal) || 0}</b>
                    </span>
                    <span className={estadoMeta.cls}>{estadoMeta.label}</span>
                  </div>

                  <Message
                    severity="info"
                    className="msas-message"
                    text="Tip: si necesitas trazabilidad, guarda un historial del ajuste con usuario, motivo y fecha."
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}