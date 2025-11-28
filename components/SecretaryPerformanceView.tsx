import React, { useState, useMemo, useContext } from 'react';
import { AppContext, AppContextType, Customer, ServiceOrder } from '../src/types';
import { Activity, Calendar, UserPlus, CheckCircle, XCircle, Search, RefreshCw, X, User, ArrowLeft } from 'lucide-react';
import { ServiceOrderDetailsModal } from './ServiceOrderDetailsModal';

const DrilldownModal: React.FC<{
  title: string;
  items: (ServiceOrder | Customer)[];
  type: 'order' | 'customer';
  onClose: () => void;
  onOrderClick: (order: ServiceOrder) => void;
  onCustomerClick: (customer: Customer) => void;
}> = ({ title, items, type, onClose, onOrderClick, onCustomerClick }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl relative max-h-[90vh] flex flex-col">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800"><X size={20} /></button>
                <h2 className="text-2xl font-bold mb-4 text-slate-700">{title} ({items.length})</h2>
                <div className="flex-grow overflow-y-auto pr-2 space-y-2">
                    {items.length === 0 ? (
                        <p className="text-center text-slate-500 py-8">No hay registros para mostrar.</p>
                    ) : type === 'order' ? (
                        (items as ServiceOrder[]).map(order => (
                            <button key={order.id} onClick={() => onOrderClick(order)} className="w-full text-left p-3 bg-slate-50 rounded-md border hover:bg-slate-100">
                                <p className="font-semibold text-slate-800">#{order.serviceOrderNumber} - {order.customerName}</p>
                                <p className="text-sm text-slate-600">{order.applianceType}</p>
                                <p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleString()}</p>
                            </button>
                        ))
                    ) : (
                        (items as Customer[]).map(customer => (
                             <button key={customer.id} onClick={() => onCustomerClick(customer)} className="w-full text-left p-3 bg-slate-50 rounded-md border hover:bg-slate-100">
                                <p className="font-semibold text-slate-800">{customer.name}</p>
                                <p className="text-sm text-slate-600">{customer.phone}</p>
                                <p className="text-xs text-slate-400">{customer.address}</p>
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

export const SecretaryPerformanceView: React.FC = () => {
    const { staff, serviceOrders, customers, currentUser, setMode } = useContext(AppContext) as AppContextType;
    const { goHome } = useContext(AppContext)!;
    const [drilldown, setDrilldown] = useState<{ title: string; items: (ServiceOrder | Customer)[]; type: 'order' | 'customer' } | null>(null);
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
    const [selectedSecretaryId, setSelectedSecretaryId] = useState<string>('');

    const secretaries = useMemo(() => staff.filter(s => ['secretaria', 'administrador', 'coordinador'].includes(s.role)), [staff]);

    const handleSecretaryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedSecretaryId(e.target.value);
    };

    const performanceData = useMemo(() => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const relevantSecretaries = selectedSecretaryId ? secretaries.filter(s => s.id === selectedSecretaryId) : secretaries;

        return relevantSecretaries.map(secretary => {
            const confirmedOrders = serviceOrders.filter(o => o.confirmedById === secretary.id && new Date(o.history?.find(h=>h.action === 'Confirmado')?.timestamp || 0) >= start && new Date(o.history?.find(h=>h.action === 'Confirmado')?.timestamp || 0) <= end);
            const cancelledOrders = serviceOrders.filter(o => o.cancelledById === secretary.id && new Date(o.history?.find(h=>h.action === 'Cancelado')?.timestamp || 0) >= start && new Date(o.history?.find(h=>h.action === 'Cancelado')?.timestamp || 0) <= end);
            const rescheduledOrders = serviceOrders.filter(o => o.history?.some(h => h.action === 'Reagendado' && h.userId === secretary.id && new Date(h.timestamp) >= start && new Date(h.timestamp) <= end));
            const newCustomers = customers.filter(c => c.createdById === secretary.id && c.serviceHistory.length > 0 && new Date(serviceOrders.find(o => o.id === c.serviceHistory[0])!.createdAt) >= start && new Date(serviceOrders.find(o => o.id === c.serviceHistory[0])!.createdAt) <= end);
            
            const handledUnconfirmed = serviceOrders.filter(o => {
                const handledDate = o.status === 'No Agendado' ? o.history?.find(h => h.action === 'Creado' && h.userId === secretary.id)?.timestamp : o.history?.find(h => h.action === 'Confirmado')?.timestamp;
                if (!handledDate) return false;
                return (o.attendedById === secretary.id || o.confirmedById === secretary.id) && new Date(handledDate) >= start && new Date(handledDate) <= end;
            });

            const totalHandled = handledUnconfirmed.length;
            const confirmationRate = totalHandled > 0 ? (confirmedOrders.length / totalHandled * 100) : 0;

            return {
                secretary,
                stats: {
                    confirmed: confirmedOrders.length,
                    cancelled: cancelledOrders.length,
                    rescheduled: rescheduledOrders.length,
                    newClients: newCustomers.length,
                    confirmationRate: confirmationRate.toFixed(1)
                },
                data: {
                    confirmedOrders,
                    cancelledOrders,
                    rescheduledOrders,
                    newCustomers
                }
            };
        });

    }, [startDate, endDate, secretaries, serviceOrders, customers, selectedSecretaryId]);
    
    const totalStats = useMemo(() => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const filteredOrdersByDate = serviceOrders.filter(o => {
            const orderDate = o.end || o.start;
            if (!orderDate) return false;
            return new Date(orderDate) >= start && new Date(orderDate) <= end;
        });

        return {
            completed: filteredOrdersByDate.filter(o => o.status === 'Completado').length,
            cancelled: serviceOrders.filter(o => {
                const cancelLog = o.history?.find(h => h.action === 'Cancelado');
                if (!cancelLog) return false;
                const cancelDate = new Date(cancelLog.timestamp);
                return o.status === 'Cancelado' && cancelDate >= start && cancelDate <= end;
            }).length,
            rescheduled: serviceOrders.reduce((count, order) => {
                const rescheduleLogs = order.history?.filter(h => 
                    h.action === 'Reagendado' &&
                    new Date(h.timestamp) >= start &&
                    new Date(h.timestamp) <= end
                ) || [];
                return count + rescheduleLogs.length;
            }, 0),
        };
    }, [startDate, endDate, serviceOrders]);

    return (
        <div className="space-y-6">
            <button onClick={() => goHome()} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">
                <ArrowLeft size={16} />
                <span>Volver al Inicio</span>
            </button>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                    <h2 className="text-2xl font-bold text-slate-700 flex items-center gap-2">
                        <Activity className="text-sky-600" /> Rendimiento de Secretarías
                    </h2>
                    <div className="w-full sm:w-auto space-y-4 sm:space-y-0 sm:flex sm:items-end sm:gap-4">
                        <div className="flex-1">
                            <label htmlFor="secretary-filter" className="text-sm font-medium text-slate-600">Filtrar por Secretaria:</label>
                            <select id="secretary-filter" value={selectedSecretaryId} onChange={handleSecretaryChange} className="mt-1 w-full p-2 border rounded-md bg-white">
                                <option value="">Todas las Secretarías</option>
                                {secretaries.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
                    <StatCard title="Total Citas Canceladas" value={totalStats.cancelled} count={totalStats.cancelled} icon={<XCircle size={24} />} />
                    <StatCard title="Total Citas Reagendadas" value={totalStats.rescheduled} count={totalStats.rescheduled} icon={<RefreshCw size={24} />} />
                </div>
            </div>

            <div className="space-y-6">
                {performanceData.map(({ secretary, stats, data }) => (
                    <div key={secretary.id} className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center mb-4">
                            <div className="flex-shrink-0 h-12 w-12 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center">
                                {secretary.employeePhotoUrl ? (
                                    <img src={secretary.employeePhotoUrl} alt={secretary.name} className="h-full w-full object-cover" />
                                ) : (
                                    <UserPlus size={24} className="text-slate-500"/>
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 ml-4">{secretary.name}</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                            <StatCard title="Citas Confirmadas" value={stats.confirmed} count={stats.confirmed} icon={<Calendar size={20} />} onClick={() => setDrilldown({ title: `Citas Confirmadas por ${secretary.name}`, items: data.confirmedOrders, type: 'order'})} />
                            <StatCard title="Citas Canceladas" value={stats.cancelled} count={stats.cancelled} icon={<XCircle size={20} />} onClick={() => setDrilldown({ title: `Citas Canceladas por ${secretary.name}`, items: data.cancelledOrders, type: 'order'})} />
                            <StatCard title="Citas Reagendadas" value={stats.rescheduled} count={stats.rescheduled} icon={<RefreshCw size={20} />} onClick={() => setDrilldown({ title: `Citas Reagendadas por ${secretary.name}`, items: data.rescheduledOrders, type: 'order'})}/>
                            <StatCard title="Clientes Nuevos" value={stats.newClients} count={stats.newClients} icon={<UserPlus size={20} />} onClick={() => setDrilldown({ title: `Clientes Nuevos por ${secretary.name}`, items: data.newCustomers, type: 'customer'})} />
                             <div className="bg-slate-50 p-4 rounded-lg">
                                <p className="text-sm font-medium text-slate-500">Tasa de Confirmación</p>
                                <p className="text-2xl font-bold text-slate-800">{stats.confirmationRate}%</p>
                                <div className="w-full bg-slate-200 rounded-full h-2.5 mt-2">
                                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${stats.confirmationRate}%` }}></div>
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
                    type={drilldown.type}
                    onClose={() => setDrilldown(null)}
                    onOrderClick={(order) => setDetailOrder(order)}
                    onCustomerClick={() => setMode('customers')}
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