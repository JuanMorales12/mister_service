
import React, { useContext, useState, useMemo, useRef, useEffect } from 'react';
import { AppContext, AppContextType, AppMode, Staff } from '../src/types';
import { can } from '../src/permissions';
import { Wrench, Users, User, CalendarDays, LogOut, AlertTriangle, FileText, CalendarCheck, Menu, X, Calendar as CalendarIcon, Key, ClipboardList, Activity, BarChart3, HardHat, Building2, Map, LayoutDashboard, FileSpreadsheet, Receipt, Package, Wallet } from 'lucide-react';

const NavButton: React.FC<{ 
  targetMode: AppMode, 
  children: React.ReactNode, 
  count?: number, 
  hiddenForRoles?: Staff['role'][], 
  onClick: () => void,
  currentMode: AppMode,
  currentUser: Staff | null,
  isHighlighted?: boolean,
}> = ({ targetMode, children, count, hiddenForRoles = [], onClick, currentMode, currentUser, isHighlighted = false }) => {
  if (currentUser && hiddenForRoles.includes(currentUser.role)) {
    return null;
  }
  
  const baseClasses = `flex items-center gap-2 px-4 py-2 transition-colors w-full text-left text-sm rounded-md`;
  const activeClasses = currentMode === targetMode ? 'bg-sky-100 text-sky-800' : 'text-slate-700 hover:bg-slate-100';
  const highlightedClasses = isHighlighted ? 'bg-sky-50 hover:bg-sky-100' : '';

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${activeClasses} ${highlightedClasses}`}
    >
      <div className="flex justify-between items-center w-full">
          <span className="flex items-center gap-2">{children}</span>
          {count !== undefined && count > 0 && (
               <span className="bg-red-500 text-white text-[11px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {count > 99 ? '99+' : count}
              </span>
          )}
      </div>
    </button>
  );
};

export const Header: React.FC = () => {
  const { 
    mode, setMode, googleAuth, signInToGoogle, signOutFromGoogle, isGoogleConfigMissing,
    serviceOrders, maintenanceSchedules, customers, calendars, staff, currentUser, signOut, companyInfo
  } = useContext(AppContext) as AppContextType;
  
  const isSynced = !!googleAuth.token;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setIsMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuRef]);

  const handleNavClick = (targetMode: AppMode) => {
    setMode(targetMode);
    setIsMenuOpen(false);
  };
  
  const {
    unconfirmedCount,
    dueMaintenanceCount,
  } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueSchedules = maintenanceSchedules.filter(schedule => {
        const [year, month, day] = schedule.nextDueDate.split('-').map(s => parseInt(s, 10));
        const dueDate = new Date(year, month - 1, day);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() <= today.getTime();
    }).length;

    // Filtrar citas por confirmar según el rol del usuario
    const unconfirmedOrders = serviceOrders.filter(o => {
        if (o.status !== 'Por Confirmar') return false;

        // Los administradores y secretarias ven todas las citas
        if (currentUser?.role === 'administrador' || currentUser?.role === 'secretaria') {
            return true;
        }

        // Los técnicos solo ven sus propias citas (asignadas a su calendario)
        if (currentUser?.role === 'tecnico') {
            return o.calendarId === currentUser.calendarId;
        }

        return true;
    });

    return {
      unconfirmedCount: unconfirmedOrders.length,
      dueMaintenanceCount: dueSchedules,
    };
  }, [serviceOrders, maintenanceSchedules, currentUser]);
  

  const menuItems = (
    onClickHandler: (mode: AppMode) => void
  ) => (
    <>
      {can(currentUser, 'view', 'dashboard') && (
        <NavButton targetMode="inicio" onClick={() => onClickHandler('inicio')} currentMode={mode} currentUser={currentUser}><LayoutDashboard size={18} /><span>Inicio</span></NavButton>
      )}
      <div className="border-t my-1 mx-2 border-slate-200"></div>
      <div className="px-4 pt-2 pb-1 text-xs font-semibold uppercase text-slate-400">Gestión de Citas</div>
      {can(currentUser, 'view', 'calendar') && (
        <NavButton targetMode="calendar" onClick={() => onClickHandler('calendar')} currentMode={mode} currentUser={currentUser}><CalendarDays size={18} /><span>Órdenes de Servicio</span></NavButton>
      )}
      {currentUser?.role === 'tecnico' &&
          <NavButton targetMode="my-orders" onClick={() => onClickHandler('my-orders')} currentMode={mode} currentUser={currentUser}>
              <Wrench size={18}/> <span>Mis Órdenes</span>
          </NavButton>
      }
      {can(currentUser, 'view', 'unconfirmed-appointments') && (
        <NavButton targetMode="unconfirmed-appointments" count={unconfirmedCount} onClick={() => onClickHandler('unconfirmed-appointments')} currentMode={mode} currentUser={currentUser}><CalendarCheck size={18} /><span>Citas por Confirmar</span></NavButton>
      )}
      <NavButton targetMode="technician-calendar" onClick={() => onClickHandler('technician-calendar')} currentMode={mode} currentUser={currentUser}><CalendarIcon size={18} /><span>Calendario Técnico</span></NavButton>
      {can(currentUser, 'view', 'maintenance') && (
        <NavButton targetMode="maintenance-schedules" count={dueMaintenanceCount} onClick={() => onClickHandler('maintenance-schedules')} currentMode={mode} currentUser={currentUser}><ClipboardList size={18} /><span>Mantenimiento</span></NavButton>
      )}
      {can(currentUser, 'view', 'workshop') && (
        <NavButton targetMode="workshop-equipment" onClick={() => onClickHandler('workshop-equipment')} currentMode={mode} currentUser={currentUser}><HardHat size={18}/><span>Equipos en Taller</span></NavButton>
      )}

      <div className="border-t my-1 mx-2 border-slate-200"></div>

      <div className="px-4 pt-2 pb-1 text-xs font-semibold uppercase text-slate-400">Facturación & Finanzas</div>
      {can(currentUser, 'view', 'invoices') && (
        <NavButton targetMode="facturacion" onClick={() => onClickHandler('facturacion')} currentMode={mode} currentUser={currentUser}><Receipt size={18}/><span>Facturas</span></NavButton>
      )}
      {can(currentUser, 'view', 'quotes') && (
        <NavButton targetMode="cotizaciones" onClick={() => onClickHandler('cotizaciones')} currentMode={mode} currentUser={currentUser}><FileSpreadsheet size={18}/><span>Cotizaciones</span></NavButton>
      )}
      {can(currentUser, 'view', 'products') && (
        <NavButton targetMode="productos" onClick={() => onClickHandler('productos')} currentMode={mode} currentUser={currentUser}><Package size={18}/><span>Productos</span></NavButton>
      )}
      {can(currentUser, 'view', 'invoices') && (
        <NavButton targetMode="gastos" onClick={() => onClickHandler('gastos')} currentMode={mode} currentUser={currentUser}><Wallet size={18}/><span>Gastos</span></NavButton>
      )}

      <div className="border-t my-1 mx-2 border-slate-200"></div>

      <div className="px-4 pt-2 pb-1 text-xs font-semibold uppercase text-slate-400">Administración</div>
      {can(currentUser, 'view', 'customers') && (
        <NavButton targetMode="customers" onClick={() => onClickHandler('customers')} currentMode={mode} currentUser={currentUser}><User size={18} /><span>Clientes</span></NavButton>
      )}
      {can(currentUser, 'view', 'customer-map') && (
        <NavButton targetMode="customer-map" onClick={() => onClickHandler('customer-map')} currentMode={mode} currentUser={currentUser}><Map size={18} /><span>Mapa de Clientes</span></NavButton>
      )}
      {can(currentUser, 'view', 'staff') && (
        <NavButton targetMode="staff" onClick={() => onClickHandler('staff')} currentMode={mode} currentUser={currentUser}><Users size={18} /><span>Personal</span></NavButton>
      )}
      {can(currentUser, 'view', 'calendars') && (
        <NavButton targetMode="calendars" onClick={() => onClickHandler('calendars')} currentMode={mode} currentUser={currentUser}><CalendarDays size={18} /><span>Calendarios</span></NavButton>
      )}
      {can(currentUser, 'view', 'company-settings') && (
        <NavButton targetMode="company-settings" onClick={() => onClickHandler('company-settings')} currentMode={mode} currentUser={currentUser}><Building2 size={18}/><span>Datos de la Empresa</span></NavButton>
      )}
      {can(currentUser, 'view', 'access-keys') && (
        <NavButton targetMode="access-keys" onClick={() => onClickHandler('access-keys')} currentMode={mode} currentUser={currentUser}><Key size={18} /><span>Claves de Acceso</span></NavButton>
      )}
      {can(currentUser, 'view', 'secretary-performance') && (
        <NavButton targetMode="secretary-performance" onClick={() => onClickHandler('secretary-performance')} currentMode={mode} currentUser={currentUser}><Activity size={18}/><span>Rendimiento Sec.</span></NavButton>
      )}
      {can(currentUser, 'view', 'technician-performance') && (
        <NavButton targetMode="technician-performance" onClick={() => onClickHandler('technician-performance')} currentMode={mode} currentUser={currentUser}><BarChart3 size={18}/><span>Rendimiento Téc.</span></NavButton>
      )}
    </>
  );

  const AuthSection: React.FC<{ isMobile?: boolean }> = ({ isMobile }) => (
    <div className={`flex items-center gap-2 ${isMobile ? 'flex-col items-stretch space-y-4' : ''}`}>
      {!isGoogleConfigMissing && (
        <>
          {isSynced ? (
            <div className="flex items-center gap-2">
              <div className="text-right text-sm">
                  <div className="font-medium text-slate-800">{googleAuth.user?.name}</div>
                  <div className="text-slate-500">{googleAuth.user?.email}</div>
              </div>
              <button onClick={signOutFromGoogle} title="Desconectar" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                  <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button onClick={signInToGoogle} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all bg-white text-slate-700 border border-slate-300 hover:bg-slate-50">
              <img src="https://www.google.com/images/icons/product/calendar-32.png" alt="Google Calendar" className="h-4 w-4" />
              <span>Conectar Calendario</span>
            </button>
          )}
        </>
      )}
    </div>
  );

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-[1001]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left Side: Menu and Title */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(prev => !prev)}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-md"
                  aria-label="Abrir menú principal"
                >
                  {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                {isMenuOpen && (
                  <div className="absolute left-0 z-[9999] mt-2 w-72 max-w-[calc(100vw-2rem)] origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none flex flex-col max-h-[calc(100vh-5rem)]">
                     {/* Mobile-only header section in dropdown */}
                    <div className="p-4 space-y-4 border-b md:hidden flex-shrink-0">
                        <div className="text-center">
                            <p className="font-semibold">{currentUser?.name}</p>
                            <p className="text-sm text-slate-500">{currentUser?.email}</p>
                        </div>
                        <AuthSection isMobile />
                         <button onClick={signOut} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-red-600 bg-red-50 hover:bg-red-100">
                           <LogOut size={16} /> Cerrar Sesión
                        </button>
                    </div>
                    
                    {/* Navigation Links */}
                    <div className="py-1 overflow-y-auto">
                      {menuItems(handleNavClick)}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 min-w-0">
                <Wrench className="h-6 w-6 text-sky-500 flex-shrink-0" />
                <h1 className="text-xl font-bold text-slate-800 truncate" title={companyInfo.name}>{companyInfo.name}</h1>
              </div>
            </div>

            {/* Right Side (Desktop) */}
            <div className="hidden md:flex items-center gap-4">
               <div className="flex items-center gap-2 text-right min-w-0">
                 <div>
                    <p className="text-sm font-semibold text-slate-800 truncate">{currentUser?.name}</p>
                    <p className="text-xs text-slate-500 capitalize truncate">{currentUser?.role}</p>
                 </div>
                 <button onClick={signOut} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full" title="Cerrar Sesión">
                    <LogOut size={18} />
                 </button>
              </div>
              <div className="h-8 w-px bg-slate-200"></div>
              <AuthSection />
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
