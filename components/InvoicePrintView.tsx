import React, { useContext, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { AppContext, AppContextType } from '../src/types';
import { Printer, Share2, X, Loader2 } from 'lucide-react';
import { formatCurrency } from '../src/utils';
import { generatePDF } from '../src/pdfGenerator';
import { firebaseService } from '../services/firebaseService';

export const InvoicePrintView: React.FC = () => {
    const { invoiceToPrint, setInvoiceToPrint, companyInfo, setGlobalError } = useContext(AppContext) as AppContextType;
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    // Agregar clase al body cuando se monta el componente
    useEffect(() => {
        if (invoiceToPrint) {
            document.body.classList.add('print-mode-active');
            return () => {
                document.body.classList.remove('print-mode-active');
            };
        }
    }, [invoiceToPrint]);

    if (!invoiceToPrint) return null;

    const { invoice, customer } = invoiceToPrint;
    const balanceDue = invoice.total - invoice.paidAmount;

    const handlePrint = () => {
        window.print();
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
        setIsGeneratingPdf(true);
        try {
            // 1. Generar PDF
            const pdfBlob = await generatePDF('invoice-print-content', `factura-${invoice.invoiceNumber}`);

            // 2. Subir a Firebase Storage
            const file = new File([pdfBlob], `factura-${invoice.invoiceNumber}-${Date.now()}.pdf`, { type: 'application/pdf' });
            const pdfUrl = await firebaseService.uploadFile(file, `invoices/${invoice.invoiceNumber}-${Date.now()}.pdf`);

            if (!pdfUrl) {
                throw new Error('No se pudo subir el PDF. Intenta nuevamente.');
            }

            // 3. Construir mensaje con link
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

            const shareData = {
                title: `Factura ${invoice.invoiceNumber}`,
                text: message,
            };

            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                setGlobalError('La función de compartir no está disponible en este navegador. Intenta guardar como PDF.');
            }
        } catch (err) {
            console.error('Error sharing:', err);
            const errorMessage = err instanceof Error ? `Error al compartir: ${err.message}` : 'Ocurrió un error desconocido al compartir.';
            setGlobalError(errorMessage);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const printContent = (
        <div className="fixed inset-0 z-[9999] print-container" id="print-container-wrapper">
            <div className="fixed top-4 right-4 flex flex-col gap-2 no-print z-[10000]" id="print-buttons">
                 <button onClick={() => setInvoiceToPrint(null)} className="p-3 bg-white rounded-full shadow-lg text-slate-700 hover:bg-slate-100">
                    <X size={20}/>
                </button>
                <button onClick={handlePrint} className="p-3 bg-sky-600 text-white rounded-full shadow-lg hover:bg-sky-700">
                    <Printer size={20}/>
                </button>
                <button onClick={handleShare} disabled={isGeneratingPdf} className="p-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed" title="Compartir">
                    {isGeneratingPdf ? <Loader2 size={20} className="animate-spin"/> : <Share2 size={20}/>}
                </button>
            </div>
            <div id="invoice-print-content" className="A4-sheet text-sm">
                {/* Header */}
                <header className="flex justify-between items-start pb-2 border-b-2 border-slate-700">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">{companyInfo.name}</h1>
                        <p>{companyInfo.address}</p>
                        <p>Tel: {companyInfo.phone} / WhatsApp: {companyInfo.whatsapp}</p>
                        <p>{companyInfo.email}</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        {companyInfo.logoUrl && (
                            <img src={companyInfo.logoUrl} alt="Company Logo" className="h-16 w-16 object-contain mb-1" />
                        )}
                        <h2 className="text-2xl font-bold text-sky-600">FACTURA</h2>
                        <p className="mt-1"><b>Fecha:</b> {new Date(invoice.date).toLocaleDateString('es-ES')}</p>
                    </div>
                </header>

                {/* Customer and Invoice Details */}
                 <section className="my-3 grid grid-cols-2 gap-3">
                    <div className="p-2 border rounded-md bg-slate-50">
                        <h3 className="font-semibold text-slate-700">Facturar a:</h3>
                        <p className="font-bold text-sm">{customer.name}</p>
                        <p>Tel: {customer.phone}</p>
                        {customer.email && <p className="break-all">Email: {customer.email}</p>}
                        {customer.rnc && <p>RNC: {customer.rnc}</p>}
                    </div>
                     <div className="p-2 border rounded-md bg-slate-50 text-right">
                         <p><b>Factura No.:</b> <span className="font-mono">{invoice.invoiceNumber}</span></p>
                         {companyInfo.rnc && <p><b>RNC:</b> <span className="font-mono">{companyInfo.rnc}</span></p>}
                         <p><b>Estado:</b> {invoice.status}</p>
                    </div>
                </section>

                {/* Service Description */}
                {invoice.serviceOrderDescription && (
                    <section className="mb-3 p-2 border rounded-md bg-slate-50">
                        <h3 className="font-semibold text-slate-700">Descripción del Servicio / Falla Reportada:</h3>
                        <p className="whitespace-pre-wrap">{invoice.serviceOrderDescription}</p>
                    </section>
                )}

                {/* Items Table */}
                <section>
                    <table className="w-full">
                        <thead className="bg-slate-700 text-white">
                            <tr>
                                <th className="p-1 text-left">Cant.</th>
                                <th className="p-1 text-left">Descripción</th>
                                <th className="p-1 text-right">Precio Unit.</th>
                                <th className="p-1 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items.map(item => (
                                <tr key={item.id} className="border-b">
                                    <td className="p-1">{item.quantity}</td>
                                    <td className="p-1">{item.description}</td>
                                    <td className="p-1 text-right">RD$ {formatCurrency(item.sellPrice)}</td>
                                    <td className="p-1 text-right">RD$ {formatCurrency(item.quantity * item.sellPrice)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                {/* Totals */}
                <section className="mt-3 flex justify-end">
                    <div className="w-64 space-y-1">
                        <div className="flex justify-between"><span>Subtotal:</span> <span>RD$ {formatCurrency(invoice.subtotal)}</span></div>
                        {invoice.discount > 0 && (
                            <div className="flex justify-between"><span>Descuento:</span> <span>- RD$ {formatCurrency(invoice.discount)}</span></div>
                        )}
                        <div className="flex justify-between"><span>ITBIS ({invoice.isTaxable ? '18%' : '0%'}):</span> <span>RD$ {formatCurrency(invoice.taxes)}</span></div>
                        <div className="flex justify-between text-sm font-bold border-t-2 border-slate-700 mt-1 pt-1">
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
                <footer className="mt-6 pt-4 text-center text-slate-500 border-t">
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
                    min-height: auto;
                    margin: 0 auto;
                    padding: 8mm;
                    box-shadow: 0 0 0.5cm rgba(0,0,0,0.5);
                    display: flex;
                    flex-direction: column;
                }
                @media (min-width: 768px) {
                    .A4-sheet {
                        width: 210mm;
                        min-height: auto;
                        padding: 10mm;
                    }
                }
            `}</style>
        </div>
    );

    // Usar createPortal para renderizar fuera del #root
    return ReactDOM.createPortal(printContent, document.body);
};
