
import React, { useState, useContext, useMemo } from 'react';
import { AppContext, AppContextType, Quote } from '../src/types';
import { PlusCircle, FileSpreadsheet, Search, Edit, Trash2, FileText, Wrench, User, ArrowLeft, CheckCircle, Printer, Loader2 } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { formatCurrency } from '../src/utils';
import { QuoteFormModal } from './QuoteFormModal';
import { generatePDF } from '../src/pdfGenerator';
import { firebaseService } from '../services/firebaseService';

export const QuoteView: React.FC = () => {
    const { quotes, customers, staff, setQuoteToConvertToInvoice, goHome, setMode, deleteQuote, updateQuote, companyInfo, setQuoteToPrint, setGlobalError } = useContext(AppContext) as AppContextType;
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [quoteToEdit, setQuoteToEdit] = useState<Quote | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<Quote['status'] | 'Todos'>('Todos');
    const [processingQuoteId, setProcessingQuoteId] = useState<string | null>(null);
    const [whatsappLoadingId, setWhatsappLoadingId] = useState<string | null>(null);

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
                customerName: quote.customerName,
                customerPhone: quote.customerPhone,
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

    // Verificar si es cliente registrado o potencial
    const isRegisteredCustomer = (quote: Quote) => {
        return quote.customerId && customers.some(c => c.id === quote.customerId);
    };

    const getCustomerDisplay = (quote: Quote) => {
        return quote.customerName || 'Cliente potencial';
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
                (quote.customerName || '').toLowerCase().includes(lowercasedQuery) ||
                (quote.customerPhone || '').includes(searchQuery.replace(/\D/g, ''))
            );
        }

        return result;
    }, [quotes, searchQuery, statusFilter]);

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
        // Buscar cliente existente si hay customerId, sino usar datos de la cotización
        const existingCustomer = quote.customerId ? customers.find(c => c.id === quote.customerId) : null;
        const customerData = existingCustomer || {
            id: quote.customerId || '',
            name: quote.customerName || 'Cliente potencial',
            phone: quote.customerPhone || '',
            email: '',
            address: '',
            serviceHistory: []
        };
        setQuoteToPrint({ quote, customer: customerData });
    };

    // Función para compartir por WhatsApp con PDF
    const handleShareWhatsAppWithPDF = async (quote: Quote) => {
        const customerName = quote.customerName || 'Cliente potencial';
        const customerPhone = quote.customerPhone || '';
        const existingCustomer = quote.customerId ? customers.find(c => c.id === quote.customerId) : null;

        setWhatsappLoadingId(quote.id);
        const hiddenContainer = document.createElement('div');
        hiddenContainer.style.cssText = 'position:fixed;left:-9999px;top:0;width:210mm;';
        document.body.appendChild(hiddenContainer);

        try {
            const validUntil = new Date(quote.date);
            validUntil.setDate(validUntil.getDate() + 15);

            hiddenContainer.innerHTML = `
                <style>
                    .hidden-quote-sheet {
                        background: white;
                        width: 210mm;
                        padding: 10mm;
                        display: flex;
                        flex-direction: column;
                        font-family: system-ui, -apple-system, sans-serif;
                        font-size: 0.875rem;
                        color: #1e293b;
                    }
                    .hidden-quote-sheet * { box-sizing: border-box; }
                    .hidden-quote-sheet table { width: 100%; border-collapse: collapse; }
                    .hidden-quote-sheet th { padding: 4px; text-align: left; }
                    .hidden-quote-sheet td { padding: 4px; }
                    .hidden-quote-sheet .text-right { text-align: right; }
                    .hidden-quote-sheet .font-bold { font-weight: 700; }
                    .hidden-quote-sheet .font-semibold { font-weight: 600; }
                    .hidden-quote-sheet .font-mono { font-family: monospace; }
                    .hidden-quote-sheet .border-b { border-bottom: 1px solid #e2e8f0; }
                    .hidden-quote-sheet .border-t { border-top: 1px solid #e2e8f0; }
                    .hidden-quote-sheet .border-t-2 { border-top: 2px solid #334155; }
                    .hidden-quote-sheet .border-b-2 { border-bottom: 2px solid #334155; }
                    .hidden-quote-sheet .bg-slate-700 { background-color: #334155; color: white; }
                    .hidden-quote-sheet .bg-slate-50 { background-color: #f8fafc; }
                    .hidden-quote-sheet .bg-amber-50 { background-color: #fffbeb; }
                    .hidden-quote-sheet .border-amber-200 { border-color: #fde68a; }
                    .hidden-quote-sheet .text-amber-600 { color: #d97706; }
                    .hidden-quote-sheet .text-amber-800 { color: #92400e; }
                    .hidden-quote-sheet .text-sky-600 { color: #0284c7; }
                    .hidden-quote-sheet .text-slate-500 { color: #64748b; }
                    .hidden-quote-sheet .text-slate-600 { color: #475569; }
                    .hidden-quote-sheet .text-slate-700 { color: #334155; }
                    .hidden-quote-sheet .text-slate-800 { color: #1e293b; }
                    .hidden-quote-sheet .rounded-md { border-radius: 0.375rem; }
                    .hidden-quote-sheet .border { border: 1px solid #e2e8f0; }
                    .hidden-quote-sheet .p-2 { padding: 0.5rem; }
                    .hidden-quote-sheet .pb-2 { padding-bottom: 0.5rem; }
                    .hidden-quote-sheet .mt-1 { margin-top: 0.25rem; }
                    .hidden-quote-sheet .mt-3 { margin-top: 0.75rem; }
                    .hidden-quote-sheet .mt-6 { margin-top: 1.5rem; }
                    .hidden-quote-sheet .mb-1 { margin-bottom: 0.25rem; }
                    .hidden-quote-sheet .my-3 { margin-top: 0.75rem; margin-bottom: 0.75rem; }
                    .hidden-quote-sheet .pt-1 { padding-top: 0.25rem; }
                    .hidden-quote-sheet .pt-4 { padding-top: 1rem; }
                    .hidden-quote-sheet .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
                    .hidden-quote-sheet .flex-between { display: flex; justify-content: space-between; }
                    .hidden-quote-sheet .flex-end { display: flex; justify-content: flex-end; }
                    .hidden-quote-sheet .w-64 { width: 16rem; }
                    .hidden-quote-sheet .space-y > * + * { margin-top: 0.25rem; }
                    .hidden-quote-sheet .header-flex { display: flex; justify-content: space-between; align-items: flex-start; }
                    .hidden-quote-sheet .items-end { display: flex; flex-direction: column; align-items: flex-end; }
                    .hidden-quote-sheet .logo { height: 4rem; width: 4rem; object-fit: contain; margin-bottom: 0.25rem; }
                    .hidden-quote-sheet .text-2xl { font-size: 1.5rem; }
                    .hidden-quote-sheet .text-xl { font-size: 1.25rem; }
                    .hidden-quote-sheet .text-sm { font-size: 0.875rem; }
                    .hidden-quote-sheet .text-center { text-align: center; }
                    .hidden-quote-sheet .break-all { word-break: break-all; }
                </style>
                <div id="quote-whatsapp-hidden-content" class="hidden-quote-sheet">
                    <header class="header-flex pb-2 border-b-2">
                        <div>
                            <h1 class="text-xl font-bold text-slate-800">${companyInfo.name}</h1>
                            <p>${companyInfo.address}</p>
                            <p>Tel: ${companyInfo.phone} / WhatsApp: ${companyInfo.whatsapp}</p>
                            <p>${companyInfo.email}</p>
                        </div>
                        <div class="items-end text-right">
                            ${companyInfo.logoUrl ? `<img src="${companyInfo.logoUrl}" alt="Logo" class="logo" />` : ''}
                            <h2 class="text-2xl font-bold text-amber-600">COTIZACIÓN</h2>
                            <p class="mt-1"><b>Fecha:</b> ${new Date(quote.date).toLocaleDateString('es-ES')}</p>
                        </div>
                    </header>
                    <section class="my-3 grid-2">
                        <div class="p-2 border rounded-md bg-slate-50">
                            <h3 class="font-semibold text-slate-700">Cliente:</h3>
                            <p class="font-bold text-sm">${customerName}</p>
                            ${customerPhone ? `<p>Tel: ${customerPhone}</p>` : ''}
                            ${existingCustomer?.email ? `<p class="break-all">Email: ${existingCustomer.email}</p>` : ''}
                            ${existingCustomer?.rnc ? `<p>RNC: ${existingCustomer.rnc}</p>` : ''}
                        </div>
                        <div class="p-2 border rounded-md bg-slate-50 text-right">
                            <p><b>Cotización No.:</b> <span class="font-mono">${quote.quoteNumber}</span></p>
                            ${companyInfo.rnc ? `<p><b>RNC:</b> <span class="font-mono">${companyInfo.rnc}</span></p>` : ''}
                            <p><b>Estado:</b> ${quote.status}</p>
                            <p class="text-amber-600 font-semibold"><b>Válida hasta:</b> ${validUntil.toLocaleDateString('es-ES')}</p>
                        </div>
                    </section>
                    <section>
                        <table>
                            <thead class="bg-slate-700">
                                <tr>
                                    <th style="padding:4px;text-align:left;">Cant.</th>
                                    <th style="padding:4px;text-align:left;">Descripción</th>
                                    <th style="padding:4px;text-align:right;">Precio Unit.</th>
                                    <th style="padding:4px;text-align:right;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${quote.items.map(item => `
                                <tr class="border-b">
                                    <td style="padding:4px;">${item.quantity}</td>
                                    <td style="padding:4px;">${item.description}</td>
                                    <td style="padding:4px;text-align:right;">RD$ ${formatCurrency(item.sellPrice)}</td>
                                    <td style="padding:4px;text-align:right;">RD$ ${formatCurrency(item.quantity * item.sellPrice)}</td>
                                </tr>`).join('')}
                            </tbody>
                        </table>
                    </section>
                    <section class="mt-3 flex-end">
                        <div class="w-64 space-y">
                            <div class="flex-between"><span>Subtotal:</span> <span>RD$ ${formatCurrency(quote.subtotal)}</span></div>
                            ${quote.discount > 0 ? `<div class="flex-between"><span>Descuento:</span> <span>- RD$ ${formatCurrency(quote.discount)}</span></div>` : ''}
                            <div class="flex-between"><span>ITBIS (${quote.isTaxable ? '18%' : '0%'}):</span> <span>RD$ ${formatCurrency(quote.taxes)}</span></div>
                            <div class="flex-between font-bold border-t-2 mt-1 pt-1" style="font-size:0.875rem;">
                                <span>Total General:</span>
                                <span>RD$ ${formatCurrency(quote.total)}</span>
                            </div>
                        </div>
                    </section>
                    <section class="mt-3 p-2 border rounded-md bg-amber-50 border-amber-200">
                        <p class="text-amber-800">
                            <b>Nota:</b> Esta cotización tiene una validez de 15 días a partir de la fecha de emisión.
                            Los precios están sujetos a cambios después de este período.
                        </p>
                    </section>
                    <footer class="mt-6 pt-4 text-center text-slate-500 border-t">
                        <p>Gracias por su preferencia.</p>
                        <p>Esta cotización no representa un compromiso de venta.</p>
                    </footer>
                </div>
            `;

            await new Promise(resolve => setTimeout(resolve, 300));

            const pdfBlob = await generatePDF('quote-whatsapp-hidden-content', `cotizacion-${quote.quoteNumber}`);
            const file = new File([pdfBlob], `cotizacion-${quote.quoteNumber}-${Date.now()}.pdf`, { type: 'application/pdf' });
            const pdfUrl = await firebaseService.uploadFile(file, `quotes/${quote.quoteNumber}-${Date.now()}.pdf`);

            if (!pdfUrl) {
                throw new Error('No se pudo subir el PDF. Intenta nuevamente.');
            }

            const message = `*${companyInfo.name}*
━━━━━━━━━━━━━━━━━
*COTIZACIÓN #${quote.quoteNumber}*
Fecha: ${new Date(quote.date).toLocaleDateString('es-ES')}
Válida hasta: ${validUntil.toLocaleDateString('es-ES')}
━━━━━━━━━━━━━━━━━

*Cliente:* ${customerName}
*Total:* RD$ ${formatCurrency(quote.total)}

📄 *Ver/Descargar Cotización PDF:*
${pdfUrl}

━━━━━━━━━━━━━━━━━
${companyInfo.phone ? `Tel: ${companyInfo.phone}` : ''}
${companyInfo.email ? `Email: ${companyInfo.email}` : ''}

_Gracias por su preferencia_`;

            const phoneNumber = customerPhone.replace(/\D/g, '');
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = phoneNumber
                ? `https://wa.me/${phoneNumber.startsWith('1') || phoneNumber.startsWith('809') || phoneNumber.startsWith('829') || phoneNumber.startsWith('849') ? phoneNumber : '1' + phoneNumber}?text=${encodedMessage}`
                : `https://wa.me/?text=${encodedMessage}`;

            window.open(whatsappUrl, '_blank');
        } catch (error) {
            console.error('Error generating PDF for WhatsApp:', error);
            setGlobalError('Error al generar PDF: ' + (error as Error).message);
        } finally {
            document.body.removeChild(hiddenContainer);
            setWhatsappLoadingId(null);
        }
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

                            const isPotentialCustomer = !isRegisteredCustomer(quote);

                            return (
                                <div key={quote.id} className="p-4 bg-slate-50 rounded-md border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center">
                                    <div className="mb-2 sm:mb-0 space-y-1">
                                        <p className="font-semibold text-slate-800">{quote.quoteNumber}</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm text-slate-600">{getCustomerDisplay(quote)}</p>
                                            {isPotentialCustomer && (
                                                <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                                                    Potencial
                                                </span>
                                            )}
                                        </div>
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
                                                onClick={() => handleShareWhatsAppWithPDF(quote)}
                                                disabled={whatsappLoadingId === quote.id}
                                                className="p-2 text-emerald-600 bg-emerald-100 hover:bg-emerald-200 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Enviar por WhatsApp"
                                            >
                                                {whatsappLoadingId === quote.id ? <Loader2 size={16} className="animate-spin" /> : <WhatsAppIcon size={16} />}
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
