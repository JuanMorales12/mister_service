
import React, { useState, useContext, useEffect } from 'react';
import { AppContext, AppContextType, Product, ProductStatus } from '../src/types';
import { X, Save, AlertCircle } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit: Product | null;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, productToEdit }) => {
    const { addProduct, updateProduct, products } = useContext(AppContext) as AppContextType;
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [purchasePrice, setPurchasePrice] = useState(0);
    const [sellPrice1, setSellPrice1] = useState(0);
    const [sellPrice2, setSellPrice2] = useState(0);
    const [sellPrice3, setSellPrice3] = useState(0);
    const [initialStock, setInitialStock] = useState(0); // Cantidad inicial (fija)
    const [stock, setStock] = useState(0); // Disponible (se reduce con ventas)
    // Nuevos campos
    const [brand, setBrand] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [status, setStatus] = useState<ProductStatus>('Nuevo');
    const [entryDate, setEntryDate] = useState('');
    const [lotOrSerial, setLotOrSerial] = useState('');
    const [supplier, setSupplier] = useState('');
    const [codeError, setCodeError] = useState<string | null>(null);
    const [loadedProductId, setLoadedProductId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (productToEdit) {
                setCode(productToEdit.code);
                setName(productToEdit.name);
                setPurchasePrice(productToEdit.purchasePrice);
                setSellPrice1(productToEdit.sellPrice1);
                setSellPrice2(productToEdit.sellPrice2);
                setSellPrice3(productToEdit.sellPrice3);
                setInitialStock(productToEdit.initialStock ?? productToEdit.stock);
                setStock(productToEdit.stock);
                setBrand(productToEdit.brand || '');
                setDescription(productToEdit.description || '');
                setLocation(productToEdit.location || '');
                setStatus(productToEdit.status || 'Nuevo');
                setEntryDate(productToEdit.entryDate || '');
                setLotOrSerial(productToEdit.lotOrSerial || '');
                setSupplier(productToEdit.supplier || '');
            } else {
                setCode('');
                setName('');
                setPurchasePrice(0);
                setSellPrice1(0);
                setSellPrice2(0);
                setSellPrice3(0);
                setInitialStock(0);
                setStock(0);
                setBrand('');
                setDescription('');
                setLocation('');
                setStatus('Nuevo');
                setEntryDate(new Date().toISOString().split('T')[0]);
                setLotOrSerial('');
                setSupplier('');
            }
            setCodeError(null);
            setLoadedProductId(null);
        }
    }, [isOpen, productToEdit]);

    // Validar código duplicado y ofrecer cargar producto existente
    const handleCodeChange = (newCode: string) => {
        setCode(newCode);
        if (newCode.trim()) {
            const existingProduct = products.find(p =>
                p.code.toLowerCase() === newCode.toLowerCase() &&
                p.id !== productToEdit?.id
            );
            if (existingProduct) {
                setCodeError(`Ya existe un producto con este código: "${existingProduct.name}"`);
            } else {
                setCodeError(null);
            }
        } else {
            setCodeError(null);
        }
    };

    // Cargar datos del producto existente
    const handleLoadExistingProduct = () => {
        const existingProduct = products.find(p =>
            p.code.toLowerCase() === code.toLowerCase() &&
            p.id !== productToEdit?.id
        );
        if (existingProduct) {
            setName(existingProduct.name);
            setPurchasePrice(existingProduct.purchasePrice);
            setSellPrice1(existingProduct.sellPrice1);
            setSellPrice2(existingProduct.sellPrice2);
            setSellPrice3(existingProduct.sellPrice3);
            setInitialStock(existingProduct.initialStock ?? existingProduct.stock);
            setStock(existingProduct.stock);
            setBrand(existingProduct.brand || '');
            setDescription(existingProduct.description || '');
            setLocation(existingProduct.location || '');
            setStatus(existingProduct.status || 'Nuevo');
            setEntryDate(existingProduct.entryDate || new Date().toISOString().split('T')[0]);
            setLotOrSerial(existingProduct.lotOrSerial || '');
            setSupplier(existingProduct.supplier || '');
            setCodeError(null);
            setLoadedProductId(existingProduct.id);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (codeError) {
            alert('Por favor corrige el código duplicado antes de guardar.');
            return;
        }
        // Para producto nuevo: initialStock = stock (cantidad inicial)
        // Para edición: mantener initialStock, solo actualizar stock disponible
        const effectiveInitialStock = productToEdit ? initialStock : stock;

        const productData = {
            code,
            name,
            type: 'Inventario' as const,
            purchasePrice,
            sellPrice1,
            sellPrice2,
            sellPrice3,
            initialStock: effectiveInitialStock,
            stock,
            brand, // Campo obligatorio
            description: description || undefined,
            location: location || undefined,
            status,
            entryDate, // Campo obligatorio
            lotOrSerial: lotOrSerial || undefined,
            supplier: supplier || undefined,
        };

        if (productToEdit) {
            updateProduct(productToEdit.id, productData);
        } else if (loadedProductId) {
            // Si se cargó un producto existente, actualizarlo
            updateProduct(loadedProductId, productData);
        } else {
            addProduct(productData);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            {productToEdit ? 'Editar Producto' : loadedProductId ? 'Editar Producto Existente' : 'Nuevo Producto'}
                        </h2>
                        {loadedProductId && !productToEdit && (
                            <p className="text-xs text-sky-600">Editando producto cargado por código</p>
                        )}
                    </div>
                    <button type="button" onClick={onClose}><X size={20}/></button>
                </header>
                <main className="p-6 space-y-4 overflow-y-auto">
                    {/* Información básica */}
                    <fieldset className="border p-4 rounded-md">
                        <legend className="text-sm font-semibold px-2 text-slate-600">Información Básica</legend>
                        <div className={`grid gap-4 ${productToEdit ? 'grid-cols-3' : 'grid-cols-2'}`}>
                            <div>
                                <label className="label-style">Código *</label>
                                <input type="text" value={code} onChange={e => handleCodeChange(e.target.value)} required className={`mt-1 input-style ${codeError ? 'border-red-500' : ''}`} placeholder="Ej: REF-001"/>
                                {codeError && (
                                    <div className="mt-1">
                                        <p className="text-amber-600 text-xs flex items-center gap-1">
                                            <AlertCircle size={12}/> {codeError}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleLoadExistingProduct}
                                            className="mt-1 text-xs text-sky-600 hover:text-sky-800 underline"
                                        >
                                            Cargar datos del producto existente
                                        </button>
                                    </div>
                                )}
                            </div>
                            {productToEdit ? (
                                <>
                                    <div>
                                        <label className="label-style">Cant. Inicial</label>
                                        <input type="number" value={initialStock || ''} disabled className="mt-1 input-style bg-slate-100 cursor-not-allowed" title="La cantidad inicial no se puede modificar"/>
                                    </div>
                                    <div>
                                        <label className="label-style">Disponible</label>
                                        <input type="number" value={stock || ''} onChange={e => setStock(e.target.value === '' ? 0 : parseInt(e.target.value))} className="mt-1 input-style"/>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <label className="label-style">Cantidad Inicial</label>
                                    <input type="number" value={stock || ''} onChange={e => setStock(e.target.value === '' ? 0 : parseInt(e.target.value))} className="mt-1 input-style" placeholder="Ej: 10"/>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="label-style">Nombre *</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 input-style" placeholder="Ej: Compresor 1/4 HP"/>
                            </div>
                            <div>
                                <label className="label-style">Marca *</label>
                                <input type="text" value={brand} onChange={e => setBrand(e.target.value)} required className="mt-1 input-style" placeholder="Ej: Samsung"/>
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="label-style">Descripción</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="mt-1 input-style" placeholder="Descripción detallada del producto..."/>
                        </div>
                    </fieldset>

                    {/* Precios */}
                    <fieldset className="border p-4 rounded-md">
                        <legend className="text-sm font-semibold px-2 text-slate-600">Precios</legend>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="label-style">Costo Compra</label>
                                <input type="number" value={purchasePrice || ''} onChange={e => setPurchasePrice(e.target.value === '' ? 0 : parseFloat(e.target.value))} className="mt-1 input-style" step="0.01"/>
                            </div>
                            <div>
                                <label className="label-style">Precio Venta 1 *</label>
                                <input type="number" value={sellPrice1 || ''} onChange={e => setSellPrice1(e.target.value === '' ? 0 : parseFloat(e.target.value))} required className="mt-1 input-style" step="0.01"/>
                            </div>
                            <div>
                                <label className="label-style">Precio Venta 2</label>
                                <input type="number" value={sellPrice2 || ''} onChange={e => setSellPrice2(e.target.value === '' ? 0 : parseFloat(e.target.value))} className="mt-1 input-style" step="0.01"/>
                            </div>
                            <div>
                                <label className="label-style">Precio Venta 3</label>
                                <input type="number" value={sellPrice3 || ''} onChange={e => setSellPrice3(e.target.value === '' ? 0 : parseFloat(e.target.value))} className="mt-1 input-style" step="0.01"/>
                            </div>
                        </div>
                    </fieldset>

                    {/* Información adicional */}
                    <fieldset className="border p-4 rounded-md">
                        <legend className="text-sm font-semibold px-2 text-slate-600">Información Adicional</legend>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <label className="label-style">Estado *</label>
                                <select value={status} onChange={e => setStatus(e.target.value as ProductStatus)} required className="mt-1 input-style">
                                    <option value="Nuevo">Nuevo</option>
                                    <option value="Usado">Usado</option>
                                    <option value="Reacondicionado">Reacondicionado</option>
                                </select>
                            </div>
                            <div>
                                <label className="label-style">Fecha Ingreso *</label>
                                <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} required className="mt-1 input-style"/>
                            </div>
                            <div>
                                <label className="label-style">Ubicación</label>
                                <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="mt-1 input-style" placeholder="Ej: Estante A-3"/>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="label-style">Lote / Serie</label>
                                <input type="text" value={lotOrSerial} onChange={e => setLotOrSerial(e.target.value)} className="mt-1 input-style" placeholder="Ej: LOT-2024-001"/>
                            </div>
                            <div>
                                <label className="label-style">Proveedor</label>
                                <input type="text" value={supplier} onChange={e => setSupplier(e.target.value)} className="mt-1 input-style" placeholder="Nombre del proveedor"/>
                            </div>
                        </div>
                    </fieldset>
                </main>
                <footer className="flex justify-end gap-4 p-4 border-t flex-shrink-0 bg-slate-50">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200">Cancelar</button>
                    <button type="submit" disabled={!!codeError} className="px-4 py-2 rounded-md bg-sky-600 text-white hover:bg-sky-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        <Save size={16}/> Guardar
                    </button>
                </footer>
                <style>{`.input-style { color: #0f172a; display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 0.375rem; } .label-style { display: block; font-medium; color: #334155; font-size: 0.875rem; }`}</style>
            </form>
        </div>
    );
};
