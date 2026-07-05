import { Routes, Route, Navigate } from "react-router-dom";
import RequireAuth from "./guards/RequireAuth";
import RequireGuest from "./guards/RequireGuest";
import { useAuth } from "../auth/AuthContext";

/* --- AUTH --- */
import Login from "../components/Login/Login";
import LoginForm from "../components/Login/LoginForm";
import LoginRecuperar from "../components/Login/LoginRecuperar";
import LoginRecuperarPass from "../components/Login/LoginRecuperarPass";
import LoginRegister from "../components/Login/LoginRegister";
import Terminos from "../components/Login/Terminos";
import Privacidad from "../components/Login/Privacidad";

/* --- MÓDULOS --- */
import Ventas from "../components/Ventas/Ventas";
import Inventario from "../components/Inventario/Inventario";
import NotFound from "../components/NotFound/NotFound";

import Clientes from "../components/Clientes/Clientes";
import CrearClientes from "../components/Clientes/CrearClientes";
import ClienteSeleccionado from "../components/Clientes/ClienteSeleccionado";
import EditarCliente from "../components/Clientes/EditarCliente";

import Compras from "../components/Compras/Compras";
import ComprasProducto from "../components/Compras/ComprasProducto";
import ComprasTicket from "../components/Compras/ComprasTicket";
import ComprasProveedor from "../components/Compras/ComprasProveedor";
import Proveedores from "../components/Proveedores/Proveedores";

/* --- REPORTES Y CONFIGURACIÓN --- */
import ReporteCompras from "../components/Reportes/ReporteCompras/ReporteCompras";
import ReporteVentas from "../components/Reportes/ReporteVentas/ReporteVentas";
import ReporteBalance from "../components/Reportes/Reporte Balance/ReporteBalance"; /* 🔥 Import Nuevo */
import Ajustes from "../components/Configuracion/Ajustes";
import ConfiguracionExportaciones from "../components/Configuracion/ConfiguracionExportaciones";


function RootRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? "/ventas" : "/login"} replace />;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      {/* RUTAS PÚBLICAS (LOGIN) */}
      <Route element={<RequireGuest />}>
        <Route path="/login" element={<Login />}>
          <Route index element={<LoginForm />} />
          <Route path="registro" element={<LoginRegister />} />
          <Route path="recuperar-usuario" element={<LoginRecuperar />} />
          <Route path="recuperar-password" element={<LoginRecuperarPass />} />
        </Route>
        <Route path="/terminos" element={<Terminos />} />
        <Route path="/privacidad" element={<Privacidad />} />
      </Route>

      {/* RUTAS PROTEGIDAS (APP) */}
      <Route element={<RequireAuth />}>
        <Route path="ventas" element={<Ventas />} />
        <Route path="inventario" element={<Inventario />} />
        <Route path="compras" element={<Compras />} />
        <Route path="proveedores" element={<Proveedores />} />
        
        {/* Sub-rutas Compras */}
        <Route path="/compras/producto" element={<ComprasProducto />} />
        <Route path="/compras/ticket" element={<ComprasTicket />} />
        <Route path="/compras/proveedor" element={<ComprasProveedor />} />

        {/* Clientes */}
        <Route path="clientes" element={<Clientes />} />
        <Route path="clientes/:id" element={<ClienteSeleccionado />} />
        <Route path="clientes/crear" element={<CrearClientes />} />
        <Route path="clientes/:id/editar" element={<EditarCliente />} />

        {/* Configuración */}
        <Route path="ajustes" element={<Ajustes />} />
        <Route path="configuracion-exportaciones" element={<ConfiguracionExportaciones />} />

        {/* 🔥 REPORTES */}
        <Route path="reporte-compras" element={<ReporteCompras />} />
        <Route path="reporte-ventas" element={<ReporteVentas />} />
        <Route path="reporte-balance" element={<ReporteBalance />} /> 
      </Route>

      {/* ERRORES */}
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
