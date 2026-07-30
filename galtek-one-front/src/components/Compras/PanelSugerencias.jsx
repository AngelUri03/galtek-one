import React, { useState, useMemo } from "react";
import useInventarioSugerencias from "../../Hooks/UseInventarioSugerencias";
import "../../style/components/Compras/PanelSugerencias.css";

export default function PanelSugerencias() {
  const { productos: sugerencias, getStockColor } = useInventarioSugerencias();
  const [proveedorFiltro, setProveedorFiltro] = useState("Todos");

  // Extraer proveedores únicos solo de las sugerencias
  const proveedoresUnicos = useMemo(() => {
    const set = new Set(sugerencias.map((s) => s.proveedor).filter(Boolean));
    return ["Todos", ...Array.from(set).sort()];
  }, [sugerencias]);

  const sugerenciasFiltradas = useMemo(() => {
    if (proveedorFiltro === "Todos") return sugerencias;
    return sugerencias.filter((s) => s.proveedor === proveedorFiltro);
  }, [sugerencias, proveedorFiltro]);

  return (
    <div className="nc-card panel-sugerencias-wrapper">
      <h3>Sugerencias de compra</h3>
      <div className="sugerencia-panel">
        <div className="sugerencia-header">
          <span>Proveedor</span>
          <select value={proveedorFiltro} onChange={(e) => setProveedorFiltro(e.target.value)}>
            {proveedoresUnicos.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="tabla-sugerencias-container">
          <table className="sugerencia-tabla">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {sugerenciasFiltradas.length > 0 ? (
                sugerenciasFiltradas.map((sug, i) => (
                  <tr key={`${sug.producto}-${i}`}>
                    <td>
                      <div className="stock-indicador">
                        <span className={`circulo ${getStockColor(sug.stock)}`}></span>
                        <div>
                          <span className="producto-nombre">{sug.producto}</span>
                          <div className="proveedor">{sug.proveedor}</div>
                        </div>
                      </div>
                    </td>
                    <td className="stock-valor">{sug.stock}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" style={{ textAlign: "center", padding: "1rem", color: "#888" }}>
                    No hay sugerencias para este proveedor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}