

import React, { useState, useContext, useEffect } from 'react';
import { AppContext, AppContextType, Customer, MaintenanceSchedule, ServiceOrder } from '../src/types';
import { X, Save, History } from 'lucide-react';

interface MaintenanceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleToEdit: MaintenanceSchedule | null;
}

export const MaintenanceFormModal: React.FC<MaintenanceFormModalProps> = ({ isOpen, onClose, scheduleToEdit }) => {
  const { customers, addMaintenanceSchedule, updateMaintenanceSchedule, serviceOrders } = useContext(AppContext) as AppContextType;
  
  const [customerId, setCustomerId] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [serviceDescription, setServiceDescription] = useState('');
  const [frequencyMonths, setFrequencyMonths] = useState<3 | 6 | 12>(3);
  const [startDate, setStartDate] = useState('');
  const [customerHistory, setCustomerHistory] = useState<ServiceOrder[]>([]);
  
  const isEditMode = !!scheduleToEdit;

  useEffect(() => {
    if (isOpen) {
        if (isEditMode) {
            const customer = customers.find(c => c.id === scheduleToEdit.customerId);
            setCustomerId(scheduleToEdit.customerId);
            setCustomerSearchQuery(customer?.name || '');
            setServiceDescription(scheduleToEdit.serviceDescription);
            setFrequencyMonths(scheduleToEdit.frequencyMonths);
            setStartDate(scheduleToEdit.startDate);
        } else {
            // Reset form
            setCustomerId('');
            setCustomerSearchQuery('');
            setServiceDescription('');
            setFrequencyMonths(3);
            setStartDate(new Date().toISOString().split('T')[0]);
        }
        setCustomerHistory([]); // Reset history on open
    }
  }, [isOpen, scheduleToEdit, customers, isEditMode]);

  useEffect(() => {
    if (customerId) {
        const history = serviceOrders
            .filter(order => order.customerId === customerId)
            .sort((a, b) => {
                const dateA = a.start || a.createdAt;
                const dateB = b.start || b.createdAt;
                return new Date(dateB).getTime() - new Date(dateA).getTime();
            });
        setCustomerHistory(history);
    } else {
        setCustomerHistory([]);
    }
  }, [customerId, serviceOrders]);

  const handleCustomerSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setCustomerSearchQuery(query);
    setCustomerId('');

    if (query.trim()) {
      const lowercasedQuery = query.toLowerCase();
      const filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(lowercasedQuery) || 
        customer.phone.replace(/\D/g, '').includes(query.replace(/\D/g, ''))
      ).slice(0, 5);
      setCustomerSearchResults(filtered);
    } else {
      setCustomerSearchResults([]);
    }
  };
  
  const handleCustomerSelect = (customer: Customer) => {
    setCustomerId(customer.id);
    setCustomerSearchQuery(customer.name);
    setCustomerSearchResults([]);
    setIsSearchFocused(false);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !serviceDescription || !startDate) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    if (isEditMode) {
        updateMaintenanceSchedule(scheduleToEdit.id, {
            customerId,
            serviceDescription,
            frequencyMonths,
            startDate,
            nextDueDate: scheduleToEdit.nextDueDate, // nextDueDate is recalculated by logic if needed
        });
    } else {
        addMaintenanceSchedule({
            customerId,
            serviceDescription,
            frequencyMonths,
            startDate,
        });
    }
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800">
          <X size={20} />
        </button>
        <h2 className="text-2xl font-bold mb-4 text-slate-700">
          {isEditMode ? 'Editar Programa de Mantenimiento' : 'Nuevo Programa de Mantenimiento'}
        </h2>
        
        <div className="space-y-4">
            <div className="relative">
                <label htmlFor="customer-search" className="label-style">Cliente</label>
                <input
                    type="text"
                    id="customer-search"
                    autoComplete="off"
                    value={customerSearchQuery}
                    onChange={handleCustomerSearchChange}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                    placeholder="Buscar cliente por nombre o teléfono..."
                    className="mt-1 input-style"
                    required
                />
                {isSearchFocused && customerSearchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {customerSearchResults.map(customer => (
                            <button
                                type="button"
                                key={customer.id}
                                onMouseDown={() => handleCustomerSelect(customer)}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-sky-100"
                            >
                                <p className="font-semibold">{customer.name}</p>
                                <p className="text-xs text-slate-500">{customer.phone}</p>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            
            {customerId && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                    <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2 mb-2"><History size={16}/> Historial de Servicios del Cliente</h3>
                    {customerHistory.length > 0 ? (
                        <ul className="space-y-2 max-h-32 overflow-y-auto pr-2">
                            {customerHistory.map(order => (
                                <li key={order.id} className="text-xs p-2 bg-white rounded border border-slate-100">
                                    <p className="font-semibold text-slate-800">{order.applianceType}</p>
                                    <p className="text-slate-500">
                                        Fecha: {new Date(order.start || order.createdAt).toLocaleDateString('es-ES')}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-xs text-slate-500 text-center py-2">Este cliente no tiene historial de servicios.</p>
                    )}
                </div>
            )}

             <div>
                <label htmlFor="serviceDescription" className="label-style">Descripción del Servicio</label>
                <textarea 
                    id="serviceDescription" 
                    value={serviceDescription} 
                    onChange={e => setServiceDescription(e.target.value)} 
                    rows={3} 
                    required 
                    className="mt-1 input-style"
                    placeholder="Ej: Limpieza de filtro de aire acondicionado y revisión de gas."
                ></textarea>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="frequencyMonths" className="label-style">Frecuencia</label>
                    <select id="frequencyMonths" value={frequencyMonths} onChange={e => setFrequencyMonths(Number(e.target.value) as 3|6|12)} className="mt-1 input-style">
                        <option value={3}>Cada 3 meses</option>
                        <option value={6}>Cada 6 meses</option>
                        <option value={12}>Cada 12 meses (Anual)</option>
                    </select>
                </div>
                 <div>
                    <label htmlFor="startDate" className="label-style">Fecha de Inicio</label>
                    <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} required className="mt-1 input-style" />
                </div>
            </div>
        </div>
        
        <div className="flex justify-end gap-4 pt-6 mt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">
                Cancelar
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 flex items-center gap-2">
                <Save size={16}/> {isEditMode ? 'Guardar Cambios' : 'Guardar Programa'}
            </button>
        </div>
        <style>{`.input-style { color: #0f172a; display: block; width: 100%; padding: 0.5rem 0.75rem; background-color: white; border: 1px solid #cbd5e1; border-radius: 0.375rem; box-shadow: sm; placeholder-slate-400; focus:outline-none focus:ring-sky-500 focus:border-sky-500; } .label-style { display: block; font-medium; color: #334155; }`}</style>
      </form>
    </div>
  );
};
