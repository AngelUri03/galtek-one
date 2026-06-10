import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";

import "../../style/components/Inventario/ModalAlertasStock.css";

const clampInt = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
};

const stockFromLotes = (lotes) =>
  Array.isArray(lotes)
    ? lotes.reduce((sum, l) => sum + (Number(l?.cantidad) || 0), 0)
    : 0;

const computeEstado = (stock, critico, bajo) => {
  if (stock <= 0) return "AGOTADO";
  if (stock <= critico) return "CRITICO";
  if (stock <= bajo) return "BAJO";
  return "OPTIMO";
};

export default function ModalAlertasStock({ open, producto, onHide, onSave }) {
  const toast = useRef(null);

  const [critico, setCritico] = useState(5);
  const [bajo, setBajo] = useState(12);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (!producto) return;

    const c = producto.umbrales?.critico ?? 5;
    const b = producto.umbrales?.bajo ?? 12;

    setCritico(clampInt(c));
    setBajo(clampInt(b));
    setDirty(false);
  }, [open, producto]);

  const stockActual = useMemo(() => {
    if (!producto) return 0;
    return producto.stock ?? stockFromLotes(producto.lotes);
  }, [producto]);

  const invalid = useMemo(() => bajo < critico, [bajo, critico]);

  const estadoPreview = useMemo(() => {
    const c = clampInt(critico);
    const b = clampInt(bajo);
    const s = Number(stockActual) || 0;
    return computeEstado(s, c, b);
  }, [stockActual, critico, bajo]);

  const estadoMeta = useMemo(() => {
    const map = {
      AGOTADO: { label: "Agotado", cls: "mas-chip mas-chip--agotado" },
      CRITICO: { label: "Crítico", cls: "mas-chip mas-chip--critico" },
      BAJO: { label: "Bajo", cls: "mas-chip mas-chip--bajo" },
      OPTIMO: { label: "Óptimo", cls: "mas-chip mas-chip--optimo" },
    };
    return map[estadoPreview] || { label: estadoPreview, cls: "mas-chip" };
  }, [estadoPreview]);

  const header = (
    <div className="mas-header">
      <div className="mas-header-left">
        <div className="mas-title">Alertas de stock</div>
        <div className="mas-subtitle" title={producto?.nombre || ""}>
          {producto?.nombre || "—"}
        </div>
      </div>

      <div className="mas-header-right">
        <span className="mas-chip mas-chip--soft">
          Stock: <b className="tabular">{Number(stockActual) || 0}</b>
        </span>
        <span className={estadoMeta.cls}>{estadoMeta.label}</span>
        {dirty ? <span className="mas-chip mas-chip--dirty">Cambios sin guardar</span> : null}
      </div>
    </div>
  );

  const showToast = (severity, summary, detail) =>
    toast.current?.show({ severity, summary, detail, life: 2000 });

  const handleSave = () => {
    if (!producto) return;

    const c = clampInt(critico);
    const b = clampInt(bajo);

    if (b < c) {
      showToast("warn", "Validación", "El umbral 'bajo' debe ser ≥ 'crítico'.");
      return;
    }

    const p = {
      ...producto,
      umbrales: { critico: c, bajo: b },
    };

    onSave?.(p);
    setDirty(false);
  };

  const footer = (
    <div className="mas-footer">
      <Button className="mas-btn mas-btn--cancel" label="Cerrar" onClick={onHide} />
      <div className="grow" />
      <Button
        className="mas-btn mas-btn--ghost"
        icon="pi pi-undo"
        label="Revertir"
        disabled={!dirty}
        onClick={() => {
          const c = producto?.umbrales?.critico ?? 5;
          const b = producto?.umbrales?.bajo ?? 12;
          setCritico(clampInt(c));
          setBajo(clampInt(b));
          setDirty(false);
          showToast("info", "Alertas", "Cambios revertidos.");
        }}
      />
      <Button
        className="mas-btn mas-btn--apply"
        icon="pi pi-save"
        label="Guardar"
        onClick={handleSave}
        disabled={!producto || invalid}
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
        className="mas-dialog"
        footer={footer}
      >
        {!producto ? (
          <div className="mas-loading">Cargando…</div>
        ) : (
          <div className="mas-wrap">
            {/* Info / reglas (glass card) */}
            <div className="mas-card mas-card--info">
              <Message
                severity="info"
                className="mas-message"
                text="Regla de estados: 0 → Agotado; ≤ crítico → Crítico; ≤ bajo → Bajo; > bajo → Óptimo."
              />

              <div className="mas-miniLegend">
                <span className="mas-pill mas-pill--agotado">Agotado</span>
                <span className="mas-pill mas-pill--critico">Crítico</span>
                <span className="mas-pill mas-pill--bajo">Bajo</span>
                <span className="mas-pill mas-pill--optimo">Óptimo</span>
              </div>
            </div>

            {/* Controls + Preview */}
            <div className="mas-grid">
              <div className="mas-card">
                <div className="mas-cardTitle">
                  Umbrales
                  <span className="mas-cardHint">Defínelos por producto</span>
                </div>

                <div className="mas-controls">
                  <div className="mas-field">
                    <label>Umbral crítico</label>
                    <InputNumber
                      className="mas-control mas-num"
                      value={critico}
                      onValueChange={(e) => {
                        setCritico(clampInt(e.value));
                        setDirty(true);
                      }}
                      min={0}
                      showButtons
                      placeholder="Ej: 5"
                    />
                    <div className="mas-help">
                      Stock ≤ <b className="tabular">{clampInt(critico)}</b> se marca como{" "}
                      <span className="mas-pill mas-pill--critico">Crítico</span>
                    </div>
                  </div>

                  <div className="mas-field">
                    <label>Umbral bajo</label>
                    <InputNumber
                      className="mas-control mas-num"
                      value={bajo}
                      onValueChange={(e) => {
                        setBajo(clampInt(e.value));
                        setDirty(true);
                      }}
                      min={0}
                      showButtons
                      placeholder="Ej: 12"
                    />
                    <div className="mas-help">
                      Stock ≤ <b className="tabular">{clampInt(bajo)}</b> se marca como{" "}
                      <span className="mas-pill mas-pill--bajo">Bajo</span>
                    </div>
                  </div>
                </div>

                {invalid ? (
                  <div className="mas-error">
                    <i className="pi pi-exclamation-triangle" />
                    <span>
                      El umbral <b>bajo</b> debe ser mayor o igual que <b>crítico</b>.
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="mas-card mas-card--preview">
                <div className="mas-cardTitle">
                  Vista previa
                  <span className="mas-cardHint">Con el stock actual</span>
                </div>

                <div className="mas-previewTop">
                  <div className="mas-previewStock">
                    <span className="mas-muted">Stock actual</span>
                    <div className="mas-stockBig tabular">{Number(stockActual) || 0}</div>
                  </div>

                  <div className="mas-previewState">
                    <span className="mas-muted">Estado resultante</span>
                    <div className={estadoMeta.cls}>{estadoMeta.label}</div>
                  </div>
                </div>

                <div className="mas-range">
                  <div className="mas-rangeRow">
                    <span className="mas-rangeLabel">Agotado</span>
                    <div className="mas-rangeBar">
                      <span className="mas-rangeFill mas-rangeFill--agotado" style={{ width: "22%" }} />
                    </div>
                    <span className="mas-rangeValue tabular">0</span>
                  </div>

                  <div className="mas-rangeRow">
                    <span className="mas-rangeLabel">Crítico</span>
                    <div className="mas-rangeBar">
                      <span className="mas-rangeFill mas-rangeFill--critico" style={{ width: "58%" }} />
                    </div>
                    <span className="mas-rangeValue tabular">≤ {clampInt(critico)}</span>
                  </div>

                  <div className="mas-rangeRow">
                    <span className="mas-rangeLabel">Bajo</span>
                    <div className="mas-rangeBar">
                      <span className="mas-rangeFill mas-rangeFill--bajo" style={{ width: "82%" }} />
                    </div>
                    <span className="mas-rangeValue tabular">≤ {clampInt(bajo)}</span>
                  </div>

                  <div className="mas-rangeRow">
                    <span className="mas-rangeLabel">Óptimo</span>
                    <div className="mas-rangeBar">
                      <span className="mas-rangeFill mas-rangeFill--optimo" style={{ width: "100%" }} />
                    </div>
                    <span className="mas-rangeValue tabular">&gt; {clampInt(bajo)}</span>
                  </div>
                </div>

                <div className="mas-note">
                  <i className="pi pi-eye" />
                  <span>
                    Con estos umbrales, el producto quedaría en{" "}
                    <b>{estadoMeta.label}</b> con el stock actual.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}