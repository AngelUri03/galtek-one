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
  total = 0,
  recibido = 0,
  cambio = 0,
  metodoPago = "EFECTIVO",
  folio = null,
}) {
  // Obtener datos de sesión para el cajero
  let cajero = "Caja";
  try {
    const raw = sessionStorage.getItem("auth_session");
    const session = raw ? JSON.parse(raw) : null;
    if (session?.usuario) cajero = session.usuario;
  } catch (_) {}

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

  const payload = {
    folio: folioFinal,
    cajero,
    metodoPago,
    items,
    subtotal: total,
    descuento: 0,
    impuesto: 0,
    total,
    recibido,
    cambio,
  };

  try {
    const res = await api.fetchApi({}, "POST", payload, endpoints.ticket, {
      logoutOnUnauthorized: false,
    });

    if (!res) {
      console.warn("⚠️ No se pudo conectar al servicio de impresión.");
      return { ok: false, mensaje: "Sin conexión al servidor de impresión." };
    }

    if (!res.ok) {
      const txt = await res.text();
      console.error("❌ Error al imprimir ticket:", txt);
      return { ok: false, mensaje: `Error ${res.status}: ${txt}` };
    }

    console.log("✅ Ticket enviado a la impresora.");
    return { ok: true, mensaje: "Ticket impreso correctamente." };
  } catch (err) {
    console.error("❌ Error inesperado en imprimirTicket:", err);
    return { ok: false, mensaje: err.message };
  }
}
