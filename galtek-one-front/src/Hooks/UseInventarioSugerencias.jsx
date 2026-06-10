import { useEffect, useState } from "react";
import { APIfetchApi } from "../API/APIfetch";
import { endpoints } from "../API/api";

const getNumber = (...values) => {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const getProductName = (item) =>
  item?.producto?.nombreProducto ||
  item?.producto?.nombre ||
  item?.nombreProducto ||
  item?.nombre ||
  "Producto sin nombre";

const getProviderName = (item) =>
  item?.proveedor?.nombreProveedor ||
  item?.proveedor?.nombre ||
  item?.nombreProveedor ||
  item?.proveedor ||
  "Sin proveedor";

export default function useInventarioSugerencias() {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    let activo = true;
    const api = new APIfetchApi();

    async function cargarSugerencias() {
      try {
        const response = await api.fetchApi({}, "GET", undefined, endpoints.inventario);
        if (!response?.ok) {
          if (activo) setProductos([]);
          return;
        }

        const payload = await response.json();
        const data = Array.isArray(payload?.data) ? payload.data : [];
        const filtrados = data
          .map((item) => {
            const stock = getNumber(
              item?.stock,
              item?.existencia,
              item?.cantidadDisponible,
              item?.cantidad,
              item?.totalStock
            );

            return {
              producto: getProductName(item),
              proveedor: getProviderName(item),
              stock,
            };
          })
          .filter((item) => item.stock <= 25)
          .sort((a, b) => a.stock - b.stock);

        if (activo) setProductos(filtrados);
      } catch (error) {
        console.error("Error al cargar sugerencias de inventario:", error);
        if (activo) setProductos([]);
      }
    }

    cargarSugerencias();

    return () => {
      activo = false;
    };
  }, []);

  const getStockColor = (stock) => {
    if (stock <= 10) return "rojo";
    if (stock <= 25) return "amarillo";
    return "verde";
  };

  return { productos, getStockColor };
}
