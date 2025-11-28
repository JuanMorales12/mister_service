

import React, { useContext, useState } from 'react';
import { AppContext, AppContextType, ServiceOrder } from '../src/types';
import { CalendarCheck, Info, CheckCircle, Trash2, ArrowLeft } from 'lucide-react';
import { ConfirmAppointmentModal } from './ConfirmAppointmentModal';
import { ArchiveAppointmentModal } from './ArchiveAppointmentModal';

export const UnconfirmedAppointmentsView: React.FC = () => {
    const { serviceOrders, currentUser, setMode } = useContext(AppContext) as AppContextType;
    const [orderToConfirm, setOrderToConfirm] = useState<ServiceOrder | null>(null);
    const [orderToArchive, setOrderToArchive] = useState<ServiceOrder | null>(null);

    // Filtrar citas por confirmar según el rol del usuario
    const unconfirmedOrders = serviceOrders.filter(o => {
        if (o.status !== 'Por Confirmar') return false;

        // Los administradores y secretarias ven todas las citas
        if (currentUser?.role === 'administrador' || currentUser?.role === 'secretaria') {
            return true;
        }

        // Los técnicos solo ven sus propias citas (asignadas a su calendario)
        if (currentUser?.role === 'tecnico') {
            return o.calendarId === currentUser.calendarId;
        }

        return true;
    });

    const handleConfirmClick = (order: ServiceOrder) => {
        setOrderToConfirm(order);
    };

    const handleArchiveClick = (order: ServiceOrder) => {
        setOrderToArchive(order);
    };

    const handleBackClick = () => {
        // Los técnicos vuelven a "Mis Órdenes", otros roles van al inicio
        if (currentUser?.role === 'tecnico') {
            setMode('my-orders');
        } else {
            setMode('inicio');
        }
    };

    return (
        <>
            <button onClick={handleBackClick} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 mb-6">
                <ArrowLeft size={16} />
                <span>Volver{currentUser?.role === 'tecnico' ? ' a Mis Órdenes' : ' al Inicio'}</span>
            </button>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4 text-slate-700 flex items-center gap-2">
                    <CalendarCheck size={22} className="text-sky-600" />
                    Citas por Confirmar ({unconfirmedOrders.length})
                </h2>
                {unconfirmedOrders.length > 0 ? (
                    <div className="space-y-4">
                        {unconfirmedOrders.map(order => (
                            <div key={order.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                                    <div>
                                        <p className="font-bold text-slate-800">
                                            {order.customerName}
                                            <span className="ml-2 text-sm font-normal text-slate-500">#{order.serviceOrderNumber}</span>
                                        </p>
                                        <p className="text-sm text-slate-500">{order.customerPhone}</p>
                                        <p className="text-sm text-slate-600 mt-1"><b>Servicio:</b> {order.applianceType}</p>
                                    </div>
                                    <div className="flex items-center gap-2 mt-3 sm:mt-0">
                                        <a
                                            href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-green-100 text-green-700 hover:bg-green-200"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                            Contactar
                                        </a>
                                        <button
                                            onClick={() => handleConfirmClick(order)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700"
                                        >
                                            <CheckCircle size={14} />
                                            Confirmar y Agendar
                                        </button>
                                        {['administrador', 'secretaria'].includes(currentUser?.role || '') && (
                                            <button
                                                onClick={() => handleArchiveClick(order)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                                            >
                                                <Trash2 size={14} />
                                                No Agendar
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-2 pt-2 border-t border-slate-200 space-y-1">
                                    <p className="text-sm text-slate-600"><b>Falla:</b> {order.issueDescription}</p>
                                    {order.start && (
                                        <p className="text-sm font-semibold text-sky-700">
                                            <b>Horario Solicitado:</b> {new Date(order.start).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </p>
                                    )}
                                    <p className="text-xs text-slate-500">
                                        <b>Creado el:</b> {new Date(order.createdAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-md flex items-center justify-center gap-3">
                        <Info size={18} />
                        <p>No hay citas pendientes de confirmación.</p>
                    </div>
                )}
            </div>
            {orderToConfirm && (
                <ConfirmAppointmentModal
                    isOpen={!!orderToConfirm}
                    onClose={() => setOrderToConfirm(null)}
                    order={orderToConfirm}
                />
            )}
            {orderToArchive && (
                <ArchiveAppointmentModal
                    isOpen={!!orderToArchive}
                    onClose={() => setOrderToArchive(null)}
                    order={orderToArchive}
                />
            )}
        </>
    );
};
