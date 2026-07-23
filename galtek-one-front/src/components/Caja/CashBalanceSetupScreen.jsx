import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { AlertTriangle, CheckCircle2, CircleDollarSign, Loader2, Monitor } from "lucide-react";
import { useCashSession } from "../../cash/CashSessionContext";
import {
  amountStringIsValid,
  createCashIdempotencyKey,
  formatMXN,
  normalizeAmountInput,
  toMoneyNumber,
} from "../../cash/cashSessionUtils";
import CashNumericKeypad from "./CashNumericKeypad";

const categories = [
  ["INITIAL_OWNER_INVESTMENT", "Inversion del propietario"],
  ["INITIAL_CHANGE_FUND", "Fondo de cambio"],
  ["TRANSFER_FROM_ANOTHER_LOCATION", "Traspaso de otra ubicacion"],
  ["OTHER_INITIAL_BALANCE", "Otro saldo inicial"],
];

export default function CashBalanceSetupScreen() {
  const { initializeCashBalance, opening, error, refreshCashState } = useCashSession();
  const [amount, setAmount] = useState("0");
  const [category, setCategory] = useState("INITIAL_CHANGE_FUND");
  const [reason, setReason] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const amountRef = useRef(null);
  const idempotencyKeyRef = useRef(createCashIdempotencyKey());
  const submittingRef = useRef(false);

  useEffect(() => {
    const id = window.setTimeout(() => amountRef.current?.focus?.(), 80);
    return () => window.clearTimeout(id);
  }, []);

  const money = useMemo(() => toMoneyNumber(amount), [amount]);

  const applyAmount = (value) => {
    setFieldError("");
    setSubmitError("");
    setAmount(String(value));
  };

  const handleAmountChange = (event) => {
    const normalized = normalizeAmountInput(event.target.value);
    if (normalized === null) return;
    applyAmount(normalized);
  };

  const validate = () => {
    if (!amountStringIsValid(amount)) {
      setFieldError("Captura un monto valido con maximo dos decimales.");
      return false;
    }
    if (!reason.trim()) {
      setFieldError("Escribe el motivo de la configuracion inicial.");
      return false;
    }
    setFieldError("");
    return true;
  };

  const handleSubmit = async () => {
    if (opening || submittingRef.current) return;
    setSubmitError("");
    if (!validate()) {
      amountRef.current?.focus?.();
      return;
    }
    submittingRef.current = true;
    try {
      await initializeCashBalance({
        amount: money,
        category,
        reason: reason.trim(),
        idempotencyKey: idempotencyKeyRef.current,
      });
    } catch (err) {
      setSubmitError(err?.message || "No se pudo configurar el saldo inicial.");
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <main className="cash-opening-page">
      <section className="cash-opening-shell cash-opening-shell--setup">
        <div className="cash-opening-hero">
          <div className="cash-brand-mark">
            <span>GaltekOne</span>
            <strong>POS</strong>
          </div>

          <div className="cash-opening-title">
            <span className="cash-eyebrow">Saldo continuo</span>
            <h1>Configura el saldo inicial</h1>
            <p>Registra el efectivo con el que comenzara a operar esta estacion.</p>
          </div>

          <div className="cash-opening-meta" aria-label="Datos de estacion">
            <div>
              <Monitor size={18} aria-hidden="true" />
              <span>Cuenta de efectivo</span>
            </div>
            <div>
              <CircleDollarSign size={18} aria-hidden="true" />
              <span>Operacion continua</span>
            </div>
          </div>
        </div>

        <form
          className="cash-opening-form"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        >
          <label className="cash-amount-field" htmlFor="cash-balance-initial-amount">
            <span className="cash-amount-field__label">Monto inicial</span>
            <InputText
              id="cash-balance-initial-amount"
              ref={amountRef}
              value={amount}
              onChange={handleAmountChange}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === "NumpadEnter") {
                  event.preventDefault();
                  handleSubmit();
                }
              }}
              inputMode="decimal"
              autoComplete="off"
              disabled={opening}
              aria-invalid={Boolean(fieldError)}
              className={fieldError ? "cash-amount-field__input is-invalid" : "cash-amount-field__input"}
            />
            <span className="cash-amount-field__hint">
              Este registro se hace una sola vez y queda auditado.
            </span>
            <span className="cash-amount-field__preview">
              {money === null ? "$0.00 MXN" : `${formatMXN(money)} MXN`}
            </span>
          </label>

          <label className="cash-amount-field cash-setup-field" htmlFor="cash-balance-category">
            <span className="cash-amount-field__label">Categoria</span>
            <select
              id="cash-balance-category"
              className="cash-select"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              disabled={opening}
            >
              {categories.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <label className="cash-amount-field cash-setup-field" htmlFor="cash-balance-reason">
            <span className="cash-amount-field__label">Motivo</span>
            <InputText
              id="cash-balance-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              disabled={opening}
              className="cash-text-input"
              maxLength={500}
            />
          </label>

          <CashNumericKeypad value={amount} onChange={applyAmount} disabled={opening} label="Teclado numerico para saldo inicial" />

          {fieldError ? <span className="cash-field-error">{fieldError}</span> : null}

          {submitError || error ? (
            <div className="cash-opening-error" role="alert">
              <AlertTriangle size={18} aria-hidden="true" />
              <span>{submitError || error}</span>
              <button type="button" onClick={() => refreshCashState({ force: true })}>
                Reintentar
              </button>
            </div>
          ) : null}

          <Button
            type="submit"
            className="cash-primary-button"
            disabled={opening || !amountStringIsValid(amount) || !reason.trim()}
            label={opening ? "Guardando..." : "Guardar saldo inicial"}
            icon={opening ? <Loader2 className="cash-spin" size={18} aria-hidden="true" /> : <CheckCircle2 size={18} aria-hidden="true" />}
          />
        </form>
      </section>
    </main>
  );
}
