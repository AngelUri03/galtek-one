import React, { useState } from "react";
import Shell from "../common/Shell";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import "./Css/Soporte.css";


export default function Soporte() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [visible, setVisible] = useState(false);
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);

  // Datos simulados (luego podrían venir de soporte.json)
  const tickets = [
    {
      id: "TK-SP-0001",
      asunto: "Problema con el Login",
      fecha: "2025-08-08",
      descripcion:
        "El usuario reporta que no puede acceder a su cuenta a pesar de usar las credenciales correctas.",
      estado: "Abierto",
      prioridad: "Alta",
      mensajes: [
        { remitente: "Usuario", mensaje: "No puedo iniciar sesión en el sistema." },
        { remitente: "Soporte", mensaje: "Por favor, intente restablecer su contraseña." },
        { remitente: "Usuario", mensaje: "Ya lo hice, pero sigue sin funcionar." },
      ],
    },
    {
      id: "TK-SP-0002",
      asunto: "Error al cargar productos",
      fecha: "2025-09-01",
      descripcion:
        "Durante la carga masiva de productos, aparece un error de formato en el archivo CSV.",
      estado: "En revisión",
      prioridad: "Media",
      mensajes: [
        { remitente: "Usuario", mensaje: "El archivo CSV no se carga." },
        { remitente: "Soporte", mensaje: "Envíenos el archivo para revisión." },
      ],
    },
  ];

  const abrirDetalle = (ticket) => {
    setTicketSeleccionado(ticket);
    setVisible(true);
  };

  const verTicketTemplate = (rowData) => (
    <Button
      label="Ver"
      className="btn-verde"
      size="small"
      onClick={() => abrirDetalle(rowData)}
    />
  );

  return (
    <Shell>
      <div className="soporte-wrapper">
        <h1 className="soporte-titulo">Soporte</h1>

        {/* ==== Sección superior de accesos rápidos ==== */}
        <div className="soporte-opciones">
          <div className="soporte-card">
            <i className="pi pi-phone" />
            <span>Contacto</span>
          </div>
          <div className="soporte-card">
            <i className="pi pi-question-circle" />
            <span>Preguntas Frecuentes</span>
          </div>
          <div className="soporte-card">
            <i className="pi pi-comments" />
            <span>Chat en vivo</span>
          </div>
          <div className="soporte-card">
            <i className="pi pi-exclamation-triangle" />
            <span>Reportar Problema</span>
          </div>
        </div>

        {/* ==== Sección media con documentación y búsqueda ==== */}
        <div className="soporte-docs">
          <div className="soporte-card soporte-card-large">
            <i className="pi pi-file" />
            <span>Documentación Integrada</span>
          </div>

          <div className="soporte-search">
            <h3>Centro de ayuda</h3>
            <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <InputText
                placeholder="Buscar"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
              />
            </span>
          </div>
        </div>

        {/* ==== Tabla de tickets ==== */}
        <div className="soporte-tickets">
          <h3>Estado de tickets de soporte</h3>
          <DataTable
            value={tickets}
            stripedRows
            paginator
            rows={1}
            globalFilter={globalFilter}
            emptyMessage="Sin tickets disponibles"
          >
            <Column field="id" header="Ticket ID" />
            <Column field="asunto" header="Asunto" />
            <Column field="fecha" header="Última Actualización" />
            <Column header="Acciones" body={verTicketTemplate} />
          </DataTable>
        </div>

        {/* ==== MODAL DETALLE DEL TICKET ==== */}
        <Dialog
          header="Detalle del Ticket"
          visible={visible}
          onHide={() => setVisible(false)}
          style={{ width: "45vw" }}
          modal
          dismissableMask
          className="soporte-dialog"
        >
          {ticketSeleccionado ? (
            <div className="ticket-detalle">
              <h3>{ticketSeleccionado.asunto}</h3>
              <p><b>ID:</b> {ticketSeleccionado.id}</p>
              <p><b>Fecha:</b> {ticketSeleccionado.fecha}</p>
              <p><b>Estado:</b> {ticketSeleccionado.estado}</p>
              <p><b>Prioridad:</b> {ticketSeleccionado.prioridad}</p>
              <hr />
              <p><b>Descripción:</b></p>
              <p className="descripcion">{ticketSeleccionado.descripcion}</p>
              <hr />
              <p><b>Mensajes del ticket:</b></p>
              <div className="mensajes-box">
                {ticketSeleccionado.mensajes.map((msg, i) => (
                  <div
                    key={i}
                    className={`mensaje ${
                      msg.remitente === "Usuario" ? "mensaje-usuario" : "mensaje-soporte"
                    }`}
                  >
                    <strong>{msg.remitente}:</strong> {msg.mensaje}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p>No se encontró información del ticket.</p>
          )}
        </Dialog>
      </div>
    </Shell>
  );
}
