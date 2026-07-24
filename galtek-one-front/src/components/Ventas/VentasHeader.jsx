import React from "react";
import { Barcode, History, Search, X } from "lucide-react";
import CashStatusIndicator from "../Caja/CashStatusIndicator";
import "../../style/components/Ventas/VentasHeader.css";

const VentasHeader = ({
  terminoBusqueda = "",
  onBusquedaChange,
  onBusquedaSubmit,
  ventasDelDia = 0,
  onVerHistorial,
  onCajaClick,
  cashIndicatorRef,
  searchInputRef,
}) => {
  return (
    <header className="ventas-header">
      <div className="ventas-command-bar">
        <div className="ventas-title-block">
          <h1>Venta rapida</h1>
        </div>

        <form
          className="ventas-search-shell"
          onSubmit={(e) => {
            e.preventDefault();
            onBusquedaSubmit?.();
          }}
        >
          <Search size={21} aria-hidden="true" />
          <input
            ref={searchInputRef}
            value={terminoBusqueda}
            onChange={(e) => onBusquedaChange?.(e.target.value)}
            placeholder="Buscar o escanear producto"
            aria-label="Buscar productos para venta"
            autoComplete="off"
            spellCheck="false"
          />

          {terminoBusqueda && (
            <button
              type="button"
              className="ventas-search-clear"
              onClick={() => onBusquedaChange?.("")}
              title="Limpiar busqueda"
              aria-label="Limpiar busqueda"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </form>

        <div className="ventas-header-actions">
          <CashStatusIndicator ref={cashIndicatorRef} onClick={onCajaClick} />

          <button
            type="button"
            className="ventas-counter-chip"
            onClick={onVerHistorial}
            title={`${ventasDelDia} venta${ventasDelDia === 1 ? "" : "s"} registrada${ventasDelDia === 1 ? "" : "s"} hoy`}
            aria-label={`Abrir ventas de hoy. ${ventasDelDia} venta${ventasDelDia === 1 ? "" : "s"} registrada${ventasDelDia === 1 ? "" : "s"}`}
          >
            <History size={16} aria-hidden="true" />
            <span>Ventas hoy</span>
            <strong>{ventasDelDia}</strong>
          </button>

          <div className="ventas-scan-status" aria-hidden="true">
            <Barcode size={16} />
            <span>Escaneo listo</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default VentasHeader;
