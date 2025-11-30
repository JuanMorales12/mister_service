

import React, { useContext, useEffect, useState, useRef } from 'react';
import { AppContext, AppContextType, ServiceOrder, ServiceOrderStatus } from '../src/types';
import { GoogleCalendarService } from '../services/googleCalendarService';
import { Loader2, PlusCircle, AlertTriangle, Check, ChevronDown, Trash2, RefreshCw, Wrench, User, ArrowLeft } from 'lucide-react';
import { CreateAppointmentModal } from './CreateAppointmentModal';
import { TodayView } from './TodayView';
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
                className={`flex items-center justify-between min-w-[8rem] text-xs font-medium py-2 px-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors.bg} ${colors.text} ${colors.hover} ${colors.ring} disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap`}
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


export const CalendarView: React.FC = () => {
  const { serviceOrders, googleAuth, calendars, staff, isGoogleConfigMissing, currentUser, setMode } = useContext(AppContext) as AppContextType;
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<ServiceOrder | null>(null);

  useEffect(() => {
    const fetchGoogleEvents = async () => {
      if (googleAuth.token && !isGoogleConfigMissing) {
        setIsLoading(true);
        setError(null);
        try {
          const events = await GoogleCalendarService.listUpcomingEvents();
          setGoogleEvents(events);
        } catch (err) {
          console.error("Error al obtener eventos de Google Calendar:", err);
          setError("No se pudieron cargar los eventos de Google Calendar. Intenta reconectar.");
        } finally {
          setIsLoading(false);
        }
      } else {
        setGoogleEvents([]);
      }
    };

    fetchGoogleEvents();
  }, [googleAuth.token, isGoogleConfigMissing]);
  
  const allServiceOrders = [...serviceOrders]
    .filter(order => order.status !== 'Por Confirmar' && order.start && order.end)
    .sort((a,b) => a.start!.getTime() - b.start!.getTime());

  const getCalendarColor = (calendarId?: string) => {
    if (!calendarId) return '#3B82F6';
    return calendars.find(c => c.id === calendarId)?.color || '#3B82F6';
  };

  const handleOpenCancelModal = (e: React.MouseEvent, order: ServiceOrder) => {
    e.stopPropagation();
    setOrderToCancel(order);
  };

  return (
    <div className="space-y-6">
       <button onClick={() => setMode('inicio')} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 self-start">
            <ArrowLeft size={16} />
            <span>Volver al Inicio</span>
        </button>
      <TodayView />
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-slate-700">Todas las Órdenes de Servicio</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
          >
            <PlusCircle size={16} />
            <span>Crear Orden de Servicio</span>
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center p-8">
              <Loader2 className="animate-spin h-8 w-8 text-sky-500" />
              <p className="ml-4 text-slate-500">Cargando eventos de Google Calendar...</p>
          </div>
        )}
        {error && <p className="text-red-500 bg-red-50 p-3 rounded-md">{error}</p>}
        
        {!isLoading && allServiceOrders.length === 0 && (
            <p className="text-slate-500">No hay órdenes de servicio programadas.</p>
        )}

        {!isLoading && allServiceOrders.length > 0 && (
          <div className="space-y-4">
              {allServiceOrders.map(order => {
                  const technician = staff.find(s => s.calendarId === order.calendarId);
                  const creator = staff.find(s => s.id === order.createdById);
                  return (
                  <div 
                    key={order.id} 
                    onClick={() => setSelectedOrder(order)}
                    className={`p-4 border-l-4 rounded-r-md transition-colors ${order.status === 'Cancelado' ? 'bg-slate-200 opacity-60' : 'bg-slate-50 cursor-pointer hover:bg-slate-100'}`}
                    style={{ borderColor: getCalendarColor(order.calendarId) }}
                  >
                      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                          <div className="flex-grow">
                              <div className="flex items-center gap-2">
                                <p className={`font-semibold text-slate-800 truncate ${order.status === 'Cancelado' ? 'line-through' : ''}`}>
                                    <span className="text-sm font-normal text-slate-500">#{order.serviceOrderNumber}</span> {order.title}
                                </p>
                                {order.rescheduledCount && order.rescheduledCount > 0 && (
                                    <span className="text-xs font-medium py-0.5 px-2 rounded-full bg-purple-100 text-purple-800 flex items-center gap-1">
                                        <RefreshCw size={12}/> Reagendada
                                    </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-500">
                                  {order.start!.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })} - {order.end!.toLocaleString('es-ES', { timeStyle: 'short' })}
                              </p>
                               <p className="text-xs text-slate-400 mt-1">
                                Creado: {new Date(order.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                               </p>
                          </div>
                          <div className="flex items-center gap-2 self-start sm:self-center flex-wrap justify-start sm:justify-end">
                            <StatusDropdown orderId={order.id} currentStatus={order.status} />
                            {(currentUser?.role === 'administrador' || currentUser?.role === 'secretaria') && order.status !== 'Cancelado' && (
                                <button
                                    onClick={(e) => handleOpenCancelModal(e, order)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                                    title="Cancelar Cita"
                                >
                                    <Trash2 size={14} />
                                    <span>Cancelar</span>
                                </button>
                            )}
                            {order.isGoogleSynced && (
                                <div className="flex-shrink-0" title="Sincronizado con Google Calendar">
                                    <img src="https://www.google.com/images/icons/product/calendar-32.png" alt="Google Calendar" className="h-5 w-5" />
                                </div>
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
        )}
      </div>

      <CreateAppointmentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={() => setIsModalOpen(false)}
        initialData={null}
      />
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
    </div>
  );
};
