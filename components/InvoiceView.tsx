
import React, { useState, useContext, useMemo } from 'react';
// FIX: Use the same AppContext instance from '../src/types' to avoid null context.
import { AppContext, AppContextType, Invoice } from '../src/types';
import { PlusCircle, Receipt, DollarSign, Search, Edit, Printer, Trash2, Copy, ArrowLeft, Loader2 } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { RecordPaymentModal } from './RecordPaymentModal';
import { formatCurrency } from '../src/utils';
import { generatePDF } from '../src/pdfGenerator';
import { firebaseService } from '../services/firebaseService';

export const InvoiceView: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) {
        return <div className="p-4 bg-red-50 text-red-700 rounded-md text-sm">Error: El contexto de la app no está disponible.</div>;
    }
    const { invoices, customers, companyInfo, setOrderToConvertToInvoice, setQuoteToConvertToInvoice, viewInvoice, setMode, goHome, setInvoiceToEdit, deleteInvoice, setInvoiceToDuplicate, setGlobalError } = context;
    const [invoiceToPay, setInvoiceToPay] = useState<Invoice | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [whatsappLoadingId, setWhatsappLoadingId] = useState<string | null>(null);

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

    const handleShareWhatsAppWithPDF = async (invoice: Invoice) => {
        const customer = customers.find(c => c.id === invoice.customerId);
        if (!customer) return;

        setWhatsappLoadingId(invoice.id);
        // Crear div oculto off-screen para renderizar la factura
        const hiddenContainer = document.createElement('div');
        hiddenContainer.style.cssText = 'position:fixed;left:-9999px;top:0;width:210mm;';
        document.body.appendChild(hiddenContainer);

        try {
            const balanceDue = invoice.total - invoice.paidAmount;
            // Construir el HTML de la factura (mismo markup que InvoicePrintView)
            hiddenContainer.innerHTML = `
                <style>
                    .hidden-invoice-sheet {
                        background: white;
                        width: 210mm;
                        padding: 10mm;
                        display: flex;
                        flex-direction: column;
                        font-family: system-ui, -apple-system, sans-serif;
                        font-size: 0.875rem;
                        color: #1e293b;
                    }
                    .hidden-invoice-sheet * { box-sizing: border-box; }
                    .hidden-invoice-sheet table { width: 100%; border-collapse: collapse; }
                    .hidden-invoice-sheet th { padding: 4px; text-align: left; }
                    .hidden-invoice-sheet td { padding: 4px; }
                    .hidden-invoice-sheet .text-right { text-align: right; }
                    .hidden-invoice-sheet .font-bold { font-weight: 700; }
                    .hidden-invoice-sheet .font-semibold { font-weight: 600; }
                    .hidden-invoice-sheet .font-mono { font-family: monospace; }
                    .hidden-invoice-sheet .border-b { border-bottom: 1px solid #e2e8f0; }
                    .hidden-invoice-sheet .border-t { border-top: 1px solid #e2e8f0; }
                    .hidden-invoice-sheet .border-t-2 { border-top: 2px solid #334155; }
                    .hidden-invoice-sheet .border-b-2 { border-bottom: 2px solid #334155; }
                    .hidden-invoice-sheet .bg-slate-700 { background-color: #334155; color: white; }
                    .hidden-invoice-sheet .bg-slate-50 { background-color: #f8fafc; }
                    .hidden-invoice-sheet .text-sky-600 { color: #0284c7; }
                    .hidden-invoice-sheet .text-slate-500 { color: #64748b; }
                    .hidden-invoice-sheet .text-slate-600 { color: #475569; }
                    .hidden-invoice-sheet .text-slate-700 { color: #334155; }
                    .hidden-invoice-sheet .text-slate-800 { color: #1e293b; }
                    .hidden-invoice-sheet .text-red-600 { color: #dc2626; }
                    .hidden-invoice-sheet .text-green-600 { color: #16a34a; }
                    .hidden-invoice-sheet .rounded-md { border-radius: 0.375rem; }
                    .hidden-invoice-sheet .border { border: 1px solid #e2e8f0; }
                    .hidden-invoice-sheet .p-2 { padding: 0.5rem; }
                    .hidden-invoice-sheet .pb-2 { padding-bottom: 0.5rem; }
                    .hidden-invoice-sheet .mt-1 { margin-top: 0.25rem; }
                    .hidden-invoice-sheet .mt-3 { margin-top: 0.75rem; }
                    .hidden-invoice-sheet .mt-6 { margin-top: 1.5rem; }
                    .hidden-invoice-sheet .mb-1 { margin-bottom: 0.25rem; }
                    .hidden-invoice-sheet .mb-3 { margin-bottom: 0.75rem; }
                    .hidden-invoice-sheet .my-3 { margin-top: 0.75rem; margin-bottom: 0.75rem; }
                    .hidden-invoice-sheet .pt-1 { padding-top: 0.25rem; }
                    .hidden-invoice-sheet .pt-4 { padding-top: 1rem; }
                    .hidden-invoice-sheet .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
                    .hidden-invoice-sheet .flex-between { display: flex; justify-content: space-between; }
                    .hidden-invoice-sheet .flex-end { display: flex; justify-content: flex-end; }
                    .hidden-invoice-sheet .w-64 { width: 16rem; }
                    .hidden-invoice-sheet .space-y > * + * { margin-top: 0.25rem; }
                    .hidden-invoice-sheet .header-flex { display: flex; justify-content: space-between; align-items: flex-start; }
                    .hidden-invoice-sheet .items-end { display: flex; flex-direction: column; align-items: flex-end; }
                    .hidden-invoice-sheet .logo { height: 4rem; width: 4rem; object-fit: contain; margin-bottom: 0.25rem; }
                    .hidden-invoice-sheet .text-2xl { font-size: 1.5rem; }
                    .hidden-invoice-sheet .text-xl { font-size: 1.25rem; }
                    .hidden-invoice-sheet .text-sm { font-size: 0.875rem; }
                    .hidden-invoice-sheet .text-center { text-align: center; }
                    .hidden-invoice-sheet .whitespace-pre-wrap { white-space: pre-wrap; }
                    .hidden-invoice-sheet .break-all { word-break: break-all; }
                </style>
                <div id="invoice-whatsapp-hidden-content" class="hidden-invoice-sheet">
                    <header class="header-flex pb-2 border-b-2">
                        <div>
                            <h1 class="text-xl font-bold text-slate-800">${companyInfo.name}</h1>
                            <p>${companyInfo.address}</p>
                            <p>Tel: ${companyInfo.phone} / WhatsApp: ${companyInfo.whatsapp}</p>
                            <p>${companyInfo.email}</p>
                        </div>
                        <div class="items-end text-right">
                            ${companyInfo.logoUrl ? `<img src="${companyInfo.logoUrl}" alt="Logo" class="logo" />` : ''}
                            <h2 class="text-2xl font-bold text-sky-600">FACTURA</h2>
                            <p class="mt-1"><b>Fecha:</b> ${new Date(invoice.date).toLocaleDateString('es-ES')}</p>
                        </div>
                    </header>
                    <section class="my-3 grid-2">
                        <div class="p-2 border rounded-md bg-slate-50">
                            <h3 class="font-semibold text-slate-700">Facturar a:</h3>
                            <p class="font-bold text-sm">${customer.name}</p>
                            <p>Tel: ${customer.phone}</p>
                            ${customer.email ? `<p class="break-all">Email: ${customer.email}</p>` : ''}
                            ${customer.rnc ? `<p>RNC: ${customer.rnc}</p>` : ''}
                        </div>
                        <div class="p-2 border rounded-md bg-slate-50 text-right">
                            <p><b>Factura No.:</b> <span class="font-mono">${invoice.invoiceNumber}</span></p>
                            ${companyInfo.rnc ? `<p><b>RNC:</b> <span class="font-mono">${companyInfo.rnc}</span></p>` : ''}
                            <p><b>Estado:</b> ${invoice.status}</p>
                        </div>
                    </section>
                    ${invoice.serviceOrderDescription ? `
                    <section class="mb-3 p-2 border rounded-md bg-slate-50">
                        <h3 class="font-semibold text-slate-700">Descripción del Servicio / Falla Reportada:</h3>
                        <p class="whitespace-pre-wrap">${invoice.serviceOrderDescription}</p>
                    </section>` : ''}
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
                                ${invoice.items.map(item => `
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
                            <div class="flex-between"><span>Subtotal:</span> <span>RD$ ${formatCurrency(invoice.subtotal)}</span></div>
                            ${invoice.discount > 0 ? `<div class="flex-between"><span>Descuento:</span> <span>- RD$ ${formatCurrency(invoice.discount)}</span></div>` : ''}
                            <div class="flex-between"><span>ITBIS (${invoice.isTaxable ? '18%' : '0%'}):</span> <span>RD$ ${formatCurrency(invoice.taxes)}</span></div>
                            <div class="flex-between font-bold border-t-2 mt-1 pt-1" style="font-size:0.875rem;">
                                <span>Total General:</span>
                                <span>RD$ ${formatCurrency(invoice.total)}</span>
                            </div>
                            <div class="flex-between text-slate-600"><span>Total Pagado:</span> <span>RD$ ${formatCurrency(invoice.paidAmount)}</span></div>
                            <div class="flex-between font-bold ${balanceDue > 0 ? 'text-red-600' : 'text-green-600'}">
                                <span>Balance:</span>
                                <span>RD$ ${formatCurrency(balanceDue)}</span>
                            </div>
                        </div>
                    </section>
                    <footer class="mt-6 pt-4 text-center text-slate-500 border-t">
                        <p>Gracias por su compra.</p>
                        <p>Original: Cliente / Copia: Vendedor</p>
                    </footer>
                </div>
            `;

            // Esperar a que las imágenes carguen y el CSS se aplique
            await new Promise(resolve => setTimeout(resolve, 300));

            // Generar PDF desde el div oculto
            const pdfBlob = await generatePDF('invoice-whatsapp-hidden-content', `factura-${invoice.invoiceNumber}`);

            // Subir a Firebase Storage
            const file = new File([pdfBlob], `factura-${invoice.invoiceNumber}-${Date.now()}.pdf`, { type: 'application/pdf' });
            const pdfUrl = await firebaseService.uploadFile(file, `invoices/${invoice.invoiceNumber}-${Date.now()}.pdf`);

            if (!pdfUrl) {
                throw new Error('No se pudo subir el PDF. Intenta nuevamente.');
            }

            // Construir mensaje WhatsApp con link al PDF
            const balanceDueAmount = invoice.total - invoice.paidAmount;
            const message = `*${companyInfo.name}*
━━━━━━━━━━━━━━━━━
*FACTURA #${invoice.invoiceNumber}*
Fecha: ${new Date(invoice.date).toLocaleDateString('es-ES')}
━━━━━━━━━━━━━━━━━

*Cliente:* ${customer.name}
*Total:* RD$ ${formatCurrency(invoice.total)}
${balanceDueAmount > 0 ? `*Balance Pendiente:* RD$ ${formatCurrency(balanceDueAmount)}` : '✅ *PAGADO*'}

📄 *Ver/Descargar Factura PDF:*
${pdfUrl}

━━━━━━━━━━━━━━━━━
${companyInfo.phone ? `Tel: ${companyInfo.phone}` : ''}
${companyInfo.email ? `Email: ${companyInfo.email}` : ''}

_Gracias por su preferencia_`;

            const phoneNumber = customer.phone?.replace(/\D/g, '') || '';
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = phoneNumber
                ? `https://wa.me/${phoneNumber.startsWith('1') || phoneNumber.startsWith('809') || phoneNumber.startsWith('829') || phoneNumber.startsWith('849') ? phoneNumber : '1' + phoneNumber}?text=${encodedMessage}`
                : `https://wa.me/?text=${encodedMessage}`;

            window.open(whatsappUrl, '_blank');
        } catch (error) {
            console.error('Error generating PDF for WhatsApp:', error);
            setGlobalError('Error al generar PDF: ' + (error as Error).message);
        } finally {
            // Limpiar el div oculto
            document.body.removeChild(hiddenContainer);
            setWhatsappLoadingId(null);
        }
    };

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
                                            onClick={() => handleShareWhatsAppWithPDF(invoice)}
                                            disabled={whatsappLoadingId === invoice.id}
                                            className="p-2 text-emerald-600 bg-emerald-100 hover:bg-emerald-200 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Enviar por WhatsApp"
                                        >
                                            {whatsappLoadingId === invoice.id ? <Loader2 size={16} className="animate-spin" /> : <WhatsAppIcon size={16} />}
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
