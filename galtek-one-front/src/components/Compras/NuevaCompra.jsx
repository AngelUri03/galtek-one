import React, { useState, useRef } from "react";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Stepper } from "primereact/stepper";
import { StepperPanel } from "primereact/stepperpanel"; 
import "../../style/components/Compras/NuevaCompra.css";
import PanelSugerencias from "./PanelSugerencias"; // Asegúrate de importar el componente de sugerencias

export default function NuevaCompra() {
  const stepperRef = useRef(null); // Referencia para controlar el Stepper
  // Estados iniciales para la UI
  const [proveedor, setProveedor] = useState(null);
  const [ticket, setTicket] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState("");
  const [carrito, setCarrito] = useState([]); // Aquí se irán guardando los productos a comprar

  // Datos simulados para probar la UI
  const proveedoresMock = [
    { label: "Abarrotes Central", value: "1" },
    { label: "Carnes Frías del Norte", value: "2" },
    { label: "Frutas y Verduras San Miguel", value: "3" }
  ];

  const productosMock = [
    { label: "Arroz Morelos 1kg", value: "1", precio: 25.0 },
    { label: "Frijol Negro 900g", value: "2", precio: 29.0 },
    { label: "Azúcar estándar 1kg", value: "3", precio: 23.0 },
    { label: "Aceite vegetal 1L", value: "4", precio: 38.5 }
  ];

  const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;

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
  const total = subtotal; // Aquí podrías sumar impuestos si aplican en un futuro

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
            <div className="stepper-scrollable-content">
              <div className="nc-form-grid">
                <div className="field">
                  <label>Proveedor</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Dropdown 
                      value={proveedor} 
                      options={proveedoresMock} 
                      onChange={(e) => setProveedor(e.value)} 
                      placeholder="Escriba o seleccione un proveedor" 
                      className="w-full"
                      editable
                    />
                    <Button 
                      icon="pi pi-plus" 
                      className="p-button-outlined btn-outline-verde" 
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
              </div>
            </div>
            <div className="stepper-acciones flex justify-content-end mt-4">
              <Button 
                label="Siguiente" 
                icon="pi pi-arrow-right" 
                iconPos="right" 
                className="btn-verde" 
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
                      className="p-button-outlined btn-outline-verde" 
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
                  className="btn-verde nc-btn-agregar" 
                  onClick={agregarProducto}
                  disabled={!productoSeleccionado || !cantidad || cantidad <= 0}
                />
              </div>

              <div className="nc-tabla-carrito">
                <DataTable value={carrito} emptyMessage="No hay productos agregados." responsiveLayout="scroll">
                  <Column field="nombre" header="Producto" />
                  <Column field="cantidad" header="Cantidad" align="center" />
                  <Column field="precio" header="Precio U." body={(r) => money(r.precio)} />
                  <Column field="importe" header="Importe" body={(r) => money(r.importe)} />
                  <Column body={accionTemplate} header="" style={{ width: '4rem', textAlign: 'center' }} />
                </DataTable>
              </div>
            </div>
            <div className="stepper-acciones flex justify-content-start mt-4">
              <Button 
                label="Atrás" 
                icon="pi pi-arrow-left" 
                className="p-button-outlined btn-outline-verde" 
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
              className="btn-verde w-full mb-2" 
              disabled={carrito.length === 0 || !proveedor}
            />
            <Button 
              label="Guardar Borrador" 
              icon="pi pi-save" 
              className="p-button-outlined btn-outline-verde w-full mb-2" 
            />
            <Button 
              label="Cancelar" 
              icon="pi pi-times" 
              className="btn-gris-cancelar w-full" 
              onClick={() => {
                setCarrito([]); 
                setTicket(""); 
                setProveedor(null);
                // Si el usuario cancela, lo regresamos al paso 1 del stepper
                if(stepperRef.current) stepperRef.current.setActiveStep(0);
              }}
            />
          </div>
        </div>
      </div>

      {/* COLUMNA 3: Sugerencias */}
      <div className="nc-sugerencias-section">
        <PanelSugerencias />
      </div>

    </div>
  );
}