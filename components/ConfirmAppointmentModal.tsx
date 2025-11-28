

import React, { useState, useContext, useMemo, useEffect, useCallback } from 'react';
import { AppContext, AppContextType, ServiceOrder } from '../src/types';
import { X } from 'lucide-react';
import { AddressAutocompleteInput } from './AddressAutocompleteInput';

interface ConfirmAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ServiceOrder;
}

export const ConfirmAppointmentModal: React.FC<ConfirmAppointmentModalProps> = ({ isOpen, onClose, order }) => {
  const { staff, calendars, confirmServiceOrder, serviceOrders, currentUser } = useContext(AppContext) as AppContextType;

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [applianceType, setApplianceType] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  
  // Scheduling state
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [calendarId, setCalendarId] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  
  const assignableStaff = useMemo(() => staff.filter(s => {
    if (!['tecnico', 'coordinador', 'administrador'].includes(s.role)) return false;
    const cal = calendars.find(c => c.id === s.calendarId);
    return cal?.active;
  }), [staff, calendars]);
  
  const occupiedTimeSlots = useMemo(() => {
    if (!calendarId || !appointmentDate) return new Set();

    const occupied = new Set<string>();
    const selectedDayStart = new Date(`${appointmentDate}T00:00:00`);
    const selectedDayEnd = new Date(`${appointmentDate}T23:59:59`);

    serviceOrders.forEach(o => {
        if (
            o.id !== order.id &&
            o.calendarId === calendarId &&
            o.start &&
            o.status !== 'Cancelado'
        ) {
            const orderDate = new Date(o.start);
            if (orderDate >= selectedDayStart && orderDate <= selectedDayEnd) {
                const hours = orderDate.getHours().toString().padStart(2, '0');
                const minutes = orderDate.getMinutes().toString().padStart(2, '0');
                occupied.add(`${hours}:${minutes}`);
            }
        }
    });

    return occupied;
}, [calendarId, appointmentDate, serviceOrders, order.id]);

  // Populate form on open
  useEffect(() => {
    if (isOpen && order) {
      setCustomerName(order.customerName);
      setCustomerPhone(order.customerPhone);
      setCustomerAddress(order.customerAddress);
      setLatitude(order.latitude);
      setLongitude(order.longitude);
      setApplianceType(order.applianceType);
      setIssueDescription(order.issueDescription);

      if (order.start) {
        const startDate = new Date(order.start);
        const yyyy = startDate.getFullYear();
        const mm = String(startDate.getMonth() + 1).padStart(2, '0');
        const dd = String(startDate.getDate()).padStart(2, '0');
        setAppointmentDate(`${yyyy}-${mm}-${dd}`);
      } else {
        setAppointmentDate('');
      }

      setAppointmentTime('');

      // Si es técnico, asignar automáticamente su calendario
      if (currentUser?.role === 'tecnico') {
        setCalendarId(currentUser.calendarId);
      } else {
        setCalendarId('');
      }

      setAvailableTimeSlots([]);
    }
  }, [isOpen, order, currentUser]);

  // Update available time slots
  useEffect(() => {
    if (calendarId && appointmentDate) {
      const selectedCalendar = calendars.find(c => c.id === calendarId);
      const [year, month, day] = appointmentDate.split('-').map(Number);
      // Use UTC methods to get day of week consistently across timezones
      const checkDate = new Date(Date.UTC(year, month - 1, day));
      const dayOfWeek = checkDate.getUTCDay();

      const dayAvailability = selectedCalendar?.availability?.find(d => d.dayOfWeek === dayOfWeek);

      if (dayAvailability?.slots.length) {
        const slots = dayAvailability.slots.map(slot => slot.startTime).sort();
        setAvailableTimeSlots(slots);
      } else {
        setAvailableTimeSlots([]);
      }
      setAppointmentTime(''); // Reset time
    } else {
      setAvailableTimeSlots([]);
    }
  }, [calendarId, appointmentDate, calendars]);

  const handlePlaceSelected = useCallback((details: { address: string; latitude?: number; longitude?: number }) => {
    setCustomerAddress(details.address);
    setLatitude(details.latitude);
    setLongitude(details.longitude);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!appointmentDate || !appointmentTime || !calendarId || !customerName || !customerPhone || !customerAddress || !applianceType || !issueDescription) {
        alert("Por favor, completa todos los campos del cliente, servicio y programación.");
        return;
    }

    const start = new Date(`${appointmentDate}T${appointmentTime}`);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour duration
    
    const isSlotOccupied = serviceOrders.some(o => 
        o.id !== order.id &&
        o.calendarId === calendarId &&
        o.status !== 'Cancelado' &&
        o.start &&
        new Date(o.start).getTime() === start.getTime()
    );

    if (isSlotOccupied) {
        alert("Este horario ya está ocupado para el técnico seleccionado. Por favor, elige otro horario.");
        return;
    }

    const updatedData: Partial<ServiceOrder> = {
      customerName,
      customerPhone,
      customerAddress,
      latitude,
      longitude,
      applianceType,
      issueDescription,
      title: `${applianceType} - ${customerName}`,
      start,
      end,
      calendarId,
    };
    
    confirmServiceOrder(order.id, updatedData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800">
          <X size={20} />
        </button>
        <h2 className="text-2xl font-bold mb-4 text-slate-700">Confirmar y Agendar Cita</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset className="border p-4 rounded-md">
            <legend className="text-lg font-semibold px-2 text-slate-600">Información del Cliente</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                    <label htmlFor="confirm-customerName" className="label-style">Nombre y Apellido</label>
                    <input type="text" id="confirm-customerName" value={customerName} onChange={e => setCustomerName(e.target.value)} required className="mt-1 input-style" />
                </div>
                <div>
                    <label htmlFor="confirm-customerPhone" className="label-style">Teléfono</label>
                    <input type="tel" id="confirm-customerPhone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required className="mt-1 input-style" />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="confirm-customerAddress" className="label-style">Dirección del Servicio</label>
                    <AddressAutocompleteInput 
                        value={customerAddress}
                        onChange={setCustomerAddress}
                        onPlaceSelected={handlePlaceSelected}
                        required
                    />
                </div>
            </div>
          </fieldset>
          
          <fieldset className="border p-4 rounded-md">
            <legend className="text-lg font-semibold px-2 text-slate-600">Detalles del Servicio</legend>
            <div className="grid grid-cols-1 gap-4 mt-2">
                <div>
                    <label htmlFor="confirm-applianceType" className="label-style">Tipo de Servicio / Asunto</label>
                    <input type="text" id="confirm-applianceType" value={applianceType} onChange={e => setApplianceType(e.target.value)} required className="mt-1 input-style" />
                </div>
                <div>
                    <label htmlFor="confirm-issueDescription" className="label-style">Falla o Servicio Solicitado</label>
                    <textarea id="confirm-issueDescription" value={issueDescription} onChange={e => setIssueDescription(e.target.value)} rows={3} required className="mt-1 input-style"></textarea>
                </div>
            </div>
          </fieldset>

           <fieldset className="border p-4 rounded-md">
            <legend className="text-lg font-semibold px-2 text-slate-600">Programación y Asignación</legend>
            <div className="space-y-4 mt-2">
                {/* Solo mostrar selector de personal para admin y secretaria */}
                {currentUser?.role !== 'tecnico' && (
                    <div>
                        <label htmlFor="confirm-calendarId" className="label-style"><b>1. Asignar a Personal</b></label>
                        <select id="confirm-calendarId" value={calendarId} onChange={e => setCalendarId(e.target.value)} required className="mt-1 input-style">
                            <option value="" disabled>Seleccionar un miembro del personal</option>
                            {assignableStaff.map(tech => {
                                const cal = calendars.find(c => c.id === tech.calendarId);
                                return cal ? <option key={cal.id} value={cal.id}>{tech.name}</option> : null;
                            })}
                        </select>
                    </div>
                )}
                <div>
                    <label htmlFor="confirm-date" className="label-style"><b>{currentUser?.role === 'tecnico' ? '1' : '2'}. Fecha de la Cita</b></label>
                    <input type="date" id="confirm-date" value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} required className="mt-1 input-style" disabled={!calendarId} min={new Date().toISOString().split('T')[0]} />
                </div>
                 <div>
                    <label className="label-style"><b>{currentUser?.role === 'tecnico' ? '2' : '3'}. Hora de Inicio</b></label>
                    {calendarId && appointmentDate ? (
                        availableTimeSlots.length > 0 ? (
                            <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {availableTimeSlots.map((time) => {
                                    const isOccupied = occupiedTimeSlots.has(time);
                                    return (
                                    <button
                                        type="button"
                                        key={time}
                                        onClick={() => !isOccupied && setAppointmentTime(time)}
                                        disabled={isOccupied}
                                        className={`w-full text-center p-3 rounded-md border text-sm font-semibold transition-colors ${
                                            appointmentTime === time
                                                ? 'bg-sky-600 text-white border-sky-600'
                                                : isOccupied
                                                ? 'bg-red-100 text-red-500 border-red-200 cursor-not-allowed line-through'
                                                : 'bg-white text-slate-700 border-slate-300 hover:bg-sky-50'
                                        }`}
                                    >
                                        {time}
                                    </button>
                                )})}
                            </div>
                        ) : (
                             <div className="mt-1 p-3 bg-slate-100 rounded-md text-center text-sm text-slate-500">
                                No hay horarios disponibles para este día.
                            </div>
                        )
                    ) : (
                        <div className="mt-1 p-3 bg-slate-100 rounded-md text-center text-sm text-slate-500">
                            Seleccione personal y fecha para ver los horarios.
                        </div>
                    )}
                </div>
            </div>
          </fieldset>

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700">
              Confirmar y Guardar
            </button>
          </div>
        </form>
        <style>{`.input-style { color: #0f172a; display: block; width: 100%; padding: 0.5rem 0.75rem; background-color: white; border: 1px solid #cbd5e1; border-radius: 0.375rem; box-shadow: sm; placeholder-slate-400; focus:outline-none focus:ring-sky-500 focus:border-sky-500; } .input-style:disabled { background-color: #f1f5f9; cursor: not-allowed; } .label-style { display: block; font-medium; color: #334155; }`}</style>
      </div>
    </div>
  );
};