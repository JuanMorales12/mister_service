import React, { useContext } from 'react';
import { AppContext, AppContextType } from '../src/types';
import { Printer, Share2, X, MessageCircle } from 'lucide-react';
import logo from '../assets/logo.jpg';
import { formatCurrency } from '../src/utils';

export const InvoicePrintView: React.FC = () => {
    const { invoiceToPrint, setInvoiceToPrint, companyInfo, setGlobalError } = useContext(AppContext) as AppContextType;

    if (!invoiceToPrint) return null;

    const { invoice, customer } = invoiceToPrint;
    const balanceDue = invoice.total - invoice.paidAmount;

    const handlePrint = () => {
        window.print();
        // Detectar cuando se cierra el diálogo de impresión
        const afterPrint = () => {
            const shouldClose = window.confirm('¿Deseas cerrar la vista de impresión?');
            if (shouldClose) {
                setInvoiceToPrint(null);
            }
            window.removeEventListener('afterprint', afterPrint);
        };
        window.addEventListener('afterprint', afterPrint);
    };
    
    const handleShare = async () => {
        const shareData = {
            title: `Factura ${invoice.invoiceNumber}`,
            text: `Aquí está tu factura de Mister Service RD por un total de RD$ ${invoice.total.toFixed(2)}.`,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                setGlobalError('La función de compartir no está disponible en este navegador. Intenta guardar como PDF.');
            }
        } catch (err) {
            console.error('Error sharing:', err);
            const errorMessage = err instanceof Error ? `Error al compartir: ${err.message}` : 'Ocurrió un error desconocido al compartir.';
            setGlobalError(errorMessage);
        }
    };

    const handleShareWhatsApp = () => {
        const balanceDueAmount = invoice.total - invoice.paidAmount;
        const itemsList = invoice.items.map(item => `• ${item.quantity}x ${item.description}: RD$ ${formatCurrency(item.quantity * item.sellPrice)}`).join('\n');

        const message = `*${companyInfo.name}*
━━━━━━━━━━━━━━━━━
*FACTURA #${invoice.invoiceNumber}*
Fecha: ${new Date(invoice.date).toLocaleDateString('es-ES')}
━━━━━━━━━━━━━━━━━

*Cliente:* ${customer.name}
${customer.phone ? `*Tel:* ${customer.phone}` : ''}

*Detalle:*
${itemsList}

━━━━━━━━━━━━━━━━━
*Subtotal:* RD$ ${formatCurrency(invoice.subtotal)}
${invoice.discount > 0 ? `*Descuento:* -RD$ ${formatCurrency(invoice.discount)}` : ''}
*ITBIS (${invoice.isTaxable ? '18%' : '0%'}):* RD$ ${formatCurrency(invoice.taxes)}
*TOTAL:* RD$ ${formatCurrency(invoice.total)}
${invoice.paidAmount > 0 ? `*Pagado:* RD$ ${formatCurrency(invoice.paidAmount)}` : ''}
${balanceDueAmount > 0 ? `*Balance Pendiente:* RD$ ${formatCurrency(balanceDueAmount)}` : '*PAGADO*'}
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
    };

    return (
        <div className="fixed inset-0 z-[9999] print-container">
            <div className="fixed top-4 right-4 flex flex-col gap-2 no-print z-[10000]">
                 <button onClick={() => setInvoiceToPrint(null)} className="p-3 bg-white rounded-full shadow-lg text-slate-700 hover:bg-slate-100">
                    <X size={20}/>
                </button>
                <button onClick={handlePrint} className="p-3 bg-sky-600 text-white rounded-full shadow-lg hover:bg-sky-700">
                    <Printer size={20}/>
                </button>
                <button onClick={handleShare} className="p-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700" title="Compartir">
                    <Share2 size={20}/>
                </button>
                <button onClick={handleShareWhatsApp} className="p-3 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600" title="Enviar por WhatsApp">
                    <MessageCircle size={20}/>
                </button>
            </div>
            <div className="A4-sheet">
                {/* Header */}
                <header className="flex justify-between items-start pb-4 border-b-2 border-slate-700">
                    <div className="flex items-center gap-4">
                        {companyInfo.logoUrl && (
                            <img src={companyInfo.logoUrl} alt="Company Logo" className="h-20 w-20 object-contain" />
                        )}
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">{companyInfo.name}</h1>
                            <p>{companyInfo.address}</p>
                            <p>Tel: {companyInfo.phone} / WhatsApp: {companyInfo.whatsapp}</p>
                            <p>{companyInfo.email}</p>
                        </div>
                    </div>
                     <div className="text-right flex flex-col items-end">
                        <img src={logo} alt="Logo" className="h-40 w-40 object-contain mb-3" />
                        <h2 className="text-4xl font-bold text-sky-600">FACTURA</h2>
                        <p className="mt-2"><b>Fecha:</b> {new Date(invoice.date).toLocaleDateString('es-ES')}</p>
                    </div>
                </header>
                
                {/* Customer and Invoice Details */}
                 <section className="my-6 grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-md bg-slate-50">
                        <h3 className="font-semibold text-slate-700">Facturar a:</h3>
                        <p className="font-bold">{customer.name}</p>
                        <p>Tel: {customer.phone}</p>
                        {customer.email && <p>Email: {customer.email}</p>}
                        {customer.rnc && <p>RNC: {customer.rnc}</p>}
                    </div>
                     <div className="p-3 border rounded-md bg-slate-50 text-right">
                         <p><b>Factura No.:</b> <span className="font-mono">{invoice.invoiceNumber}</span></p>
                         {companyInfo.rnc && <p><b>RNC:</b> <span className="font-mono">{companyInfo.rnc}</span></p>}
                         <p><b>Estado:</b> {invoice.status}</p>
                    </div>
                </section>

                {/* Service Description */}
                {invoice.serviceOrderDescription && (
                    <section className="mb-6 p-3 border rounded-md bg-slate-50">
                        <h3 className="font-semibold text-slate-700">Descripción del Servicio / Falla Reportada:</h3>
                        <p className="text-sm whitespace-pre-wrap">{invoice.serviceOrderDescription}</p>
                    </section>
                )}
                
                {/* Items Table */}
                <section>
                    <table className="w-full text-sm">
                        <thead className="bg-slate-700 text-white">
                            <tr>
                                <th className="p-2 text-left">Cant.</th>
                                <th className="p-2 text-left">Descripción</th>
                                <th className="p-2 text-right">Precio Unit.</th>
                                <th className="p-2 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items.map(item => (
                                <tr key={item.id} className="border-b">
                                    <td className="p-2">{item.quantity}</td>
                                    <td className="p-2">{item.description}</td>
                                    <td className="p-2 text-right">RD$ {formatCurrency(item.sellPrice)}</td>
                                    <td className="p-2 text-right">RD$ {formatCurrency(item.quantity * item.sellPrice)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                {/* Totals */}
                <section className="mt-6 flex justify-end">
                    <div className="w-64 space-y-2 text-sm">
                        <div className="flex justify-between"><span>Subtotal:</span> <span>RD$ {formatCurrency(invoice.subtotal)}</span></div>
                        {invoice.discount > 0 && (
                            <div className="flex justify-between"><span>Descuento:</span> <span>- RD$ {formatCurrency(invoice.discount)}</span></div>
                        )}
                        <div className="flex justify-between"><span>ITBIS ({invoice.isTaxable ? '18%' : '0%'}):</span> <span>RD$ {formatCurrency(invoice.taxes)}</span></div>
                        <div className="flex justify-between text-lg font-bold border-t-2 border-slate-700 mt-2 pt-2">
                            <span>Total General:</span>
                            <span>RD$ {formatCurrency(invoice.total)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600"><span>Total Pagado:</span> <span>RD$ {formatCurrency(invoice.paidAmount)}</span></div>
                        <div className={`flex justify-between font-bold ${balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            <span>Balance:</span>
                            <span>RD$ {formatCurrency(balanceDue)}</span>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="mt-auto pt-8 text-center text-xs text-slate-500 border-t">
                    <p>Gracias por su compra.</p>
                    <p>Original: Cliente / Copia: Vendedor</p>
                </footer>
            </div>
            <style>{`
                .print-container {
                    background-color: #e2e8f0;
                    padding: 0.5rem;
                    overflow-y: auto;
                }
                @media (min-width: 768px) {
                    .print-container {
                        padding: 2rem;
                    }
                }
                .A4-sheet {
                    background: white;
                    width: 100%;
                    max-width: 210mm;
                    min-height: 297mm;
                    margin: 0 auto;
                    padding: 1rem;
                    box-shadow: 0 0 0.5cm rgba(0,0,0,0.5);
                    display: flex;
                    flex-direction: column;
                }
                @media (min-width: 768px) {
                    .A4-sheet {
                        width: 210mm;
                        height: 297mm;
                        padding: 1.5cm;
                    }
                }
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-container, .print-container * {
                        visibility: visible;
                    }
                    .print-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        padding: 0;
                        background-color: white;
                    }
                    .A4-sheet {
                        margin: 0;
                        box-shadow: none;
                        width: 100%;
                        height: auto;
                    }
                    .no-print {
                        display: none;
                    }
                    section {
                        page-break-inside: avoid;
                    }
                    table {
                        page-break-inside: avoid;
                    }
                    thead {
                        display: table-header-group;
                    }
                    tr {
                        page-break-inside: avoid;
                    }
                }
                @page {
                    size: A4;
                    margin: 0;
                }
            `}</style>
        </div>
    );
};
