import React, { useEffect, useState, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { MultiSelect } from "primereact/multiselect";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import "../../style/components/Inventario/InventarioToolbarFilter.css";

import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";

// Mocks eliminados. Usando APIfetchApi.

const api = new APIfetchApi();

export default function InventarioToolbarFilter({
  visible,
  onHide,
  onApply,
  initialFilters = {},
  categoriasOptions = [],
  proveedoresOptions = [],
  almacenesOptions = [],
  stockEstadosOptions = [],
}) {
  const toast = useRef(null);

  // -------- Filtros seleccionados --------
  const [categorias, setCategorias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [activo, setActivo] = useState(initialFilters.activo ?? true);
  const [estadoStock, setEstadoStock] = useState([]);
  const [stockMin, setStockMin] = useState(null);
  const [stockMax, setStockMax] = useState(null);
  const [fechaRango, setFechaRango] = useState(null);
  const [tieneCaducados, setTieneCaducados] = useState(null);
  const [caducaEnDias, setCaducaEnDias] = useState(null);
  const [numLote, setNumLote] = useState("");
  const [ubicacion, setUbicacion] = useState("");

  // Mapeos ya resueltos en el padre
  const loadingOptions = false;
  const optionsError = null;

  // Se eliminaron helpers de mapeo que ahora están en el padre

  const isOk = (res) =>
    res &&
    (res.statusCode === 200 || res.status === "OK") &&
    Array.isArray(res.data);

  const showErrorToast = (summary, detail) => {
    toast.current?.show({
      severity: "error",
      summary,
      detail,
      life: 4000,
    });
  };

  const normalizeNumber = (value) =>
    typeof value === "number" && !Number.isNaN(value) ? value : null;

  const validateAndShowErrors = () => {
    const nStockMin = normalizeNumber(stockMin);
    const nStockMax = normalizeNumber(stockMax);

    // Validación de lógica que el UI no garantiza
    if (nStockMin !== null && nStockMax !== null && nStockMin > nStockMax) {
      showErrorToast(
        "Rango de stock inválido",
        "El stock mínimo no puede ser mayor que el máximo."
      );
      return false;
    }
    return true;
  };

  // -------- Cargar opciones cuando se abre el modal --------

  useEffect(() => {
    if (!visible) return;

    const isEmpty = !initialFilters || Object.keys(initialFilters).length === 0;

    if (isEmpty) {
      clearLocal();
    }
  }, [visible, initialFilters]);

  // Loading effect removed as options come from props

  // -------- Helpers para armar body que coincide con InventarioFilterDTO --------
  const toISOStart = (date) =>
    date instanceof Date ? date.toISOString().replace("Z", "") : null;

  const toISOEnd = (date) => {
    if (!(date instanceof Date)) return null;
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d.toISOString().replace("Z", "");
  };

  const buildRequestParams = () => {
    const nStockMin = normalizeNumber(stockMin);
    const nStockMax = normalizeNumber(stockMax);
    const nCaduca = normalizeNumber(caducaEnDias);
    const trimmedNumLote = numLote.trim();

    let actualizadoDesde = null;
    let actualizadoHasta = null;

    if (Array.isArray(fechaRango)) {
      actualizadoDesde = toISOStart(fechaRango[0]);
      actualizadoHasta = toISOEnd(fechaRango[1]);
    }

    // Construir objeto que coincida EXACTAMENTE con InventarioFilterDTO.java
    return {
      categoriaIds: categorias.length ? categorias : null,
      proveedorIds: proveedores.length ? proveedores : null,
      almacenIds: null, // Reservado para uso futuro
      activo: activo === "ALL" ? null : activo, // Boolean o null
      estadoStock: estadoStock.length ? estadoStock[0] : null, // Backend solo acepta 1 valor
      stockMin: nStockMin,
      stockMax: nStockMax,
      actualizadoDesde,
      actualizadoHasta,
      tieneLotesCaducados: tieneCaducados, // Boolean o null
      caducaEnDias: nCaduca,
      numeroLote: trimmedNumLote || null,
    };
  };

  // -------- Apply: valida y manda parámetros ya listos (string) --------
  const handleApply = () => {
    if (!validateAndShowErrors()) return;

    const params = buildRequestParams();
    onApply?.(params);
  };

  // -------- Limpiar filtros locales --------
  const clearLocal = () => {
    setCategorias([]);
    setProveedores([]);
    setActivo("ALL");
    setEstadoStock([]);
    setStockMin(null);
    setStockMax(null);
    setFechaRango(null);
    setTieneCaducados(null);
    setCaducaEnDias(null);
    setNumLote("");
    setUbicacion("");
  };

  // -------- Footer del diálogo --------
  const footer = (
    <div className="inv-fm-footer">
      <Button
        className="inv-fm-btn inv-fm-btn--clear"
        icon="pi pi-filter-slash"
        label="Limpiar"
        onClick={clearLocal}
      />
      <div className="grow" />
      <Button
        className="inv-fm-btn inv-fm-btn--cancel"
        label="Cancelar"
        onClick={onHide}
      />
      <Button
        className="inv-fm-btn inv-fm-btn--apply"
        icon="pi pi-check"
        label="Aplicar"
        onClick={handleApply}
      />
    </div>
  );

  // -------- Placeholders “inteligentes” --------
  const placeholderCategorias = loadingOptions
    ? "Cargando categorías…"
    : categoriasOptions.length
    ? "Selecciona categorías"
    : "Sin datos";

  const placeholderProveedores = loadingOptions
    ? "Cargando proveedores…"
    : proveedoresOptions.length
    ? "Selecciona proveedores"
    : "Sin datos";

  const placeholderEstadoStock = loadingOptions
    ? "Cargando estados…"
    : stockEstadosOptions.length
    ? "Agotado, Crítico, Bajo, Óptimo"
    : "Sin datos";

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        header="Filtros de inventario"
        visible={visible}
        onHide={onHide}
        modal
        closable
        draggable={false}
        className="inv-filter-dialog"
        footer={footer}
      >
        <div className="inv-fm-grid">
          {/* CATEGORÍA */}
          <div className="inv-fm-item inv-fm-item--categorias">
            <label>Categoría</label>
            <MultiSelect
              className="inv-fm-control inv-fm-ms-categorias"
              panelClassName="inv-fm-ms-categorias-panel"
              value={categorias}
              onChange={(e) => setCategorias(e.value)}
              options={categoriasOptions}
              placeholder={placeholderCategorias}
              display="chip"
              disabled={loadingOptions || !categoriasOptions.length}
              panelHeaderTemplate={(options) => (
                <div className={`${options.className} inv-ms-cat-header`}>
                  {options.checkboxElement}
                  <span className="inv-ms-cat-header-label">Categorías</span>
                  <button
                    type="button"
                    className="inv-ms-cat-header-clear"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCategorias([]);
                    }}
                  >
                    Clear
                  </button>
                </div>
              )}
            />
          </div>

          {/* PROVEEDOR */}
          <div className="inv-fm-item inv-fm-item--proveedores">
            <label>Proveedor</label>
            <MultiSelect
              className="inv-fm-control inv-fm-ms-proveedores"
              panelClassName="inv-fm-ms-proveedores-panel"
              value={proveedores}
              onChange={(e) => setProveedores(e.value)}
              options={proveedoresOptions}
              placeholder={placeholderProveedores}
              display="chip"
              filter
              disabled={loadingOptions || !proveedoresOptions.length}
              panelHeaderTemplate={(options) => (
                <div className={`${options.className} inv-ms-prov-header`}>
                  {options.checkboxElement}
                  <span className="inv-ms-prov-header-label">Proveedores</span>
                  <button
                    type="button"
                    className="inv-ms-prov-header-clear"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setProveedores([]);
                    }}
                  >
                    Clear
                  </button>
                </div>
              )}
            />
          </div>

          {/* ESTADO DEL PRODUCTO (catálogo fijo de negocio) */}
          <div className="inv-fm-item inv-fm-item--estado-producto">
            <label>Estado del producto</label>
            <Dropdown
              className="inv-fm-control inv-fm-dd-estadoProducto"
              panelClassName="inv-fm-dd-estadoProducto-panel"
              value={activo}
              onChange={(e) => setActivo(e.value)}
              options={[
                { label: "Todos", value: "ALL" },
                { label: "Activos", value: true },
                { label: "Descontinuados", value: false },
              ]}
              placeholder="Todos"
            />
          </div>

          {/* ESTADO DE STOCK (desde back) */}
          <div className="inv-fm-item inv-fm-item--estado-stock">
            <label>Estado de stock</label>
            <MultiSelect
              className="inv-fm-control inv-fm-ms-estadoStock"
              panelClassName="inv-fm-ms-estadoStock-panel"
              value={estadoStock}
              onChange={(e) => setEstadoStock(e.value)}
              options={stockEstadosOptions}
              placeholder={placeholderEstadoStock}
              display="chip"
              disabled={loadingOptions || !stockEstadosOptions.length}
              panelHeaderTemplate={(options) => (
                <div className={`${options.className} inv-ms-stock-header`}>
                  {options.checkboxElement}
                  <span className="inv-ms-stock-header-label">
                    Estados de stock
                  </span>
                  <button
                    type="button"
                    className="inv-ms-stock-header-clear"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEstadoStock([]);
                    }}
                  >
                    Clear
                  </button>
                </div>
              )}
            />
          </div>

          {/* STOCK MIN/MAX */}
          <div className="inv-fm-item inv-fm-item--stock-range">
            <label>Stock (mín - máx)</label>
            <div className="inv-fm-range">
              <InputNumber
                className="inv-fm-control inv-fm-in-stockMin"
                value={stockMin}
                onValueChange={(e) => setStockMin(e.value)}
                placeholder="Mín"
                min={0}
                showButtons
              />
              <span className="inv-fm-range-sep">—</span>
              <InputNumber
                className="inv-fm-control inv-fm-in-stockMax"
                value={stockMax}
                onValueChange={(e) => setStockMax(e.value)}
                placeholder="Máx"
                min={0}
                showButtons
              />
            </div>
          </div>

          {/* RANGO FECHAS */}
          <div className="inv-fm-item inv-fm-item--fecha">
            <label>Actualizado entre</label>
            <Calendar
              className="inv-fm-control inv-fm-cal-actualizado"
              panelClassName="inv-fm-cal-actualizado-panel"
              value={fechaRango}
              onChange={(e) => setFechaRango(e.value)}
              selectionMode="range"
              readOnlyInput
              showIcon
              hideOnRangeSelection
              placeholder="Rango de fechas"
            />
          </div>

          {/* LOTES CADUCADOS */}
          <div className="inv-fm-item inv-fm-item--caducados">
            <label>¿Tiene lotes caducados?</label>
            <Dropdown
              className="inv-fm-control inv-fm-dd-caducados"
              panelClassName="inv-fm-dd-caducados-panel"
              value={tieneCaducados}
              onChange={(e) => setTieneCaducados(e.value)}
              options={[
                { label: "Todos", value: null },
                { label: "Sí", value: true },
                { label: "No", value: false },
              ]}
              placeholder="Todos"
            />
          </div>

          {/* CADUCA EN DÍAS */}
          <div className="inv-fm-item inv-fm-item--caduca-dias">
            <label>Caduca en ≤ (días)</label>
            <InputNumber
              className="inv-fm-control inv-fm-in-caducaDias"
              value={caducaEnDias}
              onValueChange={(e) => setCaducaEnDias(e.value)}
              placeholder="Ej: 30"
              min={0}
              showButtons
            />
          </div>

          {/* LOTE */}
          <div className="inv-fm-item inv-fm-item--lote">
            <label>Número de lote</label>
            <InputText
              className="inv-fm-control inv-fm-it-numLote"
              value={numLote}
              onChange={(e) => setNumLote(e.target.value)}
              placeholder="Ej: L001-2"
            />
          </div>

          {/* UBICACIÓN */}
          <div className="inv-fm-item inv-fm-item--ubicacion">
            <label>Ubicación</label>
            <InputText
              className="inv-fm-control inv-fm-it-ubicacion"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              placeholder="Rack, pasillo…"
            />
          </div>
        </div>

        {optionsError && <p className="inv-fm-error-msg">{optionsError}</p>}
      </Dialog>
    </>
  );
}
