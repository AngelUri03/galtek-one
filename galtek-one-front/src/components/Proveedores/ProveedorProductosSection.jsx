import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Tag } from "primereact/tag";
import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";
import { formatDate, moneyOrDash, readApiPayload } from "./proveedoresUtils";
import {
  RELACION_PRODUCTO_OPTIONS,
  buildProductoPayload,
  createProductoForm,
  normalizeProductosCatalog,
  productLabel,
  relationProductName,
  relationProductSku,
} from "./proveedorAdvancedUtils";
import {
  AdvancedCardActions,
  AdvancedEmpty,
  AdvancedFormActions,
  AdvancedSection,
  ConfirmActionDialog,
  TextField,
} from "./ProveedorAdvancedShared";

const api = new APIfetchApi();

function getProductoUrl(idProveedor, idRelacion) {
  return idRelacion
    ? `${endpoints.proveedores}/${idProveedor}/productos/${idRelacion}`
    : `${endpoints.proveedores}/${idProveedor}/productos`;
}

function selectedSku(catalog, idProducto) {
  return catalog.find((producto) => producto.value === idProducto)?.codigoBarras || "";
}

export default function ProveedorProductosSection({
  proveedor,
  items,
  onRefresh,
  showToast,
}) {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [errors, setErrors] = useState({});

  const hasItems = items.length > 0;
  const editing = Boolean(form?.idProveedorProducto);

  const catalogById = useMemo(
    () => new Map(catalog.map((producto) => [producto.value, producto])),
    [catalog]
  );

  const loadCatalog = async () => {
    if (catalog.length || loadingCatalog) return;
    setLoadingCatalog(true);
    try {
      const response = await api.fetchApi({}, "GET", undefined, endpoints.ventasProductos);
      const payload = await readApiPayload(response, "productos");
      setCatalog(normalizeProductosCatalog(payload));
    } catch (error) {
      showToast("error", "Productos", error?.message || "No se pudo cargar catalogo.");
    } finally {
      setLoadingCatalog(false);
    }
  };

  useEffect(() => {
    if (form) loadCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const openCreate = () => {
    setForm(createProductoForm());
    setErrors({});
  };

  const openEdit = (row) => {
    setForm(createProductoForm(row));
    setErrors({});
  };

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.idProducto) nextErrors.idProducto = "Selecciona el producto interno.";
    if (form.ultimoCosto != null && Number(form.ultimoCosto) < 0) {
      nextErrors.ultimoCosto = "No puede ser negativo.";
    }
    if (form.cantidadMinima != null && Number(form.cantidadMinima) < 0) {
      nextErrors.cantidadMinima = "No puede ser negativa.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const save = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const response = await api.fetchApi(
        {},
        editing ? "PUT" : "POST",
        buildProductoPayload(form),
        getProductoUrl(proveedor.idProveedor, form.idProveedorProducto)
      );
      await readApiPayload(response, "guardar producto asociado");
      showToast("success", "Productos asociados", "Relacion comercial guardada.");
      setForm(null);
      await onRefresh();
    } catch (error) {
      showToast("error", "Productos asociados", error?.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const archive = async () => {
    if (!confirm) return;

    setSaving(true);
    try {
      const response = await api.fetchApi(
        {},
        "DELETE",
        undefined,
        getProductoUrl(proveedor.idProveedor, confirm.idProveedorProducto)
      );
      await readApiPayload(response, "desactivar producto asociado");
      showToast("success", "Productos asociados", "Relacion desactivada.");
      setConfirm(null);
      await onRefresh();
    } catch (error) {
      showToast("error", "Productos asociados", error?.message || "No se pudo completar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdvancedSection
      title="Productos asociados"
      subtitle="Relacion comercial de surtido, costos y presentacion."
      icon="pi pi-box"
      addLabel="Agregar producto"
      onAdd={openCreate}
    >
      {form ? (
        <div className="prov-adv-form">
          <div className="prov-form-grid">
            <label className="prov-field prov-field-wide">
              <span>Producto interno</span>
              <Dropdown
                value={form.idProducto}
                options={catalog}
                onChange={(event) => {
                  update("idProducto", event.value);
                  update("skuInterno", selectedSku(catalog, event.value));
                }}
                loading={loadingCatalog}
                filter
                placeholder="Selecciona un producto"
                emptyMessage="No hay productos disponibles"
              />
              {errors.idProducto ? <small className="prov-field-error">{errors.idProducto}</small> : null}
            </label>
            <TextField
              label="SKU interno"
              value={form.skuInterno || selectedSku(catalog, form.idProducto)}
              onChange={() => {}}
              disabled
            />
            <TextField
              label="SKU del proveedor"
              value={form.skuProveedor}
              onChange={(value) => update("skuProveedor", value)}
            />
            <label className="prov-field">
              <span>Ultimo costo</span>
              <InputNumber
                value={form.ultimoCosto}
                onValueChange={(event) => update("ultimoCosto", event.value)}
                mode="currency"
                currency="MXN"
                locale="es-MX"
                min={0}
              />
              {errors.ultimoCosto ? <small className="prov-field-error">{errors.ultimoCosto}</small> : null}
            </label>
            <TextField
              label="Fecha ultimo costo"
              type="datetime-local"
              value={form.fechaUltimoCosto}
              onChange={(value) => update("fechaUltimoCosto", value)}
            />
            <TextField
              label="Presentacion de compra"
              value={form.presentacionCompra}
              onChange={(value) => update("presentacionCompra", value)}
              placeholder="Caja, paquete, charola"
            />
            <label className="prov-field">
              <span>Cantidad minima</span>
              <InputNumber
                value={form.cantidadMinima}
                onValueChange={(event) => update("cantidadMinima", event.value)}
                min={0}
                minFractionDigits={0}
                maxFractionDigits={3}
              />
              {errors.cantidadMinima ? <small className="prov-field-error">{errors.cantidadMinima}</small> : null}
            </label>
            <label className="prov-field">
              <span>Estado de relacion</span>
              <Dropdown
                value={form.estadoRelacion}
                options={RELACION_PRODUCTO_OPTIONS}
                onChange={(event) => update("estadoRelacion", event.value)}
              />
            </label>
            <label className={`prov-credit-switch ${form.proveedorPreferido ? "is-selected" : ""}`}>
              <Checkbox
                checked={form.proveedorPreferido}
                onChange={(event) => update("proveedorPreferido", event.checked)}
              />
              <span>Proveedor preferido</span>
            </label>
          </div>
          <AdvancedFormActions
            editing={editing}
            saving={saving}
            onCancel={() => setForm(null)}
            onSave={save}
          />
        </div>
      ) : null}

      {hasItems ? (
        <div className="prov-adv-card-grid">
          {items.map((item) => {
            const skuInterno = relationProductSku(item);
            const catalogProduct = item.producto?.idProducto
              ? catalogById.get(item.producto.idProducto)
              : null;
            const title = relationProductName(item);
            return (
              <article className="prov-adv-card" key={item.idProveedorProducto || title}>
                <div className="prov-adv-card-main">
                  <div>
                    <strong title={title}>{title}</strong>
                    <span title={item.skuProveedor || skuInterno}>
                      {skuInterno ? `SKU interno ${skuInterno}` : "Sin SKU interno"}
                      {item.skuProveedor ? ` - Prov. ${item.skuProveedor}` : ""}
                    </span>
                  </div>
                  <Tag
                    value={(item.estadoRelacion || "ACTIVA").toLowerCase()}
                    severity={item.estadoRelacion === "ACTIVA" ? "success" : "secondary"}
                    className="prov-state-tag"
                  />
                </div>
                <div className="prov-adv-meta-grid">
                  <span>Ultimo costo <strong>{moneyOrDash(item.ultimoCosto || item.precioCompra)}</strong></span>
                  <span>Fecha <strong>{formatDate(item.fechaUltimoCosto)}</strong></span>
                  <span>Presentacion <strong>{item.presentacionCompra || "--"}</strong></span>
                  <span>Minimo <strong>{item.cantidadMinima ?? "--"}</strong></span>
                </div>
                <AdvancedCardActions
                  onEdit={() => openEdit(item)}
                  onArchive={() => setConfirm(item)}
                  archiveLabel="Desactivar relacion"
                  extra={
                    <>
                      <Button
                        icon="pi pi-box"
                        className="prov-row-action"
                        onClick={() => navigate("/inventario")}
                        aria-label="Abrir inventario"
                        tooltip={catalogProduct ? productLabel(catalogProduct) : "Abrir inventario"}
                        tooltipOptions={{ position: "top" }}
                      />
                      <Button
                        icon="pi pi-shopping-cart"
                        className="prov-row-action"
                        onClick={() => navigate("/compras/proveedor")}
                        aria-label="Ver compras"
                        tooltip="Ver compras"
                        tooltipOptions={{ position: "top" }}
                      />
                    </>
                  }
                />
              </article>
            );
          })}
        </div>
      ) : (
        <AdvancedEmpty text="Sin productos asociados. Agrega los productos que este proveedor puede surtir." />
      )}

      <ConfirmActionDialog
        visible={Boolean(confirm)}
        title="Desactivar relacion"
        detail="La relacion con el producto quedara inactiva. No se modifica inventario ni stock."
        loading={saving}
        onCancel={() => setConfirm(null)}
        onConfirm={archive}
      />
    </AdvancedSection>
  );
}
