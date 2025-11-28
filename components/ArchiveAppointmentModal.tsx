import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext, AppContextType, ServiceOrder } from '../src/types';
import { X, ShieldAlert } from 'lucide-react';

interface ArchiveAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ServiceOrder;
}

export const ArchiveAppointmentModal: React.FC<ArchiveAppointmentModalProps> = ({ isOpen, onClose, order }) => {
  const { staff, archiveServiceOrder } = useContext(AppContext) as AppContextType;
  const [attendedById, setAttendedById] = useState('');
  const [reason, setReason] = useState('');

  const attendingStaff = useMemo(() => staff.filter(s => ['secretaria', 'administrador', 'coordinador'].includes(s.role)), [staff]);

  useEffect(() => {
    if (isOpen) {
        setAttendedById('');
        setReason('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendedById) {
      alert('Por favor, selecciona el personal que atendió al cliente.');
      return;
    }
    if (!reason.trim()) {
      alert('Por favor, ingresa el motivo por el cual no se agendó la cita.');
      return;
    }
    archiveServiceOrder(order.id, attendedById, reason);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800">
          <X size={20} />
        </button>
        <div className="flex items-center gap-3">
            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-amber-100 text-amber-600">
                 <ShieldAlert size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-700">Registrar Cita No Agendada</h2>
        </div>
        
        <p className="text-sm text-slate-600 mt-4">
            Estás a punto de marcar la cita de <strong>{order.customerName}</strong> como "No Agendada". 
            Esto significa que el cliente fue atendido pero decidió no proceder con el servicio en este momento. 
            Esta acción se registrará para las métricas de rendimiento.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="staff-select" className="block text-sm font-medium text-slate-700 mb-2">
              ¿Qué miembro del personal atendió a este cliente?
            </label>
            <select
              id="staff-select"
              value={attendedById}
              onChange={(e) => setAttendedById(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            >
              <option value="" disabled>Seleccionar personal</option>
              {attendingStaff.map(person => (
                <option key={person.id} value={person.id}>{person.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="archive-reason" className="block text-sm font-medium text-slate-700 mb-2">
                Motivo por el cual no se agendó la cita
            </label>
            <textarea
                id="archive-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Ej: El cliente solicitó un presupuesto y decidió no proceder por el costo."
                required
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-4 pt-6 mt-4 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">
            Cancelar
          </button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
            Confirmar y Registrar
          </button>
        </div>
      </form>
    </div>
  );
};