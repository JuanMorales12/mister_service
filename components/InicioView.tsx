
import React, { useContext, useMemo, useState } from 'react';
// NOTE: Importing from '../src/types' to ensure we use the SAME AppContext instance provided by src/App.tsx.
// Previously this file imported from '../types' (root), creating a second, distinct context and always receiving null.
import { AppContext, AppContextType } from '../src/types';
import { Calendar as CalendarIcon, MoreHorizontal, ArrowRight } from 'lucide-react';

// --- Helper Components for Charts ---

const TinyLineChart: React.FC<{ data: number[], color: string, height?: number }> = ({ data, color, height = 40 }) => {
    const max = Math.max(...data, 1);
    const min = Math.min(...data);
    const range = max - min || 1;
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((val - min) / range) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="3"
                points={points}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

const TinyBarChart: React.FC<{ data: number[], color: string }> = ({ data, color }) => {
    const max = Math.max(...data, 1);
    return (
        <div className="flex items-end justify-between gap-1 h-10 w-full">
            {data.map((val, i) => (
                <div
                    key={i}
                    className="w-full rounded-t-sm opacity-80"
                    style={{
                        backgroundColor: color,
                        height: `${(val / max) * 100}%`
                    }}
                ></div>
            ))}
        </div>
    );
};

const DonutChart: React.FC<{ percent: number, color: string, size?: number }> = ({ percent, color, size = 160 }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90 w-full h-full">
                <circle
                    className="text-slate-100"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="50%"
                    cy="50%"
                />
                <circle
                    style={{ color: color }}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="50%"
                    cy="50%"
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-slate-700">
                <span className="text-xs font-medium text-slate-400">TOTAL</span>
                <span className="text-xl font-bold">{Math.round(percent)}%</span>
            </div>
        </div>
    );
};

const SalesBarChart: React.FC<{ salesData: number[], purchaseData: number[], labels: string[] }> = ({ salesData, purchaseData, labels }) => {
    const maxVal = Math.max(...salesData, ...purchaseData, 1000);

    // Determinar si necesitamos comprimir las etiquetas
    const isCompact = labels.length > 12;
    const barMaxWidth = isCompact ? '8px' : '16px';
    const labelRotation = isCompact ? '-45deg' : '0deg';

    return (
        <div className="relative w-full" style={{ height: isCompact ? '280px' : '256px' }}>
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between text-xs text-slate-400 pointer-events-none pl-10 sm:pl-10" style={{ paddingBottom: isCompact ? '48px' : '32px' }}>
                {[1, 0.75, 0.5, 0.25, 0].map((tick) => (
                    <div key={tick} className="flex items-center w-full border-b border-slate-100 h-full relative">
                        <span className="absolute -left-10 w-8 text-right text-[10px] sm:text-xs">{Math.round(maxVal * tick).toLocaleString('en-US', { notation: "compact" })}</span>
                    </div>
                ))}
            </div>

            {/* Bars */}
            <div className="absolute inset-0 flex items-end justify-between pl-10 sm:pl-10 pt-4" style={{ paddingBottom: isCompact ? '48px' : '32px' }}>
                {labels.map((label, i) => (
                    <div key={i} className="flex flex-col items-center w-full h-full justify-end group relative">
                         {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-800 text-white text-xs rounded p-2 z-10 whitespace-nowrap">
                           Ventas: {salesData[i].toLocaleString()}<br/>Compras: {purchaseData[i].toLocaleString()}
                        </div>

                        <div className="flex gap-0.5 items-end h-full w-full justify-center" style={{ maxWidth: isCompact ? '24px' : '40px' }}>
                            <div
                                className="w-full bg-sky-400 rounded-t-sm transition-all duration-500"
                                style={{
                                    height: `${(salesData[i] / maxVal) * 100}%`,
                                    maxWidth: barMaxWidth
                                }}
                            ></div>
                            <div
                                className="w-full bg-pink-500 rounded-t-sm transition-all duration-500"
                                style={{
                                    height: `${(purchaseData[i] / maxVal) * 100}%`,
                                    maxWidth: barMaxWidth
                                }}
                            ></div>
                        </div>
                        <span
                            className="text-[8px] sm:text-[9px] text-slate-400 mt-2 block origin-bottom-left text-center leading-tight"
                            style={{
                                transform: `rotate(${labelRotation})`,
                                transformOrigin: 'top center',
                                maxWidth: isCompact ? '60px' : '100%',
                                whiteSpace: 'pre-line'
                            }}
                        >{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Main Dashboard Component ---

export const InicioView: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) {
        return <div>Error: El contexto de la app no está disponible.</div>;
    }
    const { quotes, invoices, serviceOrders, setMode } = context;

    // --- Time range state for Sales/Purchases chart ---
    const [range, setRange] = useState<'today' | 'week' | 'month' | 'year'>('month');

    // --- 1. Calculate Metrics ---
    const metrics = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // A. Quotes (Cotizaciones)
        const totalQuotesValue = quotes.reduce((sum, q) => sum + q.total, 0);
        const pendingQuotesCount = quotes.filter(q => q.status === 'Borrador' || q.status === 'Enviada').length;
        // Mock trend data based on recent quotes
        const quotesTrend = quotes.slice(0, 10).map(q => q.total).reverse(); 
        if (quotesTrend.length < 5) quotesTrend.push(0, 0, 0, 0, 0); // Fill if empty

        // B. Service Orders (Conduce / Work Orders)
        // We approximate value based on Invoices linked to Service Orders
        const totalOrdersValue = invoices
            .filter(i => i.serviceOrderId) // Only invoices from orders
            .reduce((sum, i) => sum + i.total, 0);
        const pendingOrdersCount = serviceOrders.filter(o => o.status === 'Pendiente' || o.status === 'En Proceso').length;
        // Mock trend
        const ordersTrend = invoices.filter(i => i.serviceOrderId).slice(0, 10).map(i => i.total).reverse();
        if (ordersTrend.length < 5) ordersTrend.push(0, 1000, 500, 2000, 1500);

        // C. Invoices (Factura)
        const totalInvoicesValue = invoices.reduce((sum, i) => sum + i.total, 0);
        const emittedInvoicesCount = invoices.filter(i => i.status !== 'Borrador').length;
        // Bar chart data (last 10 invoices)
        const invoicesBarData = invoices.slice(0, 10).map(i => i.total);
        while(invoicesBarData.length < 7) invoicesBarData.push(0);

        // D. Balance
        const totalPaid = invoices.reduce((sum, i) => sum + i.paidAmount, 0);
        const totalDue = totalInvoicesValue - totalPaid;
        // Determine percentage of debt vs paid for the donut
        const paidPercentage = totalInvoicesValue > 0 ? (totalPaid / totalInvoicesValue) * 100 : 100;
        const duePercentage = 100 - paidPercentage;
        
        // Split balance by 30 days (Simple logic: if invoice date is older than 30 days and not paid)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        let balanceOld = 0;
        let balanceNew = 0;
        let countOld = 0;
        let countNew = 0;

        invoices.forEach(inv => {
            const due = inv.total - inv.paidAmount;
            if (due > 0) {
                if (new Date(inv.date) < thirtyDaysAgo) {
                    balanceOld += due;
                    countOld++;
                } else {
                    balanceNew += due;
                    countNew++;
                }
            }
        });

        // E. Main Chart Data dynamic by selected range
        let chartLabels: string[] = [];
        let salesData: number[] = [];
        let purchasesData: number[] = [];

        const addPurchaseTotal = (inv: any) => inv.items.reduce((acc: number, item: any) => acc + (item.purchasePrice * item.quantity), 0);

        if (range === 'year') {
            // Last 5 years (anual)
            for (let i = 4; i >= 0; i--) {
                const year = currentYear - i;
                chartLabels.push(year.toString());
                const yearInvoices = invoices.filter(inv => {
                    const invDate = new Date(inv.date);
                    return invDate.getFullYear() === year;
                });
                salesData.push(yearInvoices.reduce((s, inv) => s + inv.total, 0));
                purchasesData.push(yearInvoices.reduce((s, inv) => s + addPurchaseTotal(inv), 0));
            }
        } else if (range === 'month') {
            // Last 12 months
            let lastYear = -1;
            for (let i = 11; i >= 0; i--) {
                const d = new Date(currentYear, currentMonth - i, 1);
                const monthName = d.toLocaleString('es-ES', { month: 'short' });
                const year = d.getFullYear();

                // Mostrar el año solo cuando cambia
                if (year !== lastYear) {
                    chartLabels.push(`${monthName}\n'${year.toString().slice(-2)}`);
                    lastYear = year;
                } else {
                    chartLabels.push(monthName);
                }

                const monthInvoices = invoices.filter(inv => {
                    const invDate = new Date(inv.date);
                    return invDate.getMonth() === d.getMonth() && invDate.getFullYear() === year;
                });
                salesData.push(monthInvoices.reduce((s, inv) => s + inv.total, 0));
                purchasesData.push(monthInvoices.reduce((s, inv) => s + addPurchaseTotal(inv), 0));
            }
        } else if (range === 'week') {
            // Last 7 days including today
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                chartLabels.push(d.toLocaleDateString('es-ES', { weekday: 'short' }));
                const dayInvoices = invoices.filter(inv => {
                    const invDate = new Date(inv.date);
                    return invDate.getDate() === d.getDate() && invDate.getMonth() === d.getMonth() && invDate.getFullYear() === d.getFullYear();
                });
                salesData.push(dayInvoices.reduce((s, inv) => s + inv.total, 0));
                purchasesData.push(dayInvoices.reduce((s, inv) => s + addPurchaseTotal(inv), 0));
            }
        } else if (range === 'today') {
            // Group by 3-hour blocks for current day
            const blocks = [0,3,6,9,12,15,18,21];
            blocks.forEach(startHour => {
                const endHour = startHour + 3;
                chartLabels.push(`${startHour}-${endHour}h`);
                const blockInvoices = invoices.filter(inv => {
                    const invDate = new Date(inv.date);
                    return invDate.getDate() === now.getDate() && invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear() && invDate.getHours() >= startHour && invDate.getHours() < endHour;
                });
                salesData.push(blockInvoices.reduce((s, inv) => s + inv.total, 0));
                purchasesData.push(blockInvoices.reduce((s, inv) => s + addPurchaseTotal(inv), 0));
            });
        }

        return {
            quotes: { total: totalQuotesValue, pending: pendingQuotesCount, trend: quotesTrend },
            orders: { total: totalOrdersValue, pending: pendingOrdersCount, trend: ordersTrend },
            invoices: { total: totalInvoicesValue, count: emittedInvoicesCount, bars: invoicesBarData },
            balance: { 
                totalDue, 
                percent: duePercentage, 
                old: { val: balanceOld, count: countOld },
                new: { val: balanceNew, count: countNew }
            },
            chart: { labels: chartLabels, sales: salesData, purchases: purchasesData }
        };
    }, [quotes, invoices, serviceOrders, range]);

    const currencyFormatter = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' });
    const currentDate = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <div className="space-y-6">
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-md shadow-sm border border-slate-200 text-sm text-slate-600">
                    <CalendarIcon size={16} className="text-sky-600" />
                    <span>{currentDate}</span>
                </div>
            </div>

            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Cotizacion */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden transition-transform hover:shadow-md">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">COTIZACION</p>
                            <h3 className="text-2xl font-bold text-slate-800 mt-1">{currencyFormatter.format(metrics.quotes.total)}</h3>
                        </div>
                        <button 
                            onClick={() => setMode('cotizaciones')} 
                            className="text-slate-400 hover:text-sky-600 transition-colors"
                            title="Ir a Cotizaciones"
                        >
                            <ArrowRight size={20} />
                        </button>
                    </div>
                    <div className="flex items-end justify-between">
                         <span className="text-amber-500 text-sm font-medium bg-amber-50 px-2 py-1 rounded-md">
                            {metrics.quotes.pending} Pendiente(s)
                        </span>
                        <div className="w-24 h-12">
                             <TinyLineChart data={metrics.quotes.trend} color="#8b5cf6" />
                        </div>
                    </div>
                </div>

                {/* Card 2: Conduce (Work Orders) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 transition-transform hover:shadow-md">
                     <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">CONDUCE</p>
                            <h3 className="text-2xl font-bold text-slate-800 mt-1">{currencyFormatter.format(metrics.orders.total)}</h3>
                        </div>
                        <button 
                            onClick={() => setMode('calendar')} 
                            className="text-slate-400 hover:text-sky-600 transition-colors"
                            title="Ir a Órdenes de Servicio"
                        >
                            <ArrowRight size={20} />
                        </button>
                    </div>
                     <div className="flex items-end justify-between">
                         <span className="text-pink-500 text-sm font-medium bg-pink-50 px-2 py-1 rounded-md">
                            {metrics.orders.pending} Pendiente(s)
                        </span>
                        <div className="w-24 h-12">
                             <TinyLineChart data={metrics.orders.trend} color="#6366f1" />
                        </div>
                    </div>
                </div>

                 {/* Card 3: Factura */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 transition-transform hover:shadow-md">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">FACTURA</p>
                            <h3 className="text-2xl font-bold text-slate-800 mt-1">{currencyFormatter.format(metrics.invoices.total)}</h3>
                        </div>
                        <button 
                            onClick={() => setMode('facturacion')} 
                            className="text-slate-400 hover:text-sky-600 transition-colors"
                            title="Ir a Facturación"
                        >
                            <ArrowRight size={20} />
                        </button>
                    </div>
                     <div className="flex items-end justify-between">
                         <span className="text-green-600 text-sm font-medium bg-green-50 px-2 py-1 rounded-md">
                            {metrics.invoices.count} Emitidas
                        </span>
                        <div className="w-24 h-10 flex items-end pb-1">
                             <TinyBarChart data={metrics.invoices.bars} color="#6366f1" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Sales / Purchases */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-700">VENTAS / COMPRAS</h3>
                        <div className="flex gap-2">
                             {/* Simple Legend */}
                             <div className="flex items-center gap-1 text-xs text-slate-500"><div className="w-3 h-3 bg-sky-400 rounded-sm"></div> Ventas</div>
                             <div className="flex items-center gap-1 text-xs text-slate-500"><div className="w-3 h-3 bg-pink-500 rounded-sm"></div> Compras</div>
                             <button className="text-slate-400 hover:text-slate-600 ml-2"><MoreHorizontal size={20} /></button>
                        </div>
                    </div>
                    
                    <div className="flex justify-end gap-2 mb-4">
                        {['today','week','month','year'].map(r => (
                            <button
                                key={r}
                                onClick={() => setRange(r as any)}
                                className={
                                    'px-3 py-1 text-xs rounded border transition-colors ' +
                                    (range === r ? 'bg-indigo-500 border-indigo-500 text-white shadow-sm' : 'hover:bg-slate-50')
                                }
                            >
                                {r === 'today' && 'Today'}
                                {r === 'week' && 'Week'}
                                {r === 'month' && 'Month'}
                                {r === 'year' && 'Year'}
                            </button>
                        ))}
                    </div>

                    <div className="pl-6">
                        <SalesBarChart 
                            salesData={metrics.chart.sales} 
                            purchaseData={metrics.chart.purchases} 
                            labels={metrics.chart.labels} 
                        />
                    </div>
                </div>

                {/* Right: Balance Pendiente */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-700">BALANCE PENDIENTE</h3>
                        <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={20} /></button>
                    </div>
                    
                    <div className="flex justify-center items-center gap-4 text-xs mb-6">
                        <div className="flex items-center gap-1 text-slate-500"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> -30 Días</div>
                        <div className="flex items-center gap-1 text-slate-500"><div className="w-2 h-2 rounded-full bg-pink-500"></div> +30 Días</div>
                    </div>

                    <div className="flex justify-center py-4">
                        <DonutChart percent={metrics.balance.percent} color="#3b82f6" size={200} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
                        <div className="text-center">
                            <p className="text-xs font-bold text-slate-800">-30 DIAS</p>
                            <p className="font-bold text-slate-800 text-lg">{metrics.balance.new.count} Factura</p>
                            <p className="text-sm text-slate-500">{currencyFormatter.format(metrics.balance.new.val)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs font-bold text-slate-800">+30 DIAS</p>
                            <p className="font-bold text-slate-800 text-lg">{metrics.balance.old.count} Factura</p>
                            <p className="text-sm text-slate-500">{currencyFormatter.format(metrics.balance.old.val)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
