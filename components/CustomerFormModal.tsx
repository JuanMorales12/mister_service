


import React, { useState, useEffect } from 'react';
import { Customer } from '../src/types';
import { X, MapPin, Loader2 } from 'lucide-react';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Omit<Customer, 'id' | 'serviceHistory'>) => void;
  customerToEdit?: Customer | null;
  initialName?: string;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({ isOpen, onClose, onSave, customerToEdit, initialName }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = !!customerToEdit;

  useEffect(() => {
    if (isOpen && customerToEdit) {
        setName(customerToEdit.name);
        setPhone(customerToEdit.phone);
        setEmail(customerToEdit.email);
        setAddress(customerToEdit.address);
        setLatitude(customerToEdit.latitude);
        setLongitude(customerToEdit.longitude);
    } else if (isOpen) {
        // Reset form when modal opens for creation
        setName(initialName || '');
        setPhone('');
        setEmail('');
        setAddress('');
        setLatitude(undefined);
        setLongitude(undefined);
        setLocationError('');
    }
  }, [isOpen, customerToEdit, initialName]);

  const handleGetLocation = () => {
    setIsLocating(true);
    setLocationError('');
    if (!navigator.geolocation) {
        setLocationError("La geolocalización no es compatible con este navegador.");
        setIsLocating(false);
        return;
    }
    if (window.isSecureContext === false) {
        setLocationError("La geolocalización requiere una conexión segura (HTTPS).");
        setIsLocating(false);
        return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLatitude(latitude);
        setLongitude(longitude);
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
           if (!response.ok) throw new Error('Network response was not ok');
          const data = await response.json();
          if (data && data.display_name) {
            setAddress(data.display_name);
          } else {
            setLocationError('No se pudo encontrar una dirección para esta ubicación.');
          }
        } catch (error) {
          console.error("Error fetching address: ", error);
          setLocationError('Error al obtener la dirección.');
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Geolocation error: ", error);
        let message = `Error de geolocalización: ${error.message}`;
        if (error.code === error.PERMISSION_DENIED) {
            message = 'Permiso de geolocalización denegado. Por favor, habilítalo en la configuración de tu navegador.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
            message = 'Información de ubicación no disponible.';
        } else if (error.code === error.TIMEOUT) {
            message = 'Se agotó el tiempo de espera para obtener la ubicación.';
        }
        setLocationError(message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !address) {
        alert("Por favor, completa los campos de nombre, teléfono y dirección.");
        return;
    }
    setIsSaving(true);
    try {
        await onSave({ name, phone, email, address, latitude, longitude });
    } finally {
        setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800">
          <X size={20} />
        </button>
        <h2 className="text-2xl font-bold mb-4 text-slate-700">
            {isEditMode ? 'Editar Cliente' : 'Crear Nuevo Cliente'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="customerName" className="label-style"><b>Nombre y Apellido</b></label>
              <input type="text" id="customerName" value={name} onChange={e => setName(e.target.value)} required className="mt-1 input-style" />
            </div>
            <div>
              <label htmlFor="customerPhone" className="label-style"><b>Teléfono</b></label>
              <input type="tel" id="customerPhone" value={phone} onChange={e => setPhone(e.target.value)} required className="mt-1 input-style" placeholder="Ej: 18091234567" />
            </div>
          </div>
          <div>
            <label htmlFor="customerEmail" className="label-style"><b>Correo Electrónico (Opcional)</b></label>
            <input type="email" id="customerEmail" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 input-style" />
          </div>
          <div>
            <label htmlFor="customerAddress" className="label-style"><b>Dirección</b></label>
            <div className="relative">
                <input type="text" id="customerAddress" value={address} onChange={e => setAddress(e.target.value)} required className="mt-1 input-style pr-10" />
                <button type="button" onClick={handleGetLocation} disabled={isLocating} className="absolute inset-y-0 right-0 top-0.5 flex items-center pr-3 text-slate-500 hover:text-sky-600 disabled:cursor-not-allowed" aria-label="Obtener ubicación actual">
                    {isLocating ? <Loader2 className="h-5 w-5 animate-spin" /> : <MapPin className="h-5 w-5" />}
                </button>
            </div>
            {locationError && <p className="text-xs text-red-500 mt-1">{locationError}</p>}
          </div>
          
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed">
              Cancelar
            </button>
            <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSaving ? 'Guardando...' : (isEditMode ? 'Guardar Cambios' : 'Guardar Cliente')}
            </button>
          </div>
        </form>
        <style>{`.input-style { color: #0f172a; display: block; width: 100%; padding: 0.5rem 0.75rem; background-color: white; border: 1px solid #cbd5e1; border-radius: 0.375rem; box-shadow: sm; placeholder-slate-400; focus:outline-none focus:ring-sky-500 focus:border-sky-500; } .label-style { display: block; font-medium; color: #334155; }`}</style>
      </div>
    </div>
  );
};