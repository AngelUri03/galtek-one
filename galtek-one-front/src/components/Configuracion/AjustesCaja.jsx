import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { fetchCashPolicy, updateCashPolicy } from "../../cash/cashSessionService";
import "../../style/components/Configuracion/AjustesCaja.css";

const DEFAULT_POLICY = {
  handoffPolicy: "CONTINUITY_FIRST",
  requireIncomingCountOnUserChange: true,
  requireOutgoingCount: true,
  allowContinueWithPendingIncident: true,
  blindCountEnabled: true,
  expectedBalanceVisibilityMode: "PERMISSION_REQUIRED",
};

const handoffOptions = [
  {
    value: "CONTINUITY_FIRST",
    label: "Continuidad primero",
    detail:
      "Permite terminar el corte o cambiar responsable aunque exista diferencia. La incidencia queda abierta para revision y la caja puede seguir operando.",
  },
  {
    value: "STRICT_SUPERVISED",
    label: "Estricto supervisado",
    detail:
      "Detiene el cierre o relevo cuando hay diferencia hasta que un usuario autorizado revise el conteo y defina la resolucion.",
  },
];

const visibilityOptions = [
  {
    value: "PERMISSION_REQUIRED",
    label: "Permiso requerido",
    detail:
      "El cajero no ve el esperado durante el conteo. Solo perfiles con permiso pueden consultarlo o revelarlo para auditoria.",
  },
  {
    value: "ALWAYS_VISIBLE",
    label: "Visible para el responsable",
    detail:
      "El responsable del turno puede ver el efectivo esperado antes de capturar el conteo. Es mas rapido, pero menos estricto.",
  },
  {
    value: "BLIND_UNTIL_REVEAL",
    label: "Ciego hasta revelar",
    detail:
      "Oculta el esperado hasta que se confirma el conteo. Despues se revela la diferencia para resolverla con evidencia.",
  },
];

function normalizePolicy(payload) {
  return {
    ...DEFAULT_POLICY,
    ...(payload || {}),
    requireIncomingCountOnUserChange: payload?.requireIncomingCountOnUserChange !== false,
    requireOutgoingCount: payload?.requireOutgoingCount !== false,
    allowContinueWithPendingIncident: payload?.allowContinueWithPendingIncident !== false,
    blindCountEnabled: payload?.blindCountEnabled !== false,
  };
}

const AjustesCaja = forwardRef(function AjustesCaja({ helpStep = "" }, ref) {
  const [policy, setPolicy] = useState(DEFAULT_POLICY);
  const [savedPolicy, setSavedPolicy] = useState(DEFAULT_POLICY);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  const dirty = useMemo(
    () => JSON.stringify(policy) !== JSON.stringify(savedPolicy),
    [policy, savedPolicy]
  );

  const loadPolicy = useCallback(async () => {
    setLoading(true);
    setError("");
    setSavedMessage("");
    try {
      const payload = normalizePolicy(await fetchCashPolicy());
      setPolicy(payload);
      setSavedPolicy(payload);
    } catch (err) {
      setError(err?.message || "No se pudo cargar Caja y turnos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useImperativeHandle(ref, () => ({ refresh: loadPolicy }), [loadPolicy]);

  useEffect(() => {
    loadPolicy();
  }, [loadPolicy]);

  const patchPolicy = (patch) => {
    setError("");
    setSavedMessage("");
    setPolicy((prev) => ({ ...prev, ...patch }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving || loading || !dirty) return;

    setSaving(true);
    setError("");
    setSavedMessage("");
    try {
      const payload = normalizePolicy(await updateCashPolicy(policy));
      setPolicy(payload);
      setSavedPolicy(payload);
      setSavedMessage("Politica de caja guardada.");
    } catch (err) {
      setError(err?.message || "No se pudo guardar Caja y turnos.");
    } finally {
      setSaving(false);
    }
  };

  const helpClass = (key) => (helpStep === key ? "is-help-focus" : "");

  return (
    <form className="acj-wrap" onSubmit={handleSubmit}>
      <section className={`acj-summary ${helpClass("summary")}`} aria-label="Resumen de politica de caja">
        <div>
          <i className="pi pi-sync" aria-hidden="true" />
          <span>Politica</span>
          <strong>{policy.handoffPolicy === "STRICT_SUPERVISED" ? "Estricto" : "Continuo"}</strong>
        </div>
        <div>
          <i className="pi pi-eye-slash" aria-hidden="true" />
          <span>Conteo</span>
          <strong>{policy.blindCountEnabled ? "Ciego" : "Visible"}</strong>
        </div>
        <div>
          <i className="pi pi-exclamation-triangle" aria-hidden="true" />
          <span>Incidencias</span>
          <strong>{policy.allowContinueWithPendingIncident ? "Permite seguir" : "Bloquea"}</strong>
        </div>
      </section>

      <section className={`acj-panel ${helpClass("operation")}`}>
        <div className="acj-panel-head">
          <div>
            <span>Operacion</span>
            <h3>Caja continua</h3>
          </div>
        </div>

        <div className="acj-grid">
          <label className={`acj-field ${helpClass("handoff")}`} htmlFor="cash-policy-mode">
            <span>Modo de cierre y relevo</span>
            <Dropdown
              inputId="cash-policy-mode"
              className="acj-dropdown"
              value={policy.handoffPolicy}
              options={handoffOptions}
              optionLabel="label"
              optionValue="value"
              panelClassName="acj-dropdown-panel"
              onChange={(event) => patchPolicy({ handoffPolicy: event.value })}
              disabled={loading || saving}
            />
          </label>

          <label className={`acj-field ${helpClass("visibility")}`} htmlFor="cash-policy-visibility">
            <span>Visibilidad del esperado</span>
            <Dropdown
              inputId="cash-policy-visibility"
              className="acj-dropdown"
              value={policy.expectedBalanceVisibilityMode}
              options={visibilityOptions}
              optionLabel="label"
              optionValue="value"
              panelClassName="acj-dropdown-panel"
              onChange={(event) => patchPolicy({ expectedBalanceVisibilityMode: event.value })}
              disabled={loading || saving}
            />
          </label>
        </div>

        <div className={`acj-toggle-grid ${helpClass("toggles")}`}>
          <ToggleRow
            id="cash-policy-incoming"
            label="Conteo entrante al cambiar cajero"
            checked={policy.requireIncomingCountOnUserChange}
            disabled={loading || saving}
            onChange={(checked) => patchPolicy({ requireIncomingCountOnUserChange: checked })}
          />
          <ToggleRow
            id="cash-policy-outgoing"
            label="Conteo saliente obligatorio"
            checked={policy.requireOutgoingCount}
            disabled={loading || saving}
            onChange={(checked) => patchPolicy({ requireOutgoingCount: checked })}
          />
          <ToggleRow
            id="cash-policy-continue"
            label="Continuar con incidencia pendiente"
            checked={policy.allowContinueWithPendingIncident}
            disabled={loading || saving}
            onChange={(checked) => patchPolicy({ allowContinueWithPendingIncident: checked })}
          />
          <ToggleRow
            id="cash-policy-blind"
            label="Conteo ciego antes de revelar"
            checked={policy.blindCountEnabled}
            disabled={loading || saving}
            onChange={(checked) => patchPolicy({ blindCountEnabled: checked })}
          />
        </div>

        {error ? (
          <div className="acj-message is-error" role="alert">
            <i className="pi pi-exclamation-triangle" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}

        {savedMessage ? (
          <div className="acj-message is-success" role="status">
            <i className="pi pi-check-circle" aria-hidden="true" />
            <span>{savedMessage}</span>
          </div>
        ) : null}

        <footer className={`acj-actions ${helpClass("save")}`}>
          <Button
            type="button"
            className="acj-secondary-button"
            label="Restaurar"
            icon="pi pi-undo"
            onClick={() => {
              setPolicy(savedPolicy);
              setError("");
              setSavedMessage("");
            }}
            disabled={loading || saving || !dirty}
          />
          <Button
            type="submit"
            className="acj-primary-button"
            label={saving ? "Guardando..." : "Guardar politica"}
            icon={saving ? "pi pi-spin pi-spinner" : "pi pi-save"}
            disabled={loading || saving || !dirty}
          />
        </footer>
      </section>
    </form>
  );
});

function ToggleRow({ id, label, checked, disabled, onChange }) {
  return (
    <label className="acj-toggle" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
      />
      <span className="acj-toggle__control" aria-hidden="true" />
      <strong>{label}</strong>
    </label>
  );
}

export default AjustesCaja;
