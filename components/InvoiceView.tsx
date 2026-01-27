
import React, { useState, useContext, useMemo } from 'react';
// FIX: Use the same AppContext instance from '../src/types' to avoid null context.
import { AppContext, AppContextType, Invoice } from '../src/types';
import { PlusCircle, Receipt, DollarSign, Search, Edit, Printer, Trash2, Copy, ArrowLeft } from 'lucide-react';
import { RecordPaymentModal } from './RecordPaymentModal';
import { formatCurrency } from '../src/utils';

export const InvoiceView: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) {
        return <div className="p-4 bg-red-50 text-red-700 rounded-md text-sm">Error: El contexto de la app no está disponible.</div>;
    }
    const { invoices, customers, setOrderToConvertToInvoice, setQuoteToConvertToInvoice, viewInvoice, setMode, goHome, setInvoiceToEdit, deleteInvoice, setInvoiceToDuplicate } = context;
    const [invoiceToPay, setInvoiceToPay] = useState<Invoice | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleOpenCreateModal = () => {
        setInvoiceToEdit(null);
        setOrderToConvertToInvoice(null);
        setQuoteToConvertToInvoice(null);
        setMode('facturacion-form');
    };
    
    const handleOpenEditModal = (invoice: Invoice) => {
        if (invoice.status === 'Pagada' || invoice.status === 'Anulada') {
            alert('No se puede editar una factura pagada o anulada.');
            return;
        }
        setInvoiceToEdit(invoice);
        setMode('facturacion-form');
    };
    
    const handleDuplicate = (invoice: Invoice) => {
        setInvoiceToDuplicate(invoice);
        setMode('facturacion-form');
    };

    const handleRecordPayment = (invoice: Invoice) => {
        setInvoiceToPay(invoice);
    }

    const getCustomerName = (customerId: string) => {
        return customers.find(c => c.id === customerId)?.name || 'Cliente desconocido';
    };
    
    const statusClasses: Record<Invoice['status'], string> = {
        Borrador: 'bg-slate-100 text-slate-800',
        Emitida: 'bg-amber-100 text-amber-800',
        'Pago Parcial': 'bg-blue-100 text-blue-800',
        Pagada: 'bg-green-100 text-green-800',
        Anulada: 'bg-red-100 text-red-800',
    };
    
    const filteredInvoices = useMemo(() => {
        const sorted = [...invoices].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (!searchQuery.trim()) {
            return sorted;
        }
        const lowercasedQuery = searchQuery.toLowerCase();
        return sorted.filter(invoice => 
            invoice.invoiceNumber.toLowerCase().includes(lowercasedQuery) ||
            getCustomerName(invoice.customerId).toLowerCase().includes(lowercasedQuery)
        );
    }, [invoices, searchQuery, customers]);


    return (
        <>
            <button onClick={() => goHome()} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 mb-6">
                <ArrowLeft size={16} />
                <span>Volver al Inicio</span>
            </button>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                    <h2 className="text-2xl font-bold text-slate-700 flex items-center gap-2">
                        <Receipt className="text-sky-600"/>
                        Facturas
                    </h2>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-grow">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Buscar factura o cliente..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-slate-900 placeholder-slate-400"
                            />
                        </div>
                        <button
                            onClick={handleOpenCreateModal}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700"
                        >
                            <PlusCircle size={16} />
                            <span>Crear</span>
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    {filteredInvoices.length > 0 ? (
                        filteredInvoices.map(invoice => (
                            <div key={invoice.id} className="p-4 bg-slate-50 rounded-md border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center">
                                <div className="mb-2 sm:mb-0">
                                    <p className="font-semibold text-slate-800">{invoice.invoiceNumber}</p>
                                    <p className="text-sm text-slate-600">{getCustomerName(invoice.customerId)}</p>
                                    <p className="text-xs text-slate-400">{new Date(invoice.date).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="font-bold text-xl text-slate-800">RD$ {formatCurrency(invoice.total)}</p>
                                        <span className={`text-xs font-medium py-0.5 px-2 rounded-full ${statusClasses[invoice.status]}`}>{invoice.status}</span>
                                    </div>
                                    <div className="flex items-center flex-wrap justify-end gap-1">
                                        {(invoice.status === 'Emitida' || invoice.status === 'Pago Parcial') && (
                                            <button 
                                                onClick={() => handleRecordPayment(invoice)}
                                                className="p-2 text-green-600 bg-green-100 hover:bg-green-200 rounded-full"
                                                title={invoice.status === 'Emitida' ? "Registrar Pago" : "Completar Pago"}
                                            >
                                                <DollarSign size={16}/>
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => viewInvoice(invoice.id)}
                                            className="p-2 text-sky-600 bg-sky-100 hover:bg-sky-200 rounded-full" 
                                            title="Imprimir / Compartir"
                                        >
                                            <Printer size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDuplicate(invoice)}
                                            className="p-2 text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-full"
                                            title="Duplicar Factura"
                                        >
                                            <Copy size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleOpenEditModal(invoice)}
                                            className="p-2 text-slate-500 hover:bg-slate-200 rounded-full disabled:text-slate-300 disabled:bg-slate-50 disabled:cursor-not-allowed" 
                                            title="Editar Factura"
                                            disabled={invoice.status === 'Pagada' || invoice.status === 'Anulada'}
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                const isPaid = invoice.status === 'Pagada';
                                                const message = isPaid
                                                    ? `Esta factura ya está PAGADA. Eliminarla afectará los registros financieros. ¿Estás seguro de que deseas eliminar la factura ${invoice.invoiceNumber}?`
                                                    : `¿Estás seguro de que deseas eliminar la factura ${invoice.invoiceNumber}?`;
                                                if (window.confirm(message)) {
                                                    deleteInvoice(invoice.id);
                                                }
                                            }}
                                            className="p-2 text-red-500 bg-red-100 hover:bg-red-200 rounded-full"
                                            title="Eliminar Factura"
                                        >
                                            <Trash2 size={16}/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-slate-500 py-8">
                           {searchQuery ? `No se encontraron facturas para "${searchQuery}".` : "No se han creado facturas todavía."}
                        </p>
                    )}
                </div>
            </div>
            {invoiceToPay && (
                <RecordPaymentModal
                    isOpen={!!invoiceToPay}
                    onClose={() => setInvoiceToPay(null)}
                    invoice={invoiceToPay}
                />
            )}
        </>
    );
};
