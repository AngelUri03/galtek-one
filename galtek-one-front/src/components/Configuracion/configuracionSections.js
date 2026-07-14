export const CONFIG_STATUS = {
  functional: {
    label: "Funcional",
    tone: "functional",
    icon: "pi pi-check-circle",
  },
  development: {
    label: "En desarrollo",
    tone: "development",
    icon: "pi pi-wrench",
  },
  coming: {
    label: "Proximamente",
    tone: "coming",
    icon: "pi pi-clock",
  },
  disconnected: {
    label: "No conectado",
    tone: "disconnected",
    icon: "pi pi-unlink",
  },
};

export const CONFIG_SECTION_GROUPS = [
  {
    group: "Operacion",
    items: [
      {
        key: "tienda",
        label: "Tienda",
        icon: "pi pi-shop",
        desc: "Identidad, horarios, moneda y configuracion base.",
        status: "functional",
        refreshable: true,
      },
      {
        key: "ticket",
        label: "Ticket e impresion",
        icon: "pi pi-receipt",
        desc: "Formato del ticket, bloques e impresion local.",
        status: "functional",
        refreshable: true,
      },
      {
        key: "promociones",
        label: "Promociones",
        icon: "pi pi-tags",
        desc: "Cupones, reglas y descuentos por volumen.",
        status: "development",
        notice:
          "Vista local en desarrollo. Las promociones aun no se aplican al flujo de ventas.",
      },
      {
        key: "usuarios",
        label: "Usuarios",
        icon: "pi pi-users",
        desc: "Perfiles, roles, accesos y permisos por usuario.",
        status: "functional",
        refreshable: true,
      },
      {
        key: "roles",
        label: "Roles",
        icon: "pi pi-sitemap",
        desc: "Roles operativos y permisos base del negocio.",
        status: "functional",
        refreshable: true,
      },
    ],
  },
  {
    group: "Finanzas",
    items: [
      {
        key: "impuestos",
        label: "Impuestos",
        icon: "pi pi-percentage",
        desc: "IVA, redondeos y reglas fiscales.",
        status: "coming",
        placeholder:
          "Aqui se configuraran IVA, redondeos y reglas fiscales del punto de venta.",
      },
      {
        key: "pagos",
        label: "Pagos / Terminal",
        icon: "pi pi-credit-card",
        desc: "Metodos de pago, comisiones, bancos y TPV.",
        status: "coming",
        placeholder:
          "Aqui se configuraran metodos de pago, terminales, comisiones y transferencias.",
      },
    ],
  },
  {
    group: "Sistema",
    items: [
      {
        key: "notificaciones",
        label: "Notificaciones",
        icon: "pi pi-bell",
        desc: "Alertas, canales y reglas operativas.",
        status: "coming",
        placeholder:
          "Aqui se configuraran alertas de stock, cortes, ventas y avisos del sistema.",
      },
      {
        key: "apariencia",
        label: "Apariencia",
        icon: "pi pi-palette",
        desc: "Ticket, logo, textos y formatos visuales.",
        status: "coming",
        placeholder:
          "Aqui se configuraran logo, ticket, textos impresos y formatos visibles.",
      },
      {
        key: "auditoria",
        label: "Auditoria",
        icon: "pi pi-shield",
        desc: "Actividad, cambios y bitacora del sistema.",
        status: "coming",
        placeholder:
          "Aqui se consultara actividad por usuario, cambios criticos y bitacora.",
      },
      {
        key: "overrides",
        label: "Overrides",
        icon: "pi pi-user-edit",
        desc: "Excepciones puntuales de permisos por usuario.",
        status: "functional",
        refreshable: true,
      },
      {
        key: "integraciones",
        label: "Integraciones",
        icon: "pi pi-link",
        desc: "API keys, webhooks y conectores externos.",
        status: "coming",
        placeholder:
          "Aqui se administraran conectores, webhooks y llaves de integracion.",
      },
      {
        key: "exportar",
        label: "Exportar / Respaldo",
        icon: "pi pi-download",
        desc: "Exportaciones, respaldos y migraciones.",
        status: "disconnected",
        notice:
          "Vista existente sin generacion real de archivos ni respaldos conectados.",
      },
    ],
  },
];

export const QUICK_ACTIONS = [
  {
    key: "usuarios",
    label: "Usuarios",
    icon: "pi pi-users",
    target: "usuarios",
    status: "functional",
  },
  {
    key: "roles",
    label: "Roles",
    icon: "pi pi-sitemap",
    target: "roles",
    status: "functional",
  },
  {
    key: "overrides",
    label: "Overrides",
    icon: "pi pi-user-edit",
    target: "overrides",
    status: "functional",
  },
  {
    key: "respaldo",
    label: "Respaldo",
    icon: "pi pi-download",
    target: "exportar",
    status: "disconnected",
    disabled: true,
  },
  {
    key: "pagos",
    label: "Pagos",
    icon: "pi pi-credit-card",
    target: "pagos",
    status: "coming",
    disabled: true,
  },
];

export const flattenSections = (groups = CONFIG_SECTION_GROUPS) =>
  groups.flatMap((group) =>
    group.items.map((item) => ({
      ...item,
      group: group.group,
    }))
  );

export const getStatusConfig = (statusKey) =>
  CONFIG_STATUS[statusKey] || CONFIG_STATUS.coming;
