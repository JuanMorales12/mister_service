import React, { useState, useContext, useEffect } from 'react';
import { AppContext, AppContextType, Calendar } from '../src/types';
import { X, Save } from 'lucide-react';

interface EditCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendar: Calendar;
}

const colorOptions = [
    '#039BE5', // Blue
    '#33B679', // Green
    '#F57C00', // Orange
    '#D50000', // Red
    '#8E24AA', // Purple
    '#E67C73', // Light Red
    '#F6E541', // Yellow
    '#0B8043', // Dark Green
    '#3F51B5', // Indigo
];

export const EditCalendarModal: React.FC<EditCalendarModalProps> = ({ isOpen, onClose, calendar }) => {
  const { staff, updateCalendar } = useContext(AppContext) as AppContextType;
  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
  const [color, setColor] = useState('');

  useEffect(() => {
    if (calendar) {
      setName(calendar.name);
      setUserId(calendar.userId);
      setColor(calendar.color);
    }
  }, [calendar]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !userId || !color) {
      alert("Por favor, completa todos los campos.");
      return;
    }
    updateCalendar(calendar.id, { name, userId, color });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800">
          <X size={20} />
        </button>
        <h2 className="text-2xl font-bold mb-4 text-slate-700">Editar Calendario</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="calendarName" className="label-style">Nombre del Calendario</label>
            <input
              type="text"
              id="calendarName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 input-style"
              required
            />
          </div>
          <div>
            <label htmlFor="user" className="label-style">Asignar a Usuario</label>
            <select
              id="user"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-1 input-style"
              required
            >
              <option value="" disabled>Seleccionar un usuario</option>
              {staff.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
           <div>
            <label className="label-style">Color del Calendario</label>
            <div className="mt-2 flex flex-wrap gap-3">
                {colorOptions.map(c => (
                    <button
                        type="button"
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-full transition-transform transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 ring-sky-500' : ''}`}
                        style={{ backgroundColor: c }}
                        title={c}
                    />
                ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6 mt-4 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">
            Cancelar
          </button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 flex items-center gap-2">
            <Save size={16}/> Guardar Cambios
          </button>
        </div>
        <style>{`.input-style { color: #0f172a; display: block; width: 100%; padding: 0.5rem 0.75rem; background-color: white; border: 1px solid #cbd5e1; border-radius: 0.375rem; box-shadow: sm; placeholder-slate-400; focus:outline-none focus:ring-sky-500 focus:border-sky-500; } .label-style { display: block; font-medium; color: #334155; }`}</style>
      </form>
    </div>
  );
};
