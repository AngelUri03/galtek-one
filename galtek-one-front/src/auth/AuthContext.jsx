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
import { endpoints } from "../API/api";

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

  const sessionRef = useRef(session);
  const timerRef = useRef(null);
  const lastWriteRef = useRef(0);
  const loggingOutRef = useRef(false);

  const isAuthenticated = Boolean(session?.token);

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
      markActivity: () => markActivity({ force: true }),
    };
  }, [session, isAuthenticated, login, logout, markActivity]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      <Dialog
        visible={showWarning && isAuthenticated}
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
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
