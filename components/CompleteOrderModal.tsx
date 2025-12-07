import React, { useState, useContext, useEffect, useRef } from 'react';
import { AppContext, AppContextType, ServiceOrder } from '../src/types';
import { X, Save, Camera, AlertCircle, Loader2, Video, RefreshCw, CheckCircle, MapPin } from 'lucide-react';

interface CompleteOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ServiceOrder;
}

export const CompleteOrderModal: React.FC<CompleteOrderModalProps> = ({ isOpen, onClose, order }) => {
    const { updateServiceOrder } = useContext(AppContext) as AppContextType;
    const [serviceNotes, setServiceNotes] = useState('');
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Camera state
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isCameraLoading, setIsCameraLoading] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // Geolocation state
    const [location, setLocation] = useState<{ lat: number, lon: number } | null>(null);
    const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [locationErrorMsg, setLocationErrorMsg] = useState<string | null>(null);


    // Effect to stop camera stream when modal is closed or on component unmount
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    // Effect to reset form state and get location when modal opens
    useEffect(() => {
        if (isOpen && order) {
            setServiceNotes(order.serviceNotes || '');
            setPhotoPreview(null);
            setError(null);
            setIsLoading(false);
            setIsCameraActive(false);
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }

            // Get Geolocation
            setLocationStatus('loading');
            setLocationErrorMsg(null);
            setLocation(null);

            if (window.isSecureContext === false) {
                setLocationErrorMsg("La geolocalización requiere una conexión segura (HTTPS).");
                setLocationStatus('error');
                return;
            }
            if (!navigator.geolocation) {
                setLocationErrorMsg("La geolocalización no es compatible con este navegador.");
                setLocationStatus('error');
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
                    setLocationStatus('success');
                },
                (error) => {
                    let message = `Error: ${error.message}. Asegúrate de habilitar los permisos de ubicación.`;
                    if (error.code === error.PERMISSION_DENIED) {
                        message = 'Permiso de geolocalización denegado. Es necesario para completar la orden.';
                    } else if (error.code === error.POSITION_UNAVAILABLE) {
                        message = 'Información de ubicación no disponible. Inténtalo de nuevo.';
                    } else if (error.code === error.TIMEOUT) {
                        message = 'Se agotó el tiempo de espera para obtener la ubicación.';
                    }
                    setLocationErrorMsg(message);
                    setLocationStatus('error');
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        }
    }, [isOpen, order]);

    const startCamera = async () => {
        setError(null);
        setPhotoPreview(null);
        setIsCameraLoading(true);

        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        try {
            // Request camera with mobile-friendly constraints
            const constraints = {
                video: {
                    facingMode: 'environment', // Prefer back camera
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;

                // Wait for video to be ready
                await new Promise<void>((resolve, reject) => {
                    if (!videoRef.current) {
                        reject(new Error('Video element not found'));
                        return;
                    }

                    videoRef.current.onloadedmetadata = () => {
                        if (videoRef.current) {
                            videoRef.current.play()
                                .then(() => {
                                    setIsCameraActive(true);
                                    setIsCameraLoading(false);
                                    resolve();
                                })
                                .catch((e) => {
                                    console.error("Error playing video:", e);
                                    reject(e);
                                });
                        }
                    };

                    // Timeout after 10 seconds
                    setTimeout(() => {
                        reject(new Error('Camera timeout'));
                    }, 10000);
                });
            }
        } catch (err: any) {
            console.error("Camera error:", err);
            setIsCameraLoading(false);
            setIsCameraActive(false);

            let errorMessage = "No se pudo acceder a la cámara.";

            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                errorMessage = "Permiso de cámara denegado. Por favor, habilita los permisos de cámara en la configuración de tu navegador.";
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                errorMessage = "No se encontró ninguna cámara en tu dispositivo.";
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                errorMessage = "La cámara está siendo usada por otra aplicación. Por favor, cierra otras apps que usen la cámara.";
            } else if (err.name === 'OverconstrainedError') {
                errorMessage = "Tu cámara no soporta las configuraciones requeridas.";
            } else if (err.name === 'SecurityError') {
                errorMessage = "Acceso a la cámara bloqueado por seguridad. Asegúrate de estar usando HTTPS.";
            } else if (err.message === 'Camera timeout') {
                errorMessage = "La cámara tardó demasiado en responder. Inténtalo de nuevo.";
            }

            setError(errorMessage);
        }
    };

    const takePhoto = () => {
        if (!videoRef.current || !canvasRef.current) {
            setError("Error: La cámara no está lista. Inténtalo de nuevo.");
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Check if video is ready and has valid dimensions
        if (video.videoWidth === 0 || video.videoHeight === 0) {
            setError("La cámara aún no está lista. Espera un momento e inténtalo de nuevo.");
            return;
        }

        const MAX_WIDTH = 800;
        const scale = MAX_WIDTH / video.videoWidth;
        canvas.width = MAX_WIDTH;
        canvas.height = video.videoHeight * scale;

        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            setPhotoPreview(dataUrl);
        }

        // Stop camera after taking photo
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        setIsCameraActive(false);
        setStream(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!photoPreview) {
            setError("Es obligatorio tomar una foto de prueba.");
            return;
        }
        if (locationStatus !== 'success' || !location) {
            setError("La ubicación no se ha capturado correctamente. No se puede completar la orden.");
            return;
        }

        setIsLoading(true);

        try {
            await updateServiceOrder(order.id, {
                status: 'Completado',
                serviceNotes,
                completionPhotoUrl: photoPreview,
                completionLatitude: location.lat,
                completionLongitude: location.lon,
            });
            onClose();

        } catch (err) {
            setError("Ocurrió un error al guardar. Inténtelo de nuevo.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[1001] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg relative">
                <form onSubmit={handleSubmit}>
                    <header className="flex justify-between items-center p-4 border-b">
                        <h2 className="text-xl font-bold text-slate-800">Completar Orden de Servicio</h2>
                        <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800"><X size={20} /></button>
                    </header>
                    <main className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        {error && (
                            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-md flex items-center gap-3" role="alert">
                                <AlertCircle className="h-5 w-5"/>
                                <p className="text-sm">{error}</p>
                            </div>
                        )}
                        <div>
                            <label htmlFor="comp-serviceNotes" className="label-style">Trabajo Realizado y Notas (Final)</label>
                            <textarea id="comp-serviceNotes" value={serviceNotes} onChange={e => setServiceNotes(e.target.value)} rows={3} className="mt-1 input-style" placeholder="Ej: Se realizó mantenimiento de hornillas, se indicó un costo de 2500 pesos..."></textarea>
                        </div>
                        <div>
                            <label className="label-style">Ubicación del Servicio (Obligatorio)</label>
                            <div className="mt-2 p-3 bg-slate-100 rounded-md text-sm">
                                {locationStatus === 'loading' && <div className="flex items-center gap-2 text-slate-500"><Loader2 size={16} className="animate-spin" /> Obteniendo ubicación...</div>}
                                {locationStatus === 'success' && <div className="flex items-center gap-2 text-green-600 font-medium"><CheckCircle size={16} /> Ubicación capturada correctamente.</div>}
                                {locationStatus === 'error' && <div className="flex items-center gap-2 text-red-600 font-medium"><AlertCircle size={16} /> {locationErrorMsg}</div>}
                            </div>
                        </div>
                        <div>
                            <label className="label-style">Foto de Prueba (Obligatorio)</label>
                            <div className="mt-2 flex flex-col items-center p-4 border-2 border-dashed border-slate-300 rounded-lg min-h-[200px] justify-center">
                                {photoPreview ? (
                                    <>
                                        <img src={photoPreview} alt="Vista previa" className="max-h-48 rounded-md mb-4"/>
                                        <label htmlFor="camera-input" className="cursor-pointer text-sm font-medium text-sky-600 bg-sky-100 rounded-md px-4 py-2 hover:bg-sky-200 flex items-center gap-2">
                                            <RefreshCw size={14} /> Volver a tomar
                                        </label>
                                    </>
                                ) : (
                                    <div className="text-center text-slate-500">
                                        <Camera size={40} className="mx-auto"/>
                                        <p className="text-sm mt-2">Se requiere una foto en vivo del servicio completado.</p>
                                        <label htmlFor="camera-input" className="mt-4 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 cursor-pointer">
                                            <Camera size={16} /> Tomar Foto
                                        </label>
                                    </div>
                                )}
                                <input
                                    id="camera-input"
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onload = (event) => {
                                                const img = new Image();
                                                img.onload = () => {
                                                    const canvas = document.createElement('canvas');
                                                    const MAX_WIDTH = 800;
                                                    const scale = MAX_WIDTH / img.width;
                                                    canvas.width = MAX_WIDTH;
                                                    canvas.height = img.height * scale;
                                                    const ctx = canvas.getContext('2d');
                                                    if (ctx) {
                                                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                                                        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                                                        setPhotoPreview(dataUrl);
                                                    }
                                                };
                                                img.src = event.target?.result as string;
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                    className="hidden"
                                />
                            </div>
                        </div>
                    </main>
                    <footer className="flex justify-end gap-4 p-4 bg-slate-50 border-t">
                        <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isLoading || !photoPreview || locationStatus !== 'success'} className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed">
                            {isLoading ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
                            Marcar como Completado
                        </button>
                    </footer>
                </form>
                 <style>{`.input-style { display: block; width: 100%; padding: 0.5rem 0.75rem; background-color: white; border: 1px solid #cbd5e1; border-radius: 0.375rem; box-shadow: sm; placeholder-slate-400; font-size: 0.875rem; focus:outline-none focus:ring-sky-500 focus:border-sky-500; } .input-style:read-only, .input-style:disabled { background-color: #f1f5f9; cursor: not-allowed; color: #64748b; } .label-style { display: block; text-sm; font-medium; color: #334155; }`}</style>
            </div>
        </div>
    );
};
