import React from "react";
import { Button } from "primereact/button";
import { Menubar } from "primereact/menubar";
import { useNavigate, useLocation } from "react-router-dom";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "../../style/components/common/NavBar.css";
import NotificationBell from "./NotificationBell";
import UserProfileMenu from "./UserProfileMenu";

const NavBar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const go = (path) => navigate(path, { replace: false });

  const start = (
    <Button className="logo-button" onClick={() => go("/ventas")}>
      Galtek One
    </Button>
  );

  const items = [
    { 
      label: "Ventas", 
      icon: "pi pi-dollar", 
      command: () => go("/ventas") 
    },
    {
      label: "Inventario",
      icon: "pi pi-box",
      command: () => go("/inventario"),
    },
    {
      label: "Compras",
      icon: "pi pi-shopping-cart",
      command: () => go("/compras"),
    },
    {
      label: "Clientes",
      icon: "pi pi-users",
      command: () => go("/clientes"),
    },
    {
      label: "Reportes", /* Nombre actualizado */
      icon: "pi pi-chart-bar",
      items: [
        {
          label: "Resumen de Ventas",
          icon: "pi pi-chart-line",
          command: () => go("/reporte-ventas"),
        },
        {
          label: "Resumen de Compras",
          icon: "pi pi-shopping-bag",
          command: () => go("/reporte-compras"),
        },
        {
          separator: true
        },
        {
          label: "Balance General", /* Nueva opción apuntando a la ruta nueva */
          icon: "pi pi-briefcase",
          command: () => go("/reporte-balance"),
        }
      ],
    },
  ];

  return (
    <Menubar
      start={start}
      model={items}
      end={
        <div className="custom-menubar-end">
          <NotificationBell />
          <UserProfileMenu />
        </div>
      }
      className="custom-menubar"
    />
  );
};

export default NavBar;