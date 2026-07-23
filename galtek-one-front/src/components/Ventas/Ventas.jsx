import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";

import NavBar from "../common/NavBar";

import VentasHeader from "./VentasHeader";
import VentasProductos from "./VentasProductos";
import VentasCarrito from "./VentasCarrito";
import ConfirmarPagoModal from "./Modales/ConfirmarPagoModal/ConfirmarPagoModal";
import CompraExitosa from "./Modales/CompraExitosa";
import HistorialVentasPanel from "./Modales/HistorialVentasPanel";
import CashControlDrawer from "../Caja/CashControlDrawer";
import CashClosingDialog from "../Caja/CashClosingDialog";
import { useCashSession } from "../../cash/CashSessionContext";

import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";

import "../../style/components/Ventas/Ventas.css";

const api = new APIfetchApi();

const STEP_PESAJE = 0.1;

const normalizePaymentCode = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const localDateKey = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseApiData = async (response, fallbackMessage) => {
  if (!response) {
    throw new Error("No se pudo contactar al servidor.");
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message || fallbackMessage);
  }

  return payload?.data ?? payload;
};

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

const normalizeVentaFromBackend = (venta) => {
  const fecha = venta?.fecha || venta?.fechaCreacion || venta?.createdAt || null;
  const metodoNombre =
    venta?.metodoPago?.nombreMetodoPago ||
    venta?.metodoPago?.nombre ||
    venta?.metodoPago ||
    venta?.pago?.metodoNombre ||
    venta?.pago?.metodo ||
    "Efectivo";
  const metodoCode = normalizePaymentCode(metodoNombre);

  const rawItems = Array.isArray(venta?.items)
    ? venta.items
    : Array.isArray(venta?.detalles)
      ? venta.detalles
      : [];

  return {
    id: venta?.idVenta ?? venta?.id ?? venta?.folio ?? Date.now(),
    folio: venta?.folio || (venta?.idVenta ? `F-${venta.idVenta}` : undefined),
    items: rawItems.map((item, idx) => {
      const producto = item?.producto || {};
      const cantidad = Number(item?.cantidad ?? 0);
      const precio = Number(item?.precioUnitario ?? producto?.precioVenta ?? item?.precio ?? 0);
      return {
        id: item?.idProducto ?? producto?.idProducto ?? item?.id ?? idx,
        nombre: item?.nombreProducto ?? producto?.nombreProducto ?? item?.nombre ?? "Producto",
        cantidad,
        precio,
        unidad: producto?.unidad?.nombreUnidad || item?.unidad || "pz",
      };
    }),
    total: Number(venta?.total ?? 0),
    fecha: fecha ? new Date(fecha) : new Date(),
    pago: {
      metodo: metodoCode,
      metodoNombre,
      metodoPago: metodoNombre,
      referencia: venta?.pago?.referencia,
      folio: venta?.pago?.folio,
    },
    ticket: venta,
  };
};

const normalizeTicketSale = (ticket, pagoData) => {
  const metodoNombre = ticket?.metodoPago || pagoData?.metodoNombre || pagoData?.metodo || "Efectivo";
  const metodoCode = pagoData?.metodo || normalizePaymentCode(metodoNombre);

  return normalizeVentaFromBackend({
    ...ticket,
    metodoPago: metodoNombre,
    pago: {
      ...pagoData,
      metodo: metodoCode,
      metodoNombre,
      metodoPago: metodoNombre,
    },
  });
};

const Ventas = () => {
  const toast = useRef(null);
  const searchInputRef = useRef(null);
  const cashIndicatorRef = useRef(null);
  const { refreshCashState } = useCashSession();

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
  const [procesandoVenta, setProcesandoVenta] = useState(false);
  const [errorPago, setErrorPago] = useState("");

  // Modal compra exitosa
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [datosVenta, setDatosVenta] = useState(null);

  // Contador + historial de ventas del día
  const [ventasDelDia, setVentasDelDia] = useState(0);
  const [historialVentas, setHistorialVentas] = useState([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [mostrarCaja, setMostrarCaja] = useState(false);
  const [mostrarCorteCaja, setMostrarCorteCaja] = useState(false);

  const fetchVentasDelDia = useCallback(async () => {
    const res = await api.fetchApi({}, "GET", null, endpoints.ventas);
    const data = await parseApiData(res, "No se pudieron consultar las ventas del día.");
    const ventas = Array.isArray(data) ? data : [];
    const today = localDateKey(new Date());
    const ventasHoy = ventas
      .filter((venta) => localDateKey(venta?.fechaCreacion || venta?.fecha || venta?.createdAt) === today)
      .map(normalizeVentaFromBackend)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    setHistorialVentas(ventasHoy);
    setVentasDelDia(ventasHoy.length);
    return ventasHoy;
  }, []);

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
    fetchVentasDelDia().catch((err) => {
      console.error(err);
    });
  }, [fetchVentasDelDia]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const target =
        searchInputRef.current?.getElement?.() ||
        searchInputRef.current?.input ||
        searchInputRef.current;
      target?.focus?.();
    }, 120);

    return () => window.clearTimeout(id);
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

  const handlePagoConfirmado = async (pagoData) => {
    if (procesandoVenta) return;
    setErrorPago("");

    if (!carrito.length) {
      setErrorPago("Agrega productos al carrito antes de registrar la venta.");
      return;
    }

    const metodoPagoId = Number(pagoData?.metodoPagoId);
    if (!Number.isFinite(metodoPagoId)) {
      setErrorPago("El método de pago seleccionado no tiene identificador válido.");
      return;
    }

    const payload = {
      clienteId: null,
      metodoPagoId,
      almacenId: null,
      productos: carrito.map((item) => ({
        productoId: item.id,
        cantidad: Number(Number(item.cantidad || 0).toFixed(3)),
      })),
    };

    setProcesandoVenta(true);
    try {
      const res = await api.fetchApi({}, "POST", payload, endpoints.ventasCrear);
      const ticket = await parseApiData(res, "No se pudo registrar la venta.");
      const ventaConfirmada = normalizeTicketSale(ticket, pagoData);

      setDatosVenta(ventaConfirmada);
      setMostrarModalPago(false);
      setCarrito([]);
      setMostrarModalExito(true);

      const [ventasResult] = await Promise.allSettled([
        fetchVentasDelDia(),
        refreshCashState({ force: true }),
      ]);

      if (ventasResult.status === "fulfilled") {
        const existsInBackend = ventasResult.value.some(
          (venta) => String(venta.id) === String(ventaConfirmada.id)
        );
        if (!existsInBackend) {
          setVentasDelDia(ventasResult.value.length + 1);
        }
        setHistorialVentas((prev) => {
          const exists = prev.some((venta) => String(venta.id) === String(ventaConfirmada.id));
          return exists
            ? prev.map((venta) =>
                String(venta.id) === String(ventaConfirmada.id)
                  ? { ...venta, ...ventaConfirmada }
                  : venta
              )
            : [ventaConfirmada, ...prev];
        });
      } else {
        setHistorialVentas((prev) => [ventaConfirmada, ...prev]);
        setVentasDelDia((n) => n + 1);
      }

      toast.current?.show({
        severity: "success",
        summary: "Venta registrada",
        detail: "La venta fue confirmada por backend y caja fue sincronizada.",
        life: 3000,
      });
    } catch (err) {
      const detail = err?.message || "No se pudo registrar la venta.";
      setErrorPago(detail);
      toast.current?.show({
        severity: "error",
        summary: "Venta no registrada",
        detail,
        life: 4200,
      });
    } finally {
      setProcesandoVenta(false);
    }
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
            onCajaClick={() => setMostrarCaja(true)}
            cashIndicatorRef={cashIndicatorRef}
            searchInputRef={searchInputRef}
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
            onConfirmarPago={() => {
              setErrorPago("");
              setMostrarModalPago(true);
            }}
          />
        </aside>
      </div>

      {/* 🔥 MODAL CONFIRMAR PAGO */}
      <ConfirmarPagoModal
        visible={mostrarModalPago}
        onHide={() => {
          if (procesandoVenta) return;
          setMostrarModalPago(false);
          setErrorPago("");
        }}
        total={total}
        carrito={carrito}
        metodosPago={metodosPago}
        onPaymentSuccess={handlePagoConfirmado}
        processing={procesandoVenta}
        error={errorPago}
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

      <CashControlDrawer
        visible={mostrarCaja}
        onHide={() => setMostrarCaja(false)}
        onNotify={(message) => toast.current?.show(message)}
        onStartClosing={() => setMostrarCorteCaja(true)}
        returnFocusRef={cashIndicatorRef}
      />

      <CashClosingDialog
        visible={mostrarCorteCaja}
        onHide={() => setMostrarCorteCaja(false)}
        onClosed={() => refreshCashState({ force: true })}
        onNotify={(message) => toast.current?.show(message)}
        returnFocusRef={cashIndicatorRef}
      />
    </div>
  );
};

export default Ventas;
