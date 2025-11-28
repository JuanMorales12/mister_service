

import React, { useState, useEffect, useCallback } from 'react';
import { Customer } from '../src/types';
import { X } from 'lucide-react';
import { AddressAutocompleteInput } from './AddressAutocompleteInput';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Omit<Customer, 'id' | 'serviceHistory'>) => void;
  customerToEdit?: Customer | null;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({ isOpen, onClose, onSave, customerToEdit }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();

  const isEditMode = !!customerToEdit;

  useEffect(() => {
    if (isOpen && customerToEdit) {
        setName(customerToEdit.name);
        setPhone(customerToEdit.phone);
        setEmail(customerToEdit.email);
        setAddress(customerToEdit.address);
        setLatitude(customerToEdit.latitude);
        setLongitude(customerToEdit.longitude);
    } else {
        // Reset form when modal opens for creation or is closed
        setName('');
        setPhone('');
        setEmail('');
        setAddress('');
        setLatitude(undefined);
        setLongitude(undefined);
    }
  }, [isOpen, customerToEdit]);

  const handlePlaceSelected = useCallback((details: { address: string; latitude?: number; longitude?: number }) => {
    setAddress(details.address);
    setLatitude(details.latitude);
    setLongitude(details.longitude);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !address) {
        alert("Por favor, completa los campos de nombre, teléfono y dirección.");
        return;
    }
    onSave({ name, phone, email, address, latitude, longitude });
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
             <AddressAutocompleteInput 
                value={address}
                onChange={setAddress}
                onPlaceSelected={handlePlaceSelected}
                required
            />
          </div>
          
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700">
              {isEditMode ? 'Guardar Cambios' : 'Guardar Cliente'}
            </button>
          </div>
        </form>
        <style>{`.input-style { color: #0f172a; display: block; width: 100%; padding: 0.5rem 0.75rem; background-color: white; border: 1px solid #cbd5e1; border-radius: 0.375rem; box-shadow: sm; placeholder-slate-400; focus:outline-none focus:ring-sky-500 focus:border-sky-500; } .label-style { display: block; font-medium; color: #334155; }`}</style>
      </div>
    </div>
  );
};