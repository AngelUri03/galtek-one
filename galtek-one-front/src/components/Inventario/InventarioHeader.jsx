import React, { useMemo } from "react";
import { Message } from "primereact/message";
import { Tooltip } from "primereact/tooltip";
import "../../style/components/Inventario/InventarioHeader.css";

export default function InventarioHeader({ rows = [], getStockEstado }) {
  const fallbackEstado = (p) => {
    const s = p?.stock ?? 0;
    const c = p?.umbrales?.critico ?? 5;
    const b = p?.umbrales?.bajo ?? 12;
    if (s <= 0) return "AGOTADO";
    if (s <= c) return "CRITICO";
    if (s <= b) return "BAJO";
    return "OPTIMO";
  };

  const computeEstado = getStockEstado || fallbackEstado;

  const counters = useMemo(() => {
    const total = rows.length;
    let agotado = 0,
      critico = 0,
      bajo = 0;
    for (const r of rows) {
      const estado = computeEstado(r);
      if (estado === "AGOTADO") agotado++;
      else if (estado === "CRITICO") critico++;
      else if (estado === "BAJO") bajo++;
    }
    return { total, agotado, critico, bajo };
  }, [rows, computeEstado]);

  return (
    <div className="inv-header">
      <div className="inv-title"></div>

      <div className="inv-counters">
        <span className="inv-tip-total">
          <Message
            className="inv-msg inv-msg--total"
            severity="secondary"
            icon="pi pi-box"
            text={`Total: ${counters.total}`}
          />
        </span>

        <span className="inv-tip-agotado">
          <Message
            className="inv-msg inv-msg--agotado"
            severity="error"
            icon="pi pi-times-circle"
            text={`Agotado: ${counters.agotado}`}
          />
        </span>

        <span className="inv-tip-critico">
          <Message
            className="inv-msg inv-msg--critico"
            severity="warn"
            icon="pi pi-exclamation-triangle"
            text={`Crítico: ${counters.critico}`}
          />
        </span>

        <span className="inv-tip-bajo">
          <Message
            className="inv-msg inv-msg--bajo"
            severity="info"
            icon="pi pi-angle-double-down"
            text={`Bajo: ${counters.bajo}`}
          />
        </span>
      </div>

      <Tooltip
        target=".inv-tip-total"
        content="Total de Productos"
        position="top"
      />
      <Tooltip
        target=".inv-tip-agotado"
        content="Productos sin unidades disponibles"
        position="top"
      />
      <Tooltip
        target=".inv-tip-critico"
        content="Productos con stock critico"
        position="top"
      />
      <Tooltip
        target=".inv-tip-bajo"
        content="Productos con stock bajo"
        position="top"
      />
    </div>
  );
}
