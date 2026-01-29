import React, { useState, useContext, useRef } from 'react';
import { AppContext, AppContextType, CompanyInfo, BankAccount } from '../src/types';
import { Building2, Save, Camera, CheckCircle, ArrowLeft, Loader2, Landmark, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { BankAccountFormModal } from './BankAccountFormModal';

export const CompanySettingsView: React.FC = () => {
    const { companyInfo, updateCompanyInfo, goHome, bankAccounts, deleteBankAccount } = useContext(AppContext) as AppContextType;
    const [formState, setFormState] = useState<CompanyInfo>(companyInfo);
    const [isSaved, setIsSaved] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

    // Bank accounts state
    const [isBankModalOpen, setIsBankModalOpen] = useState(false);
    const [accountToEdit, setAccountToEdit] = useState<BankAccount | null>(null);

    const handleOpenBankModal = (account: BankAccount | null = null) => {
        setAccountToEdit(account);
        setIsBankModalOpen(true);
    };

    const handleDeleteBankAccount = (accountId: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta cuenta bancaria?')) {
            deleteBankAccount(accountId);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploadingLogo(true);
            setUploadError(null);
            try {
                // Verificar tamaño del archivo (max 500KB para evitar problemas con Firestore)
                if (file.size > 500 * 1024) {
                    setUploadError('El logo debe ser menor a 500KB. Por favor, usa una imagen más pequeña.');
                    setIsUploadingLogo(false);
                    return;
                }

                // Convertir a base64 para evitar problemas de CORS
                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64 = event.target?.result as string;
                    setFormState(prev => ({ ...prev, logoUrl: base64 }));
                    setIsUploadingLogo(false);
                };
                reader.onerror = () => {
                    setUploadError('Error al leer el archivo. Por favor, intenta de nuevo.');
                    setIsUploadingLogo(false);
                };
                reader.readAsDataURL(file);
            } catch (error: any) {
                console.error('Error processing logo:', error);
                setUploadError(error?.message || 'Error al procesar el logo. Por favor, intenta de nuevo.');
                setIsUploadingLogo(false);
            }
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
                                disabled={isUploadingLogo}
                                className="mt-3 text-sm text-sky-600 bg-white border border-sky-600 rounded-md px-4 py-1.5 hover:bg-sky-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isUploadingLogo ? <><Loader2 size={14} className="animate-spin"/> Subiendo...</> : 'Cambiar Logo'}
                            </button>
                            {uploadError && (
                                <p className="mt-2 text-xs text-red-600 text-center max-w-[180px]">{uploadError}</p>
                            )}
                        </div>

                        {/* Info Fields Section */}
                        <div className="md:col-span-2 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="name" className="label-style">Nombre de la Empresa</label>
                                    <input type="text" id="name" name="name" value={formState.name} onChange={handleInputChange} required className="mt-1 input-style" />
                                </div>
                                <div>
                                    <label htmlFor="rnc" className="label-style">RNC</label>
                                    <input type="text" id="rnc" name="rnc" value={formState.rnc || ''} onChange={handleInputChange} className="mt-1 input-style" placeholder="Ej: 123-45678-9" />
                                </div>
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

                {/* Bank Accounts Section */}
                <div className="mt-8 pt-8 border-t">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                            <Landmark className="text-sky-600" /> Cuentas Bancarias
                        </h3>
                        <button
                            onClick={() => handleOpenBankModal(null)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700"
                        >
                            <PlusCircle size={14} />
                            <span>Agregar Cuenta</span>
                        </button>
                    </div>

                    <div className="space-y-3">
                        {bankAccounts.length > 0 ? (
                            bankAccounts.map(account => (
                                <div key={account.id} className="p-4 bg-slate-50 rounded-md border flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-slate-800">{account.bankName}</p>
                                        <p className="text-sm text-slate-600">{account.accountHolder}</p>
                                        <p className="text-sm text-slate-500 font-mono">{account.accountNumber}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleOpenBankModal(account)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-full" title="Editar">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteBankAccount(account.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-full" title="Eliminar">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-slate-500 py-4 bg-slate-50 rounded-md">No has registrado ninguna cuenta bancaria.</p>
                        )}
                    </div>
                </div>

                <style>{`.input-style { color: #0f172a; display: block; width: 100%; padding: 0.5rem 0.75rem; background-color: white; border: 1px solid #cbd5e1; border-radius: 0.375rem; box-shadow: sm; placeholder-slate-400; focus:outline-none focus:ring-sky-500 focus:border-sky-500; } .label-style { display: block; font-medium; text-sm; color: #334155; }`}</style>
            </div>

            <BankAccountFormModal
                isOpen={isBankModalOpen}
                onClose={() => setIsBankModalOpen(false)}
                accountToEdit={accountToEdit}
            />
        </div>
    );
};