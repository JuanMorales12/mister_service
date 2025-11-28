
import React, { useState, useContext, useMemo, useRef, useEffect } from 'react';
import { AppContext, AppContextType, ServiceOrderStatus, ServiceOrder } from '../src/types';
import { ChevronLeft, ChevronRight, User, Calendar as CalendarIcon, ArrowLeft } from 'lucide-react';
import { ServiceOrderDetailsModal } from './ServiceOrderDetailsModal';
import { CreateAppointmentModal } from './CreateAppointmentModal';

type ViewMode = 'day' | 'week' | 'month';

const statusColors: Record<ServiceOrderStatus, { bg: string; border: string; text: string; }> = {
    Pendiente: { bg: 'bg-amber-500', border: 'border-amber-700', text: 'text-white' },
    'En Proceso': { bg: 'bg-green-500', border: 'border-green-700', text: 'text-white' },
    Completado: { bg: 'bg-sky-500', border: 'border-sky-700', text: 'text-white' },
    Cancelado: { bg: 'bg-slate-400', border: 'border-slate-600', text: 'text-white' },
    'Por Confirmar': { bg: 'bg-indigo-500', border: 'border-indigo-700', text: 'text-white' },
    Garantía: { bg: 'bg-red-500', border: 'border-red-700', text: 'text-white' },
    'No Agendado': { bg: 'bg-slate-500', border: 'border-slate-700', text: 'text-white' },
};

export const TechnicianCalendarView: React.FC = () => {
    const { staff, serviceOrders, calendars, currentUser, setMode } = useContext(AppContext) as AppContextType;

    const [selectedTechId, setSelectedTechId] = useState<string>('');
    const [viewMode, setViewMode] = useState<ViewMode>('week');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [initialAppointmentData, setInitialAppointmentData] = useState<{ calendarId: string; start: Date } | null>(null);
    const datePickerRef = useRef<HTMLInputElement>(null);

    const canSelectTechnician = currentUser?.role === 'administrador' || currentUser?.role === 'secretaria';

    const assignableStaff = useMemo(() => staff.filter(s => {
        if (!['tecnico', 'coordinador', 'administrador'].includes(s.role)) return false;
        const cal = calendars.find(c => c.id === s.calendarId);
        return cal?.active;
    }), [staff, calendars]);

    useEffect(() => {
        if (canSelectTechnician) {
            if (!selectedTechId && assignableStaff.length > 0) {
                setSelectedTechId(assignableStaff[0].id);
            }
        } else {
            if (currentUser) {
                setSelectedTechId(currentUser.id);
            }
        }
    }, [canSelectTechnician, currentUser, assignableStaff, selectedTechId]);

    const displayedTechId = selectedTechId;

    const { dateRange, gridDates } = useMemo(() => {
        const d = new Date(currentDate);
        if (viewMode === 'day') {
            return {
                dateRange: [d, d],
                gridDates: [d]
            };
        }
        if (viewMode === 'week') {
            const first = d.getDate() - d.getDay(); // Start week on Sunday
            const firstDay = new Date(d.setDate(first));
            const dates = [];
            for (let i = 0; i < 7; i++) {
                const day = new Date(firstDay);
                day.setDate(day.getDate() + i);
                dates.push(day);
            }
            const lastDay = dates[6];
            return { dateRange: [firstDay, lastDay], gridDates: dates };
        }
        // Month view
        const year = d.getFullYear();
        const month = d.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        
        const firstDayOfGrid = new Date(firstDayOfMonth);
        firstDayOfGrid.setDate(firstDayOfGrid.getDate() - firstDayOfGrid.getDay());
        
        const dates = [];
        let lastDayOfGrid: Date | null = null;
        for (let i = 0; i < 42; i++) { // 6 weeks grid
            const day = new Date(firstDayOfGrid);
            day.setDate(day.getDate() + i);
            dates.push(day);
            if (i === 41) lastDayOfGrid = day;
        }
        return { dateRange: [firstDayOfGrid, lastDayOfGrid!], gridDates: dates };
    }, [currentDate, viewMode]);

    const filteredOrders = useMemo(() => {
        if (!displayedTechId) return [];
        const tech = staff.find(t => t.id === displayedTechId);
        if (!tech) return [];
        
        const techCalendar = calendars.find(c => c.userId === tech.id);
        if(!techCalendar) return [];

        const rangeStart = new Date(dateRange[0]);
        rangeStart.setHours(0,0,0,0);
        const rangeEnd = new Date(dateRange[1]);
        rangeEnd.setHours(23,59,59,999);
        
        return serviceOrders.filter(order => order.calendarId === techCalendar.id && order.start && new Date(order.start) >= rangeStart && new Date(order.start) <= rangeEnd);
    }, [displayedTechId, dateRange, serviceOrders, staff, calendars]);
    
    const timeSlots = useMemo(() => {
        if (!displayedTechId) return [];
        const techCalendar = calendars.find(c => c.userId === displayedTechId);
        if (!techCalendar?.availability) return [];
        
        const allSlots = new Set<string>();
        techCalendar.availability.forEach(day => {
            day.slots.forEach(slot => {
                allSlots.add(slot.startTime);
            });
        });
        
        return Array.from(allSlots).sort((a,b) => a.localeCompare(b));
    }, [displayedTechId, calendars]);


    const handlePrev = () => {
        const d = new Date(currentDate);
        if (viewMode === 'day') d.setDate(d.getDate() - 1);
        if (viewMode === 'week') d.setDate(d.getDate() - 7);
        if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
        setCurrentDate(d);
    };

    const handleNext = () => {
        const d = new Date(currentDate);
        if (viewMode === 'day') d.setDate(d.getDate() + 1);
        if (viewMode === 'week') d.setDate(d.getDate() + 7);
        if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
        setCurrentDate(d);
    };

    const handleToday = () => setCurrentDate(new Date());
    
    const handleGridClick = (date: Date, time: string) => {
        if (!displayedTechId) {
             alert('Por favor, selecciona un técnico primero.');
             return;
        }
        const tech = assignableStaff.find(t => t.id === displayedTechId);
        const techCalendar = calendars.find(c => c.userId === tech?.id);
        if (!tech || !techCalendar) return;

        const isOccupied = filteredOrders.some(o => 
            o.start &&
            o.status !== 'Cancelado' &&
            new Date(o.start).toDateString() === date.toDateString() &&
            o.start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) === time
        );
        if (isOccupied) return;


        const [hour, minute] = time.split(':').map(Number);
        const appointmentStart = new Date(date);
        appointmentStart.setHours(hour, minute, 0, 0);

        setInitialAppointmentData({
            calendarId: techCalendar.id,
            start: appointmentStart
        });
        setIsCreateModalOpen(true);
    };

    const getFormattedHeaderDate = () => {
        if (viewMode === 'day') return currentDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        if (viewMode === 'week') {
            const start = dateRange[0].toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
            const end = dateRange[1].toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' });
            return `${start} - ${end}`;
        }
        return currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    };


    return (
        <div>
            <button onClick={() => setMode('my-orders')} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 mb-6">
                <ArrowLeft size={16} />
                <span>Volver al Inicio</span>
            </button>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md flex flex-col h-[85vh]">
                <header className="flex flex-wrap flex-col sm:flex-row justify-between items-center gap-4 mb-4 pb-4 border-b flex-shrink-0">
                    {canSelectTechnician ? (
                        <div className="flex-1 w-full sm:w-auto">
                            <label htmlFor="tech-select-cal" className="block text-sm font-medium text-slate-700 mb-1">Personal</label>
                            <select id="tech-select-cal" value={selectedTechId} onChange={e => setSelectedTechId(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md bg-white shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500">
                                {assignableStaff.map(tech => <option key={tech.id} value={tech.id}>{tech.name}</option>)}
                            </select>
                        </div>
                    ) : (
                        <div className="flex-1 w-full sm:w-auto">
                            <h3 className="text-xl font-bold text-slate-700">Mi Calendario</h3>
                            <p className="text-sm text-slate-500">{currentUser?.name}</p>
                        </div>
                    )}
                    <div className="flex items-center gap-4">
                         <button onClick={handlePrev} className="p-2 rounded-full hover:bg-slate-100"><ChevronLeft size={20} /></button>
                         <button onClick={handleToday} className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-slate-50">Hoy</button>
                         <button onClick={handleNext} className="p-2 rounded-full hover:bg-slate-100"><ChevronRight size={20} /></button>
                    </div>
                     <div className="relative text-center">
                        <h2 
                            className="text-lg sm:text-xl font-bold text-slate-700 cursor-pointer hover:text-sky-600 transition-colors"
                            onClick={() => datePickerRef.current?.showPicker()}
                            title="Seleccionar fecha"
                        >
                            {getFormattedHeaderDate()}
                        </h2>
                        <input 
                            ref={datePickerRef}
                            type="date"
                            value={currentDate.toISOString().split('T')[0]}
                            onChange={(e) => {
                                const selectedDate = new Date(e.target.value + 'T00:00:00');
                                setCurrentDate(selectedDate);
                            }}
                            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                            aria-label="Seleccionar fecha"
                        />
                    </div>
                    <div className="flex rounded-md shadow-sm">
                        {(['day', 'week', 'month'] as ViewMode[]).map(mode => (
                            <button key={mode} onClick={() => setViewMode(mode)} className={`px-3 py-2 text-sm font-medium border border-slate-300 capitalize ${viewMode === mode ? 'bg-sky-600 text-white border-sky-600' : 'bg-white hover:bg-slate-50'} first:rounded-l-md last:rounded-r-md`}>
                                {mode === 'day' ? 'Día' : mode === 'week' ? 'Semana' : 'Mes'}
                            </button>
                        ))}
                    </div>
                </header>

                {!displayedTechId ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                        <User size={48} className="mb-4" />
                        <h3 className="text-xl font-semibold">Selecciona un miembro del personal</h3>
                        <p>Elige a alguien del menú para ver su calendario.</p>
                    </div>
                ) : (viewMode === 'month') ? (
                     <div className="flex-1 overflow-y-auto bg-white border rounded-md">
                        <div className="grid grid-cols-7 auto-rows-fr">
                            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, index) => (
                                <div key={day} className={`sticky top-0 z-10 bg-slate-100 text-center font-semibold text-xs text-slate-600 py-2 border-b border-slate-200 ${index < 6 ? 'border-r' : ''}`}>
                                    {day}
                                </div>
                            ))}
                            {gridDates.map((date, idx) => {
                                const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                                const isToday = new Date().toDateString() === date.toDateString();
                                const dailyOrders = filteredOrders.filter(o => o.start && new Date(o.start).toDateString() === date.toDateString());
                                
                                return (
                                    <div key={idx} className={`border-b min-h-[8rem] p-1 flex flex-col ${!isCurrentMonth ? 'bg-slate-50' : 'bg-white'} ${(idx + 1) % 7 !== 0 ? 'border-r' : ''}`}>
                                        <p className={`text-xs text-center p-1 rounded-full w-6 h-6 flex items-center justify-center mx-auto mb-1 flex-shrink-0 ${isToday ? 'bg-sky-600 text-white' : ''}`}>
                                            {date.getDate()}
                                        </p>
                                        <div className="space-y-1 overflow-y-auto flex-grow">
                                            {dailyOrders.map(order => {
                                                const isCancelled = order.status === 'Cancelado';
                                                return (
                                                    <div key={order.id} onClick={() => setSelectedOrder(order)} className={`p-1 rounded-sm text-xs truncate cursor-pointer ${statusColors[order.status].bg} ${statusColors[order.status].text} ${isCancelled ? 'line-through opacity-70' : ''}`} title={`${order.customerName} - ${order.applianceType}`}>
                                                        {order.start!.toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})} {order.customerName}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ) : ( // Day or Week view
                    <div className="flex-1 overflow-auto">
                        <div className="flex" style={{minWidth: viewMode === 'week' ? '1200px' : 'auto'}}>
                            {/* Hour labels */}
                            <div className="w-20 shrink-0 text-right">
                                 <div className="h-20 border-b sticky top-0 bg-white z-20">&nbsp;</div> {/* Header space */}
                                {timeSlots.map(time => (
                                    <div key={time} className="h-24 pr-2 text-sm font-medium text-slate-500 border-r flex items-center justify-end">
                                        <span>{time}</span>
                                    </div>
                                ))}
                            </div>
                            {/* Day columns */}
                            <div className="flex-1 grid" style={{gridTemplateColumns: `repeat(${gridDates.length}, minmax(0, 1fr))`}}>
                                {gridDates.map((date, idx) => {
                                    const dailyOrders = filteredOrders.filter(o => o.start && new Date(o.start).toDateString() === date.toDateString());
                                    return (
                                    <div key={idx} className="border-r relative">
                                        <div className="text-center py-2 border-b sticky top-0 bg-white z-10 h-20 flex flex-col justify-center shadow-sm">
                                            <p className="text-xs uppercase text-slate-500">{date.toLocaleDateString('es-ES', { weekday: 'short' })}</p>
                                            <p className={`text-lg font-semibold rounded-full w-8 h-8 flex items-center justify-center mx-auto ${new Date().toDateString() === date.toDateString() ? 'bg-sky-600 text-white' : ''}`}>
                                                {date.getDate()}
                                            </p>
                                        </div>
                                        {/* Time slots for the day */}
                                        <div className="relative">
                                            {timeSlots.map(time => {
                                                const ordersInSlot = dailyOrders.filter(o => {
                                                    if (!o.start) return false;
                                                    const startTime = o.start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                                                    return startTime === time;
                                                });
                                                
                                                return (
                                                    <div 
                                                        key={time} 
                                                        className="h-24 border-b p-1 relative cursor-pointer hover:bg-sky-50"
                                                        onClick={() => handleGridClick(date, time)}
                                                    >
                                                        {ordersInSlot.map(order => {
                                                            const colors = statusColors[order.status] || statusColors.Pendiente;
                                                            const isCancelled = order.status === 'Cancelado';
                                                            return (
                                                            <div 
                                                                key={order.id} 
                                                                onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                                                                className={`p-1.5 rounded-md h-full flex flex-col justify-center ${colors.bg} ${colors.border} border-l-4 ${colors.text} overflow-hidden cursor-pointer ${isCancelled ? 'opacity-70 line-through' : ''}`}
                                                                title={order.customerName}
                                                            >
                                                                <p className="text-xs font-semibold truncate">{order.customerName}</p>
                                                                <p className="text-xs truncate">{order.applianceType}</p>
                                                                <p className="text-xs opacity-90 truncate font-medium">{order.status}</p>
                                                            </div>
                                                        )})}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )})}
                            </div>
                        </div>
                    </div>
                )}
                <ServiceOrderDetailsModal
                    isOpen={!!selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    order={selectedOrder}
                />
                <CreateAppointmentModal 
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSave={() => setIsCreateModalOpen(false)}
                    initialData={initialAppointmentData}
                />
            </div>
        </div>
    );
};
