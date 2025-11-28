

import React, { useContext, useState, useMemo } from 'react';
import { AppContext, AppContextType, Staff } from '../src/types';
import { PlusCircle, User as UserIcon, MoreVertical, Eye, Trash2, Pencil, ArrowLeft } from 'lucide-react';
import { EmployeeDetailsModal } from './EmployeeDetailsModal';


export const StaffManagement: React.FC = () => {
  const { staff, deleteStaff, currentUser, setMode } = useContext(AppContext) as AppContextType;
  
  if (currentUser?.role !== 'administrador') {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h2 className="text-xl font-bold text-red-600">Acceso Denegado</h2>
            <p className="mt-2 text-slate-600">Solo los administradores pueden acceder a esta sección.</p>
        </div>
    );
  }

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    mode: 'create' | 'view' | 'edit';
    staffMember: Staff | null;
  }>({ isOpen: false, mode: 'create', staffMember: null });

  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleOpenCreateModal = () => {
    setModalConfig({ isOpen: true, mode: 'create', staffMember: null });
  };

  const handleOpenViewModal = (person: Staff) => {
    setModalConfig({ isOpen: true, mode: 'view', staffMember: person });
    setActiveMenu(null);
  };
  
  const handleOpenEditModal = (person: Staff) => {
    setModalConfig({ isOpen: true, mode: 'edit', staffMember: person });
    setActiveMenu(null);
  };
  
  const handleDeleteStaff = (staffId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este empleado? Esta acción no se puede deshacer y desasignará sus órdenes de servicio pendientes.')) {
        deleteStaff(staffId);
    }
    setActiveMenu(null);
  }

  return (
    <>
      <button onClick={() => setMode('inicio')} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 mb-6">
          <ArrowLeft size={16} />
          <span>Volver al Inicio</span>
      </button>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-slate-700">Gestión de Empleados</h2>
            {currentUser?.role === 'administrador' && (
                <button
                    onClick={handleOpenCreateModal}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                >
                    <PlusCircle size={16} />
                    <span>Agregar Empleado</span>
                </button>
            )}
        </div>
        
        <div className="space-y-3">
          {staff.sort((a,b) => a.name.localeCompare(b.name)).map((person) => (
            <div key={person.id} className="flex items-center p-3 bg-slate-50 rounded-md">
              <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center">
                {person.employeePhotoUrl ? (
                    <img src={person.employeePhotoUrl} alt={person.name} className="h-full w-full object-cover" />
                ) : (
                    <UserIcon size={20} className="text-slate-500"/>
                )}
              </div>
              <div className="ml-4 flex-grow">
                <p className="font-semibold text-slate-800 truncate">{person.name}</p>
                <p className="text-sm text-slate-500 capitalize">{person.role}</p>
              </div>
              <div className="relative">
                <button onClick={() => setActiveMenu(activeMenu === person.id ? null : person.id)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-full">
                    <MoreVertical size={18} />
                </button>
                {activeMenu === person.id && (
                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10 border">
                        <button onClick={() => handleOpenViewModal(person)} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                            <Eye size={14} /> Ver Detalles
                        </button>
                         <button onClick={() => handleOpenEditModal(person)} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                            <Pencil size={14} /> Editar
                        </button>
                        <button onClick={() => handleDeleteStaff(person.id)} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                            <Trash2 size={14} /> Eliminar
                        </button>
                    </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <EmployeeDetailsModal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ isOpen: false, mode: 'create', staffMember: null })}
        mode={modalConfig.mode}
        staffMember={modalConfig.staffMember}
      />
    </>
  );
};
