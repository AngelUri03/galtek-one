import React, { useState, useRef } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useNavigate } from "react-router-dom";

import "../../style/components/Login/LoginRegister.css";
import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";
import { encryptRSAOAEPToBase64 } from "../../utils/rsa";

const api = new APIfetchApi();

const LoginRegister = () => {
  const toast = useRef(null);
  const navigate = useNavigate();

  const [nombreCompleto, setNombreCompleto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [invalidFields, setInvalidFields] = useState({
    nombreCompleto: false,
    telefono: false,
    password: false,
    confirmPassword: false,
  });

  const showError = (detail) => {
    toast.current?.show({
      severity: "error",
      summary: "Campo requerido",
      detail,
      life: 3000,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const nextInvalid = {
      nombreCompleto: false,
      telefono: false,
      password: false,
      confirmPassword: false,
    };
    let hasError = false;

    if (nombreCompleto.trim() === "") {
      nextInvalid.nombreCompleto = true;
      showError("Debes ingresar tu nombre completo.");
      hasError = true;
    }
    if (telefono.trim() === "") {
      nextInvalid.telefono = true;
      showError("Debes ingresar tu número de teléfono.");
      hasError = true;
    }
    if (password.trim() === "") {
      nextInvalid.password = true;
      showError("Debes ingresar una contraseña.");
      hasError = true;
    }
    if (confirmPassword.trim() === "") {
      nextInvalid.confirmPassword = true;
      showError("Debes confirmar tu contraseña.");
      hasError = true;
    } else if (password && confirmPassword && password !== confirmPassword) {
      nextInvalid.confirmPassword = true;
      toast.current?.show({
        severity: "error",
        summary: "Contraseñas distintas",
        detail: "Las contraseñas no coinciden.",
        life: 3000,
      });
      hasError = true;
    }

    setInvalidFields(nextInvalid);
    if (hasError) return;

    try {
      // 1. Obtener llave pública
      const resKey = await api.fetchApi(
        { "Content-Type": "application/json" },
        "GET",
        undefined,
        endpoints.authPublicKey
      );

      if (!resKey) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo contactar al servidor (llave pública)",
          life: 3000,
        });
        return;
      }

      const keyJson = await resKey.json().catch(() => null);
      const publicKey = keyJson?.data;
      if (!resKey.ok || !publicKey) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: keyJson?.message || "Error obteniendo la llave pública",
          life: 3000,
        });
        return;
      }

      // 2. Encriptar contraseña
      const encryptedPassword = await encryptRSAOAEPToBase64(publicKey, password);

      const body = {
        nombre: nombreCompleto,
        telefono,
        password: encryptedPassword,
      };

      // 3. Registrar usuario
      const resRegister = await api.fetchApi(
        { "Content-Type": "application/json" },
        "POST",
        body,
        endpoints.usuarios
      );

      if (!resRegister) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo contactar al servidor (registro)",
          life: 3000,
        });
        return;
      }

      const payload = await resRegister.json().catch(() => null);

      if (!resRegister.ok || (payload?.statusCode && payload.statusCode !== 200)) {
        toast.current?.show({
          severity: "error",
          summary: "Error al registrar",
          detail: payload?.message || "No se pudo crear la cuenta",
          life: 3000,
        });
        return;
      }

      toast.current?.show({
        severity: "success",
        summary: "Cuenta creada",
        detail: "Tu cuenta se creó correctamente. Ya puedes iniciar sesión.",
        life: 3000,
      });

      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      console.error("Error en registro:", err);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Ocurrió un error inesperado al registrar.",
        life: 3000,
      });
    }
  };

  const handleTermsClick = () => {
    navigate("/terminos");
  };

  const handlePrivacyClick = () => {
    navigate("/privacidad");
  };

  const handleBackClick = () => {
    navigate("/login");
  };

  return (
    <>
      <Toast ref={toast} />
      <Card className="lr-card">
        <button
          type="button"
          className="lr-back-btn"
          onClick={handleBackClick}
        >
          <i className="pi pi-arrow-left" />
          <span>Regresar</span>
        </button>

        <div className="lr-title">CREAR CUENTA</div>

        <form className="lr-form" onSubmit={handleRegister}>
          <span
            className={`lr-input-wrapper ${
              invalidFields.nombreCompleto ? "invalid" : ""
            }`}
          >
            <InputText
              value={nombreCompleto}
              onChange={(e) => {
                setNombreCompleto(e.target.value);
                if (e.target.value.trim() !== "") {
                  setInvalidFields((prev) => ({
                    ...prev,
                    nombreCompleto: false,
                  }));
                }
              }}
              placeholder="Nombre completo"
              className={`lr-input-base lr-input-text ${
                invalidFields.nombreCompleto ? "invalid" : ""
              }`}
              autoComplete="name"
              name="fullName"
              type="text"
            />
            <i className="pi pi-user lr-input-icon" />
          </span>

          <span
            className={`lr-input-wrapper ${
              invalidFields.telefono ? "invalid" : ""
            }`}
          >
            <InputText
              value={telefono}
              onChange={(e) => {
                setTelefono(e.target.value);
                if (e.target.value.trim() !== "") {
                  setInvalidFields((prev) => ({
                    ...prev,
                    telefono: false,
                  }));
                }
              }}
              placeholder="Teléfono"
              className={`lr-input-base lr-input-text ${
                invalidFields.telefono ? "invalid" : ""
              }`}
              autoComplete="tel"
              name="phone"
              type="tel"
            />
            <i className="pi pi-phone lr-input-icon" />
          </span>

          <div
            className={`lr-pass-wrapper ${
              invalidFields.password ? "invalid" : ""
            }`}
          >
            <InputText
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (e.target.value.trim() !== "") {
                  setInvalidFields((prev) => ({ ...prev, password: false }));
                }
              }}
              placeholder="Contraseña"
              className={`lr-input-base lr-input-pass ${
                invalidFields.password ? "invalid" : ""
              }`}
              autoComplete="new-password"
              name="password"
            />
            <button
              type="button"
              className="lr-eye-btn"
              onClick={() => setShowPass((s) => !s)}
            >
              <i className={`pi ${showPass ? "pi-eye-slash" : "pi-eye"}`} />
            </button>
          </div>

          <div
            className={`lr-pass-wrapper ${
              invalidFields.confirmPassword ? "invalid" : ""
            }`}
          >
            <InputText
              type={showConfirmPass ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (e.target.value.trim() !== "") {
                  setInvalidFields((prev) => ({
                    ...prev,
                    confirmPassword: false,
                  }));
                }
              }}
              placeholder="Confirmar contraseña"
              className={`lr-input-base lr-input-pass ${
                invalidFields.confirmPassword ? "invalid" : ""
              }`}
              autoComplete="new-password"
              name="confirmPassword"
            />
            <button
              type="button"
              className="lr-eye-btn"
              onClick={() => setShowConfirmPass((s) => !s)}
            >
              <i
                className={`pi ${
                  showConfirmPass ? "pi-eye-slash" : "pi-eye"
                }`}
              />
            </button>
          </div>

          <Button type="submit" label="Registrarse" className="lr-button" />

          <div className="lr-terms">
            Al registrarte, aceptas nuestros{" "}
            <button
              type="button"
              className="lr-link-button"
              onClick={handleTermsClick}
            >
              Términos y Condiciones
            </button>{" "}
            y nuestro{" "}
            <button
              type="button"
              className="lr-link-button"
              onClick={handlePrivacyClick}
            >
              Aviso de Privacidad
            </button>
            .
          </div>
        </form>
      </Card>
    </>
  );
};

export default LoginRegister;