import React, { useState, useContext, useMemo } from 'react';
import { AppContext, AppContextType, Expense, ExpenseCategory, PaymentMethod } from '../src/types';
import { PlusCircle, Search, Edit, Trash2, ArrowLeft, Receipt } from 'lucide-react';
import { formatCurrency } from '../src/utils';

const expenseCategories: ExpenseCategory[] = ['Nómina', 'Servicios', 'Repuestos', 'Combustible', 'Mantenimiento', 'Alquiler', 'Impuestos', 'Marketing', 'Otros'];
const paymentMethods: PaymentMethod[] = ['Efectivo', 'Transferencia', 'Tarjeta de Crédito', 'Tarjeta de Débito'];

const categoryColors: Record<ExpenseCategory, string> = {
    'Nómina': 'bg-blue-100 text-blue-800',
    'Servicios': 'bg-purple-100 text-purple-800',
    'Repuestos': 'bg-amber-100 text-amber-800',
    'Combustible': 'bg-orange-100 text-orange-800',
    'Mantenimiento': 'bg-teal-100 text-teal-800',
    'Alquiler': 'bg-indigo-100 text-indigo-800',
    'Impuestos': 'bg-red-100 text-red-800',
    'Marketing': 'bg-pink-100 text-pink-800',
    'Otros': 'bg-slate-100 text-slate-800',
};

interface ExpenseFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    expenseToEdit: Expense | null;
}

const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({ isOpen, onClose, expenseToEdit }) => {
    const { addExpense, updateExpense, bankAccounts } = useContext(AppContext) as AppContextType;

    const [date, setDate] = useState(expenseToEdit ? new Date(expenseToEdit.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState<ExpenseCategory>(expenseToEdit?.category || 'Otros');
    const [description, setDescription] = useState(expenseToEdit?.description || '');
    const [amount, setAmount] = useState(expenseToEdit?.amount.toString() || '');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>(expenseToEdit?.paymentMethod || '');
    const [bankAccountId, setBankAccountId] = useState(expenseToEdit?.bankAccountId || '');
    const [supplier, setSupplier] = useState(expenseToEdit?.supplier || '');

    React.useEffect(() => {
        if (isOpen) {
            if (expenseToEdit) {
                setDate(new Date(expenseToEdit.date).toISOString().split('T')[0]);
                setCategory(expenseToEdit.category);
                setDescription(expenseToEdit.description);
                setAmount(expenseToEdit.amount.toString());
                setPaymentMethod(expenseToEdit.paymentMethod || '');
                setBankAccountId(expenseToEdit.bankAccountId || '');
                setSupplier(expenseToEdit.supplier || '');
            } else {
                setDate(new Date().toISOString().split('T')[0]);
                setCategory('Otros');
                setDescription('');
                setAmount('');
                setPaymentMethod('');
                setBankAccountId('');
                setSupplier('');
            }
        }
    }, [isOpen, expenseToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim() || !amount) {
            alert('Por favor, completa los campos obligatorios.');
            return;
        }

        const expenseData = {
            date: new Date(date + 'T12:00:00'),
            category,
            description: description.trim(),
            amount: parseFloat(amount) || 0,
            paymentMethod: paymentMethod || undefined,
            bankAccountId: bankAccountId || undefined,
            supplier: supplier.trim() || undefined,
        };

        if (expenseToEdit) {
            await updateExpense(expenseToEdit.id, expenseData);
        } else {
            await addExpense(expenseData);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <h2 className="text-xl font-bold text-slate-800 mb-4">
                    {expenseToEdit ? 'Editar Gasto' : 'Registrar Gasto'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha *</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Categoría *</label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value as ExpenseCategory)}
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                            >
                                {expenseCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Descripción *</label>
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            required
                            placeholder="Ej: Pago de electricidad mes de enero"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Monto (RD$) *</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                required
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Método de Pago</label>
                            <select
                                value={paymentMethod}
                                onChange={e => setPaymentMethod(e.target.value as PaymentMethod | '')}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                            >
                                <option value="">Seleccionar...</option>
                                {paymentMethods.map(method => (
                                    <option key={method} value={method}>{method}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {(paymentMethod === 'Transferencia') && bankAccounts.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Cuenta Bancaria</label>
                            <select
                                value={bankAccountId}
                                onChange={e => setBankAccountId(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                            >
                                <option value="">Seleccionar...</option>
                                {bankAccounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.bankName} - {acc.accountNumber}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor / Beneficiario</label>
                        <input
                            type="text"
                            value={supplier}
                            onChange={e => setSupplier(e.target.value)}
                            placeholder="Nombre del proveedor o beneficiario"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700"
                        >
                            {expenseToEdit ? 'Guardar Cambios' : 'Registrar Gasto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const ExpenseManagement: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) {
        return <div className="p-4 bg-red-50 text-red-700 rounded-md text-sm">Error: El contexto de la app no está disponible.</div>;
    }
    const { expenses, deleteExpense, goHome, bankAccounts } = context;

    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all');
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    const filteredExpenses = useMemo(() => {
        let filtered = [...(expenses || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Filtro por mes
        if (selectedMonth) {
            const [year, month] = selectedMonth.split('-').map(Number);
            filtered = filtered.filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate.getFullYear() === year && expenseDate.getMonth() === month - 1;
            });
        }

        // Filtro por categoría
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(expense => expense.category === categoryFilter);
        }

        // Filtro por búsqueda
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(expense =>
                expense.description.toLowerCase().includes(query) ||
                expense.supplier?.toLowerCase().includes(query) ||
                expense.category.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [expenses, selectedMonth, categoryFilter, searchQuery]);

    const monthlyTotals = useMemo(() => {
        const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
        const byCategory = expenseCategories.map(cat => ({
            category: cat,
            total: filteredExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
        })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

        return { totalAmount, byCategory };
    }, [filteredExpenses]);

    const handleOpenCreate = () => {
        setExpenseToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (expense: Expense) => {
        setExpenseToEdit(expense);
        setIsModalOpen(true);
    };

    const handleDelete = (expense: Expense) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar el gasto "${expense.description}"?`)) {
            deleteExpense(expense.id);
        }
    };

    const getBankAccountName = (bankAccountId?: string) => {
        if (!bankAccountId) return null;
        const account = bankAccounts.find(a => a.id === bankAccountId);
        return account ? `${account.bankName}` : null;
    };

    return (
        <>
            <button onClick={() => goHome()} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 mb-6">
                <ArrowLeft size={16} />
                <span>Volver al Inicio</span>
            </button>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold text-slate-700 flex items-center gap-2">
                        <Receipt className="text-red-500" />
                        Gastos
                    </h2>
                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600"
                    >
                        <PlusCircle size={16} />
                        <span>Registrar Gasto</span>
                    </button>
                </div>

                {/* Filtros */}
                <div className="flex flex-col lg:flex-row gap-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4 flex-1">
                        <div className="relative flex items-center flex-1 min-w-0">
                            <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Buscar gasto..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full h-10 pl-10 pr-4 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-slate-900 text-sm placeholder-slate-400"
                            />
                        </div>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={e => setSelectedMonth(e.target.value)}
                            className="h-10 px-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-slate-900 text-sm sm:w-48"
                        />
                        <select
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value as ExpenseCategory | 'all')}
                            className="h-10 px-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-slate-900 text-sm sm:w-48"
                        >
                            <option value="all">Todas las categorías</option>
                            {expenseCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-md px-4 py-2 flex flex-col justify-center lg:w-48">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Total del Mes</p>
                        <p className="text-xl font-bold text-red-600 text-center">RD$ {formatCurrency(monthlyTotals.totalAmount)}</p>
                    </div>
                </div>

                {/* Resumen por categoría */}
                {monthlyTotals.byCategory.length > 0 && (
                    <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                        <h3 className="text-sm font-semibold text-slate-600 mb-3">Resumen por Categoría</h3>
                        <div className="flex flex-wrap gap-2">
                            {monthlyTotals.byCategory.map(({ category, total }) => (
                                <div key={category} className={`px-3 py-1.5 rounded-md text-sm ${categoryColors[category]}`}>
                                    <span className="font-medium">{category}:</span> RD$ {formatCurrency(total)}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Lista de gastos */}
                <div className="space-y-3">
                    {filteredExpenses.length > 0 ? (
                        filteredExpenses.map(expense => (
                            <div key={expense.id} className="p-4 bg-slate-50 rounded-md border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-semibold text-slate-800">{expense.description}</p>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[expense.category]}`}>
                                            {expense.category}
                                        </span>
                                    </div>
                                    <div className="text-sm text-slate-500 mt-1">
                                        <span>{new Date(expense.date).toLocaleDateString('es-ES')}</span>
                                        {expense.supplier && <span> • {expense.supplier}</span>}
                                        {expense.paymentMethod && <span> • {expense.paymentMethod}</span>}
                                        {getBankAccountName(expense.bankAccountId) && <span> ({getBankAccountName(expense.bankAccountId)})</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className="font-bold text-xl text-red-600">RD$ {formatCurrency(expense.amount)}</p>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleOpenEdit(expense)}
                                            className="p-2 text-slate-500 hover:bg-slate-200 rounded-full"
                                            title="Editar"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(expense)}
                                            className="p-2 text-red-500 bg-red-100 hover:bg-red-200 rounded-full"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-slate-500 py-8">
                            {searchQuery || categoryFilter !== 'all' ? 'No se encontraron gastos con los filtros aplicados.' : 'No hay gastos registrados para este período.'}
                        </p>
                    )}
                </div>
            </div>

            <ExpenseFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                expenseToEdit={expenseToEdit}
            />
        </>
    );
};
