import React from "react";
import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import "../../style/components/Login/Privacidad.css";

const Privacidad = () => {
  const navigate = useNavigate();

  return (
    <div className="privacy-page">
      <div className="privacy-card">
        <div className="privacy-header">
          <div className="privacy-topbar">
            <Button
              type="button"
              className="privacy-back-btn"
              icon="pi pi-arrow-left"
              label="Volver"
              onClick={() => navigate(-1)}
            />
          </div>

          <div className="privacy-title-wrap">
            <h1 className="privacy-title">AVISO DE PRIVACIDAD</h1>
            <div className="privacy-title-accent" />
          </div>
        </div>

        <div className="privacy-content">
          {/* 1. IDENTIDAD DEL RESPONSABLE */}
          <section className="privacy-section">
            <h2 className="privacy-section-title">
              1. Identidad del Responsable
            </h2>
            <p className="privacy-paragraph">
              Galtek (en adelante, “el Responsable”), con domicilio en Tecámac,
              Estado de México, México, es el responsable del tratamiento de sus
              datos personales, en cumplimiento con las leyes aplicables en
              materia de protección de datos personales.
            </p>
          </section>

          {/* 2. DATOS PERSONALES QUE RECABAMOS */}
          <section className="privacy-section">
            <h2 className="privacy-section-title">
              2. Datos personales que recabamos
            </h2>
            <p className="privacy-paragraph">
              Recabamos de manera directa, indirecta y automática los siguientes
              datos personales:
            </p>
            <ul className="privacy-list">
              <li>
                <strong>De clientes:</strong> nombre, correo electrónico,
                teléfono, historial de compras, ubicación, RFC (si aplica para
                facturación).
              </li>
              <li>
                <strong>De usuarios del sistema:</strong> nombre completo,
                correo, teléfono, cargo, actividad dentro del sistema, historial
                de sesiones.
              </li>
              <li>
                <strong>
                  De empleados registrados por usuarios administradores:
                </strong>{" "}
                nombre, entrada/salida, actividades operativas, permisos
                asignados.
              </li>
              <li>
                <strong>De proveedores:</strong> razón social, productos
                ofrecidos, contacto, precios de compra, RFC o identificador
                fiscal.
              </li>
              <li>
                <strong>De dispositivos:</strong> dirección IP, navegador,
                sistema operativo, ID de dispositivo (cuando aplique), ubicación
                aproximada.
              </li>
            </ul>
          </section>

          {/* 3. FINALIDADES DEL TRATAMIENTO */}
          <section className="privacy-section">
            <h2 className="privacy-section-title">
              3. Finalidades del tratamiento
            </h2>
            <p className="privacy-paragraph">
              Los datos personales serán utilizados para las siguientes
              finalidades:
            </p>

            <p className="privacy-paragraph">
              <strong>
                Primarias (necesarias para la prestación del servicio):
              </strong>
            </p>
            <ul className="privacy-list">
              <li>Identificación y autenticación de usuarios.</li>
              <li>Gestión de acceso y roles dentro del sistema.</li>
              <li>Operación y administración del sistema de punto de venta.</li>
              <li>
                Registro de ventas, compras, devoluciones, inventario,
                proveedores y empleados.
              </li>
              <li>Emisión de tickets, facturación y reportes.</li>
              <li>
                Envío de notificaciones sobre vencimiento de suscripción o
                alertas configuradas por el Usuario.
              </li>
            </ul>

            <p className="privacy-paragraph">
              <strong>
                Secundarias (no indispensables, pero con consentimiento):
              </strong>
            </p>
            <ul className="privacy-list">
              <li>Envío de información comercial y promociones.</li>
              <li>
                Estadísticas de uso y mejoras en la experiencia del usuario.
              </li>
              <li>
                Desarrollo de nuevas funcionalidades, productos o servicios.
              </li>
            </ul>
          </section>

          {/* 4. TRANSFERENCIA DE DATOS */}
          <section className="privacy-section">
            <h2 className="privacy-section-title">4. Transferencia de datos</h2>
            <p className="privacy-paragraph">
              Sus datos personales no serán compartidos con terceros sin su
              consentimiento, salvo en los siguientes casos:
            </p>
            <ul className="privacy-list">
              <li>Requerimientos de autoridades fiscales o judiciales.</li>
              <li>
                Proveedores de infraestructura tecnológica necesarios para la
                operación del sistema (hosting, correo, pagos).
              </li>
              <li>
                En caso de una fusión, adquisición o reestructuración del
                Responsable, los datos podrán ser transferidos conforme a la
                ley.
              </li>
            </ul>
            <p className="privacy-paragraph">
              En todos los casos, se exigirá a dichos terceros el cumplimiento
              de medidas de seguridad y confidencialidad.
            </p>
          </section>

          {/* 5. ALMACENAMIENTO Y SEGURIDAD DE LOS DATOS */}
          <section className="privacy-section">
            <h2 className="privacy-section-title">
              5. Almacenamiento y seguridad de los datos
            </h2>
            <p className="privacy-paragraph">
              Los datos se almacenan en servidores con protocolos de seguridad
              física y lógica. Contamos con medidas técnicas y organizativas
              para evitar el acceso no autorizado, pérdida o alteración de
              datos, tales como:
            </p>
            <ul className="privacy-list">
              <li>Cifrado de contraseñas.</li>
              <li>Control de sesiones con JWT.</li>
              <li>Bitácora de acciones del sistema.</li>
              <li>Respaldos periódicos.</li>
            </ul>
          </section>

          {/* 6. DERECHOS ARCO */}
          <section className="privacy-section">
            <h2 className="privacy-section-title">
              6. Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)
            </h2>
            <p className="privacy-paragraph">Usted tiene derecho a:</p>
            <ul className="privacy-list">
              <li>Acceder a sus datos personales.</li>
              <li>Solicitar su corrección o actualización.</li>
              <li>Oponerse al tratamiento para fines secundarios.</li>
              <li>
                Cancelar su uso cuando ya no sean necesarios para la finalidad
                original.
              </li>
            </ul>
            <p className="privacy-paragraph">
              Para ejercer estos derechos, favor de enviar una solicitud al
              correo: <strong>galtek.helpdesk@gmail.com</strong>.
            </p>
            <p className="privacy-paragraph">
              La solicitud deberá incluir: nombre completo, correo registrado,
              descripción del derecho que desea ejercer y copia de una
              identificación oficial.
            </p>
          </section>

          {/* 7. USO DE COOKIES */}
          <section className="privacy-section">
            <h2 className="privacy-section-title">
              7. Uso de cookies y tecnologías similares
            </h2>
            <p className="privacy-paragraph">
              El sistema en su versión web puede usar cookies y herramientas de
              análisis para:
            </p>
            <ul className="privacy-list">
              <li>Recordar sesiones de usuario.</li>
              <li>Mejorar la navegación.</li>
              <li>Generar estadísticas de uso.</li>
            </ul>
            <p className="privacy-paragraph">
              El Usuario puede configurar su navegador para bloquear o eliminar
              estas cookies, aunque algunas funciones del sistema podrían verse
              afectadas.
            </p>
          </section>

          {/* 8. CAMBIOS EN EL AVISO DE PRIVACIDAD */}
          <section className="privacy-section">
            <h2 className="privacy-section-title">
              8. Cambios en el Aviso de Privacidad
            </h2>
            <p className="privacy-paragraph">
              Este Aviso puede ser modificado en cualquier momento para cumplir
              con requisitos legales o mejoras del sistema. Las versiones
              actualizadas estarán disponibles dentro del sistema y/o en el
              sitio web. Le recomendamos revisarlo periódicamente.
            </p>
          </section>

          {/* 9. CONSENTIMIENTO */}
          <section className="privacy-section">
            <h2 className="privacy-section-title">9. Consentimiento</h2>
            <p className="privacy-paragraph">
              Al registrar una cuenta, continuar usando el sistema o
              proporcionar datos, usted acepta expresamente este Aviso de
              Privacidad y autoriza su tratamiento conforme a lo descrito.
            </p>
            <ul className="privacy-paragraph">
              <li>
                Correo: <strong>galtek.helpdesk@gmail.com</strong>
              </li>
              <li>
                Teléfono / WhatsApp: <strong>+52 55 1159 1035</strong>
              </li>
            </ul>
          </section>
        </div>
      </div>

      <div className="privacy-footer-strip" />
    </div>
  );
};

export default Privacidad;
