import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Shell from "../common/Shell";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import useLockBodyScroll from "../../Hooks/UseLockBodyScroll";
import { Upload, Avatar, message } from "antd";
import { UserOutlined } from "@ant-design/icons";
import "../../style/components/Clientes/EditarCliente.css";
import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";

const api = new APIfetchApi();

const getClienteId = (cliente) => cliente?.idCliente ?? cliente?.id ?? "";

const initialForm = {
  id: "",
  nombre: "",
  email: "",
  telefono: "",
  direccion: "",
  avatar: null,
};

export default function EditarCliente() {
  useLockBodyScroll(true);
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useRef(null);

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let activo = true;

    const aplicarCliente = (cliente) => {
      if (!cliente) return;
      setForm({
        id: getClienteId(cliente),
        nombre: cliente.nombre || "",
        email: cliente.email || "",
        telefono: cliente.telefono || "",
        direccion: cliente.direccion || "",
        avatar: cliente.avatar || null,
      });
    };

    async function cargarCliente() {
      setLoading(true);
      try {
        if (state?.cliente) {
          aplicarCliente(state.cliente);
          return;
        }

        const response = await api.fetchApi({}, "GET", undefined, `${endpoints.clientes}/${id}`);
        if (!response?.ok) return;
        const payload = await response.json();
        if (activo) aplicarCliente(payload?.data || payload);
      } catch (error) {
        console.error("Error al cargar cliente:", error);
      } finally {
        if (activo) setLoading(false);
      }
    }

    cargarCliente();
    return () => {
      activo = false;
    };
  }, [id, state?.cliente]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });

  const beforeUpload = async (file) => {
    if (!file.type.startsWith("image/")) {
      message.error("Solo imagenes");
      return Upload.LIST_IGNORE;
    }
    if (file.size / 1024 / 1024 >= 2) {
      message.error("Maximo 2 MB");
      return Upload.LIST_IGNORE;
    }
    const preview = await fileToBase64(file);
    setForm((f) => ({ ...f, avatar: preview }));
    return false;
  };

  const removeAvatar = () => setForm((f) => ({ ...f, avatar: null }));

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!form.nombre.trim() || !form.email.trim()) {
      message.error("Nombre y correo son obligatorios");
      return;
    }

    let avatarFinal = form.avatar;
    if (avatarFinal && avatarFinal.includes(",")) {
      avatarFinal = avatarFinal.split(",")[1];
    }

    const body = {
      nombre: form.nombre.trim(),
      email: form.email.trim(),
      telefono: form.telefono.trim(),
      direccion: form.direccion.trim(),
      avatar: avatarFinal || "",
    };

    setSaving(true);
    try {
      const res = await api.fetchApi(
        { "Content-Type": "application/json" },
        "PUT",
        body,
        `${endpoints.clientes}/${form.id}`
      );

      if (!res?.ok) {
        message.error("Error al actualizar");
        return;
      }

      toast.current?.show({
        severity: "success",
        summary: "Cliente actualizado",
        detail: "Los cambios se guardaron exitosamente.",
        life: 2000,
      });

      setTimeout(() => {
        navigate("/clientes", { state: { actualizadoCliente: { ...body, id: form.id } } });
      }, 600);
    } catch (error) {
      console.error("Error editando cliente:", error);
      message.error("Error de conexion");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Shell>
        <p>Cargando cliente...</p>
      </Shell>
    );
  }

  if (!form.id) {
    return (
      <Shell>
        <div className="crear-wrapper">
          <h1 className="crear-title">Editar Cliente</h1>
          <p>No se encontro el cliente.</p>
          <Button label="Volver" className="btn-verde" onClick={() => navigate("/clientes")} />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Toast ref={toast} />
      <div className="crear-wrapper">
        <h2 className="crear-subtitle">
          Cliente Seleccionado (Editor): <span>{form.nombre}</span>
        </h2>

        <form className="crear-card" onSubmit={onSubmit}>
          <div className="avatar-uploader">
            <Upload accept="image/*" listType="picture-circle" showUploadList={false} beforeUpload={beforeUpload}>
              {form.avatar ? <Avatar src={form.avatar} size={120} /> : <Avatar icon={<UserOutlined />} size={120} />}
            </Upload>
            {form.avatar && (
              <button type="button" className="avatar-remove" onClick={removeAvatar}>
                Quitar
              </button>
            )}
          </div>

          <div className="crear-field">
            <InputText name="nombre" value={form.nombre} onChange={onChange} className="crear-input" placeholder="Nombre completo" />
          </div>
          <div className="crear-field">
            <InputText name="email" value={form.email} onChange={onChange} className="crear-input" placeholder="Correo electronico" />
          </div>
          <div className="crear-field">
            <InputText name="telefono" value={form.telefono} onChange={onChange} className="crear-input" placeholder="Telefono" />
          </div>
          <div className="crear-field">
            <InputText name="direccion" value={form.direccion} onChange={onChange} className="crear-input" placeholder="Direccion" />
          </div>

          <div className="crear-actions">
            <Button type="button" label="Regresar" className="p-button-gris" onClick={() => navigate(`/clientes/${form.id}`, { state: { cliente: form } })} />
            <Button type="submit" label={saving ? "Guardando..." : "Guardar"} className="btn-verde" disabled={saving} />
          </div>
        </form>
      </div>
    </Shell>
  );
}
