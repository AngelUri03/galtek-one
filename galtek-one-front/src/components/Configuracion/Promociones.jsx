import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "./Css/Promociones.css"; // CSS adaptado

export default function Promociones() {
  const [codigo, setCodigo] = useState("");
  const [nombrePromo, setNombrePromo] = useState("");
  const [cantidadMinima, setCantidadMinima] = useState(1);
  const [cantidadMaxima, setCantidadMaxima] = useState(10);
  const [precioFinal, setPrecioFinal] = useState(0);
  const [promociones, setPromociones] = useState([]);
  const [seleccionadas, setSeleccionadas] = useState([]);

  const crearPromocion = () => {
    if (!codigo || !nombrePromo) return;

    const nueva = {
      id: Date.now(),
      codigo,
      nombrePromo,
      cantidadMinima,
      cantidadMaxima,
      precioFinal,
      activo: false,
      imagen: "https://via.placeholder.com/80x80.png?text=Producto", // Imagen de ejemplo
    };

    setPromociones([...promociones, nueva]);
    setCodigo("");
    setNombrePromo("");
    setCantidadMinima(1);
    setCantidadMaxima(10);
    setPrecioFinal(0);
  };

  const toggleActivo = (id) => {
    setPromociones((prev) =>
      prev.map((p) => (p.id === id ? { ...p, activo: !p.activo } : p))
    );
  };

  const editarPromo = (id) => {
    alert(`Editar promoción con id ${id}`);
  };

  const eliminarPromo = (id) => {
    setPromociones((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="contenedor-principal">
      {/* Formulario */}
      <div className="formulario">
        <h2>Crear Promoción</h2>

        <div className="campo">
          <label>Código de Barras</label>
          <InputText
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            className="input-full"
          />
        </div>

        <div className="campo">
          <label>Nombre de la Promoción</label>
          <InputText
            value={nombrePromo}
            onChange={(e) => setNombrePromo(e.target.value)}
            className="input-full"
          />
        </div>

        <div className="campo doble">
          <div className="solo-botones">
            <label>Cantidad Mínima</label>
            <InputNumber
              value={cantidadMinima}
              onValueChange={(e) => setCantidadMinima(e.value)}
              showButtons
              buttonLayout="vertical"
              className="input-number custom-spinner"
            />
          </div>
          <div className="solo-botones">
            <label>Cantidad Máxima</label>
            <InputNumber
              value={cantidadMaxima}
              onValueChange={(e) => setCantidadMaxima(e.value)}
              showButtons
              buttonLayout="vertical"
              className="input-number custom-spinner"
            />
          </div>
        </div>

        <div className="campo">
          <label>Precio Final</label>
          <InputNumber
            value={precioFinal}
            onValueChange={(e) => setPrecioFinal(e.value)}
            mode="currency"
            currency="MXN"
            locale="es-MX"
            className="input-full"
          />
        </div>

        <div className="boton-derecha">
          <Button
            label="Crear Promoción"
            onClick={crearPromocion}
            className="boton-verde"
          />
        </div>
      </div>

      {/* Lista de promociones activas */}
      <div className="promociones-activas">
        <h3>Promociones Activas</h3>

        {promociones.length === 0 ? (
          <p>No hay promociones activas.</p>
        ) : (
          promociones.map((promo) => (
            <div key={promo.id} className="promo-card">
              <img src={promo.imagen} alt={promo.nombrePromo} className="promo-img" />
              <div className="promo-info">
                <h4>{promo.nombrePromo}</h4>
                <p>Código: {promo.codigo}</p>
                <p>Min: {promo.cantidadMinima}, Max: {promo.cantidadMaxima}</p>
                <p>Precio: ${promo.precioFinal}</p>
                <div className="promo-buttons">
                  <Button
                    label={promo.activo ? "Desactivar" : "Activar"}
                    onClick={() => toggleActivo(promo.id)}
                    className={promo.activo ? "p-button-warning" : "p-button-success"}
                    icon={promo.activo ? "pi pi-times" : "pi pi-check"}
                    size="small"
                  />
                  <Button
                    label="Editar"
                    icon="pi pi-pencil"
                    className="p-button-info"
                    size="small"
                    onClick={() => editarPromo(promo.id)}
                  />
                  <Button
                    label="Eliminar"
                    icon="pi pi-trash"
                    className="p-button-danger"
                    size="small"
                    onClick={() => eliminarPromo(promo.id)}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}