import React, { useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "primereact/sidebar";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
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
    if (!open || !producto) return;
    setCritico(clampInt(producto.umbrales?.critico ?? 5));
    setBajo(clampInt(producto.umbrales?.bajo ?? 12));
    setDirty(false);
  }, [open, producto]);

  const stockActual = useMemo(() => {
    if (!producto) return 0;
    return producto.stock ?? stockFromLotes(producto.lotes);
  }, [producto]);

  const invalid = useMemo(() => bajo < critico, [bajo, critico]);

  const estadoPreview = useMemo(() => {
    return computeEstado(Number(stockActual) || 0, clampInt(critico), clampInt(bajo));
  }, [stockActual, critico, bajo]);

  const showToast = (severity, summary, detail) =>
    toast.current?.show({ severity, summary, detail, life: 2000 });

  const handleSave = () => {
    if (!producto) return;
    const c = clampInt(critico);
    const b = clampInt(bajo);

    if (b < c) {
      showToast("warn", "Validación", "El umbral 'bajo' debe ser mayor o igual que 'crítico'.");
      return;
    }

    onSave?.({
      ...producto,
      umbrales: { critico: c, bajo: b },
    });
    setDirty(false);
  };

  const customHeader = (
    <div className="prov-editor-header">
      <span>CONFIGURAR UMBRALES</span>
      <strong>{producto?.nombre || "Alertas de Stock"}</strong>
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
              {/* PREVIEW STATUS */}
              <div className="prov-detail-hero" style={{ marginBottom: "16px" }}>
                <div>
                  <span className="prov-eyebrow">Estado Resultante</span>
                  <h2 style={{ color: "#0a7463" }}>{estadoPreview}</h2>
                </div>
                <div className="prov-detail-hero-contact">
                  <span>Existencia Actual</span>
                  <strong>{stockActual} Unidades</strong>
                </div>
              </div>

              {/* SECCIÓN UMBRALES */}
              <div className="prov-editor-section">
                <div className="prov-editor-section-head">
                  <span>1</span>
                  <h3>Umbrales Mínimos</h3>
                </div>

                <div className="prov-form-grid">
                  <div className="prov-field">
                    <span>Umbral Crítico</span>
                    <InputNumber
                      value={critico}
                      onValueChange={(e) => {
                        setCritico(clampInt(e.value));
                        setDirty(true);
                      }}
                      min={0}
                      showButtons
                    />
                  </div>

                  <div className="prov-field">
                    <span>Umbral Bajo</span>
                    <InputNumber
                      value={bajo}
                      onValueChange={(e) => {
                        setBajo(clampInt(e.value));
                        setDirty(true);
                      }}
                      min={0}
                      showButtons
                    />
                  </div>
                </div>

                {invalid && (
                  <div className="prov-safe-box" style={{ marginTop: "12px", borderColor: "rgba(159, 63, 63, 0.3)" }}>
                    <strong style={{ color: "#9f3f3f" }}>Conflicto detectado:</strong>
                    <p style={{ margin: 0, fontSize: "0.8rem" }}>El umbral bajo debe ser estrictamente mayor o igual al crítico.</p>
                  </div>
                )}
              </div>

              {/* EXPLICACIÓN DE REGLAS */}
              <div className="prov-editor-section">
                <div className="prov-editor-section-head">
                  <span>2</span>
                  <h3>Comportamiento del Sistema</h3>
                </div>

                <div className="prov-detail-list">
                  <div className="prov-detail-list-item">
                    <div>
                      <strong>Agotado</strong>
                      <span>Stock igual a 0</span>
                    </div>
                    <span className="prov-state-tag p-tag-danger">0</span>
                  </div>

                  <div className="prov-detail-list-item">
                    <div>
                      <strong>Crítico</strong>
                      <span>Stock menor o igual al umbral crítico</span>
                    </div>
                    <span className="prov-state-tag p-tag-warning">≤ {critico}</span>
                  </div>

                  <div className="prov-detail-list-item">
                    <div>
                      <strong>Bajo</strong>
                      <span>Stock menor o igual al umbral bajo</span>
                    </div>
                    <span className="prov-state-tag p-tag-warning">≤ {bajo}</span>
                  </div>

                  <div className="prov-detail-list-item">
                    <div>
                      <strong>Óptimo</strong>
                      <span>Stock por encima del umbral bajo</span>
                    </div>
                    <span className="prov-state-tag p-tag-success">&gt; {bajo}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="prov-editor-footer">
              <Button type="button" label="Cancelar" className="prov-soft-btn" onClick={onHide} />
              <Button
                type="button"
                label="Guardar Umbrales"
                icon="pi pi-check"
                className="prov-primary-btn"
                disabled={invalid}
                onClick={handleSave}
              />
            </div>
          </div>
        )}
      </Sidebar>
    </>
  );
}