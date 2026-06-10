import React, { useState } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import "./Css/Tienda.css"; // estilos aparte

export default function StoreConfigForm() {
  const [form, setForm] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    correo: "",
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    console.log("Datos de tienda:", form);
  };

  return (
    <div className="ajustes-wrap">
      <Card className="ajustes-card">
        <h1 className="ajustes-title">
          CONFIGURACIÓN DE LA
          <br />
          TIENDA
        </h1>

        <form onSubmit={onSubmit} className="ajustes-form">
          <InputText
            name="nombre"
            value={form.nombre}
            onChange={onChange}
            placeholder="Ingresar nombre de la tienda"
            className="w-full ajustes-input"
          />

          <InputText
            name="direccion"
            value={form.direccion}
            onChange={onChange}
            placeholder="Ingresar dirección de la tienda"
            className="w-full ajustes-input"
          />

          <InputText
            name="telefono"
            value={form.telefono}
            onChange={onChange}
            placeholder="Ingresar número de teléfono"
            className="w-full ajustes-input"
          />

          <InputText
            name="correo"
            value={form.correo}
            onChange={onChange}
            placeholder="Ingresar correo electrónico"
            className="w-full ajustes-input"
          />

          <Button type="submit" label="GUARDAR" className="w-full ajustes-btn" />
        </form>
      </Card>
    </div>
  );
}
