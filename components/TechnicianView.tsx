
import React, { useContext } from 'react';
import { AppContext, AppContextType } from '../src/types';

// Este es un componente de marcador de posición para futuras funcionalidades.
export const TechnicianView: React.FC = () => {
    const { currentUser } = useContext(AppContext) as AppContextType;

    if (currentUser?.role !== 'tecnico') {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <h2 className="text-xl font-bold text-red-600">Acceso Denegado</h2>
                <p className="mt-2 text-slate-600">Este módulo es accesible solo para técnicos.</p>
            </div>
        );
    }
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-slate-700">
                Vista del Técnico
            </h2>
            <p className="mt-4 text-slate-500">
                Este módulo está en construcción. Aquí los técnicos podrán ver su agenda personal, gestionar sus órdenes de servicio y registrar su trabajo.
            </p>
        </div>
    );
};
