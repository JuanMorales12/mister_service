import React, { useContext, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { AppContext, AppContextType } from '../src/types';
import { Printer, Share2, X, Loader2 } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { formatCurrency } from '../src/utils';
import { generatePDF } from '../src/pdfGenerator';
import { firebaseService } from '../services/firebaseService';

export const QuotePrintView: React.FC = () => {
    const { quoteToPrint, setQuoteToPrint, companyInfo, setGlobalError } = useContext(AppContext) as AppContextType;
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    // Agregar clase al body cuando se monta el componente para controlar impresión
    useEffect(() => {
        if (quoteToPrint) {
            document.body.classList.add('print-mode-active');
            return () => {
                document.body.classList.remove('print-mode-active');
            };
        }
    }, [quoteToPrint]);

    if (!quoteToPrint) return null;

    const { quote, customer } = quoteToPrint;

    const handlePrint = () => {
        window.print();
        const afterPrint = () => {
            const shouldClose = window.confirm('¿Deseas cerrar la vista de impresión?');
            if (shouldClose) {
                setQuoteToPrint(null);
            }
            window.removeEventListener('afterprint', afterPrint);
        };
        window.addEventListener('afterprint', afterPrint);
    };

    const handleShare = async () => {
        setIsGeneratingPdf(true);
        try {
            // 1. Generar PDF
            const pdfBlob = await generatePDF('quote-print-content', `cotizacion-${quote.quoteNumber}`);

            // 2. Subir a Firebase Storage
            const file = new File([pdfBlob], `cotizacion-${quote.quoteNumber}-${Date.now()}.pdf`, { type: 'application/pdf' });
            const pdfUrl = await firebaseService.uploadFile(file, `quotes/${quote.quoteNumber}-${Date.now()}.pdf`);

            if (!pdfUrl) {
                throw new Error('No se pudo subir el PDF. Intenta nuevamente.');
            }

            // 3. Construir mensaje con link
            const validUntilDate = new Date(quote.date);
            validUntilDate.setDate(validUntilDate.getDate() + 15);
            const customerName = quote.customerName || customer.name || 'Cliente potencial';

            const message = `*${companyInfo.name}*
━━━━━━━━━━━━━━━━━
*COTIZACIÓN #${quote.quoteNumber}*
Fecha: ${new Date(quote.date).toLocaleDateString('es-ES')}
Válida hasta: ${validUntilDate.toLocaleDateString('es-ES')}
━━━━━━━━━━━━━━━━━

*Cliente:* ${customerName}
*Total:* RD$ ${formatCurrency(quote.total)}

📄 *Ver/Descargar Cotización PDF:*
${pdfUrl}

━━━━━━━━━━━━━━━━━
${companyInfo.phone ? `Tel: ${companyInfo.phone}` : ''}
${companyInfo.email ? `Email: ${companyInfo.email}` : ''}

_Gracias por su preferencia_`;

            const shareData = {
                title: `Cotización ${quote.quoteNumber}`,
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

    const handleShareWhatsAppWithPDF = async () => {
        setIsGeneratingPdf(true);
        try {
            // 1. Generar PDF
            const pdfBlob = await generatePDF('quote-print-content', `cotizacion-${quote.quoteNumber}`);

            // 2. Subir a Firebase Storage
            const file = new File([pdfBlob], `cotizacion-${quote.quoteNumber}-${Date.now()}.pdf`, { type: 'application/pdf' });
            const pdfUrl = await firebaseService.uploadFile(file, `quotes/${quote.quoteNumber}-${Date.now()}.pdf`);

            // Validar que el PDF se subió correctamente
            if (!pdfUrl) {
                throw new Error('No se pudo subir el PDF. Intenta nuevamente.');
            }

            // 3. Construir mensaje con link
            const validUntil = new Date(quote.date);
            validUntil.setDate(validUntil.getDate() + 15);

            // Usar datos de la cotización directamente
            const customerName = quote.customerName || customer.name || 'Cliente potencial';
            const customerPhone = quote.customerPhone || customer.phone || '';

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

            // 4. Abrir WhatsApp
            const phoneNumber = customerPhone.replace(/\D/g, '');
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = phoneNumber
                ? `https://wa.me/${phoneNumber.startsWith('1') || phoneNumber.startsWith('809') || phoneNumber.startsWith('829') || phoneNumber.startsWith('849') ? phoneNumber : '1' + phoneNumber}?text=${encodedMessage}`
                : `https://wa.me/?text=${encodedMessage}`;

            window.open(whatsappUrl, '_blank');
        } catch (error) {
            console.error('Error generating PDF:', error);
            setGlobalError('Error al generar PDF: ' + (error as Error).message);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    // Calcular fecha de validez (15 días)
    const validUntil = new Date(quote.date);
    validUntil.setDate(validUntil.getDate() + 15);

    const printContent = (
        <div className="fixed inset-0 z-[9999] print-container" id="print-container-wrapper">
            <div className="fixed top-4 right-4 flex flex-col gap-2 no-print z-[10000]" id="print-buttons">
                 <button onClick={() => setQuoteToPrint(null)} className="p-3 bg-white rounded-full shadow-lg text-slate-700 hover:bg-slate-100">
                    <X size={20}/>
                </button>
                <button onClick={handlePrint} className="p-3 bg-sky-600 text-white rounded-full shadow-lg hover:bg-sky-700">
                    <Printer size={20}/>
                </button>
                <button onClick={handleShare} className="p-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700" title="Compartir">
                    <Share2 size={20}/>
                </button>
                <button
                    onClick={handleShareWhatsAppWithPDF}
                    disabled={isGeneratingPdf}
                    className="p-3 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Enviar por WhatsApp con PDF"
                >
                    {isGeneratingPdf ? <Loader2 size={20} className="animate-spin"/> : <WhatsAppIcon size={20}/>}
                </button>
            </div>
            <div id="quote-print-content" className="A4-sheet text-sm">
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
                        <h2 className="text-2xl font-bold text-amber-600">COTIZACIÓN</h2>
                        <p className="mt-1"><b>Fecha:</b> {new Date(quote.date).toLocaleDateString('es-ES')}</p>
                    </div>
                </header>

                {/* Customer and Quote Details */}
                 <section className="my-3 grid grid-cols-2 gap-3">
                    <div className="p-2 border rounded-md bg-slate-50">
                        <h3 className="font-semibold text-slate-700">Cliente:</h3>
                        <p className="font-bold text-sm">{quote.customerName || customer.name || 'Cliente potencial'}</p>
                        {(quote.customerPhone || customer.phone) && <p>Tel: {quote.customerPhone || customer.phone}</p>}
                        {customer.email && <p>Email: {customer.email}</p>}
                        {customer.rnc && <p>RNC: {customer.rnc}</p>}
                    </div>
                     <div className="p-2 border rounded-md bg-slate-50 text-right">
                         <p><b>Cotización No.:</b> <span className="font-mono">{quote.quoteNumber}</span></p>
                         {companyInfo.rnc && <p><b>RNC:</b> <span className="font-mono">{companyInfo.rnc}</span></p>}
                         <p><b>Estado:</b> {quote.status}</p>
                         <p className="text-amber-600 font-semibold"><b>Válida hasta:</b> {validUntil.toLocaleDateString('es-ES')}</p>
                    </div>
                </section>

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
                            {quote.items.map(item => (
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
                        <div className="flex justify-between"><span>Subtotal:</span> <span>RD$ {formatCurrency(quote.subtotal)}</span></div>
                        {quote.discount > 0 && (
                            <div className="flex justify-between"><span>Descuento:</span> <span>- RD$ {formatCurrency(quote.discount)}</span></div>
                        )}
                        <div className="flex justify-between"><span>ITBIS ({quote.isTaxable ? '18%' : '0%'}):</span> <span>RD$ {formatCurrency(quote.taxes)}</span></div>
                        <div className="flex justify-between text-sm font-bold border-t-2 border-slate-700 mt-1 pt-1">
                            <span>Total General:</span>
                            <span>RD$ {formatCurrency(quote.total)}</span>
                        </div>
                    </div>
                </section>

                {/* Validity Note */}
                <section className="mt-3 p-2 border rounded-md bg-amber-50 border-amber-200">
                    <p className="text-amber-800">
                        <b>Nota:</b> Esta cotización tiene una validez de 15 días a partir de la fecha de emisión.
                        Los precios están sujetos a cambios después de este período.
                    </p>
                </section>

                {/* Footer */}
                <footer className="mt-6 pt-4 text-center text-slate-500 border-t">
                    <p>Gracias por su preferencia.</p>
                    <p>Esta cotización no representa un compromiso de venta.</p>
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
