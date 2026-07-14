import { APIfetchApi } from "../API/APIfetch";
import { endpoints } from "../API/api";

const api = new APIfetchApi();

/**
 * Construye el payload del ticket y lo envía al backend Java
 * para imprimir directamente por ESC/POS en la impresora térmica.
 *
 * @param {Object} params
 * @param {Array}  params.carrito      - Items del carrito [{ nombre, precio, cantidad }]
 * @param {number} params.total        - Total de la venta
 * @param {number} params.recibido     - Monto recibido
 * @param {number} params.cambio       - Cambio a devolver
 * @param {string} params.metodoPago   - Metodo de pago registrado en la base.
 * @param {string} [params.folio]      - Número de folio opcional
 * @returns {Promise<{ ok: boolean, mensaje: string }>}
 */
export async function imprimirTicket({
  carrito = [],
  subtotal = null,
  descuento = 0,
  impuesto = 0,
  total = 0,
  recibido = 0,
  cambio = 0,
  metodoPago = "EFECTIVO",
  folio = null,
  fecha = null,
  caja = "Caja principal",
  cajero: cajeroParam = "",
  clienteNombre = "",
  clienteTelefono = "",
  printerName = "",
}) {
  // Obtener datos de sesión para el cajero
  let cajero = "Caja";
  try {
    const raw = sessionStorage.getItem("auth_session");
    const session = raw ? JSON.parse(raw) : null;
    if (session?.usuario) cajero = session.usuario;
  } catch (_) {}
  if (cajeroParam) cajero = cajeroParam;

  // Armar el folio automático si no viene
  const folioFinal =
    folio || `#${Date.now().toString().slice(-6)}`;

  // Mapear items del carrito al formato esperado por el backend
  const items = carrito.map((p) => ({
    nombre: p.nombre || "Producto",
    cantidad: Number(p.cantidad) || 1,
    precioUnitario: Number(p.precio) || 0,
    total: (Number(p.precio) || 0) * (Number(p.cantidad) || 1),
  }));

  const requestPayload = {
    folio: folioFinal,
    cajero,
    caja,
    fecha,
    metodoPago,
    printerName,
    clienteNombre,
    clienteTelefono,
    items,
    subtotal: subtotal == null ? total : subtotal,
    descuento,
    impuesto,
    total,
    recibido,
    cambio,
  };

  try {
    const res = await api.fetchApi({}, "POST", requestPayload, endpoints.ticket, {
      logoutOnUnauthorized: false,
    });

    if (!res) {
      console.warn("⚠️ No se pudo conectar al servicio de impresión.");
      return { ok: false, mensaje: "Sin conexión al servidor de impresión." };
    }

    if (!res.ok) {
      const errorPayload = await res.json().catch(() => null);
      const txt = errorPayload?.message || `Error HTTP ${res.status}`;
      console.error("❌ Error al imprimir ticket:", txt);
      return { ok: false, mensaje: txt };
    }

    const responsePayload = await res.json().catch(() => null);
    console.log("✅ Ticket enviado a la impresora.");
    return {
      ok: true,
      mensaje:
        responsePayload?.data?.mensaje ||
        responsePayload?.message ||
        "Ticket impreso correctamente.",
    };
  } catch (err) {
    console.error("❌ Error inesperado en imprimirTicket:", err);
    return { ok: false, mensaje: err.message };
  }
}
