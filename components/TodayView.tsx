
import React, { useContext, useMemo, useState, useRef, useEffect } from 'react';
import { AppContext, AppContextType, ServiceOrder, ServiceOrderStatus } from '../src/types';
import { CalendarClock, User, Wrench, Info, Check, ChevronDown, Trash2, RefreshCw } from 'lucide-react';
import { ServiceOrderDetailsModal } from './ServiceOrderDetailsModal';
import { CancelOrderModal } from './DeleteOrderModal';

const statusDisplayConfig: Record<ServiceOrderStatus, { bg: string; text: string; hover: string; ring: string; }> = {
    Pendiente: { bg: 'bg-amber-500', text: 'text-white', hover: 'hover:bg-amber-600', ring: 'focus:ring-amber-500' },
    'En Proceso': { bg: 'bg-green-500', text: 'text-white', hover: 'hover:bg-green-600', ring: 'focus:ring-green-500' },
    Completado: { bg: 'bg-sky-500', text: 'text-white', hover: 'hover:bg-sky-600', ring: 'focus:ring-sky-500' },
    Garantía: { bg: 'bg-red-500', text: 'text-white', hover: 'hover:bg-red-600', ring: 'focus:ring-red-500' },
    Cancelado: { bg: 'bg-slate-500', text: 'text-white', hover: 'hover:bg-slate-600', ring: 'focus:ring-slate-500' },
    'Por Confirmar': { bg: 'bg-indigo-500', text: 'text-white', hover: 'hover:bg-indigo-600', ring: 'focus:ring-indigo-500' },
    'No Agendado': { bg: 'bg-slate-500', text: 'text-white', hover: 'hover:bg-slate-600', ring: 'focus:ring-slate-500' },
};

const statusOrder: ServiceOrderStatus[] = ['Pendiente', 'En Proceso', 'Completado', 'Garantía', 'Cancelado'];

const StatusDropdown: React.FC<{ orderId: string, currentStatus: ServiceOrderStatus }> = ({ orderId, currentStatus }) => {
    const { updateServiceOrderStatus } = useContext(AppContext) as AppContextType;
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const colors = statusDisplayConfig[currentStatus] || statusDisplayConfig.Cancelado;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (status: ServiceOrderStatus) => {
        updateServiceOrderStatus(orderId, status);
        setIsOpen(false);
    };

    return (
        <div ref={dropdownRef} className="relative inline-block text-left" onClick={e => e.stopPropagation()}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={currentStatus === 'Cancelado'}
                className={`flex items-center justify-between w-32 text-xs font-medium py-1.5 px-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors.bg} ${colors.text} ${colors.hover} ${colors.ring} disabled:opacity-70 disabled:cursor-not-allowed`}
            >
                <span>{currentStatus}</span>
                <ChevronDown size={14} />
            </button>

            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                        {statusOrder.map(status => {
                            const optionColors = statusDisplayConfig[status];
                            return (
                                <button
                                    key={status}
                                    onClick={() => handleSelect(status)}
                                    className={`w-full text-left flex items-center justify-between px-4 py-2 text-sm font-medium transition-colors ${optionColors.bg} ${optionColors.text} ${optionColors.hover}`}
                                >
                                    <span>{status}</span>
                                    {currentStatus === status && <Check size={16} />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};


export const TodayView: React.FC = () => {
    const { serviceOrders, staff, calendars, currentUser } = useContext(AppContext) as AppContextType;
    const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
    const [orderToCancel, setOrderToCancel] = useState<ServiceOrder | null>(null);

    const todayOrders = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        return serviceOrders
            .filter(order => {
                if (!order.start) return false;
                const orderDate = new Date(order.start);
                return orderDate >= startOfToday && orderDate <= endOfToday;
            })
            .sort((a, b) => a.start!.getTime() - b.start!.getTime());
    }, [serviceOrders]);

    const getTechnicianName = (calendarId?: string): string => {
        if (!calendarId) return 'No asignado';
        const calendar = calendars.find(c => c.id === calendarId);
        const technician = staff.find(s => s.id === calendar?.userId);
        return technician?.name || 'No asignado';
    };

    const getCalendarColor = (calendarId?: string): string => {
        if (!calendarId) return '#3B82F6';
        return calendars.find(c => c.id === calendarId)?.color || '#3B82F6';
    };

    const handleOpenCancelModal = (e: React.MouseEvent, order: ServiceOrder) => {
        e.stopPropagation();
        setOrderToCancel(order);
    };

    return (
        <>
            <div className="p-6 border border-slate-200 rounded-lg bg-white shadow-md">
                <h3 className="text-2xl font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <CalendarClock size={22} className="text-sky-600" />
                    Agenda de Hoy ({new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })})
                </h3>
                {todayOrders.length > 0 ? (
                    <div className="space-y-3">
                        {todayOrders.map(order => {
                            const technician = staff.find(s => s.calendarId === order.calendarId);
                            const creator = staff.find(s => s.id === order.createdById);
                            return (
                                <div 
                                    key={order.id} 
                                    className={`p-3 border-l-4 rounded-r-md transition-colors ${order.status === 'Cancelado' ? 'bg-slate-200 opacity-60' : 'bg-slate-50 cursor-pointer hover:bg-slate-100'}`}
                                    style={{ borderColor: getCalendarColor(order.calendarId) }}
                                    onClick={() => setSelectedOrder(order)}
                                >
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                        <div className="w-full">
                                            <div className="flex items-center gap-2">
                                                <p className={`font-semibold text-slate-800 truncate ${order.status === 'Cancelado' ? 'line-through' : ''}`}>
                                                    {order.start!.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - <span className="font-normal text-slate-500 mr-1">#{order.serviceOrderNumber}</span> {order.title}
                                                </p>
                                                {order.rescheduledCount && order.rescheduledCount > 0 && (
                                                    <span className="text-xs font-medium py-0.5 px-2 rounded-full bg-purple-100 text-purple-800 flex items-center gap-1">
                                                        <RefreshCw size={12}/> Reagendada
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                                                <User size={14} /> {order.customerName}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Creado: {new Date(order.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
                                            <StatusDropdown orderId={order.id} currentStatus={order.status} />
                                            {(currentUser?.role === 'administrador' || currentUser?.role === 'secretaria') && order.status !== 'Cancelado' && (
                                                <button
                                                    onClick={(e) => handleOpenCancelModal(e, order)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                                                    title="Cancelar Cita"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                     <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 mt-2 border-t border-slate-200">
                                        <div className="flex items-center gap-1.5">
                                            <Wrench size={12}/>
                                            <span>Téc: <strong>{technician?.name || 'Sin Asignar'}</strong></span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <User size={12}/>
                                            <span>Resp: <strong>{creator?.name || 'Sistema'}</strong></span>
                                        </div>
                                    </div>
                                </div>
                            )})}
                    </div>
                ) : (
                    <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-md flex items-center justify-center gap-3">
                        <Info size={18} />
                        <p>No hay órdenes de servicio programadas para hoy.</p>
                    </div>
                )}
            </div>
            <ServiceOrderDetailsModal
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                order={selectedOrder}
            />
            {orderToCancel && (
                <CancelOrderModal
                    isOpen={!!orderToCancel}
                    onClose={() => setOrderToCancel(null)}
                    order={orderToCancel}
                />
            )}
        </>
    );
};
