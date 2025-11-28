import React, { useContext, useEffect, useMemo, useState, useRef } from 'react';
import { AppContext, AppContextType, ServiceOrder } from '../src/types';
import { Map, Calendar, Edit, ArrowLeft } from 'lucide-react';
import L from 'leaflet';
import { ServiceOrderDetailsModal } from './ServiceOrderDetailsModal';


// Arregla el problema de la ruta del icono por defecto de Leaflet con los empaquetadores de módulos.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


interface ScheduledCustomer {
    orderId: string;
    calendarId?: string;
    createdById?: string;
    lat: number;
    lng: number;
    title: string;
    address: string;
    time: string;
    customerName: string;
    serviceDescription: string;
}

export const CustomerMapView: React.FC = () => {
    const { customers, serviceOrders, calendars, staff, goHome } = useContext(AppContext) as AppContextType;
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [orderToEdit, setOrderToEdit] = useState<ServiceOrder | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const routeLayersRef = useRef<L.Polyline[]>([]);
    
    const scheduledCustomers = useMemo((): ScheduledCustomer[] => {
        const startOfDay = new Date(`${selectedDate}T00:00:00`);
        const endOfDay = new Date(`${selectedDate}T23:59:59`);

        const todaysOrders = serviceOrders
            .filter(order => {
                if (!order.start) return false;
                const orderDate = new Date(order.start);
                return orderDate >= startOfDay && orderDate <= endOfDay && ['Pendiente', 'En Proceso'].includes(order.status);
            })
            .sort((a, b) => new Date(a.start!).getTime() - new Date(b.start!).getTime());

        const customerData: ScheduledCustomer[] = [];
        todaysOrders.forEach(order => {
            const customer = customers.find(c => c.id === order.customerId);
            if (customer && customer.latitude != null && customer.longitude != null) {
                customerData.push({
                    orderId: order.id,
                    calendarId: order.calendarId,
                    createdById: order.createdById,
                    lat: customer.latitude,
                    lng: customer.longitude,
                    title: order.title,
                    address: customer.address,
                    time: new Date(order.start!).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                    customerName: customer.name,
                    serviceDescription: order.applianceType,
                });
            }
        });
        return customerData;
    }, [selectedDate, customers, serviceOrders]);
    
    const techniciansWithRoutes = useMemo(() => {
        const techIds = new Set(scheduledCustomers.map(c => c.calendarId).filter(Boolean));
        return Array.from(techIds).map(calId => {
            const calendar = calendars.find(c => c.id === calId);
            const technician = staff.find(s => s.id === calendar?.userId);
            return {
                name: technician?.name || 'Desconocido',
                color: calendar?.color || '#3388ff'
            };
        });
    }, [scheduledCustomers, calendars, staff]);

    // Effect for map initialization and cleanup
    useEffect(() => {
        if (mapContainerRef.current && !mapInstanceRef.current) {
            mapInstanceRef.current = L.map(mapContainerRef.current, {
                center: [18.7357, -70.1627],
                zoom: 8,
                scrollWheelZoom: true,
            });
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapInstanceRef.current);
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []); // Only run once on mount

    // Effect for updating markers and routes
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // Clear existing markers and routes
        map.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });
        routeLayersRef.current.forEach(layer => map.removeLayer(layer));
        routeLayersRef.current = [];

        if (scheduledCustomers.length > 0) {
            const points: L.LatLngExpression[] = [];
            const routesByTechnician: Record<string, L.LatLngExpression[]> = {};

            scheduledCustomers.forEach(customer => {
                const point: L.LatLngExpression = [customer.lat, customer.lng];
                points.push(point);
                
                if (customer.calendarId) {
                    if (!routesByTechnician[customer.calendarId]) {
                        routesByTechnician[customer.calendarId] = [];
                    }
                    routesByTechnician[customer.calendarId].push(point);
                }
                
                const technician = staff.find(s => s.calendarId === customer.calendarId);
                const creator = staff.find(s => s.id === customer.createdById);

                const popupContent = `
                    <div style="font-family: sans-serif; font-size: 14px; min-width: 240px;">
                        <h4 style="margin: 0 0 8px 0; font-size: 1.1em; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">${customer.customerName}</h4>
                        <p style="margin: 0 0 5px 0; color: #475569;"><strong>Servicio:</strong> ${customer.serviceDescription}</p>
                        <p style="margin: 0 0 5px 0; color: #475569;"><strong>Hora:</strong> ${customer.time}</p>
                        <p style="margin: 0 0 5px 0; color: #475569;"><strong>Técnico:</strong> ${technician?.name || 'Sin Asignar'}</p>
                        <p style="margin: 0 0 12px 0; color: #475569;"><strong>Responsable:</strong> ${creator?.name || 'Sistema'}</p>
                        <button id="reassign-btn-${customer.orderId}" class="reassign-button">Reasignar Cita</button>
                    </div>
                    <style>
                      .reassign-button {
                        width: 100%; background-color: #0ea5e9; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-size: 0.9em; cursor: pointer; transition: background-color 0.2s;
                      }
                      .reassign-button:hover { background-color: #0284c7; }
                    </style>
                `;

                const marker = L.marker(point)
                    .addTo(map)
                    .bindPopup(popupContent);

                marker.on('popupopen', () => {
                    const btn = document.getElementById(`reassign-btn-${customer.orderId}`);
                    if (btn) {
                        btn.onclick = () => {
                            const order = serviceOrders.find(o => o.id === customer.orderId);
                            if (order) setOrderToEdit(order);
                        };
                    }
                });
            });

            // Draw routes
            Object.keys(routesByTechnician).forEach(calendarId => {
                const routePoints = routesByTechnician[calendarId];
                if (routePoints.length > 1) {
                    const calendar = calendars.find(c => c.id === calendarId);
                    const route = L.polyline(routePoints, { color: calendar?.color || 'blue', weight: 3, opacity: 0.7 });
                    route.addTo(map);
                    routeLayersRef.current.push(route);
                }
            });

            const bounds = L.latLngBounds(points);
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        } else {
            map.setView([18.7357, -70.1627], 8);
        }
    }, [scheduledCustomers, serviceOrders, calendars, staff]);

    return (
        <>
            <button onClick={() => goHome()} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 mb-6">
                <ArrowLeft size={16} />
                <span>Volver al Inicio</span>
            </button>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                    <h2 className="text-2xl font-bold text-slate-700 flex items-center gap-2">
                        <Map className="text-sky-600" /> Distribución de Citas Diarias
                    </h2>
                    <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-md">
                        <label htmlFor="map-date-picker" className="text-sm font-medium text-slate-600 flex items-center gap-1">
                            <Calendar size={16}/>
                            Fecha de Citas:
                        </label>
                        <input
                            type="date"
                            id="map-date-picker"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="p-1 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                    </div>
                </div>
                <div className="relative w-full h-[70vh] bg-slate-200">
                    <div ref={mapContainerRef} className="rounded-md" style={{ height: '100%', width: '100%' }}></div>
                    
                    {techniciansWithRoutes.length > 0 && (
                        <div className="absolute top-2 right-2 bg-white bg-opacity-80 p-2 rounded-md shadow-md z-[1000]">
                            <h4 className="text-xs font-bold border-b pb-1 mb-1">Técnicos del Día</h4>
                            <ul className="space-y-1">
                                {techniciansWithRoutes.map((tech, index) => (
                                    <li key={index} className="flex items-center gap-2 text-xs">
                                        <span className="w-4 h-1 rounded" style={{ backgroundColor: tech.color }}></span>
                                        {tech.name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    {scheduledCustomers.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 pointer-events-none z-[1000]">
                            <p className="text-slate-500 font-semibold p-4 bg-white rounded-lg shadow">No hay citas agendadas con ubicación para este día.</p>
                        </div>
                    )}
                </div>
            </div>
            <ServiceOrderDetailsModal
                isOpen={!!orderToEdit}
                onClose={() => setOrderToEdit(null)}
                order={orderToEdit}
            />
        </>
    );
};