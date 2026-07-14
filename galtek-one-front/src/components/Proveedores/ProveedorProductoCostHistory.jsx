import React, { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Skeleton } from "primereact/skeleton";
import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";
import { formatDate, moneyOrDash, readApiPayload } from "./proveedoresUtils";
import { relationProductName, relationProductSku } from "./proveedorAdvancedUtils";
import { AdvancedEmpty } from "./ProveedorAdvancedShared";

const api = new APIfetchApi();

function historyUrl(idProveedor, idProveedorProducto) {
  return `${endpoints.proveedores}/${idProveedor}/productos/${idProveedorProducto}/historial-costos`;
}

function normalizeRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.historial)) return payload.historial;
  return [];
}

function formatUser(row) {
  return row?.usuarioCreacion || row?.usuarioModificacion || "system";
}

export default function ProveedorProductoCostHistory({
  proveedor,
  item,
  onClose,
  showToast,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const idProveedor = proveedor?.idProveedor;
  const idProveedorProducto = item?.idProveedorProducto;

  useEffect(() => {
    let mounted = true;

    async function loadHistory() {
      if (!idProveedor || !idProveedorProducto) return;
      setLoading(true);
      try {
        const response = await api.fetchApi({}, "GET", undefined, historyUrl(idProveedor, idProveedorProducto));
        const payload = await readApiPayload(response, "historial de costos");
        if (mounted) setRows(normalizeRows(payload));
      } catch (error) {
        if (mounted) setRows([]);
        showToast?.("error", "Historial de costos", error?.message || "No se pudo cargar el historial.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadHistory();
    return () => {
      mounted = false;
    };
  }, [idProveedor, idProveedorProducto, showToast]);

  const name = relationProductName(item);
  const sku = relationProductSku(item);

  return (
    <section className="prov-cost-history-panel">
      <div className="prov-cost-history-head">
        <div>
          <span>Historial de costos</span>
          <strong title={name}>{name}</strong>
          <small>{sku ? `SKU ${sku}` : "Sin SKU interno"}</small>
        </div>
        <Button
          icon="pi pi-times"
          className="prov-row-action"
          onClick={onClose}
          aria-label="Cerrar historial"
          tooltip="Cerrar"
          tooltipOptions={{ position: "top" }}
        />
      </div>

      {loading ? (
        <div className="prov-cost-history-loading">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} height="42px" borderRadius="10px" />
          ))}
        </div>
      ) : null}

      {!loading && rows.length ? (
        <div className="prov-cost-history-list">
          {rows.map((row, index) => (
            <div className="prov-cost-history-row" key={row.idHistorialCostos || index}>
              <div className="prov-cost-history-date">
                <span>{formatDate(row.fechaCreacion)}</span>
                <small>{formatUser(row)}</small>
              </div>
              <strong>{moneyOrDash(row.precioCompra)}</strong>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && !rows.length ? (
        <AdvancedEmpty text="Sin historial de costos para esta relacion." />
      ) : null}
    </section>
  );
}
