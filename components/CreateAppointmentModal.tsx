

import React, { useState, useContext, useMemo, useEffect, useCallback } from 'react';
import { AppContext, AppContextType, Customer } from '../src/types';
import { X, Loader2 } from 'lucide-react';
import { AddressAutocompleteInput } from './AddressAutocompleteInput';

interface CreateAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  initialData?: { calendarId: string; start: Date; } | null;
}

export const CreateAppointmentModal: React.FC<CreateAppointmentModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const { staff, calendars, addServiceOrder, customers, serviceOrders, setGlobalSuccess } = useContext(AppContext) as AppContextType;
  
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [applianceType, setApplianceType] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);
  const staffDropdownRef = React.useRef<HTMLDivElement>(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const assignableStaff = useMemo(() => staff.filter(s => {
    if (!['tecnico', 'coordinador', 'administrador'].includes(s.role)) return false;
    const cal = calendars.find(c => c.id === s.calendarId);
    return cal?.active;
  }), [staff, calendars]);
  
  const occupiedTimeSlots = useMemo(() => {
    if (selectedCalendarIds.length === 0 || !appointmentDate) return new Set();

    const occupied = new Set<string>();
    const selectedDayStart = new Date(`${appointmentDate}T00:00:00`);
    const selectedDayEnd = new Date(`${appointmentDate}T23:59:59`);

    serviceOrders.forEach(order => {
        const orderCalendarIds = order.calendarIds && order.calendarIds.length > 0
            ? order.calendarIds
            : order.calendarId ? [order.calendarId] : [];
        const hasOverlap = orderCalendarIds.some(id => selectedCalendarIds.includes(id));
        if (
            hasOverlap &&
            order.start &&
            order.status !== 'Cancelado' &&
            order.status !== 'No Agendado'
        ) {
            const orderDate = new Date(order.start);
            if (orderDate >= selectedDayStart && orderDate <= selectedDayEnd) {
                const hours = orderDate.getHours().toString().padStart(2, '0');
                const minutes = orderDate.getMinutes().toString().padStart(2, '0');
                occupied.add(`${hours}:${minutes}`);
            }
        }
    });

    return occupied;
}, [selectedCalendarIds, appointmentDate, serviceOrders]);

  // Close staff dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (staffDropdownRef.current && !staffDropdownRef.current.contains(event.target as Node)) {
        setIsStaffDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resetForm = useCallback(() => {
    setSelectedCustomerId('');
    setCustomerSearchQuery('');
    setCustomerSearchResults([]);
    setIsSearchFocused(false);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCustomerAddress('');
    setLatitude(undefined);
    setLongitude(undefined);
    setApplianceType('');
    setIssueDescription('');
    setSelectedCalendarIds([]);
    setIsStaffDropdownOpen(false);
    setAppointmentDate('');
    setAppointmentTime('');
    setAvailableTimeSlots([]);
  }, []);

  useEffect(() => {
    if (isOpen) {
        resetForm();
        if (initialData) {
            setSelectedCalendarIds([initialData.calendarId]);
            const startDate = new Date(initialData.start);
            const yyyy = startDate.getFullYear();
            const mm = String(startDate.getMonth() + 1).padStart(2, '0');
            const dd = String(startDate.getDate()).padStart(2, '0');
            setAppointmentDate(`${yyyy}-${mm}-${dd}`);

            const hours = startDate.getHours().toString().padStart(2, '0');
            const minutes = startDate.getMinutes().toString().padStart(2, '0');
            setAppointmentTime(`${hours}:${minutes}`);
        }
    }
  }, [isOpen, initialData, resetForm]);

  useEffect(() => {
    if (customerSearchQuery.trim() && !selectedCustomerId) {
      const lowercasedQuery = customerSearchQuery.toLowerCase();
      const digitsOnly = customerSearchQuery.replace(/\D/g, '');
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(lowercasedQuery) ||
        (digitsOnly.length >= 3 && customer.phone.replace(/\D/g, '').includes(digitsOnly))
      ).slice(0, 15);
      setCustomerSearchResults(filtered);
    } else {
      setCustomerSearchResults([]);
    }
  }, [customerSearchQuery, customers, selectedCustomerId]);

  useEffect(() => {
    if (selectedCalendarIds.length > 0 && appointmentDate) {
      const [year, month, day] = appointmentDate.split('-').map(Number);
      const checkDate = new Date(Date.UTC(year, month - 1, day));
      const dayOfWeek = checkDate.getUTCDay();

      // Compute intersection of available slots across all selected calendars
      let commonHourlySlots: string[] | null = null;
      for (const cId of selectedCalendarIds) {
        const cal = calendars.find(c => c.id === cId);
        if (!cal) {
          commonHourlySlots = [];
          break;
        }
        const dayAvailability = cal.availability?.find(d => d.dayOfWeek === dayOfWeek);
        const slots = dayAvailability?.slots || [];
        const hourlySlots: string[] = [];

        for (let hour = 9; hour <= 18; hour++) {
          const timeStr = `${hour.toString().padStart(2, '0')}:00`;
          const isWithinSlot = slots.some(slot => {
            const [startHour] = slot.startTime.split(':').map(Number);
            const [endHour] = slot.endTime.split(':').map(Number);
            return hour >= startHour && hour <= endHour;
          });
          if (isWithinSlot) {
            hourlySlots.push(timeStr);
          }
        }

        if (commonHourlySlots === null) {
          commonHourlySlots = hourlySlots;
        } else {
          commonHourlySlots = commonHourlySlots.filter(s => hourlySlots.includes(s));
        }
      }

      setAvailableTimeSlots((commonHourlySlots || []).sort());
      setAppointmentTime('');
    } else {
      setAvailableTimeSlots([]);
    }
  }, [selectedCalendarIds, appointmentDate, calendars]);
  
  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setCustomerSearchQuery(customer.name);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
    setCustomerEmail(customer.email);
    setCustomerAddress(customer.address);
    setLatitude(customer.latitude);
    setLongitude(customer.longitude);
    setCustomerSearchResults([]);
    setIsSearchFocused(false);
  };

  const handlePlaceSelected = useCallback((details: { address: string; latitude?: number; longitude?: number }) => {
    setCustomerAddress(details.address);
    setLatitude(details.latitude);
    setLongitude(details.longitude);
  }, []);

  const handleToggleCalendar = (cId: string) => {
    setSelectedCalendarIds(prev =>
      prev.includes(cId) ? prev.filter(id => id !== cId) : [...prev, cId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !customerAddress || !applianceType || !issueDescription || selectedCalendarIds.length === 0 || !appointmentDate || !appointmentTime) {
      alert("Por favor, completa todos los campos.");
      return;
    }

    const start = new Date(`${appointmentDate}T${appointmentTime}`);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour duration

    // Check all selected calendars for conflicts
    const conflictingCalendarId = selectedCalendarIds.find(cId =>
      serviceOrders.some(o => {
        const orderCalendarIds = o.calendarIds && o.calendarIds.length > 0
          ? o.calendarIds
          : o.calendarId ? [o.calendarId] : [];
        return orderCalendarIds.includes(cId) &&
          o.status !== 'Cancelado' &&
          o.start &&
          new Date(o.start).getTime() === start.getTime();
      })
    );

    if (conflictingCalendarId) {
        const conflictTech = assignableStaff.find(s => {
            const cal = calendars.find(c => c.id === s.calendarId);
            return cal?.id === conflictingCalendarId;
        });
        alert(`Este horario ya está ocupado para ${conflictTech?.name || 'el técnico seleccionado'}. Por favor, elige otro horario.`);
        return;
    }

    setIsSaving(true);
    try {
      const orderData = {
        customerName,
        customerPhone,
        customerEmail,
        customerAddress,
        latitude,
        longitude,
        applianceType,
        issueDescription,
        start,
        end,
        calendarId: selectedCalendarIds[0],
        calendarIds: selectedCalendarIds,
      };

      await addServiceOrder(orderData);
      setGlobalSuccess('Orden de servicio creada exitosamente.');
      onSave();
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-[calc(100vw-2rem)] sm:max-w-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800">
          <X size={20} />
        </button>
        <h2 className="text-2xl font-bold mb-4 text-slate-700">Crear Nueva Orden de Servicio</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset className="border p-4 rounded-md">
            <legend className="text-lg font-semibold px-2 text-slate-600">Información del Cliente</legend>
            <div className="relative mt-2">
                <input
                    type="text"
                    id="customer-search"
                    autoComplete="off"
                    value={customerSearchQuery}
                    onChange={(e) => { 
                      setCustomerSearchQuery(e.target.value); 
                      setCustomerName(e.target.value);
                      setSelectedCustomerId(''); // Clear selection if user types again
                    }}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                    placeholder="Buscar o crear cliente por nombre o teléfono..."
                    className="w-full input-style"
                />
                {isSearchFocused && customerSearchQuery.trim() && !selectedCustomerId && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {customerSearchResults.length > 0 ? (
                            customerSearchResults.map(customer => (
                                <button
                                    type="button"
                                    key={customer.id}
                                    onMouseDown={() => handleCustomerSelect(customer)}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-sky-100"
                                >
                                    <p className="font-semibold">{customer.name}</p>
                                    <p className="text-xs text-slate-500">{customer.phone}</p>
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-sm text-slate-500">
                                <p>No se encontraron clientes con "{customerSearchQuery}".</p>
                                <p className="mt-1 text-sky-600 font-medium">Completa los datos abajo para crear un cliente nuevo.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                  <label htmlFor="create-customerPhone" className="label-style">Teléfono</label>
                  <input type="tel" id="create-customerPhone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required className="mt-1 input-style" />
              </div>
              <div>
                  <label htmlFor="create-customerEmail" className="label-style">Correo Electrónico (Opcional)</label>
                  <input type="email" id="create-customerEmail" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="mt-1 input-style" />
              </div>
               <div className="md:col-span-2">
                    <label htmlFor="create-customerAddress" className="label-style">Dirección del Servicio</label>
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
                    <label htmlFor="create-applianceType" className="label-style">Tipo de Servicio / Asunto</label>
                    <input type="text" id="create-applianceType" value={applianceType} onChange={e => setApplianceType(e.target.value)} required className="mt-1 input-style" />
                </div>
                <div>
                    <label htmlFor="create-issueDescription" className="label-style">Falla o Servicio Solicitado</label>
                    <textarea id="create-issueDescription" value={issueDescription} onChange={e => setIssueDescription(e.target.value)} rows={3} required className="mt-1 input-style"></textarea>
                </div>
            </div>
          </fieldset>

           <fieldset className="border p-4 rounded-md">
            <legend className="text-lg font-semibold px-2 text-slate-600">Programación y Asignación</legend>
            <div className="space-y-4 mt-2">
                <div ref={staffDropdownRef}>
                    <label className="label-style"><b>1. Asignar a Personal</b></label>
                    {selectedCalendarIds.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1.5 mb-2">
                        {selectedCalendarIds.map(cId => {
                          const tech = assignableStaff.find(s => calendars.find(c => c.id === cId && c.id === s.calendarId));
                          const techName = tech?.name || 'Desconocido';
                          return (
                            <span key={cId} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-800">
                              {techName}
                              <button type="button" onClick={() => handleToggleCalendar(cId)} className="ml-0.5 hover:text-sky-600">
                                <X size={12} />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsStaffDropdownOpen(!isStaffDropdownOpen)}
                      className="mt-1 input-style text-left flex items-center justify-between"
                    >
                      <span className={selectedCalendarIds.length === 0 ? 'text-slate-400' : 'text-slate-700'}>
                        {selectedCalendarIds.length === 0
                          ? 'Seleccionar miembros del personal'
                          : `${selectedCalendarIds.length} seleccionado${selectedCalendarIds.length > 1 ? 's' : ''}`}
                      </span>
                      <svg className={`w-4 h-4 text-slate-400 transition-transform ${isStaffDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {isStaffDropdownOpen && (
                      <div className="mt-1 border border-slate-300 rounded-md shadow-sm max-h-48 overflow-y-auto bg-white z-10 relative">
                        {assignableStaff.map(tech => {
                          const cal = calendars.find(c => c.id === tech.calendarId);
                          if (!cal) return null;
                          const isChecked = selectedCalendarIds.includes(cal.id);
                          return (
                            <label
                              key={cal.id}
                              className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-sky-50 transition-colors ${isChecked ? 'bg-sky-50' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleCalendar(cal.id)}
                                className="h-4 w-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                              />
                              <span className="text-sm text-slate-700">{tech.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                </div>
                <div>
                    <label htmlFor="create-date" className="label-style"><b>2. Fecha de la Cita</b></label>
                    <input type="date" id="create-date" value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} required className="mt-1 input-style" disabled={selectedCalendarIds.length === 0} min={new Date().toISOString().split('T')[0]} />
                </div>
                 <div>
                    <label className="label-style"><b>3. Hora de Inicio</b></label>
                    {selectedCalendarIds.length > 0 && appointmentDate ? (
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
            <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {isSaving ? <><Loader2 size={16} className="animate-spin" /> Guardando...</> : 'Guardar Orden de Servicio'}
            </button>
          </div>
        </form>
        <style>{`.input-style { color: #0f172a; display: block; width: 100%; padding: 0.5rem 0.75rem; background-color: white; border: 1px solid #cbd5e1; border-radius: 0.375rem; box-shadow: sm; placeholder-slate-400; focus:outline-none focus:ring-sky-500 focus:border-sky-500; } .input-style:disabled { background-color: #f1f5f9; cursor: not-allowed; } .label-style { display: block; font-medium; color: #334155; }`}</style>
      </div>
    </div>
  );
};