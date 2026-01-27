import React, { useState, useContext, useEffect } from 'react';
import { AppContext, AppContextType, Invoice, PaymentMethod, PaymentDetails } from '../src/types';
import { X, Save, DollarSign } from 'lucide-react';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  initialAmount?: number;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ isOpen, onClose, invoice, initialAmount }) => {
    const { recordInvoicePayment, bankAccounts } = useContext(AppContext) as AppContextType;
    const [method, setMethod] = useState<PaymentMethod>('Efectivo');
    const [bankAccountId, setBankAccountId] = useState<string>('');
    const [cashReceived, setCashReceived] = useState<number>(0);

    const amountToPay = initialAmount ?? (invoice.total - invoice.paidAmount);
    const changeGiven = (method === 'Efectivo' && cashReceived > amountToPay) ? cashReceived - amountToPay : 0;

    useEffect(() => {
        if (isOpen) {
            const paymentAmount = initialAmount ?? (invoice.total - invoice.paidAmount);
            setMethod('Efectivo');
            setBankAccountId(bankAccounts.length > 0 ? bankAccounts[0].id : '');
            setCashReceived(paymentAmount);
        }
    }, [isOpen, invoice, initialAmount, bankAccounts]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // FIX: Add 'id' to the paymentDetails object
        const paymentDetails: PaymentDetails = {
            id: `pay_${Date.now()}`,
            method,
            amount: amountToPay,
            bankAccountId: (method !== 'Efectivo' && bankAccountId) ? bankAccountId : undefined,
            cashReceived: method === 'Efectivo' ? cashReceived : undefined,
            changeGiven: method === 'Efectivo' ? changeGiven : undefined,
            paymentDate: new Date(),
        };

        recordInvoicePayment(invoice.id, paymentDetails);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <header className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><DollarSign size={20}/> Registrar Cobro</h2>
                    <button type="button" onClick={onClose}><X size={20} /></button>
                </header>
                <main className="p-6 space-y-4">
                    <div className="text-center">
                        <p className="text-sm text-slate-500">Total a Pagar</p>
                        <p className="text-4xl font-bold text-slate-800">RD$ {amountToPay.toFixed(2)}</p>
                    </div>
                    <div>
                        <label className="label-style">Método de Pago</label>
                        <select value={method} onChange={e => setMethod(e.target.value as PaymentMethod)} className="mt-1 input-style">
                            <option value="Efectivo">Efectivo</option>
                            <option value="Transferencia">Transferencia</option>
                            <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                            <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                        </select>
                    </div>

                    {method === 'Efectivo' ? (
                        <>
                            <div>
                                <label className="label-style">Efectivo Recibido</label>
                                <input type="number" value={cashReceived || ''} onChange={e => setCashReceived(e.target.value === '' ? 0 : parseFloat(e.target.value))} className="mt-1 input-style" />
                            </div>
                            <div className="p-3 bg-sky-50 rounded-md text-center">
                                <p className="text-sm text-sky-800">Devuelta</p>
                                <p className="text-2xl font-bold text-sky-800">RD$ {changeGiven.toFixed(2)}</p>
                            </div>
                        </>
                    ) : (
                        <div>
                            <label className="label-style">Cuenta Bancaria de Destino</label>
                            <select value={bankAccountId} onChange={e => setBankAccountId(e.target.value)} required className="mt-1 input-style">
                                <option value="">Seleccionar cuenta</option>
                                {bankAccounts.map(ba => <option key={ba.id} value={ba.id}>{ba.bankName} - {ba.accountNumber}</option>)}
                            </select>
                        </div>
                    )}
                </main>
                <footer className="flex justify-end gap-4 p-4 bg-slate-50 border-t">
                    <button type="button" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center gap-2">
                        <Save size={16}/> Registrar Pago
                    </button>
                </footer>
                <style>{`.input-style { color: #0f172a; display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 0.375rem; } .label-style { display: block; font-medium; color: #334155; }`}</style>
            </form>
        </div>
    );
};