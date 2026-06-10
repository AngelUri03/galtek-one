import React, { useState, useRef } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useNavigate } from "react-router-dom";

import "../../style/components/Login/LoginRecuperarPass.css";

const LoginRecuperarPass = () => {
  const toast = useRef(null);
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [invalid, setInvalid] = useState({
    password: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);

  const validateStrength = (value) => {
    return value.length >= 8;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextInvalid = { password: false, confirm: false };
    let hasError = false;

    if (!password.trim()) {
      nextInvalid.password = true;
      toast.current?.show({
        severity: "error",
        summary: "Campo requerido",
        detail: "Debes ingresar una nueva contraseña.",
        life: 3000,
      });
      hasError = true;
    } else if (!validateStrength(password.trim())) {
      nextInvalid.password = true;
      toast.current?.show({
        severity: "warn",
        summary: "Contraseña débil",
        detail: "La contraseña debe tener al menos 8 caracteres.",
        life: 3000,
      });
      hasError = true;
    }

    if (!confirm.trim()) {
      nextInvalid.confirm = true;
      toast.current?.show({
        severity: "error",
        summary: "Campo requerido",
        detail: "Debes confirmar tu contraseña.",
        life: 3000,
      });
      hasError = true;
    } else if (password && confirm && password !== confirm) {
      nextInvalid.confirm = true;
      toast.current?.show({
        severity: "error",
        summary: "Contraseñas distintas",
        detail: "Las contraseñas no coinciden.",
        life: 3000,
      });
      hasError = true;
    }

    setInvalid(nextInvalid);
    if (hasError) return;

    setLoading(true);

    try {
      // Simula llamada a backend
      await new Promise((r) => setTimeout(r, 700));

      toast.current?.show({
        severity: "success",
        summary: "Contraseña actualizada",
        detail: "Tu contraseña se ha restablecido correctamente (demo).",
        life: 3000,
      });

      setTimeout(() => {
        // 👉 Después de cambiar la contraseña, regresar al login
        //navigate("/login");
      }, 800);
    } catch (err) {
      console.error(err);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Ocurrió un error al actualizar la contraseña.",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // Volver a la pantalla anterior (recuperar cuenta)
    navigate(-1);
  };

  return (
    <>
      <Toast ref={toast} />
      <Card className="prec-card">
        <button type="button" className="prec-back-btn" onClick={handleBack}>
          <i className="pi pi-arrow-left" />
          <span>Volver</span>
        </button>

        <div className="prec-title">RESTABLECER CONTRASEÑA</div>

        <p className="prec-text">
          Ingresa tu nueva contraseña. Por seguridad, te recomendamos que
          tenga al menos 8 caracteres y que evites reutilizar contraseñas
          de otros sitios.
        </p>

        <form className="prec-form" onSubmit={handleSubmit}>
          {/* Nueva contraseña */}
          <div
            className={`prec-pass-wrapper ${
              invalid.password ? "invalid" : ""
            }`}
          >
            <InputText
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (e.target.value.trim() !== "") {
                  setInvalid((prev) => ({ ...prev, password: false }));
                }
              }}
              placeholder="Nueva contraseña"
              className={`prec-input-base prec-input-pass ${
                invalid.password ? "invalid" : ""
              }`}
              autoComplete="new-password"
              name="newPassword"
            />
            <button
              type="button"
              className="prec-eye-btn"
              onClick={() => setShowPass((s) => !s)}
            >
              <i className={`pi ${showPass ? "pi-eye-slash" : "pi-eye"}`} />
            </button>
          </div>

          {/* Confirmar contraseña */}
          <div
            className={`prec-pass-wrapper ${
              invalid.confirm ? "invalid" : ""
            }`}
          >
            <InputText
              type={showConfirmPass ? "text" : "password"}
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                if (e.target.value.trim() !== "") {
                  setInvalid((prev) => ({ ...prev, confirm: false }));
                }
              }}
              placeholder="Confirmar contraseña"
              className={`prec-input-base prec-input-pass ${
                invalid.confirm ? "invalid" : ""
              }`}
              autoComplete="new-password"
              name="confirmPassword"
            />
            <button
              type="button"
              className="prec-eye-btn"
              onClick={() => setShowConfirmPass((s) => !s)}
            >
              <i
                className={`pi ${
                  showConfirmPass ? "pi-eye-slash" : "pi-eye"
                }`}
              />
            </button>
          </div>

          <Button
            type="submit"
            label={loading ? "Guardando..." : "Guardar contraseña"}
            className="prec-button"
            disabled={loading}
          />
        </form>
      </Card>
    </>
  );
};

export default LoginRecuperarPass;