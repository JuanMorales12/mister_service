import React, { useState, useContext, useEffect } from 'react';
import { AppContext, AppContextType, Customer, WorkshopEquipment, WorkshopEquipmentStatus } from '../src/types';
import { X, Save, History } from 'lucide-react';

interface WorkshopEquipmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentToEdit: WorkshopEquipment | null;
}

const statusOptions: WorkshopEquipmentStatus[] = ['Recibido', 'En Diagnóstico', 'Esperando Repuesto', 'En Reparación', 'Listo para Retirar', 'Entregado'];

export const WorkshopEquipmentFormModal: React.FC<WorkshopEquipmentFormModalProps> = ({ isOpen, onClose, equipmentToEdit }) => {
    const { customers, staff, addWorkshopEquipment, updateWorkshopEquipment } = useContext(AppContext) as AppContextType;

    const [customerId, setCustomerId] = useState('');
    const [equipmentType, setEquipmentType] = useState('');
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [serialNumber, setSerialNumber] = useState('');
    const [reportedFault, setReportedFault] = useState('');
    const [technicianId, setTechnicianId] = useState('');
    const [status, setStatus] = useState<WorkshopEquipmentStatus>('Recibido');

    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const isEditMode = !!equipmentToEdit;
    const technicians = staff.filter(s => s.role === 'tecnico' || s.role === 'administrador');

    useEffect(() => {
        if (isOpen) {
            if (equipmentToEdit) {
                const customer = customers.find(c => c.id === equipmentToEdit.customerId);
                setCustomerId(equipmentToEdit.customerId);
                setCustomerSearchQuery(customer?.name || '');
                setEquipmentType(equipmentToEdit.equipmentType);
                setBrand(equipmentToEdit.brand);
                setModel(equipmentToEdit.model);
                setSerialNumber(equipmentToEdit.serialNumber);
                setReportedFault(equipmentToEdit.reportedFault);
                setTechnicianId(equipmentToEdit.technicianId || '');
                setStatus(equipmentToEdit.status);
            } else {
                setCustomerId('');
                setCustomerSearchQuery('');
                setEquipmentType('');
                setBrand('');
                setModel('');
                setSerialNumber('');
                setReportedFault('');
                setTechnicianId('');
                setStatus('Recibido');
            }
        }
    }, [isOpen, equipmentToEdit, customers]);

    const handleCustomerSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomerSearchQuery(e.target.value);
        setCustomerId('');
        if (e.target.value.trim()) {
            setCustomerSearchResults(customers.filter(c => c.name.toLowerCase().includes(e.target.value.toLowerCase())).slice(0, 5));
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
        if (!customerId || !equipmentType || !reportedFault) {
            alert("Por favor, selecciona un cliente e ingresa el tipo de equipo y la falla reportada.");
            return;
        }

        const equipmentData = { customerId, equipmentType, brand, model, serialNumber, reportedFault, technicianId, status, entryDate: equipmentToEdit?.entryDate || new Date() };

        if (isEditMode) {
            updateWorkshopEquipment(equipmentToEdit.id, equipmentData);
        } else {
            addWorkshopEquipment(equipmentData);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl relative">
                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800">
                    <X size={20} />
                </button>
                <h2 className="text-2xl font-bold mb-4 text-slate-700">
                    {isEditMode ? 'Editar Equipo en Taller' : 'Registrar Equipo en Taller'}
                </h2>
                <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
                    <fieldset className="border p-4 rounded-md">
                        <legend className="text-lg font-semibold px-2">Cliente y Equipo</legend>
                        <div className="relative mt-2">
                            <label className="label-style">Cliente</label>
                            <input
                                type="text"
                                value={customerSearchQuery}
                                onChange={handleCustomerSearchChange}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                placeholder="Buscar cliente..."
                                className="mt-1 input-style" required
                            />
                            {isSearchFocused && customerSearchResults.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                                    {customerSearchResults.map(c => <button key={c.id} type="button" onMouseDown={() => handleCustomerSelect(c)} className="w-full text-left p-2 hover:bg-sky-100">{c.name}</button>)}
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <div><label className="label-style">Tipo de Equipo</label><input type="text" value={equipmentType} onChange={e => setEquipmentType(e.target.value)} required className="mt-1 input-style" placeholder="Ej: Lavadora" /></div>
                            <div><label className="label-style">Marca</label><input type="text" value={brand} onChange={e => setBrand(e.target.value)} className="mt-1 input-style" placeholder="Ej: Samsung" /></div>
                            <div><label className="label-style">Modelo</label><input type="text" value={model} onChange={e => setModel(e.target.value)} className="mt-1 input-style" /></div>
                        </div>
                         <div className="mt-4">
                            <label className="label-style">Número de Serie</label>
                            <input type="text" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} className="mt-1 input-style" />
                        </div>
                    </fieldset>
                    <fieldset className="border p-4 rounded-md">
                        <legend className="text-lg font-semibold px-2">Servicio</legend>
                         <div className="mt-2">
                            <label className="label-style">Falla Reportada por el Cliente</label>
                            <textarea value={reportedFault} onChange={e => setReportedFault(e.target.value)} required rows={3} className="mt-1 input-style" />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="label-style">Técnico Asignado</label>
                                <select value={technicianId} onChange={e => setTechnicianId(e.target.value)} className="mt-1 input-style">
                                    <option value="">No asignado</option>
                                    {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="label-style">Estado del Equipo</label>
                                <select value={status} onChange={e => setStatus(e.target.value as WorkshopEquipmentStatus)} className="mt-1 input-style">
                                    {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                        </div>
                    </fieldset>
                    {isEditMode && equipmentToEdit.history.length > 0 && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                            <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2 mb-2"><History size={16}/> Historial del Equipo</h3>
                             <ul className="space-y-2 max-h-32 overflow-y-auto pr-2">
                               {equipmentToEdit.history.map((log, index) => (
                                  <li key={index} className="text-xs text-slate-500">
                                     <span className="font-semibold text-slate-700">{log.action}:</span> {log.details}
                                     <span className="ml-2 text-slate-400">({new Date(log.timestamp).toLocaleString('es-ES')})</span>
                                  </li>
                               ))}
                            </ul>
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-4 pt-6 mt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200">Cancelar</button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-sky-600 text-white hover:bg-sky-700 flex items-center gap-2">
                        <Save size={16}/> {isEditMode ? 'Guardar Cambios' : 'Guardar Equipo'}
                    </button>
                </div>
                <style>{`.input-style { color: #0f172a; display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 0.375rem; } .label-style { display: block; font-medium; color: #334155; }`}</style>
            </form>
        </div>
    );
};
