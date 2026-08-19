import React, { useEffect, useRef } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Sidebar } from "primereact/sidebar";

export function WorkspaceDrawer({
  visible,
  eyebrow,
  title,
  subtitle,
  backLabel,
  onBack,
  onClose,
  onDismiss,
  size = "detail",
  direction = "forward",
  focusTitle = true,
  bodyRef,
  footer,
  className = "",
  children,
}) {
  const titleRef = useRef(null);

  useEffect(() => {
    if (!visible || !focusTitle) return;
    const timer = window.setTimeout(() => titleRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [focusTitle, title, visible]);

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
      return;
    }
    if (onBack) {
      onBack();
      return;
    }
    onClose?.();
  };

  const header = (
    <div className="gto-workspace-header">
      <div className="gto-workspace-header-main">
        {onBack ? (
          <Button
            label={backLabel || "Volver"}
            icon="pi pi-arrow-left"
            className="gto-workspace-back"
            onClick={onBack}
            aria-label={backLabel ? `Volver a ${backLabel}` : "Volver"}
          />
        ) : (
          <span className="gto-workspace-eyebrow">{eyebrow || "GaltekOne"}</span>
        )}
        <h2 ref={titleRef} tabIndex={-1} className="gto-workspace-title">
          {title}
        </h2>
        {subtitle ? <span className="gto-workspace-subtitle">{subtitle}</span> : null}
      </div>
      <Button
        icon="pi pi-times"
        className="gto-workspace-close"
        onClick={onClose}
        aria-label="Cerrar drawer"
        tooltip="Cerrar"
        tooltipOptions={{ position: "left" }}
      />
    </div>
  );

  return (
    <Sidebar
      visible={visible}
      onHide={handleDismiss}
      position="right"
      blockScroll
      showCloseIcon={false}
      className={`gto-workspace-drawer gto-drawer--${size} ${className}`}
      header={header}
    >
      <div className="gto-workspace-body" ref={bodyRef}>
        <div className={`gto-workspace-view is-${direction}`}>{children}</div>
      </div>
      {footer ? <div className="gto-workspace-footer">{footer}</div> : null}
    </Sidebar>
  );
}

export function ModalSurface({
  visible,
  title,
  size = "small",
  className = "",
  children,
  footer,
  onHide,
  ...props
}) {
  return (
    <Dialog
      header={title || ""}
      visible={visible}
      onHide={onHide}
      modal
      draggable={false}
      dismissableMask
      className={`gto-modal gto-modal--${size} ${className}`}
      footer={footer}
      {...props}
    >
      {children}
    </Dialog>
  );
}
