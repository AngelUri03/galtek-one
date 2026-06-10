import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import Shell from "../common/Shell";
import "../../style/components/Clientes/CrearClientes.css";
import useLockBodyScroll from "../../Hooks/UseLockBodyScroll";
import { Upload, Avatar, message } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";

const api = new APIfetchApi();

export default function CrearClientes() {
  useLockBodyScroll(true);
  const navigate = useNavigate();
  const toast = useRef(null);

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
  });
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [saving, setSaving] = useState(false);

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!form.nombre.trim() || !form.email.trim()) {
      message.error("Nombre y correo son obligatorios");
      return;
    }

    const body = {
      nombre: form.nombre.trim(),
      email: form.email.trim(),
      telefono: form.telefono.trim(),
      direccion: form.direccion.trim(),
      avatar: avatarUrl ? avatarUrl.split(",")[1] : "",
    };

    setSaving(true);
    try {
      const res = await api.fetchApi(
        { "Content-Type": "application/json" },
        "POST",
        body,
        endpoints.clientes
      );

      if (!res?.ok) {
        message.error("Error al crear cliente");
        return;
      }

      toast.current?.show({
        severity: "success",
        summary: "Cliente creado",
        detail: "El cliente se registro exitosamente.",
        life: 2000,
      });

      setTimeout(() => {
        navigate("/clientes", { state: { body } });
      }, 600);
    } catch (error) {
      console.error("Error creando cliente:", error);
      message.error("Error de conexion");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Shell>
      <Toast ref={toast} />
      <div className="crear-wrapper">
        <h1 className="crear-title">Crear Cliente Nuevo</h1>

        <form className="crear-card" onSubmit={onSubmit}>
          <Upload
            accept="image/*"
            listType="picture-circle"
            className="avatar-uploader"
            showUploadList={false}
            beforeUpload={async (file) => {
              if (!file.type.startsWith("image/")) {
                message.error("Solo puedes subir imagenes");
                return Upload.LIST_IGNORE;
              }
              if (file.size / 1024 / 1024 >= 2) {
                message.error("La imagen debe pesar menos de 2 MB");
                return Upload.LIST_IGNORE;
              }
              const preview = await fileToBase64(file);
              setAvatarUrl(preview);
              return false;
            }}
          >
            {avatarUrl ? <Avatar src={avatarUrl} size={120} /> : <Avatar icon={<UserOutlined />} size={120} />}
          </Upload>

          <div className="crear-field">
            <InputText name="nombre" value={form.nombre} onChange={onChange} placeholder="Nombre Completo" className="crear-input" />
          </div>
          <div className="crear-field">
            <InputText name="email" value={form.email} onChange={onChange} placeholder="Correo Electronico" className="crear-input" />
          </div>
          <div className="crear-field">
            <InputText name="telefono" value={form.telefono} onChange={onChange} placeholder="Telefono" className="crear-input" />
          </div>
          <div className="crear-field">
            <InputText name="direccion" value={form.direccion} onChange={onChange} placeholder="Direccion" className="crear-input" />
          </div>

          <div className="crear-actions">
            <Button type="button" label="Regresar" className="p-button-gris" onClick={() => navigate("/clientes")} />
            <Button type="submit" label={saving ? "Creando..." : "Crear"} className="p-button-verde" disabled={saving} />
          </div>
        </form>
      </div>
    </Shell>
  );
}
