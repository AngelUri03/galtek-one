import React from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";

import "../../style/components/Login/Terminos.css";

const Terminos = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="terms-page">
      <Card className="terms-card">
        <div className="terms-header">
          <div className="terms-topbar">
            <Button
              type="button"
              className="terms-back-btn"
              onClick={handleBack}
            >
              <i className="pi pi-arrow-left" />
              <span>Volver</span>
            </Button>
          </div>

          <div className="terms-title-wrap">
            <h1 className="terms-title">Términos y Condiciones</h1>
            <div className="terms-title-accent" />
          </div>
        </div>

        <div className="terms-content">
          <section className="terms-section">
            <h2 className="terms-section-title">1. Aceptación de los Términos</h2>
            <p className="terms-paragraph">
              Al registrarte, instalar, acceder o utilizar de cualquier forma el
              sistema de punto de venta desarrollado por <strong>Galtek</strong>{" "}
              (en adelante, el <strong>&quot;Proveedor&quot;</strong>), aceptas
              estar legalmente obligado(a) por estos Términos y Condiciones de
              Uso. Si no estás de acuerdo con alguno de los puntos
              establecidos, deberás abstenerte de utilizar el sistema.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="terms-section-title">2. Definiciones</h2>
            <p className="terms-paragraph">
              <strong>Sistema:</strong> Aplicación web, móvil o ejecutable de
              punto de venta que incluye, de forma enunciativa mas no
              limitativa, módulos de ventas, inventario, empleados, reportes,
              proveedores y otros componentes relacionados.
            </p>
            <p className="terms-paragraph">
              <strong>Usuario Administrador:</strong> Persona o entidad que
              contrata o adquiere el sistema, administra usuarios y define
              configuraciones.
            </p>
            <p className="terms-paragraph">
              <strong>Usuario Empleado:</strong> Persona autorizada por el
              Usuario Administrador para operar ciertas funciones del sistema.
            </p>
            <p className="terms-paragraph">
              <strong>Proveedor:</strong> Entidad propietaria y desarrolladora
              del sistema.
            </p>
            <p className="terms-paragraph">
              <strong>Licencia de Uso:</strong> Derecho no exclusivo,
              intransferible y limitado para usar el sistema conforme a estos
              Términos.
            </p>
            <p className="terms-paragraph">
              <strong>Suscripción:</strong> Acceso al sistema mediante pago
              recurrente (por ejemplo, mensual o anual).
            </p>
            <p className="terms-paragraph">
              <strong>Versión Ejecutable:</strong> Software adquirido bajo
              licencia única para uso local en uno o varios equipos, según lo
              contratado.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="terms-section-title">3. Alcance de la Licencia</h2>
            <p className="terms-paragraph">
              El Proveedor concede al Usuario una licencia de uso limitada y no
              exclusiva, sujeta a las siguientes condiciones:
            </p>
            <ul className="terms-list">
              <li>
                No se permite copiar, distribuir, sublicenciar, descompilar,
                desensamblar, realizar ingeniería inversa ni modificar el
                sistema.
              </li>
              <li>
                El sistema puede incluir mecanismos de protección como DRM,
                activación por licencia o validación en línea.
              </li>
              <li>
                El uso indebido o no autorizado del sistema podrá derivar en la
                cancelación inmediata de la licencia sin derecho a reembolso.
              </li>
            </ul>
          </section>

          <section className="terms-section">
            <h2 className="terms-section-title">4. Disponibilidad del Servicio</h2>
            <p className="terms-paragraph">
              El Proveedor se compromete a ofrecer una disponibilidad razonable
              del sistema en línea, pero no garantiza que el servicio sea
              ininterrumpido, libre de errores o accesible en todo momento.
            </p>
            <p className="terms-paragraph">
              El sistema puede verse afectado por labores de mantenimiento,
              incidencias de red, caídas de servidores o causas de fuerza mayor
              u otros eventos fuera del control razonable del Proveedor.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="terms-section-title">5. Suscripción y Pagos</h2>
            <ul className="terms-list">
              <li>
                Las suscripciones deberán ser pagadas por adelantado según el
                plan contratado.
              </li>
              <li>
                El sistema podrá emitir alertas al Usuario Administrador antes
                de la fecha de vencimiento.
              </li>
              <li>
                La falta de pago en tiempo y forma podrá resultar en la
                suspensión automática del servicio.
              </li>
              <li>No se otorgarán reembolsos por períodos no utilizados.</li>
              <li>
                Los precios podrán ser modificados, previo aviso con al menos 15
                días naturales de anticipación.
              </li>
            </ul>
          </section>

          <section className="terms-section">
            <h2 className="terms-section-title">6. Obligaciones del Usuario</h2>
            <ul className="terms-list">
              <li>Mantener la confidencialidad de las credenciales de acceso.</li>
              <li>Utilizar el sistema únicamente para fines comerciales legales.</li>
              <li>
                No suplantar identidades ni registrar datos falsos o engañosos.
              </li>
              <li>
                Proteger los dispositivos donde se utilice el sistema frente a
                accesos no autorizados.
              </li>
            </ul>
          </section>

          <section className="terms-section">
            <h2 className="terms-section-title">7. Roles y Permisos</h2>
            <ul className="terms-list">
              <li>
                El Usuario Administrador es responsable de toda actividad
                realizada desde su cuenta y las cuentas de sus empleados.
              </li>
              <li>
                El Proveedor no se responsabiliza por configuraciones incorrectas,
                accesos indebidos o eliminación de datos provocada por el propio
                Usuario o sus empleados.
              </li>
              <li>
                El rol de soporte técnico podrá acceder al sistema únicamente bajo
                autorización del Usuario Administrador y con fines de diagnóstico
                o solución de incidencias.
              </li>
            </ul>
          </section>

          <section className="terms-section">
            <h2 className="terms-section-title">
              8. Gestión de Inventario y Ventas
            </h2>
            <p className="terms-paragraph">
              El sistema ofrece herramientas para controlar productos con o sin
              fecha de caducidad, manejar alertas configurables por nivel de
              existencias y gestionar unidades, pesos u otras presentaciones.
            </p>
            <p className="terms-paragraph">
              Las devoluciones, cancelaciones y operaciones de venta son
              responsabilidad exclusiva del Usuario, quien deberá operar conforme
              a la legislación aplicable a su giro comercial.
            </p>
            <p className="terms-paragraph">
              El sistema es una herramienta auxiliar y no sustituye los controles
              contables o legales que exijan las autoridades fiscales
              correspondientes.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="terms-section-title">
              9. Control de Empleados y Registro de Actividades
            </h2>
            <p className="terms-paragraph">
              El sistema puede incluir módulos de control de asistencia, historial
              de sesiones, registro de operaciones y otros mecanismos similares.
            </p>
            <p className="terms-paragraph">
              El uso de esta información deberá apegarse a las políticas internas
              del Usuario y a las leyes laborales aplicables en su jurisdicción.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="terms-section-title">
              10. Protección de Datos y Seguridad
            </h2>
            <ul className="terms-list">
              <li>
                El sistema puede implementar medidas de seguridad como JWT,
                cifrado, control de sesiones y respaldos periódicos.
              </li>
              <li>
                Los datos ingresados al sistema son propiedad del Usuario y su
                manejo es de su exclusiva responsabilidad.
              </li>
              <li>
                El Proveedor no comercializa información personal sin el
                consentimiento correspondiente.
              </li>
              <li>
                El Usuario es responsable de cumplir con las leyes locales de
                protección de datos personales.
              </li>
            </ul>
          </section>

          <section className="terms-section">
            <h2 className="terms-section-title">
              11. Limitación de Responsabilidad
            </h2>
            <p className="terms-paragraph">
              El Proveedor no será responsable por pérdidas económicas,
              interrupciones del negocio, pérdida de datos o cualquier daño
              directo, indirecto, incidental o consecuente derivado del uso o
              imposibilidad de uso del sistema, incluso si hubiera sido informado
              de la posibilidad de dichos daños.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="terms-section-title">
              12. Escalabilidad y Funcionalidades Futuras
            </h2>
            <p className="terms-paragraph">
              El sistema está diseñado para ser escalable, pudiendo incorporar
              nuevas funciones como facturación electrónica, servicios,
              multicaja, aplicaciones móviles u otros módulos adicionales.
            </p>
            <p className="terms-paragraph">
              Algunas funcionalidades futuras podrán requerir pagos adicionales,
              módulos extra o acuerdos complementarios.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="terms-section-title">
              13. Actualizaciones y Mantenimiento
            </h2>
            <p className="terms-paragraph">
              El Proveedor podrá implementar actualizaciones para mejorar la
              seguridad, corregir errores o añadir nuevas características.
            </p>
            <p className="terms-paragraph">
              En la versión en línea, las actualizaciones se aplicarán de forma
              automática. En la versión ejecutable, puede ser necesaria la
              instalación manual o la conexión periódica a internet para aplicar
              mejoras.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="terms-section-title">14. Terminación del Servicio</h2>
            <ul className="terms-list">
              <li>
                El Usuario puede solicitar la baja de su cuenta en cualquier
                momento.
              </li>
              <li>
                El Proveedor podrá suspender o cancelar cuentas que incumplan
                estos Términos, utilicen el sistema con fines ilícitos o
                comprometan la seguridad de la plataforma.
              </li>
              <li>
                En caso de terminación, no habrá reembolso de pagos ya realizados
                y el acceso al sistema será revocado.
              </li>
            </ul>
          </section>

          <section className="terms-section">
            <h2 className="terms-section-title">
              15. Legislación Aplicable y Jurisdicción
            </h2>
            <p className="terms-paragraph">
              Estos Términos se rigen por las leyes de los Estados Unidos
              Mexicanos. Para cualquier controversia derivada de su
              interpretación o cumplimiento, las partes se someten a la
              jurisdicción de los tribunales competentes de la Ciudad de México,
              renunciando a cualquier otro fuero que pudiera corresponderles por
              razón de su domicilio presente o futuro.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="terms-section-title">16. Contacto y Soporte</h2>
            <p className="terms-paragraph">
              Para dudas, reportes o asistencia técnica, puedes contactarnos en:
            </p>
            <ul className="terms-list">
              <li>
                Correo: <strong>galtek.helpdesk@gmail.com</strong>
              </li>
              <li>
                Teléfono / WhatsApp: <strong>+52 55 1159 1035</strong>
              </li>
            </ul>
          </section>
        </div>
      </Card>

      <div className="terms-footer-strip" />
    </div>
  );
};

export default Terminos;