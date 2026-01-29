import React, { useState, useContext, useEffect } from 'react';
import { AppContext, AppContextType, Product, ProductType, InvoiceLineItem, Staff } from '../src/types';
import { X, Save } from 'lucide-react';

interface InvoiceItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: InvoiceLineItem) => void;
    itemToEdit: InvoiceLineItem | null;
}

export const InvoiceItemModal: React.FC<InvoiceItemModalProps> = ({ isOpen, onClose, onSave, itemToEdit }) => {
    const { products, staff } = useContext(AppContext) as AppContextType;
    
    const [type, setType] = useState<ProductType>('Inventario');
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [description, setDescription] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [purchasePrice, setPurchasePrice] = useState(0);
    const [sellPrice, setSellPrice] = useState(0);
    const [technicianId, setTechnicianId] = useState<string>('');
    const [commission, setCommission] = useState(0);

    const technicians = staff.filter(s => s.role === 'tecnico' || s.role === 'administrador');

    useEffect(() => {
        if (isOpen) {
            if (itemToEdit) {
                setType(itemToEdit.type);
                setSelectedProductId(itemToEdit.productId || '');
                setDescription(itemToEdit.description);
                setQuantity(itemToEdit.quantity);
                setPurchasePrice(itemToEdit.purchasePrice);
                setSellPrice(itemToEdit.sellPrice);
                setTechnicianId(itemToEdit.commission?.technicianId || '');
                setCommission(itemToEdit.commission?.amount || 0);
            } else {
                // Reset form
                setType('Inventario');
                setSelectedProductId('');
                setDescription('');
                setQuantity(1);
                setPurchasePrice(0);
                setSellPrice(0);
                setTechnicianId('');
                setCommission(0);
            }
        }
    }, [isOpen, itemToEdit]);
    
    const handleProductSelection = (productId: string) => {
        setSelectedProductId(productId);
        if (type === 'Inventario' && productId) {
            const product = products.find(p => p.id === productId);
            if (product) {
                setDescription(product.name);
                setSellPrice(product.sellPrice1);
                setPurchasePrice(product.purchasePrice);
            }
        } else {
            setDescription('');
            setSellPrice(0);
            setPurchasePrice(0);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const newItem: InvoiceLineItem = {
            id: itemToEdit?.id || `item-${Date.now()}`,
            type,
            productId: type === 'Inventario' ? selectedProductId : undefined,
            description,
            quantity,
            purchasePrice,
            sellPrice,
            commission: technicianId ? { technicianId, amount: commission } : undefined,
        };
        onSave(newItem);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-[calc(100vw-2rem)] sm:max-w-lg">
                <header className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold">{itemToEdit ? 'Editar Ítem' : 'Añadir Ítem a la Factura'}</h2>
                    <button type="button" onClick={onClose}><X size={20}/></button>
                </header>
                <main className="p-6 space-y-4">
                    <div>
                        <label className="label-style">Tipo</label>
                        <div className="flex mt-1 rounded-md shadow-sm">
                            <button type="button" onClick={() => setType('Inventario')} className={`flex-1 p-2 border rounded-l-md ${type === 'Inventario' ? 'bg-sky-600 text-white' : 'bg-white hover:bg-slate-50'}`}>Inventario</button>
                            <button type="button" onClick={() => setType('Manual')} className={`flex-1 p-2 border rounded-r-md ${type === 'Manual' ? 'bg-sky-600 text-white' : 'bg-white hover:bg-slate-50'}`}>Manual</button>
                        </div>
                    </div>

                    {type === 'Inventario' ? (
                        <>
                            <div>
                                <label className="label-style">Producto</label>
                                <select value={selectedProductId} onChange={e => handleProductSelection(e.target.value)} className="mt-1 input-style">
                                    <option value="">Seleccionar producto</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
                                </select>
                            </div>
                            {selectedProductId && (
                                <>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <label className="label-style">Descripción</label>
                                            <input type="text" readOnly value={description} className="mt-1 input-style"/>
                                        </div>
                                        {(() => {
                                            const product = products.find(p => p.id === selectedProductId);
                                            if (product) {
                                                const stockClass = product.stock <= 0 ? 'bg-red-100 text-red-800' :
                                                                   product.stock <= 5 ? 'bg-amber-100 text-amber-800' :
                                                                   'bg-green-100 text-green-800';
                                                return (
                                                    <div className="text-center">
                                                        <label className="label-style">Stock</label>
                                                        <div className={`mt-1 px-3 py-2 rounded-md font-bold ${stockClass}`}>
                                                            {product.stock}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                    {(() => {
                                        const product = products.find(p => p.id === selectedProductId);
                                        if (product && quantity > product.stock) {
                                            return (
                                                <p className="text-red-600 text-sm font-medium">
                                                    ⚠️ La cantidad solicitada ({quantity}) excede el stock disponible ({product.stock})
                                                </p>
                                            );
                                        }
                                        return null;
                                    })()}
                                </>
                            )}
                        </>
                    ) : (
                         <div>
                            <label className="label-style">Descripción</label>
                            <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="mt-1 input-style" placeholder="Ej: Pieza usada compresor"/>
                        </div>
                    )}
                    
                     <div>
                        <label className="label-style">Cantidad</label>
                        <input type="number" value={quantity || ''} onChange={e => setQuantity(e.target.value === '' ? 1 : parseInt(e.target.value))} onFocus={e => e.target.select()} className="mt-1 input-style" min="1"/>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-style">Precio Compra</label>
                            <input type="number" value={purchasePrice || ''} onChange={e => setPurchasePrice(e.target.value === '' ? 0 : parseFloat(e.target.value))} onFocus={e => e.target.select()} className="mt-1 input-style" step="0.01"/>
                        </div>
                        <div>
                            <label className="label-style">Precio Venta</label>
                            <input type="number" value={sellPrice || ''} onChange={e => setSellPrice(e.target.value === '' ? 0 : parseFloat(e.target.value))} onFocus={e => e.target.select()} className="mt-1 input-style" step="0.01"/>
                        </div>
                    </div>
                    
                    <div className="border-t pt-4">
                        <h3 className="font-semibold text-slate-600">Comisión (Opcional)</h3>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                             <div>
                                <label className="label-style">Vendedor/Técnico</label>
                                <select value={technicianId} onChange={e => setTechnicianId(e.target.value)} className="mt-1 input-style">
                                    <option value="">Ninguno</option>
                                    {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="label-style">Comisión</label>
                                <input type="number" value={commission || ''} onChange={e => setCommission(e.target.value === '' ? 0 : parseFloat(e.target.value))} onFocus={e => e.target.select()} className="mt-1 input-style" disabled={!technicianId}/>
                            </div>
                        </div>
                    </div>

                </main>
                <footer className="flex justify-end gap-4 p-4 bg-slate-50 border-t">
                    <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300">Cerrar</button>
                    <button type="submit" className="px-5 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 flex items-center gap-2">
                        <Save size={16}/> {itemToEdit ? 'Aceptar' : 'Aceptar'}
                    </button>
                </footer>
                 <style>{`.input-style { color: #0f172a; display: block; width: 100%; padding: 0.5rem 0.75rem; background-color: white; border: 1px solid #cbd5e1; border-radius: 0.375rem; box-shadow: sm; placeholder-slate-400; focus:outline-none focus:ring-sky-500 focus:border-sky-500; } .input-style:read-only, .input-style:disabled { background-color: #f1f5f9; cursor: not-allowed; } .label-style { display: block; font-medium; color: #334155; }`}</style>
            </form>
        </div>
    );
};
