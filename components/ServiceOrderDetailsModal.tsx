
import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext, AppContextType, ServiceOrder, ServiceOrderStatus } from '../src/types';
import { X, Edit, Phone, MapPin, Wrench, User, Calendar as CalendarIcon, Save, Info, Search, Clock, History, RefreshCw, Camera, CheckCircle, Loader2 } from 'lucide-react';
import { CompleteOrderModal } from './CompleteOrderModal';

interface ServiceOrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ServiceOrder | null;
}

const statusColorClasses: Record<ServiceOrderStatus, string> = {
    Pendiente: 'bg-amber-500 text-white',
    'En Proceso': 'bg-green-500 text-white',
    Completado: 'bg-sky-500 text-white',
    Cancelado: 'bg-slate-500 text-white',
    'Por Confirmar': 'bg-indigo-500 text-white',
    Garantía: 'bg-red-500 text-white',
    'No Agendado': 'bg-slate-500 text-white',
};

export const ServiceOrderDetailsModal: React.FC<ServiceOrderDetailsModalProps> = ({ isOpen, onClose, order }) => {
  const { staff, calendars, updateServiceOrder, serviceOrders, currentUser } = useContext(AppContext) as AppContextType;
  const [isEditing, setIsEditing] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Editable fields state
  const [applianceType, setApplianceType] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [serviceNotes, setServiceNotes] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [calendarId, setCalendarId] = useState('');
  const [status, setStatus] = useState<ServiceOrderStatus>('Pendiente');
  const [isCheckupOnly, setIsCheckupOnly] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  
  const technician = useMemo(() => staff.find(s => s.calendarId === order?.calendarId), [staff, order]);
  const creator = useMemo(() => staff.find(s => s.id === order?.createdById), [staff, order]);

  useEffect(() => {
    if (isOpen && order) {
      setApplianceType(order.applianceType || '');
      setIssueDescription(order.issueDescription || '');
      setServiceNotes(order.serviceNotes || '');
      setCalendarId(order.calendarId || '');
      setStatus(order.status);
      setIsCheckupOnly(order.isCheckupOnly || false);
      if (order.start) {
        const d = new Date(order.start);
        setAppointmentDate(d.toISOString().split('T')[0]);
        setAppointmentTime(d.toTimeString().substring(0, 5));
      } else {
        setAppointmentDate('');
        setAppointmentTime('');
      }
      setIsEditing(false); // Reset to view mode on open
    }
  }, [isOpen, order]);

  const occupiedTimeSlots = useMemo(() => {
    if (!calendarId || !appointmentDate || !order) return new Set();

    const occupied = new Set<string>();
    const selectedDayStart = new Date(`${appointmentDate}T00:00:00`);
    const selectedDayEnd = new Date(`${appointmentDate}T23:59:59`);

    serviceOrders.forEach(o => {
      if (o.id !== order.id && o.calendarId === calendarId && o.start && o.status !== 'Cancelado') {
        const orderDate = new Date(o.start);
        if (orderDate >= selectedDayStart && orderDate <= selectedDayEnd) {
          occupied.add(orderDate.toTimeString().substring(0, 5));
        }
      }
    });
    return occupied;
  }, [calendarId, appointmentDate, serviceOrders, order]);

  useEffect(() => {
    if (isEditing && calendarId && appointmentDate) {
      const selectedCalendar = calendars.find(c => c.id === calendarId);
      const dayOfWeek = new Date(appointmentDate).getUTCDay();
      const dayAvailability = selectedCalendar?.availability?.find(d => d.dayOfWeek === dayOfWeek);
      setAvailableTimeSlots(dayAvailability?.slots.map(slot => slot.startTime).sort() || []);
    } else {
      setAvailableTimeSlots([]);
    }
  }, [isEditing, calendarId, appointmentDate, calendars]);

  const handleSave = async () => {
    if (!order) return;

    if (isEditing) {
        setIsSaving(true);
        try {
            const start = new Date(`${appointmentDate}T${appointmentTime}`);
            const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour duration

            await updateServiceOrder(order.id, {
                applianceType,
                issueDescription,
                serviceNotes,
                start,
                end,
                calendarId,
                status,
                isCheckupOnly,
                title: `${applianceType} - ${order.customerName}`
            });
        } finally {
            setIsSaving(false);
        }
    }
    setIsEditing(false);
  };
  
  const handleCancelEdit = () => {
    if (order) {
        setApplianceType(order.applianceType || '');
        setIssueDescription(order.issueDescription || '');
        setServiceNotes(order.serviceNotes || '');
        setCalendarId(order.calendarId || '');
        setStatus(order.status);
        setIsCheckupOnly(order.isCheckupOnly || false);
        if (order.start) {
            const d = new Date(order.start);
            setAppointmentDate(d.toISOString().split('T')[0]);
            setAppointmentTime(d.toTimeString().substring(0, 5));
        }
    }
    setIsEditing(false);
  };
  
  const assignableStaff = useMemo(() => staff.filter(s => {
    if (!['tecnico', 'coordinador', 'administrador'].includes(s.role)) return false;
    const cal = calendars.find(c => c.id === s.calendarId);
    return cal?.active;
  }), [staff, calendars]);

  if (!isOpen || !order) return null;

  const isTechnicianUser = currentUser?.role === 'tecnico';
  const canEdit = !isTechnicianUser || ['Pendiente', 'En Proceso', 'Garantía'].includes(order.status);
  const canComplete = isTechnicianUser && ['Pendiente', 'En Proceso', 'Garantía'].includes(order.status);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[2000] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-[calc(100vw-2rem)] sm:max-w-2xl relative max-h-[90vh] flex flex-col">
          <header className="flex justify-between items-start pb-4 border-b">
              <div>
                <h2 className="text-2xl font-bold text-slate-700 flex items-center gap-2">
                    Detalles de la Orden <span className="font-mono text-xl text-slate-500">#{order.serviceOrderNumber}</span>
                </h2>
                <span className={`text-sm font-medium py-1 px-3 rounded-full mt-2 inline-block ${statusColorClasses[order.status]}`}>{order.status}</span>
              </div>
              <button onClick={onClose} className="text-slate-500 hover:text-slate-800 p-2"><X size={20} /></button>
          </header>

          <main className="space-y-4 py-4 flex-grow overflow-y-auto pr-2">
            {/* Customer Info */}
            <section>
              <h3 className="text-lg font-semibold text-slate-600 mb-2">Cliente</h3>
              <div className="p-3 bg-slate-50 border rounded-md">
                <p className="font-bold text-slate-800">{order.customerName}</p>
                <div className="text-sm text-slate-600 mt-1 space-y-1">
                  <p className="flex items-center gap-2"><Phone size={14}/> {order.customerPhone}</p>
                  <p className="flex items-start gap-2"><MapPin size={14} className="mt-0.5"/> {order.customerAddress}</p>
                </div>
              </div>
            </section>

             {/* Appointment Info */}
            <section>
              <h3 className="text-lg font-semibold text-slate-600 mb-2">Cita</h3>
              <div className="p-3 bg-slate-50 border rounded-md grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {isEditing ? (
                    <>
                        <div>
                            <label className="label-style">Fecha</label>
                            <input type="date" value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} className="input-style"/>
                        </div>
                         <div>
                            <label className="label-style">Hora</label>
                             <select value={appointmentTime} onChange={e => setAppointmentTime(e.target.value)} className="input-style" disabled={availableTimeSlots.length === 0}>
                                <option value="" disabled>Seleccionar</option>
                                {availableTimeSlots.map(time => <option key={time} value={time} disabled={occupiedTimeSlots.has(time)}>{time}{occupiedTimeSlots.has(time) ? ' (Ocupado)' : ''}</option>)}
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="label-style">Asignar a Personal</label>
                            <select value={calendarId} onChange={e => setCalendarId(e.target.value)} className="input-style">
                                {assignableStaff.map(tech => <option key={tech.id} value={tech.calendarId}>{tech.name}</option>)}
                            </select>
                        </div>
                    </>
                 ) : (
                    <>
                        <p className="flex items-center gap-2"><CalendarIcon size={14}/> {order.start ? new Date(order.start).toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' }) : 'No agendado'}</p>
                        <p className="flex items-center gap-2"><Wrench size={14}/> <strong>Técnico:</strong> {technician?.name || 'Sin asignar'}</p>
                    </>
                 )}
              </div>
            </section>

             {/* Service Info */}
            <section>
              <h3 className="text-lg font-semibold text-slate-600 mb-2">Servicio</h3>
              <div className="p-3 bg-slate-50 border rounded-md space-y-3">
                 <div>
                    <label className="label-style">Asunto</label>
                    <input type="text" value={applianceType} onChange={e => setApplianceType(e.target.value)} readOnly={!isEditing} className="input-style"/>
                 </div>
                 <div>
                    <label className="label-style">Falla Reportada</label>
                    <textarea value={issueDescription} onChange={e => setIssueDescription(e.target.value)} readOnly={!isEditing} rows={3} className="input-style"></textarea>
                 </div>
                 <div className="flex items-center">
                    <input type="checkbox" id="isCheckupOnly" checked={isCheckupOnly} onChange={e => setIsCheckupOnly(e.target.checked)} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"/>
                    <label htmlFor="isCheckupOnly" className="ml-2 block text-sm text-slate-900">Solo Chequeo/Diagnóstico</label>
                 </div>
              </div>
            </section>
            
            {/* Notes & History */}
            <section>
              <h3 className="text-lg font-semibold text-slate-600 mb-2">Notas e Historial</h3>
               <div className="p-3 bg-slate-50 border rounded-md space-y-3">
                    <div>
                        <label className="label-style">Notas de Servicio (Trabajo Realizado)</label>
                        <textarea value={serviceNotes} onChange={e => setServiceNotes(e.target.value)} readOnly={!isEditing && !isTechnicianUser} rows={4} className="input-style" placeholder={isEditing || isTechnicianUser ? 'Añade notas sobre el trabajo realizado...' : 'Sin notas'}/>
                    </div>
                    {order.history && order.history.length > 0 && (
                        <div>
                             <label className="label-style flex items-center gap-2"><History size={16}/> Historial de Cambios</label>
                             <ul className="mt-2 space-y-1 max-h-24 overflow-y-auto text-xs text-slate-500">
                                {order.history.map((log, i) => {
                                    const user = staff.find(s => s.id === log.userId);
                                    return (
                                        <li key={i} className="flex justify-between">
                                            <span><strong>{log.action}</strong> por {user?.name || log.userId}</span>
                                            <span className="text-slate-400">{new Date(log.timestamp).toLocaleString('es-ES')}</span>
                                        </li>
                                    );
                                })}
                             </ul>
                        </div>
                    )}
               </div>
            </section>

             {order.completionPhotoUrl && (
                <section>
                    <h3 className="text-lg font-semibold text-slate-600 mb-2">Prueba de Finalización</h3>
                    <div className="p-3 bg-slate-50 border rounded-md">
                        <img src={order.completionPhotoUrl} alt="Foto del servicio completado" className="max-h-60 rounded-md mx-auto"/>
                        {order.completionLatitude && order.completionLongitude &&
                            <a href={`https://www.google.com/maps/search/?api=1&query=${order.completionLatitude},${order.completionLongitude}`} target="_blank" rel="noopener noreferrer" className="mt-2 text-xs flex items-center justify-center gap-1 text-sky-600 hover:underline">
                                <MapPin size={12}/> Ver ubicación de la foto
                            </a>
                        }
                    </div>
                </section>
             )}

          </main>

          <footer className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
            <p className="text-xs text-slate-400">Creado por: {creator?.name || 'Sistema'} el {new Date(order.createdAt).toLocaleDateString()}</p>
            <div className="flex gap-2">
                {isEditing ? (
                    <>
                        <button onClick={handleCancelEdit} className="px-4 py-2 text-sm font-medium rounded-md bg-slate-200 hover:bg-slate-300" disabled={isSaving}>Cancelar</button>
                        <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white rounded-md bg-sky-600 hover:bg-sky-700 flex items-center gap-2" disabled={isSaving}>
                            {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                            {isSaving ? 'Guardando...' : 'Guardar'}
                        </button>
                    </>
                ) : (
                    <>
                        {canEdit && <button onClick={() => setIsEditing(true)} className="px-4 py-2 text-sm font-medium rounded-md bg-slate-200 hover:bg-slate-300 flex items-center gap-2"><Edit size={16}/> Editar</button>}
                        {canComplete && <button onClick={() => setIsCompleteModalOpen(true)} className="px-4 py-2 text-sm font-medium text-white rounded-md bg-green-600 hover:bg-green-700 flex items-center gap-2"><CheckCircle size={16}/> Completar</button>}
                    </>
                )}
            </div>
          </footer>
        </div>
      </div>
      {isCompleteModalOpen && <CompleteOrderModal isOpen={isCompleteModalOpen} onClose={() => { setIsCompleteModalOpen(false); onClose(); }} order={order} />}
      <style>{`.input-style { display: block; width: 100%; padding: 0.5rem 0.75rem; background-color: white; border: 1px solid #cbd5e1; border-radius: 0.375rem; } .input-style:read-only { background-color: #f1f5f9; cursor: not-allowed; } .label-style { display: block; text-sm font-medium text-slate-500; }`}</style>
    </>
  );
};
