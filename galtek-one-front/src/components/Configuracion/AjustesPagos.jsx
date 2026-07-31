import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { Dropdown } from "primereact/dropdown";

import {
  FIXED_PAYMENT_METHODS,
  fetchPaymentConfig,
  normalizePaymentConfig,
  normalizePaymentType,
  normalizeProvider,
  normalizeTerminal,
  providerLabel,
  updatePaymentConfig,
} from "../../payments/paymentConfigService";

import "../../style/components/Configuracion/AjustesPagos.css";

const METHOD_META = {
  TERMINAL: {
    icon: "pi pi-tablet",
    title: "Terminal",
    detail: "Hasta 3 terminales para cobro en POS.",
  },
  EFECTIVO: {
    icon: "pi pi-money-bill",
    title: "Efectivo",
    detail: "Redondeo predeterminado del cobro.",
  },
  TARJETA: {
    icon: "pi pi-credit-card",
    title: "Tarjeta",
    detail: "Datos que el cajero comparte al cliente.",
  },
  VALES: {
    icon: "pi pi-ticket",
    title: "Vales",
    detail: "Folio, emisor y autorizacion del vale.",
  },
};

const PROVIDER_OPTIONS = [
  { value: "MERCADO_PAGO", label: "Mercado Pago" },
  { value: "CLIP", label: "Clip" },
  { value: "CONEKTA", label: "Conekta" },
  { value: "BANCO", label: "Banco" },
];

const selectedMethodKey = (value) => (METHOD_META[value] ? value : "TERMINAL");

const AjustesPagos = forwardRef(function AjustesPagos(_, ref) {
  const [config, setConfig] = useState(normalizePaymentConfig());
  const [savedConfig, setSavedConfig] = useState(normalizePaymentConfig());
  const [selected, setSelected] = useState("TERMINAL");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError("");
    setSavedMessage("");
    try {
      const payload = await fetchPaymentConfig();
      setConfig(payload);
      setSavedConfig(payload);
    } catch (err) {
      setError(err?.message || "No se pudo cargar Pagos / Terminal.");
    } finally {
      setLoading(false);
    }
  }, []);

  useImperativeHandle(ref, () => ({ refresh: loadConfig }), [loadConfig]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const methods = useMemo(
    () => FIXED_PAYMENT_METHODS.map((fixed) => {
      const existing = (config.metodosPago || []).find((method) => method.codigo === fixed.codigo);
      return {
        ...fixed,
        ...(existing || {}),
        nombre: fixed.nombre,
        nombreMetodoPago: fixed.nombre,
        codigo: fixed.codigo,
        tipo: fixed.tipo,
        orden: fixed.orden,
        visiblePos: true,
      };
    }),
    [config.metodosPago]
  );

  const activeCount = methods.filter((method) => method.estatus !== false).length;
  const dirty = useMemo(
    () => JSON.stringify(config) !== JSON.stringify(savedConfig),
    [config, savedConfig]
  );

  const patchConfig = (patch) => {
    setError("");
    setSavedMessage("");
    setConfig((prev) => normalizePaymentConfig({ ...prev, ...patch }));
  };

  const patchMethod = (code, patch) => {
    setError("");
    setSavedMessage("");
    setConfig((prev) => ({
      ...prev,
      metodosPago: methods.map((method) =>
        method.codigo === code
          ? {
              ...method,
              ...patch,
              visiblePos: true,
              requiereReferencia: defaultRequiresReference(method.tipo),
              requiereVerificacion: defaultRequiresVerification(method.tipo),
            }
          : method
      ),
      ...(code === "TERMINAL" && patch.estatus !== undefined
        ? { terminalEnabled: patch.estatus !== false }
        : null),
    }));
  };

  const patchTerminal = (index, patch) => {
    setError("");
    setSavedMessage("");
    setConfig((prev) => {
      const terminales = [...(prev.terminales || [])];
      terminales[index] = normalizeTerminal({ ...(terminales[index] || {}), ...patch }, index);
      const firstEnabled = terminales.find((terminal) => terminal.enabled !== false) || terminales[0];
      return normalizePaymentConfig({
        ...prev,
        terminales,
        terminalProvider: firstEnabled?.provider,
        terminalName: firstEnabled?.nombre,
        terminalIdentifier: firstEnabled?.identifier,
        terminalSerial: firstEnabled?.serial,
        terminalStoreId: firstEnabled?.storeId,
        terminalAccount: firstEnabled?.account,
        terminalCommissionEnabled: firstEnabled?.commissionEnabled,
        terminalCommissionPercent: firstEnabled?.commissionPercent,
      });
    });
  };

  const addTerminal = () => {
    if ((config.terminales || []).length >= 3) return;
    const index = (config.terminales || []).length;
    patchConfig({
      terminales: [
        ...(config.terminales || []),
        normalizeTerminal({
          key: `terminal_${index + 1}`,
          nombre: `Terminal ${index + 1}`,
          provider: "MERCADO_PAGO",
          enabled: true,
          commissionEnabled: true,
          commissionPercent: 0,
        }, index),
      ],
    });
  };

  const removeTerminal = (index) => {
    if ((config.terminales || []).length <= 1) return;
    patchConfig({
      terminales: (config.terminales || []).filter((_, currentIndex) => currentIndex !== index),
    });
  };

  const buildPayload = () => ({
    ...config,
    terminalPriority: 1,
    terminales: (config.terminales || []).slice(0, 3).map((terminal, index) => normalizeTerminal(terminal, index)),
    terminalCommissionPercent: Number(config.terminalCommissionPercent || 0),
    metodosPago: methods.map((method) => ({
      idMetodoPago: method.idMetodoPago ?? method.id ?? null,
      nombre: method.nombre,
      nombreMetodoPago: method.nombre,
      codigo: method.codigo,
      tipo: normalizePaymentType(method.tipo),
      orden: method.orden,
      estatus: method.estatus !== false,
      visiblePos: true,
      requiereReferencia: defaultRequiresReference(method.tipo),
      requiereVerificacion: defaultRequiresVerification(method.tipo),
    })),
  });

  const saveConfig = async (event) => {
    event.preventDefault();
    if (saving || loading || !dirty) return;

    setSaving(true);
    setError("");
    setSavedMessage("");
    try {
      const payload = await updatePaymentConfig(buildPayload());
      setConfig(payload);
      setSavedConfig(payload);
      setSavedMessage("Configuracion de pagos guardada.");
    } catch (err) {
      setError(err?.message || "No se pudo guardar Pagos / Terminal.");
    } finally {
      setSaving(false);
    }
  };

  const restore = () => {
    setConfig(savedConfig);
    setError("");
    setSavedMessage("");
  };

  return (
    <form className="apg-wrap" onSubmit={saveConfig}>
      <section className="apg-headline" aria-label="Resumen de pagos">
        <div>
          <span>Pagos / Terminal</span>
          <h3>{activeCount} metodos activos</h3>
        </div>
        <strong>{(config.terminales || []).filter((terminal) => terminal.enabled !== false).length}/3 terminales</strong>
      </section>

      <section className="apg-board">
        <aside className="apg-left">
          {methods.map((method) => {
            const meta = METHOD_META[method.codigo];
            const active = method.estatus !== false;
            return (
              <button
                key={method.codigo}
                type="button"
                className={`apg-method-card ${selected === method.codigo ? "is-selected" : ""} ${active ? "is-active" : "is-inactive"}`}
                onClick={() => setSelected(method.codigo)}
                disabled={loading || saving}
              >
                <span className="apg-method-icon">
                  <i className={meta.icon} />
                </span>
                <span className="apg-method-copy">
                  <strong>{meta.title}</strong>
                  <small>{meta.detail}</small>
                </span>
                <span className="apg-method-status">{active ? "Activo" : "Inactivo"}</span>
              </button>
            );
          })}
        </aside>

        <main className="apg-detail">
          {selectedMethodKey(selected) === "TERMINAL" ? (
            <TerminalPanel
              config={config}
              methods={methods}
              loading={loading}
              saving={saving}
              onPatchMethod={patchMethod}
              onPatchConfig={patchConfig}
              onPatchTerminal={patchTerminal}
              onAddTerminal={addTerminal}
              onRemoveTerminal={removeTerminal}
            />
          ) : null}

          {selectedMethodKey(selected) === "EFECTIVO" ? (
            <CashPanel
              config={config}
              methods={methods}
              loading={loading}
              saving={saving}
              onPatchMethod={patchMethod}
              onPatchConfig={patchConfig}
            />
          ) : null}

          {selectedMethodKey(selected) === "TARJETA" ? (
            <CardPanel
              config={config}
              methods={methods}
              loading={loading}
              saving={saving}
              onPatchMethod={patchMethod}
              onPatchConfig={patchConfig}
            />
          ) : null}

          {selectedMethodKey(selected) === "VALES" ? (
            <VoucherPanel
              config={config}
              methods={methods}
              loading={loading}
              saving={saving}
              onPatchMethod={patchMethod}
              onPatchConfig={patchConfig}
            />
          ) : null}
        </main>
      </section>

      {error ? (
        <div className="apg-message is-error" role="alert">
          <i className="pi pi-exclamation-triangle" />
          <span>{error}</span>
        </div>
      ) : null}

      {savedMessage ? (
        <div className="apg-message is-success" role="status">
          <i className="pi pi-check-circle" />
          <span>{savedMessage}</span>
        </div>
      ) : null}

      <footer className="apg-actions">
        <button type="button" className="apg-secondary-button" onClick={restore} disabled={loading || saving || !dirty}>
          <i className="pi pi-undo" />
          <span>Restaurar</span>
        </button>
        <button type="submit" className="apg-primary-button" disabled={loading || saving || !dirty}>
          <i className={saving ? "pi pi-spin pi-spinner" : "pi pi-save"} />
          <span>{saving ? "Guardando..." : "Guardar pagos"}</span>
        </button>
      </footer>
    </form>
  );
});

function TerminalPanel({
  config,
  methods,
  loading,
  saving,
  onPatchMethod,
  onPatchConfig,
  onPatchTerminal,
  onAddTerminal,
  onRemoveTerminal,
}) {
  const terminalMethod = methods.find((method) => method.codigo === "TERMINAL");
  const disabled = loading || saving;
  const terminales = config.terminales || [];
  const active = terminalMethod?.estatus !== false && config.terminalEnabled !== false;

  return (
    <section className="apg-panel">
      <PanelHead icon="pi pi-tablet" kicker="Terminal" title="Terminales asociadas" />
      <ToggleRow
        id="apg-terminal-active"
        label="Mostrar Terminal en POS"
        checked={active}
        disabled={disabled}
        onChange={(checked) => {
          onPatchMethod("TERMINAL", { estatus: checked });
          onPatchConfig({ terminalEnabled: checked });
        }}
      />

      <div className="apg-terminal-grid">
        {terminales.map((terminal, index) => (
          <article key={terminal.key || index} className={`apg-terminal-card ${terminal.enabled !== false ? "is-active" : "is-inactive"}`}>
            <div className="apg-terminal-top">
              <strong>Terminal {index + 1}</strong>
              <ToggleSwitch
                id={`apg-terminal-${index}`}
                checked={terminal.enabled !== false}
                disabled={disabled}
                onChange={(checked) => onPatchTerminal(index, { enabled: checked })}
              />
            </div>

            <div className="apg-form-grid">
              <label className="apg-field" htmlFor={`terminal-provider-${index}`}>
                <span>Proveedor</span>
                <Dropdown
                  inputId={`terminal-provider-${index}`}
                  className="apg-dropdown"
                  value={normalizeProvider(terminal.provider)}
                  options={PROVIDER_OPTIONS}
                  optionLabel="label"
                  optionValue="value"
                  panelClassName="apg-dropdown-panel"
                  disabled={disabled}
                  onChange={(event) => onPatchTerminal(index, {
                    provider: event.value,
                    nombre: terminal.nombre || providerLabel(event.value),
                  })}
                />
              </label>

              <label className="apg-field">
                <span>Nombre para caja</span>
                <input
                  value={terminal.nombre || ""}
                  disabled={disabled}
                  onChange={(event) => onPatchTerminal(index, { nombre: event.target.value })}
                  placeholder="Mercado Pago mostrador"
                />
              </label>

              <label className="apg-field">
                <span>ID terminal</span>
                <input
                  value={terminal.identifier || ""}
                  disabled={disabled}
                  onChange={(event) => onPatchTerminal(index, { identifier: event.target.value })}
                  placeholder="MP-001"
                />
              </label>

              <label className="apg-field">
                <span>Serie</span>
                <input
                  value={terminal.serial || ""}
                  disabled={disabled}
                  onChange={(event) => onPatchTerminal(index, { serial: event.target.value })}
                  placeholder="Numero de serie"
                />
              </label>

              <label className="apg-field">
                <span>Cuenta asociada</span>
                <input
                  value={terminal.account || ""}
                  disabled={disabled}
                  onChange={(event) => onPatchTerminal(index, { account: event.target.value })}
                  placeholder="correo@negocio.com"
                />
              </label>

              <label className="apg-field">
                <span>Comision %</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={terminal.commissionPercent ?? 0}
                  disabled={disabled || terminal.commissionEnabled === false}
                  onChange={(event) => onPatchTerminal(index, { commissionPercent: event.target.value })}
                />
              </label>
            </div>

            <div className="apg-terminal-bottom">
              <ToggleRow
                id={`apg-terminal-commission-${index}`}
                label="Cobrar comision"
                checked={terminal.commissionEnabled !== false}
                disabled={disabled}
                onChange={(checked) => onPatchTerminal(index, { commissionEnabled: checked })}
              />
              <button
                type="button"
                className="apg-danger-button"
                onClick={() => onRemoveTerminal(index)}
                disabled={disabled || terminales.length <= 1}
              >
                <i className="pi pi-trash" />
                <span>Quitar</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="apg-panel-footer">
        <ToggleRow
          id="apg-terminal-reference"
          label="Pedir autorizacion o voucher"
          checked={config.terminalRequireReference !== false}
          disabled={disabled}
          onChange={(checked) => onPatchConfig({ terminalRequireReference: checked })}
        />
        <button
          type="button"
          className="apg-soft-button"
          onClick={onAddTerminal}
          disabled={disabled || terminales.length >= 3}
        >
          <i className="pi pi-plus" />
          <span>Agregar terminal</span>
        </button>
      </div>
    </section>
  );
}

function CashPanel({ config, methods, loading, saving, onPatchMethod, onPatchConfig }) {
  const method = methods.find((item) => item.codigo === "EFECTIVO");
  const disabled = loading || saving;

  return (
    <section className="apg-panel">
      <PanelHead icon="pi pi-money-bill" kicker="Efectivo" title="Redondeo de cobro" />
      <div className="apg-two-col">
        <ToggleRow
          id="apg-cash-active"
          label="Mostrar Efectivo en POS"
          checked={method?.estatus !== false}
          disabled={disabled}
          onChange={(checked) => onPatchMethod("EFECTIVO", { estatus: checked })}
        />
        <ToggleRow
          id="apg-cash-rounding"
          label="Redondeo activo por defecto"
          checked={config.cashRoundingDefaultEnabled !== false}
          disabled={disabled}
          onChange={(checked) => onPatchConfig({ cashRoundingDefaultEnabled: checked })}
        />
      </div>

      <article className="apg-info-band">
        <i className="pi pi-info-circle" />
        <span>
          <strong>El redondeo se aplica al siguiente multiplo de $0.50.</strong>
          <small>El cajero todavia puede apagarlo en la pantalla de cobro si la venta requiere importe exacto.</small>
        </span>
      </article>
    </section>
  );
}

function CardPanel({ config, methods, loading, saving, onPatchMethod, onPatchConfig }) {
  const method = methods.find((item) => item.codigo === "TARJETA");
  const disabled = loading || saving;

  return (
    <section className="apg-panel">
      <PanelHead icon="pi pi-credit-card" kicker="Tarjeta" title="Datos para cliente" />
      <ToggleRow
        id="apg-card-active"
        label="Mostrar Tarjeta en POS"
        checked={method?.estatus !== false}
        disabled={disabled}
        onChange={(checked) => onPatchMethod("TARJETA", { estatus: checked })}
      />

      <div className="apg-form-grid is-wide">
        <label className="apg-field">
          <span>Banco</span>
          <input
            value={config.cardBankName || ""}
            disabled={disabled}
            onChange={(event) => onPatchConfig({ cardBankName: event.target.value })}
            placeholder="Banco receptor"
          />
        </label>
        <label className="apg-field">
          <span>Titular</span>
          <input
            value={config.cardHolderName || ""}
            disabled={disabled}
            onChange={(event) => onPatchConfig({ cardHolderName: event.target.value })}
            placeholder="Razon social o titular"
          />
        </label>
        <label className="apg-field">
          <span>Numero de tarjeta</span>
          <input
            value={config.cardNumber || ""}
            disabled={disabled}
            onChange={(event) => onPatchConfig({ cardNumber: event.target.value })}
            placeholder="0000 0000 0000 0000"
          />
        </label>
        <label className="apg-field">
          <span>Cuenta / CLABE</span>
          <input
            value={config.cardAccount || ""}
            disabled={disabled}
            onChange={(event) => onPatchConfig({ cardAccount: event.target.value })}
            placeholder="Cuenta opcional"
          />
        </label>
        <label className="apg-field is-full">
          <span>Indicaciones al cajero</span>
          <input
            value={config.cardInstructions || ""}
            disabled={disabled}
            onChange={(event) => onPatchConfig({ cardInstructions: event.target.value })}
            placeholder="Ej. compartir solo los ultimos 4 digitos si el cliente lo pide"
          />
        </label>
      </div>
    </section>
  );
}

function VoucherPanel({ config, methods, loading, saving, onPatchMethod, onPatchConfig }) {
  const method = methods.find((item) => item.codigo === "VALES");
  const disabled = loading || saving;

  return (
    <section className="apg-panel">
      <PanelHead icon="pi pi-ticket" kicker="Vales" title="Validacion de vales" />
      <ToggleRow
        id="apg-voucher-active"
        label="Mostrar Vales en POS"
        checked={method?.estatus !== false}
        disabled={disabled}
        onChange={(checked) => onPatchMethod("VALES", { estatus: checked })}
      />

      <div className="apg-form-grid is-wide">
        <label className="apg-field">
          <span>Emisor aceptado</span>
          <input
            value={config.voucherIssuer || ""}
            disabled={disabled}
            onChange={(event) => onPatchConfig({ voucherIssuer: event.target.value })}
            placeholder="Ej. Edenred, Pluxee, vales internos"
          />
        </label>
        <label className="apg-field is-full">
          <span>Indicaciones al cajero</span>
          <input
            value={config.voucherInstructions || ""}
            disabled={disabled}
            onChange={(event) => onPatchConfig({ voucherInstructions: event.target.value })}
            placeholder="Validar saldo, capturar folio y conservar comprobante"
          />
        </label>
      </div>

      <div className="apg-two-col">
        <ToggleRow
          id="apg-voucher-folio"
          label="Pedir folio del vale"
          checked={config.voucherRequireFolio !== false}
          disabled={disabled}
          onChange={(checked) => onPatchConfig({ voucherRequireFolio: checked })}
        />
        <ToggleRow
          id="apg-voucher-auth"
          label="Requerir autorizacion"
          checked={config.voucherRequireAuthorization !== false}
          disabled={disabled}
          onChange={(checked) => onPatchConfig({ voucherRequireAuthorization: checked })}
        />
      </div>
    </section>
  );
}

function PanelHead({ icon, kicker, title }) {
  return (
    <header className="apg-panel-head">
      <span className="apg-panel-icon">
        <i className={icon} />
      </span>
      <div>
        <span>{kicker}</span>
        <h3>{title}</h3>
      </div>
    </header>
  );
}

function ToggleSwitch({ id, checked, disabled, onChange }) {
  return (
    <label className="apg-switch" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
      />
      <span aria-hidden="true" />
    </label>
  );
}

function ToggleRow({ id, label, checked, disabled, onChange }) {
  return (
    <label className="apg-toggle-row" htmlFor={id}>
      <span className="apg-switch">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange?.(event.target.checked)}
        />
        <span aria-hidden="true" />
      </span>
      <strong>{label}</strong>
    </label>
  );
}

function defaultRequiresReference(type) {
  return ["TERMINAL", "CARD", "VOUCHER"].includes(normalizePaymentType(type));
}

function defaultRequiresVerification(type) {
  return ["TERMINAL", "CARD", "VOUCHER"].includes(normalizePaymentType(type));
}

export default AjustesPagos;
