// Lightweight module diagnostic to help detect load issues in dev
export function runModuleDiagnostic() {
  try {
    const routes = [
      '/finca',
      '/insumos',
      '/mip',
      '/trazabilidad',
      '/configuracion'
    ];
    console.log('🧪 ModuleDiagnostic: starting');
    console.log('🧪 Current URL:', window.location.href);
    console.log('🧪 Expected routes:', routes.join(', '));

    // Check environment
    console.log('🧪 import.meta.env.DEV:', (import.meta as any).env?.DEV);

    // Check network status
    console.log('🧪 navigator.onLine:', navigator.onLine);

    // Basic dynamic import test for a common component
    import('../components/Layout')
      .then(mod => {
        console.log('🧪 Layout module loaded:', Object.keys(mod));
      })
      .catch(err => {
        console.warn('⚠️ Layout dynamic import failed:', err?.message || err);
      });

    // Check IndexedDB availability
    const hasIndexedDB = !!window.indexedDB;
    console.log('🧪 IndexedDB available:', hasIndexedDB);

    // Listen for connection restore events and add network diagnostics
    const diagState = {
      networkErrors: [] as Array<{ type: string; message: string; ts: number }>,
      reloadAttempts: Number(sessionStorage.getItem('diag_reload_attempts') || '0'),
      lastErrorTs: 0,
      env: {
        VITE_API_URL: (import.meta as any).env?.VITE_API_URL,
        VITE_API_BASE_URL: (import.meta as any).env?.VITE_API_BASE_URL,
        DEV: (import.meta as any).env?.DEV
      },
      online: navigator.onLine
    };
    (window as any).__diagState = diagState;

    function isLikelyNetworkError(msg: string) {
      const m = (msg || '').toLowerCase();
      return (
        m.includes('err_network_changed') ||
        m.includes('err_aborted') ||
        m.includes('failed to fetch') ||
        m.includes('loading chunk') ||
        m.includes('chunkloaderror') ||
        m.includes('dynamically imported module') ||
        m.includes('net::')
      );
    }

    function recordNetworkError(type: string, message: string) {
      const entry = { type, message, ts: Date.now() };
      diagState.networkErrors.push(entry);
      diagState.lastErrorTs = entry.ts;
      console.warn('🧪 Network issue recorded:', entry);
    }

    function scheduleRecovery() {
      // Recovery disabled to avoid reload loops during development diagnostics
      console.log('🧪 Recovery disabled: no automatic reload will be performed');
      return;
    }

    // Monitor connection quality if available
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection && typeof connection.addEventListener === 'function') {
      connection.addEventListener('change', () => {
        console.log('🧪 Connection changed:', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        });
      });
    }

    // Global listeners to detect network-related loading errors
    window.addEventListener('error', (ev: ErrorEvent) => {
      const msg = ev.message || '';
      if (isLikelyNetworkError(msg)) {
        recordNetworkError('error', msg);
      }
    });

    window.addEventListener('unhandledrejection', (ev: PromiseRejectionEvent) => {
      const reason = (ev as any).reason;
      const msg = (typeof reason === 'string' ? reason : reason?.message) || '';
      if (isLikelyNetworkError(msg)) {
        recordNetworkError('unhandledrejection', msg);
      }
    });

    // React when custom connection events fire
    window.addEventListener('connection-restored', () => {
      console.log('🧪 connection-restored detected');
      (window as any).__diagState.online = true;
      scheduleRecovery();
    });

    window.addEventListener('connection-lost', () => {
      console.warn('🧪 connection-lost detected');
      (window as any).__diagState.online = false;
    });

    // Try another dynamic import commonly used
    import('../utils/offlineDB')
      .then(mod => {
        console.log('🧪 offlineDB module loaded:', Object.keys(mod));
      })
      .catch(err => {
        const msg = err?.message || String(err);
        if (isLikelyNetworkError(msg)) {
          recordNetworkError('import', msg);
        }
        console.warn('⚠️ offlineDB dynamic import failed:', msg);
      });

    console.log('🧪 VITE_API_URL:', (import.meta as any).env?.VITE_API_URL);
    console.log('🧪 VITE_API_BASE_URL:', (import.meta as any).env?.VITE_API_BASE_URL);

    // Initial post-boot recovery check
    if (navigator.onLine) {
      const recentErrors = diagState.networkErrors.filter(e => Date.now() - e.ts < 120_000);
      if (recentErrors.length > 0) {
        // Recovery disabled: skip calling scheduleRecovery to avoid reloads
        console.log('🧪 Skipping recovery due to disabled reload');
      }
    }

  } catch (err) {
    console.warn('⚠️ Error en runModuleDiagnostic:', (err as any)?.message || err);
  }
}

export function getModuleDiagState() {
  return (window as any).__diagState || { networkErrors: [], reloadAttempts: 0, lastErrorTs: 0, env: {}, online: navigator.onLine };
}

export function clearModuleDiagErrors() {
  const st = (window as any).__diagState;
  if (st?.networkErrors) {
    st.networkErrors.length = 0;
  }
}