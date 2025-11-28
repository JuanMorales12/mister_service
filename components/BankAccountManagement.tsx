import React, { useContext, useState } from 'react';
import { AppContext, AppContextType, BankAccount } from '../src/types';
import { PlusCircle, Landmark, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { BankAccountFormModal } from './BankAccountFormModal';

export const BankAccountManagement: React.FC = () => {
    const { bankAccounts, deleteBankAccount, goHome } = useContext(AppContext) as AppContextType;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [accountToEdit, setAccountToEdit] = useState<BankAccount | null>(null);

    const handleOpenCreateModal = () => {
        setAccountToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (account: BankAccount) => {
        setAccountToEdit(account);
        setIsModalOpen(true);
    };

    const handleDelete = (accountId: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta cuenta bancaria?')) {
            deleteBankAccount(accountId);
        }
    };

    return (
        <>
            <button onClick={() => goHome()} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 mb-6">
                <ArrowLeft size={16} />
                <span>Volver al Inicio</span>
            </button>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-700 flex items-center gap-2">
                        <Landmark className="text-sky-600" /> Cuentas Bancarias
                    </h2>
                    <button
                        onClick={handleOpenCreateModal}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700"
                    >
                        <PlusCircle size={16} />
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
                                    <button onClick={() => handleOpenEditModal(account)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-full" title="Editar">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(account.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-full" title="Eliminar">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-slate-500 py-8">No has registrado ninguna cuenta bancaria.</p>
                    )}
                </div>
            </div>
            <BankAccountFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                accountToEdit={accountToEdit}
            />
        </>
    );
};