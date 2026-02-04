import React, { useState, useContext, useEffect, useCallback } from 'react';
import { AppContext, AppContextType, Customer, Invoice, InvoiceLineItem, InvoiceStatus, ServiceOrder } from '../src/types';
import { X, PlusCircle, Trash2, Pencil, Save, User, UserPlus, CheckCircle, Loader2 } from 'lucide-react';
import { InvoiceItemModal } from './InvoiceItemModal';
import { RecordPaymentModal } from './RecordPaymentModal';
import { CustomerFormModal } from './CustomerFormModal';
import { formatCurrency } from '../src/utils';


export const InvoiceFormModal: React.FC = () => {
    const {
        customers,
        addInvoice,
        updateInvoice,
        orderToConvertToInvoice,
        staff,
        quoteToConvertToInvoice,
        invoiceMode,
        setMode,
        invoiceToEdit,
        invoiceToDuplicate,
        setOrderToConvertToInvoice,
        setQuoteToConvertToInvoice,
        setInvoiceToEdit,
        setInvoiceToDuplicate,
        addCustomer,
        updateCustomer,
        setGlobalSuccess,
    } = useContext(AppContext) as AppContextType;
    
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [date, setDate] = useState(new Date());
    const [items, setItems] = useState<InvoiceLineItem[]>([]);
    const [discount, setDiscount] = useState(0);
    const [serviceOrderDescription, setServiceOrderDescription] = useState('');
    const [isTaxable, setIsTaxable] = useState(true);

    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<InvoiceLineItem | null>(null);
    const [invoiceToPay, setInvoiceToPay] = useState<Invoice | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number | null>(null);


    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
    const [isEditingCustomer, setIsEditingCustomer] = useState(false);
    const [customerSuccess, setCustomerSuccess] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    const onClose = () => {
        setMode('facturacion');
        setOrderToConvertToInvoice(null);
        setQuoteToConvertToInvoice(null);
        setInvoiceToEdit(null);
        setInvoiceToDuplicate(null);
    };
    
    const resetForm = useCallback(() => {
        setCustomer(null);
        setDate(new Date());
        setItems([]);
        setDiscount(0);
        setCustomerSearchQuery('');
        setServiceOrderDescription('');
        setIsTaxable(true);
    }, []);

    useEffect(() => {
        if (invoiceToEdit) {
            const existingCustomer = customers.find(c => c.id === invoiceToEdit.customerId);
            setCustomer(existingCustomer || null);
            setCustomerSearchQuery(existingCustomer?.name || '');
            setDate(new Date(invoiceToEdit.date));
            setItems(invoiceToEdit.items);
            setDiscount(invoiceToEdit.discount);
            setServiceOrderDescription(invoiceToEdit.serviceOrderDescription || '');
            setIsTaxable(invoiceToEdit.isTaxable ?? true);
        } else if (invoiceToDuplicate) {
            const existingCustomer = customers.find(c => c.id === invoiceToDuplicate.customerId);
            setCustomer(existingCustomer || null);
            setCustomerSearchQuery(existingCustomer?.name || '');
            setDate(new Date());
            setItems(invoiceToDuplicate.items.map(item => ({ ...item, id: `item-${Date.now()}-${Math.random()}` })));
            setDiscount(invoiceToDuplicate.discount);
            setServiceOrderDescription(invoiceToDuplicate.serviceOrderDescription || '');
            setIsTaxable(invoiceToDuplicate.isTaxable ?? true);
        } else if (orderToConvertToInvoice) {
            const existingCustomer = customers.find(c => c.id === orderToConvertToInvoice.customerId);
            setCustomer(existingCustomer || null);
            setCustomerSearchQuery(existingCustomer?.name || '');
            setServiceOrderDescription(`${orderToConvertToInvoice.applianceType}: ${orderToConvertToInvoice.issueDescription}`);
            setItems([]);
            setDate(new Date());
            setDiscount(0);
            setIsTaxable(true);
        } else if (quoteToConvertToInvoice) {
            const existingCustomer = customers.find(c => c.id === quoteToConvertToInvoice.customerId);
            setCustomer(existingCustomer || null);
            setCustomerSearchQuery(existingCustomer?.name || '');
            setItems(quoteToConvertToInvoice.items.map(item => ({ ...item, id: `item-${Date.now()}-${Math.random()}` })));
            setDate(new Date());
            setDiscount(quoteToConvertToInvoice.discount);
            setIsTaxable(quoteToConvertToInvoice.isTaxable ?? true);
        }
        else {
            resetForm();
        }
    }, [invoiceToEdit, invoiceToDuplicate, orderToConvertToInvoice, quoteToConvertToInvoice, customers, resetForm]);
    
     useEffect(() => {
        if (customerSearchQuery.trim()) {
          const lowercasedQuery = customerSearchQuery.toLowerCase().trim();
          const searchPhone = customerSearchQuery.replace(/\D/g, '');
          const filtered = customers.filter(c =>
            c.name.toLowerCase().includes(lowercasedQuery) ||
            (searchPhone.length >= 3 && c.phone.replace(/\D/g, '').includes(searchPhone))
          ).slice(0, 15);
          setCustomerSearchResults(filtered);
        } else {
          setCustomerSearchResults([]);
        }
    }, [customerSearchQuery, customers]);
    
    const handleCustomerSelect = (selectedCustomer: Customer) => {
        setCustomer(selectedCustomer);
        setCustomerSearchQuery(selectedCustomer.name);
        setCustomerSearchResults([]);
        setIsSearchFocused(false);
    };

    const handleCreateCustomer = async (customerData: Omit<Customer, 'id' | 'serviceHistory'>) => {
        const newCustomer = await addCustomer(customerData);
        if (newCustomer) {
            setCustomer(newCustomer);
            setCustomerSearchQuery(newCustomer.name);
            setCustomerSuccess('Cliente creado exitosamente.');
            setTimeout(() => setCustomerSuccess(null), 3000);
        }
        setIsCreatingCustomer(false);
    };

    const handleEditCustomer = async (customerData: Omit<Customer, 'id' | 'serviceHistory'>) => {
        if (customer) {
            await updateCustomer(customer.id, customerData);
            const updatedCustomer = { ...customer, ...customerData };
            setCustomer(updatedCustomer);
            setCustomerSearchQuery(updatedCustomer.name);
            setCustomerSuccess('Cliente actualizado exitosamente.');
            setTimeout(() => setCustomerSuccess(null), 3000);
        }
        setIsEditingCustomer(false);
    };

    const handleSaveItem = (item: InvoiceLineItem) => {
        if (itemToEdit) {
            setItems(prev => prev.map(i => i.id === item.id ? item : i));
        } else {
            setItems(prev => [...prev, { ...item, id: `item-${Date.now()}` }]);
        }
        setIsItemModalOpen(false);
        setItemToEdit(null);
    };

    const handleEditItem = (item: InvoiceLineItem) => {
        setItemToEdit(item);
        setIsItemModalOpen(true);
    };

    const handleRemoveItem = (itemId: string) => {
        setItems(prev => prev.filter(i => i.id !== itemId));
    };

    const subtotal = items.reduce((acc, item) => acc + (item.sellPrice * item.quantity), 0);
    const discountAmount = subtotal * (discount / 100);
    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxes = isTaxable ? subtotalAfterDiscount * 0.18 : 0;
    const total = subtotalAfterDiscount + taxes;
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customer) {
            alert("Por favor, selecciona un cliente.");
            return;
        }

        if (total <= 0) {
            alert("No se puede generar una factura con un total de cero o menos.");
            return;
        }

        setIsSaving(true);
        try {
            const invoiceData = {
                customerId: customer.id,
                date,
                items,
                discount,
                isTaxable,
                status: 'Emitida' as InvoiceStatus,
                serviceOrderId: (invoiceToEdit || invoiceToDuplicate) ? undefined : orderToConvertToInvoice?.id,
                serviceOrderDescription
            };

            let savedInvoiceId: string;
            if (invoiceToEdit) {
                await updateInvoice(invoiceToEdit.id, invoiceData);
                savedInvoiceId = invoiceToEdit.id;
                setGlobalSuccess('Factura actualizada exitosamente.');
            } else {
                savedInvoiceId = await addInvoice(invoiceData);
                setGlobalSuccess('Factura creada exitosamente.');
            }

            const finalInvoice: Invoice = {
                ...invoiceData,
                id: savedInvoiceId,
                invoiceNumber: '', // Placeholder
                subtotal,
                taxes,
                total,
                payments: invoiceToEdit ? invoiceToEdit.payments : [],
                paidAmount: invoiceToEdit ? invoiceToEdit.paidAmount : 0,
            };

            if (invoiceMode === 'advance') {
                setPaymentAmount(total * 0.5);
            } else {
                setPaymentAmount(total);
            }

            setInvoiceToPay(finalInvoice);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <div className="bg-slate-50 min-h-full p-4 sm:p-6 lg:p-8">
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg">
                    <header className="flex justify-between items-center pb-4 border-b mb-6">
                        <h2 className="text-2xl font-bold text-slate-800">{invoiceToEdit ? 'Editar Factura' : invoiceToDuplicate ? 'Duplicar Factura' : 'Crear Nueva Factura'}</h2>
                        <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800"><X size={24} /></button>
                    </header>
                    
                    <main className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                            <div className="md:col-span-3 space-y-4">
                                <h3 className="text-lg font-semibold text-slate-600 border-b pb-2">Información del Cliente</h3>
                                {customerSuccess && (
                                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 rounded-md flex items-center gap-2" role="alert">
                                        <CheckCircle className="h-4 w-4"/>
                                        <p className="text-sm font-medium">{customerSuccess}</p>
                                    </div>
                                )}
                                <div className="relative">
                                    <label className="label-style">Cliente</label>
                                    <input
                                        type="text"
                                        value={customerSearchQuery}
                                        onChange={(e) => {
                                            setCustomerSearchQuery(e.target.value);
                                            setCustomer(null);
                                            setIsSearchFocused(true);
                                        }}
                                        onFocus={() => setIsSearchFocused(true)}
                                        onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                        placeholder="Buscar cliente..."
                                        className="mt-1 input-style"
                                    />
                                    {isSearchFocused && customerSearchQuery.trim() && !customer && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                            {customerSearchResults.length > 0 ? (
                                                customerSearchResults.map(c => (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        onMouseDown={() => handleCustomerSelect(c)}
                                                        className="w-full text-left p-2 hover:bg-sky-100 border-b last:border-b-0"
                                                    >
                                                        <div className="font-medium">{c.name}</div>
                                                        <div className="text-xs text-slate-500">{c.phone}</div>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="p-3">
                                                    <p className="text-sm text-slate-500 mb-2">No se encontraron clientes con "{customerSearchQuery}"</p>
                                                    <button
                                                        type="button"
                                                        onMouseDown={() => setIsCreatingCustomer(true)}
                                                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700"
                                                    >
                                                        <UserPlus size={16} />
                                                        Crear Nuevo Cliente
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {customer && (
                                    <div className="p-3 bg-slate-50 border rounded-md text-sm text-slate-600">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="font-semibold text-slate-800 flex items-center gap-2"><User size={14}/> {customer.name}</p>
                                            <button
                                                type="button"
                                                onClick={() => setIsEditingCustomer(true)}
                                                className="text-sky-600 hover:text-sky-800 flex items-center gap-1 text-xs"
                                            >
                                                <Pencil size={12} />
                                                Editar
                                            </button>
                                        </div>
                                        <p><strong>Tel:</strong> {customer.phone}</p>
                                        <p><strong>Dir:</strong> {customer.address}</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="md:col-span-2 space-y-4">
                                <h3 className="text-lg font-semibold text-slate-600 border-b pb-2">Opciones</h3>
                                <div>
                                    <label className="label-style">Fecha de Factura</label>
                                    <input type="date" value={date.toISOString().split('T')[0]} readOnly disabled className="mt-1 input-style"/>
                                </div>
                                <div>
                                    <label htmlFor="discount-percent" className="label-style">Descuento (%)</label>
                                    <input
                                        type="number"
                                        id="discount-percent"
                                        value={discount || ''}
                                        onChange={e => setDiscount(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                        onFocus={e => e.target.select()}
                                        className="mt-1 input-style text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        min="0"
                                        max="100"
                                        step="any"
                                    />
                                </div>
                            </div>
                        </div>

                        {serviceOrderDescription && (
                            <div>
                                <label className="label-style">Descripción del Servicio (Falla Reportada)</label>
                                <textarea
                                value={serviceOrderDescription}
                                onChange={(e) => setServiceOrderDescription(e.target.value)}
                                rows={2}
                                className="mt-1 input-style"
                                />
                            </div>
                        )}

                        <div className="border rounded-lg">
                            <div className="flex justify-between items-center p-3 bg-slate-50 border-b">
                                <h3 className="font-semibold text-slate-700">Detalles</h3>
                                <button type="button" onClick={() => { setItemToEdit(null); setIsItemModalOpen(true); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700">
                                    <PlusCircle size={14} /> Agregar
                                </button>
                            </div>
                            <div className="max-h-60 overflow-y-auto overflow-x-auto -mx-4 sm:mx-0">
                                <table className="w-full text-sm min-w-[650px]">
                                    <thead className="bg-slate-100">
                                        <tr className="border-b">
                                            <th className="p-2 text-left font-medium text-slate-500">Cant.</th>
                                            <th className="p-2 text-left font-medium text-slate-500">Descripción</th>
                                            <th className="p-2 text-left font-medium text-slate-500">Técnico</th>
                                            <th className="p-2 text-right font-medium text-slate-500">Precio</th>
                                            <th className="p-2 text-right font-medium text-slate-500">Total</th>
                                            <th className="p-2 text-center font-medium text-slate-500"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map(item => (
                                            <tr key={item.id} className="border-b last:border-b-0 hover:bg-slate-50">
                                                <td className="p-2">{item.quantity}</td>
                                                <td className="p-2">{item.description}</td>
                                                <td className="p-2 text-slate-500 text-xs">{item.commission?.technicianId ? staff.find(s=>s.id === item.commission?.technicianId)?.name : 'N/A'}</td>
                                                <td className="p-2 text-right whitespace-nowrap">RD$ {formatCurrency(item.sellPrice)}</td>
                                                <td className="p-2 text-right font-medium whitespace-nowrap">RD$ {formatCurrency(item.sellPrice * item.quantity)}</td>
                                                <td className="p-2">
                                                    <div className="flex justify-center gap-1">
                                                        <button type="button" onClick={() => handleEditItem(item)} className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-500 hover:text-sky-600"><Pencil size={16}/></button>
                                                        <button type="button" onClick={() => handleRemoveItem(item.id)} className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-500 hover:text-red-600"><Trash2 size={16}/></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {items.length === 0 && <p className="text-center p-8 text-slate-400">Añade productos o servicios a la factura.</p>}
                            </div>
                        </div>
                    </main>
                    
                    <footer className="flex flex-col md:flex-row justify-between items-start gap-6 pt-6 mt-6 border-t">
                        <div className="w-full md:w-auto flex flex-col sm:flex-row justify-end gap-4">
                            <button type="button" onClick={onClose} disabled={isSaving} className="px-5 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed">Salir</button>
                            <button type="submit" disabled={isSaving} className="px-5 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                                {isSaving ? 'Guardando...' : 'Finalizar y Pagar'}
                            </button>
                        </div>
                        <div className="w-full md:w-auto md:flex-grow flex justify-end">
                            <div className="w-full max-w-sm space-y-2 text-sm">
                                <div className="flex justify-between"><span>SubTotal:</span> <span>RD$ {formatCurrency(subtotal)}</span></div>
                                <div className="flex justify-between">
                                    <span>Descuento ({discount.toFixed(2)}%):</span>
                                    <span>- RD$ {formatCurrency(discountAmount)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <label htmlFor="invoice-isTaxable" className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" id="invoice-isTaxable" checked={isTaxable} onChange={e => setIsTaxable(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"/>
                                        <span>ITBIS ({isTaxable ? '18%' : '0%'}):</span>
                                    </label>
                                    <span>RD$ {formatCurrency(taxes)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2 text-slate-800"><span>Total General:</span> <span>RD$ {formatCurrency(total)}</span></div>
                            </div>
                        </div>
                    </footer>
                </form>
            </div>
            {isItemModalOpen && (
                <InvoiceItemModal
                    isOpen={isItemModalOpen}
                    onClose={() => { setIsItemModalOpen(false); setItemToEdit(null); }}
                    onSave={handleSaveItem}
                    itemToEdit={itemToEdit}
                />
            )}
            {invoiceToPay && (
                <RecordPaymentModal
                    isOpen={!!invoiceToPay}
                    onClose={() => {
                        setInvoiceToPay(null);
                        onClose();
                    }}
                    invoice={invoiceToPay}
                    initialAmount={paymentAmount ?? undefined}
                />
            )}
            <CustomerFormModal
                isOpen={isCreatingCustomer || isEditingCustomer}
                onClose={() => {
                    setIsCreatingCustomer(false);
                    setIsEditingCustomer(false);
                }}
                onSave={isEditingCustomer ? handleEditCustomer : handleCreateCustomer}
                customerToEdit={isEditingCustomer ? customer : null}
            />
             <style>{`.input-style { color: #0f172a; display: block; width: 100%; padding: 0.5rem 0.75rem; background-color: white; border: 1px solid #cbd5e1; border-radius: 0.375rem; box-shadow: sm; placeholder-slate-400; focus:outline-none focus:ring-sky-500 focus:border-sky-500; } .input-style:disabled, .input-style:read-only { background-color: #f1f5f9; cursor: not-allowed; } .label-style { display: block; font-weight: 500; font-size: 0.875rem; color: #334155; }`}</style>
        </>
    );
};
