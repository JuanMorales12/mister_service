<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Mister Service - Sistema de Gestión de Servicios

Sistema de gestión de órdenes de servicio técnico con integración de Firebase, Google Calendar y geolocalización.

View your app in AI Studio: https://ai.studio/apps/drive/1AhyVGXzLmQrw61M1OgKOSC9nusnn7Qxm

## Características

- ✅ Gestión de órdenes de servicio técnico
- ✅ Sistema de autenticación con Firebase Auth
- ✅ Sincronización en tiempo real con Firebase Firestore
- ✅ Integración con Google Calendar
- ✅ Geolocalización de servicios con Leaflet Maps
- ✅ Gestión de clientes y personal
- ✅ Historial de servicios
- ✅ Formulario público para solicitud de servicios
- ✅ Interfaz intuitiva y responsive

## Tecnologías

- **Frontend**: React 19 + TypeScript + Vite
- **Backend/DB**: Firebase (Firestore, Auth)
- **Mapas**: Leaflet
- **IA**: Google Gemini API
- **Iconos**: Lucide React

## Run Locally

**Prerequisites:**  Node.js (v18 o superior)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configurar variables de entorno**:

   Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

   Luego edita el archivo [.env](.env) y agrega tus credenciales:
   ```env
   GEMINI_API_KEY=tu_gemini_api_key_aqui

   # Firebase Configuration
   VITE_FIREBASE_API_KEY=tu_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=tu_project_id
   VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
   VITE_FIREBASE_APP_ID=tu_app_id
   VITE_FIREBASE_MEASUREMENT_ID=tu_measurement_id
   ```

3. **Run the app**:
   ```bash
   npm run dev
   ```

   La aplicación estará disponible en [http://localhost:5173](http://localhost:5173)

## Configuración de Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilita **Authentication** (Email/Password)
3. Habilita **Firestore Database**
4. Copia las credenciales de configuración al archivo `.env`

### Estructura de Firestore

El sistema utiliza un documento principal en la colección `appState`:
- `appState/main`: Contiene todo el estado sincronizado de la aplicación
  - `customers`: Array de clientes
  - `serviceOrders`: Array de órdenes de servicio
  - `staff`: Array de personal
  - `lastServiceOrderNumber`: Último número de orden generado

### Reglas de Seguridad de Firestore

Configura las siguientes reglas en Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /appState/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Genera la build de producción en `dist/`
- `npm run preview` - Previsualiza la build de producción localmente

## Deployment

### Vercel

1. Instala Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Despliega:
   ```bash
   vercel
   ```

3. **Configura las variables de entorno** en el dashboard de Vercel:
   - Ve a tu proyecto > Settings > Environment Variables
   - Agrega todas las variables del archivo `.env`

### Netlify

1. Instala Netlify CLI:
   ```bash
   npm i -g netlify-cli
   ```

2. Despliega:
   ```bash
   netlify deploy --prod
   ```

3. **Configura las variables de entorno** en el dashboard de Netlify:
   - Ve a Site settings > Environment variables
   - Agrega todas las variables del archivo `.env`

### Firebase Hosting

1. Instala Firebase CLI:
   ```bash
   npm i -g firebase-tools
   ```

2. Inicializa Firebase:
   ```bash
   firebase init hosting
   ```

   Selecciona:
   - Directory: `dist`
   - Single-page app: `Yes`
   - GitHub actions: Opcional

3. Build y deploy:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

**⚠️ Importante**: Para cualquier plataforma de deployment, debes configurar las variables de entorno manualmente en el panel de configuración de la plataforma.

## Estructura del Proyecto

```
Mister service/
├── src/
│   ├── App.tsx              # Componente principal
│   ├── types.ts             # Definiciones de tipos TypeScript
│   ├── permissions.ts       # Sistema de permisos
│   └── vite-env.d.ts        # Tipos de variables de entorno
├── services/
│   └── firebaseService.ts   # Servicio de Firebase
├── public/                  # Archivos estáticos
├── .env                     # Variables de entorno (NO subir a git)
├── .env.example             # Ejemplo de variables de entorno
├── .gitignore
├── package.json
└── README.md
```

## Seguridad

- **NUNCA** subas el archivo `.env` a git (ya está en `.gitignore`)
- Las credenciales de Firebase son públicas en el frontend (es normal para aplicaciones web)
- Usa las reglas de seguridad de Firestore para proteger tus datos
- Solo usuarios autenticados pueden leer/escribir en la base de datos

## Funcionalidades Principales

### Gestión de Órdenes de Servicio
- Crear, editar y cancelar órdenes
- Estados: Por Confirmar, Confirmada, En Proceso, Completada, Cancelada
- Historial de cambios por cada orden
- Numeración automática (OS-0001, OS-0002, etc.)

### Gestión de Clientes
- Registro automático desde formulario público
- Historial de servicios por cliente
- Información de contacto y ubicación

### Formulario Público
- Los clientes pueden solicitar servicios sin autenticación
- Geolocalización automática
- Validación de datos

### Sincronización en Tiempo Real
- Todos los cambios se sincronizan automáticamente con Firebase
- Múltiples usuarios pueden trabajar simultáneamente

## Troubleshooting

### Error: Firebase not initialized
- Verifica que las variables de entorno estén configuradas correctamente en el archivo `.env`
- Asegúrate de que el archivo `.env` esté en la raíz del proyecto
- Reinicia el servidor de desarrollo (`npm run dev`)

### Error: Permission denied
- Verifica las reglas de seguridad en Firestore
- Asegúrate de estar autenticado en la aplicación

### Error: Module not found
- Ejecuta `npm install` para instalar todas las dependencias

## Licencia

Este proyecto es privado y confidencial.

---

Desarrollado con React + TypeScript + Firebase
