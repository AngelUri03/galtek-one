import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { Skeleton } from "primereact/skeleton";
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
  loading = false,
  onRefresh,
  onOpenCostHistory,
  showToast,
  readOnly = false,
}) {
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [updatingRelation, setUpdatingRelation] = useState(null);
  const hasItems = items.length > 0;
  const showLoading = loading && !hasItems;

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
    showToast?.(
      "success",
      "Productos asociados",
      "Relacion pausada. Ya no aparecera en compras nuevas."
    );
  };

  const reactivate = async (item) => {
    const response = await api.fetchApi(
      {},
      "PUT",
      { estadoRelacion: "ACTIVA", estatus: true },
      getProductoUrl(proveedor.idProveedor, item.idProveedorProducto)
    );
    await readApiPayload(response, "reactivar producto asociado");
    showToast?.(
      "success",
      "Productos asociados",
      "Relacion reactivada. Ya aparecera en compras nuevas."
    );
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
      subtitle={
        readOnly
          ? "Consulta historica de surtido, preferencia y costos."
          : "Relacion comercial de surtido, preferencia y costos."
      }
      icon="pi pi-box"
    >
      {showLoading ? (
        <div className="prov-product-card-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="prov-product-card is-loading" key={index}>
              <Skeleton width="68%" height="18px" />
              <Skeleton width="48%" height="13px" />
              <div className="prov-product-meta-grid">
                {Array.from({ length: 4 }).map((__, metaIndex) => (
                  <Skeleton key={metaIndex} height="48px" borderRadius="10px" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : hasItems ? (
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
                    tooltipOptions={{ position: "top", className: "prov-action-tooltip" }}
                  />
                  <Button
                    icon="pi pi-shopping-cart"
                    className="prov-row-action"
                    onClick={() => openPurchases(item)}
                    disabled={isUpdating}
                    aria-label="Ver en compras"
                    tooltip="Ver en compras"
                    tooltipOptions={{ position: "top", className: "prov-action-tooltip" }}
                  />
                  <Button
                    icon="pi pi-chart-line"
                    className="prov-row-action"
                    onClick={() => onOpenCostHistory?.(item)}
                    disabled={isUpdating || !onOpenCostHistory}
                    aria-label="Historial de costos"
                    tooltip="Historial de costos"
                    tooltipOptions={{ position: "top", className: "prov-action-tooltip" }}
                  />
                  {isActive && !readOnly ? (
                    <Button
                      icon="pi pi-pause"
                      className="prov-row-action"
                      onClick={() => setConfirm({ action: "desactivar", item })}
                      disabled={isUpdating}
                      loading={isUpdating && updatingRelation?.action === "desactivar"}
                      aria-label="Desactivar relacion"
                      tooltip="Pausar en compras"
                      tooltipOptions={{ position: "top", className: "prov-action-tooltip" }}
                    />
                  ) : null}
                  {isInactive && !readOnly ? (
                    <Button
                      icon="pi pi-play"
                      className="prov-row-action"
                      onClick={() => setConfirm({ action: "reactivar", item })}
                      disabled={isUpdating}
                      loading={isUpdating && updatingRelation?.action === "reactivar"}
                      aria-label="Reactivar relacion"
                      tooltip="Usar en compras"
                      tooltipOptions={{ position: "top", className: "prov-action-tooltip" }}
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
        title={confirm?.action === "reactivar" ? "Usar producto en compras" : "Pausar producto en compras"}
        detail={
          confirm?.action === "reactivar"
            ? "Este producto volvera a aparecer al registrar compras nuevas con este proveedor."
            : "Este producto dejara de aparecer al registrar compras nuevas con este proveedor. Su historial queda disponible por si lo vuelves a usar."
        }
        loading={saving}
        onCancel={() => setConfirm(null)}
        onConfirm={applyStateAction}
      />
    </AdvancedSection>
  );
}
