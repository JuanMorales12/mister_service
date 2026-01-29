
import React, { useContext, useMemo, useState } from 'react';
// NOTE: Importing from '../src/types' to ensure we use the SAME AppContext instance provided by src/App.tsx.
// Previously this file imported from '../types' (root), creating a second, distinct context and always receiving null.
import { AppContext, AppContextType, ExpenseCategory } from '../src/types';
import { Calendar as CalendarIcon, ArrowRight, AlertTriangle, Package, Users, Clock, TrendingUp, Wrench, Receipt } from 'lucide-react';
import { formatCurrency } from '../src/utils';

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
    const { quotes, invoices, serviceOrders, setMode, products, staff, calendars, expenses } = context;

    // --- Time range state for Sales/Purchases chart ---
    const [range, setRange] = useState<'today' | 'week' | 'month' | 'year'>('month');

    // --- Year filter for annual billing ---
    const availableYears = useMemo(() => {
        const years = new Set<number>();
        invoices.forEach(inv => years.add(new Date(inv.date).getFullYear()));
        if (years.size === 0) years.add(new Date().getFullYear());
        return Array.from(years).sort((a, b) => b - a);
    }, [invoices]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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

        // B. Service Orders (Órdenes Activas)
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

        // C2. Facturas Emitidas Hoy vs Mes vs Pagadas al Mes
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const invoicesEmittedToday = invoices.filter(inv => {
            const invDate = new Date(inv.date);
            return inv.status !== 'Borrador' && invDate >= startOfToday;
        });
        const invoicesEmittedThisMonth = invoices.filter(inv => {
            const invDate = new Date(inv.date);
            return inv.status !== 'Borrador' && invDate >= startOfMonth;
        });
        const invoicesPaidThisMonth = invoices.filter(inv => {
            return inv.status === 'Pagada' && inv.payments.some(p => {
                const payDate = new Date(p.paymentDate);
                return payDate >= startOfMonth;
            });
        });

        const invoiceStats = {
            emittedToday: { count: invoicesEmittedToday.length, total: invoicesEmittedToday.reduce((s, i) => s + i.total, 0) },
            emittedMonth: { count: invoicesEmittedThisMonth.length, total: invoicesEmittedThisMonth.reduce((s, i) => s + i.total, 0) },
            paidMonth: { count: invoicesPaidThisMonth.length, total: invoicesPaidThisMonth.reduce((s, i) => s + i.paidAmount, 0) }
        };

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

        // F. Critical Stock (productos con stock <= 5)
        const criticalStockProducts = products
            .filter(p => p.stock <= 5 && (p.status === 'Activo' || !p.status))
            .sort((a, b) => a.stock - b.stock);

        // G. Estado de Casos por Técnico
        const technicians = staff.filter(s => s.role === 'tecnico');
        const technicianStats = technicians.map(tech => {
            const techCalendar = calendars.find(c => c.userId === tech.id);
            const techOrders = serviceOrders.filter(o => o.calendarId === techCalendar?.id);
            return {
                id: tech.id,
                name: tech.name,
                photo: tech.employeePhotoUrl,
                pending: techOrders.filter(o => o.status === 'Pendiente').length,
                inProgress: techOrders.filter(o => o.status === 'En Proceso').length,
                completed: techOrders.filter(o => o.status === 'Completado').length,
                total: techOrders.length
            };
        }).filter(t => t.total > 0 || technicians.length <= 5); // Solo mostrar técnicos con órdenes o si hay pocos

        // H. Órdenes Atrasadas (SLA - más de 24 horas desde creación sin completar)
        const overdueOrders = serviceOrders
            .filter(order => {
                if (order.status === 'Completado' || order.status === 'Cancelado') return false;
                const createdAt = new Date(order.createdAt);
                const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
                return hoursSinceCreation > 24; // SLA de 24 horas
            })
            .map(order => {
                const createdAt = new Date(order.createdAt);
                const hoursSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
                const daysSinceCreation = Math.floor(hoursSinceCreation / 24);
                const techCalendar = calendars.find(c => c.id === order.calendarId);
                const technician = staff.find(s => s.id === techCalendar?.userId);
                return {
                    id: order.id,
                    orderNumber: order.serviceOrderNumber,
                    customerName: order.customerName,
                    applianceType: order.applianceType,
                    status: order.status,
                    technicianName: technician?.name || 'Sin asignar',
                    hoursSinceCreation,
                    daysSinceCreation,
                    createdAt
                };
            })
            .sort((a, b) => b.hoursSinceCreation - a.hoursSinceCreation);

        // I. Rendimiento por Técnico (últimos 30 días)
        const thirtyDaysAgoForPerf = new Date();
        thirtyDaysAgoForPerf.setDate(thirtyDaysAgoForPerf.getDate() - 30);

        const technicianPerformance = technicians.map(tech => {
            const techCalendar = calendars.find(c => c.userId === tech.id);
            const recentOrders = serviceOrders.filter(o => {
                if (o.calendarId !== techCalendar?.id) return false;
                const createdAt = new Date(o.createdAt);
                return createdAt >= thirtyDaysAgoForPerf;
            });

            const completed = recentOrders.filter(o => o.status === 'Completado').length;
            const total = recentOrders.length;
            const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

            // Calcular facturación del técnico
            const techInvoices = invoices.filter(inv => {
                const invDate = new Date(inv.date);
                if (invDate < thirtyDaysAgoForPerf) return false;
                // Revisar si algún item tiene comisión para este técnico
                return inv.items.some(item => item.commission?.technicianId === tech.id);
            });
            const revenue = techInvoices.reduce((sum, inv) => sum + inv.total, 0);

            return {
                id: tech.id,
                name: tech.name,
                photo: tech.employeePhotoUrl,
                completed,
                total,
                completionRate,
                revenue
            };
        }).filter(t => t.total > 0).sort((a, b) => b.completed - a.completed);

        // J. Reparaciones por Tipo de Equipo
        const equipmentTypeCounts: Record<string, number> = {};
        serviceOrders.forEach(order => {
            // Normalizar el tipo de equipo (extraer el tipo base)
            let equipmentType = order.applianceType?.trim() || 'Sin especificar';
            // Si contiene marca, extraer solo el tipo (ej: "Lavadora Samsung" -> "Lavadora")
            const firstWord = equipmentType.split(' ')[0];
            // Usar primera palabra si es un tipo común
            const commonTypes = ['Lavadora', 'Nevera', 'Refrigerador', 'Secadora', 'Aire', 'Microondas', 'Estufa', 'Lavavajillas', 'Congelador', 'Dispensador'];
            if (commonTypes.some(t => firstWord.toLowerCase().startsWith(t.toLowerCase()))) {
                equipmentType = firstWord;
            }
            equipmentTypeCounts[equipmentType] = (equipmentTypeCounts[equipmentType] || 0) + 1;
        });

        const repairsByEquipmentType = Object.entries(equipmentTypeCounts)
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // K. Gastos del mes actual
        const expensesThisMonth = (expenses || []).filter(exp => {
            const expDate = new Date(exp.date);
            return expDate >= startOfMonth;
        });
        const totalExpensesMonth = expensesThisMonth.reduce((sum, e) => sum + e.amount, 0);

        // Gastos por categoría
        const expensesByCategory: Record<string, number> = {};
        expensesThisMonth.forEach(exp => {
            expensesByCategory[exp.category] = (expensesByCategory[exp.category] || 0) + exp.amount;
        });
        const expenseCategoryBreakdown = Object.entries(expensesByCategory)
            .map(([category, total]) => ({ category: category as ExpenseCategory, total }))
            .sort((a, b) => b.total - a.total);

        // Balance neto (facturado - gastos)
        const netBalance = invoiceStats.emittedMonth.total - totalExpensesMonth;

        return {
            quotes: { total: totalQuotesValue, pending: pendingQuotesCount, trend: quotesTrend },
            orders: { total: totalOrdersValue, pending: pendingOrdersCount, trend: ordersTrend },
            invoices: { total: totalInvoicesValue, count: emittedInvoicesCount, bars: invoicesBarData, stats: invoiceStats },
            balance: {
                totalDue,
                percent: duePercentage,
                old: { val: balanceOld, count: countOld },
                new: { val: balanceNew, count: countNew }
            },
            chart: { labels: chartLabels, sales: salesData, purchases: purchasesData },
            criticalStock: criticalStockProducts,
            technicianStats,
            overdueOrders,
            technicianPerformance,
            repairsByEquipmentType,
            annualBilling: {
                year: selectedYear,
                total: invoices.filter(inv => new Date(inv.date).getFullYear() === selectedYear).reduce((s, i) => s + i.total, 0),
                paid: invoices.filter(inv => new Date(inv.date).getFullYear() === selectedYear).reduce((s, i) => s + i.paidAmount, 0),
                count: invoices.filter(inv => new Date(inv.date).getFullYear() === selectedYear).length
            },
            expenses: {
                totalMonth: totalExpensesMonth,
                count: expensesThisMonth.length,
                byCategory: expenseCategoryBreakdown,
                netBalance
            }
        };
    }, [quotes, invoices, serviceOrders, range, products, staff, calendars, selectedYear, expenses]);

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

                {/* Card 2: Órdenes Activas */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 transition-transform hover:shadow-md">
                     <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">ÓRDENES ACTIVAS</p>
                            <h3 className="text-2xl font-bold text-slate-800 mt-1">{metrics.orders.pending}</h3>
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

            {/* Facturas Emitidas vs Pagadas */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-700">FACTURAS EMITIDAS vs PAGADAS</h3>
                    <button
                        onClick={() => setMode('facturacion')}
                        className="text-slate-400 hover:text-sky-600 transition-colors"
                        title="Ver Facturación"
                    >
                        <ArrowRight size={20} />
                    </button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-sky-50 rounded-lg border border-sky-100">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Emitidas Hoy</p>
                        <p className="text-2xl font-bold text-slate-800">{metrics.invoices.stats.emittedToday.count}</p>
                        <p className="text-sm text-sky-600 font-medium">{currencyFormatter.format(metrics.invoices.stats.emittedToday.total)}</p>
                    </div>
                    <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Emitidas (Mes)</p>
                        <p className="text-2xl font-bold text-slate-800">{metrics.invoices.stats.emittedMonth.count}</p>
                        <p className="text-sm text-indigo-600 font-medium">{currencyFormatter.format(metrics.invoices.stats.emittedMonth.total)}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pagadas (Mes)</p>
                        <p className="text-2xl font-bold text-slate-800">{metrics.invoices.stats.paidMonth.count}</p>
                        <p className="text-sm text-green-600 font-medium">{currencyFormatter.format(metrics.invoices.stats.paidMonth.total)}</p>
                    </div>
                </div>
            </div>

            {/* Total Facturado Anual */}
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-6 rounded-xl shadow-sm text-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white/80">TOTAL FACTURADO ANUAL</h3>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="bg-white/20 border border-white/30 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    >
                        {availableYears.map(year => (
                            <option key={year} value={year} className="text-slate-800">{year}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-end gap-4">
                    <div>
                        <p className="text-3xl font-bold text-white">{currencyFormatter.format(metrics.annualBilling.total)}</p>
                        <p className="text-sm font-medium text-white/70 mt-1">{metrics.annualBilling.count} facturas emitidas</p>
                    </div>
                    <div className="flex-1 text-right">
                        <p className="text-xs font-bold uppercase tracking-wider text-white/70 mb-1">Cobrado:</p>
                        <p className="text-xl font-bold text-emerald-300">{currencyFormatter.format(metrics.annualBilling.paid)}</p>
                        <p className="text-xs font-bold uppercase tracking-wider text-white/70 mt-2 mb-1">Pendiente:</p>
                        <p className="text-lg font-bold text-amber-300">{currencyFormatter.format(metrics.annualBilling.total - metrics.annualBilling.paid)}</p>
                    </div>
                </div>
            </div>

            {/* Gastos del Mes */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <Receipt className="text-red-500" size={20} />
                        GASTOS DEL MES
                    </h3>
                    <button
                        onClick={() => setMode('gastos')}
                        className="text-slate-400 hover:text-sky-600 transition-colors"
                        title="Ver Gastos"
                    >
                        <ArrowRight size={20} />
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Gastos</p>
                        <p className="text-2xl font-bold text-slate-800">RD$ {formatCurrency(metrics.expenses.totalMonth)}</p>
                        <p className="text-sm text-red-500 font-medium">{metrics.expenses.count} registros</p>
                    </div>
                    <div className={`p-4 rounded-lg border ${metrics.expenses.netBalance >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Balance Neto (Mes)</p>
                        <p className="text-2xl font-bold text-slate-800">
                            RD$ {formatCurrency(Math.abs(metrics.expenses.netBalance))}
                        </p>
                        <p className={`text-sm font-medium ${metrics.expenses.netBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {metrics.expenses.netBalance >= 0 ? 'Ganancia' : 'Pérdida'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Órdenes Atrasadas (SLA) */}
            {metrics.overdueOrders.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200 bg-red-50/30">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-red-700 flex items-center gap-2">
                            <Clock className="text-red-500" size={20} />
                            ÓRDENES ATRASADAS ({metrics.overdueOrders.length})
                            <span className="text-xs font-normal text-red-500 ml-2">SLA: 24 horas</span>
                        </h3>
                        <button
                            onClick={() => setMode('calendar')}
                            className="text-red-400 hover:text-red-600 transition-colors"
                            title="Ver Órdenes"
                        >
                            <ArrowRight size={20} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {metrics.overdueOrders.slice(0, 8).map(order => (
                            <div key={order.id} className="p-4 bg-white border border-red-200 rounded-lg shadow-sm">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{order.orderNumber}</p>
                                        <p className="text-base font-bold text-slate-800 truncate">{order.customerName}</p>
                                    </div>
                                    <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-medium ${
                                        order.status === 'Pendiente' ? 'bg-amber-100 text-amber-700' :
                                        order.status === 'En Proceso' ? 'bg-blue-100 text-blue-700' :
                                        order.status === 'No Agendado' ? 'bg-slate-100 text-slate-600' :
                                        'bg-slate-100 text-slate-600'
                                    }`}>
                                        {order.status}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 truncate mb-2">{order.applianceType}</p>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500 truncate">{order.technicianName}</span>
                                    <span className="text-red-600 font-bold">
                                        {order.daysSinceCreation > 0 ? `${order.daysSinceCreation}d` : `${order.hoursSinceCreation}h`} atraso
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    {metrics.overdueOrders.length > 8 && (
                        <p className="text-center text-sm text-red-500 mt-4">
                            Y {metrics.overdueOrders.length - 8} órdenes más atrasadas...
                        </p>
                    )}
                </div>
            )}

            {/* Bottom Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Sales / Purchases */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-700">VENTAS / COMPRAS</h3>
                        <div className="flex gap-2 items-center">
                             {/* Simple Legend */}
                             <div className="flex items-center gap-1 text-xs text-slate-500"><div className="w-3 h-3 bg-sky-400 rounded-sm"></div> Ventas</div>
                             <div className="flex items-center gap-1 text-xs text-slate-500"><div className="w-3 h-3 bg-pink-500 rounded-sm"></div> Compras</div>
                             <button
                                onClick={() => setMode('facturacion')}
                                className="text-slate-400 hover:text-sky-600 ml-2 transition-colors"
                                title="Ver Facturación"
                            >
                                <ArrowRight size={20} />
                            </button>
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
                        <button
                            onClick={() => setMode('facturacion')}
                            className="text-slate-400 hover:text-sky-600 transition-colors"
                            title="Ver Facturación"
                        >
                            <ArrowRight size={20} />
                        </button>
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

            {/* Critical Stock Section */}
            {metrics.criticalStock.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <AlertTriangle className="text-amber-500" size={20} />
                            REPUESTOS CRÍTICOS (Stock Bajo)
                        </h3>
                        <button
                            onClick={() => setMode('productos')}
                            className="text-slate-400 hover:text-sky-600 transition-colors"
                            title="Ver Productos"
                        >
                            <ArrowRight size={20} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {metrics.criticalStock.slice(0, 8).map(product => (
                            <div key={product.id} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-800 text-sm truncate">{product.name}</p>
                                        <p className="text-xs text-slate-500">{product.code}</p>
                                    </div>
                                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${
                                        product.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                        {product.stock}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    {metrics.criticalStock.length > 8 && (
                        <p className="text-center text-sm text-slate-500 mt-4">
                            Y {metrics.criticalStock.length - 8} productos más con stock bajo...
                        </p>
                    )}
                </div>
            )}

            {/* Estado de Casos por Técnico */}
            {metrics.technicianStats.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <Users className="text-indigo-500" size={20} />
                            ESTADO DE CASOS POR TÉCNICO
                        </h3>
                        <button
                            onClick={() => setMode('staff')}
                            className="text-slate-400 hover:text-sky-600 transition-colors"
                            title="Ver Personal"
                        >
                            <ArrowRight size={20} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {metrics.technicianStats.map(tech => (
                            <div key={tech.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                                <div className="flex items-center gap-3 mb-3">
                                    {tech.photo ? (
                                        <img
                                            src={tech.photo}
                                            alt={tech.name}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                            <span className="text-indigo-600 font-bold text-sm">
                                                {tech.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-800 text-sm truncate">{tech.name}</p>
                                        <p className="text-xs text-slate-500">{tech.total} órdenes total</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="p-2 bg-amber-50 rounded">
                                        <p className="text-lg font-bold text-amber-600">{tech.pending}</p>
                                        <p className="text-[10px] text-amber-700">Pendiente</p>
                                    </div>
                                    <div className="p-2 bg-blue-50 rounded">
                                        <p className="text-lg font-bold text-blue-600">{tech.inProgress}</p>
                                        <p className="text-[10px] text-blue-700">En Proceso</p>
                                    </div>
                                    <div className="p-2 bg-green-50 rounded">
                                        <p className="text-lg font-bold text-green-600">{tech.completed}</p>
                                        <p className="text-[10px] text-green-700">Completado</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Rendimiento por Técnico (últimos 30 días) */}
            {metrics.technicianPerformance.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <TrendingUp className="text-emerald-500" size={20} />
                            RENDIMIENTO POR TÉCNICO
                            <span className="text-xs font-normal text-slate-400 ml-2">Últimos 30 días</span>
                        </h3>
                        <button
                            onClick={() => setMode('staff')}
                            className="text-slate-400 hover:text-sky-600 transition-colors"
                            title="Ver Personal"
                        >
                            <ArrowRight size={20} />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {metrics.technicianPerformance.map(tech => {
                            return (
                                <div key={tech.id} className="flex items-center gap-4">
                                    {/* Avatar */}
                                    {tech.photo ? (
                                        <img
                                            src={tech.photo}
                                            alt={tech.name}
                                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                            <span className="text-emerald-600 font-bold text-sm">
                                                {tech.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}

                                    {/* Name and stats */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-slate-700 text-sm truncate">{tech.name}</span>
                                            <div className="flex items-center gap-3 text-xs text-slate-500 flex-shrink-0 ml-2">
                                                <span>{tech.completed}/{tech.total} completadas</span>
                                                <span className={`font-bold ${
                                                    tech.completionRate >= 80 ? 'text-emerald-600' :
                                                    tech.completionRate >= 50 ? 'text-amber-600' :
                                                    'text-red-600'
                                                }`}>
                                                    {tech.completionRate}%
                                                </span>
                                            </div>
                                        </div>
                                        {/* Progress bar */}
                                        <div className="w-full bg-slate-100 rounded-full h-3">
                                            <div
                                                className={`h-3 rounded-full transition-all duration-500 ${
                                                    tech.completionRate >= 80 ? 'bg-emerald-500' :
                                                    tech.completionRate >= 50 ? 'bg-amber-500' :
                                                    'bg-red-500'
                                                }`}
                                                style={{ width: `${tech.completionRate}%` }}
                                            ></div>
                                        </div>
                                        {tech.revenue > 0 && (
                                            <p className="text-xs text-slate-400 mt-1">
                                                Facturado: {currencyFormatter.format(tech.revenue)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Reparaciones por Tipo de Equipo */}
            {metrics.repairsByEquipmentType.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <Wrench className="text-sky-500" size={20} />
                            REPARACIONES POR TIPO DE EQUIPO
                        </h3>
                        <button
                            onClick={() => setMode('calendar')}
                            className="text-slate-400 hover:text-sky-600 transition-colors"
                            title="Ver Órdenes"
                        >
                            <ArrowRight size={20} />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {metrics.repairsByEquipmentType.map((item, index) => {
                            const maxCount = metrics.repairsByEquipmentType[0]?.count || 1;
                            const intensity = Math.round((item.count / maxCount) * 100);
                            const bgColor = index === 0 ? 'bg-sky-500' :
                                          index === 1 ? 'bg-sky-400' :
                                          index === 2 ? 'bg-sky-300' :
                                          'bg-sky-200';
                            const textColor = index < 3 ? 'text-white' : 'text-sky-800';

                            return (
                                <div
                                    key={item.type}
                                    className={`p-4 rounded-lg ${bgColor} ${textColor} text-center transition-transform hover:scale-105`}
                                >
                                    <p className="text-2xl font-bold">{item.count}</p>
                                    <p className={`text-xs ${index < 3 ? 'text-white/80' : 'text-sky-600'} truncate`} title={item.type}>
                                        {item.type}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
