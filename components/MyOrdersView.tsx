import React, { useContext, useMemo, useState, useRef, useEffect } from 'react';
import { AppContext, AppContextType, ServiceOrder, ServiceOrderStatus } from '../src/types';
import { Loader2, Wrench, Info, Check, ChevronDown, User, ArrowLeft } from 'lucide-react';
import { ServiceOrderDetailsModal } from './ServiceOrderDetailsModal';
import { CompleteOrderModal } from './CompleteOrderModal';

const statusDisplayConfig: Record<ServiceOrderStatus, { bg: string; text: string; hover: string; ring: string; }> = {
    Pendiente: { bg: 'bg-amber-500', text: 'text-white', hover: 'hover:bg-amber-600', ring: 'focus:ring-amber-500' },
    'En Proceso': { bg: 'bg-green-500', text: 'text-white', hover: 'hover:bg-green-600', ring: 'focus:ring-green-500' },
    Completado: { bg: 'bg-sky-500', text: 'text-white', hover: 'hover:bg-sky-600', ring: 'focus:ring-sky-500' },
    Garantía: { bg: 'bg-red-500', text: 'text-white', hover: 'hover:bg-red-600', ring: 'focus:ring-red-500' },
    Cancelado: { bg: 'bg-slate-500', text: 'text-white', hover: 'hover:bg-slate-600', ring: 'focus:ring-slate-500' },
    'Por Confirmar': { bg: 'bg-indigo-500', text: 'text-white', hover: 'hover:bg-indigo-600', ring: 'focus:ring-indigo-500' },
    'No Agendado': { bg: 'bg-slate-500', text: 'text-white', hover: 'hover:bg-slate-600', ring: 'focus:ring-slate-500' },
};

const statusOrder: ServiceOrderStatus[] = ['Pendiente', 'En Proceso', 'Garantía', 'Completado']; // Technicians can complete orders via modal

const StatusDropdown: React.FC<{ orderId: string, currentStatus: ServiceOrderStatus, onCompleteClick: () => void }> = ({ orderId, currentStatus, onCompleteClick }) => {
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
        if (status === 'Completado') {
            // Open the complete modal instead of directly changing status
            setIsOpen(false);
            onCompleteClick();
        } else {
            updateServiceOrderStatus(orderId, status);
            setIsOpen(false);
        }
    };

    return (
        <div ref={dropdownRef} className="relative inline-block text-left" onClick={e => e.stopPropagation()}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={currentStatus === 'Cancelado' || currentStatus === 'Completado'}
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


export const MyOrdersView: React.FC = () => {
    const { serviceOrders, currentUser, staff, setMode, goHome } = useContext(AppContext) as AppContextType;
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [orderToComplete, setOrderToComplete] = useState<ServiceOrder | null>(null);
    const selectedOrder = useMemo(() => {
        if (!selectedOrderId) return null;
        return serviceOrders.find(o => o.id === selectedOrderId) || null;
    }, [serviceOrders, selectedOrderId]);
    const myOrders = useMemo(() => {
        if (!currentUser || !currentUser.calendarId) return [];
        
        return serviceOrders
            .filter(order => order.calendarId === currentUser.calendarId && order.start && order.status !== 'Por Confirmar' && order.status !== 'Cancelado' && order.status !== 'No Agendado')
            .sort((a,b) => a.start!.getTime() - b.start!.getTime());
    }, [serviceOrders, currentUser]);

    if (!currentUser) {
         return (
          <div className="flex flex-col items-center justify-center h-screen bg-slate-100">
            <Loader2 className="animate-spin h-12 w-12 text-sky-600" />
            <p className="mt-4 text-slate-600 font-medium">Cargando datos de usuario...</p>
          </div>
        );
    }
    
    return (
        <div className="space-y-6">
            {/* Solo mostrar el botón si el usuario no es técnico */}
            {currentUser?.role !== 'tecnico' && (
                <button onClick={() => goHome()} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 self-start">
                    <ArrowLeft size={16} />
                    <span>Volver al Inicio</span>
                </button>
            )}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-700 flex items-center gap-2">
                        <Wrench size={22} className="text-sky-600"/>
                        Mis Órdenes de Servicio
                    </h2>
                </div>
                
                {myOrders.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-md flex items-center justify-center gap-3">
                        <Info size={18} />
                        <p>No tienes órdenes de servicio asignadas.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {myOrders.map(order => {
                            const creator = staff.find(s => s.id === order.createdById);
                            return (
                            <div 
                                key={order.id} 
                                onClick={() => setSelectedOrderId(order.id)}
                                className="p-4 border-l-4 border-sky-500 rounded-r-md bg-slate-50 cursor-pointer hover:bg-slate-100"
                            >
                                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                                    <div className="flex-grow">
                                        <p className="font-semibold text-slate-800 truncate">
                                            <span className="text-sm font-normal text-slate-500">#{order.serviceOrderNumber}</span> {order.title}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {order.start!.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })} - {order.end!.toLocaleString('es-ES', { timeStyle: 'short' })}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Creado: {new Date(order.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 self-start sm:self-center">
                                        {currentUser?.role === 'tecnico' ? (
                                            <span className={`inline-flex items-center w-32 justify-center text-xs font-medium py-1.5 px-3 rounded-full ${statusDisplayConfig[order.status]?.bg || 'bg-slate-500'} ${statusDisplayConfig[order.status]?.text || 'text-white'}`}>
                                                {order.status}
                                            </span>
                                        ) : (
                                            <StatusDropdown orderId={order.id} currentStatus={order.status} onCompleteClick={() => setOrderToComplete(order)} />
                                        )}
                                    </div>
                                </div>
                                <div className="mt-2 pt-2 border-t border-slate-200 space-y-2">
                                    <p className="text-sm text-slate-600"><b>Falla:</b> {order.issueDescription}</p>
                                    <a 
                                        href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 font-medium"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                        Contactar Cliente ({order.customerName})
                                    </a>
                                     <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
                                        <div className="flex items-center gap-1.5">
                                            <User size={12} />
                                            <span>Responsable: <strong>{creator?.name || 'Sistema'}</strong></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )})}
                    </div>
                )}
                <ServiceOrderDetailsModal
                    isOpen={!!selectedOrder}
                    onClose={() => setSelectedOrderId(null)}
                    order={selectedOrder}
                />
                {orderToComplete && (
                    <CompleteOrderModal
                        isOpen={!!orderToComplete}
                        onClose={() => setOrderToComplete(null)}
                        order={orderToComplete}
                    />
                )}
            </div>
        </div>
    );
};