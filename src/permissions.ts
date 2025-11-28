import { Staff, AppMode } from './types';

type Action = 'view' | 'navigate' | 'edit' | 'delete' | 'create';
type Resource = 'dashboard' | 'calendar' | 'my-orders' | 'technician-calendar' | 'unconfirmed-appointments' | 'maintenance' | 'invoices' | 'quotes' | 'products' | 'bank-accounts' | 'customers' | 'customer-map' | 'staff' | 'workshop' | 'calendars' | 'company-settings' | 'access-keys' | 'secretary-performance' | 'technician-performance' | 'any-mode';

export function can(user: Staff | null, action: Action, resource: Resource): boolean {
  const role = user?.role;
  if (!role) return false;

  // Admin full access
  if (role === 'administrador') return true;

  // Coordinador: similar a admin excepto access-keys and performance?
  if (role === 'coordinador') {
    if (resource === 'access-keys') return false;
    return true;
  }

  // Secretaria: sin acceder a staff, access-keys, performance avanzado
  if (role === 'secretaria') {
    const allowed: Resource[] = [
      'dashboard', 'calendar', 'unconfirmed-appointments', 'maintenance', 'invoices', 'quotes', 'products', 'bank-accounts', 'customers', 'customer-map', 'workshop', 'calendars', 'company-settings'
    ];
    return allowed.includes(resource);
  }

  // Técnico: mis órdenes, calendario técnico y citas por confirmar
  if (role === 'tecnico') {
    const allowed: Resource[] = ['my-orders', 'technician-calendar', 'unconfirmed-appointments'];
    return allowed.includes(resource);
  }

  return false;
}

export function canViewMode(user: Staff | null, mode: AppMode): boolean {
  const modeToResourceMap: Record<AppMode, Resource> = {
    'inicio': 'dashboard',
    'calendar': 'calendar',
    'my-orders': 'my-orders',
    'staff': 'staff',
    'calendars': 'calendars',
    'customers': 'customers',
    'technician-calendar': 'technician-calendar',
    'unconfirmed-appointments': 'unconfirmed-appointments',
    'access-keys': 'access-keys',
    'maintenance-schedules': 'maintenance',
    'secretary-performance': 'secretary-performance',
    'technician-performance': 'technician-performance',
    'workshop-equipment': 'workshop',
    'company-settings': 'company-settings',
    'customer-map': 'customer-map',
    'facturacion': 'invoices',
    'facturacion-form': 'invoices',
    'cotizaciones': 'quotes',
    'productos': 'products',
    'cuentas-bancarias': 'bank-accounts',
  };
  const resource = modeToResourceMap[mode];
  return can(user, 'view', resource);
}