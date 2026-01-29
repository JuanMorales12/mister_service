
import React, { useContext } from 'react';
import { AppContext, AppContextType } from '../src/types';
import { canViewMode } from '../src/permissions';
import { CalendarView } from './CalendarView';
import { StaffManagement } from './StaffManagement';
import { CustomerManagement } from './CustomerManagement';
import { Chatbot } from './Chatbot';
import { CalendarManagement } from './CalendarManagement';
import { UnconfirmedAppointmentsView } from './UnconfirmedAppointmentsView';
import { TechnicianCalendarView } from './TechnicianCalendarView';
import { AccessKeysManagement } from './AccessKeysManagement';
import { MaintenanceManagement } from './MaintenanceManagement';
import { SecretaryPerformanceView } from './SecretaryPerformanceView';
import { TechnicianPerformanceView } from './TechnicianPerformanceView';
import { WorkshopEquipmentView } from './WorkshopEquipmentView';
import { CompanySettingsView } from './CompanySettingsView';
import { CustomerMapView } from './CustomerMapView';
import { MyOrdersView } from './MyOrdersView';
import { InicioView } from './InicioView';
import { InvoiceView } from './InvoiceView';
import { InvoiceFormModal } from './InvoiceFormModal';
import { InvoicePrintView } from './InvoicePrintView';
import { QuotePrintView } from './QuotePrintView';
import { QuoteView } from './QuoteView';
import { BankAccountManagement } from './BankAccountManagement';
import { ProductManagement } from './ProductManagement';
import { ExpenseManagement } from './ExpenseManagement';

export const Dashboard: React.FC = () => {
  const { mode, invoiceToPrint, quoteToPrint, currentUser } = useContext(AppContext) as AppContextType;
  
  return (
    <div className="relative">
      {/* Centralizado en permisos */}
      {mode === 'inicio' && (canViewMode(currentUser, 'inicio') ? <InicioView /> : null)}
      {mode === 'calendar' && <CalendarView />}
      {mode === 'my-orders' && <MyOrdersView />}
      {mode === 'staff' && <StaffManagement />}
      {mode === 'customers' && <CustomerManagement />}
      {mode === 'calendars' && <CalendarManagement />}
      {mode === 'technician-calendar' && <TechnicianCalendarView />}
      {mode === 'unconfirmed-appointments' && <UnconfirmedAppointmentsView />}
      {mode === 'access-keys' && <AccessKeysManagement />}
      {mode === 'maintenance-schedules' && <MaintenanceManagement />}
      {mode === 'secretary-performance' && <SecretaryPerformanceView />}
      {mode === 'technician-performance' && <TechnicianPerformanceView />}
      {mode === 'workshop-equipment' && <WorkshopEquipmentView />}
      {mode === 'company-settings' && <CompanySettingsView />}
      {mode === 'customer-map' && <CustomerMapView />}
      {mode === 'facturacion' && <InvoiceView />}
      {mode === 'facturacion-form' && <InvoiceFormModal />}
      {mode === 'cotizaciones' && <QuoteView />}
      {mode === 'productos' && <ProductManagement />}
      {mode === 'cuentas-bancarias' && <BankAccountManagement />}
      {mode === 'gastos' && <ExpenseManagement />}
      {invoiceToPrint && <InvoicePrintView />}
      {quoteToPrint && <QuotePrintView />}
      <Chatbot />
    </div>
  );
};
