
import React, { useContext, useState } from 'react';
import { AppContext, AppContextType, ServiceOrder } from '../src/types';
import { X } from 'lucide-react';
import { PublicAppointmentForm } from './PublicAppointmentForm';
import { firebaseService } from '../services/firebaseService';

interface PublicFormSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PublicFormSimulationModal: React.FC<PublicFormSimulationModalProps> = ({ isOpen, onClose }) => {
  const { calendars, staff } = useContext(AppContext) as AppContextType;
  const [selectedCalendarId, setSelectedCalendarId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (orderData: Omit<ServiceOrder, 'id' | 'isGoogleSynced' | 'title' | 'status' | 'customerId' | 'createdById' | 'confirmedById' | 'attendedById' | 'isCheckupOnly' | 'archiveReason' | 'serviceOrderNumber' | 'cancellationReason' | 'createdAt' | 'history' | 'cancelledById' | 'rescheduledCount'> & { customerEmail: string }) => {
      setIsLoading(true);
      try {
        await firebaseService.addUnconfirmedOrder(orderData);
        onClose();
      } catch (error) {
          alert('Hubo un error al crear la cita de simulación.');
          console.error(error);
      } finally {
          setIsLoading(false);
      }
  };

  const activeCalendars = calendars.filter(c => c.active && staff.some(s => s.id === c.userId));
  const selectedCalendar = activeCalendars.find(c => c.id === selectedCalendarId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg relative max-h-[90vh] flex flex-col">
        <header className="flex justify-between items-center p-4 border-b">
           <h2 className="text-2xl font-bold text-slate-700">Solicitar Servicio (Simulación)</h2>
           <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
             <X size={20} />
           </button>
        </header>
        <div className="flex-grow overflow-y-auto">
            <div className="p-6 border-b">
                <label htmlFor="calendar-sim-select" className="block text-sm font-medium text-slate-700 mb-2">Simular para Calendario:</label>
                <select
                    id="calendar-sim-select"
                    value={selectedCalendarId}
                    onChange={e => setSelectedCalendarId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                    <option value="">Seleccionar un calendario...</option>
                    {activeCalendars.map(cal => {
                        const staffMember = staff.find(s => s.id === cal.userId);
                        return <option key={cal.id} value={cal.id}>{cal.name} ({staffMember?.name})</option>;
                    })}
                </select>
            </div>
            {selectedCalendar ? (
                <PublicAppointmentForm 
                    availability={selectedCalendar.availability || []}
                    calendarId={selectedCalendar.id}
                    onSave={handleSave}
                    onClose={onClose}
                />
            ) : (
                <div className="p-10 text-center text-slate-500">
                    <p>Por favor, selecciona un calendario para iniciar la simulación.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
