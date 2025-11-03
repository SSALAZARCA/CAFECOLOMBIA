import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TileLayer } from 'react-leaflet';

interface TileLayerConfig {
  url: string;
  attribution: string;
  name: string;
}

interface FallbackTileLayerProps {
  primaryLayer: TileLayerConfig;
  fallbackLayer: TileLayerConfig;
  onFallbackActivated?: (reason: string) => void;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

export const FallbackTileLayer: React.FC<FallbackTileLayerProps> = ({
  primaryLayer,
  fallbackLayer,
  onFallbackActivated,
  maxRetries = 3,
  retryDelay = 2000,
  timeout = 5000
}) => {
  const [currentLayer, setCurrentLayer] = useState<TileLayerConfig>(primaryLayer);
  const [retryCount, setRetryCount] = useState(0);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastError, setLastError] = useState<string | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const testAbortControllerRef = useRef<AbortController | null>(null);

  // Función mejorada para probar si una URL de tile está disponible
  const testTileUrl = useCallback(async (baseUrl: string): Promise<boolean> => {
    // Cancelar cualquier test anterior
    if (testAbortControllerRef.current) {
      testAbortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    testAbortControllerRef.current = abortController;

    try {
      // Si estamos offline, no intentar la prueba
      if (!navigator.onLine) {
        console.warn('🌐 Offline mode detected, skipping tile test');
        return false;
      }

      // Crear múltiples URLs de prueba para mayor confiabilidad
      const testUrls = [
        baseUrl.replace('{z}', '1').replace('{x}', '0').replace('{y}', '0').replace('{s}', 'a'),
        baseUrl.replace('{z}', '2').replace('{x}', '1').replace('{y}', '1').replace('{s}', 'b'),
        baseUrl.replace('{z}', '0').replace('{x}', '0').replace('{y}', '0').replace('{s}', 'c')
      ];

      // Probar con la primera URL
      const testUrl = testUrls[0];
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), timeout);
      });

      const fetchPromise = fetch(testUrl, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
        signal: abortController.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      await Promise.race([fetchPromise, timeoutPromise]);
      
      console.log(`✅ Tile test successful for ${baseUrl}`);
      return true;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('🚫 Tile test aborted');
        return false;
      }
      
      const errorMessage = error.message || 'Unknown error';
      console.warn(`❌ Tile test failed for ${baseUrl}:`, errorMessage);
      setLastError(errorMessage);
      return false;
    }
  }, [timeout]);

  // Función para cambiar al fallback con mejor logging
  const activateFallback = useCallback((reason: string) => {
    if (!isUsingFallback) {
      console.warn(`🔄 Activating fallback tile layer: ${reason}`);
      setCurrentLayer(fallbackLayer);
      setIsUsingFallback(true);
      setLastError(reason);
      onFallbackActivated?.(reason);
    }
  }, [isUsingFallback, fallbackLayer, onFallbackActivated]);

  // Función mejorada para manejar errores de tiles
  const handleTileError = useCallback(() => {
    if (!isUsingFallback && retryCount < maxRetries) {
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      
      console.warn(`🔄 Tile error, retry ${newRetryCount}/${maxRetries}`);
      
      // Limpiar timeout anterior si existe
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      // Reintentar después del delay con backoff exponencial
      const backoffDelay = retryDelay * Math.pow(2, newRetryCount - 1);
      retryTimeoutRef.current = setTimeout(() => {
        console.log(`🔄 Retrying primary layer (attempt ${newRetryCount})`);
        // Forzar recarga del componente con un nuevo key
        setCurrentLayer({ ...primaryLayer, name: `${primaryLayer.name}-retry-${newRetryCount}` });
      }, backoffDelay);
    } else if (!isUsingFallback) {
      activateFallback(`Primary layer failed after ${maxRetries} retries. Last error: ${lastError || 'Unknown'}`);
    }
  }, [isUsingFallback, retryCount, maxRetries, retryDelay, primaryLayer, activateFallback, lastError]);

  // Función para intentar volver al layer primario
  const attemptPrimaryRecovery = useCallback(async () => {
    if (isUsingFallback && navigator.onLine) {
      console.log('🔄 Attempting to recover primary layer...');
      const isAvailable = await testTileUrl(primaryLayer.url);
      if (isAvailable) {
        console.log('✅ Primary layer recovered, switching back');
        setCurrentLayer(primaryLayer);
        setIsUsingFallback(false);
        setRetryCount(0);
        setLastError(null);
      }
    }
  }, [isUsingFallback, primaryLayer, testTileUrl]);

  // Monitorear estado de conexión
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Connection restored');
      setIsOnline(true);
      // Intentar recuperar el layer primario después de un breve delay
      setTimeout(attemptPrimaryRecovery, 1000);
    };

    const handleOffline = () => {
      console.log('🌐 Connection lost');
      setIsOnline(false);
      if (!isUsingFallback) {
        activateFallback('Network connection lost');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isUsingFallback, activateFallback, attemptPrimaryRecovery]);

  // Probar la disponibilidad del layer primario al montar
  useEffect(() => {
    const checkPrimaryLayer = async () => {
      if (!isOnline) {
        activateFallback('Device is offline');
        return;
      }

      console.log('🔍 Testing primary layer availability...');
      const isAvailable = await testTileUrl(primaryLayer.url);
      if (!isAvailable) {
        activateFallback('Primary layer not available on mount');
      } else {
        console.log('✅ Primary layer is available');
      }
    };

    // Solo probar si no estamos ya usando el fallback
    if (!isUsingFallback) {
      checkPrimaryLayer();
    }
  }, [primaryLayer.url, isUsingFallback, isOnline, testTileUrl, activateFallback]);

  // Detectar errores de red para tiles específicos con mejor filtrado
  useEffect(() => {
    const handleTileLoadError = (event: any) => {
      // Verificar si el error es de nuestros tile layers
      if (event.target && event.target.src) {
        const src = event.target.src;
        const isOurTile = src.includes('arcgisonline.com') || 
                         src.includes('openstreetmap.org') || 
                         src.includes('cartocdn.com') ||
                         src.includes('google.com');
        
        if (isOurTile) {
          console.warn('🚫 Tile load error detected:', src);
          handleTileError();
        }
      }
    };

    // Escuchar errores de imágenes (tiles) en fase de captura
    document.addEventListener('error', handleTileLoadError, true);

    return () => {
      document.removeEventListener('error', handleTileLoadError, true);
    };
  }, [handleTileError]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (testAbortControllerRef.current) {
        testAbortControllerRef.current.abort();
      }
    };
  }, []);

  // Intentar recuperación periódica si estamos usando fallback
  useEffect(() => {
    if (isUsingFallback && isOnline) {
      const recoveryInterval = setInterval(attemptPrimaryRecovery, 30000); // Cada 30 segundos
      return () => clearInterval(recoveryInterval);
    }
  }, [isUsingFallback, isOnline, attemptPrimaryRecovery]);

  return (
    <TileLayer
      key={`${currentLayer.name}-${isUsingFallback ? 'fallback' : 'primary'}-${retryCount}`}
      url={currentLayer.url}
      attribution={currentLayer.attribution}
      errorTileUrl="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2Y3ZjdmNyIgc3Ryb2tlPSIjZGRkIiBzdHJva2Utd2lkdGg9IjEiLz48dGV4dCB4PSI1MCUiIHk9IjQ1JSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5OTkiPk1hcGE8L3RleHQ+PHRleHQgeD0iNTAlIiB5PSI2MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmaWxsPSIjOTk5Ij5ObyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg=="
      maxZoom={18}
      minZoom={1}
      // Propiedades adicionales para mejor manejo de errores
      keepBuffer={2}
      updateWhenZooming={false}
      updateWhenIdle={true}
    />
  );
};

// Configuraciones predefinidas mejoradas para diferentes tipos de mapas
export const TILE_LAYER_CONFIGS = {
  ARCGIS_SATELLITE: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    name: "ArcGIS Satellite"
  },
  OPENSTREETMAP: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    name: "OpenStreetMap"
  },
  CARTO_VOYAGER: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    name: "CARTO Voyager"
  },
  // Fallback satelital alternativo usando Google (sin API key requerida para tiles básicos)
  GOOGLE_SATELLITE: {
    url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    attribution: '&copy; <a href="https://www.google.com/maps">Google</a>',
    name: "Google Satellite"
  },
  // Fallback adicional usando OpenTopoMap
  OPEN_TOPO_MAP: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    name: "OpenTopoMap"
  },
  // Fallback local/offline usando tiles en blanco
  OFFLINE_FALLBACK: {
    url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2Y5ZmFmYiIgc3Ryb2tlPSIjZTVlN2ViIiBzdHJva2Utd2lkdGg9IjEiLz48dGV4dCB4PSI1MCUiIHk9IjYwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2YjcyODAiPk1vZG8gT2ZmbGluZTwvdGV4dD48dGV4dCB4PSI1MCUiIHk9IjYwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM5Y2EzYWYiPk1hcGEgbm8gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=",
    attribution: 'Modo Offline',
    name: "Offline Mode"
  }
};

export default FallbackTileLayer;