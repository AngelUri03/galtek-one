import React, { useRef, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { MAX_ASSET_EVIDENCE_BYTES } from "./proveedorAdvancedUtils";

const EVIDENCE_MIMES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_ASSET_STEP_EVIDENCES = 6;

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || "");
      resolve({
        dataUrl: value,
        base64: value.includes(",") ? value.split(",").pop() : value,
      });
    };
    reader.onerror = () => reject(new Error("No se pudo leer la evidencia."));
    reader.readAsDataURL(file);
  });
}

function fileSizeKb(value) {
  return Math.max(1, Math.round(Number(value || 0) / 1024));
}

export default function ProveedorActivoEvidencePicker({
  evidences = [],
  onChange,
  disabled,
  label = "Evidencias opcionales",
  hint = "JPG, PNG o WebP · máximo 10 MB por foto · hasta 6 fotos",
}) {
  const fileInputRef = useRef(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;

    if (evidences.length + files.length > MAX_ASSET_STEP_EVIDENCES) {
      setError("Solo puedes agregar hasta 6 fotos por paso del proceso.");
      return;
    }

    const invalid = files.find((file) => !EVIDENCE_MIMES.includes(file.type));
    if (invalid) {
      setError("Usa solo imágenes JPG, PNG o WebP.");
      return;
    }

    const oversized = files.find((file) => file.size > MAX_ASSET_EVIDENCE_BYTES);
    if (oversized) {
      setError("Cada evidencia puede pesar máximo 10 MB.");
      return;
    }

    try {
      const encoded = await Promise.all(
        files.map(async (file) => {
          const result = await fileToBase64(file);
          return {
            key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
            name: file.name,
            mimeType: file.type,
            size: file.size,
            dataUrl: result.dataUrl,
            base64: result.base64,
          };
        })
      );
      onChange?.([...evidences, ...encoded]);
      setError("");
    } catch (err) {
      setError(err.message || "No se pudo cargar la evidencia.");
    }
  };

  const removeEvidence = (key) => {
    onChange?.(evidences.filter((item) => item.key !== key));
  };

  return (
    <>
      <div className={`prov-asset-evidence-uploader ${error ? "has-error" : ""}`}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFiles}
        />
        <div>
          <span>{label}</span>
          <strong>
            {evidences.length
              ? `${evidences.length} foto${evidences.length === 1 ? "" : "s"} cargada${evidences.length === 1 ? "" : "s"}`
              : "Sin evidencia cargada"}
          </strong>
          <small>{hint}</small>
        </div>
        <Button
          label="Agregar fotos"
          icon="pi pi-camera"
          className="prov-soft-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || evidences.length >= MAX_ASSET_STEP_EVIDENCES}
        />
      </div>
      {error ? <small className="prov-field-error">{error}</small> : null}

      {evidences.length ? (
        <div className="prov-asset-evidence-grid">
          {evidences.map((evidence) => (
            <article className="prov-asset-evidence-thumb" key={evidence.key}>
              <button
                type="button"
                className="prov-image-thumb-btn"
                onClick={() => setPreview(evidence)}
                disabled={disabled}
              >
                <img src={evidence.dataUrl} alt={evidence.name || "Evidencia del activo"} />
              </button>
              <div>
                <strong title={evidence.name}>{evidence.name}</strong>
                <span>{fileSizeKb(evidence.size)} KB</span>
              </div>
              <Button
                icon="pi pi-times"
                className="prov-row-action"
                onClick={() => removeEvidence(evidence.key)}
                disabled={disabled}
                aria-label="Quitar evidencia"
                tooltip="Quitar evidencia"
                tooltipOptions={{ position: "top" }}
              />
            </article>
          ))}
        </div>
      ) : null}

      <Dialog
        header={preview?.name || "Vista previa"}
        visible={Boolean(preview)}
        onHide={() => setPreview(null)}
        modal
        draggable={false}
        dismissableMask
        focusOnShow={false}
        closeButtonProps={{ tabIndex: -1 }}
        className="prov-advanced-dialog prov-image-preview-dialog"
        style={{ width: "min(74rem, calc(100vw - 2rem))" }}
      >
        {preview ? (
          <div className="prov-image-preview-body">
            <img src={preview.dataUrl} alt={preview.name || "Evidencia del activo"} />
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
