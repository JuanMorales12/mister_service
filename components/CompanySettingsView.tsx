import React, { useState, useContext, useRef } from 'react';
import { AppContext, AppContextType, CompanyInfo } from '../src/types';
import { Building2, Save, Camera, CheckCircle, ArrowLeft } from 'lucide-react';

export const CompanySettingsView: React.FC = () => {
    const { companyInfo, updateCompanyInfo, goHome } = useContext(AppContext) as AppContextType;
    const [formState, setFormState] = useState<CompanyInfo>(companyInfo);
    const [isSaved, setIsSaved] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormState(prev => ({ ...prev, logoUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateCompanyInfo(formState);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    return (
        <div>
            <button onClick={() => goHome()} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 mb-6">
                <ArrowLeft size={16} />
                <span>Volver al Inicio</span>
            </button>
            <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-slate-700 flex items-center gap-2 mb-6">
                    <Building2 className="text-sky-600" />
                    Datos de la Empresa
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                        {/* Logo Section */}
                        <div className="md:col-span-1 flex flex-col items-center p-4 bg-slate-50 rounded-lg">
                            <p className="font-semibold text-slate-700 mb-2">Logo de la Empresa</p>
                            <div className="w-40 h-40 bg-slate-200 rounded-md flex items-center justify-center overflow-hidden border">
                                {formState.logoUrl ? (
                                    <img src={formState.logoUrl} alt="Logo de la empresa" className="w-full h-full object-contain" />
                                ) : (
                                    <div className="text-center text-slate-500">
                                        <Camera size={40}/>
                                        <p className="text-xs mt-2">Sin logo</p>
                                    </div>
                                )}
                            </div>
                            <input
                                type="file"
                                ref={logoInputRef}
                                onChange={handleLogoChange}
                                accept="image/*"
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => logoInputRef.current?.click()}
                                className="mt-3 text-sm text-sky-600 bg-white border border-sky-600 rounded-md px-4 py-1.5 hover:bg-sky-50"
                            >
                                Cambiar Logo
                            </button>
                        </div>

                        {/* Info Fields Section */}
                        <div className="md:col-span-2 space-y-4">
                            <div>
                                <label htmlFor="name" className="label-style">Nombre de la Empresa</label>
                                <input type="text" id="name" name="name" value={formState.name} onChange={handleInputChange} required className="mt-1 input-style" />
                            </div>
                            <div>
                                <label htmlFor="address" className="label-style">Dirección</label>
                                <textarea id="address" name="address" value={formState.address} onChange={handleInputChange} rows={3} required className="mt-1 input-style"></textarea>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="phone" className="label-style">Teléfono Principal</label>
                                    <input type="text" id="phone" name="phone" value={formState.phone} onChange={handleInputChange} required className="mt-1 input-style" />
                                </div>
                                <div>
                                    <label htmlFor="whatsapp" className="label-style">WhatsApp</label>
                                    <input type="text" id="whatsapp" name="whatsapp" value={formState.whatsapp} onChange={handleInputChange} required className="mt-1 input-style" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="email" className="label-style">Correo Electrónico</label>
                                <input type="email" id="email" name="email" value={formState.email} onChange={handleInputChange} required className="mt-1 input-style" />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end items-center gap-4 pt-6 mt-4 border-t">
                        {isSaved && (
                            <div className="flex items-center gap-2 text-green-600 transition-opacity duration-300">
                                <CheckCircle size={16} />
                                <span className="text-sm font-medium">Cambios guardados</span>
                            </div>
                        )}
                        <button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 flex items-center gap-2">
                            <Save size={16}/> Guardar Cambios
                        </button>
                    </div>
                </form>
                <style>{`.input-style { color: #0f172a; display: block; width: 100%; padding: 0.5rem 0.75rem; background-color: white; border: 1px solid #cbd5e1; border-radius: 0.375rem; box-shadow: sm; placeholder-slate-400; focus:outline-none focus:ring-sky-500 focus:border-sky-500; } .label-style { display: block; font-medium; text-sm; color: #334155; }`}</style>
            </div>
        </div>
    );
};