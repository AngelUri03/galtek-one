import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Shell from "../common/Shell";
import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { Tooltip } from "primereact/tooltip";
import "../../style/components/Proveedores/Proveedores.css";

const api = new APIfetchApi();

const emptyForm = {
  idProveedor: null,
  nombreProveedor: "",
  contacto: "",
  telefono: "",
  correo: "",
  direccion: "",
  estatus: true,
};

const normalizeProveedor = (proveedor) => ({
  idProveedor: proveedor?.idProveedor ?? proveedor?.id ?? null,
  nombreProveedor: proveedor?.nombreProveedor ?? proveedor?.nombre ?? "",
  contacto: proveedor?.contacto ?? "",
  telefono: proveedor?.telefono ?? "",
  correo: proveedor?.correo ?? "",
  direccion: proveedor?.direccion ?? "",
  estatus: proveedor?.estatus !== false,
  fechaCreacion: proveedor?.fechaCreacion ?? "",
  fechaModificacion: proveedor?.fechaModificacion ?? "",
});

const getPayloadData = async (response) => {
  if (!response?.ok) return [];
  const payload = await response.json();
  return Array.isArray(payload?.data) ? payload.data : [];
};

export default function Proveedores() {
  const toast = useRef(null);
  const [proveedores, setProveedores] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const editing = Boolean(form.idProveedor);

  const activos = useMemo(
    () => proveedores.filter((proveedor) => proveedor.estatus).length,
    [proveedores]
  );

  const inactivos = proveedores.length - activos;

  const showToast = useCallback((severity, summary, detail) => {
    toast.current?.show({ severity, summary, detail, life: 3200 });
  }, []);

  const fetchProveedores = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.fetchApi({}, "GET", undefined, endpoints.proveedores);
      const data = await getPayloadData(response);
      setProveedores(data.map(normalizeProveedor));

      if (response && !response.ok) {
        showToast("warn", "Proveedores", "No se pudo obtener la lista de proveedores.");
      }
    } catch (error) {
      console.error("Error al obtener proveedores:", error);
      setProveedores([]);
      showToast("error", "Proveedores", "Ocurrio un error al cargar proveedores.");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchProveedores();
  }, [fetchProveedores]);

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openCreate = () => {
    setForm(emptyForm);
    setDialogVisible(true);
  };

  const openEdit = (proveedor) => {
    setForm(normalizeProveedor(proveedor));
    setDialogVisible(true);
  };

  const buildPayload = () => ({
    nombreProveedor: form.nombreProveedor.trim(),
    contacto: form.contacto.trim(),
    telefono: form.telefono.trim(),
    correo: form.correo.trim(),
    direccion: form.direccion.trim(),
    estatus: form.estatus,
  });

  const validateForm = () => {
    const payload = buildPayload();
    if (!payload.nombreProveedor) return "Captura el nombre del proveedor.";
    if (!payload.contacto) return "Captura el contacto.";
    if (!payload.telefono) return "Captura el telefono.";
    if (!payload.correo) return "Captura el correo.";
    if (!payload.direccion) return "Captura la direccion.";
    return "";
  };

  const saveProveedor = async () => {
    const validationMessage = validateForm();
    if (validationMessage) {
      showToast("warn", "Datos incompletos", validationMessage);
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      const url = editing
        ? `${endpoints.proveedores}/${form.idProveedor}`
        : endpoints.proveedores;
      const method = editing ? "PUT" : "POST";
      const response = await api.fetchApi({}, method, payload, url);

      if (!response?.ok) {
        showToast("error", "Proveedores", "No se pudo guardar el proveedor.");
        return;
      }

      showToast(
        "success",
        "Proveedor guardado",
        editing ? "Proveedor actualizado correctamente." : "Proveedor creado correctamente."
      );
      setDialogVisible(false);
      await fetchProveedores();
    } catch (error) {
      console.error("Error al guardar proveedor:", error);
      showToast("error", "Proveedores", "Ocurrio un error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const deleteProveedor = async (proveedor) => {
    const nombre = proveedor?.nombreProveedor || "este proveedor";
    if (!window.confirm(`Deseas eliminar ${nombre}?`)) return;

    try {
      const response = await api.fetchApi(
        {},
        "DELETE",
        undefined,
        `${endpoints.proveedores}/${proveedor.idProveedor}`
      );

      if (!response?.ok) {
        showToast("error", "Proveedores", "No se pudo eliminar el proveedor.");
        return;
      }

      setProveedores((prev) =>
        prev.filter((item) => String(item.idProveedor) !== String(proveedor.idProveedor))
      );
      showToast("success", "Proveedor eliminado", "El proveedor fue eliminado correctamente.");
    } catch (error) {
      console.error("Error al eliminar proveedor:", error);
      showToast("error", "Proveedores", "Ocurrio un error al eliminar.");
    }
  };

  const estadoTemplate = (rowData) => (
    <Tag
      value={rowData.estatus ? "Activo" : "Inactivo"}
      severity={rowData.estatus ? "success" : "danger"}
      rounded
    />
  );

  const contactoTemplate = (rowData) => (
    <div className="prov-contact-cell">
      <span>{rowData.contacto || "Sin contacto"}</span>
      <small>{rowData.correo || "Sin correo"}</small>
    </div>
  );

  const accionesTemplate = (rowData) => (
    <div className="prov-actions">
      <Button
        icon="pi pi-pencil"
        className="p-button-rounded p-button-sm p-button-secondary"
        onClick={() => openEdit(rowData)}
        aria-label="Editar proveedor"
        data-pr-tooltip="Editar"
      />
      <Button
        icon="pi pi-trash"
        className="p-button-rounded p-button-sm p-button-danger"
        onClick={() => deleteProveedor(rowData)}
        aria-label="Eliminar proveedor"
        data-pr-tooltip="Eliminar"
      />
    </div>
  );

  const dialogFooter = (
    <div className="prov-dialog-footer">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-text"
        onClick={() => setDialogVisible(false)}
        disabled={saving}
      />
      <Button
        label={editing ? "Guardar" : "Crear"}
        icon="pi pi-check"
        className="prov-primary-btn"
        onClick={saveProveedor}
        loading={saving}
      />
    </div>
  );

  return (
    <Shell>
      <Toast ref={toast} />
      <Tooltip />
      <div className="proveedores-page">
        <div className="prov-header">
          <div>
            <h1>Proveedores</h1>
            <p>Directorio de contactos comerciales, compras y abastecimiento.</p>
          </div>
          <Button
            label="Agregar Proveedor"
            icon="pi pi-plus"
            className="prov-primary-btn"
            onClick={openCreate}
          />
        </div>

        <div className="prov-stats">
          <div className="prov-stat">
            <span>Total</span>
            <strong>{proveedores.length}</strong>
          </div>
          <div className="prov-stat">
            <span>Activos</span>
            <strong>{activos}</strong>
          </div>
          <div className="prov-stat">
            <span>Inactivos</span>
            <strong>{inactivos}</strong>
          </div>
        </div>

        <div className="prov-table-panel">
          <div className="prov-toolbar">
            <span className="p-input-icon-left prov-search">
              <i className="pi pi-search" />
              <InputText
                placeholder="Buscar por nombre, contacto, correo o telefono"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
              />
            </span>
            <Button
              icon="pi pi-refresh"
              className="p-button-rounded p-button-text prov-refresh"
              onClick={fetchProveedores}
              loading={loading}
              aria-label="Actualizar proveedores"
              data-pr-tooltip="Actualizar"
            />
          </div>

          <DataTable
            value={proveedores}
            loading={loading}
            paginator
            rows={8}
            stripedRows
            responsiveLayout="scroll"
            globalFilter={globalFilter}
            globalFilterFields={[
              "nombreProveedor",
              "contacto",
              "telefono",
              "correo",
              "direccion",
            ]}
            emptyMessage="Sin proveedores registrados"
            className="prov-table"
          >
            <Column field="nombreProveedor" header="Proveedor" sortable />
            <Column header="Contacto" body={contactoTemplate} sortable sortField="contacto" />
            <Column field="telefono" header="Telefono" />
            <Column field="direccion" header="Direccion" />
            <Column header="Estado" body={estadoTemplate} sortable sortField="estatus" />
            <Column
              header="Acciones"
              body={accionesTemplate}
              headerClassName="prov-actions-header"
            />
          </DataTable>
        </div>
      </div>

      <Dialog
        header={editing ? "Editar proveedor" : "Agregar proveedor"}
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        modal
        dismissableMask
        blockScroll
        footer={dialogFooter}
        className="prov-dialog"
        breakpoints={{ "960px": "70vw", "640px": "95vw" }}
        style={{ width: "42rem" }}
      >
        <div className="prov-form">
          <label>
            Nombre
            <InputText
              value={form.nombreProveedor}
              onChange={(e) => updateForm("nombreProveedor", e.target.value)}
              autoFocus
            />
          </label>
          <label>
            Contacto
            <InputText
              value={form.contacto}
              onChange={(e) => updateForm("contacto", e.target.value)}
            />
          </label>
          <label>
            Telefono
            <InputText
              value={form.telefono}
              onChange={(e) => updateForm("telefono", e.target.value)}
            />
          </label>
          <label>
            Correo
            <InputText
              value={form.correo}
              onChange={(e) => updateForm("correo", e.target.value)}
            />
          </label>
          <label className="prov-form-full">
            Direccion
            <InputText
              value={form.direccion}
              onChange={(e) => updateForm("direccion", e.target.value)}
            />
          </label>
          <label className="prov-status-toggle">
            <input
              type="checkbox"
              checked={form.estatus}
              onChange={(e) => updateForm("estatus", e.target.checked)}
            />
            Activo
          </label>
        </div>
      </Dialog>
    </Shell>
  );
}
