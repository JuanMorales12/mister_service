
import React, { useState, useContext, useMemo } from 'react';
import { AppContext, AppContextType, Quote, InvoiceStatus } from '../src/types';
import { PlusCircle, FileSpreadsheet, Search, Edit, Trash2, FileText, Wrench, User, ArrowLeft } from 'lucide-react';
import { QuoteFormModal } from './QuoteFormModal';

export const QuoteView: React.FC = () => {
    const { quotes, customers, staff, setQuoteToConvertToInvoice, goHome, setMode, deleteQuote, updateQuote, addInvoice } = useContext(AppContext) as AppContextType;
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [quoteToEdit, setQuoteToEdit] = useState<Quote | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleOpenCreateModal = () => {
        setQuoteToEdit(null);
        setIsFormModalOpen(true);
    };
    
    const handleOpenEditModal = (quote: Quote) => {
        setQuoteToEdit(quote);
        setIsFormModalOpen(true);
    };
    
    const handleDeleteQuote = (quoteId: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta cotización?')) {
            deleteQuote(quoteId);
        }
    };

    const handleConvertToInvoice = (quote: Quote) => {
        if (quote.status !== 'Aceptada') {
            const confirmConvert = window.confirm('Esta cotización no está marcada como "Aceptada". ¿Deseas convertirla a factura de todos modos?');
            if (!confirmConvert) return;
        }
        setQuoteToConvertToInvoice(quote);
        setMode('facturacion-form');
    };
    
    const handleChangeStatus = async (quote: Quote, status: Quote['status']) => {
        const { id, quoteNumber, subtotal, taxes, total, ...rest } = quote;
        await updateQuote(id, { ...rest, status });

        if (status === 'Aceptada') {
            const invoiceData = {
                customerId: quote.customerId,
                date: new Date(),
                items: quote.items.map(item => ({ ...item, id: `item-${Date.now()}-${Math.random()}` })),
                discount: quote.discount,
                isTaxable: quote.isTaxable,
                status: 'Emitida' as InvoiceStatus,
                serviceOrderDescription: `Basado en Cotización #${quote.quoteNumber}`,
            };
            await addInvoice(invoiceData);
        }
    };

    const getCustomerName = (customerId: string) => {
        return customers.find(c => c.id === customerId)?.name || 'Cliente desconocido';
    };
    
    const statusClasses: Record<Quote['status'], string> = {
        Borrador: 'bg-slate-100 text-slate-800',
        Enviada: 'bg-amber-100 text-amber-800',
        Aceptada: 'bg-green-100 text-green-800',
        Rechazada: 'bg-red-100 text-red-800',
    };
    
    const filteredQuotes = useMemo(() => {
        const sorted = [...quotes].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (!searchQuery.trim()) {
            return sorted;
        }
        const lowercasedQuery = searchQuery.toLowerCase();
        return sorted.filter(quote => 
            quote.quoteNumber.toLowerCase().includes(lowercasedQuery) ||
            getCustomerName(quote.customerId).toLowerCase().includes(lowercasedQuery)
        );
    }, [quotes, searchQuery, customers]);


    return (
        <>
            <button onClick={() => goHome()} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 mb-6">
                <ArrowLeft size={16} />
                <span>Volver al Inicio</span>
            </button>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                    <h2 className="text-2xl font-bold text-slate-700 flex items-center gap-2">
                        <FileSpreadsheet className="text-sky-600"/>
                        Cotizaciones
                    </h2>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-grow">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Buscar cotización o cliente..."
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
                    {filteredQuotes.length > 0 ? (
                        filteredQuotes.map(quote => {
                            const technicianNames = Array.from(
                                new Set(
                                    quote.items
                                        .map(item => item.commission?.technicianId)
                                        .filter((id): id is string => !!id)
                                )
                            ).map(id => staff.find(s => s.id === id)?.name || 'Desconocido');

                            const technicianDisplay = technicianNames.length > 0 ? technicianNames.join(', ') : 'Sin asignar';
                            
                            const creator = staff.find(s => s.id === quote.createdById);
                            const creatorDisplay = creator ? creator.name : 'Sistema';

                            return (
                                <div key={quote.id} className="p-4 bg-slate-50 rounded-md border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center">
                                    <div className="mb-2 sm:mb-0 space-y-1">
                                        <p className="font-semibold text-slate-800">{quote.quoteNumber}</p>
                                        <p className="text-sm text-slate-600">{getCustomerName(quote.customerId)}</p>
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <Wrench size={12} className="flex-shrink-0" />
                                                <span className="truncate">Téc: {technicianDisplay}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <User size={12} className="flex-shrink-0" />
                                                <span className="truncate">Resp: {creatorDisplay}</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-400">{new Date(quote.date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="font-bold text-xl text-slate-800">RD$ {quote.total.toFixed(2)}</p>
                                             <select value={quote.status} onChange={(e) => handleChangeStatus(quote, e.target.value as Quote['status'])} className={`mt-1 text-xs font-medium py-0.5 px-2 rounded-full border-0 focus:ring-0 ${statusClasses[quote.status]}`}>
                                                <option value="Borrador">Borrador</option>
                                                <option value="Enviada">Enviada</option>
                                                <option value="Aceptada">Aceptada</option>
                                                <option value="Rechazada">Rechazada</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center flex-wrap justify-end gap-1">
                                            <button 
                                                onClick={() => handleConvertToInvoice(quote)}
                                                className="p-2 text-green-600 bg-green-100 hover:bg-green-200 rounded-full" 
                                                title="Convertir a Factura"
                                            >
                                                <FileText size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleOpenEditModal(quote)}
                                                className="p-2 text-slate-500 hover:bg-slate-200 rounded-full" 
                                                title="Editar Cotización"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteQuote(quote.id)}
                                                className="p-2 text-red-500 hover:bg-red-100 rounded-full" 
                                                title="Eliminar Cotización"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-center text-slate-500 py-8">
                           {searchQuery ? `No se encontraron cotizaciones para "${searchQuery}".` : "No se han creado cotizaciones todavía."}
                        </p>
                    )}
                </div>
            </div>
            {isFormModalOpen && (
                <QuoteFormModal
                    isOpen={isFormModalOpen}
                    onClose={() => setIsFormModalOpen(false)}
                    quoteToEdit={quoteToEdit}
                />
            )}
        </>
    );
};
