import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";
import { formatDate, moneyOrDash, readApiPayload } from "./proveedoresUtils";
import {
  enumText,
  relationProductName,
  relationProductSku,
} from "./proveedorAdvancedUtils";
import {
  AdvancedEmpty,
  AdvancedSection,
  ConfirmActionDialog,
} from "./ProveedorAdvancedShared";
import ProveedorProductoCostHistory from "./ProveedorProductoCostHistory";

const api = new APIfetchApi();

function getProductoUrl(idProveedor, idRelacion) {
  return `${endpoints.proveedores}/${idProveedor}/productos/${idRelacion}`;
}

function relationState(row) {
  return String(row?.estadoRelacion || "ACTIVA").trim().toUpperCase();
}

function relationStateClass(row) {
  const state = relationState(row);
  if (state === "INACTIVA") return "is-inactive";
  if (state === "ARCHIVADA") return "is-archived";
  return "is-active";
}

function productId(row) {
  return row?.producto?.idProducto || row?.idProducto || null;
}

function valueOrDash(value) {
  if (value === null || value === undefined || value === "") return "--";
  return value;
}

export default function ProveedorProductosSection({
  proveedor,
  items = [],
  onRefresh,
  showToast,
}) {
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [historyItem, setHistoryItem] = useState(null);
  const [updatingRelation, setUpdatingRelation] = useState(null);
  const hasItems = items.length > 0;

  const openInventory = (item) => {
    const idProducto = productId(item);
    const query = idProducto ? `?producto=${idProducto}` : "";
    navigate(`/inventario${query}`, {
      state: {
        from: "proveedores",
        proveedorId: proveedor?.idProveedor,
        productoId: idProducto,
      },
    });
  };

  const openPurchases = (item) => {
    const idProducto = productId(item);
    const params = new URLSearchParams();
    if (idProducto) params.set("producto", idProducto);
    if (proveedor?.idProveedor) params.set("proveedor", proveedor.idProveedor);
    const query = params.toString();
    navigate(`/compras/producto${query ? `?${query}` : ""}`, {
      state: {
        from: "proveedores",
        proveedorId: proveedor?.idProveedor,
        productoId: idProducto,
      },
    });
  };

  const deactivate = async (item) => {
    const response = await api.fetchApi(
      {},
      "DELETE",
      undefined,
      getProductoUrl(proveedor.idProveedor, item.idProveedorProducto)
    );
    await readApiPayload(response, "desactivar producto asociado");
    showToast?.("success", "Productos asociados", "Relacion desactivada.");
  };

  const reactivate = async (item) => {
    const response = await api.fetchApi(
      {},
      "PUT",
      { estadoRelacion: "ACTIVA", estatus: true },
      getProductoUrl(proveedor.idProveedor, item.idProveedorProducto)
    );
    await readApiPayload(response, "reactivar producto asociado");
    showToast?.("success", "Productos asociados", "Relacion reactivada.");
  };

  const applyStateAction = async () => {
    if (!confirm?.item) return;

    const currentAction = confirm;
    setUpdatingRelation({
      id: currentAction.item.idProveedorProducto,
      action: currentAction.action,
    });
    setConfirm(null);
    setSaving(true);
    try {
      if (currentAction.action === "reactivar") {
        await reactivate(currentAction.item);
      } else {
        await deactivate(currentAction.item);
      }
      setHistoryItem((current) =>
        current?.idProveedorProducto === currentAction.item.idProveedorProducto ? null : current
      );
      await onRefresh?.();
    } catch (error) {
      showToast?.("error", "Productos asociados", error?.message || "No se pudo completar.");
    } finally {
      setSaving(false);
      setUpdatingRelation(null);
    }
  };

  return (
    <AdvancedSection
      title="Productos asociados"
      subtitle="Relacion comercial de surtido, preferencia y costos."
      icon="pi pi-box"
    >
      {historyItem ? (
        <ProveedorProductoCostHistory
          proveedor={proveedor}
          item={historyItem}
          onClose={() => setHistoryItem(null)}
          showToast={showToast}
        />
      ) : null}

      {hasItems ? (
        <div className="prov-product-card-grid">
          {items.map((item) => {
            const title = relationProductName(item);
            const skuInterno = relationProductSku(item);
            const state = relationState(item);
            const isActive = state === "ACTIVA";
            const isInactive = state === "INACTIVA";
            const isUpdating = updatingRelation?.id === item.idProveedorProducto;

            return (
              <article
                className={`prov-product-card ${isUpdating ? "is-updating" : ""}`}
                key={item.idProveedorProducto || title}
              >
                <div className="prov-product-card-head">
                  <div className="prov-product-title">
                    <strong title={title}>{title}</strong>
                    <span title={item.skuProveedor || skuInterno}>
                      {skuInterno ? `SKU interno ${skuInterno}` : "Sin SKU interno"}
                      {item.skuProveedor ? ` - Prov. ${item.skuProveedor}` : ""}
                    </span>
                  </div>
                  <div className="prov-product-badges">
                    <span
                      className={`prov-relation-status ${
                        isUpdating ? "is-updating" : relationStateClass(item)
                      }`}
                    >
                      {isUpdating ? (
                        <>
                          <i className="pi pi-spin pi-spinner" />
                          Actualizando
                        </>
                      ) : (
                        enumText(state)
                      )}
                    </span>
                    {item.proveedorPreferido ? (
                      <span className="prov-preferred-pill">
                        <i className="pi pi-star-fill" />
                        Preferido
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="prov-product-meta-grid">
                  <span>
                    Ultimo costo
                    <strong>{moneyOrDash(item.ultimoCosto ?? item.precioCompra)}</strong>
                  </span>
                  <span>
                    Fecha del costo
                    <strong>{formatDate(item.fechaUltimoCosto)}</strong>
                  </span>
                  <span>
                    Presentacion
                    <strong>{valueOrDash(item.presentacionCompra)}</strong>
                  </span>
                  <span>
                    Minimo
                    <strong>{valueOrDash(item.cantidadMinima)}</strong>
                  </span>
                </div>

                <div className="prov-product-actions">
                  <Button
                    icon="pi pi-box"
                    className="prov-row-action"
                    onClick={() => openInventory(item)}
                    disabled={isUpdating}
                    aria-label="Abrir en inventario"
                    tooltip="Abrir en inventario"
                    tooltipOptions={{ position: "top" }}
                  />
                  <Button
                    icon="pi pi-shopping-cart"
                    className="prov-row-action"
                    onClick={() => openPurchases(item)}
                    disabled={isUpdating}
                    aria-label="Ver en compras"
                    tooltip="Ver en compras"
                    tooltipOptions={{ position: "top" }}
                  />
                  <Button
                    icon="pi pi-chart-line"
                    className="prov-row-action"
                    onClick={() => setHistoryItem(item)}
                    disabled={isUpdating}
                    aria-label="Historial de costos"
                    tooltip="Historial de costos"
                    tooltipOptions={{ position: "top" }}
                  />
                  {isActive ? (
                    <Button
                      icon="pi pi-ban"
                      className="prov-row-action"
                      onClick={() => setConfirm({ action: "desactivar", item })}
                      disabled={isUpdating}
                      loading={isUpdating && updatingRelation?.action === "desactivar"}
                      aria-label="Desactivar relacion"
                      tooltip="Desactivar relacion"
                      tooltipOptions={{ position: "top" }}
                    />
                  ) : null}
                  {isInactive ? (
                    <Button
                      icon="pi pi-refresh"
                      className="prov-row-action"
                      onClick={() => setConfirm({ action: "reactivar", item })}
                      disabled={isUpdating}
                      loading={isUpdating && updatingRelation?.action === "reactivar"}
                      aria-label="Reactivar relacion"
                      tooltip="Reactivar relacion"
                      tooltipOptions={{ position: "top" }}
                    />
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <AdvancedEmpty text="Sin productos asociados para este proveedor." />
      )}

      <ConfirmActionDialog
        visible={Boolean(confirm)}
        title={confirm?.action === "reactivar" ? "Reactivar relacion" : "Desactivar relacion"}
        detail={
          confirm?.action === "reactivar"
            ? "La relacion volvera a quedar activa para este proveedor. No se modifica inventario, compras ni stock."
            : "La relacion con el producto quedara inactiva. No se modifica inventario, compras ni stock."
        }
        loading={saving}
        onCancel={() => setConfirm(null)}
        onConfirm={applyStateAction}
      />
    </AdvancedSection>
  );
}
