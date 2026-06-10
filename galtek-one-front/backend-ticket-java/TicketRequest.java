package com.galtekone.ticket;

import java.util.List;

/**
 * DTO que recibe el frontend con todos los datos del ticket.
 * Endpoint: POST /ticket/imprimir
 */
public class TicketRequest {

    private String        folio;
    private String        cajero;
    private String        metodoPago;   // EFECTIVO | TARJETA | TRANSFERENCIA
    private List<Item>    items;
    private double        subtotal;
    private double        descuento;
    private double        impuesto;
    private double        total;
    private double        recibido;
    private double        cambio;

    // ── Clase interna: línea de producto ─────────────────────────────
    public static class Item {
        private String nombre;
        private int    cantidad;
        private double precioUnitario;
        private double total;

        public String getNombre()         { return nombre; }
        public void   setNombre(String v) { this.nombre = v; }
        public int    getCantidad()        { return cantidad; }
        public void   setCantidad(int v)  { this.cantidad = v; }
        public double getPrecioUnitario()  { return precioUnitario; }
        public void   setPrecioUnitario(double v) { this.precioUnitario = v; }
        public double getTotal()           { return total; }
        public void   setTotal(double v)  { this.total = v; }
    }

    // ── Getters / Setters ─────────────────────────────────────────────
    public String        getFolio()      { return folio; }
    public void          setFolio(String v)    { this.folio = v; }
    public String        getCajero()     { return cajero; }
    public void          setCajero(String v)   { this.cajero = v; }
    public String        getMetodoPago() { return metodoPago; }
    public void          setMetodoPago(String v) { this.metodoPago = v; }
    public List<Item>    getItems()      { return items; }
    public void          setItems(List<Item> v){ this.items = v; }
    public double        getSubtotal()   { return subtotal; }
    public void          setSubtotal(double v){ this.subtotal = v; }
    public double        getDescuento()  { return descuento; }
    public void          setDescuento(double v){ this.descuento = v; }
    public double        getImpuesto()   { return impuesto; }
    public void          setImpuesto(double v){ this.impuesto = v; }
    public double        getTotal()      { return total; }
    public void          setTotal(double v)   { this.total = v; }
    public double        getRecibido()   { return recibido; }
    public void          setRecibido(double v){ this.recibido = v; }
    public double        getCambio()     { return cambio; }
    public void          setCambio(double v)  { this.cambio = v; }
}
