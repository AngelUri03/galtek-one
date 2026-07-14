/*import React from "react";
import Shell from "../common/Shell";
import { Link } from "react-router-dom";
import { Card } from "primereact/card";
//import { Button } from "primereact/button";
import "../../style/components/Compras/Compras.css";
import useLockBodyScroll from "../../Hooks/UseLockBodyScroll";

export default function Compras() {
  useLockBodyScroll(true);
  return (
    <Shell>
      <div className="compras-wrapper">
        <h1 className="compras-title">Registro de compras</h1>
        <div className="compras-cards">
          <Link to="/compras/producto" className="compras-card">
            <i className="pi pi-box"></i>
            <h3>Producto</h3>
          </Link>
          <Link to="/compras/ticket" className="compras-card">
            <i className="pi pi-ticket"></i>
            <h3>Ticket</h3>
          </Link>
          <Link to="/compras/proveedor" className="compras-card">
            <i className="pi pi-warehouse"></i>
            <h3>Proveedor</h3>
          </Link>
        </div>
      </div>
    </Shell>
  );
}*/

import React, { useState } from "react";
import Shell from "../common/Shell";
import { TabView, TabPanel } from "primereact/tabview";
import NuevaCompra from "./NuevaCompra";
import HistorialCompras from "./HistorialCompras";
import "../../style/components/Compras/Compras.css";
import PanelSugerencias from "./PanelSugerencias";
// import useLockBodyScroll from "../../Hooks/UseLockBodyScroll"; // Eliminado para liberar el scroll general

export default function Compras() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <Shell>
      <div className="compras-workspace-wrapper">
        <div className="compras-tabs-container">
          <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
            
            {/* Ícono de carrito añadido para reafirmar visualmente que estamos en Compras */}
            <TabPanel header="Nueva Compra" leftIcon="pi pi-shopping-cart mr-2">
              <NuevaCompra />
            </TabPanel>

            <TabPanel header="Historial de Compras" leftIcon="pi pi-history mr-2">
              <HistorialCompras />
            </TabPanel>

            <TabPanel header="Borradores" leftIcon="pi pi-file-edit mr-2">
              <div className="placeholder-content">
                <h2>Borradores</h2>
                <p>Espacio para retomar compras guardadas temporalmente.</p>
              </div>
            </TabPanel>

            <TabPanel header="Sugerencias" leftIcon="pi pi-lightbulb mr-2">
              <PanelSugerencias /> 
            </TabPanel>

          </TabView>
        </div>
      </div>
    </Shell>
  );
}