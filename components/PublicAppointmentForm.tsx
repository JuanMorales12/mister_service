import React, { useState, useEffect, useCallback } from 'react';
import { DailyAvailability, ServiceOrder, TimeSlot } from '../src/types';
import { X } from 'lucide-react';
import { AddressAutocompleteInput } from './AddressAutocompleteInput';

interface PublicAppointmentFormProps {
    availability: DailyAvailability[];
    calendarId: string;
    onSave: (orderData: Omit<ServiceOrder, 'id' | 'isGoogleSynced' | 'title' | 'status' | 'customerId' | 'createdById' | 'confirmedById' | 'attendedById' | 'isCheckupOnly' | 'archiveReason' | 'serviceOrderNumber' | 'cancellationReason' | 'createdAt' | 'history' | 'cancelledById' | 'rescheduledCount'> & { customerEmail: string }) => void;
    onClose?: () => void;
}

export const PublicAppointmentForm: React.FC<PublicAppointmentFormProps> = ({ availability, calendarId, onSave, onClose }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [applianceType, setApplianceType] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    if (selectedDate) {
        const date = new Date(selectedDate);
        const dayOfWeek = date.getUTCDay();

        const daySchedule = availability.find(d => d.dayOfWeek === dayOfWeek);
        setAvailableSlots(daySchedule?.slots || []);
        setSelectedTime('');
    } else {
        setAvailableSlots([]);
    }
  }, [selectedDate, availability]);

  const handlePlaceSelected = useCallback((details: { address: string; latitude?: number; longitude?: number }) => {
    setCustomerAddress(details.address);
    setLatitude(details.latitude);
    setLongitude(details.longitude);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !issueDescription || !customerAddress) {
        alert("Por favor, completa todos los campos obligatorios.");
        return;
    }
    const orderData: any = {
        customerName,
        customerPhone,
        customerEmail,
        customerAddress,
        applianceType,
        issueDescription,
        latitude,
        longitude,
        calendarId
    };

    if (selectedDate && selectedTime) {
        const [startTime, endTime] = selectedTime.split(' - ');
        const startDateTime = new Date(`${selectedDate}T${startTime.trim()}`);
        const endDateTime = new Date(`${selectedDate}T${endTime.trim()}`);
        orderData.start = startDateTime;
        orderData.end = endDateTime;
    }

    onSave(orderData);
  };

  return (
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <fieldset className="border p-4 rounded-md">
            <legend className="text-lg font-semibold px-2 text-slate-600">Sus Datos</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                  <label htmlFor="sim-customerName" className="label-style"><b>Nombre y Apellido</b></label>
                  <input type="text" id="sim-customerName" value={customerName} onChange={e => setCustomerName(e.target.value)} required className="mt-1 input-style" />
              </div>
              <div>
                  <label htmlFor="sim-customerPhone" className="label-style"><b>Teléfono (con código de país)</b></label>
                  <input type="tel" id="sim-customerPhone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required className="mt-1 input-style" placeholder="Ej: 18091234567" />
              </div>
              <div className="md:col-span-2">
                  <label htmlFor="sim-customerEmail" className="label-style"><b>Correo Electrónico (Opcional)</b></label>
                  <input type="email" id="sim-customerEmail" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="mt-1 input-style" />
              </div>
               <div className="md:col-span-2">
                  <label htmlFor="sim-customerAddress" className="label-style"><b>Dirección del Servicio</b></label>
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
                    <label htmlFor="sim-applianceType" className="label-style"><b>Tipo de Servicio / Asunto</b></label>
                    <input type="text" id="sim-applianceType" value={applianceType} onChange={e => setApplianceType(e.target.value)} required className="mt-1 input-style" />
                </div>
                <div>
                    <label htmlFor="sim-issueDescription" className="label-style"><b>Describa la falla o servicio</b></label>
                    <textarea id="sim-issueDescription" value={issueDescription} onChange={e => setIssueDescription(e.target.value)} rows={3} required className="mt-1 input-style"></textarea>
                </div>
            </div>
          </fieldset>
          <fieldset className="border p-4 rounded-md">
            <legend className="text-lg font-semibold px-2 text-slate-600">Fecha y Hora Deseada</legend>
            <div className="space-y-4 mt-2">
                <div>
                    <label htmlFor="sim-date" className="label-style"><b>1. Seleccione una Fecha</b></label>
                    <input type="date" id="sim-date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="mt-1 input-style" min={new Date().toISOString().split('T')[0]}/>
                </div>
                 <div>
                    <label className="label-style"><b>2. Seleccione un Horario</b></label>
                    {selectedDate && availableSlots.length > 0 ? (
                        <div className="mt-2 flex flex-col gap-2">
                            {availableSlots.map((slot, index) => {
                                const slotValue = `${slot.startTime} - ${slot.endTime}`;
                                const isSelected = selectedTime === slotValue;
                                return (
                                    <button
                                        type="button"
                                        key={index}
                                        onClick={() => setSelectedTime(slotValue)}
                                        className={`w-full text-center p-3 rounded-md border text-sm font-semibold transition-colors ${
                                            isSelected
                                                ? 'bg-sky-600 text-white border-sky-600'
                                                : 'bg-white text-slate-700 border-slate-300 hover:bg-sky-50'
                                        }`}
                                    >
                                        {slot.startTime} - {slot.endTime}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="mt-1 p-3 bg-slate-100 rounded-md text-center text-sm text-slate-500">
                            {!selectedDate
                                ? 'Seleccione una fecha para ver los horarios'
                                : 'No hay horarios disponibles para este día.'}
                        </div>
                    )}
                </div>
            </div>
          </fieldset>
          <div className="flex justify-end gap-4 pt-4">
            {onClose && (
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">
                    Cancelar
                </button>
            )}
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700">
              Enviar Solicitud
            </button>
          </div>
         <style>{`.input-style { color: #0f172a; display: block; width: 100%; padding: 0.5rem 0.75rem; background-color: white; border: 1px solid #cbd5e1; border-radius: 0.375rem; box-shadow: sm; placeholder-slate-400; focus:outline-none focus:ring-sky-500 focus:border-sky-500; } .input-style:disabled { background-color: #f1f5f9; cursor: not-allowed; } .label-style { display: block; font-medium; color: #334155; }`}</style>
      </form>
  );
};