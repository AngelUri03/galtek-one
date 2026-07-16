import React from "react";
import { Dialog } from "primereact/dialog";
import ProveedorActivosSection from "./ProveedorActivosSection";
import ProveedorAuditSection from "./ProveedorAuditSection";
import ProveedorDocumentosSection from "./ProveedorDocumentosSection";
import ProveedorProductosSection from "./ProveedorProductosSection";

const titles = {
  productos: "Productos asociados",
  activos: "Activos prestados",
  documentos: "Documentos",
  auditoria: "Auditoria del proveedor",
};

export default function ProveedorAdvancedModals({
  section,
  proveedor,
  onHide,
  onRefresh,
  showToast,
}) {
  if (!proveedor) return null;

  const productos = proveedor.productosAsociados || [];
  const activos = proveedor.activosPrestados || [];
  const documentos = proveedor.documentos || [];

  return (
    <Dialog
      header={titles[section] || "Proveedor"}
      visible={Boolean(section)}
      onHide={onHide}
      modal
      draggable={false}
      dismissableMask
      focusOnShow={false}
      closeButtonProps={{ tabIndex: -1 }}
      className="prov-advanced-dialog"
      style={{ width: "min(1040px, calc(100vw - 72px))" }}
    >
      <div className={section === "auditoria" ? "prov-advanced-dialog-body is-audit" : "prov-advanced-dialog-body"}>
        {section === "productos" ? (
          <ProveedorProductosSection
            proveedor={proveedor}
            items={productos}
            onRefresh={onRefresh}
            showToast={showToast}
          />
        ) : null}
        {section === "activos" ? (
          <ProveedorActivosSection
            proveedor={proveedor}
            items={activos}
            documentos={documentos}
            onRefresh={onRefresh}
            showToast={showToast}
          />
        ) : null}
        {section === "documentos" ? (
          <ProveedorDocumentosSection
            proveedor={proveedor}
            items={documentos}
            activos={activos}
            onRefresh={onRefresh}
            showToast={showToast}
          />
        ) : null}
        {section === "auditoria" ? (
          <ProveedorAuditSection proveedor={proveedor} detailed />
        ) : null}
      </div>
    </Dialog>
  );
}
