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

import "../../../style/components/Reportes/ReporteCompras.css";
import { APIfetchApi } from "../../../API/APIfetch";
import { endpoints } from "../../../API/api";

/* --- UTILS --- */
const money = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
const labelFrom = (arr, val) => arr.find(x => x.value === val)?.label || val;
const formatDate = (d, groupBy) => {
  if (!d) return ''; if (groupBy === 'year') return d.getFullYear().toString(); if (groupBy === 'month') return d.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' }); return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
};

const STATUS = [{ label: 'Pagada', value: 'PAID' }, { label: 'Pendiente', value: 'PENDING' }, { label: 'Cancelada', value: 'CANCELLED' }];
const BRANCHES = [{ label: 'Sucursal Centro', value: 'CENTRO' }, { label: 'Sucursal Norte', value: 'NORTE' }, { label: 'Sucursal Sur', value: 'SUR' }];
const CATEGORIES = [{ label: 'Insumos', value: 'INSUMOS' }, { label: 'Limpieza', value: 'LIMPIEZA' }, { label: 'PapelerÃƒÆ’Ã‚Â­a', value: 'PAPELERIA' }, { label: 'Mantenimiento', value: 'MANTENIMIENTO' }];
const SUPPLIERS = [{ label: 'Distribuidora Global', value: 'GLOBAL' }, { label: 'Suministros MX', value: 'SUMINISTROS' }, { label: 'TecnoEquip', value: 'TECNO' }];

const getPayloadData = async (response) => {
  if (!response?.ok) return [];
  const payload = await response.json();
  return Array.isArray(payload?.data) ? payload.data : [];
};

const toDate = (value) => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const providerName = (compra) =>
  compra?.idProveedor?.nombreProveedor ||
  compra?.idProveedor?.nombre ||
  compra?.IdProveedor?.nombreProveedor ||
  compra?.proveedor?.nombreProveedor ||
  "Sin proveedor";

const mapDetalle = (row) => ({
  idCompra: row?.compra?.idCompra,
  product: row?.producto?.nombreProducto || row?.producto?.nombre || "Compra",
  category: row?.producto?.categoria?.nombreCategoria || "",
});

/* --- MODALES --- */
function ModalDetalleTop({ open, product, onHide }) {
  if (!product) return null;
  return (
    <Dialog visible={open} onHide={onHide} modal draggable={false} className="rvx-dialog" header={`AnÃƒÆ’Ã‚Â¡lisis de Gasto (Salida de Dinero)`}>
      <div className="p-4">
        <div className="flex justify-content-between mb-4 align-items-center">
          <div className="flex align-items-center gap-2">
            <span className="rvx-tag" style={{ background: '#ef4444', color: '#fff', fontSize: '1rem', padding: '6px 12px' }}>#{product.rank}</span>
            <span className="text-xl font-bold">{product.name}</span>
          </div>
          <span className="text-2xl font-black" style={{ color: '#ef4444' }}>- {money(product.revenue)}</span>
        </div>
        <div className="grid grid-cols-2 gap-4 rvx-modal-inner-glass">
          <div><div className="text-xs font-bold text-gray-500 uppercase mb-1">CategorÃƒÆ’Ã‚Â­a</div><div className="font-bold text-gray-800">{product.categoryLabel}</div></div>
          <div><div className="text-xs font-bold text-gray-500 uppercase mb-1">Impacto en Egresos</div><span className="rvx-chip">{product.percent}% del gasto total</span></div>
          <div><div className="text-xs font-bold text-gray-500 uppercase mb-1">Compras Generadas</div><div className="font-bold text-gray-800">{product.orders} Pedidos</div></div>
          <div><div className="text-xs font-bold text-gray-500 uppercase mb-1">Costo Promedio</div><div className="font-bold text-gray-800">{money(product.avgTicket)} / orden</div></div>
        </div>
      </div>
    </Dialog>
  );
}

function ModalRankingCompleto({ open, title, data, color, onHide }) {
  if (!open) return null;
  return (
    <Dialog visible={open} onHide={onHide} modal draggable={false} className="rvx-dialog" header={title}>
      <div className="p-4" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        {data.map((item, index) => (
          <div key={item.name} className="rvx-ranking-item" style={{ marginBottom: '20px' }}>
            <div className="rvx-ranking-info">
              <span className="rvx-ranking-name"><span className="rvx-ranking-badge">#{index + 1}</span> {item.name}</span>
              <span className="rvx-ranking-val" style={{ color: '#ef4444' }}>{money(item.revenue)}</span>
            </div>
            <div className="rvx-top-bar-bg" style={{ height: '8px' }}>
              <div className="rvx-top-bar-fill" style={{ width: `${item.percent}%`, background: color }}></div>
            </div>
          </div>
        ))}
      </div>
    </Dialog>
  );
}

export default function ReporteCompras() {
  const toast = useRef(null);
  const [data, setData] = useState([]);
  const [groupBy] = useState('week');
  const [q, setQ] = useState("");
  const [range, setRange] = useState(null);
  const [selStatus, setSelStatus] = useState([]);
  const [selBranch, setSelBranch] = useState(null);
  const [selCategory, setSelCategory] = useState(null);
  const [selSupplier, setSelSupplier] = useState(null);

  const [mainTabIndex, setMainTabIndex] = useState(0);
  const [subTabIndex, setSubTabIndex] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  const [topProductDetail, setTopProductDetail] = useState({ open: false, product: null });
  const [rankingListDetail, setRankingListDetail] = useState({ open: false, type: null });

  useEffect(() => {
    let activo = true;
    const api = new APIfetchApi();

    async function cargarCompras() {
      try {
        const [comprasResponse, detallesResponse] = await Promise.all([
          api.fetchApi({}, "GET", undefined, endpoints.compras),
          api.fetchApi({}, "GET", undefined, endpoints.compraDetalle),
        ]);
        const compras = await getPayloadData(comprasResponse);
        const detalles = (await getPayloadData(detallesResponse)).map(mapDetalle);
        const detallesPorCompra = new Map();

        detalles.forEach((detalle) => {
          if (!detallesPorCompra.has(detalle.idCompra)) detallesPorCompra.set(detalle.idCompra, []);
          detallesPorCompra.get(detalle.idCompra).push(detalle);
        });

        const rows = compras.map((compra) => {
          const compraDetalles = detallesPorCompra.get(compra?.idCompra) || [];
          const principal = compraDetalles[0] || {};
          return {
            id: compra?.idCompra,
            folio: compra?.idCompra ? `OC-${compra.idCompra}` : "",
            date: toDate(compra?.fechaCompra || compra?.fechaCreacion),
            supplier: providerName(compra),
            category: principal.category || "",
            mainProduct: principal.product || "Compra",
            status: "PAID",
            total: Number(compra?.totalCompra) || 0,
            branch: "",
          };
        });

        if (activo) setData(rows);
      } catch (error) {
        console.error("Error al cargar reporte de compras:", error);
        if (activo) setData([]);
      }
    }

    cargarCompras();
    return () => {
      activo = false;
    };
  }, []);

  const periodLabel = useMemo(() => {
    if (!range || !range[0]) return "HistÃƒÆ’Ã‚Â³rico Completo";
    const start = formatDate(range[0], groupBy);
    const end = range[1] ? formatDate(range[1], groupBy) : '...';
    return ((groupBy === 'year' || groupBy === 'month') && !range[1]) ? start : `${start} ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â ${end}`;
  }, [range, groupBy]);

  const PeriodBadge = () => (
    <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>
      <span style={{ background: 'rgba(255,255,255,0.6)', color: '#64748b', padding: '4px 12px', borderRadius: '99px', fontSize: '0.7rem', fontWeight: '700', border: '1px solid rgba(255,255,255,0.8)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <i className="pi pi-calendar" style={{ fontSize: '0.8rem' }}></i> {periodLabel}
      </span>
    </div>
  );

  const filtered = useMemo(() => {
    return data.filter(r => {
      let dateMatch = true;
      if (range && range[0]) {
        const rDate = new Date(r.date); rDate.setHours(0, 0, 0, 0);
        const sD = new Date(range[0]); sD.setHours(0, 0, 0, 0);
        if (rDate < sD) dateMatch = false;
        if (range[1]) { const eD = new Date(range[1]); eD.setHours(0, 0, 0, 0); if (rDate > eD) dateMatch = false; }
      }
      return (dateMatch && (!q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase())) && (!selStatus.length || selStatus.includes(r.status)) && (!selBranch || r.branch === selBranch) && (!selCategory || r.category === selCategory) && (!selSupplier || r.supplier === selSupplier));
    });
  }, [data, q, selStatus, selBranch, selCategory, selSupplier, range]);

  const kpis = useMemo(() => ({
    gross: filtered.reduce((s, r) => s + (r.status === 'PAID' ? r.total : 0), 0),
    orders: filtered.filter(r => r.status === 'PAID').length,
    avg: filtered.length ? filtered.reduce((s, r) => s + r.total, 0) / filtered.length : 0
  }), [filtered]);

  const stats = useMemo(() => {
    const prods = {}; const cats = {}; const supps = {};
    let total = 0;

    filtered.forEach(r => {
      if (r.status === 'PAID') {
        total += r.total;
        if (!prods[r.mainProduct]) prods[r.mainProduct] = { revenue: 0, orders: 0, category: r.category };
        prods[r.mainProduct].revenue += r.total; prods[r.mainProduct].orders += 1;

        const catName = labelFrom(CATEGORIES, r.category); cats[catName] = (cats[catName] || 0) + r.total;
        const suppName = labelFrom(SUPPLIERS, r.supplier); supps[suppName] = (supps[suppName] || 0) + r.total;
      }
    });

    const format = (obj) => Object.entries(obj).sort((a, b) => b[1].revenue || b[1] - (a[1].revenue || a[1]))
      .map(([name, d], index) => ({
        name, revenue: d.revenue || d, orders: d.orders,
        categoryLabel: labelFrom(CATEGORIES, d.category), avgTicket: (d.revenue || d) / (d.orders || 1),
        percent: total > 0 ? (((d.revenue || d) / total) * 100).toFixed(1) : 0, rank: index + 1
      }));

    return { products: format(prods).slice(0, 5), categories: format(cats), suppliers: format(supps) }; // ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ‚Â¥ Top 5 productos
  }, [filtered]);

  const chartData = useMemo(() => {
    const lineData = {};
    filtered.sort((a, b) => a.date - b.date).forEach(r => {
      const key = r.date.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
      lineData[key] = (lineData[key] || 0) + r.total;
    });
    return {
      line: { labels: Object.keys(lineData), datasets: [{ label: 'Salidas de Dinero', data: Object.values(lineData), borderColor: '#ef4444', fill: true, backgroundColor: 'rgba(239, 68, 68, 0.05)', tension: 0.3 }] },
      pieCats: { labels: stats.categories.map(c => c.name), datasets: [{ data: stats.categories.map(c => c.revenue), backgroundColor: ['#0a7463', '#0f172a', '#eab308', '#14b8a6'], borderWidth: 0 }] },
      pieSupps: { labels: stats.suppliers.map(c => c.name), datasets: [{ data: stats.suppliers.map(c => c.revenue), backgroundColor: ['#334155', '#64748b', '#94a3b8', '#cbd5e1'], borderWidth: 0 }] }
    };
  }, [filtered, stats]);

  const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(0,0,0,0.05)' } } } };
  const pieOptions = { responsive: true, maintainAspectRatio: false, cutout: '55%', plugins: { legend: { position: 'bottom' } } };
  const statusSeverity = (s) => (s === "PAID" ? "success" : s === "CANCELLED" ? "danger" : "warning");

  return (
    <Shell>
      <div className="rvx-page">
        <Toast ref={toast} />
        <div className="rvx-header-bar"><div className="rvx-header-title"><i className="pi pi-shopping-cart" /> REPORTE DE COMPRAS</div></div>

        <div className="rvx-layout-grid">
          <div className="rvx-sidebar">
            <div className="rvx-sidebar-label"><i className="pi pi-filter" /> Filtros</div>
            <span className="p-input-icon-left w-full"><i className="pi pi-search" /><InputText value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar..." className="w-full" /></span>
            <div className="mt-2"><label>Periodo</label><Calendar value={range} onChange={e => setRange(e.value)} selectionMode="range" placeholder="Seleccionar..." className="rvx-ctl" readOnlyInput /></div>
            <div className="border-t border-white/30 pt-4 mt-2"><label>Sucursal</label><Dropdown value={selBranch} onChange={e => setSelBranch(e.value)} options={BRANCHES} placeholder="Todas" className="rvx-ctl" showClear /></div>
            <div className="mt-2"><label>CategorÃƒÆ’Ã‚Â­a</label><Dropdown value={selCategory} onChange={e => setSelCategory(e.value)} options={CATEGORIES} placeholder="Todas" className="rvx-ctl" showClear /></div>
            <div className="mt-2"><label>Proveedor</label><Dropdown value={selSupplier} onChange={e => setSelSupplier(e.value)} options={SUPPLIERS} placeholder="Todos" className="rvx-ctl" showClear /></div>
            <div className="mt-2"><label>Estatus</label><MultiSelect value={selStatus} onChange={e => setSelStatus(e.value)} options={STATUS} placeholder="Todos" className="rvx-ctl w-full" display="chip" /></div>
            <div className="mt-auto pt-4"><Button icon="pi pi-filter-slash" label="Limpiar" className="rvx-btn rvx-btn--ghost" onClick={() => { setQ(""); setRange(null); setSelStatus([]); setSelBranch(null); setSelCategory(null); setSelSupplier(null); }} /></div>
          </div>

          <div className="rvx-content">
            <div className="rvx-kpis">
              <div className="rvx-kpi"><div className="rvx-kpiLabel">Total Gastado</div><div className="rvx-kpiValue" style={{ color: '#ef4444' }}>-{money(kpis.gross)}</div></div>
              <div className="rvx-kpi"><div className="rvx-kpiLabel">ÃƒÆ’Ã¢â‚¬Å“rdenes Generadas</div><div className="rvx-kpiValue">{kpis.orders}</div></div>
              <div className="rvx-kpi"><div className="rvx-kpiLabel">Ticket Promedio</div><div className="rvx-kpiValue">{money(kpis.avg)}</div></div>
            </div>

            <div className="rvx-main-card">
              <div className="rvx-card-action-btn"><Button icon="pi pi-download" className="rvx-btn rvx-btn--primary rvx-btn-icon-only" onClick={() => toast.current.show({ severity: 'success', summary: 'Descargando', detail: 'Generando PDF...' })} /></div>

              <TabView activeIndex={mainTabIndex} onTabChange={e => setMainTabIndex(e.index)} className="rvx-tabview">
                <TabPanel header="AnÃƒÆ’Ã‚Â¡lisis Financiero" leftIcon="pi pi-chart-line">
                  <TabView activeIndex={subTabIndex} onTabChange={e => setSubTabIndex(e.index)} className="rvx-tabview rvx-sub-tabview">
                    <TabPanel header="Tendencia de Gasto"><div className="rvx-chart-container"><div className="rvx-minimal-title">EvoluciÃƒÆ’Ã‚Â³n de Salidas de Dinero</div><PeriodBadge /><div className="rvx-chart-full"><Chart type="line" data={chartData.line} options={chartOptions} style={{ height: '320px' }} /></div></div></TabPanel>
                    <TabPanel header="Gastos por CategorÃƒÆ’Ã‚Â­a">
                      <div className="rvx-chart-container"><div className="rvx-minimal-title">Fugas de Capital por CategorÃƒÆ’Ã‚Â­a</div><PeriodBadge />
                        <div className="rvx-split-view">
                          <div className="rvx-split-left"><DataTable value={stats.categories} className="rvx-table" scrollable scrollHeight="320px"><Column field="name" header="CategorÃƒÆ’Ã‚Â­a" /><Column field="revenue" header="Monto Gastado" body={r => <span className="font-bold text-red-500">{money(r.revenue)}</span>} /><Column field="percent" header="Impacto" body={r => <span className="rvx-chip">{r.percent}%</span>} align="center" /></DataTable></div>
                          <div className="rvx-split-right"><div className="rvx-chart-full" style={{ height: '320px', minHeight: '320px', width: '90%' }}><Chart type="doughnut" data={chartData.pieCats} options={pieOptions} /></div></div>
                        </div></div>
                    </TabPanel>
                    <TabPanel header="Desembolso por Proveedor">
                      <div className="rvx-chart-container"><div className="rvx-minimal-title">Gastos por Proveedor</div><PeriodBadge />
                        <div className="rvx-split-view">
                          <div className="rvx-split-left"><DataTable value={stats.suppliers} className="rvx-table" scrollable scrollHeight="320px"><Column field="name" header="Proveedor" /><Column field="revenue" header="Monto Gastado" body={r => <span className="font-bold text-red-500">{money(r.revenue)}</span>} /><Column field="percent" header="Impacto" body={r => <span className="rvx-chip">{r.percent}%</span>} align="center" /></DataTable></div>
                          <div className="rvx-split-right"><div className="rvx-chart-full" style={{ height: '320px', minHeight: '320px', width: '90%' }}><Chart type="doughnut" data={chartData.pieSupps} options={pieOptions} /></div></div>
                        </div></div>
                    </TabPanel>
                  </TabView>
                </TabPanel>

                {/* ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ‚Â¥ RANKINGS ENFOCADOS EN SALIDAS DE DINERO */}
                <TabPanel header="Fugas y Rankings" leftIcon="pi pi-star">
                  <div className="rvx-minimal-title" style={{ textAlign: 'left', marginBottom: '10px', fontSize: '1.1rem' }}>Top 5 Productos de Mayor Gasto</div>
                  <div className="rvx-top-grid" style={{ marginBottom: '30px' }}>
                    {stats.products.map(p => (
                      <div key={p.name} className={`rvx-top-card rvx-top-card--rank-${p.rank}`} onClick={() => setTopProductDetail({ open: true, product: p })}>
                        <div className="rvx-top-rank" style={{ color: 'rgba(239, 68, 68, 0.05)' }}>#{p.rank}</div>
                        <div className="rvx-top-info"><span className="rvx-top-name">{p.name}</span><span className="rvx-top-revenue" style={{ color: '#ef4444' }}>{money(p.revenue)}</span></div>
                        <div className="rvx-top-bar-container"><div className="rvx-top-meta"><span>Impacto Total</span><span>{p.percent}%</span></div><div className="rvx-top-bar-bg"><div className="rvx-top-bar-fill" style={{ width: `${p.percent}%`, background: '#ef4444' }}></div></div></div>
                      </div>
                    ))}
                  </div>

                  <div className="rvx-ranking-container">
                    <div className="rvx-ranking-box" onClick={() => setRankingListDetail({ open: true, type: 'supps' })}>
                      <div className="rvx-ranking-title"><i className="pi pi-building" style={{ color: 'var(--rvx-brand)' }} /> Proveedores Principales (Mayores Salidas)</div>
                      {stats.suppliers.slice(0, 3).map(s => (
                        <div key={s.name} className="rvx-ranking-item">
                          <div className="rvx-ranking-info"><span className="rvx-ranking-name"><span className="rvx-ranking-badge">#{s.rank}</span> {s.name}</span><span className="rvx-ranking-val" style={{ color: '#ef4444' }}>{money(s.revenue)}</span></div>
                          <div className="rvx-top-bar-bg" style={{ height: '6px' }}><div className="rvx-top-bar-fill" style={{ width: `${s.percent}%`, background: 'var(--rvx-brand)' }}></div></div>
                        </div>
                      ))}
                      <div className="mt-3 text-center text-sm font-bold" style={{ color: 'var(--rvx-brand)' }}>+ Ver todos los proveedores</div>
                    </div>
                    <div className="rvx-ranking-box" onClick={() => setRankingListDetail({ open: true, type: 'cats' })}>
                      <div className="rvx-ranking-title"><i className="pi pi-tags" style={{ color: '#eab308' }} /> CategorÃƒÆ’Ã‚Â­as de Mayor Impacto</div>
                      {stats.categories.slice(0, 3).map(c => (
                        <div key={c.name} className="rvx-ranking-item">
                          <div className="rvx-ranking-info"><span className="rvx-ranking-name"><span className="rvx-ranking-badge">#{c.rank}</span> {c.name}</span><span className="rvx-ranking-val" style={{ color: '#ef4444' }}>{money(c.revenue)}</span></div>
                          <div className="rvx-top-bar-bg" style={{ height: '6px' }}><div className="rvx-top-bar-fill" style={{ width: `${c.percent}%`, background: '#eab308' }}></div></div>
                        </div>
                      ))}
                      <div className="mt-3 text-center text-sm font-bold" style={{ color: '#eab308' }}>+ Ver todas las categorÃƒÆ’Ã‚Â­as</div>
                    </div>
                  </div>
                </TabPanel>

                <TabPanel header="Detallado" leftIcon="pi pi-list">
                  <div className="rvx-tableHead"><div className="rvx-tableTitle"><span>Listado de Compras y Egresos</span></div><Dropdown value={rowsPerPage} onChange={(e) => setRowsPerPage(e.value)} options={[15, 30, 50]} className="rvx-rowsSel" /></div>
                  <DataTable value={filtered} paginator rows={rowsPerPage} className="rvx-table" scrollable scrollHeight="400px">
                    <Column field="folio" header="Folio" body={r => <span className="rvx-chip">{r.folio}</span>} />
                    <Column field="date" header="Fecha" body={r => r.date.toLocaleDateString()} />
                    <Column field="supplier" header="Proveedor" body={r => labelFrom(SUPPLIERS, r.supplier)} />
                    <Column field="mainProduct" header="Producto / Concepto" />
                    <Column field="status" header="Estatus" body={r => <Tag severity={statusSeverity(r.status)} value={r.status} className="rvx-tag" />} />
                    <Column field="total" header="Total" body={r => <span className="font-bold text-red-500">-{money(r.total)}</span>} align="right" />
                  </DataTable>
                </TabPanel>
              </TabView>
            </div>
          </div>
        </div>

        {/* Modales Renderizados */}
        <ModalDetalleTop open={topProductDetail.open} product={topProductDetail.product} onHide={() => setTopProductDetail({ open: false, product: null })} />
        <ModalRankingCompleto
          open={rankingListDetail.open}
          title={rankingListDetail.type === 'supps' ? 'Ranking: Fuga por Proveedores' : 'Ranking: Fuga por CategorÃƒÆ’Ã‚Â­as'}
          data={rankingListDetail.type === 'supps' ? stats.suppliers : stats.categories}
          color={rankingListDetail.type === 'supps' ? 'var(--rvx-brand)' : '#eab308'}
          onHide={() => setRankingListDetail({ open: false, type: null })}
        />
      </div>
    </Shell>
  );
}
