
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { PublicAppointmentForm } from './components/PublicAppointmentForm';
import { DailyAvailability, ServiceOrder, Calendar, CompanyInfo } from './src/types';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { firebaseService } from './services/firebaseService';

const PublicFormPage: React.FC = () => {
    const [pageState, setPageState] = useState<'loading' | 'form' | 'success' | 'error'>('loading');
    const [calendarData, setCalendarData] = useState<{ id: string, name: string, availability: DailyAvailability[], companyInfo: CompanyInfo } | null>(null);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            setErrorMessage("No se pudo cargar el mapa. Falta la clave de API.");
            setPageState('error');
            console.error("API_KEY for Google services is not available.");
            return;
        }
        const scriptId = 'google-maps-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
            script.async = true;
            document.head.appendChild(script);
        }

        const fetchInitialData = async () => {
            try {
                const params = new URLSearchParams(window.location.search);
                const calendarId = params.get('calendarId');
                if (!calendarId) {
                    throw new Error("No se especificó un calendario. El enlace puede ser incorrecto.");
                }

                const state = await firebaseService.getInitialState();
                if (state) {
                    const calendar = state.calendars?.find((c: Calendar) => c.id === calendarId && c.active);
                    if (calendar) {
                        setCalendarData({
                            id: calendar.id,
                            name: calendar.name,
                            availability: calendar.availability || [],
                            companyInfo: state.companyInfo
                        });
                        setPageState('form');
                    } else {
                         throw new Error("El calendario especificado no fue encontrado o no está activo.");
                    }
                } else {
                    throw new Error("No se encontró la configuración del sistema. El formulario no se puede mostrar.");
                }
            } catch (e) {
                console.error(e);
                setErrorMessage((e as Error).message);
                setPageState('error');
            }
        };

        fetchInitialData();
    }, []);
    
    const handleSave = async (orderData: Omit<ServiceOrder, 'id' | 'isGoogleSynced' | 'title' | 'status' | 'customerId' | 'createdById' | 'confirmedById' | 'attendedById' | 'isCheckupOnly' | 'archiveReason' | 'serviceOrderNumber' | 'cancellationReason' | 'createdAt' | 'history' | 'cancelledById' | 'rescheduledCount'> & { customerEmail: string }) => {
        setPageState('loading');
        try {
            await firebaseService.addUnconfirmedOrder(orderData);
            setPageState('success');
        } catch (e) {
            console.error(e);
            setErrorMessage("No se pudo guardar la solicitud. Por favor, intente de nuevo o contacte a soporte.");
            setPageState('error');
        }
    };
    
    const renderContent = () => {
        switch (pageState) {
            case 'loading':
                return (
                    <div className="flex flex-col items-center justify-center p-8 text-slate-500">
                        <Loader2 className="animate-spin h-8 w-8 mb-4" />
                        <p>{calendarData ? 'Enviando su solicitud...' : 'Cargando formulario...'}</p>
                    </div>
                );
            case 'error':
                return (
                    <div className="flex flex-col items-center justify-center p-8 text-red-700 bg-red-50 rounded-lg m-6">
                        <AlertTriangle className="h-8 w-8 mb-4" />
                        <p className="font-semibold">Error al enviar la solicitud</p>
                        <p className="text-sm mt-1">{errorMessage}</p>
                    </div>
                );
            case 'success':
                return (
                     <div className="flex flex-col items-center justify-center p-12 text-center text-green-800 bg-green-50 m-6 rounded-lg">
                        <CheckCircle className="h-12 w-12 mb-4" />
                        <h2 className="text-2xl font-bold">¡Solicitud Enviada!</h2>
                        <p className="mt-2">Gracias por contactarnos. Uno de nuestros coordinadores se comunicará con usted a la brevedad para confirmar los detalles de su cita.</p>
                    </div>
                );
            case 'form':
                return calendarData ? (
                    <PublicAppointmentForm 
                        availability={calendarData.availability}
                        calendarId={calendarData.id}
                        onSave={handleSave}
                    />
                ) : null;
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-2xl mx-auto bg-white rounded-xl shadow-lg">
                 <header className="p-4 border-b text-center">
                    <h1 className="text-2xl font-bold text-slate-800">{calendarData?.companyInfo?.name || "Solicitar Cita de Servicio"}</h1>
                    {pageState === 'form' && <p className="text-sm text-slate-500">Agendando para: {calendarData?.name}</p>}
                </header>
                {renderContent()}
            </div>
        </div>
    );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <PublicFormPage />
  </React.StrictMode>
);