
import React, { useState, useContext, useEffect } from 'react';
import { AppContext, AppContextType, Product } from '../src/types';
import { X, Save } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit: Product | null;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, productToEdit }) => {
    const { addProduct, updateProduct } = useContext(AppContext) as AppContextType;
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [purchasePrice, setPurchasePrice] = useState(0);
    const [sellPrice1, setSellPrice1] = useState(0);
    const [sellPrice2, setSellPrice2] = useState(0);
    const [sellPrice3, setSellPrice3] = useState(0);
    const [stock, setStock] = useState(0);

    useEffect(() => {
        if (isOpen) {
            if (productToEdit) {
                setCode(productToEdit.code);
                setName(productToEdit.name);
                setPurchasePrice(productToEdit.purchasePrice);
                setSellPrice1(productToEdit.sellPrice1);
                setSellPrice2(productToEdit.sellPrice2);
                setSellPrice3(productToEdit.sellPrice3);
                setStock(productToEdit.stock);
            } else {
                setCode('');
                setName('');
                setPurchasePrice(0);
                setSellPrice1(0);
                setSellPrice2(0);
                setSellPrice3(0);
                setStock(0);
            }
        }
    }, [isOpen, productToEdit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const productData = { 
            code, 
            name, 
            type: 'Inventario' as const,
            purchasePrice, 
            sellPrice1, 
            sellPrice2, 
            sellPrice3, 
            stock 
        };

        if (productToEdit) {
            updateProduct(productToEdit.id, productData);
        } else {
            addProduct(productData);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <header className="flex justify-between items-center pb-4 border-b">
                    <h2 className="text-xl font-bold text-slate-800">{productToEdit ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                    <button type="button" onClick={onClose}><X size={20}/></button>
                </header>
                <main className="py-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-style">Código</label>
                            <input type="text" value={code} onChange={e => setCode(e.target.value)} required className="mt-1 input-style" placeholder="Ej: REF-001"/>
                        </div>
                        <div>
                            <label className="label-style">Stock Inicial</label>
                            <input type="number" value={stock} onChange={e => setStock(parseInt(e.target.value) || 0)} className="mt-1 input-style"/>
                        </div>
                    </div>
                    <div>
                        <label className="label-style">Nombre del Producto</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 input-style" placeholder="Ej: Compresor 1/4 HP"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-style">Costo de Compra</label>
                            <input type="number" value={purchasePrice} onChange={e => setPurchasePrice(parseFloat(e.target.value) || 0)} className="mt-1 input-style" step="0.01"/>
                        </div>
                        <div>
                            <label className="label-style">Precio de Venta (Público)</label>
                            <input type="number" value={sellPrice1} onChange={e => setSellPrice1(parseFloat(e.target.value) || 0)} required className="mt-1 input-style" step="0.01"/>
                        </div>
                         <div>
                            <label className="label-style">Precio Venta 2 (Opcional)</label>
                            <input type="number" value={sellPrice2} onChange={e => setSellPrice2(parseFloat(e.target.value) || 0)} className="mt-1 input-style" step="0.01"/>
                        </div>
                        <div>
                            <label className="label-style">Precio Venta 3 (Opcional)</label>
                            <input type="number" value={sellPrice3} onChange={e => setSellPrice3(parseFloat(e.target.value) || 0)} className="mt-1 input-style" step="0.01"/>
                        </div>
                    </div>
                </main>
                <footer className="flex justify-end gap-4 pt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200">Cancelar</button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-sky-600 text-white hover:bg-sky-700 flex items-center gap-2">
                        <Save size={16}/> Guardar
                    </button>
                </footer>
                <style>{`.input-style { color: #0f172a; display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 0.375rem; } .label-style { display: block; font-medium; color: #334155; font-size: 0.875rem; }`}</style>
            </form>
        </div>
    );
};
