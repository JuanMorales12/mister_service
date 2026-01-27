
import React, { useContext, useState, useMemo, useEffect, useRef } from 'react';
import { AppContext, AppContextType, Customer } from '../src/types';
import { User, Phone, Mail, MapPin, History, Wrench, Search, PlusCircle, Pencil, Upload, Download, ClipboardList, ArrowLeft } from 'lucide-react';
import { CustomerFormModal } from './CreateCustomerModal';

export const CustomerManagement: React.FC = () => {
    const { customers, serviceOrders, staff, calendars, addCustomer, updateCustomer, loadCustomers, maintenanceSchedules, setMode, currentUser } = useContext(AppContext) as AppContextType;
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (currentUser?.role === 'tecnico') {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <h2 className="text-xl font-bold text-red-600">Acceso Denegado</h2>
                <p className="mt-2 text-slate-600">No tienes permiso para acceder al módulo de clientes.</p>
            </div>
        );
    }

    useEffect(() => {
        if (selectedCustomer) {
            const updatedCustomerInList = customers.find(c => c.id === selectedCustomer.id);
            if (updatedCustomerInList) {
                if (JSON.stringify(selectedCustomer) !== JSON.stringify(updatedCustomerInList)) {
                    setSelectedCustomer(updatedCustomerInList);
                }
            } else {
                setSelectedCustomer(null);
            }
        }
    }, [customers, selectedCustomer]);

    const handleSelectCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
    };

    const handleOpenCreateModal = () => {
        setCustomerToEdit(null);
        setIsModalOpen(true);
    };
    
    const handleOpenEditModal = (customer: Customer) => {
        setCustomerToEdit(customer);
        setIsModalOpen(true);
    };

    const handleSaveCustomer = (customerData: Omit<Customer, 'id' | 'serviceHistory'>) => {
        if (customerToEdit) {
            updateCustomer(customerToEdit.id, customerData);
        } else {
            addCustomer(customerData);
        }
        setIsModalOpen(false);
        setCustomerToEdit(null);
    };

    const getTechnicianName = (calendarId?: string): string => {
        if (!calendarId) return 'No asignado';
        const calendar = calendars.find(c => c.id === calendarId);
        const technician = staff.find(s => s.id === calendar?.userId);
        return technician?.name || 'No asignado';
    };

    const getCustomerServiceHistory = (customerId: string) => {
        return serviceOrders
            .filter(order => order.customerId === customerId)
            .sort((a, b) => {
                const dateA = a.start || a.createdAt;
                const dateB = b.start || b.createdAt;
                return new Date(dateB).getTime() - new Date(dateA).getTime();
            });
    };

    const filteredCustomers = useMemo(() => {
        if (!searchQuery.trim()) {
            return [...customers].sort((a, b) => a.name.localeCompare(b.name));
        }
        
        const lowercasedQuery = searchQuery.toLowerCase();
        const numericQuery = searchQuery.replace(/\D/g, '');

        return customers.filter(customer => {
            const nameMatch = customer.name.toLowerCase().includes(lowercasedQuery);
            const phoneMatch = numericQuery ? customer.phone.replace(/\D/g, '').includes(numericQuery) : false;
            return nameMatch || phoneMatch;
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [customers, searchQuery]);
    
    const customerMaintenanceSchedule = useMemo(() => {
        if (!selectedCustomer) return null;
        return maintenanceSchedules.find(schedule => schedule.customerId === selectedCustomer.id);
    }, [selectedCustomer, maintenanceSchedules]);

    const handleExport = () => {
        if (customers.length === 0) {
            alert("No hay clientes para exportar.");
            return;
        }
        // Exportar como CSV
        const headers = ['Nombre', 'Teléfono', 'Email', 'Dirección', 'RNC'];
        const csvRows = [
            headers.join(','),
            ...customers.map(c => [
                `"${(c.name || '').replace(/"/g, '""')}"`,
                `"${(c.phone || '').replace(/"/g, '""')}"`,
                `"${(c.email || '').replace(/"/g, '""')}"`,
                `"${(c.address || '').replace(/"/g, '""')}"`,
                `"${(c.rnc || '').replace(/"/g, '""')}"`
            ].join(','))
        ];
        const csvContent = csvRows.join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `misterservice_clientes_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("El contenido del archivo no es texto");
                const importedCustomers = JSON.parse(text);
                loadCustomers(importedCustomers);
            } catch (error) {
                console.error('Error al importar clientes:', error);
                alert('Error al importar el archivo. Asegúrate de que es un archivo JSON válido con el formato correcto.');
            } finally {
                // Reset file input value to allow re-uploading the same file
                if(fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        // "YYYY-MM-DD" -> parse as local date to avoid timezone shift
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <div>
            <button onClick={() => setMode('inicio')} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 mb-6">
                <ArrowLeft size={16} />
                <span>Volver al Inicio</span>
            </button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 bg-white p-4 rounded-lg shadow-md">
                     <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" style={{ display: 'none' }} />
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-slate-700">Clientes</h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleImportClick}
                                className="p-2 text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200"
                                title="Importar Clientes"
                            >
                                <Upload size={16} />
                            </button>
                            <button
                                onClick={handleExport}
                                className="p-2 text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200"
                                title="Exportar Clientes"
                            >
                                <Download size={16} />
                            </button>
                            <button
                                onClick={handleOpenCreateModal}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700"
                                title="Crear Nuevo Cliente"
                            >
                                <PlusCircle size={14} />
                                <span>Crear</span>
                            </button>
                        </div>
                    </div>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o teléfono..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-slate-900 placeholder-slate-400"
                        />
                    </div>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                        {filteredCustomers.map(customer => (
                            <button
                                key={customer.id}
                                onClick={() => handleSelectCustomer(customer)}
                                className={`w-full text-left p-3 rounded-md transition-colors ${selectedCustomer?.id === customer.id ? 'bg-sky-100 text-sky-800' : 'hover:bg-slate-50'}`}
                            >
                                <p className="font-semibold text-sm truncate">{customer.name}</p>
                                <p className="text-xs text-slate-500">{customer.phone}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md">
                    {selectedCustomer ? (
                        <div>
                            <div className="flex items-center justify-between gap-4 mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex-shrink-0 bg-sky-100 text-sky-600 rounded-full h-12 w-12 flex items-center justify-center">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-800">{selectedCustomer.name}</h2>
                                        <p className="text-slate-500">Historial del Cliente</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleOpenEditModal(selectedCustomer)}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200"
                                >
                                    <Pencil size={14} />
                                    <span>Editar</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-3">
                                    <h3 className="text-lg font-semibold border-b pb-2 text-slate-600">Contacto</h3>
                                    <div className="flex items-center gap-3">
                                        <Phone size={16} className="text-slate-400" />
                                        <span className="text-sm">{selectedCustomer.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Mail size={16} className="text-slate-400" />
                                        <span className="text-sm">{selectedCustomer.email || 'No proporcionado'}</span>
                                    </div>
                                </div>
                                 <div className="space-y-3">
                                    <h3 className="text-lg font-semibold border-b pb-2 text-slate-600">Ubicación</h3>
                                    <div className="flex items-start gap-3">
                                        <MapPin size={16} className="text-slate-400 mt-1 flex-shrink-0" />
                                        <div className="text-sm">
                                            <p className="break-words">{selectedCustomer.address}</p>
                                             {selectedCustomer.latitude && selectedCustomer.longitude && (
                                                <div className="mt-2 flex gap-2">
                                                    <a href={`https://www.google.com/maps/search/?api=1&query=${selectedCustomer.latitude},${selectedCustomer.longitude}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200">
                                                        Google Maps
                                                    </a>
                                                    <a href={`https://waze.com/ul?ll=${selectedCustomer.latitude},${selectedCustomer.longitude}&navigate=yes`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-cyan-100 text-cyan-700 hover:bg-cyan-200">
                                                        Waze
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-lg font-semibold border-b pb-2 mb-4 text-slate-600 flex items-center gap-3"><ClipboardList size={18}/> Mantenimiento Programado</h3>
                                {customerMaintenanceSchedule ? (
                                    <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                                        <p className="text-sm text-slate-700 font-medium">{customerMaintenanceSchedule.serviceDescription}</p>
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-2 pt-2 border-t border-slate-200">
                                            <div className="text-xs text-slate-500">
                                                <p>Frecuencia: Cada <strong>{customerMaintenanceSchedule.frequencyMonths} meses</strong></p>
                                                <p className="font-medium text-sky-700">Próximo Vencimiento: <strong>{formatDate(customerMaintenanceSchedule.nextDueDate)}</strong></p>
                                            </div>
                                            <button 
                                                onClick={() => setMode('maintenance-schedules')}
                                                className="mt-2 sm:mt-0 px-3 py-1.5 text-xs font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700"
                                            >
                                                Ver Programa
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 text-center py-4">Este cliente no tiene un programa de mantenimiento activo.</p>
                                )}
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold border-b pb-2 mb-4 text-slate-600 flex items-center gap-3"><History size={18}/> Historial de Servicios</h3>
                                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                                    {getCustomerServiceHistory(selectedCustomer.id).length > 0 ? (
                                        getCustomerServiceHistory(selectedCustomer.id).map(order => (
                                            <div key={order.id} className="p-3 bg-slate-50 rounded-md border-l-4 border-sky-500">
                                                <div className="flex justify-between items-start">
                                                    <p className="font-semibold text-sm text-slate-800">
                                                        <span className="font-normal text-slate-500">#{order.serviceOrderNumber}</span> {order.applianceType}
                                                    </p>
                                                    <div className="text-right">
                                                        <span className="text-xs text-slate-500">{order.start ? new Date(order.start).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' }) : order.status}</span>
                                                         <p className="text-xs text-slate-400 mt-1">Creado: {new Date(order.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-slate-600 mt-1">{order.issueDescription}</p>
                                                <div className="text-xs mt-2 pt-2 border-t border-slate-200 text-slate-500 flex items-center gap-2">
                                                    <Wrench size={12}/>
                                                    <span>Técnico: {getTechnicianName(order.calendarId)}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-500 text-center py-4">No hay historial de servicios para este cliente.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                            <User size={48} className="mb-4" />
                            <h3 className="text-xl font-semibold">Selecciona un cliente</h3>
                            <p>Elige un cliente de la lista para ver sus detalles y historial de servicios.</p>
                        </div>
                    )}
                </div>
                 <CustomerFormModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveCustomer}
                    customerToEdit={customerToEdit}
                />
            </div>
        </div>
    );
};
