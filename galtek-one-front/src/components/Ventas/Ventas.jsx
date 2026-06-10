import React, { useEffect, useMemo, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";

import NavBar from "../common/NavBar";

import VentasHeader from "./VentasHeader";
import VentasProductos from "./VentasProductos";
import VentasCarrito from "./VentasCarrito";
import ConfirmarPagoModal from "./Modales/ConfirmarPagoModal/ConfirmarPagoModal";
import CompraExitosa from "./Modales/CompraExitosa";
import HistorialVentasPanel from "./Modales/HistorialVentasPanel";

import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";

import "../../style/components/Ventas/Ventas.css";

const api = new APIfetchApi();

const STEP_PESAJE = 0.1;

const mapProductosFromApi = (list) =>
  (Array.isArray(list) ? list : []).map((p) => {
    const unidad = p.unidad?.nombreUnidad || p.unidadMedida || p.unidad || "pz";

    return {
      id: p.idProducto ?? p.id,
      nombre: p.nombreProducto ?? p.nombre ?? "Producto sin nombre",
      precio: Number(p.precioVenta ?? p.precio ?? 0),
      unidad,
      img: p.imagenUrl ?? p.imagen ?? null,
      categoriaNombre: p.categoria?.nombreCategoria ?? p.categoria ?? "",
      esPesaje: p.esPesaje === true,
      raw: p,
    };
  });

const Ventas = () => {
  const toast = useRef(null);

  // ===========================
  //   STATE PRINCIPAL
  // ===========================
  const [categorias, setCategorias] = useState([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);

  const [productos, setProductos] = useState([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [metodosPago, setMetodosPago] = useState([]);
  const [loadingMetodosPago, setLoadingMetodosPago] = useState(false);

  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todos");

  const [carrito, setCarrito] = useState([]);

  // Modal confirmar pago
  const [mostrarModalPago, setMostrarModalPago] = useState(false);

  // Modal compra exitosa
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [datosVenta, setDatosVenta] = useState(null);

  // Contador + historial de ventas del día
  const [ventasDelDia, setVentasDelDia] = useState(0);
  const [historialVentas, setHistorialVentas] = useState([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  // ===========================
  //   CARGA DE CATEGORÍAS
  // ===========================
  const fetchCategorias = async () => {
    try {
      setLoadingCategorias(true);

      const res = await api.fetchApi({}, "GET", null, endpoints.categorias);

      if (!res) {
        toast.current?.show({
          severity: "error",
          summary: "Error de conexión",
          detail: "No se pudo contactar al servidor para obtener categorías.",
          life: 3000,
        });
        return;
      }

      if (!res.ok) {
        toast.current?.show({
          severity: "error",
          summary: `Error ${res.status}`,
          detail: "Error al obtener categorías.",
          life: 3500,
        });
        return;
      }

      const json = await res.json();
      const data = Array.isArray(json?.data) ? json.data : [];
      setCategorias(data);
    } catch (err) {
      console.error(err);
      toast.current?.show({
        severity: "error",
        summary: "Error inesperado",
        detail: "Ocurrió un error al cargar las categorías.",
        life: 3500,
      });
    } finally {
      setLoadingCategorias(false);
    }
  };

  // ===========================
  //   CARGA DE PRODUCTOS
  // ===========================
  const fetchProductosTodos = async () => {
    try {
      setLoadingProductos(true);
      const res = await api.fetchApi(
        {},
        "GET",
        null,
        endpoints.ventasProductos
      );

      if (res?.ok) {
        const json = await res.json();
        const raw = Array.isArray(json?.data) ? json.data : [];
        setProductos(mapProductosFromApi(raw));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProductos(false);
    }
  };

  const fetchMetodosPago = async () => {
    try {
      setLoadingMetodosPago(true);
      const res = await api.fetchApi({}, "GET", null, endpoints.metodoPago);

      if (res?.ok) {
        const json = await res.json();
        const raw = Array.isArray(json?.data) ? json.data : [];
        setMetodosPago(
          raw
            .filter((m) => m.estatus !== false)
            .map((m) => ({
              id: m.idMetodoPago,
              nombre: m.nombreMetodoPago || m.nombre || "",
            }))
            .filter((m) => m.nombre)
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMetodosPago(false);
    }
  };

  useEffect(() => {
    fetchCategorias();
    fetchProductosTodos();
    fetchMetodosPago();
  }, []);

  // ===========================
  //   HANDLERS DE CARRITO
  // ===========================
  const handleAumentarProducto = (producto) => {
    const esPesaje = producto.esPesaje === true || producto.unidad === "kg";

    setCarrito((prev) => {
      const existe = prev.find((p) => p.id === producto.id);

      if (esPesaje) {
        const step = STEP_PESAJE;
        if (existe) {
          return prev.map((p) =>
            p.id === producto.id
              ? { ...p, cantidad: (p.cantidad || 0) + step }
              : p
          );
        }
        return [...prev, { ...producto, cantidad: step }];
      }

      if (existe) {
        return prev.map((p) =>
          p.id === producto.id
            ? { ...p, cantidad: (p.cantidad || 0) + 1 }
            : p
        );
      }

      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const handleDisminuirProducto = (producto) => {
    const esPesaje = producto.esPesaje === true || producto.unidad === "kg";

    setCarrito((prev) =>
      prev
        .map((p) => {
          if (p.id !== producto.id) return p;

          if (esPesaje) {
            return { ...p, cantidad: (p.cantidad || 0) - STEP_PESAJE };
          }

          return { ...p, cantidad: (p.cantidad || 0) - 1 };
        })
        .filter((p) => (p.cantidad || 0) > 0)
    );
  };

  const handleEliminarProducto = (id) => {
    setCarrito((prev) => prev.filter((p) => p.id !== id));
  };

  const handleConfirmPesaje = (producto) => {
    setCarrito((prev) => {
      const existe = prev.find((p) => p.id === producto.id);
      if (!producto.cantidad || producto.cantidad <= 0) {
        return prev.filter((p) => p.id !== producto.id);
      }

      if (existe) {
        return prev.map((p) =>
          p.id === producto.id
            ? { ...p, cantidad: producto.cantidad }
            : p
        );
      }

      return [...prev, producto];
    });
  };

  const total = carrito.reduce(
    (acc, item) => acc + (item.precio || 0) * (item.cantidad || 0),
    0
  );

  const productosFiltrados = useMemo(() => {
    const q = terminoBusqueda.trim().toLowerCase();
    return productos.filter((producto) => {
      const nombre = String(producto.nombre || "").toLowerCase();
      const categoria = String(producto.categoriaNombre || "");
      const matchBusqueda = !q || nombre.includes(q);
      const matchCategoria =
        categoriaSeleccionada === "Todos" || categoria === categoriaSeleccionada;
      return matchBusqueda && matchCategoria;
    });
  }, [productos, terminoBusqueda, categoriaSeleccionada]);

  const loadingGlobal = loadingCategorias || loadingProductos || loadingMetodosPago;

  const obtenerCantidadEnCarrito = (idProducto) => {
    const item = carrito.find((p) => p.id === idProducto);
    return item ? item.cantidad : 0;
  };

  const handlePagoConfirmado = (pagoData) => {
    const nuevaVenta = {
      id: Date.now(),
      items: [...carrito],
      total: total,
      fecha: new Date(),
      pago: pagoData,
    };

    setDatosVenta(nuevaVenta);
    setMostrarModalPago(false);
    setCarrito([]);
    setMostrarModalExito(true);
    setVentasDelDia((n) => n + 1);
    setHistorialVentas((prev) => [nuevaVenta, ...prev]);

    toast.current?.show({
      severity: "success",
      summary: "Venta exitosa",
      detail: "La venta se ha registrado correctamente",
      life: 3000,
    });
  };


  // ===========================
  //   RENDER
  // ===========================
  return (
    <div className="dashboard-ventas">
      <NavBar />
      <Toast ref={toast} />

      {loadingGlobal && (
        <div className="ventas-overlay">
          <div className="ventas-overlay-card">
            <ProgressSpinner style={{ width: "40px", height: "40px" }} />
            <span className="ventas-overlay-text">
              Cargando información de ventas…
            </span>
          </div>
        </div>
      )}

      <div className="ventas-container">
        <section className="ventas-col ventas-col--left">
          <VentasHeader
            categorias={categorias}
            categoriaSeleccionada={categoriaSeleccionada}
            terminoBusqueda={terminoBusqueda}
            onBusquedaChange={setTerminoBusqueda}
            onCategoriaChange={setCategoriaSeleccionada}
            loadingCategorias={loadingCategorias}
            ventasDelDia={ventasDelDia}
            onVerHistorial={() => setMostrarHistorial(true)}
          />

          <VentasProductos
            productos={productosFiltrados}
            carrito={carrito}
            onAgregarProducto={handleAumentarProducto}
            onDisminuirProducto={handleDisminuirProducto}
            onConfirmPesaje={handleConfirmPesaje}
            obtenerCantidadEnCarrito={obtenerCantidadEnCarrito} // ✅ AQUI
          />
        </section>

        <aside className="ventas-col ventas-col--right">
          <VentasCarrito
            carrito={carrito}
            onAumentarProducto={handleAumentarProducto}
            onDisminuirProducto={handleDisminuirProducto}
            onEliminarProducto={handleEliminarProducto}
            onVaciarCarrito={() => setCarrito([])}
            onConfirmPesaje={handleConfirmPesaje}
            onConfirmarPago={() => setMostrarModalPago(true)}
          />
        </aside>
      </div>

      {/* 🔥 MODAL CONFIRMAR PAGO */}
      <ConfirmarPagoModal
        visible={mostrarModalPago}
        onHide={() => setMostrarModalPago(false)}
        total={total}
        carrito={carrito}
        metodosPago={metodosPago}
        onPaymentSuccess={handlePagoConfirmado}
      />

      {/* MODAL COMPRA EXITOSA (TICKET) */}
      {mostrarModalExito && datosVenta && (
        <CompraExitosa
          venta={datosVenta}
          onClose={() => setMostrarModalExito(false)}
        />
      )}

      {/* HISTORIAL DE VENTAS DEL DÍA */}
      <HistorialVentasPanel
        visible={mostrarHistorial}
        onHide={() => setMostrarHistorial(false)}
        historial={historialVentas}
      />
    </div>
  );
};

export default Ventas;
