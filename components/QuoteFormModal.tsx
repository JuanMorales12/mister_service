import React, { useState, useContext, useEffect, useCallback } from 'react';
import { AppContext, AppContextType, Customer, Quote, InvoiceLineItem, QuoteStatus } from '../src/types';
import { X, PlusCircle, Trash2, Pencil, Save, User, UserPlus } from 'lucide-react';
import { InvoiceItemModal } from './InvoiceItemModal';
import { CustomerFormModal } from './CustomerFormModal';
import { formatCurrency } from '../src/utils';

interface QuoteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteToEdit: Quote | null;
}

export const QuoteFormModal: React.FC<QuoteFormModalProps> = ({ isOpen, onClose, quoteToEdit }) => {
    const { customers, addQuote, updateQuote, staff, addCustomer } = useContext(AppContext) as AppContextType;
    
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [date, setDate] = useState(new Date());
    const [items, setItems] = useState<InvoiceLineItem[]>([]);
    const [discount, setDiscount] = useState(0);
    const [status, setStatus] = useState<QuoteStatus>('Borrador');
    const [isTaxable, setIsTaxable] = useState(true);

    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<InvoiceLineItem | null>(null);

    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
    
    const resetForm = useCallback(() => {
        setCustomer(null);
        setDate(new Date());
        setItems([]);
        setDiscount(0);
        setStatus('Borrador');
        setCustomerSearchQuery('');
        setIsTaxable(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            if (quoteToEdit) {
                const existingCustomer = customers.find(c => c.id === quoteToEdit.customerId);
                setCustomer(existingCustomer || null);
                setCustomerSearchQuery(existingCustomer?.name || '');
                setDate(new Date(quoteToEdit.date));
                setItems(quoteToEdit.items);
                setDiscount(quoteToEdit.discount);
                setStatus(quoteToEdit.status);
                setIsTaxable(quoteToEdit.isTaxable ?? true);
            } else {
                resetForm();
            }
        }
    }, [isOpen, quoteToEdit, customers, resetForm]);
    
     useEffect(() => {
        if (customerSearchQuery.trim()) {
          const lowercasedQuery = customerSearchQuery.toLowerCase().trim();
          const searchPhone = customerSearchQuery.replace(/\D/g, '');
          const filtered = customers.filter(c =>
            c.name.toLowerCase().includes(lowercasedQuery) ||
            (searchPhone && c.phone.replace(/\D/g, '').includes(searchPhone))
          ).slice(0, 5);
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
        }
        setIsCreatingCustomer(false);
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
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const quoteData = { customerId: customer?.id || '', date, items, discount, status, isTaxable };
        
        if (quoteToEdit) {
            updateQuote(quoteToEdit.id, quoteData);
        } else {
            addQuote(quoteData);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
                <div className="bg-white w-full sm:max-w-4xl h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:m-4 sm:rounded-lg shadow-lg flex flex-col overflow-hidden">
                    <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden">
                        <header className="flex justify-between items-center p-4 sm:p-6 pb-4 border-b bg-white sticky top-0 z-10 flex-shrink-0">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-800">{quoteToEdit ? 'Editar Cotización' : 'Crear Nueva Cotización'}</h2>
                            <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"><X size={20} /></button>
                        </header>
                        <main className="space-y-6 flex-grow overflow-y-auto p-4 sm:p-6 pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                                <div className="md:col-span-3 space-y-4">
                                    <h3 className="text-lg font-semibold text-slate-600 border-b pb-2">Información del Cliente</h3>
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
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold text-slate-800 flex items-center gap-2"><User size={14}/> {customer.name}</p>
                                                    <p><strong>Tel:</strong> {customer.phone}</p>
                                                    <p><strong>Dir:</strong> {customer.address}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => { setCustomer(null); setCustomerSearchQuery(''); }}
                                                    className="text-slate-400 hover:text-red-500"
                                                    title="Cambiar cliente"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="md:col-span-2 space-y-4">
                                    <h3 className="text-lg font-semibold text-slate-600 border-b pb-2">Opciones</h3>
                                    <div>
                                        <label className="label-style">Fecha</label>
                                        <input type="date" value={date.toISOString().split('T')[0]} onChange={e => setDate(new Date(e.target.value))} className="mt-1 input-style"/>
                                    </div>
                                    <div>
                                        <label htmlFor="discount-percent-quote" className="label-style">Descuento (%)</label>
                                        <input
                                            type="number"
                                            id="discount-percent-quote"
                                            value={discount || ''}
                                            onChange={e => setDiscount(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                            onFocus={e => e.target.select()}
                                            className="mt-1 input-style text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            min="0" max="100" step="any"
                                        />
                                    </div>
                                    <div>
                                        <label className="label-style">Estado</label>
                                        <select value={status} onChange={e => setStatus(e.target.value as QuoteStatus)} className="mt-1 input-style">
                                            <option value="Borrador">Borrador</option>
                                            <option value="Enviada">Enviada</option>
                                            <option value="Aceptada">Aceptada</option>
                                            <option value="Rechazada">Rechazada</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="border rounded-lg">
                                <div className="flex justify-between items-center p-3 bg-slate-50 border-b">
                                    <h3 className="font-semibold text-slate-700">Detalles</h3>
                                    <button type="button" onClick={() => { setItemToEdit(null); setIsItemModalOpen(true); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700">
                                        <PlusCircle size={14} /> Agregar
                                    </button>
                                </div>
                                <div className="max-h-60 overflow-y-auto overflow-x-auto -mx-4 sm:mx-0">
                                    <table className="w-full text-sm min-w-[550px]">
                                        <thead className="bg-slate-100">
                                            <tr className="border-b">
                                                <th className="p-2 text-left font-medium text-slate-500">Cant.</th>
                                                <th className="p-2 text-left font-medium text-slate-500">Descripción</th>
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
                                    {items.length === 0 && <p className="text-center p-8 text-slate-400">Añade productos o servicios a la cotización.</p>}
                                </div>
                            </div>
                        </main>
                        <footer className="flex flex-col md:flex-row justify-between items-start gap-4 sm:gap-6 p-4 sm:p-6 border-t bg-slate-50 flex-shrink-0">
                            <div className="w-full md:w-auto flex flex-col sm:flex-row justify-end gap-4">
                                <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300">Cancelar</button>
                                <button type="submit" className="px-5 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 flex items-center justify-center gap-2">
                                    <Save size={16}/> Guardar
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
                                        <label htmlFor="quote-isTaxable" className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" id="quote-isTaxable" checked={isTaxable} onChange={e => setIsTaxable(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"/>
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
            </div>
            {isItemModalOpen && (
                <InvoiceItemModal
                    isOpen={isItemModalOpen}
                    onClose={() => { setIsItemModalOpen(false); setItemToEdit(null); }}
                    onSave={handleSaveItem}
                    itemToEdit={itemToEdit}
                />
            )}
            <CustomerFormModal
                isOpen={isCreatingCustomer}
                onClose={() => setIsCreatingCustomer(false)}
                onSave={handleCreateCustomer}
                customerToEdit={null}
                initialName={customerSearchQuery}
            />
             <style>{`.input-style { color: #0f172a; display: block; width: 100%; padding: 0.5rem 0.75rem; background-color: white; border: 1px solid #cbd5e1; border-radius: 0.375rem; box-shadow: sm; placeholder-slate-400; focus:outline-none focus:ring-sky-500 focus:border-sky-500; } .input-style:disabled, .input-style:read-only { background-color: #f1f5f9; cursor: not-allowed; } .label-style { display: block; font-weight: 500; font-size: 0.875rem; color: #334155; }`}</style>
        </>
    );
};
