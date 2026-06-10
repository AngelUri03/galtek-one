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

import "../../../style/components/Reportes/ReporteVentas.css";
import { APIfetchApi } from "../../../API/APIfetch";
import { endpoints } from "../../../API/api";

/* --- UTILS --- */
const money = (n) => new Intl.NumberFormat('es-MX', {style:'currency', currency:'MXN'}).format(n);
const labelFrom = (arr, val) => arr.find(x => x.value === val)?.label || val;
const formatDate = (d, groupBy) => {
    if(!d) return ''; if(groupBy === 'year') return d.getFullYear().toString(); if(groupBy === 'month') return d.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' }); return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
};

const TIME_GROUPS = [ {label:'Por Semana', value:'week'}, {label:'Por Mes', value:'month'}, {label:'Por Año', value:'year'} ];
const CHANNELS = [{label:'Mostrador', value:'MOSTRADOR'}, {label:'Online', value:'ONLINE'}];
const PAY = [{label:'Efectivo', value:'EFECTIVO'}, {label:'Tarjeta', value:'TARJETA'}];
const STATUS = [{label:'Pagada', value:'PAGADA'}, {label:'Cancelada', value:'CANCELADA'}];
const BRANCHES = [ {label:'Sucursal Centro', value:'CENTRO'}, {label:'Sucursal Norte', value:'NORTE'}, {label:'Sucursal Sur', value:'SUR'} ];
const CATEGORIES = [ {label:'Bebidas', value:'BEBIDAS'}, {label:'Botanas', value:'BOTANAS'}, {label:'Lácteos', value:'LACTEOS'}, {label:'Dulces', value:'DULCES'} ];
const SUPPLIERS = [];

const getPayloadData = async (response) => {
  if (!response?.ok) return [];
  const payload = await response.json();
  return Array.isArray(payload?.data) ? payload.data : [];
};

const toDate = (value) => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const normalizeStatus = (status) => {
  const value = String(status || "").toUpperCase();
  if (value.includes("CANCEL")) return "CANCELADA";
  return "PAGADA";
};

const mapVenta = (venta) => ({
  id: venta?.idVenta,
  folio: venta?.idVenta || "",
  date: toDate(venta?.fechaCreacion),
  customer: venta?.cliente?.nombre || "Publico general",
  channel: "MOSTRADOR",
  payment: venta?.metodoPago?.nombreMetodoPago || venta?.metodoPago?.nombre || "",
  status: normalizeStatus(venta?.estado),
  total: Number(venta?.total) || 0,
  mainProduct: venta?.detalles?.[0]?.producto?.nombreProducto || "Venta",
  category: venta?.detalles?.[0]?.producto?.categoria?.nombreCategoria || "",
  supplier: "",
  branch: venta?.caja?.nombreCaja || venta?.caja?.nombre || "",
});

// 1. Modal Detalle Venta Individual
function ModalDetalleVenta({ open, venta, onHide }) {
    if (!venta) return null;
    return (
      <Dialog visible={open} onHide={onHide} modal draggable={false} className="rvx-dialog" header={`Venta #${venta.folio}`}>
        <div className="p-4">
          <div className="flex justify-content-between mb-3"><span className="text-xl font-bold">{venta.customer}</span><span className="text-xl font-bold text-primary">{money(venta.total)}</span></div>
          <div className="grid grid-cols-2 gap-4"><div><strong>Fecha:</strong> {venta.date.toLocaleDateString()}</div><div><strong>Estatus:</strong> {venta.status}</div><div><strong>Sucursal:</strong> {venta.branch}</div><div><strong>Producto:</strong> {venta.mainProduct}</div></div>
        </div>
      </Dialog>
    );
}


// 2. Modal Detalle Top Producto
function ModalDetalleTop({ open, product, onHide }) {
    if (!product) return null;
    return (
      <Dialog visible={open} onHide={onHide} modal draggable={false} className="rvx-dialog" header={`Estadísticas del Producto`}>
        <div className="p-4">
          <div className="flex justify-content-between mb-4 align-items-center">
              <div className="flex align-items-center gap-2">
                  <span className="rvx-tag" style={{background: 'var(--rvx-brand)', color: '#fff', fontSize: '1rem', padding: '6px 12px'}}>
                      #{product.rank}
                  </span>
                  <span className="text-xl font-bold">{product.name}</span>
              </div>
              <span className="text-2xl font-black" style={{color: 'var(--rvx-brand)'}}>{money(product.revenue)}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3" style={{borderRadius: '12px', border: '1px solid #f1f5f9'}}>
              <div><div className="text-xs font-bold text-gray-500 uppercase mb-1">Categoría</div><div className="font-bold text-gray-800">{product.categoryLabel}</div></div>
              <div><div className="text-xs font-bold text-gray-500 uppercase mb-1">Participación Global</div><span className="rvx-chip">{product.percent}% de las ventas</span></div>
              <div><div className="text-xs font-bold text-gray-500 uppercase mb-1">Veces Vendido</div><div className="font-bold text-gray-800">{product.orders} Órdenes</div></div>
              <div><div className="text-xs font-bold text-gray-500 uppercase mb-1">Ticket Promedio</div><div className="font-bold text-gray-800">{money(product.avgTicket)} / orden</div></div>
          </div>
        </div>
      </Dialog>
    );
}

// 3. Modal de Ranking Completo (Lista Larga)
function ModalRankingCompleto({ open, title, data, color, onHide }) {
    if (!open) return null;
    return (
        <Dialog visible={open} onHide={onHide} modal draggable={false} className="rvx-dialog" header={title}>
            <div className="p-4" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {data.map((item, index) => (
                    <div key={item.name} className="rvx-ranking-item" style={{marginBottom: '20px'}}>
                        <div className="rvx-ranking-info">
                            <span className="rvx-ranking-name">
                                <span className="rvx-ranking-badge">#{index + 1}</span> {item.name}
                            </span>
                            <span className="rvx-ranking-val">{money(item.revenue)}</span>
                        </div>
                        <div className="rvx-top-bar-bg" style={{height: '8px'}}>
                            <div className="rvx-top-bar-fill" style={{ width: `${item.percent}%`, background: color }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </Dialog>
    );
}

export default function ReporteVentas() {
  const toast = useRef(null);
  const [data, setData] = useState([]);
  const [groupBy, setGroupBy] = useState('week'); 
  const [q, setQ] = useState("");
  const [range, setRange] = useState(null); 
  const [selChannels, setSelChannels] = useState([]);
  const [selStatus, setSelStatus] = useState([]);
  const [selBranch, setSelBranch] = useState(null);
  const [selCategory, setSelCategory] = useState(null);
  const [selSupplier, setSelSupplier] = useState(null);
  const [mainTabIndex, setMainTabIndex] = useState(0); 
  const [subTabIndex, setSubTabIndex] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  
  // Estados para Modales
  const [detail, setDetail] = useState({ open: false, venta: null });
  const [topProductDetail, setTopProductDetail] = useState({ open: false, product: null }); 
  const [rankingListDetail, setRankingListDetail] = useState({ open: false, type: null }); // 'days' | 'categories'

  useEffect(() => {
    let activo = true;
    const api = new APIfetchApi();

    async function cargarVentas() {
      try {
        const response = await api.fetchApi({}, "GET", undefined, endpoints.ventas);
        const ventas = (await getPayloadData(response)).map(mapVenta);
        if (activo) setData(ventas);
      } catch (error) {
        console.error("Error al cargar reporte de ventas:", error);
        if (activo) setData([]);
      }
    }

    cargarVentas();
    return () => {
      activo = false;
    };
  }, []);

  const periodLabel = useMemo(() => {
      if (!range || !range[0]) return "Histórico Completo";
      const start = formatDate(range[0], groupBy);
      const end = range[1] ? formatDate(range[1], groupBy) : '...';
      return ((groupBy === 'year' || groupBy === 'month') && !range[1]) ? start : `${start} — ${end}`;
  }, [range, groupBy]);

  const PeriodBadge = () => (
    <div style={{ marginBottom: '10px', display: 'flex', justifyContent:'center' }}>
        <span style={{ background: '#f1f5f9', color: '#64748b', padding: '4px 12px', borderRadius: '99px', fontSize: '0.7rem', fontWeight: '700', border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <i className="pi pi-calendar" style={{ fontSize: '0.8rem' }}></i> {periodLabel} 
        </span>
    </div>
  );

  const filtered = useMemo(() => {
    return data.filter(r => {
      let dateMatch = true;
      if (range && range[0]) {
          const startDate = range[0];
          const endDate = range[1];
          const rDate = new Date(r.date);
          rDate.setHours(0,0,0,0); const sD = new Date(startDate); sD.setHours(0,0,0,0); if(rDate < sD) dateMatch = false; if(endDate) { const eD = new Date(endDate); eD.setHours(0,0,0,0); if(rDate > eD) dateMatch = false; }
      }
      return ( dateMatch && (!q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase())) && (!selChannels.length || selChannels.includes(r.channel)) && (!selStatus.length || selStatus.includes(r.status)) && (!selBranch || r.branch === selBranch) && (!selCategory || r.category === selCategory) && (!selSupplier || r.supplier === selSupplier) );
    });
  }, [data, q, selChannels, selStatus, selBranch, selCategory, selSupplier, range]);

  const kpis = useMemo(() => ({
    gross: filtered.reduce((s,r) => s + (r.status==='PAGADA'?r.total:0), 0),
    orders: filtered.filter(r => r.status==='PAGADA').length,
    ticket: filtered.length ? filtered.reduce((s,r)=>s+r.total,0)/filtered.length : 0
  }), [filtered]);

  // 🔥 LÓGICA DE RENDIMIENTO
  const advancedStats = useMemo(() => {
    const prods = {}; const days = {}; const cats = {}; const chans = {}; const pays = {};
    let totalSales = 0;
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    filtered.forEach(r => {
        if (r.status === 'PAGADA') {
            totalSales += r.total;
            
            if(!prods[r.mainProduct]) prods[r.mainProduct] = { revenue: 0, orders: 0, category: r.category };
            prods[r.mainProduct].revenue += r.total;
            prods[r.mainProduct].orders += 1;
            
            const dayName = dayNames[r.date.getDay()];
            if(!days[dayName]) days[dayName] = { revenue: 0, orders: 0 };
            days[dayName].revenue += r.total;
            days[dayName].orders += 1;

            const catName = labelFrom(CATEGORIES, r.category); cats[catName] = (cats[catName] || 0) + r.total;
            const chanName = labelFrom(CHANNELS, r.channel); chans[chanName] = (chans[chanName] || 0) + r.total;
            const payName = labelFrom(PAY, r.payment); pays[payName] = (pays[payName] || 0) + r.total;
        }
    });

    const formatTopProducts = (limit) => Object.entries(prods)
        .sort((a, b) => b[1].revenue - a[1].revenue).slice(0, limit)
        .map(([name, data], index) => ({
            name, revenue: data.revenue, orders: data.orders,
            categoryLabel: labelFrom(CATEGORIES, data.category), avgTicket: data.revenue / data.orders,
            percent: totalSales > 0 ? ((data.revenue / totalSales) * 100).toFixed(1) : 0, rank: index + 1
        }));

    // Formateador sin límite para poder mostrar la lista completa en el modal
    const formatBasic = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1])
        .map(([name, revenue], index) => ({ name, revenue, percent: totalSales > 0 ? ((revenue / totalSales) * 100).toFixed(1) : 0, rank: index + 1 }));

    // Para days usamos formatBasic para tener los 7 ordenados
    const daysData = Object.entries(days).sort((a, b) => b[1].revenue - a[1].revenue)
        .map(([name, data], index) => ({
            name, revenue: data.revenue, percent: totalSales > 0 ? ((data.revenue / totalSales) * 100).toFixed(1) : 0, rank: index + 1
        }));

    return {
        products: formatTopProducts(3), // Top 3 para tarjetas
        days: daysData,                 // Todos los días
        categories: formatBasic(cats),  // Todas las categorías
        channels: formatBasic(chans),
        payments: formatBasic(pays)
    };
  }, [filtered]);

  const categoryStats = useMemo(() => {
      const tableData = advancedStats.categories;
      const pieColors = ['#0a7463', '#0f172a', '#eab308', '#14b8a6', '#94a3b8'];
      const chartDataObj = { labels: tableData.map(c => c.name), datasets: [{ data: tableData.map(c => c.revenue), backgroundColor: pieColors, borderWidth: 0 }] };
      return { tableData, chartDataObj };
  }, [advancedStats]);

  const channelStats = useMemo(() => {
      const tableData = advancedStats.channels;
      const pieColors = ['#0a7463', '#0b8b78', '#14b8a6', '#94a3b8']; 
      const chartDataObj = { labels: tableData.map(c => c.name), datasets: [{ data: tableData.map(c => c.revenue), backgroundColor: pieColors, borderWidth: 0 }] };
      return { tableData, chartDataObj };
  }, [advancedStats]);

  const paymentStats = useMemo(() => {
      const tableData = advancedStats.payments;
      const pieColors = ['#0f172a', '#334155', '#64748b', '#cbd5e1']; 
      const chartDataObj = { labels: tableData.map(c => c.name), datasets: [{ data: tableData.map(c => c.revenue), backgroundColor: pieColors, borderWidth: 0 }] };
      return { tableData, chartDataObj };
  }, [advancedStats]);

  const chartData = useMemo(() => {
    const groupData = {}; 
    const sorted = [...filtered].sort((a,b) => a.date - b.date);
    sorted.forEach(r => { 
        let key = ''; const d = r.date;
        if (groupBy === 'week') { const firstDay = new Date(d.getFullYear(), 0, 1); const pastDays = (d - firstDay) / 86400000; const weekNum = Math.ceil((pastDays + firstDay.getDay() + 1) / 7); key = `S${weekNum}`; } 
        else if (groupBy === 'month') key = d.toLocaleDateString('es-MX', {month:'short', year:'2-digit'});
        else if (groupBy === 'year') key = d.getFullYear().toString();
        groupData[key] = (groupData[key]||0) + r.total; 
    });

    return {
      line: { labels: Object.keys(groupData), datasets: [{ label: 'Ingresos', data: Object.values(groupData), borderColor: '#0a7463', tension: 0.3, fill: true, backgroundColor: 'rgba(10,116,99,0.05)', pointRadius: 2 }] }
    };
  }, [filtered, groupBy]); 

  const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(0,0,0,0.05)' } } } };
  const pieOptions = { responsive: true, maintainAspectRatio: false, cutout: '55%', plugins: { legend: { position: 'bottom' } } }; 
  const statusSeverity = (s) => (s === "PAGADA" ? "success" : "warning");

  return (
    <Shell>
      <div className="rvx-page">
        <Toast ref={toast} />
        <div className="rvx-header-bar"><div className="rvx-header-title"><i className="pi pi-chart-bar" /> REPORTE DE VENTAS</div></div>

        <div className="rvx-layout-grid">
            <div className="rvx-sidebar">
                <div className="rvx-sidebar-label"><i className="pi pi-filter"/> Filtros</div>
                <span className="p-input-icon-left w-full"><i className="pi pi-search"/><InputText value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar..." className="w-full"/></span>
                
                <div className="mt-2"><label>Agrupar Fechas Por:</label><Dropdown value={groupBy} onChange={e => setGroupBy(e.value)} options={TIME_GROUPS} className="rvx-ctl w-full"/></div>
                <div className="mt-2"><label>Rango de Fechas</label><Calendar value={range} onChange={e => setRange(e.value)} selectionMode="range" placeholder="Seleccionar..." className="rvx-ctl" readOnlyInput /></div>
                <div className="border-t pt-4 mt-2"><label>Sucursal</label><Dropdown value={selBranch} onChange={e => setSelBranch(e.value)} options={BRANCHES} placeholder="Todas" className="rvx-ctl" showClear/></div>
                <div className="mt-2"><label>Categoría</label><Dropdown value={selCategory} onChange={e => setSelCategory(e.value)} options={CATEGORIES} placeholder="Todas" className="rvx-ctl" showClear/></div>
                <div className="mt-2"><label>Proveedor</label><Dropdown value={selSupplier} onChange={e => setSelSupplier(e.value)} options={SUPPLIERS} placeholder="Todos" className="rvx-ctl" showClear/></div>
                <div className="mt-2"><label>Canal</label><MultiSelect value={selChannels} onChange={e => setSelChannels(e.value)} options={CHANNELS} placeholder="Todos" className="rvx-ctl w-full" display="chip" maxSelectedLabels={1}/></div>
                <div className="mt-2"><label>Estatus</label><MultiSelect value={selStatus} onChange={e => setSelStatus(e.value)} options={STATUS} placeholder="Todos" className="rvx-ctl w-full" display="chip" maxSelectedLabels={1}/></div>
                
                <div className="mt-auto pt-4"><Button icon="pi pi-filter-slash" label="Limpiar Filtros" className="rvx-btn rvx-btn--ghost" onClick={() => { setQ(""); setRange(null); setSelChannels([]); setSelStatus([]); setSelBranch(null); setSelCategory(null); setSelSupplier(null); setGroupBy('week'); }}/></div>
            </div>

            <div className="rvx-content">
                <div className="rvx-kpis">
                    <div className="rvx-kpi"><div className="rvx-kpiLabel">Ingresos</div><div className="rvx-kpiValue">{money(kpis.gross)}</div></div>
                    <div className="rvx-kpi"><div className="rvx-kpiLabel">Órdenes</div><div className="rvx-kpiValue">{kpis.orders}</div></div>
                    <div className="rvx-kpi"><div className="rvx-kpiLabel">Ticket Prom.</div><div className="rvx-kpiValue">{money(kpis.ticket)}</div></div>
                </div>

                <div className="rvx-main-card">
                    <div className="rvx-card-action-btn"><Button icon="pi pi-download" className="rvx-btn rvx-btn--primary rvx-btn-icon-only" tooltip="Descargar Reporte" tooltipOptions={{ position: 'left' }} onClick={() => toast.current.show({severity:'success', summary:'Descargando', detail:'Generando PDF...'})}/></div>
                    
                    <TabView activeIndex={mainTabIndex} onTabChange={e => setMainTabIndex(e.index)} className="rvx-tabview rvx-main-tabs">
                        
                        <TabPanel header="Panel de Gráficas" leftIcon="pi pi-chart-line">
                            <TabView activeIndex={subTabIndex} onTabChange={e => setSubTabIndex(e.index)} className="rvx-tabview rvx-sub-tabview rvx-sub-tabs">
                                <TabPanel header="Tendencia Global"><div className="rvx-chart-container"><div className="rvx-minimal-title">Evolución de Ingresos</div><PeriodBadge /> <div className="rvx-chart-full"><Chart type="line" data={chartData.line} options={chartOptions} style={{ width:'100%', height:'100%' }} /></div></div></TabPanel>
                                <TabPanel header="Categorías">
                                    <div className="rvx-chart-container"><div className="rvx-minimal-title">Desempeño por Categoría</div><PeriodBadge /> 
                                        <div className="rvx-split-view">
                                            <div className="rvx-split-left"><DataTable value={categoryStats.tableData} className="rvx-table"><Column field="name" header="Categoría" /><Column field="revenue" header="Ingresos" body={r => <span className="font-bold" style={{color:'var(--rvx-brand)'}}>{money(r.revenue)}</span>} /><Column field="percent" header="Participación" body={r => <span className="rvx-chip">{r.percent}%</span>} align="center"/></DataTable></div>
                                            <div className="rvx-split-right"><div className="rvx-chart-full" style={{height: '320px', minHeight: '320px', width: '90%'}}><Chart type="doughnut" data={categoryStats.chartDataObj} options={pieOptions} style={{ width:'100%', height:'100%' }}/></div></div>
                                        </div>
                                    </div>
                                </TabPanel>
                                <TabPanel header="Por Canales">
                                    <div className="rvx-chart-container"><div className="rvx-minimal-title">Distribución por Canal</div><PeriodBadge /> 
                                        <div className="rvx-split-view">
                                            <div className="rvx-split-left"><DataTable value={channelStats.tableData} className="rvx-table"><Column field="name" header="Canal" /><Column field="revenue" header="Ingresos" body={r => <span className="font-bold" style={{color:'var(--rvx-brand)'}}>{money(r.revenue)}</span>} /><Column field="percent" header="Participación" body={r => <span className="rvx-chip">{r.percent}%</span>} align="center"/></DataTable></div>
                                            <div className="rvx-split-right"><div className="rvx-chart-full" style={{height: '320px', minHeight: '320px', width: '90%'}}><Chart type="doughnut" data={channelStats.chartDataObj} options={pieOptions} style={{ width:'100%', height:'100%' }}/></div></div>
                                        </div>
                                    </div>
                                </TabPanel>
                                <TabPanel header="Pagos">
                                    <div className="rvx-chart-container"><div className="rvx-minimal-title">Preferencia de Pago</div><PeriodBadge /> 
                                        <div className="rvx-split-view">
                                            <div className="rvx-split-left"><DataTable value={paymentStats.tableData} className="rvx-table"><Column field="name" header="Método" /><Column field="revenue" header="Ingresos" body={r => <span className="font-bold" style={{color:'var(--rvx-brand)'}}>{money(r.revenue)}</span>} /><Column field="percent" header="Participación" body={r => <span className="rvx-chip">{r.percent}%</span>} align="center"/></DataTable></div>
                                            <div className="rvx-split-right"><div className="rvx-chart-full" style={{height: '320px', minHeight: '320px', width: '90%'}}><Chart type="doughnut" data={paymentStats.chartDataObj} options={pieOptions} style={{ width:'100%', height:'100%' }}/></div></div>
                                        </div>
                                    </div>
                                </TabPanel>
                            </TabView>
                        </TabPanel>

                        <TabPanel header="Rankings y Tops" leftIcon="pi pi-star">
                            
                            <div className="rvx-minimal-title" style={{textAlign: 'left', marginBottom: '10px', fontSize:'1.1rem'}}>Top 3 Productos Más Vendidos</div>
                            <div className="rvx-top-grid" style={{marginBottom: '30px'}}>
                                {advancedStats.products.map((prod) => (
                                    <div key={prod.name} className={`rvx-top-card rvx-top-card--rank-${prod.rank}`} onClick={() => setTopProductDetail({open: true, product: prod})}>
                                        <div className="rvx-top-rank">#{prod.rank}</div>
                                        <div className="rvx-top-info">
                                            <span className="rvx-top-name" title={prod.name}>{prod.name}</span>
                                            <span className="rvx-top-revenue">{money(prod.revenue)}</span>
                                        </div>
                                        <div className="rvx-top-bar-container">
                                            <div className="rvx-top-meta"><span>Participación</span><span>{prod.percent}%</span></div>
                                            <div className="rvx-top-bar-bg"><div className="rvx-top-bar-fill" style={{ width: `${prod.percent}%` }}></div></div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="rvx-ranking-container">
                                {/* 🔥 CAJA 1: DÍAS (Click para ver todos) */}
                                <div className="rvx-ranking-box" onClick={() => setRankingListDetail({open: true, type: 'days'})}>
                                    <div className="rvx-ranking-title"><i className="pi pi-calendar-plus" style={{color: 'var(--rvx-brand)'}}></i> Mejores Días de Venta</div>
                                    {advancedStats.days.slice(0,3).map((day) => (
                                        <div key={day.name} className="rvx-ranking-item">
                                            <div className="rvx-ranking-info">
                                                <span className="rvx-ranking-name"><span className="rvx-ranking-badge">#{day.rank}</span> {day.name}</span>
                                                <span className="rvx-ranking-val">{money(day.revenue)}</span>
                                            </div>
                                            <div className="rvx-top-bar-bg" style={{height: '6px'}}><div className="rvx-top-bar-fill" style={{ width: `${day.percent}%`, background: '#0f172a' }}></div></div>
                                        </div>
                                    ))}
                                    <div className="mt-3 text-center text-sm font-bold" style={{color: 'var(--rvx-brand)'}}>+ Ver todos los días</div>
                                </div>
                                
                                {/* 🔥 CAJA 2: CATEGORÍAS (Click para ver todas) */}
                                <div className="rvx-ranking-box" onClick={() => setRankingListDetail({open: true, type: 'categories'})}>
                                    <div className="rvx-ranking-title"><i className="pi pi-tags" style={{color: '#eab308'}}></i> Categorías Destacadas</div>
                                    {advancedStats.categories.slice(0,3).map((cat) => (
                                        <div key={cat.name} className="rvx-ranking-item">
                                            <div className="rvx-ranking-info">
                                                <span className="rvx-ranking-name"><span className="rvx-ranking-badge">#{cat.rank}</span> {cat.name}</span>
                                                <span className="rvx-ranking-val">{money(cat.revenue)}</span>
                                            </div>
                                            <div className="rvx-top-bar-bg" style={{height: '6px'}}><div className="rvx-top-bar-fill" style={{ width: `${cat.percent}%`, background: '#eab308' }}></div></div>
                                        </div>
                                    ))}
                                    <div className="mt-3 text-center text-sm font-bold" style={{color: '#eab308'}}>+ Ver todas las categorías</div>
                                </div>
                            </div>

                        </TabPanel>

                        <TabPanel header="Reporte Detallado" leftIcon="pi pi-list">
                            <div className="rvx-tableHead"><div className="rvx-tableTitle"><span>Listado de Operaciones</span></div><Dropdown value={rowsPerPage} onChange={(e) => setRowsPerPage(e.value)} options={[15,30,50]} className="rvx-rowsSel"/></div>
                            <DataTable value={filtered} paginator rows={rowsPerPage} className="rvx-table" scrollable scrollHeight="400px" onRowDoubleClick={e => setDetail({open:true, venta:e.data})}>
                                <Column field="folio" header="Folio" body={r => <span className="rvx-chip">{r.folio}</span>} sortable/>
                                <Column field="date" header="Fecha" body={r => r.date.toLocaleDateString()} sortable/>
                                <Column field="customer" header="Cliente" sortable/>
                                <Column field="branch" header="Sucursal" sortable/>
                                <Column field="channel" header="Canal" body={r => labelFrom(CHANNELS, r.channel)}/>
                                <Column field="payment" header="Pago" body={r => labelFrom(PAY, r.payment)}/>
                                <Column field="status" header="Estatus" body={r => <Tag severity={statusSeverity(r.status)} value={r.status} className="rvx-tag"/>} sortable/>
                                <Column field="total" header="Total" body={r => <span className="font-bold">{money(r.total)}</span>} alignFrozen="right" sortable/>
                                <Column header="" body={() => <Button icon="pi pi-eye" className="rvx-iconBtn"/>} alignFrozen="right"/>
                            </DataTable>
                        </TabPanel>

                    </TabView>
                </div>
            </div>
        </div>
        
        {/* MODALES */}
        <ModalDetalleVenta open={detail.open} venta={detail.venta} onHide={() => setDetail({ open: false, venta: null })} />
        <ModalDetalleTop open={topProductDetail.open} product={topProductDetail.product} onHide={() => setTopProductDetail({ open: false, product: null })} /> 
        
        {/* 🔥 Modal que renderiza dinámicamente Días o Categorías */}
        <ModalRankingCompleto 
            open={rankingListDetail.open} 
            title={rankingListDetail.type === 'days' ? 'Ranking: Días de Venta' : 'Ranking: Todas las Categorías'}
            data={rankingListDetail.type === 'days' ? advancedStats.days : advancedStats.categories}
            color={rankingListDetail.type === 'days' ? '#0f172a' : '#eab308'}
            onHide={() => setRankingListDetail({ open: false, type: null })} 
        />
      
      </div>
    </Shell>
  );
}
