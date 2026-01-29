import React from 'react';

export interface ActionLog {
  action: 'Creado' | 'Confirmado' | 'Editado' | 'Reagendado' | 'Cancelado' | 'Estado Cambiado';
  timestamp: Date;
  userId: string; // Staff ID
  details?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  rnc?: string; // RNC para persona jurídica
  latitude?: number;
  longitude?: number;
  serviceHistory: string[]; // Array of ServiceOrder IDs
  createdById?: string; // Staff ID of creator
}

export type StaffRole = 'administrador' | 'coordinador' | 'tecnico' | 'secretaria';

export type CalendarViewType = 'day' | 'week' | 'month';

export interface Staff {
  id: string;
  name: string;
  email: string;
  calendarId: string;
  role: StaffRole;
  personalPhone?: string;
  fleetPhone?: string;
  idNumber?: string;
  accessKey?: string;

  // Campos detallados
  code?: string;
  address?: string;
  salary?: number;
  startDate?: string; // "YYYY-MM-DD"
  tss?: number;
  afp?: number;
  idPhotoUrl?: string;
  employeePhotoUrl?: string;

  // Configuración de vistas del calendario (solo técnicos)
  allowedCalendarViews?: CalendarViewType[]; // Si no se define, solo 'day' por defecto
}

export interface TimeSlot {
    startTime: string; // "HH:MM"
    endTime: string; // "HH:MM"
}

export interface DailyAvailability {
  dayOfWeek: number; // 0 for Sunday, 1 for Monday, etc.
  slots: TimeSlot[];
}

export interface Calendar {
  id: string;
  name: string;
  userId: string; // Corresponds to Staff ID
  color: string;
  availability?: DailyAvailability[];
  active?: boolean;
}

export type ServiceOrderStatus = 'Pendiente' | 'En Proceso' | 'Completado' | 'Cancelado' | 'Por Confirmar' | 'Garantía' | 'No Agendado';

export interface ServiceOrder {
  id: string;
  serviceOrderNumber: string;
  title: string;
  start?: Date;
  end?: Date;
  calendarId?: string;
  isGoogleSynced: boolean;
  googleEventId?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerEmail?: string;
  latitude?: number;
  longitude?: number;
  applianceType: string; // e.g., "Lavadora Samsung"
  issueDescription: string;
  reminders?: { minutes: number }[];
  status: ServiceOrderStatus;
  serviceNotes?: string;
  isCheckupOnly?: boolean;
  createdAt: Date;
  createdById?: string; // Staff ID of creator
  confirmedById?: string; // Staff ID of confirmer
  attendedById?: string;
  archiveReason?: string;
  cancellationReason?: string;
  cancelledById?: string;
  rescheduledCount?: number;
  history?: ActionLog[];
  completionPhotoUrl?: string; // Data URL for the completion photo
  completionLatitude?: number;
  completionLongitude?: number;
  quoteId?: string; // Link to Quote
  invoiceId?: string; // Link to Invoice
}

export interface MaintenanceSchedule {
  id: string;
  customerId: string; // Link to Customer
  serviceDescription: string;
  frequencyMonths: 3 | 6 | 12;
  startDate: string; // "YYYY-MM-DD"
  nextDueDate: string; // "YYYY-MM-DD"
}

// --- WORKSHOP MODULE TYPES ---

export type WorkshopEquipmentStatus = 'Recibido' | 'En Diagnóstico' | 'Esperando Repuesto' | 'En Reparación' | 'Listo para Retirar' | 'Entregado';

export interface WorkshopEquipment {
    id: string;
    entryDate: Date;
    customerId: string;
    equipmentType: string;
    brand: string;
    model: string;
    serialNumber: string;
    reportedFault: string;
    technicianId?: string;
    status: WorkshopEquipmentStatus;
    history: ActionLog[];
}

// FIX: Add missing types for products, bank accounts, and invoicing.
// --- PRODUCTOS MODULE TYPES ---
export type ProductType = 'Inventario' | 'Manual';
export type ProductStatus = 'Nuevo' | 'Usado' | 'Reacondicionado';

export interface Product {
    id: string;
    code: string;
    name: string;
    type: ProductType;
    purchasePrice: number;
    sellPrice1: number;
    sellPrice2: number;
    sellPrice3: number;
    stock: number;
    // Nuevos campos QA
    brand?: string; // Marca
    description?: string; // Descripción
    location?: string; // Ubicación en almacén
    status?: ProductStatus; // Estado del producto
    entryDate?: string; // Fecha de ingreso (YYYY-MM-DD)
    lotOrSerial?: string; // Lote o número de serie
    supplier?: string; // Proveedor
}
// --- END PRODUCTOS MODULE TYPES ---

// --- BANK ACCOUNT MODULE TYPES ---
export interface BankAccount {
    id: string;
    bankName: string;
    accountHolder: string;
    accountNumber: string;
}
// --- END BANK ACCOUNT MODULE TYPES ---

// --- INVOICING MODULE TYPES ---
export type PaymentMethod = 'Efectivo' | 'Transferencia' | 'Tarjeta de Crédito' | 'Tarjeta de Débito';

export interface PaymentDetails {
    id: string;
    method: PaymentMethod;
    amount: number;
    paymentDate: Date;
    bankAccountId?: string;
    cashReceived?: number;
    changeGiven?: number;
}

export type InvoiceStatus = 'Borrador' | 'Emitida' | 'Pago Parcial' | 'Pagada' | 'Anulada';

export interface InvoiceLineItem {
    id: string;
    type: ProductType;
    productId?: string;
    description: string;
    quantity: number;
    purchasePrice: number;
    sellPrice: number;
    commission?: {
        technicianId: string;
        amount: number;
    };
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    customerId: string;
    date: Date;
    items: InvoiceLineItem[];
    subtotal: number;
    discount: number; // Percentage
    isTaxable: boolean;
    taxes: number;
    total: number;
    status: InvoiceStatus;
    payments: PaymentDetails[];
    paidAmount: number;
    serviceOrderId?: string;
    serviceOrderDescription?: string;
}

export type QuoteStatus = 'Borrador' | 'Enviada' | 'Aceptada' | 'Rechazada';

export interface Quote {
    id: string;
    quoteNumber: string;
    customerId: string;
    date: Date;
    items: InvoiceLineItem[];
    subtotal: number;
    discount: number; // Percentage
    isTaxable: boolean;
    taxes: number;
    total: number;
    status: QuoteStatus;
    createdById?: string;
}
// --- END INVOICING MODULE TYPES ---

// --- EXPENSES MODULE TYPES ---
export type ExpenseCategory = 'Nómina' | 'Servicios' | 'Repuestos' | 'Combustible' | 'Mantenimiento' | 'Alquiler' | 'Impuestos' | 'Marketing' | 'Otros';

export interface Expense {
    id: string;
    date: Date;
    category: ExpenseCategory;
    description: string;
    amount: number;
    paymentMethod?: PaymentMethod;
    bankAccountId?: string;
    supplier?: string; // Proveedor o beneficiario
    receiptUrl?: string; // URL del comprobante/recibo
    createdById?: string;
    createdAt: Date;
}
// --- END EXPENSES MODULE TYPES ---

// --- END WORKSHOP MODULE TYPES ---
export interface CompanyInfo {
  name: string;
  rnc?: string; // RNC de la empresa
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  logoUrl?: string; // Data URL for the logo
}

// FIX: Add new app modes for invoicing features
export type AppMode = 'inicio' | 'calendar' | 'staff' | 'calendars' | 'customers' | 'technician-calendar' | 'unconfirmed-appointments' | 'access-keys' | 'maintenance-schedules' | 'secretary-performance' | 'technician-performance' | 'workshop-equipment' | 'company-settings' | 'customer-map' | 'my-orders' | 'facturacion' | 'facturacion-form' | 'cotizaciones' | 'productos' | 'cuentas-bancarias' | 'gastos';

export interface GoogleUser {
  name: string;
  email: string;
  picture: string;
}

export interface GoogleAuthState {
  token: any | null;
  user: GoogleUser | null;
}

// FIX: Add new state properties for invoicing features
export interface SyncedAppState {
  staff: Staff[];
  customers: Customer[];
  calendars: Calendar[];
  serviceOrders: ServiceOrder[];
  maintenanceSchedules: MaintenanceSchedule[];
  workshopEquipment: WorkshopEquipment[];
  lastServiceOrderNumber: number;
  companyInfo: CompanyInfo;
  products: Product[];
  invoices: Invoice[];
  quotes: Quote[];
  bankAccounts: BankAccount[];
  lastInvoiceNumber: number;
  lastQuoteNumber: number;
  expenses: Expense[];
}

// FIX: Add new local state properties for invoicing features
export interface LocalAppState {
  mode: AppMode;
  googleAuth: GoogleAuthState;
  currentUser: Staff | null;
  globalError: string | null;
  orderToConvertToInvoice: ServiceOrder | null;
  quoteToConvertToInvoice: Quote | null;
  invoiceToEdit: Invoice | null;
  invoiceToDuplicate: Invoice | null;
  invoiceToPrint: { invoice: Invoice, customer: Customer } | null;
  quoteToPrint: { quote: Quote, customer: Customer } | null;
  invoiceMode: 'sale' | 'advance' | null;
}

export interface AppState extends SyncedAppState, LocalAppState {}

// FIX: Add new function definitions for invoicing features
export interface AppContextType extends AppState {
  setMode: (mode: AppMode) => void;
  goHome: () => void;
  setGlobalError: (error: string | null) => void;
  signOut: () => void;
  addServiceOrder: (order: Omit<ServiceOrder, 'id' | 'isGoogleSynced' | 'title' | 'status' | 'customerId' | 'createdById' | 'confirmedById' | 'attendedById' | 'isCheckupOnly' | 'archiveReason' | 'serviceOrderNumber' | 'cancellationReason' | 'createdAt' | 'history' | 'cancelledById' | 'rescheduledCount' | 'completionPhotoUrl' | 'completionLatitude' | 'completionLongitude'> & { customerEmail: string }) => Promise<void>;
  confirmServiceOrder: (orderId: string, updatedData: Partial<ServiceOrder>) => Promise<void>;
  updateServiceOrder: (orderId: string, updatedData: Partial<Omit<ServiceOrder, 'id' | 'isGoogleSynced' | 'googleEventId'>>) => Promise<void>;
  deleteServiceOrder: (orderId: string, reason: string) => Promise<void>;
  archiveServiceOrder: (orderId: string, attendedById: string, archiveReason: string) => Promise<void>;
  addStaff: (staff: Omit<Staff, 'id' | 'calendarId'>, password: string) => Promise<void>;
  updateStaff: (staffId: string, staffData: Omit<Staff, 'id' | 'calendarId' | 'email'>) => Promise<void>;
  deleteStaff: (staffId: string) => Promise<void>;
  updateStaffRole: (staffId: string, role: StaffRole) => Promise<void>;
  changeStaffPassword: (email: string, currentPassword: string, newPassword: string) => Promise<void>;
  addCalendar: (calendar: Omit<Calendar, 'id' | 'color'>) => Promise<void>;
  updateCalendar: (calendarId: string, calendarData: Partial<Omit<Calendar, 'id'>>) => Promise<void>;
  deleteCalendar: (calendarId: string) => Promise<void>;
  addCustomer: (customerData: Omit<Customer, 'id' | 'serviceHistory' | 'createdById'>) => Promise<Customer | undefined>;
  updateCustomer: (customerId: string, customerData: Omit<Customer, 'id' | 'serviceHistory' | 'createdById'>) => Promise<void>;
  loadCustomers: (customers: Customer[]) => Promise<void>;
  signInToGoogle: () => void;
  signOutFromGoogle: () => void;
  isGoogleConfigMissing: boolean;
  updateServiceOrderReminders: (orderId: string, reminders: { minutes: number }[]) => Promise<void>;
  updateServiceOrderStatus: (orderId: string, status: ServiceOrderStatus) => Promise<void>;
  updateCalendarAvailability: (calendarId: string, availability: DailyAvailability[]) => Promise<void>;
  addAccessKey: (staffId: string, key: string) => Promise<void>;
  deleteAccessKey: (staffId: string) => Promise<void>;
  addMaintenanceSchedule: (schedule: Omit<MaintenanceSchedule, 'id' | 'nextDueDate'>) => Promise<void>;
  updateMaintenanceSchedule: (scheduleId: string, scheduleData: Omit<MaintenanceSchedule, 'id'>) => Promise<void>;
  deleteMaintenanceSchedule: (scheduleId: string) => Promise<void>;
  // Workshop Equipment functions
  addWorkshopEquipment: (equipment: Omit<WorkshopEquipment, 'id' | 'history'>) => Promise<void>;
  updateWorkshopEquipment: (equipmentId: string, equipmentData: Partial<Omit<WorkshopEquipment, 'id'>>) => Promise<void>;
  updateCompanyInfo: (info: Partial<CompanyInfo>) => Promise<void>;
  
  // INVOICING
  addInvoice: (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'subtotal' | 'taxes' | 'total' | 'payments' | 'paidAmount'>) => Promise<string>;
  updateInvoice: (invoiceId: string, invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'subtotal' | 'taxes' | 'total' | 'payments' | 'paidAmount'>) => Promise<void>;
  deleteInvoice: (invoiceId: string) => Promise<void>;
  recordInvoicePayment: (invoiceId: string, paymentDetails: PaymentDetails) => Promise<void>;
  addQuote: (quoteData: Omit<Quote, 'id' | 'quoteNumber' | 'subtotal' | 'taxes' | 'total'>) => Promise<void>;
  updateQuote: (quoteId: string, quoteData: Omit<Quote, 'id' | 'quoteNumber' | 'subtotal' | 'taxes' | 'total'>) => Promise<void>;
  deleteQuote: (quoteId: string) => Promise<void>;
  addProduct: (productData: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (productId: string, productData: Omit<Product, 'id'>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  addBankAccount: (accountData: Omit<BankAccount, 'id'>) => Promise<void>;
  updateBankAccount: (accountId: string, accountData: Omit<BankAccount, 'id'>) => Promise<void>;
  deleteBankAccount: (accountId: string) => Promise<void>;
  // EXPENSES
  addExpense: (expenseData: Omit<Expense, 'id' | 'createdById' | 'createdAt'>) => Promise<void>;
  updateExpense: (expenseId: string, expenseData: Omit<Expense, 'id' | 'createdById' | 'createdAt'>) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  setOrderToConvertToInvoice: (order: ServiceOrder | null) => void;
  setQuoteToConvertToInvoice: (quote: Quote | null) => void;
  setInvoiceToEdit: (invoice: Invoice | null) => void;
  setInvoiceToDuplicate: (invoice: Invoice | null) => void;
  setInvoiceToPrint: (data: { invoice: Invoice, customer: Customer } | null) => void;
  setQuoteToPrint: (data: { quote: Quote, customer: Customer } | null) => void;
  viewInvoice: (invoiceId: string) => void;
}

export const AppContext = React.createContext<AppContextType | null>(null);