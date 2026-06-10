import React, { useEffect, useRef } from "react";
import { InputText } from "primereact/inputtext";
import "../../style/components/Ventas/VentasHeader.css";

const VentasHeader = ({
  categorias = [],
  categoriaSeleccionada = "Todos",
  onCategoriaChange,
  terminoBusqueda = "",
  onBusquedaChange,
  loadingCategorias = false,
  ventasDelDia = 0,
  onVerHistorial,
}) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  const handleClickCategoria = (value) => {
    if (!onCategoriaChange) return;
    onCategoriaChange(value);
  };

  return (
    <header className="ventas-header">
      {/* BUSCADOR + CONTADOR */}
      <div className="ventas-header-search">
        <span className="p-input-search ventas-search">
          <i className="pi pi-search" />
          <InputText
            value={terminoBusqueda}
            onChange={(e) => onBusquedaChange?.(e.target.value)}
            placeholder="Buscar producto por nombre…"
            aria-label="Buscar productos para venta"
          />
        </span>

        <div className="ventas-counter-chip" onClick={onVerHistorial}>
          <i className="pi pi-chart-bar ventas-counter-icon" />
          <span className="ventas-counter-label">Ventas hoy</span>
          <span className="ventas-counter-value">{ventasDelDia}</span>
        </div>
      </div>

      {/* CATEGORÍAS */}
      <div className="ventas-header-categorias">
        <div className="ventas-categorias-label">
          <span className="ventas-categorias-title">Categoría</span>
          <span className="ventas-categorias-divider">|</span>
        </div>

        <div className="ventas-categorias-scroll" ref={scrollRef}>
          {/* Todos */}
          <button
            type="button"
            className={
              "ventas-categoria-pill" +
              (categoriaSeleccionada === "Todos"
                ? " ventas-categoria-pill--active"
                : "")
            }
            onClick={() => handleClickCategoria("Todos")}
          >
            Todos
          </button>

          {/* Recientes */}
          <button
            type="button"
            className={
              "ventas-categoria-pill" +
              (categoriaSeleccionada === "Recientes"
                ? " ventas-categoria-pill--active"
                : "")
            }
            onClick={() => handleClickCategoria("Recientes")}
          >
            Recientes
          </button>

          {loadingCategorias && categorias.length === 0 && (
            <span className="ventas-categorias-loading">
              Cargando categorías…
            </span>
          )}

          {/* Dinámicas */}
          {categorias.map((cat) => {
            const id = cat.idCategoria ?? cat.id;
            const nombre = cat.nombreCategoria ?? cat.nombre ?? "Sin nombre";
            const active = categoriaSeleccionada === nombre;

            return (
              <button
                key={id ?? nombre}
                type="button"
                className={
                  "ventas-categoria-pill" +
                  (active ? " ventas-categoria-pill--active" : "")
                }
                onClick={() => handleClickCategoria(nombre)}
              >
                {nombre}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

export default VentasHeader;