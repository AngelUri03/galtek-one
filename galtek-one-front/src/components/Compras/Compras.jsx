/*import React, { useState } from "react";
import Shell from "../common/Shell";
import { TabView, TabPanel } from "primereact/tabview";
import NuevaCompra from "./NuevaCompra";
import HistorialCompras from "./HistorialCompras";
import "../../style/components/Compras/Compras.css";
import PanelSugerencias from "./PanelSugerencias";
// import useLockBodyScroll from "../../Hooks/UseLockBodyScroll"; 

export default function Compras() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <Shell>
      
      <main className="compras-workspace-wrapper">
        
        
        <section className="comp-header">
          <div className="comp-header-title">
            <i className="pi pi-shopping-cart" />
            <span>COMPRAS</span>
          </div>
        </section>

        <div className="compras-tabs-container">
          <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
            
            <TabPanel header="Nueva Compra" leftIcon="pi pi-shopping-cart">
              <NuevaCompra />
            </TabPanel>

            <TabPanel header="Historial de Compras" leftIcon="pi pi-history">
              <HistorialCompras />
            </TabPanel>

            <TabPanel header="Borradores" leftIcon="pi pi-file-edit">
              <div className="placeholder-content">
                <i className="pi pi-file-edit" style={{ fontSize: "2rem", marginBottom: "8px", color: "var(--comp-brand)" }}></i>
                <h2>Borradores</h2>
                <p>Espacio para retomar compras guardadas temporalmente.</p>
              </div>
            </TabPanel>

            <TabPanel header="Sugerencias" leftIcon="pi pi-lightbulb">
              <PanelSugerencias />
            </TabPanel>

          </TabView>
        </div>
      </main>
    </Shell>
  );
}*/

import React, { useState } from "react";
import Shell from "../common/Shell";
import NuevaCompra from "./NuevaCompra";
import HistorialCompras from "./HistorialCompras";
import "../../style/components/Compras/Compras.css";
import PanelSugerencias from "./PanelSugerencias";

export default function Compras() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <Shell>
      <main className="compras-workspace-wrapper">
        
        {/* HEADER COMBINADO: Título a la izquierda, Pestañas a la derecha */}
        <section className="comp-header">
          <div className="comp-header-title">
            <i className="pi pi-shopping-cart" />
            <span>COMPRAS</span>
          </div>
          
          <nav className="comp-header-tabs">
            <button 
              className={`comp-tab-btn ${activeIndex === 0 ? "active" : ""}`}
              onClick={() => setActiveIndex(0)}
            >
              <i className="pi pi-shopping-cart" /> Nueva Compra
            </button>
            
            <button 
              className={`comp-tab-btn ${activeIndex === 1 ? "active" : ""}`}
              onClick={() => setActiveIndex(1)}
            >
              <i className="pi pi-history" /> Historial
            </button>

            <button 
              className={`comp-tab-btn ${activeIndex === 2 ? "active" : ""}`}
              onClick={() => setActiveIndex(2)}
            >
              <i className="pi pi-file-edit" /> Borradores
            </button>

            <button 
              className={`comp-tab-btn ${activeIndex === 3 ? "active" : ""}`}
              onClick={() => setActiveIndex(3)}
            >
              <i className="pi pi-lightbulb" /> Sugerencias
            </button>
          </nav>
        </section>

        {/* CONTENIDO DINÁMICO: Renderiza solo el componente activo */}
        <section className="comp-content">
          {activeIndex === 0 && <NuevaCompra />}
          {activeIndex === 1 && <HistorialCompras />}
          {activeIndex === 2 && (
            <div className="placeholder-content">
              <i className="pi pi-file-edit" style={{ fontSize: "2rem", marginBottom: "8px", color: "var(--comp-brand)" }}></i>
              <h2>Borradores</h2>
              <p>Espacio para retomar compras guardadas temporalmente.</p>
            </div>
          )}
          {activeIndex === 3 && <PanelSugerencias />}
        </section>

      </main>
    </Shell>
  );
}