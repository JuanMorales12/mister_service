
import React, { useContext, useState, useMemo } from 'react';
import { AppContext, AppContextType, Product } from '../src/types';
import { PlusCircle, Package, Edit, Trash2, Search, ArrowLeft } from 'lucide-react';
import { ProductFormModal } from './ProductFormModal';

export const ProductManagement: React.FC = () => {
    const { products, deleteProduct, setMode } = useContext(AppContext) as AppContextType;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

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

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th className="px-4 py-3">Código</th>
                                <th className="px-4 py-3">Producto</th>
                                <th className="px-4 py-3 text-right">Precio Compra</th>
                                <th className="px-4 py-3 text-right">Precio Venta</th>
                                <th className="px-4 py-3 text-center">Stock</th>
                                <th className="px-4 py-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map(product => (
                                    <tr key={product.id} className="bg-white border-b hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-900">{product.code}</td>
                                        <td className="px-4 py-3">{product.name}</td>
                                        <td className="px-4 py-3 text-right">RD$ {product.purchasePrice.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right">RD$ {product.sellPrice1.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {product.stock}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 flex justify-center gap-2">
                                            <button onClick={() => handleOpenEditModal(product)} className="p-1 text-slate-500 hover:text-sky-600" title="Editar">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(product.id)} className="p-1 text-slate-500 hover:text-red-600" title="Eliminar">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-8">
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
