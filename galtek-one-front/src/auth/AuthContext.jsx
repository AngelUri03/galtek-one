import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { endpoints } from "../API/api";
import { encryptRSAOAEPToBase64 } from "../utils/rsa";
import "../style/components/common/AuthPasswordReset.css";

const AuthContext = createContext(null);

const KEY = "auth_session";
const ACTIVITY_EVENT = "galtekone:activity";
const UNAUTHORIZED_EVENT = "galtekone:unauthorized";

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;
const WARNING_BEFORE_MS = 5 * 60 * 1000;
const WARNING_AT_MS = INACTIVITY_LIMIT_MS - WARNING_BEFORE_MS;
const CHECK_EVERY_MS = 1000;
const ACTIVITY_WRITE_THROTTLE_MS = 3000;

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearLegacySession() {
  localStorage.removeItem(KEY);
  localStorage.removeItem("token");
  localStorage.removeItem("savedPass");
}

function readSession() {
  clearLegacySession();
  const parsedSession = safeParse(sessionStorage.getItem(KEY));
  return parsedSession?.token ? parsedSession : null;
}

function writeSession(sessionObj) {
  clearLegacySession();
  sessionStorage.setItem(KEY, JSON.stringify(sessionObj));
  if (sessionObj?.token) {
    sessionStorage.setItem("token", sessionObj.token);
  }
}

function clearSession() {
  clearLegacySession();
  sessionStorage.removeItem(KEY);
  sessionStorage.removeItem("token");
}

function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession());
  const [showWarning, setShowWarning] = useState(false);
  const [remainingMs, setRemainingMs] = useState(WARNING_BEFORE_MS);
  const [requiredPassword, setRequiredPassword] = useState("");
  const [requiredConfirm, setRequiredConfirm] = useState("");
  const [requiredError, setRequiredError] = useState("");
  const [requiredSaving, setRequiredSaving] = useState(false);

  const sessionRef = useRef(session);
  const timerRef = useRef(null);
  const lastWriteRef = useRef(0);
  const loggingOutRef = useRef(false);

  const isAuthenticated = Boolean(session?.token);
  const mustChangePassword = Boolean(session?.requiereCambioPassword);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const markActivity = useCallback((options = {}) => {
    const current = sessionRef.current;
    if (!current?.token || loggingOutRef.current) return;

    const now = Date.now();
    if (!options.force && now - lastWriteRef.current < ACTIVITY_WRITE_THROTTLE_MS) {
      return;
    }

    lastWriteRef.current = now;
    const updated = { ...current, lastActivityAt: now };
    writeSession(updated);
    sessionRef.current = updated;
    setSession(updated);
    setShowWarning(false);
    setRemainingMs(WARNING_BEFORE_MS);
  }, []);

  const login = useCallback((payloadData) => {
    const now = Date.now();
    const fullSession = {
      ...payloadData,
      lastActivityAt: now,
    };

    loggingOutRef.current = false;
    writeSession(fullSession);
    sessionRef.current = fullSession;
    setSession(fullSession);
    setShowWarning(false);
    setRemainingMs(WARNING_BEFORE_MS);
  }, []);

  const updateSession = useCallback((patchOrUpdater) => {
    const current = sessionRef.current;
    if (!current?.token) return null;

    const patch =
      typeof patchOrUpdater === "function" ? patchOrUpdater(current) : patchOrUpdater;
    if (!patch || typeof patch !== "object") return current;

    const updated = { ...current, ...patch };
    writeSession(updated);
    sessionRef.current = updated;
    setSession(updated);
    return updated;
  }, []);

  useEffect(() => {
    if (mustChangePassword) return;
    setRequiredPassword("");
    setRequiredConfirm("");
    setRequiredError("");
    setRequiredSaving(false);
  }, [mustChangePassword]);

  const submitRequiredPassword = useCallback(async () => {
    const current = sessionRef.current;
    const nextPassword = requiredPassword.trim();
    const nextConfirm = requiredConfirm.trim();

    if (!current?.token || requiredSaving) return;
    if (nextPassword.length < 8) {
      setRequiredError("La nueva password debe tener al menos 8 caracteres.");
      return;
    }
    if (nextPassword !== nextConfirm) {
      setRequiredError("La confirmacion no coincide.");
      return;
    }

    setRequiredSaving(true);
    setRequiredError("");

    try {
      const keyResponse = await fetch(endpoints.authPublicKey, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const keyPayload = await keyResponse.json().catch(() => null);
      const pemPublic = keyPayload?.data;

      if (!keyResponse.ok || !pemPublic) {
        throw new Error(keyPayload?.message || "No se pudo obtener la llave publica.");
      }

      const encryptedPassword = await encryptRSAOAEPToBase64(pemPublic, nextPassword);
      const response = await fetch(`${endpoints.usuarios.replace(/\/+$/, "")}/me/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${current.token}`,
          user: current.usuario,
          idEmpresa: String(current.idEmpresa),
        },
        body: JSON.stringify({ password: encryptedPassword }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || "No se pudo cambiar la password.");
      }

      const updated = { ...current, requiereCambioPassword: false };
      writeSession(updated);
      sessionRef.current = updated;
      setSession(updated);
      setRequiredPassword("");
      setRequiredConfirm("");
    } catch (error) {
      setRequiredError(error?.message || "No se pudo cambiar la password.");
    } finally {
      setRequiredSaving(false);
    }
  }, [requiredConfirm, requiredPassword, requiredSaving]);

  const logout = useCallback(async ({ silent = false } = {}) => {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;

    const current = sessionRef.current;

    try {
      if (current?.token) {
        await fetch(endpoints.authLogout, {
          method: "POST",
          keepalive: true,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${current.token}`,
          },
        });
      }
    } catch (err) {
      if (!silent) console.error("Error en logout:", err);
    } finally {
      clearSession();
      sessionRef.current = null;
      setSession(null);
      setShowWarning(false);
      setRemainingMs(WARNING_BEFORE_MS);
      loggingOutRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
      ACTIVITY_EVENT,
    ];

    const onActivity = () => markActivity();
    events.forEach((ev) =>
      window.addEventListener(ev, onActivity, { passive: true })
    );

    return () =>
      events.forEach((ev) => window.removeEventListener(ev, onActivity));
  }, [isAuthenticated, markActivity]);

  useEffect(() => {
    const onUnauthorized = () => logout({ silent: true });
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [logout]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const check = () => {
      const current = readSession();
      if (!current?.token) {
        logout({ silent: true });
        return;
      }

      const last = Number(current.lastActivityAt || 0);
      const idle = Date.now() - last;

      if (idle >= INACTIVITY_LIMIT_MS) {
        logout({ silent: true });
        return;
      }

      if (idle >= WARNING_AT_MS) {
        setShowWarning(true);
        setRemainingMs(INACTIVITY_LIMIT_MS - idle);
      } else {
        setShowWarning(false);
        setRemainingMs(WARNING_BEFORE_MS);
      }
    };

    timerRef.current = window.setInterval(check, CHECK_EVERY_MS);
    check();

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [isAuthenticated, logout]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== KEY) return;
      const next = readSession();
      sessionRef.current = next;
      setSession(next);
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo(() => {
    return {
      token: session?.token || null,
      user: session ? { ...session } : null,
      isAuthenticated,
      remember: false,
      login,
      logout,
      updateSession,
      markActivity: () => markActivity({ force: true }),
    };
  }, [session, isAuthenticated, login, logout, markActivity, updateSession]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      <Dialog
        visible={showWarning && isAuthenticated && !mustChangePassword}
        header="Sesion por inactividad"
        modal
        closable={false}
        draggable={false}
        style={{ width: "min(420px, 92vw)" }}
      >
        <div style={{ display: "grid", gap: "1rem" }}>
          <p style={{ margin: 0 }}>
            La sesion se cerrara automaticamente por inactividad.
          </p>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              letterSpacing: 0,
              textAlign: "center",
            }}
          >
            {formatCountdown(remainingMs)}
          </div>
          <Button
            label="Seguir trabajando"
            icon="pi pi-check"
            onClick={() => markActivity({ force: true })}
            autoFocus
          />
        </div>
      </Dialog>

      <Dialog
        visible={isAuthenticated && mustChangePassword}
        header="Cambio de password requerido"
        modal
        closable={false}
        draggable={false}
        className="auth-password-dialog"
        style={{ width: "min(440px, 92vw)" }}
      >
        <div className="auth-password-reset">
          <div className="auth-password-reset__notice">
            <i className="pi pi-key" />
            <div>
              <strong>Password temporal detectada</strong>
              <span>Captura una password personal para continuar operando Galtek One.</span>
            </div>
          </div>

          <label>
            <span>Nueva password</span>
            <InputText
              type="password"
              value={requiredPassword}
              onChange={(event) => {
                setRequiredPassword(event.target.value);
                setRequiredError("");
              }}
              autoComplete="new-password"
              autoFocus
              disabled={requiredSaving}
            />
          </label>

          <label>
            <span>Confirmar password</span>
            <InputText
              type="password"
              value={requiredConfirm}
              onChange={(event) => {
                setRequiredConfirm(event.target.value);
                setRequiredError("");
              }}
              autoComplete="new-password"
              disabled={requiredSaving}
              onKeyDown={(event) => {
                if (event.key === "Enter") submitRequiredPassword();
              }}
            />
          </label>

          {requiredError ? <div className="auth-password-reset__error">{requiredError}</div> : null}

          <div className="auth-password-reset__footer">
            <Button
              label={requiredSaving ? "Guardando..." : "Cambiar password"}
              icon={requiredSaving ? "pi pi-spin pi-spinner" : "pi pi-check"}
              onClick={submitRequiredPassword}
              disabled={requiredSaving}
            />
          </div>
        </div>
      </Dialog>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
