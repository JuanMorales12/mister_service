import React, { useState, useMemo, useContext } from 'react';
import { AppContext, AppContextType, ServiceOrder } from '../src/types';
import { BarChart3, Wrench, ShieldAlert, CheckCircle, Calendar, User, X, ArrowLeft } from 'lucide-react';
import { ServiceOrderDetailsModal } from './ServiceOrderDetailsModal';


const DrilldownModal: React.FC<{
  title: string;
  items: ServiceOrder[];
  onClose: () => void;
  onOrderClick: (order: ServiceOrder) => void;
}> = ({ title, items, onClose, onOrderClick }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl relative max-h-[90vh] flex flex-col">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800"><X size={20} /></button>
                <h2 className="text-2xl font-bold mb-4 text-slate-700">{title} ({items.length})</h2>
                <div className="flex-grow overflow-y-auto pr-2 space-y-2">
                    {items.length === 0 ? (
                        <p className="text-center text-slate-500 py-8">No hay registros para mostrar.</p>
                    ) : (
                        items.map(order => (
                            <button key={order.id} onClick={() => onOrderClick(order)} className="w-full text-left p-3 bg-slate-50 rounded-md border hover:bg-slate-100">
                                <p className="font-semibold text-slate-800">#{order.serviceOrderNumber} - {order.customerName}</p>
                                <p className="text-sm text-slate-600">{order.applianceType}</p>
                                <p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleString()}</p>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};


const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; onClick?: () => void, count: number }> = ({ title, value, icon, onClick, count }) => (
    <button 
        onClick={onClick}
        disabled={!onClick || count === 0}
        className="bg-slate-50 p-4 rounded-lg flex items-center gap-4 text-left w-full disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:enabled:scale-105"
    >
        <div className="flex-shrink-0 bg-sky-100 text-sky-600 rounded-full h-12 w-12 flex items-center justify-center">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </button>
);

export const TechnicianPerformanceView: React.FC = () => {
    const { staff, serviceOrders, calendars, currentUser, setMode, goHome } = useContext(AppContext) as AppContextType;
    const [drilldown, setDrilldown] = useState<{ title: string; items: ServiceOrder[] } | null>(null);
    const [detailOrder, setDetailOrder] = useState<ServiceOrder | null>(null);
    
    if (currentUser?.role !== 'administrador') {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <h2 className="text-xl font-bold text-red-600">Acceso Denegado</h2>
                <p className="mt-2 text-slate-600">Solo los administradores pueden acceder a esta sección.</p>
            </div>
        );
    }

    const [dateMode, setDateMode] = useState<'day' | 'range'>('day');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTechId, setSelectedTechId] = useState<string>('');

    const technicians = useMemo(() => staff.filter(s => s.role === 'tecnico'), [staff]);

    const performanceData = useMemo(() => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const relevantTechs = selectedTechId ? technicians.filter(t => t.id === selectedTechId) : technicians;

        return relevantTechs.map(tech => {
            const techCalendar = calendars.find(c => c.userId === tech.id);
            if (!techCalendar) {
                return {
                    technician: tech,
                    stats: { completed: 0, warranty: 0, assigned: 0, completionRate: '0.0', warrantyRate: '0.0' },
                    data: { completedOrders: [], warrantyOrders: [], assignedOrders: [] }
                };
            }

            const assignedOrders = serviceOrders.filter(o => {
                const orderDate = o.end || o.start;
                return o.calendarId === techCalendar.id && orderDate && new Date(orderDate) >= start && new Date(orderDate) <= end;
            });
            
            const completedOrders = assignedOrders.filter(o => o.status === 'Completado');
            const warrantyOrders = assignedOrders.filter(o => o.status === 'Garantía');

            const completionRate = assignedOrders.length > 0 ? (completedOrders.length / assignedOrders.length * 100) : 0;
            const warrantyRate = completedOrders.length > 0 ? (warrantyOrders.length / completedOrders.length * 100) : 0;

            return {
                technician: tech,
                stats: {
                    completed: completedOrders.length,
                    warranty: warrantyOrders.length,
                    assigned: assignedOrders.length,
                    completionRate: completionRate.toFixed(1),
                    warrantyRate: warrantyRate.toFixed(1)
                },
                data: {
                    assignedOrders,
                    completedOrders,
                    warrantyOrders
                }
            };
        });

    }, [startDate, endDate, technicians, serviceOrders, calendars, selectedTechId]);

    const totalStats = useMemo(() => {
        const totals = performanceData.reduce((acc, data) => {
            acc.completed += data.stats.completed;
            acc.warranty += data.stats.warranty;
            acc.assigned += data.stats.assigned;
            return acc;
        }, { completed: 0, warranty: 0, assigned: 0 });

        return totals;
    }, [performanceData]);

    return (
        <div className="space-y-6">
            <button onClick={() => goHome()} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">
                <ArrowLeft size={16} />
                <span>Volver al Inicio</span>
            </button>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                    <h2 className="text-2xl font-bold text-slate-700 flex items-center gap-2">
                        <BarChart3 className="text-sky-600" /> Rendimiento Técnico
                    </h2>
                    <div className="w-full sm:w-auto space-y-4 sm:space-y-0 sm:flex sm:items-end sm:gap-4">
                        <div className="flex-1">
                            <label htmlFor="tech-filter" className="text-sm font-medium text-slate-600">Filtrar por Técnico:</label>
                            <select id="tech-filter" value={selectedTechId} onChange={e => setSelectedTechId(e.target.value)} className="mt-1 w-full p-2 border rounded-md bg-white">
                                <option value="">Todos los Técnicos</option>
                                {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="text-sm font-medium text-slate-600">Filtrar por Fecha:</label>
                            <div className="mt-1 flex items-center gap-2 p-1 bg-slate-100 rounded-lg">
                                <div className="flex rounded-md shadow-sm">
                                    <button type="button" onClick={() => setDateMode('day')} className={`px-3 py-1.5 text-sm font-medium border border-slate-300 rounded-l-md ${dateMode === 'day' ? 'bg-sky-600 text-white border-sky-600' : 'bg-white hover:bg-slate-50'}`}>Día</button>
                                    <button type="button" onClick={() => setDateMode('range')} className={`px-3 py-1.5 text-sm font-medium border border-slate-300 rounded-r-md ${dateMode === 'range' ? 'bg-sky-600 text-white border-sky-600' : 'bg-white hover:bg-slate-50'}`}>Rango</button>
                                </div>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={e => {
                                        setStartDate(e.target.value);
                                        if (dateMode === 'day') {
                                            setEndDate(e.target.value);
                                        }
                                    }}
                                    className="py-1.5 px-2 border bg-white border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                                {dateMode === 'range' && (
                                    <>
                                        <span className="text-slate-500 text-sm">a</span>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={e => setEndDate(e.target.value)}
                                            min={startDate}
                                            className="py-1.5 px-2 border bg-white border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <StatCard title="Total Citas Completadas" value={totalStats.completed} count={totalStats.completed} icon={<CheckCircle size={24} />} />
                    <StatCard title="Total Reclamos de Garantía" value={totalStats.warranty} count={totalStats.warranty} icon={<ShieldAlert size={24} />} />
                    <StatCard title="Total Citas Asignadas" value={totalStats.assigned} count={totalStats.assigned} icon={<Calendar size={24} />} />
                </div>
            </div>

            <div className="space-y-6">
                {performanceData.map(({ technician, stats, data }) => (
                    <div key={technician.id} className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center mb-4">
                            <div className="flex-shrink-0 h-12 w-12 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center">
                                {technician.employeePhotoUrl ? (
                                    <img src={technician.employeePhotoUrl} alt={technician.name} className="h-full w-full object-cover" />
                                ) : (
                                    <User size={24} className="text-slate-500"/>
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 ml-4">{technician.name}</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                            <StatCard title="Asignadas" value={stats.assigned} count={stats.assigned} icon={<Calendar size={20} />} onClick={() => setDrilldown({ title: `Citas Asignadas a ${technician.name}`, items: data.assignedOrders })}/>
                            <StatCard title="Completadas" value={stats.completed} count={stats.completed} icon={<CheckCircle size={20} />} onClick={() => setDrilldown({ title: `Citas Completadas por ${technician.name}`, items: data.completedOrders })}/>
                            <StatCard title="Garantías" value={stats.warranty} count={stats.warranty} icon={<ShieldAlert size={20} />} onClick={() => setDrilldown({ title: `Garantías de ${technician.name}`, items: data.warrantyOrders })}/>
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <p className="text-sm font-medium text-slate-500">Tasa de Finalización</p>
                                <p className="text-2xl font-bold text-slate-800">{stats.completionRate}%</p>
                                <div className="w-full bg-slate-200 rounded-full h-2.5 mt-2">
                                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${stats.completionRate}%` }}></div>
                                </div>
                            </div>
                             <div className="bg-slate-50 p-4 rounded-lg">
                                <p className="text-sm font-medium text-slate-500">Tasa de Garantía</p>
                                <p className="text-2xl font-bold text-slate-800">{stats.warrantyRate}%</p>
                                <div className="w-full bg-slate-200 rounded-full h-2.5 mt-2">
                                    <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${stats.warrantyRate}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {performanceData.length === 0 && (
                     <div className="text-center py-8 text-slate-500 bg-white rounded-lg shadow-md">
                        <p>No hay datos de rendimiento para la selección actual.</p>
                     </div>
                )}
            </div>

            {drilldown && (
                <DrilldownModal
                    title={drilldown.title}
                    items={drilldown.items}
                    onClose={() => setDrilldown(null)}
                    onOrderClick={(order) => setDetailOrder(order)}
                />
            )}
            <ServiceOrderDetailsModal
                isOpen={!!detailOrder}
                onClose={() => setDetailOrder(null)}
                order={detailOrder}
            />
        </div>
    );
};