
import React, { useState, useContext, useMemo } from 'react';
import { AppContext, AppContextType, Quote } from '../src/types';
import { PlusCircle, FileSpreadsheet, Search, Edit, Trash2, FileText, Wrench, User, ArrowLeft, CheckCircle, Printer } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { formatCurrency } from '../src/utils';
import { QuoteFormModal } from './QuoteFormModal';

export const QuoteView: React.FC = () => {
    const { quotes, customers, staff, setQuoteToConvertToInvoice, goHome, setMode, deleteQuote, updateQuote, companyInfo, setQuoteToPrint, setGlobalError } = useContext(AppContext) as AppContextType;
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [quoteToEdit, setQuoteToEdit] = useState<Quote | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<Quote['status'] | 'Todos'>('Todos');
    const [processingQuoteId, setProcessingQuoteId] = useState<string | null>(null);

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
        // Prevenir clicks múltiples
        if (processingQuoteId === quote.id) return;

        if (quote.status !== 'Aceptada') {
            const confirmConvert = window.confirm('Esta cotización no está marcada como "Aceptada". ¿Deseas convertirla a factura de todos modos?');
            if (!confirmConvert) return;
        }
        setProcessingQuoteId(quote.id);
        setQuoteToConvertToInvoice(quote);
        setMode('facturacion-form');
    };
    
    const handleChangeStatus = async (quote: Quote, status: Quote['status']) => {
        // Prevenir clicks múltiples o cambio al mismo estado
        if (processingQuoteId === quote.id) return;
        if (quote.status === status) return;

        setProcessingQuoteId(quote.id);
        try {
            await updateQuote(quote.id, {
                customerId: quote.customerId,
                date: quote.date,
                items: quote.items,
                discount: quote.discount,
                isTaxable: quote.isTaxable,
                status: status,
                createdById: quote.createdById,
            });
        } finally {
            setProcessingQuoteId(null);
        }
    };

    const getCustomerName = (customerId: string) => {
        if (!customerId) return 'Cliente potencial';
        return customers.find(c => c.id === customerId)?.name || 'Cliente potencial';
    };
    
    const statusClasses: Record<Quote['status'], string> = {
        Borrador: 'bg-slate-100 text-slate-800',
        Enviada: 'bg-amber-100 text-amber-800',
        Aceptada: 'bg-green-100 text-green-800',
        Rechazada: 'bg-red-100 text-red-800',
    };
    
    const filteredQuotes = useMemo(() => {
        let result = [...quotes].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Filtrar por estado
        if (statusFilter !== 'Todos') {
            result = result.filter(quote => quote.status === statusFilter);
        }

        // Filtrar por búsqueda
        if (searchQuery.trim()) {
            const lowercasedQuery = searchQuery.toLowerCase();
            result = result.filter(quote =>
                quote.quoteNumber.toLowerCase().includes(lowercasedQuery) ||
                getCustomerName(quote.customerId).toLowerCase().includes(lowercasedQuery)
            );
        }

        return result;
    }, [quotes, searchQuery, statusFilter, customers]);

    // Contador de cotizaciones por estado
    const statusCounts = useMemo(() => {
        return {
            Todos: quotes.length,
            Borrador: quotes.filter(q => q.status === 'Borrador').length,
            Enviada: quotes.filter(q => q.status === 'Enviada').length,
            Aceptada: quotes.filter(q => q.status === 'Aceptada').length,
            Rechazada: quotes.filter(q => q.status === 'Rechazada').length,
        };
    }, [quotes]);

    // Función rápida para marcar como aceptada
    const handleQuickAccept = async (quote: Quote) => {
        if (quote.status === 'Aceptada') return;
        await handleChangeStatus(quote, 'Aceptada');
    };

    // Función para imprimir/PDF
    const handlePrintQuote = (quote: Quote) => {
        const customer = customers.find(c => c.id === quote.customerId);
        // Si no hay cliente, crear uno temporal con "Cliente potencial"
        const customerData = customer || {
            id: '',
            name: 'Cliente potencial',
            phone: '',
            email: '',
            address: '',
            serviceHistory: []
        };
        setQuoteToPrint({ quote, customer: customerData });
    };

    // Función para compartir por WhatsApp
    const handleShareWhatsApp = (quote: Quote) => {
        const customer = customers.find(c => c.id === quote.customerId);
        const itemsList = quote.items.map(item => `• ${item.quantity}x ${item.description}: RD$ ${formatCurrency(item.quantity * item.sellPrice)}`).join('\n');

        const message = `*${companyInfo.name}*
━━━━━━━━━━━━━━━━━
*COTIZACIÓN #${quote.quoteNumber}*
Fecha: ${new Date(quote.date).toLocaleDateString('es-ES')}
━━━━━━━━━━━━━━━━━

${customer ? `*Cliente:* ${customer.name}` : ''}
${customer?.phone ? `*Tel:* ${customer.phone}` : ''}

*Detalle:*
${itemsList}

━━━━━━━━━━━━━━━━━
*Subtotal:* RD$ ${formatCurrency(quote.subtotal)}
${quote.discount > 0 ? `*Descuento:* -${quote.discount}%` : ''}
*ITBIS (${quote.isTaxable ? '18%' : '0%'}):* RD$ ${formatCurrency(quote.taxes)}
*TOTAL:* RD$ ${formatCurrency(quote.total)}
━━━━━━━━━━━━━━━━━

_Esta cotización tiene validez de 15 días._

${companyInfo.phone ? `Tel: ${companyInfo.phone}` : ''}
${companyInfo.email ? `Email: ${companyInfo.email}` : ''}

_Gracias por su preferencia_`;

        const phoneNumber = customer?.phone?.replace(/\D/g, '') || '';
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = phoneNumber
            ? `https://wa.me/${phoneNumber.startsWith('1') || phoneNumber.startsWith('809') || phoneNumber.startsWith('829') || phoneNumber.startsWith('849') ? phoneNumber : '1' + phoneNumber}?text=${encodedMessage}`
            : `https://wa.me/?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');
    };

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

                {/* Filtros de estado */}
                <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-slate-200">
                    {(['Todos', 'Borrador', 'Enviada', 'Aceptada', 'Rechazada'] as const).map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                                statusFilter === status
                                    ? status === 'Todos' ? 'bg-sky-600 text-white'
                                    : status === 'Borrador' ? 'bg-slate-600 text-white'
                                    : status === 'Enviada' ? 'bg-amber-500 text-white'
                                    : status === 'Aceptada' ? 'bg-green-600 text-white'
                                    : 'bg-red-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {status} ({statusCounts[status]})
                        </button>
                    ))}
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
                                            <p className="font-bold text-xl text-slate-800">RD$ {formatCurrency(quote.total)}</p>
                                             <select value={quote.status} onChange={(e) => handleChangeStatus(quote, e.target.value as Quote['status'])} disabled={processingQuoteId === quote.id} className={`mt-1 text-xs font-medium py-0.5 px-2 rounded-full border-0 focus:ring-0 ${statusClasses[quote.status]} ${processingQuoteId === quote.id ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                <option value="Borrador">Borrador</option>
                                                <option value="Enviada">Enviada</option>
                                                <option value="Aceptada">Aceptada</option>
                                                <option value="Rechazada">Rechazada</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center flex-wrap justify-end gap-1">
                                            {quote.status !== 'Aceptada' && (
                                                <button
                                                    onClick={() => handleQuickAccept(quote)}
                                                    disabled={processingQuoteId === quote.id}
                                                    className={`p-2 text-emerald-600 bg-emerald-100 hover:bg-emerald-200 rounded-full ${processingQuoteId === quote.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    title="Marcar como Aceptada"
                                                >
                                                    <CheckCircle size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handlePrintQuote(quote)}
                                                className="p-2 text-sky-600 bg-sky-100 hover:bg-sky-200 rounded-full"
                                                title="Imprimir / PDF"
                                            >
                                                <Printer size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleShareWhatsApp(quote)}
                                                className="p-2 text-emerald-600 bg-emerald-100 hover:bg-emerald-200 rounded-full"
                                                title="Enviar por WhatsApp"
                                            >
                                                <WhatsAppIcon size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleConvertToInvoice(quote)}
                                                disabled={processingQuoteId === quote.id}
                                                className={`p-2 text-green-600 bg-green-100 hover:bg-green-200 rounded-full ${processingQuoteId === quote.id ? 'opacity-50 cursor-not-allowed' : ''}`}
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
