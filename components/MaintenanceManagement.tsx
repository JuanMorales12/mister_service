
import React, { useContext, useState, useMemo } from 'react';
import { AppContext, AppContextType, MaintenanceSchedule } from '../src/types';
import { PlusCircle, ClipboardList, User, Calendar, RefreshCw, Pencil, Trash2, Search, ArrowLeft } from 'lucide-react';
import { MaintenanceFormModal } from './MaintenanceFormModal';

export const MaintenanceManagement: React.FC = () => {
  const { maintenanceSchedules, customers, staff, addMaintenanceSchedule, deleteMaintenanceSchedule, setMode, currentUser, goHome } = useContext(AppContext) as AppContextType;
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    schedule: MaintenanceSchedule | null;
  }>({ isOpen: false, schedule: null });
  const [searchQuery, setSearchQuery] = useState('');

  if (currentUser?.role === 'tecnico') {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h2 className="text-xl font-bold text-red-600">Acceso Denegado</h2>
            <p className="mt-2 text-slate-600">No tienes permiso para acceder al módulo de mantenimiento.</p>
        </div>
    );
  }

  const handleOpenCreateModal = () => {
    setModalConfig({ isOpen: true, schedule: null });
  };
  
  const handleOpenEditModal = (schedule: MaintenanceSchedule) => {
    setModalConfig({ isOpen: true, schedule: schedule });
  };
  
  const handleDelete = (scheduleId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este programa de mantenimiento?')) {
        deleteMaintenanceSchedule(scheduleId);
    }
  };
  
  const getCustomerName = (customerId: string) => {
    return customers.find(c => c.id === customerId)?.name || 'Cliente desconocido';
  };

  const sortedSchedules = useMemo(() => {
    return [...maintenanceSchedules].sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
  }, [maintenanceSchedules]);
  
  const filteredSchedules = useMemo(() => {
    if (!searchQuery.trim()) {
        return sortedSchedules;
    }

    const lowercasedQuery = searchQuery.toLowerCase();

    return sortedSchedules.filter(schedule => {
        const customer = customers.find(c => c.id === schedule.customerId);
        if (!customer) return false;

        const nameMatch = customer.name.toLowerCase().includes(lowercasedQuery);
        const digitsOnly = lowercasedQuery.replace(/\D/g, '');
        const phoneMatch = digitsOnly.length >= 3 && customer.phone.replace(/\D/g, '').includes(digitsOnly);
        const serviceMatch = schedule.serviceDescription.toLowerCase().includes(lowercasedQuery);

        return nameMatch || phoneMatch || serviceMatch;
    });
  }, [sortedSchedules, searchQuery, customers]);


  const formatDate = (dateString: string) => {
    // "YYYY-MM-DD" -> parse as local date to avoid timezone shift
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <>
  <button onClick={() => goHome()} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 mb-6">
          <ArrowLeft size={16} />
          <span>Volver al Inicio</span>
      </button>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-slate-700 flex items-center gap-2">
              <ClipboardList className="text-sky-600" /> Mantenimiento Programado
            </h2>
            <button
                onClick={handleOpenCreateModal}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700"
            >
                <PlusCircle size={16} />
                <span>Crear Programa</span>
            </button>
        </div>
        
        <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
                type="text"
                placeholder="Buscar por cliente, teléfono o servicio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-slate-900 placeholder-slate-400"
            />
        </div>
        
        <div className="space-y-3">
          {filteredSchedules.length > 0 ? filteredSchedules.map((schedule) => (
            <div key={schedule.id} className="flex flex-col sm:flex-row items-start sm:items-center p-4 bg-slate-50 rounded-md border">
              <div className="flex-grow">
                <p className="font-semibold text-slate-800 flex items-center gap-2"><User size={16} className="text-slate-500" /> {getCustomerName(schedule.customerId)}</p>
                <p className="text-sm text-slate-600 mt-1 pl-8">{schedule.serviceDescription}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 mt-2 pl-8">
                    <p className="flex items-center gap-2"><RefreshCw size={14} /> Cada {schedule.frequencyMonths} meses</p>
                    <p className="flex items-center gap-2 font-medium text-sky-700"><Calendar size={14} /> Próximo: {formatDate(schedule.nextDueDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 sm:mt-0 self-end sm:self-center">
                <button onClick={() => handleOpenEditModal(schedule)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-full" title="Editar">
                    <Pencil size={16} />
                </button>
                <button onClick={() => handleDelete(schedule.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-full" title="Eliminar">
                    <Trash2 size={16} />
                </button>
              </div>
            </div>
          )) : (
            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-md">
                {searchQuery ? (
                    <>
                        <p>No se encontraron resultados para "{searchQuery}".</p>
                        <p className="text-sm mt-1">Intenta con otra búsqueda.</p>
                    </>
                ) : (
                    <>
                        <p>No hay programas de mantenimiento configurados.</p>
                        <p className="text-sm mt-1">Crea uno para empezar a automatizar tus seguimientos.</p>
                    </>
                )}
            </div>
          )}
        </div>
      </div>
      
      <MaintenanceFormModal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ isOpen: false, schedule: null })}
        scheduleToEdit={modalConfig.schedule}
      />
    </>
  );
};
