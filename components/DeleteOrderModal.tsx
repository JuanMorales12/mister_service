import React, { useContext, useState } from 'react';
import { AppContext, AppContextType, ServiceOrder } from '../src/types';
import { X, ShieldAlert, Trash2 } from 'lucide-react';

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ServiceOrder;
}

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({ isOpen, onClose, order }) => {
  const { deleteServiceOrder } = useContext(AppContext) as AppContextType;
  const [reason, setReason] = useState('');

  const handleConfirmCancellation = () => {
    if (!reason.trim()) {
      alert('Por favor, ingresa un motivo para la cancelación.');
      return;
    }
    deleteServiceOrder(order.id, reason);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800">
          <X size={20} />
        </button>
        <div className="flex items-center gap-3">
            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-red-100 text-red-600">
                 <ShieldAlert size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-700">Cancelar Orden de Servicio</h2>
        </div>
        
        <p className="text-sm text-slate-600 mt-4">
            Estás a punto de cancelar la orden de servicio para <strong>{order.customerName}</strong> (#{order.serviceOrderNumber}).
            La cita se marcará como "Cancelada" y esta acción quedará registrada.
        </p>
        
        <div className="mt-4">
            <label htmlFor="cancellation-reason" className="block text-sm font-medium text-slate-700 mb-2">
                Motivo de la cancelación (requerido)
            </label>
            <textarea
                id="cancellation-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Ej: El cliente canceló por motivos personales, no se encontraba en el domicilio..."
                required
            />
        </div>
        
        <div className="flex justify-end gap-4 pt-6 mt-4 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">
            Cerrar
          </button>
          <button type="button" onClick={handleConfirmCancellation} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
            <Trash2 size={16} />
            Sí, Cancelar Cita
          </button>
        </div>
      </div>
    </div>
  );
};