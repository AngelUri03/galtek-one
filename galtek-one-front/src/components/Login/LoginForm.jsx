import React, { useEffect, useRef, useState } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Toast } from "primereact/toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import "../../style/components/Login/LoginForm.css";
import "primeicons/primeicons.css";
import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";
import { encryptRSAOAEPToBase64 } from "../../utils/rsa";

const api = new APIfetchApi();

const LoginForm = () => {
  const toast = useRef(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [invalidFields, setInvalidFields] = useState({
    username: false,
    password: false,
  });

  useEffect(() => {
    localStorage.removeItem("savedPass");
  }, []);

  const showToast = (severity, summary, detail, life = 3000) => {
    toast.current?.show({ severity, summary, detail, life });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const nextInvalid = {
      username: username.trim() === "",
      password: password.trim() === "",
    };
    setInvalidFields(nextInvalid);

    if (nextInvalid.username) {
      showToast("error", "Campo requerido", "Debes ingresar tu usuario");
      return;
    }

    if (nextInvalid.password) {
      showToast("error", "Campo requerido", "Debes ingresar tu contrasena");
      return;
    }

    try {
      const resKey = await api.fetchApi(
        { "Content-Type": "application/json" },
        "GET",
        undefined,
        endpoints.authPublicKey
      );

      if (!resKey) {
        showToast("error", "Error", "No se pudo contactar al servidor.");
        return;
      }

      const keyPayload = await resKey.json().catch(() => null);
      const pemPublic = keyPayload?.data;
      if (!resKey.ok || !pemPublic) {
        showToast(
          "error",
          "Error",
          keyPayload?.message || "Error obteniendo la llave publica"
        );
        return;
      }

      const encryptedPassword = await encryptRSAOAEPToBase64(
        pemPublic,
        password
      );

      const resLogin = await api.fetchApi(
        { "Content-Type": "application/json" },
        "POST",
        { usuario: username.trim(), password: encryptedPassword },
        endpoints.authLogin
      );

      if (!resLogin) {
        showToast("error", "Error", "No se pudo contactar al servidor.");
        return;
      }

      const payload = await resLogin.json().catch(() => null);

      if (!resLogin.ok || payload?.statusCode !== 200) {
        showToast(
          "error",
          "Login fallido",
          payload?.message || "Credenciales invalidas"
        );
        return;
      }

      const token = payload?.data?.token;
      if (!token) {
        showToast("error", "Error", "No se recibio token");
        return;
      }

      login({
        token,
        usuario: payload?.data?.usuario,
        nombreUsuario: payload?.data?.nombreUsuario,
        rol: payload?.data?.rol,
        avatarUrl: payload?.data?.avatarUrl,
        idEmpresa: payload?.data?.idEmpresa,
        nombreEmpresa: payload?.data?.nombreEmpresa,
        idUsuario: payload?.data?.idUsuario,
        requiereCambioPassword: Boolean(payload?.data?.requiereCambioPassword),
      });

      showToast("success", "Bienvenido", "Inicio de sesion correcto");
      navigate("/ventas", { replace: true });
    } catch (err) {
      console.error(err);
      showToast("error", "Error", "Ocurrio un error inesperado.");
    }
  };

  return (
    <>
      <Toast ref={toast} />
      <Card className="lf-card">
        <div className="lf-title">LOGIN</div>

        <form onSubmit={handleLogin} className="lf-form">
          <span
            className={`lf-input-wrapper ${
              invalidFields.username ? "invalid" : ""
            }`}
          >
            <InputText
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (e.target.value.trim() !== "") {
                  setInvalidFields((prev) => ({ ...prev, username: false }));
                }
              }}
              placeholder="Usuario"
              className={`lf-input-base lf-input-username ${
                invalidFields.username ? "invalid" : ""
              }`}
            />
            <i className="pi pi-user lf-input-icon" />
          </span>

          <div
            className={`lf-pass-wrapper ${
              invalidFields.password ? "invalid" : ""
            }`}
          >
            <InputText
              type={showPass ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (e.target.value.trim() !== "") {
                  setInvalidFields((prev) => ({ ...prev, password: false }));
                }
              }}
              placeholder="Contrasena"
              className={`lf-input-base lf-input-pass-plain ${
                invalidFields.password ? "invalid" : ""
              }`}
            />
            <button
              type="button"
              className="lf-eye-btn"
              onClick={() => setShowPass((s) => !s)}
            >
              <i className={`pi ${showPass ? "pi-eye-slash" : "pi-eye"}`} />
            </button>
          </div>

          <div className="lf-options-row">
            <span />
            <Button
              link
              className="lf-link"
              type="button"
              onClick={() => navigate("/login/recuperar-usuario")}
            >
              Olvidaste tu contrasena?
            </Button>
          </div>

          <Button label="Iniciar Sesion" type="submit" className="lf-button" />

          <div className="lf-row lf-row-register">
            <div className="lf-text">No tienes cuenta?</div>
            <Button
              link
              className="lf-link"
              type="button"
              onClick={() => navigate("/login/registro")}
            >
              Registrarse
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
};

export default LoginForm;
