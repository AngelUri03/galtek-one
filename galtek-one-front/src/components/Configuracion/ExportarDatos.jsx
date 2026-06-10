import React, { useState, useEffect } from 'react';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { ToggleButton } from 'primereact/togglebutton';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import './Css/ExportarDatos.css';


export default function ExportarDatos({ editMode = true }) {
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);

  const options = [
    { label: 'csv', value: 'csv' },
    { label: 'xlsx', value: 'xlsx' },
    { label: 'PDF', value: 'PDF' }
  ];

  // Función para agregar clase marcador solo en modo edición
  const marcadorClass = (baseClass) => editMode ? `${baseClass} marcador` : baseClass;

  return (
    <div className={marcadorClass("export-container")}>
      <div className="titulo">Exportar Datos</div>

      <div className={marcadorClass("campo")} id="fechas">
        <label className="label">Rango de fechas:</label>
        <div className="fechas">
          <Calendar
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.value)}
            className={marcadorClass("calendar-input")}
            placeholder="Desde"
          />
          <Calendar
            value={fechaFin}
            onChange={(e) => setFechaFin(e.value)}
            className={marcadorClass("calendar-input")}
            placeholder="Hasta"
          />
        </div>
      </div>

      <div className={marcadorClass("campo")} id="tipo-export">
        <label className="label">Seleccionar tipo:</label>
        <Dropdown
          value={selectedOption}
          options={options}
          onChange={(e) => setSelectedOption(e.value)}
          placeholder="Selecciona una opción"
          className={marcadorClass("dropdown-full")}
        />
      </div>

      <div className={marcadorClass("export-button-container")} id="boton-export">
        <button className={marcadorClass("export-button")}>Exportar</button>
      </div>
    </div>
  );
}