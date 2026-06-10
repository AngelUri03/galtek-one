import React, { useState, useRef } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useNavigate } from "react-router-dom";

import "../../style/components/Login/LoginRecuperar.css";

// Mock de "backend"
const MOCK_CUENTA = {
  usuario: "demoUser",
  email: "demo@correo.com",
};

const LoginRecuperar = () => {
  const toast = useRef(null);
  const navigate = useNavigate();

  const [identificador, setIdentificador] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [loading, setLoading] = useState(false);

  const showError = (detail) => {
    toast.current?.show({
      severity: "error",
      summary: "Campo requerido",
      detail,
      life: 3000,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const valor = identificador.trim();

    if (!valor) {
      setInvalid(true);
      showError("Debes ingresar tu usuario o correo electrónico.");
      return;
    }

    setInvalid(false);
    setLoading(true);

    try {
      // Simula llamada al backend
      await new Promise((r) => setTimeout(r, 600));

      const lower = valor.toLowerCase();
      const match =
        lower === MOCK_CUENTA.usuario.toLowerCase() ||
        lower === MOCK_CUENTA.email.toLowerCase();

      if (match) {
        toast.current?.show({
          severity: "error",
          summary: "Cuenta no encontrada",
          detail: "No encontramos una cuenta con esos datos.",
          life: 3000,
        });
        return;
      }

      toast.current?.show({
        severity: "success",
        summary: "Código enviado",
        detail:
          "Hemos enviado un código de verificación a tu correo (demo).",
        life: 3000,
      });

      setTimeout(() => {
        // 👉 Ahora navegamos a la pantalla de recuperar contraseña
        navigate("/login/recuperar-password");
      }, 700);
    } catch (err) {
      console.error(err);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Ocurrió un error al procesar tu solicitud.",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // Volver al login
   // navigate("/login");
  };

  return (
    <>
      <Toast ref={toast} />
      <Card className="lrec-card">
        <button type="button" className="lrec-back-btn" onClick={handleBack}>
          <i className="pi pi-arrow-left" />
          <span>Volver</span>
        </button>

        <div className="lrec-title">RECUPERAR CUENTA</div>

        <p className="lrec-text">
          Ingresa tu usuario o correo electrónico. Si encontramos tu cuenta,
          te enviaremos un código de verificación para ayudarte a recuperar
          el acceso.
        </p>

        <form className="lrec-form" onSubmit={handleSubmit}>
          <span
            className={`lrec-input-wrapper ${
              invalid ? "invalid" : ""
            }`}
          >
            <InputText
              type="text"
              autoComplete="username email"
              value={identificador}
              onChange={(e) => {
                setIdentificador(e.target.value);
                if (e.target.value.trim() !== "") {
                  setInvalid(false);
                }
              }}
              placeholder="Usuario o correo electrónico"
              className={`lrec-input-base lrec-input-text ${
                invalid ? "invalid" : ""
              }`}
              name="identificador"
            />
            <i className="pi pi-user lrec-input-icon" />
          </span>

          <Button
            type="submit"
            label={loading ? "Enviando..." : "Enviar código"}
            className="lrec-button"
            disabled={loading}
          />
        </form>
      </Card>
    </>
  );
};

export default LoginRecuperar;
