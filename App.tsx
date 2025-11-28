

import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
// FIX: Import new types for invoicing, quotes, products, etc.
// FIX: Added missing ServiceOrder import.
import { AppState, Staff, AppContext, AppMode, Calendar, GoogleAuthState, Customer, DailyAvailability, StaffRole, ServiceOrderStatus, MaintenanceSchedule, AppContextType, ActionLog, WorkshopEquipment, CompanyInfo, SyncedAppState, LocalAppState, Quote, Invoice, ServiceOrder } from './types';
import { GoogleCalendarService } from './services/googleCalendarService';
import { EmailService } from './services/emailService';
import { GOOGLE_CLIENT_ID } from '../config';
import { firebaseService } from './services/firebaseService';
import { Loader2, AlertTriangle, X } from 'lucide-react';
import { User } from 'firebase/auth';
import { LoginPage } from './components/LoginPage';

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

const ErrorBanner: React.FC<{ message: string; onClose: () => void; }> = ({ message, onClose }) => (
  <div className="bg-red-600 text-white text-sm font-semibold p-4 flex justify-between items-center shadow-lg sticky top-[64px] z-[1000]" role="alert">
    <div className="flex items-center gap-3">
      <AlertTriangle size={20} />
      <span>{message}</span>
    </div>
    <button onClick={onClose} aria-label="Cerrar" className="p-1 rounded-full hover:bg-red-700">
      <X size={18} />
    </button>
  </div>
);

const defaultAvailability: DailyAvailability[] = [
    { dayOfWeek: 1, slots: [{ startTime: '09:00', endTime: '10:00' }, { startTime: '11:00', endTime: '12:00' }, { startTime: '13:00', endTime: '14:00' }, { startTime: '15:00', endTime: '16:00' }, { startTime: '17:00', endTime: '18:00' }] },
    { dayOfWeek: 2, slots: [{ startTime: '09:00', endTime: '10:00' }, { startTime: '11:00', endTime: '12:00' }, { startTime: '13:00', endTime: '14:00' }, { startTime: '15:00', endTime: '16:00' }, { startTime: '17:00', endTime: '18:00' }] },
    { dayOfWeek: 3, slots: [{ startTime: '09:00', endTime: '10:00' }, { startTime: '11:00', endTime: '12:00' }, { startTime: '13:00', endTime: '14:00' }, { startTime: '15:00', endTime: '16:00' }, { startTime: '17:00', endTime: '18:00' }] },
    { dayOfWeek: 4, slots: [{ startTime: '09:00', endTime: '10:00' }, { startTime: '11:00', endTime: '12:00' }, { startTime: '13:00', endTime: '14:00' }, { startTime: '15:00', endTime: '16:00' }, { startTime: '17:00', endTime: '18:00' }] },
    { dayOfWeek: 5, slots: [{ startTime: '09:00', endTime: '10:00' }, { startTime: '11:00', endTime: '12:00' }, { startTime: '13:00', endTime: '14:00' }, { startTime: '15:00', endTime: '16:00' }, { startTime: '17:00', endTime: '18:00' }] },
    { dayOfWeek: 6, slots: [] },
    { dayOfWeek: 0, slots: [] },
];

const getInitialSyncedState = (): SyncedAppState => {
    const adminEmail = 'apnbrito@gmail.com';
    const initialStaff: Staff = { id: 's0', name: 'Angelica Brito', email: adminEmail, calendarId: 'c0', role: 'administrador', personalPhone: '18091112233', fleetPhone: '18291112233', idNumber: '001-0012345-1' };
    
    return {
      staff: [initialStaff],
      customers: [],
      calendars: [
        { id: 'c0', name: 'Calendario Admin', userId: 's0', color: '#D50000', availability: defaultAvailability, active: true },
      ],
      serviceOrders: [],
      maintenanceSchedules: [],
      workshopEquipment: [],
      lastServiceOrderNumber: 0,
      companyInfo: {
        name: 'Mister Service RD',
        address: 'Av. Los Próceres #38, Diamond Plaza, Local B3A',
        phone: '829-540-7493',
        whatsapp: '809-203-9601',
        email: 'misterservicerd@gmail.com',
        logoUrl: '',
      },
      // FIX: Add initial state for invoicing-related data
      products: [],
      invoices: [],
      quotes: [],
      bankAccounts: [],
      lastInvoiceNumber: 0,
      lastQuoteNumber: 0,
    }
}

const App: React.FC = () => {
  const [syncedState, setSyncedState] = useState<SyncedAppState | null>(null);
  const [localState, setLocalState] = useState<LocalAppState | null>(null);
  const [authUser, setAuthUser] = useState<User | null | undefined>(undefined); // undefined means loading
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  
  const appState: AppState | null = syncedState && localState ? { ...syncedState, ...localState } : null;

  // Bootstrap effect: runs once on mount to ensure admin and initial data exist.
  useEffect(() => {
    const bootstrapApp = async () => {
        const initialStateInDb = await firebaseService.getInitialState();
        if (!initialStateInDb || !initialStateInDb.staff || initialStateInDb.staff.length === 0) {
            console.log("No existing state in Firebase, bootstrapping admin user and initial data.");
            const initialState = getInitialSyncedState();
            try {
                await firebaseService.bootstrapAdminAndData('apnbrito@gmail.com', 'Angelica12', initialState);
            } catch(e) {
                console.error("Bootstrap failed. The application may not work correctly.", e);
            }
        }
        setIsBootstrapping(false);
    };

    bootstrapApp();
  }, []);

  // Authentication listener, runs after bootstrap is complete.
  useEffect(() => {
    if (isBootstrapping) return;
    const unsubscribe = firebaseService.onAuthStateChanged((user) => {
        setAuthUser(user);
    });
    return () => unsubscribe();
  }, [isBootstrapping]);

  // Data synchronization listener, runs when a user is authenticated.
  useEffect(() => {
    if (!authUser) {
        setSyncedState(null);
        setLocalState(null);
        return;
    }


    let isInitialLoad = true;
    const unsubscribe = firebaseService.listenToStateChanges((newState) => {
        console.log("Firebase state updated, syncing local state.");
        console.log("authUser email:", authUser?.email);
        console.log("staff emails:", newState.staff.map(s => s.email));
        const currentUser = newState.staff.find(s => s.email === authUser?.email) || null;
        if (!currentUser) {
            console.warn("No se encontró el usuario en staff para el email autenticado.");
        }
        setSyncedState(newState);

        if (isInitialLoad) {
            const initialMode: AppMode = currentUser?.role === 'tecnico' ? 'my-orders' : 'inicio';
            setLocalState({
                mode: initialMode,
                googleAuth: { token: null, user: null },
                currentUser: currentUser,
                globalError: null,
                // FIX: Add initial local state for invoicing-related data
                orderToConvertToInvoice: null,
                quoteToConvertToInvoice: null,
                invoiceToEdit: null,
                invoiceToDuplicate: null,
                invoiceToPrint: null,
                invoiceMode: null,
            });
            isInitialLoad = false;
        } else {
             setLocalState(p => p ? ({ ...p, currentUser: currentUser, globalError: p.globalError }) : null);
        }
    });

    return () => unsubscribe();
  }, [authUser]);


  const isGoogleConfigMissing = !GOOGLE_CLIENT_ID;
  let tokenClient: any = null;
  
  const getErrorMessage = (e: any) => {
      let message = "Error al guardar los datos en la nube. Por favor, inténtelo de nuevo.";
      if (e.message.includes("invalid data") || e.message.includes("undefined")) {
          message = "Error: Se intentó guardar un valor no válido (undefined). Revisa los campos del formulario y vuelve a intentarlo.";
      } else {
          message = `Error inesperado: ${e.message}`;
      }
      return message;
  }
  
  // --- LOCAL STATE SETTERS ---
  const setGlobalError = (error: string | null) => setLocalState(prev => prev ? ({ ...prev, globalError: error }) : null);
  const setMode = (mode: AppMode) => {
    setLocalState(prev => prev ? ({ ...prev, mode }) : null);
  };
  const signOut = () => firebaseService.signOut();

  // --- SYNCED STATE SETTERS ---
  const addStaff = async (staffData: Omit<Staff, 'id' | 'calendarId'>, password: string): Promise<void> => {
    if (!syncedState || localState?.currentUser?.role !== 'administrador') {
        throw new Error("Solo los administradores pueden crear nuevos empleados.");
    };
    
    try {
        await firebaseService.createStaffUser(staffData.email, password);
        
        const newStaffId = `s${Date.now()}`;
        const newCalendarId = `c${Date.now()}`;
        const newStaff: Staff = { ...staffData, id: newStaffId, calendarId: newCalendarId };
        const newCalendar: Calendar = {
          id: newCalendarId,
          name: `Agenda de ${staffData.name}`,
          userId: newStaffId,
          color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
          availability: defaultAvailability,
          active: true,
        };
        await firebaseService.saveState({ ...syncedState, staff: [...syncedState.staff, newStaff], calendars: [...syncedState.calendars, newCalendar] });
    } catch (error: any) {
        console.error("Error creating new staff member:", error);
        let userMessage = `Error inesperado al crear empleado: ${error.message}`;
        if (error.code === 'auth/weak-password') {
            userMessage = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
        } else if (error.code === 'auth/email-already-in-use') {
            userMessage = 'El correo electrónico ya está en uso. Por favor, utiliza otro.';
        }
        setGlobalError(userMessage);
    }
  };

  const updateStaff = async (staffId: string, staffData: Omit<Staff, 'id' | 'calendarId' | 'email'>) => {
    if (!syncedState) return;
    try {
        const newState = {
          ...syncedState,
          staff: syncedState.staff.map(s => (s.id === staffId ? { ...s, ...staffData } : s)),
        };
        await firebaseService.saveState(newState);
    } catch (e: any) {
        setGlobalError(getErrorMessage(e));
    }
  };

  const deleteStaff = async (staffId: string) => {
    if (!syncedState || !localState) return;
    try {
        const staffToDelete = syncedState.staff.find(s => s.id === staffId);
        if (!staffToDelete) return;

        const admins = syncedState.staff.filter(s => s.role === 'administrador');
        if (staffToDelete.role === 'administrador' && admins.length === 1) {
            setGlobalError('No se puede eliminar al único administrador del sistema.');
            return;
        }
        
        console.warn(`Deletion of staff '${staffToDelete.email}' from Firebase Auth should be handled by an admin SDK on a server.`);

        const calendarIdToDelete = staffToDelete.calendarId;

        const updatedServiceOrders = syncedState.serviceOrders.map(order => {
          if (order.calendarId === calendarIdToDelete) {
            const { calendarId, ...rest } = order;
            return { ...rest, status: 'Por Confirmar' as ServiceOrderStatus };
          }
          return order;
        });

        const updatedStaff = syncedState.staff.filter(s => s.id !== staffId);
        const updatedCalendars = syncedState.calendars.filter(c => c.id !== calendarIdToDelete);
        
        await firebaseService.saveState({
          ...syncedState,
          staff: updatedStaff,
          calendars: updatedCalendars,
          serviceOrders: updatedServiceOrders,
        });
    } catch (e: any) {
        setGlobalError(getErrorMessage(e));
    }
  };

  const updateStaffRole = async (staffId: string, role: StaffRole) => {
    if (!syncedState) return;
    try {
        const admins = syncedState.staff.filter(s => s.role === 'administrador');
        const targetStaff = syncedState.staff.find(s => s.id === staffId);
        if (admins.length === 1 && targetStaff?.role === 'administrador' && role !== 'administrador') {
            setGlobalError('No se puede cambiar el rol del único administrador.');
            return;
        }
        const newState = {
            ...syncedState,
            staff: syncedState.staff.map(s => s.id === staffId ? { ...s, role } : s),
        };
        await firebaseService.saveState(newState);
    } catch (e: any) {
        setGlobalError(getErrorMessage(e));
    }
  };

  const addCalendar = async (calendarData: Omit<Calendar, 'id' | 'color'>) => {
    if (!syncedState) return;
    try {
        const newCalendar: Calendar = {
          ...calendarData,
          id: `c${Date.now()}`,
          color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
          availability: defaultAvailability,
          active: true,
        };
        await firebaseService.saveState({ ...syncedState, calendars: [...syncedState.calendars, newCalendar] });
    } catch (e: any) {
        setGlobalError(getErrorMessage(e));
    }
  };
  
  const updateCalendar = async (calendarId: string, calendarData: Partial<Omit<Calendar, 'id'>>) => {
    if (!syncedState) return;
    try {
        const newState = {
            ...syncedState,
            calendars: syncedState.calendars.map(c => c.id === calendarId ? { ...c, ...calendarData } : c),
        };
        await firebaseService.saveState(newState);
    } catch (e: any) {
        setGlobalError(getErrorMessage(e));
    }
  };

  const deleteCalendar = async (calendarId: string) => {
    if (!syncedState) return;
    try {
        const isPrimaryCalendar = syncedState.staff.some(s => s.calendarId === calendarId);
        if (isPrimaryCalendar) {
            setGlobalError('No se puede eliminar un calendario que está asignado como principal a un miembro del personal. Primero, gestiona al miembro del personal.');
            return;
        }
        await firebaseService.saveState({
            ...syncedState,
            calendars: syncedState.calendars.filter(c => c.id !== calendarId),
        });
    } catch (e: any) {
        setGlobalError(getErrorMessage(e));
    }
  };

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'serviceHistory' | 'createdById'>) => {
    if (!syncedState || !localState) return;
    try {
        const newCustomer: Customer = { 
            ...customerData, 
            id: `cust${Date.now()}`, 
            serviceHistory: [],
            createdById: localState.currentUser?.id,
        };
        await firebaseService.saveState({ ...syncedState, customers: [...syncedState.customers, newCustomer] });
    } catch (e: any) {
        setGlobalError(getErrorMessage(e));
    }
  };

  const updateCustomer = async (customerId: string, customerData: Omit<Customer, 'id' | 'serviceHistory' | 'createdById'>) => {
    if (!syncedState) return;
    try {
        const newState = {
            ...syncedState,
            customers: syncedState.customers.map(c => c.id === customerId ? { ...c, ...customerData } : c),
        };
        await firebaseService.saveState(newState);
    } catch (e: any) {
        setGlobalError(getErrorMessage(e));
    }
  };

  const loadCustomers = async (customers: Customer[]) => {
    if (!syncedState) return;
    try {
        if (Array.isArray(customers) && customers.every(c => c.id && c.name && c.phone)) {
            await firebaseService.saveState({ ...syncedState, customers });
        } else {
            setGlobalError("El formato del archivo es incorrecto.");
        }
    } catch (e: any) {
        setGlobalError(getErrorMessage(e));
    }
  };

  const addServiceOrder = useCallback(async (orderData: Omit<ServiceOrder, 'id' | 'isGoogleSynced' | 'title' | 'status' | 'customerId' | 'createdById' | 'confirmedById' | 'attendedById' | 'isCheckupOnly' | 'archiveReason' | 'serviceOrderNumber' | 'cancellationReason' | 'createdAt' | 'history' | 'cancelledById' | 'rescheduledCount'> & { customerEmail: string }) => {
    if (!syncedState || !localState) return;
    try {
      let customerId: string;
      let existingCustomer = syncedState.customers.find(c => c.phone === orderData.customerPhone);
      let newCustomer: Customer | null = null;
      let updatedCustomers = [...syncedState.customers];

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        customerId = `cust${Date.now()}`;
        newCustomer = {
          id: customerId,
          name: orderData.customerName,
          phone: orderData.customerPhone,
          email: orderData.customerEmail,
          address: orderData.customerAddress,
          latitude: orderData.latitude,
          longitude: orderData.longitude,
          serviceHistory: [],
          createdById: localState.currentUser?.id,
        };
        updatedCustomers.push(newCustomer);
      }

      const newOrderNumber = syncedState.lastServiceOrderNumber + 1;
      const formattedOrderNumber = `OS-${String(newOrderNumber).padStart(4, '0')}`;
      
      const newOrder: ServiceOrder = {
        ...orderData,
        id: `so${Date.now()}`,
        serviceOrderNumber: formattedOrderNumber,
        title: `${orderData.applianceType} - ${orderData.customerName}`,
        isGoogleSynced: false,
        customerId,
        status: 'Por Confirmar',
        createdAt: new Date(),
        createdById: localState.currentUser?.id,
        history: [{
            action: 'Creado',
            timestamp: new Date(),
            userId: localState.currentUser!.id,
            details: 'Cita creada por personal interno.'
        }]
      };

      EmailService.sendNewServiceOrderNotification(newOrder);

      const finalCustomers = updatedCustomers.map(c =>
        c.id === customerId
          ? { ...c, serviceHistory: [...c.serviceHistory, newOrder.id] }
          : c
      );

      await firebaseService.saveState({
        ...syncedState,
        customers: finalCustomers,
        serviceOrders: [...syncedState.serviceOrders, newOrder],
        lastServiceOrderNumber: newOrderNumber,
      });
    } catch (e: any) {
      setGlobalError(getErrorMessage(e));
    }
  }, [syncedState, localState]);

  const confirmServiceOrder = useCallback(async (orderId: string, updatedData: Partial<ServiceOrder>) => {
    if (!syncedState || !localState) return;
    try {
        const orderToConfirm = syncedState.serviceOrders.find(o => o.id === orderId);
        if (!orderToConfirm) return;

        let confirmedOrder: ServiceOrder = {
          ...orderToConfirm,
          ...updatedData,
          status: 'Pendiente',
          confirmedById: localState.currentUser?.id,
          history: [
              ...(orderToConfirm.history || []),
              {
                  action: 'Confirmado',
                  timestamp: new Date(),
                  userId: localState.currentUser!.id,
              }
          ]
        };

        if (!confirmedOrder.createdById) {
          confirmedOrder.createdById = localState.currentUser?.id;
        }
        
        let updatedCustomers = syncedState.customers;
        const customer = syncedState.customers.find(c => c.id === confirmedOrder!.customerId);
        if (customer && !customer.createdById) {
            updatedCustomers = syncedState.customers.map(c =>
                c.id === customer.id ? { ...c, createdById: localState.currentUser?.id } : c
            );
        }

        const newState: SyncedAppState = {
          ...syncedState,
          serviceOrders: syncedState.serviceOrders.map(o => o.id === orderId ? confirmedOrder! : o),
          customers: updatedCustomers,
        };
        
        await firebaseService.saveState(newState);
      
        if (localState.googleAuth.token && confirmedOrder) {
          if (!confirmedOrder.start || !confirmedOrder.end || !confirmedOrder.calendarId) {
            console.error("Faltan datos de la cita (inicio, fin, calendario) para sincronizar la orden.");
            return;
          }
          try {
            let eventId = confirmedOrder.googleEventId;
            if (confirmedOrder.isGoogleSynced && eventId) {
              await GoogleCalendarService.patchEvent(eventId, confirmedOrder.calendarId, {
                summary: `${confirmedOrder.applianceType} - ${confirmedOrder.customerName} [${confirmedOrder.status}]`,
                description: GoogleCalendarService.buildEventDescription(confirmedOrder),
                colorId: GoogleCalendarService.getStatusColorId(confirmedOrder.status),
                start: { dateTime: confirmedOrder.start.toISOString() },
                end: { dateTime: confirmedOrder.end.toISOString() },
              });
            } else {
              const event = await GoogleCalendarService.createEvent(confirmedOrder, confirmedOrder.calendarId);
              eventId = event.id;
            }

            const currentState = await firebaseService.getInitialState();
            if(!currentState) return;
            const finalState: SyncedAppState = {
                ...currentState,
                serviceOrders: currentState.serviceOrders.map(o => o.id === orderId ? { ...o, isGoogleSynced: true, googleEventId: eventId } : o)
            };
            await firebaseService.saveState(finalState);

          } catch (err) {
            console.error("Error al sincronizar con Google Calendar:", err);
            setGlobalError("Hubo un error al sincronizar la cita con Google Calendar. Por favor, verifica la conexión.");
          }
        }
    } catch(e: any) {
        setGlobalError(getErrorMessage(e));
    }
}, [syncedState, localState]);

const updateServiceOrder = useCallback(async (orderId: string, updatedData: Partial<Omit<ServiceOrder, 'id' | 'isGoogleSynced' | 'googleEventId'>>) => {
    if (!syncedState || !localState) return;
    try {
        const originalOrder = syncedState.serviceOrders.find(o => o.id === orderId);
        if (!originalOrder) return;

        const wasRescheduled = (updatedData.start && originalOrder.start && new Date(updatedData.start).getTime() !== new Date(originalOrder.start).getTime()) ||
                               (updatedData.calendarId && originalOrder.calendarId && updatedData.calendarId !== originalOrder.calendarId);

        const newOrderState: ServiceOrder = {
            ...originalOrder,
            ...updatedData,
            history: [
                ...(originalOrder.history || []),
                {
                    action: wasRescheduled ? 'Reagendado' : 'Editado',
                    timestamp: new Date(),
                    userId: localState.currentUser!.id,
                }
            ],
            rescheduledCount: wasRescheduled ? (originalOrder.rescheduledCount || 0) + 1 : originalOrder.rescheduledCount
        };
        
        await firebaseService.saveState({
            ...syncedState,
            serviceOrders: syncedState.serviceOrders.map(o => o.id === orderId ? newOrderState! : o)
        });

        if (localState.googleAuth.token && newOrderState && newOrderState.isGoogleSynced && newOrderState.googleEventId && newOrderState.calendarId) {
            try {
                const originalCalendarId = originalOrder?.calendarId;
                const newCalendarId = newOrderState.calendarId;

                if (originalCalendarId && newCalendarId && originalCalendarId !== newCalendarId) {
                    await GoogleCalendarService.moveEvent(newOrderState.googleEventId, originalCalendarId, newCalendarId);
                }

                await GoogleCalendarService.patchEvent(newOrderState.googleEventId, newCalendarId, {
                    summary: newOrderState.title,
                    description: GoogleCalendarService.buildEventDescription(newOrderState),
                    colorId: GoogleCalendarService.getStatusColorId(newOrderState.status),
                    start: { dateTime: newOrderState.start!.toISOString() },
                    end: { dateTime: newOrderState.end!.toISOString() },
                });
            } catch (err) {
                console.error("Error updating Google Calendar event:", err);
                setGlobalError("Hubo un error al actualizar la cita en Google Calendar.");
            }
        }
    } catch (e: any) {
        setGlobalError(getErrorMessage(e));
    }
}, [syncedState, localState]);

const deleteServiceOrder = useCallback(async (orderId: string, reason: string) => {
  if (!syncedState || !localState) return;
  try {
      const orderToCancel = syncedState.serviceOrders.find(o => o.id === orderId);
      if (!orderToCancel) return;

      const cancelledOrder: ServiceOrder = {
          ...orderToCancel,
          status: 'Cancelado',
          cancellationReason: reason,
          cancelledById: localState.currentUser!.id,
          history: [
              ...(orderToCancel.history || []),
              {
                  action: 'Cancelado',
                  timestamp: new Date(),
                  userId: localState.currentUser!.id,
                  details: `Motivo: ${reason}`
              }
          ]
      };

      if (localState.googleAuth.token && cancelledOrder.isGoogleSynced && cancelledOrder.googleEventId && cancelledOrder.calendarId) {
          GoogleCalendarService.patchEvent(cancelledOrder.googleEventId, cancelledOrder.calendarId, {
              summary: `${cancelledOrder.applianceType} - ${cancelledOrder.customerName} [CANCELADO]`,
              colorId: GoogleCalendarService.getStatusColorId('Cancelado'),
          }).catch(err => console.error("Failed to update Google event status to cancelled:", err));
      }
      
      await firebaseService.saveState({
          ...syncedState,
          serviceOrders: syncedState.serviceOrders.map(o => o.id === orderId ? cancelledOrder : o)
      });
  } catch(e: any) {
    setGlobalError(getErrorMessage(e));
  }
}, [syncedState, localState]);

const archiveServiceOrder = useCallback(async (orderId: string, attendedById: string, archiveReason: string) => {
    if (!syncedState) return;
    try {
        await firebaseService.saveState({
            ...syncedState,
            serviceOrders: syncedState.serviceOrders.map(o => 
                o.id === orderId ? { ...o, status: 'No Agendado', attendedById, archiveReason } : o
            )
        });
    } catch (e: any) {
        setGlobalError(getErrorMessage(e));
    }
}, [syncedState]);

const updateServiceOrderReminders = async (orderId: string, reminders: { minutes: number }[]) => {
    if (!syncedState || !localState) return;
    try {
        const order = syncedState.serviceOrders.find(o => o.id === orderId);
        
        const newState = {
            ...syncedState,
            serviceOrders: syncedState.serviceOrders.map(o => o.id === orderId ? { ...o, reminders } : o)
        };
        await firebaseService.saveState(newState);

        if (localState.googleAuth.token && order && order.isGoogleSynced && order.googleEventId && order.calendarId) {
            try {
                await GoogleCalendarService.patchEvent(order.googleEventId, order.calendarId, { reminders });
            } catch (err) {
                console.error("Error updating Google Calendar reminders:", err);
                setGlobalError("Hubo un error al actualizar los recordatorios en Google Calendar.");
            }
        }
    } catch (e: any) {
        setGlobalError(getErrorMessage(e));
    }
};

const updateServiceOrderStatus = async (orderId: string, status: ServiceOrderStatus) => {
    if (!syncedState || !localState) return;
    try {
        const order = syncedState.serviceOrders.find(o => o.id === orderId);

        const newState = {
            ...syncedState,
            serviceOrders: syncedState.serviceOrders.map(o => o.id === orderId ? { ...o, status } : o)
        };
        await firebaseService.saveState(newState);
        
        if (localState.googleAuth.token && order && order.isGoogleSynced && order.googleEventId && order.calendarId) {
            try {
                await GoogleCalendarService.patchEvent(order.googleEventId, order.calendarId, {
                    summary: `${order.applianceType} - ${order.customerName} [${status}]`,
                    colorId: GoogleCalendarService.getStatusColorId(status),
                });
            } catch (err) {
                console.error("Error updating Google Calendar status:", err);
                setGlobalError("Hubo un error al actualizar el estado en Google Calendar.");
            }
        }
    } catch (e: any) {
        setGlobalError(getErrorMessage(e));
    }
};

const updateCalendarAvailability = async (calendarId: string, availability: DailyAvailability[]) => {
    if (!syncedState) return;
    try {
        await firebaseService.saveState({
            ...syncedState,
            calendars: syncedState.calendars.map(c => c.id === calendarId ? { ...c, availability } : c),
        });
    } catch (e: any) {
        setGlobalError(getErrorMessage(e));
    }
};

const addAccessKey = async (staffId: string, key: string) => {
    if (!syncedState) return;
    try {
        await firebaseService.saveState({
            ...syncedState,
            staff: syncedState.staff.map(s => s.id === staffId ? { ...s, accessKey: key } : s)
        });
    } catch (e: any) {
        setGlobalError(getErrorMessage(e));
    }
};

const deleteAccessKey = async (staffId: string) => {
    if (!syncedState) return;
    try {
        await firebaseService.saveState({
            ...syncedState,
            staff: syncedState.staff.map(s => {
                if (s.id === staffId) {
                    const { accessKey, ...rest } = s;
                    return rest;
                }
                return s;
            })
        });
    } catch (e: any) {
        setGlobalError(getErrorMessage(e));
    }
};

const addMaintenanceSchedule = async (scheduleData: Omit<MaintenanceSchedule, 'id' | 'nextDueDate'>) => {
    if (!syncedState) return;
    try {
        const nextDueDate = new Date(scheduleData.startDate);
        nextDueDate.setMonth(nextDueDate.getMonth() + scheduleData.frequencyMonths);
        const newSchedule: MaintenanceSchedule = {
            ...scheduleData,
            id: `ms${Date.now()}`,
            nextDueDate: nextDueDate.toISOString().split('T')[0],
        };
        await firebaseService.saveState({ ...syncedState, maintenanceSchedules: [...syncedState.maintenanceSchedules, newSchedule] });
    } catch (e: any) {
        setGlobalError(getErrorMessage(e));
    }
};

const updateMaintenanceSchedule = async (scheduleId: string, scheduleData: Omit<MaintenanceSchedule, 'id'>) => {
    if (!syncedState) return;
    try {
        await firebaseService.saveState({
            ...syncedState,
            maintenanceSchedules: syncedState.maintenanceSchedules.map(s =>
                s.id === scheduleId ? { ...s, ...scheduleData } : s
            ),
        });
    } catch (e: any) {
        setGlobalError(getErrorMessage(e));
    }
};

const deleteMaintenanceSchedule = async (scheduleId: string) => {
    if (!syncedState) return;
    try {
        await firebaseService.saveState({
            ...syncedState,
            maintenanceSchedules: syncedState.maintenanceSchedules.filter(s => s.id !== scheduleId),
        });
    } catch (e: any) {
        setGlobalError(getErrorMessage(e));
    }
};

const handleAuthChange = (tokenResponse: any) => {
    if (tokenResponse.access_token) {
        setLocalState(prev => prev ? ({ ...prev, googleAuth: { ...prev.googleAuth, token: tokenResponse }}) : null);
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { 'Authorization': `Bearer ${tokenResponse.access_token}` }
        })
        .then(res => res.json())
        .then(data => {
            setLocalState(prev => prev ? ({ ...prev, googleAuth: { ...prev.googleAuth, user: { name: data.name, email: data.email, picture: data.picture } }}) : null);
        });
    } else {
        console.error("Auth failed", tokenResponse);
        setLocalState(prev => prev ? ({...prev, googleAuth: { token: null, user: null } }) : null);
    }
};

const signInToGoogle = () => {
    if (tokenClient) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        console.error("Google token client not initialized.");
    }
};

const signOutFromGoogle = () => {
    if (!localState || !localState.googleAuth.token) return;
    window.google.accounts.oauth2.revoke(localState.googleAuth.token.access_token, () => {
        setLocalState(prev => prev ? ({...prev, googleAuth: { token: null, user: null } }) : null);
    });
};

useEffect(() => {
    if (isGoogleConfigMissing) {
        console.warn("Falta el ID de Cliente de Google. La integración con el calendario está deshabilitada.");
        return;
    }

    const initGapi = () => {
        window.gapi.load('client', async () => {
            await GoogleCalendarService.initGapiClient();
            
            const client = GoogleCalendarService.initTokenClient(handleAuthChange);
            if(client) {
                tokenClient = client;
            } else {
                console.error("Failed to initialize Google Token Client.");
            }
        });
    };

    if (window.gapi) {
        initGapi();
    }
}, [isGoogleConfigMissing]);

const checkForDueMaintenance = useCallback(async () => {
    if (!syncedState) return;
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        let hasChanges = false;
        let newServiceOrders: ServiceOrder[] = [];
        let newLastServiceOrderNumber = syncedState.lastServiceOrderNumber;

        const newSchedules = syncedState.maintenanceSchedules.map(schedule => {
            if (schedule.nextDueDate <= todayStr) {
                const customer = syncedState.customers.find(c => c.id === schedule.customerId);
                if (!customer) return schedule;

                const existingOrder = syncedState.serviceOrders.some(o =>
                    o.customerId === customer.id &&
                    o.issueDescription.includes(`Mantenimiento programado: ${schedule.serviceDescription}`) &&
                    (o.status === 'Por Confirmar' || o.status === 'Pendiente')
                );

                if (!existingOrder) {
                    hasChanges = true;
                    newLastServiceOrderNumber++;
                    const newOrder: ServiceOrder = {
                        id: `so${Date.now()}${Math.random()}`,
                        serviceOrderNumber: `OS-${String(newLastServiceOrderNumber).padStart(4, '0')}`,
                        title: `Mantenimiento: ${schedule.serviceDescription} - ${customer.name}`,
                        isGoogleSynced: false,
                        customerId: customer.id,
                        customerName: customer.name,
                        customerPhone: customer.phone,
                        customerAddress: customer.address,
                        latitude: customer.latitude,
                        longitude: customer.longitude,
                        applianceType: `Mantenimiento: ${schedule.serviceDescription}`,
                        issueDescription: `Mantenimiento programado: ${schedule.serviceDescription}`,
                        status: 'Por Confirmar',
                        createdAt: new Date(),
                        history: [{ action: 'Creado', timestamp: new Date(), userId: 'system', details: 'Generado automáticamente por programa de mantenimiento.' }]
                    };
                    newServiceOrders.push(newOrder);

                    const nextDueDate = new Date(schedule.nextDueDate);
                    nextDueDate.setMonth(nextDueDate.getMonth() + schedule.frequencyMonths);
                    return { ...schedule, nextDueDate: nextDueDate.toISOString().split('T')[0] };
                }
            }
            return schedule;
        });

        if (hasChanges) {
            await firebaseService.saveState({
                ...syncedState,
                maintenanceSchedules: newSchedules,
                serviceOrders: [...syncedState.serviceOrders, ...newServiceOrders],
                lastServiceOrderNumber: newLastServiceOrderNumber
            });
        }
    } catch(e: any) {
        setGlobalError(getErrorMessage(e));
    }
}, [syncedState]);


useEffect(() => {
    const interval = setInterval(() => {
        checkForDueMaintenance();
    }, 1000 * 60 * 60); // Check every hour
    checkForDueMaintenance(); // Check once on startup
    return () => clearInterval(interval);
}, [checkForDueMaintenance]);

const addWorkshopEquipment = async (equipmentData: Omit<WorkshopEquipment, 'id' | 'history'>) => {
    if (!syncedState || !localState) return;
    try {
        const newEquipment: WorkshopEquipment = {
            ...equipmentData,
            id: `we-${Date.now()}`,
            history: [
                {
                    action: 'Creado',
                    timestamp: new Date(),
                    userId: localState.currentUser!.id,
                    details: 'Equipo registrado en taller.'
                }
            ]
        };
        await firebaseService.saveState({
            ...syncedState,
            workshopEquipment: [...syncedState.workshopEquipment, newEquipment]
        });
    } catch(e: any) {
        setGlobalError(getErrorMessage(e));
    }
}

const updateWorkshopEquipment = async (equipmentId: string, equipmentData: Partial<Omit<WorkshopEquipment, 'id'>>) => {
    if (!syncedState || !localState) return;
    try {
        const originalEquipment = syncedState.workshopEquipment.find(we => we.id === equipmentId);
        if (!originalEquipment) return;

        const newHistoryLog: ActionLog | null = equipmentData.status && equipmentData.status !== originalEquipment.status
            ? {
                action: 'Estado Cambiado',
                timestamp: new Date(),
                userId: localState.currentUser!.id,
                details: `Estado cambiado a: ${equipmentData.status}`
            }
            : null;

        const updatedEquipment: WorkshopEquipment = {
            ...originalEquipment,
            ...equipmentData,
            history: newHistoryLog ? [...originalEquipment.history, newHistoryLog] : originalEquipment.history
        };
        await firebaseService.saveState({
            ...syncedState,
            workshopEquipment: syncedState.workshopEquipment.map(we => we.id === equipmentId ? updatedEquipment : we)
        });
    } catch(e: any) {
        setGlobalError(getErrorMessage(e));
    }
}

const updateCompanyInfo = async (info: Partial<CompanyInfo>) => {
    if (!syncedState) return;
    try {
        await firebaseService.saveState({
            ...syncedState,
            companyInfo: { ...syncedState.companyInfo, ...info }
        });
    } catch(e: any) {
        setGlobalError(getErrorMessage(e));
    }
};

// FIX: Add dummy implementations for unused invoicing features to satisfy types
const dummyAsync = async () => { console.warn("Function not implemented."); };
const dummyAsyncString = async () => { console.warn("Function not implemented."); return ""; };
const dummySet = (key: keyof LocalAppState) => (value: any) => setLocalState(prev => prev ? { ...prev, [key]: value } : null);


const appContextValue: AppContextType | null = appState ? {
  ...appState,
  setMode,
  setGlobalError,
  signOut,
  addServiceOrder,
  confirmServiceOrder,
  updateServiceOrder,
  deleteServiceOrder,
  archiveServiceOrder,
  addStaff,
  updateStaff,
  deleteStaff,
  updateStaffRole,
  addCalendar,
  updateCalendar,
  deleteCalendar,
  addCustomer,
  updateCustomer,
  loadCustomers,
  signInToGoogle,
  signOutFromGoogle,
  isGoogleConfigMissing,
  updateServiceOrderReminders,
  updateServiceOrderStatus,
  updateCalendarAvailability,
  addAccessKey,
  deleteAccessKey,
  addMaintenanceSchedule,
  updateMaintenanceSchedule,
  deleteMaintenanceSchedule,
  addWorkshopEquipment,
  updateWorkshopEquipment,
  updateCompanyInfo,
  // FIX: Add dummy implementations for invoicing-related context values
  addInvoice: dummyAsyncString,
  updateInvoice: dummyAsync,
  deleteInvoice: dummyAsync,
  recordInvoicePayment: dummyAsync,
  addQuote: dummyAsync,
  updateQuote: dummyAsync,
  deleteQuote: dummyAsync,
  addProduct: dummyAsync,
  updateProduct: dummyAsync,
  deleteProduct: dummyAsync,
  addBankAccount: dummyAsync,
  updateBankAccount: dummyAsync,
  deleteBankAccount: dummyAsync,
  setOrderToConvertToInvoice: dummySet('orderToConvertToInvoice'),
  setQuoteToConvertToInvoice: dummySet('quoteToConvertToInvoice'),
  setInvoiceToEdit: dummySet('invoiceToEdit'),
  setInvoiceToDuplicate: dummySet('invoiceToDuplicate'),
  setInvoiceToPrint: dummySet('invoiceToPrint'),
  viewInvoice: () => console.warn("Function not implemented."),
} : null;

// Loading state while auth is being checked or bootstrapping
if (isBootstrapping || authUser === undefined) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-100">
        <Loader2 className="animate-spin h-12 w-12 text-sky-600" />
        <p className="mt-4 text-slate-600 font-medium">
            {isBootstrapping ? 'Iniciando aplicación...' : 'Verificando sesión...'}
        </p>
      </div>
    );
}

// User is not logged in
if (!authUser) {
    return <LoginPage />;
}

// User is logged in, but data is still loading
if (!appContextValue) {
     return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-100">
        <Loader2 className="animate-spin h-12 w-12 text-sky-600" />
        <p className="mt-4 text-slate-600 font-medium">Cargando datos y sincronizando...</p>
      </div>
    );
}

// User is logged in and all data is loaded
return (
  <AppContext.Provider value={appContextValue}>
      <div className="bg-slate-100 min-h-screen">
        <Header />
        {appContextValue.globalError && <ErrorBanner message={appContextValue.globalError} onClose={() => setGlobalError(null)} />}
        <main className="p-4 sm:p-6 lg:p-8">
          <Dashboard />
        </main>
      </div>
  </AppContext.Provider>
);
};

export default App;
