import React, { useState, useRef } from "react";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Stepper } from "primereact/stepper";
import { StepperPanel } from "primereact/stepperpanel"; 
import { Calendar } from "primereact/calendar";
import { InputTextarea } from "primereact/inputtextarea";
import "../../style/components/Compras/NuevaCompra.css";

export default function NuevaCompra() {
  const stepperRef = useRef(null); 
  
  // Estados iniciales para la UI
  const [proveedor, setProveedor] = useState(null);
  const [ticket, setTicket] = useState("");
  const [fechaEmision, setFechaEmision] = useState(null);
  const [fechaEntrega, setFechaEntrega] = useState(null);
  const [formaPago, setFormaPago] = useState(null);
  const [observaciones, setObservaciones] = useState("");
  
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState("");
  const [carrito, setCarrito] = useState([]); 

  // Datos simulados para probar la UI
  const proveedoresMock = [
    { label: "Abarrotes Central", value: "1", tel: "55 1234 5678", credito: "15 Días", rating: "Excelente" },
    { label: "Carnes Frías del Norte", value: "2", tel: "81 9876 5432", credito: "Contado", rating: "Bueno" },
    { label: "Frutas y Verduras San Miguel", value: "3", tel: "33 4567 8901", credito: "30 Días", rating: "Regular" }
  ];

  const formasPagoMock = [
    { label: "Efectivo", value: "EFECTIVO" },
    { label: "Transferencia Bancaria", value: "TRANSFERENCIA" },
    { label: "Tarjeta de Crédito", value: "TARJETA" },
    { label: "Crédito a Proveedor", value: "CREDITO" }
  ];

  const productosMock = [
    { label: "Arroz Morelos 1kg", value: "1", precio: 25.0 },
    { label: "Frijol Negro 900g", value: "2", precio: 29.0 },
    { label: "Azúcar estándar 1kg", value: "3", precio: 23.0 },
    { label: "Aceite vegetal 1L", value: "4", precio: 38.5 }
  ];

  const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;

  // Obtener info del proveedor seleccionado
  const proveedorInfo = proveedoresMock.find(p => p.value === proveedor);

  // --- LÓGICA DEL CARRITO ---
  const agregarProducto = () => {
    if (!productoSeleccionado || !cantidad || Number(cantidad) <= 0) return;
    const productoCompleto = productosMock.find(p => p.value === productoSeleccionado);
    if (!productoCompleto) return;

    const nuevoRegistro = {
      idTemporal: Date.now(), 
      idProducto: productoCompleto.value,
      nombre: productoCompleto.label,
      cantidad: Number(cantidad),
      precio: productoCompleto.precio,
      importe: productoCompleto.precio * Number(cantidad)
    };

    setCarrito([...carrito, nuevoRegistro]);
    setProductoSeleccionado(null);
    setCantidad("");
  };

  const eliminarProducto = (idTemporal) => {
    setCarrito(carrito.filter(item => item.idTemporal !== idTemporal));
  };

  // Cálculos del resumen
  const subtotal = carrito.reduce((acc, item) => acc + item.importe, 0);
  const total = subtotal; 

  const accionTemplate = (rowData) => (
    <Button 
      icon="pi pi-trash" 
      className="p-button-rounded p-button-danger p-button-text" 
      aria-label="Eliminar" 
      onClick={() => eliminarProducto(rowData.idTemporal)}
    />
  );

  return (
    <div className="nueva-compra-container">
      
      {/* COLUMNA 1: Stepper de Captura */}
      <div className="nc-stepper-section nc-card">
        <Stepper ref={stepperRef} linear>
          
          <StepperPanel header="Datos del Documento">
            <div className="stepper-scrollable-content paso-sin-scroll">
              <div className="nc-form-grid-unified">
                
                {/* --- FILA 1 --- */}
                <div className="field">
                  <label>Proveedor</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Dropdown 
                      value={proveedor} 
                      options={proveedoresMock} 
                      onChange={(e) => setProveedor(e.value)} 
                      placeholder="Escriba o seleccione un proveedor" 
                      className="w-full"
                      filter
                    />
                    <Button 
                      icon="pi pi-plus" 
                      className="p-button-outlined nc-btn-secundario" 
                      aria-label="Nuevo Proveedor" 
                      title="Alta Rápida de Proveedor" 
                      onClick={() => alert("Aquí abriremos el modal de Alta Rápida")}
                    />
                  </div>
                </div>

                <div className="field">
                  <label>No. Ticket / Factura</label>
                  <InputText 
                    value={ticket} 
                    onChange={(e) => setTicket(e.target.value)} 
                    placeholder="Ej. CP-001" 
                    className="w-full"
                  />
                </div>

                {/* Tarjeta de Info del Proveedor (Ocupa ambas columnas para no romper el Grid) */}
                {proveedorInfo && (
                  <div className="nc-proveedor-info is-full">
                    <div className="nc-info-item">
                      <i className="pi pi-phone" />
                      <div>
                        <small>Contacto</small>
                        <strong>{proveedorInfo.tel}</strong>
                      </div>
                    </div>
                    <div className="nc-info-item">
                      <i className="pi pi-wallet" />
                      <div>
                        <small>Términos</small>
                        <strong>{proveedorInfo.credito}</strong>
                      </div>
                    </div>
                    <div className="nc-info-item">
                      <i className="pi pi-star" />
                      <div>
                        <small>Calificación</small>
                        <strong>{proveedorInfo.rating}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- FILA 2 --- */}
                <div className="field">
                  <label>Fecha de Emisión</label>
                  <Calendar 
                    value={fechaEmision} 
                    onChange={(e) => setFechaEmision(e.value)} 
                    showIcon 
                    placeholder="Seleccione la fecha"
                    className="w-full"
                  />
                </div>

                <div className="field">
                  <label>Fecha de Entrega Esperada</label>
                  <Calendar 
                    value={fechaEntrega} 
                    onChange={(e) => setFechaEntrega(e.value)} 
                    showIcon 
                    placeholder="Seleccione la fecha"
                    className="w-full"
                  />
                </div>

                {/* --- FILA 3 --- */}
                <div className="field">
                  <label>Forma de Pago</label>
                  <Dropdown 
                    value={formaPago} 
                    options={formasPagoMock} 
                    onChange={(e) => setFormaPago(e.value)} 
                    placeholder="Seleccione método de pago" 
                    className="w-full"
                  />
                </div>

                <div className="field">
                  <label>Observaciones de la Compra</label>
                  <InputTextarea 
                    value={observaciones} 
                    onChange={(e) => setObservaciones(e.target.value)} 
                    placeholder="Notas adicionales, condiciones de entrega..." 
                    className="w-full nc-textarea-fixed"
                    maxLength={250} /* Límite máximo de caracteres permitidos */
                  />
                  <small style={{ color: '#888', textAlign: 'right', marginTop: '2px', fontSize: '0.75rem' }}>
                    {observaciones.length}/250
                  </small>
                </div>

              </div>
            </div>
            
            <div className="stepper-acciones">
              <Button 
                label="Siguiente" 
                icon="pi pi-arrow-right" 
                iconPos="right" 
                className="nc-btn-principal" 
                onClick={() => stepperRef.current.nextCallback()} 
                disabled={!proveedor || !ticket} 
              />
            </div>
          </StepperPanel>

          <StepperPanel header="Agregar Productos">
            <div className="stepper-scrollable-content">
              <div className="nc-agregar-grid">
                <div className="field producto-dropdown">
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Dropdown 
                      value={productoSeleccionado} 
                      options={productosMock} 
                      onChange={(e) => setProductoSeleccionado(e.value)} 
                      placeholder="Buscar producto..." 
                      className="w-full"
                      filter
                    />
                    <Button 
                      icon="pi pi-plus" 
                      className="p-button-outlined nc-btn-secundario" 
                      aria-label="Nuevo Producto" 
                      title="Alta Rápida de Producto"
                      onClick={() => alert("Aquí abriremos el modal de Alta Rápida de Producto")}
                    />
                  </div>
                </div>
                <div className="field cantidad-input">
                  <InputText 
                    type="number"
                    min="1"
                    value={cantidad} 
                    onChange={(e) => setCantidad(e.target.value)} 
                    placeholder="Cant." 
                    className="w-full"
                    onKeyDown={(e) => e.key === 'Enter' && agregarProducto()}
                  />
                </div>
                <Button 
                  icon="pi pi-plus" 
                  label="Agregar" 
                  className="nc-btn-principal nc-btn-agregar" 
                  onClick={agregarProducto}
                  disabled={!productoSeleccionado || !cantidad || cantidad <= 0}
                />
              </div>

              <div className="nc-tabla-carrito">
                <DataTable value={carrito} emptyMessage="No hay productos agregados." scrollable scrollHeight="100%" className="prov-table">
                  <Column field="nombre" header="Producto" />
                  <Column field="cantidad" header="Cantidad" align="center" />
                  <Column field="precio" header="Precio U." body={(r) => money(r.precio)} />
                  <Column field="importe" header="Importe" body={(r) => money(r.importe)} />
                  <Column body={accionTemplate} header="" style={{ width: '4rem', textAlign: 'center' }} />
                </DataTable>
              </div>
            </div>
            <div className="stepper-acciones flex justify-content-start">
              <Button 
                label="Atrás" 
                icon="pi pi-arrow-left" 
                className="p-button-outlined nc-btn-secundario" 
                onClick={() => stepperRef.current.prevCallback()} 
              />
            </div>
          </StepperPanel>

        </Stepper>
      </div>

      {/* COLUMNA 2: Resumen */}
      <div className="nc-resumen-section">
        <div className="nc-card nc-totales">
          <h3>Resumen Financiero</h3>
          <div className="nc-totales-fila">
            <span>Subtotal:</span>
            <span>{money(subtotal)}</span>
          </div>
          <div className="nc-totales-fila total-final">
            <span>Total:</span>
            <span>{money(total)}</span>
          </div>

          <div className="nc-acciones">
            <Button 
              label="Guardar Compra" 
              icon="pi pi-check" 
              className="nc-btn-principal w-full mb-2" 
              disabled={carrito.length === 0 || !proveedor}
            />
            <Button 
              label="Guardar Borrador" 
              icon="pi pi-save" 
              className="p-button-outlined nc-btn-secundario w-full mb-2" 
            />
            <Button 
              label="Cancelar" 
              icon="pi pi-times" 
              className="nc-btn-cancelar w-full" 
              onClick={() => {
                setCarrito([]); 
                setTicket(""); 
                setProveedor(null);
                setFechaEmision(null);
                setFechaEntrega(null);
                setFormaPago(null);
                setObservaciones("");
                if(stepperRef.current) stepperRef.current.setActiveStep(0);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}