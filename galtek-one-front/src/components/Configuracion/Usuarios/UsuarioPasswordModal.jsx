import React, { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint32Array(4);

  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * alphabet.length);
    }
  }

  const token = Array.from(bytes)
    .map((value) => alphabet[value % alphabet.length])
    .join("");

  return `Galtek-${token}`;
}

export default function UsuarioPasswordModal({ visible, user, saving, error, onHide, onSubmit }) {
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [applied, setApplied] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!visible) {
      setTemporaryPassword("");
      setApplied(false);
      setCopied(false);
      return;
    }

    setTemporaryPassword(generateTemporaryPassword());
    setApplied(false);
    setCopied(false);
  }, [visible, user?.idUsuario]);

  const copyPassword = async () => {
    if (!temporaryPassword || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const submit = async () => {
    if (!temporaryPassword || saving || applied) return;
    const ok = await onSubmit(temporaryPassword);
    if (ok) setApplied(true);
  };

  const footer = (
    <div className="au-dialog-footer">
      {!applied ? (
        <Button label="Cancelar" className="au-text-btn" onClick={onHide} disabled={saving} />
      ) : null}
      {applied ? (
        <Button label="Listo" icon="pi pi-check" className="au-primary-btn" onClick={onHide} />
      ) : (
        <Button
          label={saving ? "Restableciendo..." : "Restablecer temporal"}
          icon={saving ? "pi pi-spin pi-spinner" : "pi pi-key"}
          className="au-primary-btn"
          onClick={submit}
          disabled={saving}
        />
      )}
    </div>
  );

  return (
    <Dialog
      header="Restablecer password"
      visible={visible}
      onHide={onHide}
      modal
      draggable={false}
      dismissableMask={!saving}
      className="au-dialog au-password-dialog"
      style={{ width: "36rem" }}
      footer={footer}
    >
      <div className="au-password-body">
        <div className="au-password-user">
          <i className="pi pi-key" />
          <div>
            <strong>{user?.nombreUsuario || "Usuario"}</strong>
            <span>@{user?.usuario || "-"}</span>
          </div>
        </div>

        <div className="au-password-notice">
          <strong>Password temporal</strong>
          <span>
            Comparte esta clave con el usuario. En su siguiente inicio de sesion
            debera cambiarla por una password personal.
          </span>
        </div>

        <label className="au-field">
          <span>Clave temporal generada</span>
          <div className="au-temp-password-box">
            <InputText value={temporaryPassword} readOnly className="au-temp-password-input" />
            <Button
              icon={copied ? "pi pi-check" : "pi pi-copy"}
              label={copied ? "Copiado" : "Copiar"}
              className="au-soft-btn"
              onClick={copyPassword}
              disabled={!temporaryPassword}
              type="button"
            />
          </div>
        </label>

        {applied ? (
          <div className="au-password-success">
            <i className="pi pi-check-circle" />
            <span>La clave temporal quedo activa para el usuario.</span>
          </div>
        ) : null}

        {error ? <div className="au-form-error">{error}</div> : null}
      </div>
    </Dialog>
  );
}
