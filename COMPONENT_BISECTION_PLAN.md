# Plan de Identificación del Componente Problemático

## Componentes Eliminados (Sospechosos)

Del `App.minimal.tsx` al `App.ultra.tsx`, eliminamos:

1. **Eager Imports de Páginas**:
   - `LandingPage` from "@/pages/LandingPage"
   - `LoginUniversal` from "@/pages/LoginUniversal"  
   - `ProtectedHome` from "@/pages/ProtectedHome"

2. **Service Utilities**:
   - `offlineDB` from "./utils/offlineDB"
   - `syncManager` from "./utils/syncManager"
   - `PERMISSIONS` from "@/hooks/usePermissions"
   - `notificationManager` from "./utils/notificationManager"
   - `DEVICE_DETECTION` from "./utils/pwaConfig"
   - `initializeSampleData` from "./utils/sampleData"
   - `pushNotificationService` from "./services/pushNotificationService"
   - `cloudInitializer` from "./services/cloudInitializer"

3. **Componente**:
   - `RootRedirect` from "./components/RootRedirect"

4. **useEffect Logic**: Todo el código de inicialización PWA

## Estrategia de Bisección

### Fase 1: Identificar Categoría
1. Agregar SOLO service utilities (sin usar en render)
2. Si falla → el problema está en service utilities
3. Si pasa → agregar páginas

### Fase 2: Identificar Servicio Específico (si Fase 1 falla)
Agregar services de uno en uno:
1. offlineDB
2. syncManager  
3. PERMISSIONS
4. notificationManager
5. DEVICE_DETECTION
6. initializeSampleData
7. pushNotificationService
8. cloudInitializer

### Fase 3: Identificar Página Específica (si Fase 1 pasa)
Agregar páginas de una en una:
1. RootRedirect
2. LandingPage
3. LoginUniversal
4. ProtectedHome

### Fase 4: Uso en Render
Una vez identificado qué imports funcionan, agregar su uso en el render/useEffect.

## Comandos de Build
```bash
# Local test
.\node_modules\.bin\vite build > build_log_test.txt 2>&1

# Deploy if successful
node scripts/deploy/deploy-auto.cjs
```

## Estado Actual
- ✅ Ultra-minimal desplegado y funcionando
- ⏳ Próximo paso: Agregar service utilities
