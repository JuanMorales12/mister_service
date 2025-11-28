import React, { useState, useContext } from 'react';
import { AppContext, AppContextType, WorkshopEquipment, WorkshopEquipmentStatus } from '../src/types';
import { HardHat, PlusCircle, User, Wrench, ArrowLeft } from 'lucide-react';
import { WorkshopEquipmentFormModal } from './WorkshopEquipmentFormModal';

const statusClasses: Record<WorkshopEquipmentStatus, string> = {
    'Recibido': 'bg-blue-100 text-blue-800',
    'En Diagnóstico': 'bg-yellow-100 text-yellow-800',
    'Esperando Repuesto': 'bg-orange-100 text-orange-800',
    'En Reparación': 'bg-indigo-100 text-indigo-800',
    'Listo para Retirar': 'bg-green-100 text-green-800',
    'Entregado': 'bg-slate-100 text-slate-800',
};

export const WorkshopEquipmentView: React.FC = () => {
    const { workshopEquipment, customers, staff, setMode } = useContext(AppContext) as AppContextType;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [equipmentToEdit, setEquipmentToEdit] = useState<WorkshopEquipment | null>(null);

    const getCustomerName = (customerId: string) => customers.find(c => c.id === customerId)?.name || 'N/A';
    const getTechnicianName = (techId?: string) => techId ? staff.find(s => s.id === techId)?.name : 'No asignado';

    const handleOpenCreateModal = () => {
        setEquipmentToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (equipment: WorkshopEquipment) => {
        setEquipmentToEdit(equipment);
        setIsModalOpen(true);
    };

    return (
        <>
            <button onClick={() => setMode('inicio')} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 mb-6">
                <ArrowLeft size={16} />
                <span>Volver al Inicio</span>
            </button>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-700 flex items-center gap-2">
                        <HardHat className="text-sky-600"/>
                        Equipos en Taller
                    </h2>
                    <button
                        onClick={handleOpenCreateModal}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700"
                    >
                        <PlusCircle size={16} />
                        <span>Registrar Entrada</span>
                    </button>
                </div>
                
                <div className="space-y-3">
                    {workshopEquipment.length > 0 ? (
                        workshopEquipment.map(eq => (
                            <div 
                                key={eq.id} 
                                className="p-4 bg-slate-50 rounded-md border border-slate-200 cursor-pointer hover:bg-slate-100"
                                onClick={() => handleOpenEditModal(eq)}
                            >
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                                    <div>
                                        <p className="font-bold text-slate-800 truncate">{eq.equipmentType} <span className="font-normal text-slate-500">- {eq.brand} {eq.model}</span></p>
                                        <p className="text-sm text-slate-600 flex items-center gap-2"><User size={14}/> {getCustomerName(eq.customerId)}</p>
                                        <p className="text-xs text-slate-400">SN: {eq.serialNumber || 'N/A'}</p>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 sm:mt-0">
                                        <span className={`text-xs font-medium py-1 px-2.5 rounded-full ${statusClasses[eq.status]}`}>{eq.status}</span>
                                        <div className="text-right">
                                            <p className="text-sm text-slate-500">Recibido:</p>
                                            <p className="text-xs font-semibold text-slate-700">{new Date(eq.entryDate).toLocaleDateString('es-ES')}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-2 pt-2 border-t border-slate-200">
                                    <p className="text-sm text-slate-600"><strong>Falla reportada:</strong> {eq.reportedFault}</p>
                                    <p className="text-xs text-slate-500 flex items-center gap-2 mt-1"><Wrench size={12}/> <strong>Técnico:</strong> {getTechnicianName(eq.technicianId)}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-slate-500 py-8">No hay equipos registrados en el taller.</p>
                    )}
                </div>
            </div>
            {isModalOpen && (
                <WorkshopEquipmentFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    equipmentToEdit={equipmentToEdit}
                />
            )}
        </>
    );
};