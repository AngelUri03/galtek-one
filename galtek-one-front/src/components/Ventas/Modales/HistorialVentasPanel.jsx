import React from "react";
import { Sidebar } from "primereact/sidebar";
import "../../../style/components/Ventas/HistorialVentasPanel.css";

const METODO_LABEL = {
    efectivo: "Efectivo",
    tarjeta: "Tarjeta",
    transferencia: "Transferencia",
};

const METODO_ICON = {
    efectivo: "pi-money-bill",
    tarjeta: "pi-credit-card",
    transferencia: "pi-send",
};

const normalizeMetodo = (value) =>
    String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

function formatHora(fecha) {
    if (!fecha) return "--";
    const d = fecha instanceof Date ? fecha : new Date(fecha);
    return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

export default function HistorialVentasPanel({ visible, onHide, historial = [] }) {
    const totalDia = historial.reduce((acc, v) => acc + (v.total || 0), 0);

    return (
        <Sidebar
            visible={visible}
            onHide={onHide}
            position="right"
            className="historial-sidebar"
            header={
                <div className="historial-header">
                    <span className="historial-titulo">
                        <i className="pi pi-chart-bar" /> Ventas de hoy
                    </span>
                    <span className="historial-fecha">
                        {new Date().toLocaleDateString("es-MX", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                        })}
                    </span>
                </div>
            }
        >
            {/* Resumen del día */}
            <div className="historial-resumen">
                <div className="historial-resumen-item">
                    <span className="historial-resumen-label">Total ventas</span>
                    <span className="historial-resumen-value">{historial.length}</span>
                </div>
                <div className="historial-resumen-sep" />
                <div className="historial-resumen-item">
                    <span className="historial-resumen-label">Ingresos del día</span>
                    <span className="historial-resumen-value historial-resumen-total">
                        ${totalDia.toFixed(2)}
                    </span>
                </div>
            </div>

            {/* Lista de ventas */}
            {historial.length === 0 ? (
                <div className="historial-vacio">
                    <i className="pi pi-inbox historial-vacio-icon" />
                    <p>Aún no hay ventas registradas hoy.</p>
                </div>
            ) : (
                <ul className="historial-lista">
                    {historial.map((venta, idx) => {
                        const metodo = normalizeMetodo(venta.pago?.metodo || venta.pago?.metodoPago || "efectivo");
                        const iconClass = METODO_ICON[metodo] || "pi-wallet";
                        const label = venta.pago?.metodoNombre || METODO_LABEL[metodo] || metodo;
                        const numero = historial.length - idx;

                        return (
                            <li key={venta.id} className="historial-item">
                                <div className="historial-item-num">#{numero}</div>

                                <div className="historial-item-body">
                                    <div className="historial-item-top">
                                        <span className="historial-item-hora">
                                            <i className="pi pi-clock" /> {formatHora(venta.fecha)}
                                        </span>
                                        <span className={`historial-item-metodo historial-item-metodo--${metodo}`}>
                                            <i className={`pi ${iconClass}`} /> {label}
                                        </span>
                                    </div>

                                    <div className="historial-item-productos">
                                        {venta.items?.map((it) => (
                                            <span key={it.id} className="historial-item-producto-chip">
                                                {it.nombre}
                                                <span className="historial-item-producto-qty">×{it.cantidad}</span>
                                            </span>
                                        ))}
                                    </div>

                                    <div className="historial-item-bottom">
                                        <span className="historial-item-items-count">
                                            {venta.items?.length} producto{venta.items?.length !== 1 ? "s" : ""}
                                        </span>
                                        <span className="historial-item-total">${(venta.total || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </Sidebar>
    );
}
