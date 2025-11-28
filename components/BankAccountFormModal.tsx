import React, { useState, useContext, useEffect } from 'react';
import { AppContext, AppContextType, BankAccount } from '../src/types';
import { X, Save } from 'lucide-react';

interface BankAccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountToEdit: BankAccount | null;
}

export const BankAccountFormModal: React.FC<BankAccountFormModalProps> = ({ isOpen, onClose, accountToEdit }) => {
    const { addBankAccount, updateBankAccount } = useContext(AppContext) as AppContextType;
    const [bankName, setBankName] = useState('');
    const [accountHolder, setAccountHolder] = useState('');
    const [accountNumber, setAccountNumber] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (accountToEdit) {
                setBankName(accountToEdit.bankName);
                setAccountHolder(accountToEdit.accountHolder);
                setAccountNumber(accountToEdit.accountNumber);
            } else {
                setBankName('');
                setAccountHolder('');
                setAccountNumber('');
            }
        }
    }, [isOpen, accountToEdit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const accountData = { bankName, accountHolder, accountNumber };
        if (accountToEdit) {
            updateBankAccount(accountToEdit.id, accountData);
        } else {
            addBankAccount(accountData);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <header className="flex justify-between items-center pb-4 border-b">
                    <h2 className="text-xl font-bold">{accountToEdit ? 'Editar Cuenta Bancaria' : 'Agregar Cuenta Bancaria'}</h2>
                    <button type="button" onClick={onClose}><X size={20}/></button>
                </header>
                <main className="py-6 space-y-4">
                    <div>
                        <label className="label-style">Nombre del Banco</label>
                        <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} required className="mt-1 input-style" />
                    </div>
                    <div>
                        <label className="label-style">Titular de la Cuenta</label>
                        <input type="text" value={accountHolder} onChange={e => setAccountHolder(e.target.value)} required className="mt-1 input-style" />
                    </div>
                    <div>
                        <label className="label-style">Número de Cuenta</label>
                        <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} required className="mt-1 input-style" />
                    </div>
                </main>
                <footer className="flex justify-end gap-4 pt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200">Cancelar</button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-sky-600 text-white hover:bg-sky-700 flex items-center gap-2">
                        <Save size={16}/> Guardar
                    </button>
                </footer>
                <style>{`.input-style { color: #0f172a; display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 0.375rem; } .label-style { display: block; font-medium; color: #334155; }`}</style>
            </form>
        </div>
    );
};
