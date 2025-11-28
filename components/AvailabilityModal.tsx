

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, DailyAvailability, TimeSlot } from '../src/types';
import { X, Plus, Trash2, Copy } from 'lucide-react';

interface AvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (availability: DailyAvailability[]) => void;
  calendar: Calendar;
}

const weekDays = [
  { id: 1, name: 'Lunes' },
  { id: 2, name: 'Martes' },
  { id: 3, name: 'Miércoles' },
  { id: 4, name: 'Jueves' },
  { id: 5, name: 'Viernes' },
  { id: 6, name: 'Sábado' },
  { id: 0, name: 'Domingo' },
];

export const AvailabilityModal: React.FC<AvailabilityModalProps> = ({ isOpen, onClose, onSave, calendar }) => {
  const [schedule, setSchedule] = useState<DailyAvailability[]>([]);
  const [replicationPopoverOpenFor, setReplicationPopoverOpenFor] = useState<number | null>(null);
  const [replicationTargetDays, setReplicationTargetDays] = useState<Set<number>>(new Set());
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
        const initialSchedule = weekDays.map(day => {
            const existingDay = calendar.availability?.find(d => d.dayOfWeek === day.id);
            return existingDay || { dayOfWeek: day.id, slots: [] };
        });
        setSchedule(initialSchedule);
    }
  }, [calendar, isOpen]);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setReplicationPopoverOpenFor(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [popoverRef]);

  const handleTimeChange = (dayIndex: number, slotIndex: number, type: 'startTime' | 'endTime', value: string) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].slots[slotIndex][type] = value;
    setSchedule(newSchedule);
  };

  const addSlot = (dayIndex: number) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].slots.push({ startTime: '09:00', endTime: '17:00' });
    setSchedule(newSchedule);
  };
  
  const removeSlot = (dayIndex: number, slotIndex: number) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].slots.splice(slotIndex, 1);
    setSchedule(newSchedule);
  };

  const handleToggleReplicationPopover = (dayOfWeek: number) => {
    setReplicationPopoverOpenFor(prev => prev === dayOfWeek ? null : dayOfWeek);
    setReplicationTargetDays(new Set());
  };
  
  const handleReplicationTargetChange = (targetDayOfWeek: number) => {
    setReplicationTargetDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(targetDayOfWeek)) {
        newSet.delete(targetDayOfWeek);
      } else {
        newSet.add(targetDayOfWeek);
      }
      return newSet;
    });
  };
  
  const handleApplyReplication = () => {
    if (replicationPopoverOpenFor === null || replicationTargetDays.size === 0) {
      setReplicationPopoverOpenFor(null);
      return;
    }

    const sourceDay = schedule.find(d => d.dayOfWeek === replicationPopoverOpenFor);
    if (!sourceDay) return;
    
    const sourceSlots = JSON.parse(JSON.stringify(sourceDay.slots));

    setSchedule(prevSchedule => {
      return prevSchedule.map(day => {
        if (replicationTargetDays.has(day.dayOfWeek)) {
          return { ...day, slots: JSON.parse(JSON.stringify(sourceSlots)) };
        }
        return day;
      });
    });

    setReplicationPopoverOpenFor(null);
  };

  const handleSave = () => {
    onSave(schedule);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800">
          <X size={20} />
        </button>
        <h2 className="text-2xl font-bold mb-1 text-slate-700">Definir Horarios</h2>
        <p className="text-sm text-slate-500 mb-6">Disponibilidad para: <span className="font-semibold">{calendar.name}</span></p>
        
        <div className="space-y-4">
          {schedule.map((day, dayIndex) => (
            <div key={day.dayOfWeek} className="p-3 bg-slate-50 rounded-md">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800">{weekDays.find(d => d.id === day.dayOfWeek)?.name}</h3>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <button 
                                onClick={() => handleToggleReplicationPopover(day.dayOfWeek)}
                                className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-slate-600 bg-slate-200 rounded-md hover:bg-slate-300"
                            >
                                <Copy size={14}/>
                                Replicar
                            </button>
                            {replicationPopoverOpenFor === day.dayOfWeek && (
                                <div ref={popoverRef} className="absolute z-20 right-0 mt-2 w-48 bg-white border border-slate-200 rounded-md shadow-lg p-2">
                                    <p className="text-xs font-semibold text-slate-700 pb-2 border-b">Replicar en:</p>
                                    <div className="mt-2 space-y-1">
                                        {weekDays.filter(wd => wd.id !== day.dayOfWeek).map(targetDay => (
                                            <label key={targetDay.id} className="flex items-center gap-2 text-sm p-1 hover:bg-slate-100 rounded-md cursor-pointer">
                                                <input 
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                    checked={replicationTargetDays.has(targetDay.id)}
                                                    onChange={() => handleReplicationTargetChange(targetDay.id)}
                                                />
                                                {targetDay.name}
                                            </label>
                                        ))}
                                    </div>
                                    <div className="mt-2 pt-2 border-t flex justify-end gap-2">
                                        <button onClick={() => setReplicationPopoverOpenFor(null)} className="px-2 py-1 text-xs text-slate-600">Cancelar</button>
                                        <button onClick={handleApplyReplication} className="px-2 py-1 text-xs text-white bg-sky-600 rounded-md hover:bg-sky-700">Aplicar</button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button onClick={() => addSlot(dayIndex)} className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-sky-600 bg-sky-100 rounded-md hover:bg-sky-200">
                            <Plus size={14}/>
                            Añadir bloque
                        </button>
                    </div>
                </div>
                <div className="mt-2 space-y-2">
                    {day.slots.length > 0 ? day.slots.map((slot, slotIndex) => (
                        <div key={slotIndex} className="grid grid-cols-12 items-center gap-2">
                            <div className="col-span-10 grid grid-cols-2 gap-2">
                                <input
                                type="time"
                                value={slot.startTime}
                                onChange={e => handleTimeChange(dayIndex, slotIndex, 'startTime', e.target.value)}
                                className="input-style"
                                />
                                <input
                                type="time"
                                value={slot.endTime}
                                onChange={e => handleTimeChange(dayIndex, slotIndex, 'endTime', e.target.value)}
                                className="input-style"
                                />
                            </div>
                            <div className="col-span-2 flex justify-end">
                                <button onClick={() => removeSlot(dayIndex, slotIndex)} className="p-2 text-red-500 hover:bg-red-100 rounded-full">
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        </div>
                    )) : <p className="text-xs text-center text-slate-400 py-2">Día no laborable</p>}
                </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-4 pt-6 mt-4 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">
            Cancelar
          </button>
          <button type="button" onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700">
            Guardar Horarios
          </button>
        </div>
        <style>{`.input-style { color: #0f172a; display: block; width: 100%; padding: 0.5rem 0.75rem; background-color: white; border: 1px solid #cbd5e1; border-radius: 0.375rem; box-shadow: sm; placeholder-slate-400; focus:outline-none focus:ring-sky-500 focus:border-sky-500; } .input-style:disabled { background-color: #f1f5f9; cursor: not-allowed; }`}</style>
      </div>
    </div>
  );
};
