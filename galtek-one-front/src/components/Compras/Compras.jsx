import React from "react";
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
}