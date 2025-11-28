

import React, { useContext, useState, useMemo } from 'react';
import { AppContext, AppContextType } from '../src/types';
import { Key, User, PlusCircle, Trash2, Eye, EyeOff, ShieldAlert, ArrowLeft } from 'lucide-react';

export const AccessKeysManagement: React.FC = () => {
  const { staff, addAccessKey, deleteAccessKey, currentUser, goHome } = useContext(AppContext) as AppContextType;

  if (currentUser?.role !== 'administrador') {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h2 className="text-xl font-bold text-red-600">Acceso Denegado</h2>
            <p className="mt-2 text-slate-600">Solo los administradores pueden acceder a esta sección.</p>
        </div>
    );
  }

  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [key, setKey] = useState('');
  const [confirmKey, setConfirmKey] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const staffWithKeys = useMemo(() => staff.filter(s => s.accessKey), [staff]);
  const staffWithoutKeys = useMemo(() => staff.filter(s => !s.accessKey), [staff]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId || !key) {
      alert("Por favor, selecciona un miembro del personal e ingresa una clave.");
      return;
    }
    if (key !== confirmKey) {
      alert("Las claves no coinciden.");
      return;
    }
    addAccessKey(selectedStaffId, key);
    setSelectedStaffId('');
    setKey('');
    setConfirmKey('');
  };

  const handleDelete = (staffId: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar la clave de acceso de este usuario?")) {
      deleteAccessKey(staffId);
    }
  };
  
  const toggleKeyVisibility = (staffId: string) => {
    setVisibleKeys(prev => {
        const newSet = new Set(prev);
        if (newSet.has(staffId)) {
            newSet.delete(staffId);
        } else {
            newSet.add(staffId);
        }
        return newSet;
    });
  };

  return (
    <div>
  <button onClick={() => goHome()} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 mb-6">
            <ArrowLeft size={16} />
            <span>Volver al Inicio</span>
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-slate-700">Claves Asignadas</h2>
            <div className="space-y-4">
              {staffWithKeys.length > 0 ? staffWithKeys.map(person => (
                <div key={person.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-md">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-sky-100 text-sky-600 rounded-full h-10 w-10 flex items-center justify-center">
                      <User size={20} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-900">{person.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-slate-500 font-mono tracking-wider">{visibleKeys.has(person.id) ? person.accessKey : '••••••••'}</p>
                        <button onClick={() => toggleKeyVisibility(person.id)} className="text-slate-500 hover:text-slate-700">
                            {visibleKeys.has(person.id) ? <EyeOff size={16}/> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(person.id)}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-full"
                    title="Eliminar Clave"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )) : <p className="text-slate-500">No hay claves de acceso asignadas.</p>}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-slate-700">Crear Clave de Acceso</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <ShieldAlert className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                            Las claves son para registrar modificaciones. Guárdalas en un lugar seguro.
                        </p>
                    </div>
                </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="staff-select" className="block text-sm font-medium text-slate-700">
                  Personal
                </label>
                <select
                  id="staff-select"
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md"
                  required
                >
                  <option value="" disabled>Seleccionar un miembro</option>
                  {staffWithoutKeys.map(person => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="accessKey" className="block text-sm font-medium text-slate-700">
                  Clave de Acceso
                </label>
                <input
                  type="password"
                  id="accessKey"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="mt-1 input-style"
                  required
                />
              </div>
               <div>
                <label htmlFor="confirmAccessKey" className="block text-sm font-medium text-slate-700">
                  Confirmar Clave
                </label>
                <input
                  type="password"
                  id="confirmAccessKey"
                  value={confirmKey}
                  onChange={(e) => setConfirmKey(e.target.value)}
                  className="mt-1 input-style"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={staffWithoutKeys.length === 0}
                className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                <PlusCircle size={16} />
                <span>Crear Clave</span>
              </button>
            </form>
             <style>{`.input-style { color: #0f172a; display: block; width: 100%; padding: 0.5rem 0.75rem; background-color: white; border: 1px solid #cbd5e1; border-radius: 0.375rem; box-shadow: sm; placeholder-slate-400; focus:outline-none focus:ring-sky-500 focus:border-sky-500; }`}</style>
          </div>
        </div>
    </div>
  );
};