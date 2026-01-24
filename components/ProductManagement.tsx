
import React, { useContext, useState, useMemo } from 'react';
import { AppContext, AppContextType, Product } from '../src/types';
import { PlusCircle, Package, Edit, Trash2, Search, ArrowLeft, AlertTriangle } from 'lucide-react';
import { ProductFormModal } from './ProductFormModal';

export const ProductManagement: React.FC = () => {
    const { products, deleteProduct, setMode, invoices } = useContext(AppContext) as AppContextType;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Calcular cantidad reservada por facturas pendientes (no pagadas)
    const getReservedQuantity = (productId: string): number => {
        return invoices
            .filter(inv => inv.status !== 'Pagada' && inv.status !== 'Anulada')
            .reduce((total, inv) => {
                const item = inv.items.find(i => i.productId === productId);
                return total + (item?.quantity || 0);
            }, 0);
    };

    const getAvailableStock = (product: Product): number => {
        const reserved = getReservedQuantity(product.id);
        return Math.max(0, product.stock - reserved);
    };

    const handleOpenCreateModal = () => {
        setProductToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (product: Product) => {
        setProductToEdit(product);
        setIsModalOpen(true);
    };

    const handleDelete = (productId: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            deleteProduct(productId);
        }
    };

    const filteredProducts = useMemo(() => {
        if (!searchQuery.trim()) return products;
        const query = searchQuery.toLowerCase();
        return products.filter(p => 
            p.name.toLowerCase().includes(query) || 
            p.code.toLowerCase().includes(query)
        );
    }, [products, searchQuery]);

    return (
        <>
            <button onClick={() => setMode('inicio')} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 mb-6">
                <ArrowLeft size={16} />
                <span>Volver al Inicio</span>
            </button>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                    <h2 className="text-2xl font-bold text-slate-700 flex items-center gap-2">
                        <Package className="text-sky-600" /> Inventario de Productos
                    </h2>
                     <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-grow">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Buscar por nombre o código..."
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
                            <span>Agregar</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <table className="w-full text-sm text-left text-slate-500 min-w-[800px]">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th className="px-4 py-3">Código</th>
                                <th className="px-4 py-3">Producto</th>
                                <th className="px-4 py-3">Marca</th>
                                <th className="px-4 py-3 text-right">Precio Venta</th>
                                <th className="px-4 py-3 text-center">Stock</th>
                                <th className="px-4 py-3 text-center">Disponible</th>
                                <th className="px-4 py-3 text-center">Estado</th>
                                <th className="px-4 py-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map(product => {
                                    const availableStock = getAvailableStock(product);
                                    const reserved = getReservedQuantity(product.id);
                                    const isLowStock = availableStock <= 5 && availableStock > 0;
                                    return (
                                        <tr key={product.id} className="bg-white border-b hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-900">{product.code}</td>
                                            <td className="px-4 py-3">
                                                <div>{product.name}</div>
                                                {product.supplier && <div className="text-xs text-slate-400">{product.supplier}</div>}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">{product.brand || '-'}</td>
                                            <td className="px-4 py-3 text-right whitespace-nowrap">RD$ {product.sellPrice1.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.stock > 0 ? 'bg-slate-100 text-slate-700' : 'bg-red-100 text-red-800'}`}>
                                                    {product.stock}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        availableStock === 0 ? 'bg-red-100 text-red-800' :
                                                        isLowStock ? 'bg-amber-100 text-amber-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                        {availableStock}
                                                    </span>
                                                    {isLowStock && <AlertTriangle size={14} className="text-amber-500" title="Stock bajo"/>}
                                                </div>
                                                {reserved > 0 && <div className="text-xs text-slate-400 mt-1">({reserved} reserv.)</div>}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    product.status === 'Activo' ? 'bg-green-100 text-green-800' :
                                                    product.status === 'Inactivo' ? 'bg-slate-100 text-slate-600' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {product.status || 'Activo'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => handleOpenEditModal(product)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-sky-600" title="Editar">
                                                        <Edit size={18} />
                                                    </button>
                                                    <button onClick={() => handleDelete(product.id)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-red-600" title="Eliminar">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={8} className="text-center py-8">
                                        {searchQuery ? 'No se encontraron productos.' : 'No hay productos registrados.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <ProductFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                productToEdit={productToEdit}
            />
        </>
    );
};
