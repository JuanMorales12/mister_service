
import React, { useContext, useState } from 'react';
import { AppContext, AppContextType, Calendar } from '../src/types';
import { PlusCircle, Calendar as CalendarIcon, Clock, Edit, Trash2, Power, PowerOff, Share2, ArrowLeft } from 'lucide-react';
import { AvailabilityModal } from './AvailabilityModal';
import { EditCalendarModal } from './EditCalendarModal';
import { CreateCalendarModal } from './CreateCalendarModal';
import { ShareCalendarModal } from './ShareCalendarModal';

export const CalendarManagement: React.FC = () => {
  const { calendars, staff, updateCalendar, deleteCalendar, updateCalendarAvailability, setMode } = useContext(AppContext) as AppContextType;
  
  const [availabilityModalOpenFor, setAvailabilityModalOpenFor] = useState<Calendar | null>(null);
  const [editModalOpenFor, setEditModalOpenFor] = useState<Calendar | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [calendarToShare, setCalendarToShare] = useState<Calendar | null>(null);

  const getUserName = (userId: string) => {
    return staff.find(u => u.id === userId)?.name || 'Usuario desconocido';
  };

  const handleToggleActive = (calendar: Calendar) => {
    updateCalendar(calendar.id, { active: !calendar.active });
  };
  
  const handleDelete = (calendarId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este calendario? Esta acción no se puede deshacer.')) {
        deleteCalendar(calendarId);
    }
  };

  return (
    <>
      <button onClick={() => setMode('inicio')} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 mb-6">
          <ArrowLeft size={16} />
          <span>Volver al Inicio</span>
      </button>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-slate-700">Gestión de Calendarios</h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
          >
            <PlusCircle size={16} />
            <span>Crear Calendario</span>
          </button>
        </div>
        <div className="space-y-4">
          {calendars.map((calendar: Calendar) => (
            <div key={calendar.id} className={`flex items-center justify-between p-4 rounded-md transition-colors ${calendar.active ? 'bg-slate-50' : 'bg-slate-200'}`}>
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full" style={{ backgroundColor: calendar.color, color: 'white' }}>
                  <CalendarIcon size={20} />
                </div>
                <div className="ml-4">
                  <p className={`text-sm font-medium ${calendar.active ? 'text-slate-900' : 'text-slate-500 line-through'}`}>{calendar.name}</p>
                  <p className="text-sm text-slate-500">Asignado a: {getUserName(calendar.userId)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCalendarToShare(calendar)}
                  className="p-2 text-slate-600 hover:bg-slate-200 rounded-full"
                  title="Compartir Calendario"
                >
                  <Share2 size={16} />
                </button>
                <button
                  onClick={() => handleToggleActive(calendar)}
                  className={`p-2 rounded-full ${calendar.active ? 'text-green-600 hover:bg-green-100' : 'text-red-600 hover:bg-red-100'}`}
                  title={calendar.active ? 'Desactivar' : 'Activar'}
                >
                    {calendar.active ? <Power size={16} /> : <PowerOff size={16}/>}
                </button>
                <button
                  onClick={() => setAvailabilityModalOpenFor(calendar)}
                  className="p-2 text-slate-600 hover:bg-slate-200 rounded-full"
                  title="Editar Horarios"
                >
                  <Clock size={16} />
                </button>
                <button
                  onClick={() => setEditModalOpenFor(calendar)}
                  className="p-2 text-slate-600 hover:bg-slate-200 rounded-full"
                  title="Editar Calendario"
                >
                  <Edit size={16} />
                </button>
                 <button
                  onClick={() => handleDelete(calendar.id)}
                  className="p-2 text-red-500 hover:bg-red-100 rounded-full"
                  title="Eliminar Calendario"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {availabilityModalOpenFor && (
        <AvailabilityModal
          isOpen={!!availabilityModalOpenFor}
          onClose={() => setAvailabilityModalOpenFor(null)}
          calendar={availabilityModalOpenFor}
          onSave={(availability) => {
            updateCalendarAvailability(availabilityModalOpenFor.id, availability);
            setAvailabilityModalOpenFor(null);
          }}
        />
      )}
      
      {editModalOpenFor && (
        <EditCalendarModal
          isOpen={!!editModalOpenFor}
          onClose={() => setEditModalOpenFor(null)}
          calendar={editModalOpenFor}
        />
      )}

      <CreateCalendarModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {calendarToShare && (
        <ShareCalendarModal
          isOpen={!!calendarToShare}
          onClose={() => setCalendarToShare(null)}
          calendar={calendarToShare}
        />
      )}
    </>
  );
};
