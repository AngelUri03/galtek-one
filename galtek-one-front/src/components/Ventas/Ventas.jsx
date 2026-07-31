import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";

import NavBar from "../common/NavBar";

import VentasHeader from "./VentasHeader";
import VentasProductos from "./VentasProductos";
import VentasCarrito from "./VentasCarrito";
import ConfirmarPagoModal from "./Modales/ConfirmarPagoModal/ConfirmarPagoModal";
import SeleccionarClienteVentaModal from "./Modales/SeleccionarClienteVentaModal";
import CompraExitosa from "./Modales/CompraExitosa";
import HistorialVentasPanel from "./Modales/HistorialVentasPanel";
import CashControlDrawer from "../Caja/CashControlDrawer";
import CashClosingDialog from "../Caja/CashClosingDialog";
import { useCashSession } from "../../cash/CashSessionContext";
import { getListPayload, normalizeCliente } from "../Clientes/clientesUtils";
import { fetchPaymentConfig } from "../../payments/paymentConfigService";

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

const normalizeSearchText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
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
      categoriaId: p.categoria?.idCategoria ?? p.idCategoria ?? p.categoriaId ?? null,
      categoriaNombre:
        p.categoria?.nombreCategoria ??
        p.categoriaNombre ??
        p.nombreCategoria ??
        (typeof p.categoria === "string" ? p.categoria : ""),
      sku: p.sku ?? "",
      codigoBarras: p.codigoBarras ?? p.barcode ?? "",
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
    cliente: venta?.cliente
      ? normalizeCliente(venta.cliente)
      : venta?.clienteId
        ? normalizeCliente({
            idCliente: venta.clienteId,
            nombre: venta.clienteNombre || "Cliente",
          })
        : null,
    pago: {
      metodo: metodoCode,
      metodoNombre,
      metodoPago: metodoNombre,
      metodoTipo: venta?.pago?.metodoTipo || null,
      referencia: venta?.pago?.referencia ?? venta?.referenciaPago ?? venta?.referencia,
      folio: venta?.pago?.folio ?? venta?.folioPago ?? venta?.folio,
      totalOriginal: Number(venta?.pago?.totalOriginal ?? venta?.totalOriginal ?? venta?.subtotal ?? venta?.total ?? 0),
      totalCobrado: Number(venta?.pago?.totalCobrado ?? venta?.totalCobrado ?? venta?.total ?? 0),
      redondeoAplicado: Number(venta?.pago?.redondeoAplicado ?? venta?.redondeoAplicado ?? 0),
      comisionMonto: Number(venta?.pago?.comisionMonto ?? venta?.comisionMonto ?? venta?.comisionPago ?? 0),
      comisionPorcentaje: Number(venta?.pago?.comisionPorcentaje ?? venta?.comisionPorcentaje ?? 0),
      recibido: Number(venta?.pago?.recibido ?? venta?.recibido ?? 0),
      cambio: Number(venta?.pago?.cambio ?? venta?.cambio ?? 0),
      pagoVerificado: Boolean(venta?.pago?.pagoVerificado ?? venta?.pagoVerificado),
    },
    ticket: venta,
  };
};

const normalizeTicketSale = (ticket, pagoData) => {
  const metodoNombre = ticket?.metodoPago || pagoData?.metodoNombre || pagoData?.metodo || "Efectivo";
  const metodoCode = pagoData?.metodo || normalizePaymentCode(metodoNombre);
  const metodoTipo = pagoData?.metodoTipo || null;

  return normalizeVentaFromBackend({
    ...ticket,
    total: ticket?.totalCobrado ?? ticket?.total ?? pagoData?.totalCobrado ?? pagoData?.total,
    cliente: ticket?.cliente || pagoData?.cliente || null,
    metodoPago: metodoNombre,
    pago: {
      ...pagoData,
      metodo: metodoCode,
      metodoNombre,
      metodoTipo,
      metodoPago: metodoNombre,
    },
  });
};

const Ventas = () => {
  const toast = useRef(null);
  const searchInputRef = useRef(null);
  const cashIndicatorRef = useRef(null);
  const clientesVentaLoadedRef = useRef(false);
  const { refreshCashState } = useCashSession();

  // ===========================
  //   STATE PRINCIPAL
  // ===========================
  const [categorias, setCategorias] = useState([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);

  const [productos, setProductos] = useState([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [metodosPago, setMetodosPago] = useState([]);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [loadingMetodosPago, setLoadingMetodosPago] = useState(false);
  const [clientesVenta, setClientesVenta] = useState([]);
  const [loadingClientesVenta, setLoadingClientesVenta] = useState(false);
  const [savingClienteVenta, setSavingClienteVenta] = useState(false);
  const [errorClienteVenta, setErrorClienteVenta] = useState("");

  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todos");

  const [carrito, setCarrito] = useState([]);
  const [clienteVenta, setClienteVenta] = useState(null);

  // Modal cliente y pago
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false);
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
      const config = await fetchPaymentConfig();
      setPaymentConfig(config);
      const activeTerminales = (config.terminales || []).filter((terminal) => terminal.enabled !== false);
      const activeMethods = (config.metodosPago || [])
        .filter((m) => m.estatus !== false && m.visiblePos !== false)
        .filter((m) => ["TERMINAL", "CASH", "CARD", "VOUCHER"].includes(m.tipo))
        .filter((m) => m.tipo !== "TERMINAL" || (config.terminalEnabled !== false && activeTerminales.length > 0))
        .map((m) => ({
          ...m,
          id: m.idMetodoPago ?? m.id,
          nombre: m.nombreMetodoPago || m.nombre || "",
          nombreMetodoPago: m.nombreMetodoPago || m.nombre || "",
          orden: Number(m.orden || 999),
          raw: { ...m, paymentConfig: config },
        }))
        .filter((m) => m.nombre && m.id)
        .sort((a, b) => Number(a.orden || 999) - Number(b.orden || 999));
      setMetodosPago(activeMethods);
    } catch (err) {
      console.error(err);
      try {
        const res = await api.fetchApi({}, "GET", null, endpoints.metodoPago);

        if (res?.ok) {
          const json = await res.json();
          const raw = Array.isArray(json?.data) ? json.data : [];
          setMetodosPago(
            raw
              .filter((m) => m.estatus !== false && m.visiblePos !== false)
              .filter((m) => ["TERMINAL", "EFECTIVO", "TARJETA", "VALES"].includes(normalizePaymentCode(m.codigo || m.nombreMetodoPago || m.nombre)))
              .map((m) => ({
                ...m,
                id: m.idMetodoPago,
                nombre: m.nombreMetodoPago || m.nombre || "",
                raw: m,
              }))
              .filter((m) => m.nombre)
          );
        }
      } catch (fallbackError) {
        console.error(fallbackError);
      }
    } finally {
      setLoadingMetodosPago(false);
    }
  };

  const fetchClientesVenta = useCallback(
    async ({ force = false } = {}) => {
      if (clientesVentaLoadedRef.current && !force) return clientesVenta;

      try {
        setLoadingClientesVenta(true);
        setErrorClienteVenta("");

        const res = await api.fetchApi(
          {},
          "GET",
          null,
          endpoints.clientes,
          { logoutOnUnauthorized: false }
        );
        const data = await parseApiData(res, "No se pudieron consultar los clientes.");
        const rows = getListPayload(data).map((cliente) => normalizeCliente(cliente));

        setClientesVenta(rows);
        clientesVentaLoadedRef.current = true;
        return rows;
      } catch (err) {
        const detail = err?.message || "No se pudieron consultar los clientes.";
        setErrorClienteVenta(detail);
        toast.current?.show({
          severity: "warn",
          summary: "Clientes",
          detail,
          life: 3400,
        });
        return [];
      } finally {
        setLoadingClientesVenta(false);
      }
    },
    [clientesVenta]
  );

  const handleCrearClienteVenta = async (payload) => {
    setSavingClienteVenta(true);
    setErrorClienteVenta("");

    try {
      const res = await api.fetchApi({}, "POST", payload, endpoints.clientes);
      const data = await parseApiData(res, "No se pudo crear el cliente.");
      let cliente = normalizeCliente({ ...payload, ...(data || {}) });

      if (!cliente.idCliente) {
        const rows = await fetchClientesVenta({ force: true });
        const email = String(payload.email || "").toLowerCase();
        const telefono = String(payload.telefono || "");
        const nombre = String(payload.nombre || "").toLowerCase();
        const encontrado = rows.find((item) => {
          const itemEmail = String(item.email || "").toLowerCase();
          const itemTelefono = String(item.telefono || "");
          const itemNombre = String(item.nombre || "").toLowerCase();
          return (
            (email && itemEmail === email) ||
            (telefono && itemTelefono === telefono) ||
            (nombre && itemNombre === nombre)
          );
        });

        if (encontrado) cliente = encontrado;
      }

      if (!cliente.idCliente) {
        throw new Error("Cliente creado, pero no se recibio identificador.");
      }

      setClientesVenta((prev) => {
        const id = String(cliente.idCliente);
        return [cliente, ...prev.filter((item) => String(item.idCliente) !== id)];
      });
      clientesVentaLoadedRef.current = true;
      setClienteVenta(cliente);

      toast.current?.show({
        severity: "success",
        summary: "Cliente agregado",
        detail: "El cliente quedo asociado a la venta.",
        life: 2600,
      });

      return cliente;
    } catch (err) {
      const detail = err?.message || "No se pudo crear el cliente.";
      setErrorClienteVenta(detail);
      toast.current?.show({
        severity: "error",
        summary: "Cliente no creado",
        detail,
        life: 3800,
      });
      throw err;
    } finally {
      setSavingClienteVenta(false);
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
  const handleAumentarProducto = useCallback((producto) => {
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
  }, []);

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
    const q = normalizeSearchText(terminoBusqueda);
    const categoriaActiva = normalizeSearchText(categoriaSeleccionada);
    return productos.filter((producto) => {
      const nombre = normalizeSearchText(producto.nombre);
      const categoria = normalizeSearchText(
        producto.categoriaNombre ||
          producto.raw?.categoriaNombre ||
          producto.raw?.categoria?.nombreCategoria
      );
      const sku = normalizeSearchText(producto.sku || producto.raw?.sku);
      const codigo = normalizeSearchText(
        producto.codigoBarras || producto.raw?.codigoBarras || ""
      );
      const matchBusqueda =
        !q ||
        nombre.includes(q) ||
        sku.includes(q) ||
        codigo.includes(q);
      const matchCategoria =
        categoriaSeleccionada === "Todos" || categoria === categoriaActiva;
      return matchBusqueda && matchCategoria;
    });
  }, [productos, terminoBusqueda, categoriaSeleccionada]);

  const handleBusquedaSubmit = useCallback(() => {
    const q = terminoBusqueda.trim().toLowerCase();
    if (!q) return;

    const exactos = productos.filter((producto) => {
      const nombre = String(producto.nombre || "").trim().toLowerCase();
      const sku = String(producto.sku || producto.raw?.sku || "").trim().toLowerCase();
      const codigo = String(
        producto.codigoBarras || producto.raw?.codigoBarras || ""
      )
        .trim()
        .toLowerCase();

      return q === codigo || q === sku || q === nombre;
    });

    const candidato =
      exactos.length === 1
        ? exactos[0]
        : productosFiltrados.length === 1
          ? productosFiltrados[0]
          : null;

    if (!candidato) return;

    handleAumentarProducto(candidato);
    setTerminoBusqueda("");
  }, [handleAumentarProducto, productos, productosFiltrados, terminoBusqueda]);

  const loadingGlobal = loadingCategorias || loadingProductos || loadingMetodosPago;

  const obtenerCantidadEnCarrito = (idProducto) => {
    const item = carrito.find((p) => p.id === idProducto);
    return item ? item.cantidad : 0;
  };

  const abrirSeleccionClienteVenta = () => {
    setErrorPago("");
    setErrorClienteVenta("");

    if (!carrito.length) {
      setErrorPago("Agrega productos al carrito antes de cobrar.");
      return;
    }

    setMostrarModalCliente(true);
    fetchClientesVenta();
  };

  const handleContinuarClienteVenta = (cliente) => {
    setClienteVenta(cliente || null);
    setMostrarModalCliente(false);
    setMostrarModalPago(true);
  };

  const handleVaciarCarrito = () => {
    setCarrito([]);
    setClienteVenta(null);
    setErrorPago("");
    setErrorClienteVenta("");
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

    const moneyOrNull = (value) => {
      const number = Number(value);
      return Number.isFinite(number) ? Number(number.toFixed(2)) : null;
    };

    const payload = {
      clienteId: clienteVenta?.idCliente ?? clienteVenta?.id ?? null,
      metodoPagoId,
      almacenId: null,
      totalOriginal: moneyOrNull(pagoData?.totalOriginal),
      totalCobrado: moneyOrNull(pagoData?.totalCobrado ?? pagoData?.total),
      redondeoActivo: Boolean(pagoData?.redondeoActivo),
      redondeoAplicado: moneyOrNull(pagoData?.redondeoAplicado),
      comisionMonto: moneyOrNull(pagoData?.comisionMonto),
      comisionPorcentaje: moneyOrNull(pagoData?.comisionPorcentaje),
      recibido: moneyOrNull(pagoData?.recibido),
      cambio: moneyOrNull(pagoData?.cambio),
      referencia: pagoData?.referencia || null,
      folio: pagoData?.folio || pagoData?.referencia || null,
      terminalKey: pagoData?.terminalKey || null,
      pagoVerificado: Boolean(
        pagoData?.autorizadoManual ||
        pagoData?.verificadoManual ||
        pagoData?.pagoVerificado
      ),
      productos: carrito.map((item) => ({
        productoId: item.id,
        cantidad: Number(Number(item.cantidad || 0).toFixed(3)),
      })),
    };

    setProcesandoVenta(true);
    try {
      const res = await api.fetchApi({}, "POST", payload, endpoints.ventasCrear);
      const ticket = await parseApiData(res, "No se pudo registrar la venta.");
      const ventaConfirmada = normalizeTicketSale(
        { ...ticket, cliente: ticket?.cliente || clienteVenta || null },
        { ...pagoData, cliente: clienteVenta || null }
      );

      setDatosVenta(ventaConfirmada);
      setMostrarModalPago(false);
      setClienteVenta(null);
      setCarrito([]);
      setMostrarModalExito(true);

      const [ventasResult] = await Promise.allSettled([
        fetchVentasDelDia(),
        refreshCashState({ force: true }),
        fetchProductosTodos(),
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
            terminoBusqueda={terminoBusqueda}
            onBusquedaChange={setTerminoBusqueda}
            onBusquedaSubmit={handleBusquedaSubmit}
            ventasDelDia={ventasDelDia}
            onVerHistorial={() => setMostrarHistorial(true)}
            onCajaClick={() => setMostrarCaja(true)}
            cashIndicatorRef={cashIndicatorRef}
            searchInputRef={searchInputRef}
          />

          <div className="ventas-work-area">
            <aside className="ventas-category-rail" aria-label="Categorias">
              <button
                type="button"
                className={
                  "ventas-rail-item" +
                  (categoriaSeleccionada === "Todos" ? " ventas-rail-item--active" : "")
                }
                onClick={() => setCategoriaSeleccionada("Todos")}
              >
                <span>Todos</span>
              </button>

              {loadingCategorias && categorias.length === 0 && (
                <span className="ventas-rail-loading">Cargando...</span>
              )}

              {categorias.map((cat) => {
                const id = cat.idCategoria ?? cat.id;
                const nombre = cat.nombreCategoria ?? cat.nombre ?? "Sin nombre";
                const active = categoriaSeleccionada === nombre;

                return (
                  <button
                    key={id ?? nombre}
                    type="button"
                    className={
                      "ventas-rail-item" +
                      (active ? " ventas-rail-item--active" : "")
                    }
                    onClick={() => setCategoriaSeleccionada(nombre)}
                    title={nombre}
                  >
                    <span>{nombre}</span>
                  </button>
                );
              })}
            </aside>

            <VentasProductos
              productos={productosFiltrados}
              carrito={carrito}
              onAgregarProducto={handleAumentarProducto}
              onDisminuirProducto={handleDisminuirProducto}
              onConfirmPesaje={handleConfirmPesaje}
              obtenerCantidadEnCarrito={obtenerCantidadEnCarrito}
            />
          </div>
        </section>

        <aside className="ventas-col ventas-col--right">
          <VentasCarrito
            carrito={carrito}
            onAumentarProducto={handleAumentarProducto}
            onDisminuirProducto={handleDisminuirProducto}
            onEliminarProducto={handleEliminarProducto}
            onVaciarCarrito={handleVaciarCarrito}
            onConfirmPesaje={handleConfirmPesaje}
            onConfirmarPago={abrirSeleccionClienteVenta}
          />
        </aside>
      </div>

      {/* 🔥 MODAL CONFIRMAR PAGO */}
      <SeleccionarClienteVentaModal
        visible={mostrarModalCliente}
        onHide={() => {
          if (savingClienteVenta) return;
          setMostrarModalCliente(false);
          setErrorClienteVenta("");
        }}
        total={total}
        carrito={carrito}
        clientes={clientesVenta}
        loading={loadingClientesVenta}
        saving={savingClienteVenta}
        error={errorClienteVenta}
        selectedCliente={clienteVenta}
        onRefreshClientes={() => fetchClientesVenta({ force: true })}
        onCreateCliente={handleCrearClienteVenta}
        onContinue={handleContinuarClienteVenta}
      />

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
        paymentConfig={paymentConfig}
        onPaymentSuccess={handlePagoConfirmado}
        processing={procesandoVenta}
        error={errorPago}
        clienteVenta={clienteVenta}
        onBackToCliente={() => {
          if (procesandoVenta) return;
          setMostrarModalPago(false);
          setMostrarModalCliente(true);
        }}
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
