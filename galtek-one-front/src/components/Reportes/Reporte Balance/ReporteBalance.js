import React, { useEffect, useMemo, useRef, useState } from "react";
import Shell from "../../common/Shell";
import { Chart } from "primereact/chart";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { MultiSelect } from "primereact/multiselect";
import { Calendar } from "primereact/calendar";
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
import { TabView, TabPanel } from "primereact/tabview";
import "chart.js/auto";

import "../../../style/components/Reportes/ReporteBalance.css";
import { APIfetchApi } from "../../../API/APIfetch";
import { endpoints } from "../../../API/api";

/* --- UTILS --- */
const money = (n) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    n,
  );
const labelFrom = (arr, val) => arr.find((x) => x.value === val)?.label || val;
const formatDate = (d, groupBy) => {
  if (!d) return "";
  if (groupBy === "year") return d.getFullYear().toString();
  if (groupBy === "month")
    return d.toLocaleDateString("es-MX", { month: "short", year: "numeric" });
  return d.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const TIME_GROUPS = [
  { label: "Por Semana", value: "week" },
  { label: "Por Mes", value: "month" },
  { label: "Por AÃ±o", value: "year" },
];
const TRANSACTION_TYPES = [
  { label: "Ingreso", value: "INCOME" },
  { label: "Egreso", value: "EXPENSE" },
];
const BRANCHES = [
  { label: "Sucursal Centro", value: "CENTRO" },
  { label: "Sucursal Norte", value: "NORTE" },
  { label: "Sucursal Sur", value: "SUR" },
];
const CATEGORIES = [
  { label: "Bebidas", value: "BEBIDAS" },
  { label: "Botanas", value: "BOTANAS" },
  { label: "LÃ¡cteos", value: "LACTEOS" },
  { label: "Gastos Operativos", value: "OPERATIVO" },
];

const getPayloadData = async (response) => {
  if (!response?.ok) return null;
  const payload = await response.json();
  return payload?.data || null;
};

const toDate = (value) => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatDateParam = (date) => date.toISOString().slice(0, 10);

const mapReporteGanancias = (reporte) => {
  if (!reporte) return [];
  const fecha = toDate(reporte.hasta || reporte.desde);
  const detalles = Array.isArray(reporte.detallesPorProducto) ? reporte.detallesPorProducto : [];

  if (detalles.length === 0) {
    const rows = [];
    const ventaBruta = toNumber(reporte.ventaBruta);
    const costoTotal = toNumber(reporte.costoTotal);
    if (ventaBruta > 0) {
      rows.push({
        id: "income-total",
        folio: "IN-TOTAL",
        date: fecha,
        type: "INCOME",
        category: "",
        mainProduct: "Ventas",
        concept: "Ingreso por ventas",
        branch: "",
        amount: ventaBruta,
        status: "APPLIED",
      });
    }
    if (costoTotal > 0) {
      rows.push({
        id: "expense-total",
        folio: "EG-TOTAL",
        date: fecha,
        type: "EXPENSE",
        category: "",
        mainProduct: "Costos",
        concept: "Costo historico de ventas",
        branch: "",
        amount: costoTotal,
        status: "APPLIED",
      });
    }
    return rows;
  }

  return detalles.flatMap((detalle) => {
    const id = detalle.idProducto || detalle.nombreProducto;
    const nombre = detalle.nombreProducto || "Producto";
    const ingreso = toNumber(detalle.ingresoVenta);
    const costo = toNumber(detalle.costoHistorico);
    const rows = [];

    if (ingreso > 0) {
      rows.push({
        id: `income-${id}`,
        folio: `IN-${id}`,
        date: fecha,
        type: "INCOME",
        category: "",
        mainProduct: nombre,
        concept: `Ingreso - ${nombre}`,
        branch: "",
        amount: ingreso,
        status: "APPLIED",
      });
    }

    if (costo > 0) {
      rows.push({
        id: `expense-${id}`,
        folio: `EG-${id}`,
        date: fecha,
        type: "EXPENSE",
        category: "",
        mainProduct: nombre,
        concept: `Costo - ${nombre}`,
        branch: "",
        amount: costo,
        status: "APPLIED",
      });
    }

    return rows;
  });
};

function ModalDetalleRendimiento({ open, product, onHide }) {
  if (!product) return null;
  return (
    <Dialog
      visible={open}
      onHide={onHide}
      modal
      draggable={false}
      className="rvx-dialog"
      header={`AnÃ¡lisis de Rendimiento`}
    >
      <div className="p-4">
        <div className="flex justify-content-between mb-4 align-items-center">
          <div className="flex align-items-center gap-2">
            <span
              className="rvx-tag"
              style={{
                background: "var(--rvx-net)",
                color: "#fff",
                fontSize: "1rem",
                padding: "6px 12px",
              }}
            >
              #{product.rank}
            </span>
            <span className="text-xl font-bold">{product.name}</span>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-gray-500 uppercase">
              Utilidad Neta
            </div>
            <span
              className="text-2xl font-black"
              style={{ color: "var(--rvx-net)" }}
            >
              {money(product.rendimiento)}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 rvx-modal-inner-glass">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase mb-1">
              CategorÃ­a
            </div>
            <div className="font-bold text-gray-800">
              {product.categoryLabel}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase mb-1">
              Margen de Ganancia
            </div>
            <span className="rvx-chip">{product.margin}%</span>
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase mb-1">
              Total Ingresos Generados
            </div>
            <div className="font-bold" style={{ color: "var(--rvx-income)" }}>
              + {money(product.income)}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase mb-1">
              Total Costos/Egresos
            </div>
            <div className="font-bold" style={{ color: "var(--rvx-expense)" }}>
              - {money(product.expense)}
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

function ModalRankingCompleto({ open, title, data, color, onHide }) {
  if (!open) return null;
  return (
    <Dialog
      visible={open}
      onHide={onHide}
      modal
      draggable={false}
      className="rvx-dialog"
      header={title}
    >
      <div className="p-4" style={{ maxHeight: "60vh", overflowY: "auto" }}>
        {data.map((item, index) => (
          <div
            key={item.name}
            className="rvx-ranking-item"
            style={{ marginBottom: "20px" }}
          >
            <div className="rvx-ranking-info">
              <span className="rvx-ranking-name">
                <span className="rvx-ranking-badge">#{index + 1}</span>{" "}
                {item.name}
              </span>
              <span className="rvx-ranking-val">{money(item.rendimiento)}</span>
            </div>
            <div className="rvx-top-bar-bg" style={{ height: "8px" }}>
              <div
                className="rvx-top-bar-fill"
                style={{
                  width: `${Math.max(item.percent, 0)}%`,
                  background: color,
                }}
              ></div>
            </div>
            <div className="flex justify-content-between mt-1 px-1">
              <span className="text-xs text-green-600 font-bold">
                Ingreso: {money(item.income)}
              </span>
              <span className="text-xs text-red-500 font-bold">
                Egreso: {money(item.expense)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Dialog>
  );
}

export default function ReporteBalance() {
  const toast = useRef(null);
  const [data, setData] = useState([]);
  const [groupBy, setGroupBy] = useState("week");
  const [q, setQ] = useState("");
  const [range, setRange] = useState(null);
  const [selBranch, setSelBranch] = useState(null);
  const [selType, setSelType] = useState([]);
  const [mainTabIndex, setMainTabIndex] = useState(0);
  const [subTabIndex, setSubTabIndex] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [topDetail, setTopDetail] = useState({ open: false, product: null });
  const [rankingListDetail, setRankingListDetail] = useState({
    open: false,
    type: null,
  });

  useEffect(() => {
    let activo = true;
    const api = new APIfetchApi();

    async function cargarBalance() {
      try {
        const params = new URLSearchParams();
        if (range?.[0]) params.set("desde", formatDateParam(range[0]));
        if (range?.[1]) params.set("hasta", formatDateParam(range[1]));
        const query = params.toString();
        const url = query ? `${endpoints.reporteGanancias}?${query}` : endpoints.reporteGanancias;
        const response = await api.fetchApi({}, "GET", undefined, url);
        const reporte = await getPayloadData(response);
        if (activo) setData(mapReporteGanancias(reporte));
      } catch (error) {
        console.error("Error al cargar reporte de balance:", error);
        if (activo) setData([]);
      }
    }

    cargarBalance();
    return () => {
      activo = false;
    };
  }, [range]);

  const periodLabel = useMemo(() => {
    if (!range || !range[0]) return "HistÃ³rico Completo";
    const start = formatDate(range[0], groupBy);
    const end = range[1] ? formatDate(range[1], groupBy) : "...";
    return (groupBy === "year" || groupBy === "month") && !range[1]
      ? start
      : `${start} â€” ${end}`;
  }, [range, groupBy]);

  const PeriodBadge = () => (
    <div
      style={{
        marginBottom: "10px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          background: "rgba(255,255,255,0.6)",
          color: "#64748b",
          padding: "4px 12px",
          borderRadius: "99px",
          fontSize: "0.7rem",
          fontWeight: "700",
          border: "1px solid rgba(255,255,255,0.8)",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <i className="pi pi-calendar" style={{ fontSize: "0.8rem" }}></i>{" "}
        {periodLabel}
      </span>
    </div>
  );

  const filtered = useMemo(() => {
    return data.filter((r) => {
      let dateMatch = true;
      if (range && range[0]) {
        const rDate = new Date(r.date);
        rDate.setHours(0, 0, 0, 0);
        const sD = new Date(range[0]);
        sD.setHours(0, 0, 0, 0);
        if (rDate < sD) dateMatch = false;
        if (range[1]) {
          const eD = new Date(range[1]);
          eD.setHours(0, 0, 0, 0);
          if (rDate > eD) dateMatch = false;
        }
      }
      return (
        dateMatch &&
        (!q || r.concept.toLowerCase().includes(q.toLowerCase())) &&
        (!selBranch || r.branch === selBranch) &&
        (!selType.length || selType.includes(r.type))
      );
    });
  }, [data, q, range, selBranch, selType]);

  const kpis = useMemo(() => {
    const income = filtered.reduce(
      (s, r) => s + (r.type === "INCOME" ? r.amount : 0),
      0,
    );
    const expense = filtered.reduce(
      (s, r) => s + (r.type === "EXPENSE" ? r.amount : 0),
      0,
    );
    return { income, expense, net: income - expense };
  }, [filtered]);

  const advancedStats = useMemo(() => {
    const prods = {};
    const cats = {};
    filtered.forEach((r) => {
      if (!prods[r.mainProduct])
        prods[r.mainProduct] = { income: 0, expense: 0, category: r.category };
      if (r.type === "INCOME") prods[r.mainProduct].income += r.amount;
      else prods[r.mainProduct].expense += r.amount;
      const catName = labelFrom(CATEGORIES, r.category) || r.category;
      if (!cats[catName]) cats[catName] = { income: 0, expense: 0 };
      if (r.type === "INCOME") cats[catName].income += r.amount;
      else cats[catName].expense += r.amount;
    });

    const formatRank = (obj) => {
      let totalNet = 0;
      const mapped = Object.entries(obj)
        .map(([name, data]) => {
          const rendimiento = data.income - data.expense;
          if (rendimiento > 0) totalNet += rendimiento;
          return {
            name,
            income: data.income,
            expense: data.expense,
            rendimiento,
            categoryLabel: labelFrom(CATEGORIES, data.category) || name,
            margin:
              data.income > 0
                ? ((rendimiento / data.income) * 100).toFixed(1)
                : 0,
          };
        })
        .sort((a, b) => b.rendimiento - a.rendimiento);
      return mapped.map((item, index) => ({
        ...item,
        rank: index + 1,
        percent:
          totalNet > 0 && item.rendimiento > 0
            ? ((item.rendimiento / totalNet) * 100).toFixed(1)
            : 0,
      }));
    };
    return {
      products: formatRank(prods).slice(0, 5),
      categories: formatRank(cats),
    };
  }, [filtered]);

  const categoryStats = useMemo(() => {
    const tableData = advancedStats.categories;
    const pieColors = ["#0a7463", "#0f172a", "#eab308", "#14b8a6", "#94a3b8"]; // ðŸ”¥ Colores ajustados
    const positiveCats = tableData.filter((c) => c.rendimiento > 0);
    const chartDataObj = {
      labels: positiveCats.map((c) => c.name),
      datasets: [
        {
          data: positiveCats.map((c) => c.rendimiento),
          backgroundColor: pieColors,
          borderWidth: 0,
        },
      ],
    };
    return { tableData, chartDataObj };
  }, [advancedStats]);

  const chartData = useMemo(() => {
    const groupData = {};
    const sorted = [...filtered].sort((a, b) => a.date - b.date);
    sorted.forEach((r) => {
      let key = "";
      const d = r.date;
      if (groupBy === "week") {
        const firstDay = new Date(d.getFullYear(), 0, 1);
        const pastDays = (d - firstDay) / 86400000;
        const weekNum = Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
        key = `S${weekNum}`;
      } else if (groupBy === "month")
        key = d.toLocaleDateString("es-MX", {
          month: "short",
          year: "2-digit",
        });
      else if (groupBy === "year") key = d.getFullYear().toString();
      else key = d.getDate() + "/" + (d.getMonth() + 1);
      if (!groupData[key]) groupData[key] = { income: 0, expense: 0 };
      if (r.type === "INCOME") groupData[key].income += r.amount;
      else groupData[key].expense += r.amount;
    });

    const labels = Object.keys(groupData);
    const incomeData = Object.values(groupData).map((v) => v.income);
    const expenseData = Object.values(groupData).map((v) => v.expense);
    const netData = Object.values(groupData).map((v) => v.income - v.expense);

    return {
      comparison: {
        labels,
        datasets: [
          {
            label: "Ingresos",
            data: incomeData,
            backgroundColor: "#0a7463",
            borderRadius: 4,
          },
          {
            label: "Egresos",
            data: expenseData,
            backgroundColor: "#ef4444",
            borderRadius: 4,
          },
        ],
      },
      profitTrend: {
        labels,
        datasets: [
          {
            label: "Tendencia Utilidad",
            data: netData,
            borderColor: "#0a7463",
            fill: true,
            backgroundColor: "rgba(10, 116, 99, 0.1)",
            tension: 0.4,
          },
        ],
      }, // ðŸ”¥ Color corregido a verde
    };
  }, [filtered, groupBy]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top" } },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: "rgba(0,0,0,0.05)" } },
    },
  };
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "55%",
    plugins: { legend: { position: "bottom" } },
  };
  const typeTemplate = (t) => {
    const isInc = t === "INCOME";
    return (
      <Tag
        severity={isInc ? "success" : "danger"}
        value={isInc ? "INGRESO" : "EGRESO"}
        icon={isInc ? "pi pi-arrow-up" : "pi pi-arrow-down"}
        className="rvx-tag"
        style={{
          background: isInc
            ? "rgba(10, 116, 99, 0.1)"
            : "rgba(239, 68, 68, 0.1)",
          color: isInc ? "#0a7463" : "#ef4444",
          border: "none",
        }}
      />
    );
  };

  return (
    <Shell>
      <div className="rvx-page">
        <Toast ref={toast} />

        <div className="rvx-header-bar">
          <div className="rvx-header-title">
            <i
              className="pi pi-briefcase"
              style={{ color: "var(--rvx-net)" }}
            />
            <span style={{ color: "var(--rvx-net)" }}>REPORTE DE BALANCE</span>
          </div>
        </div>

        <div className="rvx-layout-grid">
          <div className="rvx-sidebar">
            <div className="rvx-sidebar-label">
              <i className="pi pi-filter" /> Filtros Financieros
            </div>
            <span className="p-input-icon-left w-full">
              <i className="pi pi-search" />
              <InputText
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar concepto..."
                className="w-full"
              />
            </span>
            <div className="mt-2">
              <label>Agrupar Por</label>
              <Dropdown
                value={groupBy}
                onChange={(e) => setGroupBy(e.value)}
                options={TIME_GROUPS}
                className="rvx-ctl w-full"
              />
            </div>
            <div className="mt-2">
              <label>Rango Fechas</label>
              <Calendar
                value={range}
                onChange={(e) => setRange(e.value)}
                selectionMode="range"
                placeholder="Seleccionar..."
                className="rvx-ctl"
                readOnlyInput
              />
            </div>
            <div className="border-t border-gray-300 pt-4 mt-2">
              <label>Sucursal</label>
              <Dropdown
                value={selBranch}
                onChange={(e) => setSelBranch(e.value)}
                options={BRANCHES}
                placeholder="Todas"
                className="rvx-ctl"
                showClear
              />
            </div>
            <div className="mt-2">
              <label>Movimiento</label>
              <MultiSelect
                value={selType}
                onChange={(e) => setSelType(e.value)}
                options={TRANSACTION_TYPES}
                placeholder="Todos"
                className="rvx-ctl w-full"
                display="chip"
              />
            </div>
            <div className="mt-auto pt-4">
              <Button
                icon="pi pi-filter-slash"
                label="Limpiar"
                className="rvx-btn rvx-btn--ghost"
                onClick={() => {
                  setQ("");
                  setRange(null);
                  setSelBranch(null);
                  setSelType([]);
                  setGroupBy("week");
                }}
              />
            </div>
          </div>

          <div className="rvx-content">
            <div className="rvx-kpis">
              <div className="rvx-kpi">
                <div className="rvx-kpiLabel">Total Ingresos</div>
                <div className="rvx-kpiValue rvx-text-income">
                  +{money(kpis.income)}
                </div>
              </div>
              <div className="rvx-kpi">
                <div className="rvx-kpiLabel">Total Egresos</div>
                <div className="rvx-kpiValue rvx-text-expense">
                  -{money(kpis.expense)}
                </div>
              </div>
              <div className="rvx-kpi">
                <div
                  className="rvx-kpiLabel"
                  style={{ color: "var(--rvx-net)" }}
                >
                  Utilidad Neta
                </div>
                <div
                  className={`rvx-kpiValue ${kpis.net >= 0 ? "rvx-text-net" : "rvx-text-expense"}`}
                >
                  {money(kpis.net)}
                </div>
              </div>
            </div>

            <div className="rvx-main-card">
              <div className="rvx-card-action-btn">
                <Button
                  icon="pi pi-file-excel"
                  className="rvx-btn rvx-btn--primary rvx-btn-icon-only"
                  style={{ background: "var(--rvx-net)" }}
                  tooltip="Exportar Excel"
                  tooltipOptions={{ position: "left" }}
                  onClick={() =>
                    toast.current.show({
                      severity: "success",
                      summary: "Exportando",
                      detail: "Generando Excel...",
                    })
                  }
                />
              </div>

              <TabView
                activeIndex={mainTabIndex}
                onTabChange={(e) => setMainTabIndex(e.index)}
                className="rvx-tabview rvx-main-tabs"
              >
                <TabPanel
                  header="AnÃ¡lisis Financiero"
                  leftIcon="pi pi-chart-line"
                >
                  <TabView
                    activeIndex={subTabIndex}
                    onTabChange={(e) => setSubTabIndex(e.index)}
                    className="rvx-tabview rvx-sub-tabview rvx-sub-tabs"
                  >
                    <TabPanel header="Comparativa Global">
                      <div className="rvx-chart-container">
                        <div className="rvx-minimal-title">
                          Ingresos vs Egresos
                        </div>
                        <PeriodBadge />
                        <div className="rvx-chart-full">
                          <Chart
                            type="bar"
                            data={chartData.comparison}
                            options={chartOptions}
                            style={{ width: "100%", height: "100%" }}
                          />
                        </div>
                      </div>
                    </TabPanel>
                    <TabPanel header="Tendencia Utilidad">
                      <div className="rvx-chart-container">
                        <div className="rvx-minimal-title">
                          EvoluciÃ³n de Ganancias Netas
                        </div>
                        <PeriodBadge />
                        <div className="rvx-chart-full">
                          <Chart
                            type="line"
                            data={chartData.profitTrend}
                            options={chartOptions}
                            style={{ width: "100%", height: "100%" }}
                          />
                        </div>
                      </div>
                    </TabPanel>
                    <TabPanel header="Rentabilidad por CategorÃ­a">
                      <div className="rvx-chart-container">
                        <div className="rvx-minimal-title">
                          Utilidad Neta por CategorÃ­a
                        </div>
                        <PeriodBadge />
                        <div className="rvx-split-view">
                          <div className="rvx-split-left">
                            <DataTable
                              value={categoryStats.tableData}
                              className="rvx-table"
                              scrollable
                              scrollHeight="320px"
                            >
                              <Column field="name" header="CategorÃ­a" />
                              <Column
                                field="rendimiento"
                                header="Utilidad"
                                body={(r) => (
                                  <span
                                    className="font-bold"
                                    style={{
                                      color:
                                        r.rendimiento >= 0
                                          ? "var(--rvx-net)"
                                          : "var(--rvx-expense)",
                                    }}
                                  >
                                    {money(r.rendimiento)}
                                  </span>
                                )}
                              />
                              <Column
                                field="margin"
                                header="Margen"
                                body={(r) => (
                                  <span className="rvx-chip">{r.margin}%</span>
                                )}
                                align="center"
                              />
                            </DataTable>
                          </div>
                          <div className="rvx-split-right">
                            <div
                              className="rvx-chart-full"
                              style={{
                                height: "320px",
                                minHeight: "320px",
                                width: "90%",
                              }}
                            >
                              {categoryStats.chartDataObj.labels.length > 0 ? (
                                <Chart
                                  type="doughnut"
                                  data={categoryStats.chartDataObj}
                                  options={pieOptions}
                                  style={{ width: "100%", height: "100%" }}
                                />
                              ) : (
                                <div className="flex h-full align-items-center justify-content-center text-gray-500 font-bold">
                                  No hay utilidades positivas
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabPanel>
                  </TabView>
                </TabPanel>

                <TabPanel header="Rankings y Tops" leftIcon="pi pi-star">
                  <div
                    className="rvx-minimal-title"
                    style={{
                      textAlign: "left",
                      marginBottom: "10px",
                      fontSize: "1.1rem",
                    }}
                  >
                    Top 5 Productos MÃ¡s Rentables
                  </div>
                  <div
                    className="rvx-top-grid"
                    style={{ marginBottom: "30px" }}
                  >
                    {advancedStats.products.map((prod) => (
                      <div
                        key={prod.name}
                        className={`rvx-top-card rvx-top-card--rank-${prod.rank}`}
                        onClick={() =>
                          setTopDetail({ open: true, product: prod })
                        }
                      >
                        <div className="rvx-top-rank">#{prod.rank}</div>
                        <div className="rvx-top-info">
                          <span className="rvx-top-name" title={prod.name}>
                            {prod.name}
                          </span>
                          <span
                            className="rvx-top-revenue"
                            style={{ color: "var(--rvx-net)" }}
                          >
                            {money(prod.rendimiento)}
                          </span>
                        </div>
                        <div className="rvx-top-bar-container">
                          <div className="rvx-top-meta">
                            <span>AportaciÃ³n Utilidad</span>
                            <span>{prod.percent}%</span>
                          </div>
                          <div className="rvx-top-bar-bg">
                            <div
                              className="rvx-top-bar-fill"
                              style={{
                                width: `${Math.max(prod.percent, 0)}%`,
                                background: "var(--rvx-net)",
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    className="rvx-ranking-container"
                    style={{ gridTemplateColumns: "1fr" }}
                  >
                    <div
                      className="rvx-ranking-box"
                      onClick={() =>
                        setRankingListDetail({ open: true, type: "categories" })
                      }
                    >
                      <div className="rvx-ranking-title">
                        <i
                          className="pi pi-tags"
                          style={{ color: "var(--rvx-brand)" }}
                        ></i>{" "}
                        CategorÃ­as con Mayor Rendimiento
                      </div>{" "}
                      {/* ðŸ”¥ Color Corregido */}
                      {advancedStats.categories.slice(0, 3).map((cat) => (
                        <div key={cat.name} className="rvx-ranking-item">
                          <div className="rvx-ranking-info">
                            <span className="rvx-ranking-name">
                              <span className="rvx-ranking-badge">
                                #{cat.rank}
                              </span>{" "}
                              {cat.name}
                            </span>
                            <span
                              className="rvx-ranking-val"
                              style={{ color: "var(--rvx-net)" }}
                            >
                              {money(cat.rendimiento)}
                            </span>
                          </div>
                          <div
                            className="rvx-top-bar-bg"
                            style={{ height: "6px" }}
                          >
                            <div
                              className="rvx-top-bar-fill"
                              style={{
                                width: `${Math.max(cat.percent, 0)}%`,
                                background: "var(--rvx-brand)",
                              }}
                            ></div>
                          </div>{" "}
                          {/* ðŸ”¥ Color Corregido */}
                        </div>
                      ))}
                      <div
                        className="mt-3 text-center text-sm font-bold"
                        style={{ color: "var(--rvx-brand)" }}
                      >
                        + Ver todas las categorÃ­as
                      </div>{" "}
                      {/* ðŸ”¥ Color Corregido */}
                    </div>
                  </div>
                </TabPanel>

                <TabPanel header="Movimientos Detallados" leftIcon="pi pi-list">
                  <div className="rvx-tableHead">
                    <div className="rvx-tableTitle">
                      <span>Detalle de Transacciones</span>
                    </div>
                    <Dropdown
                      value={rowsPerPage}
                      onChange={(e) => setRowsPerPage(e.value)}
                      options={[15, 30, 50]}
                      className="rvx-rowsSel"
                    />
                  </div>
                  <DataTable
                    value={filtered}
                    paginator
                    rows={rowsPerPage}
                    className="rvx-table"
                    scrollable
                    scrollHeight="400px"
                  >
                    <Column
                      field="folio"
                      header="Folio"
                      body={(r) => <span className="rvx-chip">{r.folio}</span>}
                      sortable
                    />
                    <Column
                      field="date"
                      header="Fecha"
                      body={(r) => r.date.toLocaleDateString()}
                      sortable
                    />
                    <Column
                      field="type"
                      header="Tipo"
                      body={(r) => typeTemplate(r.type)}
                      sortable
                    />
                    <Column field="concept" header="Concepto" sortable />
                    <Column field="branch" header="Sucursal" sortable />
                    <Column
                      field="amount"
                      header="Monto"
                      body={(r) => (
                        <span
                          style={{
                            color: r.type === "INCOME" ? "#0a7463" : "#ef4444",
                            fontWeight: 800,
                          }}
                        >
                          {r.type === "EXPENSE" ? "- " : ""}
                          {money(r.amount)}
                        </span>
                      )}
                      alignFrozen="right"
                      sortable
                    />
                  </DataTable>
                </TabPanel>
              </TabView>
            </div>
          </div>
        </div>

        <ModalDetalleRendimiento
          open={topDetail.open}
          product={topDetail.product}
          onHide={() => setTopDetail({ open: false, product: null })}
        />
        <ModalRankingCompleto
          open={rankingListDetail.open}
          title={"Ranking de Rendimiento por CategorÃ­as"}
          data={advancedStats.categories}
          color={"var(--rvx-brand)"}
          onHide={() => setRankingListDetail({ open: false, type: null })}
        />
      </div>
    </Shell>
  );
}
