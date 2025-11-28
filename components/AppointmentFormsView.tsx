
import React, { useState, useContext } from 'react';
import { FileText, Send, Code, Clipboard, Check } from 'lucide-react';
import { PublicFormSimulationModal } from './PublicFormSimulationModal';
import { AppContext, AppContextType } from '../src/types';

export const AppointmentFormsView: React.FC = () => {
    const [isSimModalOpen, setIsSimModalOpen] = useState(false);
    const { calendars, staff } = useContext(AppContext) as AppContextType;
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const embeddableCalendars = calendars.filter(cal => cal.active && staff.some(s => s.calendarId === cal.id));

    const handleCopy = (code: string, id: string) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2500);
    };

    return (
        <>
            <div className="space-y-8 max-w-4xl mx-auto">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold mb-4 text-slate-700 flex items-center gap-2">
                        <FileText size={22} className="text-sky-600" />
                        Formularios de Citas Públicas
                    </h2>
                    <p className="text-slate-600">
                        Aquí puedes simular el proceso de solicitud de un cliente y obtener los códigos HTML para incrustar los formularios de citas en tu sitio web.
                    </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold mb-4 text-slate-700 flex items-center gap-2">
                        <Send size={20} className="text-sky-600" />
                        Simulación de envío de cliente
                    </h3>
                    <div className="p-4 bg-slate-50 rounded-md">
                        <p className="text-slate-600 mb-4">
                            Usa esta herramienta para simular el proceso que un cliente seguiría al solicitar una cita desde uno de los calendarios incrustados en tu página web.
                        </p>
                        <button
                            onClick={() => setIsSimModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                        >
                            <Send size={16} />
                            Simular envío
                        </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold text-slate-700 flex items-center gap-2 mb-4">
                        <Code className="text-sky-600" /> Incrustar Formularios de Citas
                    </h3>
                    <p className="text-slate-600 mb-6">
                        Copia y pega el código HTML correspondiente en tu página web para cada calendario que desees mostrar. Cada formulario utilizará la disponibilidad configurada en la sección "Calendarios".
                    </p>
                    
                    <div className="space-y-6">
                        {embeddableCalendars.map(calendar => {
                            const embedUrl = `${window.location.origin}/public-form.html?calendarId=${calendar.id}`;
                            const embedCode = `<iframe src="${embedUrl}" style="width: 100%; height: 800px; border: none;" allow="geolocation" title="Formulario de Citas - ${calendar.name}"></iframe>`;
                            const staffMember = staff.find(s => s.calendarId === calendar.id);
                            const isCopied = copiedId === calendar.id;

                            return (
                                <div key={calendar.id} className="p-4 border rounded-lg">
                                    <h4 className="font-semibold text-slate-800">{calendar.name} <span className="text-sm font-normal text-slate-500">({staffMember?.name})</span></h4>
                                    <div className="mt-2 bg-slate-800 text-white p-4 rounded-lg font-mono text-sm relative">
                                        <pre className="overflow-x-auto"><code>{embedCode}</code></pre>
                                        <button
                                            onClick={() => handleCopy(embedCode, calendar.id)}
                                            className={`absolute top-3 right-3 p-2 rounded-md transition-colors ${isCopied ? 'bg-green-600' : 'bg-slate-600 hover:bg-slate-500'}`}
                                            title="Copiar código"
                                        >
                                            {isCopied ? <Check size={16} /> : <Clipboard size={16} />}
                                        </button>
                                    </div>
                                    {isCopied && <p className="text-green-600 mt-2 text-sm font-medium text-right transition-opacity duration-300">¡Copiado!</p>}
                                </div>
                            );
                        })}

                        {embeddableCalendars.length === 0 && (
                            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-md">
                                <p>No hay calendarios activos asignados a personal para incrustar.</p>
                                <p className="text-sm mt-1">Asegúrate de que los calendarios estén "Activos" y asignados en la sección de Personal.</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 border-t pt-6">
                        <h4 className="text-lg font-semibold text-slate-700">Opciones de Personalización</h4>
                        <p className="text-slate-500 mt-2">Puedes ajustar los atributos <code>width</code> (ancho) y <code>height</code> (alto) del <code>&lt;iframe&gt;</code> para que se adapte mejor al diseño de tu sitio web.</p>
                    </div>
                </div>
            </div>

            <PublicFormSimulationModal
                isOpen={isSimModalOpen}
                onClose={() => setIsSimModalOpen(false)}
            />
        </>
    );
};
