import React, { useState, useContext, useEffect } from 'react';
import { AppContext, AppContextType, Staff, StaffRole, CalendarViewType } from '../src/types';
import { X, Save, Camera, AlertCircle, CheckCircle, Loader2, Calendar } from 'lucide-react';

interface EmployeeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffMember: Staff | null;
  mode: 'create' | 'view' | 'edit';
}

const initialFormState: Omit<Staff, 'id' | 'calendarId' | 'accessKey'> = {
    name: '',
    email: '',
    role: 'tecnico',
    code: '',
    idNumber: '',
    address: '',
    personalPhone: '',
    fleetPhone: '',
    salary: 0,
    startDate: '',
    tss: 0,
    afp: 0,
    idPhotoUrl: '',
    employeePhotoUrl: '',
    allowedCalendarViews: ['day'] // Por defecto solo vista de día
};

// --- Sub-components defined outside the main component to prevent re-creation on re-render ---

const InputField: React.FC<{
  label: string;
  name: keyof Omit<Staff, 'id' | 'calendarId' | 'accessKey'>;
  value: string | number | readonly string[] | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  readOnly?: boolean;
  required?: boolean;
}> = ({ label, name, value, onChange, type = 'text', readOnly = false, required = false }) => (
    <div>
        <label htmlFor={name} className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
        <input type={type} id={name} name={name} value={value || ''} onChange={onChange} readOnly={readOnly} required={required} className="input-style"/>
    </div>
);

const NumberField: React.FC<{
  label: string;
  name: keyof Omit<Staff, 'id' | 'calendarId' | 'accessKey'>;
  value: string | number | readonly string[] | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
}> = ({ label, name, value, onChange, readOnly = false }) => (
    <div>
        <label htmlFor={name} className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
        <input type="number" id={name} name={name} value={value || 0} onChange={onChange} readOnly={readOnly} className="input-style"/>
    </div>
);

const SelectField: React.FC<{
  label: string;
  name: keyof Omit<Staff, 'id' | 'calendarId' | 'accessKey'>;
  value: string | number | readonly string[] | undefined;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: readonly string[];
  readOnly?: boolean;
}> = ({ label, name, value, onChange, options, readOnly = false }) => (
    <div>
        <label htmlFor={name} className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
        <select id={name} name={name} value={value || ''} onChange={onChange} disabled={readOnly} className="input-style">
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

const PhotoUpload: React.FC<{
  label: string;
  field: 'idPhotoUrl' | 'employeePhotoUrl';
  value: string | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
}> = ({ label, field, value, onChange, readOnly = false }) => (
    <div className="flex flex-col items-center p-4 bg-slate-100 rounded-lg h-48 justify-center">
        <p className="font-semibold text-slate-700 mb-2">{label}</p>
        <div className="w-32 h-32 bg-slate-300 rounded-md flex items-center justify-center overflow-hidden">
            {value ? (
                 <img src={value} alt={label} className="w-full h-full object-cover" />
            ) : (
                <div className="text-center text-slate-500">
                    <Camera size={32}/>
                    <p className="text-xs mt-1">NO PHOTO AVAILABLE</p>
                </div>
            )}
        </div>
        {!readOnly && (
            <div className="mt-2">
                <label htmlFor={field} className="cursor-pointer text-sm text-sky-600 bg-white border border-sky-600 rounded-md px-3 py-1 hover:bg-sky-50">
                    Seleccionar archivo
                </label>
                <input type="file" id={field} name={field} accept="image/*" onChange={onChange} className="hidden"/>
            </div>
        )}
    </div>
);

// --- Main Component ---

export const EmployeeDetailsModal: React.FC<EmployeeDetailsModalProps> = ({ isOpen, onClose, staffMember, mode }) => {
  const { addStaff, updateStaff, currentUser, changeStaffPassword } = useContext(AppContext) as AppContextType;
  const [formState, setFormState] = useState(initialFormState);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isReadOnly = mode === 'view';
  const isCreateMode = mode === 'create';

  useEffect(() => {
    if (isOpen) {
      if (staffMember && (mode === 'edit' || mode === 'view')) {
        setFormState({
            ...initialFormState,
            ...staffMember
        });
      } else {
        setFormState(initialFormState);
      }
      setPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowPasswordChange(false);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, staffMember, mode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value === '' ? 0 : parseFloat(value) }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'idPhotoUrl' | 'employeePhotoUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormState(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCalendarViewToggle = (view: CalendarViewType) => {
    setFormState(prev => {
      const currentViews = prev.allowedCalendarViews || ['day'];
      if (currentViews.includes(view)) {
        // No permitir quitar todas las vistas - mantener al menos una
        if (currentViews.length === 1) return prev;
        return { ...prev, allowedCalendarViews: currentViews.filter(v => v !== view) };
      } else {
        return { ...prev, allowedCalendarViews: [...currentViews, view] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
        if (mode === 'create') {
            if (!formState.email || !password) {
                setError("El correo y la contraseña son obligatorios para crear un usuario.");
                return;
            }
            if (password.length < 6) {
                setError("La contraseña debe tener al menos 6 caracteres.");
                return;
            }
            if (password !== confirmPassword) {
                setError("Las contraseñas no coinciden.");
                return;
            }
            try {
                await addStaff(formState, password);
                setSuccess("Empleado creado exitosamente.");
                setTimeout(() => onClose(), 1500);
            } catch (err: any) {
                setError(err.message);
            }
        } else if (mode === 'edit' && staffMember) {
            // Si se está cambiando la contraseña
            if (showPasswordChange && newPassword) {
                if (!currentPassword) {
                    setError("Debes ingresar la contraseña actual del empleado.");
                    return;
                }
                if (newPassword.length < 6) {
                    setError("La nueva contraseña debe tener al menos 6 caracteres.");
                    return;
                }
                if (newPassword !== confirmNewPassword) {
                    setError("Las nuevas contraseñas no coinciden.");
                    return;
                }
                try {
                    await changeStaffPassword(formState.email, currentPassword, newPassword);
                } catch (err: any) {
                    setError("Error al cambiar la contraseña: " + err.message);
                    return;
                }
            }

            // Actualizar los datos del empleado
            const { email, ...updatableData } = formState; // Email cannot be updated
            await updateStaff(staffMember.id, updatableData);
            setSuccess(showPasswordChange && newPassword ? "Empleado actualizado y contraseña cambiada exitosamente." : "Empleado actualizado exitosamente.");
            setTimeout(() => onClose(), 1500);
        }
    } finally {
        setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl relative max-h-[95vh] flex flex-col">
        <header className="relative p-4 border-b">
            <h2 className="text-xl font-bold text-slate-800 pr-10">
                {mode === 'create' && 'Agregar Empleado'}
                {mode === 'edit' && 'Editar Empleado'}
                {mode === 'view' && 'Detalles del Empleado'}
            </h2>
            <button type="button" onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-800">
              <X size={20} />
            </button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col flex-grow min-h-0">
            <main className="p-6 overflow-y-auto">
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-md flex items-center gap-3" role="alert">
                        <AlertCircle className="h-5 w-5"/>
                        <div>
                            <p className="font-bold">Error</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                )}
                {success && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded-md flex items-center gap-3" role="alert">
                        <CheckCircle className="h-5 w-5"/>
                        <div>
                            <p className="font-bold">Éxito</p>
                            <p className="text-sm">{success}</p>
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        {/* Auth Info */}
                        <div className={`p-4 border rounded-md ${isCreateMode ? 'bg-sky-50 border-sky-200' : 'bg-slate-50'}`}>
                            <h3 className={`text-lg font-semibold mb-2 ${isCreateMode ? 'text-sky-800' : 'text-slate-600'}`}>Credenciales de Acceso</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-3">
                                    <label htmlFor="email" className="block text-xs font-medium text-slate-600 mb-1">Correo Electrónico (para iniciar sesión)</label>
                                    <input type="email" id="email" name="email" value={formState.email} onChange={handleInputChange} required className="input-style" readOnly={!isCreateMode}/>
                                </div>
                                {isCreateMode && (
                                    <>
                                        <div>
                                            <label htmlFor="password" className="block text-xs font-medium text-slate-600 mb-1">Contraseña</label>
                                            <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required className="input-style"/>
                                        </div>
                                        <div>
                                            <label htmlFor="confirmPassword" className="block text-xs font-medium text-slate-600 mb-1">Confirmar Contraseña</label>
                                            <input type="password" id="confirmPassword" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="input-style"/>
                                        </div>
                                    </>
                                )}
                                {mode === 'edit' && currentUser?.role === 'administrador' && !isReadOnly && (
                                    <div className="md:col-span-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswordChange(!showPasswordChange)}
                                            className="text-sm text-sky-600 hover:text-sky-800 font-medium"
                                        >
                                            {showPasswordChange ? '✕ Cancelar cambio de contraseña' : '🔑 Cambiar contraseña'}
                                        </button>
                                        {showPasswordChange && (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                                                <div>
                                                    <label htmlFor="currentPassword" className="block text-xs font-medium text-slate-600 mb-1">Contraseña Actual</label>
                                                    <input
                                                        type="password"
                                                        id="currentPassword"
                                                        value={currentPassword}
                                                        onChange={e => setCurrentPassword(e.target.value)}
                                                        className="input-style"
                                                        placeholder="Contraseña actual del empleado"
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor="newPassword" className="block text-xs font-medium text-slate-600 mb-1">Nueva Contraseña</label>
                                                    <input
                                                        type="password"
                                                        id="newPassword"
                                                        value={newPassword}
                                                        onChange={e => setNewPassword(e.target.value)}
                                                        className="input-style"
                                                        placeholder="Mínimo 6 caracteres"
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor="confirmNewPassword" className="block text-xs font-medium text-slate-600 mb-1">Confirmar Nueva Contraseña</label>
                                                    <input
                                                        type="password"
                                                        id="confirmNewPassword"
                                                        value={confirmNewPassword}
                                                        onChange={e => setConfirmNewPassword(e.target.value)}
                                                        className="input-style"
                                                        placeholder="Repetir nueva contraseña"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Fila 1 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InputField label="Codigo" name="code" value={formState.code} onChange={handleInputChange} readOnly={isReadOnly}/>
                            <InputField label="Identificacion" name="idNumber" value={formState.idNumber} onChange={handleInputChange} readOnly={isReadOnly}/>
                            <InputField label="Nombre" name="name" value={formState.name} onChange={handleInputChange} readOnly={isReadOnly}/>
                        </div>
                        {/* Fila 2 */}
                        <div className="grid grid-cols-1 gap-4">
                            <InputField label="Direccion" name="address" value={formState.address} onChange={handleInputChange} readOnly={isReadOnly}/>
                        </div>
                        {/* Fila 3 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="Telefono" name="personalPhone" value={formState.personalPhone} onChange={handleInputChange} readOnly={isReadOnly}/>
                            <InputField label="Celular" name="fleetPhone" value={formState.fleetPhone} onChange={handleInputChange} readOnly={isReadOnly}/>
                        </div>
                        {/* Fila 4: Cargo y datos de nómina básicos */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <SelectField label="Cargo" name="role" value={formState.role} onChange={handleInputChange} options={['administrador', 'coordinador', 'tecnico', 'secretaria']} readOnly={isReadOnly}/>
                            <NumberField label="Salario" name="salary" value={formState.salary} onChange={handleNumberChange} readOnly={isReadOnly}/>
                            <InputField label="Fecha de Entrada" name="startDate" type="date" value={formState.startDate} onChange={handleInputChange} readOnly={isReadOnly}/>
                            <NumberField label="TSS" name="tss" value={formState.tss} onChange={handleNumberChange} readOnly={isReadOnly}/>
                            <NumberField label="AFP" name="afp" value={formState.afp} onChange={handleNumberChange} readOnly={isReadOnly}/>
                        </div>
                        {/* Configuración de Vistas del Calendario (solo para técnicos) */}
                        {(formState.role === 'tecnico') && currentUser?.role === 'administrador' && (
                            <div className="p-4 border rounded-md bg-sky-50 border-sky-200">
                                <h3 className="text-sm font-semibold text-sky-800 mb-3 flex items-center gap-2">
                                    <Calendar size={16} />
                                    Vistas de Calendario Permitidas
                                </h3>
                                <p className="text-xs text-slate-600 mb-3">Selecciona las vistas del calendario a las que este técnico tendrá acceso. Debe haber al menos una vista seleccionada.</p>
                                <div className="flex flex-wrap gap-3">
                                    {([
                                        { view: 'day' as CalendarViewType, label: 'Día', description: 'Vista de un solo día' },
                                        { view: 'week' as CalendarViewType, label: 'Semana', description: 'Vista de semana completa' },
                                        { view: 'month' as CalendarViewType, label: 'Mes', description: 'Vista mensual' }
                                    ]).map(({ view, label, description }) => {
                                        const isSelected = (formState.allowedCalendarViews || ['day']).includes(view);
                                        return (
                                            <button
                                                key={view}
                                                type="button"
                                                onClick={() => !isReadOnly && handleCalendarViewToggle(view)}
                                                disabled={isReadOnly}
                                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex flex-col items-start ${
                                                    isSelected
                                                        ? 'bg-sky-600 text-white'
                                                        : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
                                                } ${isReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                                                title={description}
                                            >
                                                <span>{label}</span>
                                                <span className={`text-xs ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>{description}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                        <PhotoUpload label="Foto Empleado" field="employeePhotoUrl" value={formState.employeePhotoUrl} onChange={(e) => handleFileChange(e, 'employeePhotoUrl')} readOnly={isReadOnly}/>
                        <PhotoUpload label="Foto Identificacion" field="idPhotoUrl" value={formState.idPhotoUrl} onChange={(e) => handleFileChange(e, 'idPhotoUrl')} readOnly={isReadOnly}/>
                    </div>
                </div>
            </main>
            
            <footer className="flex justify-end gap-4 p-4 border-t bg-slate-50">
                <button type="button" onClick={onClose} disabled={isSaving} className="px-5 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isReadOnly ? 'Cerrar' : 'Cancelar'}
                </button>
                {!isReadOnly && (
                    <button type="submit" disabled={isSaving} className="px-5 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                        {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                        {isSaving ? 'Guardando...' : (mode === 'create' ? 'Crear Empleado' : 'Guardar Cambios')}
                    </button>
                )}
            </footer>
        </form>
        <style>{`.input-style { color: #0f172a; display: block; width: 100%; padding: 0.5rem 0.75rem; background-color: white; border: 1px solid #cbd5e1; border-radius: 0.375rem; box-shadow: sm; placeholder-slate-400; font-size: 0.875rem; focus:outline-none focus:ring-sky-500 focus:border-sky-500; } .input-style:read-only, .input-style:disabled { background-color: #f1f5f9; cursor: not-allowed; color: #64748b; }`}</style>
      </div>
    </div>
  );
};
