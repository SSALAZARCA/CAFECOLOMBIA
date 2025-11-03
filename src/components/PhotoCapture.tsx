import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Camera, 
  MapPin, 
  Upload, 
  X, 
  Download,
  Eye,
  RotateCcw,
  Maximize,
  Clock,
  Compass,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertTriangle,
  Brain,
  Zap,
  Settings,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { useAINotifications } from '@/hooks/useAINotifications';
import { offlineDB } from '@/utils/offlineDB';

// AI Analysis Metadata Interface
interface AIAnalysisMetadata {
  enableAIAnalysis: boolean;
  analysisTypes: ('phytosanitary' | 'pest_prediction' | 'optimization')[];
  priority: 'low' | 'medium' | 'high';
  autoAnalyze: boolean;
  plantPart?: 'leaf' | 'stem' | 'fruit' | 'root' | 'flower' | 'whole_plant';
  imageQuality?: 'excellent' | 'good' | 'fair' | 'poor';
  lightingConditions?: 'natural' | 'artificial' | 'mixed' | 'poor';
  focusQuality?: 'sharp' | 'slightly_blurred' | 'blurred';
}

interface PhotoMetadata {
  id: string;
  filename: string;
  url: string;
  thumbnail: string;
  timestamp: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number;
  };
  deviceInfo: {
    userAgent: string;
    platform: string;
    language: string;
  };
  pestType?: string;
  lotId?: string;
  severity?: number;
  description?: string;
  syncStatus: 'PENDING' | 'SYNCED' | 'ERROR';
  size: number;
  format: string;
  // AI-specific fields
  aiMetadata?: AIAnalysisMetadata;
  aiAnalysisStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  aiAnalysisResults?: any[];
  confidenceScore?: number;
  processingTime?: number;
}

interface PhotoCaptureProps {
  pestType?: string;
  lotId?: string;
  onPhotoCapture?: (photo: PhotoMetadata) => void;
  onPhotosChange?: (photos: PhotoMetadata[]) => void;
  onAIAnalysisComplete?: (photo: PhotoMetadata, results: any[]) => void;
  maxPhotos?: number;
  enableGeolocation?: boolean;
  enableOfflineMode?: boolean;
  // AI-specific props
  enableAIAnalysis?: boolean;
  defaultAnalysisTypes?: ('phytosanitary' | 'pest_prediction' | 'optimization')[];
  autoAnalyze?: boolean;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  pestType,
  lotId,
  onPhotoCapture,
  onPhotosChange,
  onAIAnalysisComplete,
  maxPhotos = 5,
  enableGeolocation = true,
  enableOfflineMode = true,
  enableAIAnalysis = true,
  defaultAnalysisTypes = ['phytosanitary'],
  autoAnalyze = false
}) => {
  const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoMetadata | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'DISABLED' | 'REQUESTING' | 'GRANTED' | 'DENIED'>('DISABLED');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // AI-specific state
  const [aiSettings, setAiSettings] = useState<AIAnalysisMetadata>({
    enableAIAnalysis,
    analysisTypes: defaultAnalysisTypes,
    priority: 'medium',
    autoAnalyze,
    plantPart: 'leaf'
  });
  const [showAISettings, setShowAISettings] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<Record<string, number>>({});
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { notifyPhytosanitaryResult } = useAINotifications();

  // Load stored photos on component mount
  useEffect(() => {
    loadStoredPhotos();
    
    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingPhotos();
    };
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load photos from localStorage
  // Cargar fotos almacenadas localmente
  const loadStoredPhotos = async () => {
    try {
      const stored = localStorage.getItem('captured_photos');
      if (stored) {
        const parsedPhotos = JSON.parse(stored);
        setPhotos(parsedPhotos);
        onPhotosChange?.(parsedPhotos);
      }
    } catch (error) {
      console.error('Error loading stored photos:', error);
    }
  };
  
  // Guardar fotos localmente
  const savePhotosLocally = (photosToSave: PhotoMetadata[]) => {
    try {
      localStorage.setItem('captured_photos', JSON.stringify(photosToSave));
    } catch (error) {
      console.error('Error saving photos locally:', error);
    }
  };
  
  // Solicitar geolocalización
  const requestGeolocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };
  
  // Iniciar cámara
  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }

      // Try with ideal constraints first
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        });
      } catch (idealError) {
        // Fallback to basic constraints
        console.warn('Failed with ideal constraints, trying basic:', idealError);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'environment'
            }
          });
        } catch (basicError) {
          // Final fallback - any camera
          console.warn('Failed with environment camera, trying any camera:', basicError);
          stream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
        }
      }
  
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        setIsCapturing(true);
        setError(null);
      }
    } catch (error: any) {
      console.error('Error starting camera:', error);
      
      let errorMessage = 'No se pudo acceder a la cámara';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Permisos de cámara denegados. Por favor, permite el acceso a la cámara en la configuración del navegador.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No se encontró ninguna cámara en este dispositivo.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'La cámara está siendo usada por otra aplicación. Por favor, cierra otras aplicaciones que puedan estar usando la cámara.';
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        errorMessage = 'La configuración de cámara solicitada no es compatible con este dispositivo.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'El acceso a la cámara no está soportado en este navegador.';
      } else if (error.name === 'AbortError') {
        errorMessage = 'El acceso a la cámara fue interrumpido.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Detener cámara
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
      setIsCapturing(false);
    }
  };
  
  // Crear thumbnail
  const createThumbnail = (canvas: HTMLCanvasElement): string => {
    const thumbnailCanvas = document.createElement('canvas');
    const thumbnailContext = thumbnailCanvas.getContext('2d');
    
    if (!thumbnailContext) return '';

    // Configurar tamaño del thumbnail
    const maxSize = 150;
    const ratio = Math.min(maxSize / canvas.width, maxSize / canvas.height);
    thumbnailCanvas.width = canvas.width * ratio;
    thumbnailCanvas.height = canvas.height * ratio;

    // Dibujar imagen redimensionada
    thumbnailContext.drawImage(
      canvas,
      0, 0, canvas.width, canvas.height,
      0, 0, thumbnailCanvas.width, thumbnailCanvas.height
    );

    return thumbnailCanvas.toDataURL('image/jpeg', 0.7);
  };
  
  // Subir foto
  const uploadPhoto = async (photo: PhotoMetadata, blob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('photo', blob, photo.filename);
      formData.append('metadata', JSON.stringify({
        id: photo.id,
        timestamp: photo.timestamp,
        gpsCoordinates: photo.gpsCoordinates,
        deviceInfo: photo.deviceInfo,
        pestType: photo.pestType,
        lotId: photo.lotId,
        aiMetadata: photo.aiMetadata
      }));

      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      });

      if (response.ok) {
        // Actualizar estado de sincronización
        const updatedPhotos = photos.map(p =>
          p.id === photo.id ? { ...p, syncStatus: 'SYNCED' as const } : p
        );
        setPhotos(updatedPhotos);
        savePhotosLocally(updatedPhotos);
        onPhotosChange?.(updatedPhotos);
      } else {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      
      // Marcar como error de sincronización
      const updatedPhotos = photos.map(p =>
        p.id === photo.id ? { ...p, syncStatus: 'ERROR' as const } : p
      );
      setPhotos(updatedPhotos);
      savePhotosLocally(updatedPhotos);
    }
  };

  // Sincronizar fotos pendientes
  const syncPendingPhotos = async () => {
    if (!isOnline) return;

    const pendingPhotos = photos.filter(p => 
      p.syncStatus === 'PENDING' || p.syncStatus === 'ERROR'
    );

    for (const photo of pendingPhotos) {
      try {
        // Intentar obtener el blob de la foto desde el URL local
        const response = await fetch(photo.url);
        const blob = await response.blob();
        await uploadPhoto(photo, blob);
      } catch (error) {
        console.error(`Error syncing photo ${photo.id}:`, error);
      }
    }
  };

  // Manejar subida de archivos
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;

      try {
        // Crear canvas para procesar la imagen
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;

        // Cargar imagen
        const img = new Image();
        img.onload = async () => {
          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0);

          // Analizar calidad de imagen
          const imageQuality = await analyzeImageQuality(canvas);
          
          // Crear metadata
          const photoId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const url = URL.createObjectURL(file);
          const thumbnail = createThumbnail(canvas);

          const photoMetadata: PhotoMetadata = {
            id: photoId,
            filename: file.name,
            url,
            thumbnail,
            timestamp: new Date().toISOString(),
            deviceInfo: {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              language: navigator.language
            },
            pestType,
            lotId,
            syncStatus: isOnline ? 'PENDING' : 'PENDING',
            size: file.size,
            format: file.type,
            // AI metadata
            aiMetadata: {
              ...aiSettings,
              imageQuality,
              lightingConditions: detectLightingConditions(canvas),
              focusQuality: detectFocusQuality(canvas)
            },
            aiAnalysisStatus: aiSettings.enableAIAnalysis ? 'pending' : undefined
          };

          // Agregar a la lista
          const updatedPhotos = [...photos, photoMetadata];
          setPhotos(updatedPhotos);
          savePhotosLocally(updatedPhotos);
          onPhotoCapture?.(photoMetadata);
          onPhotosChange?.(updatedPhotos);

          // Guardar para análisis de IA
          if (aiSettings.enableAIAnalysis) {
            await saveImageForAIAnalysis(photoMetadata, file);
          }

          // Subir si está online
          if (isOnline) {
            uploadPhoto(photoMetadata, file);
          }

          // Iniciar análisis de IA si está habilitado
          if (aiSettings.enableAIAnalysis && aiSettings.autoAnalyze) {
            await startAIAnalysis(photoMetadata);
          }
        };

        img.src = URL.createObjectURL(file);
      } catch (error) {
        console.error('Error processing uploaded file:', error);
      }
    }

    // Limpiar input
    event.target.value = '';
  };

  // Eliminar foto
  const deletePhoto = (photoId: string) => {
    const updatedPhotos = photos.filter(p => p.id !== photoId);
    setPhotos(updatedPhotos);
    savePhotosLocally(updatedPhotos);
    onPhotosChange?.(updatedPhotos);

    // Limpiar URL del objeto para liberar memoria
    const photoToDelete = photos.find(p => p.id === photoId);
    if (photoToDelete?.url.startsWith('blob:')) {
      URL.revokeObjectURL(photoToDelete.url);
    }
  };

  // Get sync status icon
  const getSyncStatusIcon = (status: PhotoMetadata['syncStatus']) => {
    switch (status) {
      case 'SYNCED': return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'PENDING': return <Clock className="h-3 w-3 text-yellow-500" />;
      case 'FAILED': return <AlertTriangle className="h-3 w-3 text-red-500" />;
      default: return null;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Enhanced photo capture with AI metadata
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Configurar canvas con las dimensiones del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dibujar frame actual del video en el canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convertir a blob
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      try {
        // Obtener geolocalización
        let gpsCoordinates;
        try {
          const position = await requestGeolocation();
          gpsCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined
          };
        } catch (error) {
          console.warn('No se pudo obtener geolocalización:', error);
        }

        // Analizar calidad de imagen automáticamente
        const imageQuality = await analyzeImageQuality(canvas);
        
        // Crear metadata de la foto con información de IA
        const photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const filename = `${photoId}.jpg`;
        
        // Crear URL local para la imagen
        const url = URL.createObjectURL(blob);
        
        // Crear thumbnail
        const thumbnail = createThumbnail(canvas);
        
        const photoMetadata: PhotoMetadata = {
          id: photoId,
          filename,
          url,
          thumbnail,
          timestamp: new Date().toISOString(),
          gpsCoordinates,
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language
          },
          pestType,
          lotId,
          syncStatus: isOnline ? 'PENDING' : 'PENDING',
          size: blob.size,
          format: 'image/jpeg',
          // AI metadata
          aiMetadata: {
            ...aiSettings,
            imageQuality,
            lightingConditions: detectLightingConditions(canvas),
            focusQuality: detectFocusQuality(canvas)
          },
          aiAnalysisStatus: aiSettings.enableAIAnalysis ? 'pending' : undefined
        };

        // Agregar a la lista de fotos
        const updatedPhotos = [...photos, photoMetadata];
        setPhotos(updatedPhotos);
        savePhotosLocally(updatedPhotos);
        onPhotoCapture?.(photoMetadata);
        onPhotosChange?.(updatedPhotos);

        // Guardar en IndexedDB para análisis de IA
        if (aiSettings.enableAIAnalysis) {
          await saveImageForAIAnalysis(photoMetadata, blob);
        }

        // Intentar subir inmediatamente si está online
        if (isOnline) {
          uploadPhoto(photoMetadata, blob);
        }

        // Iniciar análisis de IA si está habilitado y es automático
        if (aiSettings.enableAIAnalysis && aiSettings.autoAnalyze) {
          await startAIAnalysis(photoMetadata);
        }
      } catch (error) {
        console.error('Error capturing photo:', error);
      }
    }, 'image/jpeg', 0.8);

    stopCamera();
  };

  // Analizar calidad de imagen
  const analyzeImageQuality = async (canvas: HTMLCanvasElement): Promise<'excellent' | 'good' | 'fair' | 'poor'> => {
    const context = canvas.getContext('2d');
    if (!context) return 'fair';

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Calcular métricas básicas de calidad
    let brightness = 0;
    let contrast = 0;
    let sharpness = 0;
    
    // Análisis simplificado de calidad
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      brightness += (r + g + b) / 3;
    }
    
    brightness = brightness / (data.length / 4);
    
    // Determinar calidad basada en métricas
    if (brightness > 50 && brightness < 200) {
      return 'excellent';
    } else if (brightness > 30 && brightness < 220) {
      return 'good';
    } else if (brightness > 20 && brightness < 235) {
      return 'fair';
    } else {
      return 'poor';
    }
  };

  // Detectar condiciones de iluminación
  const detectLightingConditions = (canvas: HTMLCanvasElement): 'natural' | 'artificial' | 'mixed' | 'poor' => {
    const context = canvas.getContext('2d');
    if (!context) return 'natural';

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let avgBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      avgBrightness += (r + g + b) / 3;
    }
    avgBrightness = avgBrightness / (data.length / 4);
    
    if (avgBrightness < 50) return 'poor';
    if (avgBrightness > 180) return 'artificial';
    return 'natural';
  };

  // Detectar calidad de enfoque
  const detectFocusQuality = (canvas: HTMLCanvasElement): 'sharp' | 'slightly_blurred' | 'blurred' => {
    // Implementación simplificada - en producción usaríamos algoritmos más sofisticados
    const context = canvas.getContext('2d');
    if (!context) return 'sharp';
    
    // Por ahora retornamos 'sharp' como default
    // En una implementación real, analizaríamos gradientes y bordes
    return 'sharp';
  };

  // Guardar imagen para análisis de IA
  const saveImageForAIAnalysis = async (photo: PhotoMetadata, blob: Blob) => {
    try {
      await offlineDB.addAIImage(
        photo.filename,
        blob,
        {
          originalPhotoId: photo.id,
          pestType: photo.pestType,
          lotId: photo.lotId,
          gpsCoordinates: photo.gpsCoordinates,
          captureTimestamp: photo.timestamp,
          deviceInfo: photo.deviceInfo,
          aiMetadata: photo.aiMetadata
        }
      );
      
      console.log(`[PhotoCapture] Image saved for AI analysis: ${photo.filename}`);
    } catch (error) {
      console.error('[PhotoCapture] Error saving image for AI analysis:', error);
    }
  };

  // Iniciar análisis de IA
  const startAIAnalysis = async (photo: PhotoMetadata) => {
    if (!photo.aiMetadata?.enableAIAnalysis) return;

    try {
      setAnalysisProgress(prev => ({ ...prev, [photo.id]: 0 }));
      
      // Actualizar estado de análisis
      const updatedPhotos = photos.map(p => 
        p.id === photo.id 
          ? { ...p, aiAnalysisStatus: 'processing' as const }
          : p
      );
      setPhotos(updatedPhotos);
      savePhotosLocally(updatedPhotos);

      // Simular progreso de análisis
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          const currentProgress = prev[photo.id] || 0;
          if (currentProgress >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return { ...prev, [photo.id]: currentProgress + 10 };
        });
      }, 500);

      // Crear entrada de análisis en IndexedDB
      const analysisId = await offlineDB.addAIAnalysis(
        photo.aiMetadata.analysisTypes[0], // Usar el primer tipo de análisis
        {
          photoId: photo.id,
          imageMetadata: photo.aiMetadata,
          priority: photo.aiMetadata.priority,
          autoAnalyze: photo.aiMetadata.autoAnalyze
        },
        photo.aiMetadata.priority
      );

      // Simular análisis (en producción esto sería una llamada a la API de IA)
      setTimeout(async () => {
        clearInterval(progressInterval);
        setAnalysisProgress(prev => ({ ...prev, [photo.id]: 100 }));
        
        // Simular resultados de análisis
        const mockResults = {
          phytosanitaryAnalysis: [{
            pestType: 'leaf_rust',
            confidence: 0.85,
            severity: 'medium',
            recommendations: ['Aplicar fungicida', 'Mejorar ventilación']
          }],
          confidence: 0.85,
          processingTime: 3000
        };

        // Actualizar análisis en IndexedDB
        await offlineDB.updateAIAnalysisResult(analysisId, mockResults, 'completed');

        // Actualizar foto con resultados
        const finalUpdatedPhotos = photos.map(p => 
          p.id === photo.id 
            ? { 
                ...p, 
                aiAnalysisStatus: 'completed' as const,
                aiAnalysisResults: mockResults.phytosanitaryAnalysis,
                confidenceScore: mockResults.confidence,
                processingTime: mockResults.processingTime
              }
            : p
        );
        setPhotos(finalUpdatedPhotos);
        savePhotosLocally(finalUpdatedPhotos);
        onPhotosChange?.(finalUpdatedPhotos);

        // Notificar resultados
        await notifyPhytosanitaryResult(
          photo.filename,
          mockResults.phytosanitaryAnalysis,
          mockResults.confidence > 0.7 ? 'warning' : 'info'
        );

        // Callback de análisis completado
        onAIAnalysisComplete?.(
          finalUpdatedPhotos.find(p => p.id === photo.id)!,
          mockResults.phytosanitaryAnalysis
        );

        // Limpiar progreso después de un momento
        setTimeout(() => {
          setAnalysisProgress(prev => {
            const { [photo.id]: _, ...rest } = prev;
            return rest;
          });
        }, 2000);
      }, 3000);

    } catch (error) {
      console.error('[PhotoCapture] Error starting AI analysis:', error);
      
      // Marcar análisis como fallido
      const failedPhotos = photos.map(p => 
        p.id === photo.id 
          ? { ...p, aiAnalysisStatus: 'failed' as const }
          : p
      );
      setPhotos(failedPhotos);
      savePhotosLocally(failedPhotos);
      
      setAnalysisProgress(prev => {
        const { [photo.id]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  // Obtener icono de estado de análisis de IA
  const getAIAnalysisIcon = (status?: PhotoMetadata['aiAnalysisStatus']) => {
    switch (status) {
      case 'completed': return <Brain className="h-4 w-4 text-green-500" />;
      case 'processing': return <Zap className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Estado de Conexión, GPS y IA */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">
              {isOnline ? 'Conectado' : 'Sin conexión'}
            </span>
          </div>
          
          {enableGeolocation && (
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4" />
              <span className="text-sm">
                GPS: {gpsStatus === 'GRANTED' ? 'Activo' : 
                      gpsStatus === 'REQUESTING' ? 'Solicitando...' :
                      gpsStatus === 'DENIED' ? 'Denegado' : 'Inactivo'}
              </span>
            </div>
          )}

          {enableAIAnalysis && (
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500" />
              <span className="text-sm">
                IA: {aiSettings.enableAIAnalysis ? 'Activa' : 'Inactiva'}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={isOnline ? 'default' : 'secondary'}>
            {photos.filter(p => p.syncStatus === 'SYNCED').length}/{photos.length} sincronizadas
          </Badge>
          
          {enableAIAnalysis && (
            <Badge variant="outline" className="text-purple-600">
              {photos.filter(p => p.aiAnalysisStatus === 'completed').length} analizadas
            </Badge>
          )}
        </div>
      </div>

      {/* Configuración de IA */}
      {enableAIAnalysis && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                Configuración de Análisis IA
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAISettings(!showAISettings)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          {showAISettings && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Análisis Automático</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="checkbox"
                      checked={aiSettings.autoAnalyze}
                      onChange={(e) => setAiSettings(prev => ({
                        ...prev,
                        autoAnalyze: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <span className="text-sm">Analizar automáticamente al capturar</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Prioridad</label>
                  <select
                    value={aiSettings.priority}
                    onChange={(e) => setAiSettings(prev => ({
                      ...prev,
                      priority: e.target.value as 'low' | 'medium' | 'high'
                    }))}
                    className="w-full mt-1 p-2 border rounded"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Parte de la Planta</label>
                  <select
                    value={aiSettings.plantPart}
                    onChange={(e) => setAiSettings(prev => ({
                      ...prev,
                      plantPart: e.target.value as any
                    }))}
                    className="w-full mt-1 p-2 border rounded"
                  >
                    <option value="leaf">Hoja</option>
                    <option value="stem">Tallo</option>
                    <option value="fruit">Fruto</option>
                    <option value="root">Raíz</option>
                    <option value="flower">Flor</option>
                    <option value="whole_plant">Planta Completa</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Umbral de Confianza</label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={aiSettings.qualityThreshold}
                    onChange={(e) => setAiSettings(prev => ({
                      ...prev,
                      qualityThreshold: parseFloat(e.target.value)
                    }))}
                    className="w-full mt-1"
                  />
                  <span className="text-xs text-gray-600">
                    {(aiSettings.qualityThreshold * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Controles de Captura */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Capturar Foto
              {enableAIAnalysis && aiSettings.enableAIAnalysis && (
                <Badge variant="outline" className="text-purple-600">
                  <Brain className="h-3 w-3 mr-1" />
                  IA
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isCapturing ? (
              <Button 
                onClick={startCamera} 
                className="w-full"
                disabled={photos.length >= maxPhotos}
              >
                <Camera className="h-4 w-4 mr-2" />
                Abrir Cámara
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Overlay de información de IA */}
                  {enableAIAnalysis && aiSettings.enableAIAnalysis && (
                    <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white p-2 rounded text-xs">
                      <div className="flex items-center gap-1">
                        <Brain className="h-3 w-3" />
                        <span>Análisis IA: {aiSettings.autoAnalyze ? 'Auto' : 'Manual'}</span>
                      </div>
                      <div>Parte: {aiSettings.plantPart}</div>
                      <div>Prioridad: {aiSettings.priority}</div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={capturePhoto} className="flex-1">
                    <Camera className="h-4 w-4 mr-2" />
                    Capturar
                  </Button>
                  <Button onClick={stopCamera} variant="outline">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Subir Archivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
              disabled={photos.length >= maxPhotos}
            >
              <Upload className="h-4 w-4 mr-2" />
              Seleccionar Archivos
            </Button>
            <p className="text-xs text-gray-600 mt-2">
              Máximo {maxPhotos} fotos. Formatos: JPG, PNG, WebP
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Fotos con información de IA */}
      {photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fotos Capturadas ({photos.length}/{maxPhotos})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={photo.thumbnail}
                      alt={photo.filename}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setSelectedPhoto(photo)}
                    />
                  </div>
                  
                  {/* Overlay con información */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedPhoto(photo)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      {photo.aiAnalysisStatus === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startAIAnalysis(photo)}
                        >
                          <Brain className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deletePhoto(photo.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Estado de sincronización y IA */}
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    {getSyncStatusIcon(photo.syncStatus)}
                    {getAIAnalysisIcon(photo.aiAnalysisStatus)}
                    {photo.gpsCoordinates && (
                      <MapPin className="h-3 w-3 text-blue-500" />
                    )}
                  </div>
                  
                  {/* Progreso de subida y análisis */}
                  {(uploadProgress[photo.id] !== undefined || analysisProgress[photo.id] !== undefined) && (
                    <div className="absolute bottom-0 left-0 right-0 p-1 space-y-1">
                      {uploadProgress[photo.id] !== undefined && (
                        <div>
                          <Progress value={uploadProgress[photo.id]} className="h-1" />
                          <span className="text-xs text-white">Subiendo...</span>
                        </div>
                      )}
                      {analysisProgress[photo.id] !== undefined && (
                        <div>
                          <Progress value={analysisProgress[photo.id]} className="h-1 bg-purple-200" />
                          <span className="text-xs text-white">Analizando IA...</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Información básica */}
                  <div className="mt-2 text-xs">
                    <p className="font-medium truncate">{photo.filename}</p>
                    <p className="text-gray-600">{formatFileSize(photo.size)}</p>
                    <p className="text-gray-600">
                      {new Date(photo.timestamp).toLocaleTimeString()}
                    </p>
                    {photo.confidenceScore && (
                      <p className="text-purple-600">
                        Confianza: {(photo.confidenceScore * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Vista Detallada con información de IA */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl max-h-full overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-medium">{selectedPhoto.filename}</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedPhoto(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <img
                    src={selectedPhoto.url}
                    alt={selectedPhoto.filename}
                    className="w-full rounded-lg"
                  />
                </div>
                
                <div className="space-y-4">
                  {/* Información básica */}
                  <div>
                    <h4 className="font-medium mb-2">Información</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Tamaño:</span>
                        <span>{formatFileSize(selectedPhoto.size)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Formato:</span>
                        <span>{selectedPhoto.format}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fecha:</span>
                        <span>{new Date(selectedPhoto.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Estado:</span>
                        <div className="flex items-center gap-1">
                          {getSyncStatusIcon(selectedPhoto.syncStatus)}
                          <span>{selectedPhoto.syncStatus}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Información de IA */}
                  {selectedPhoto.aiMetadata && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Brain className="h-4 w-4 text-purple-500" />
                        Análisis de IA
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Estado:</span>
                          <div className="flex items-center gap-1">
                            {getAIAnalysisIcon(selectedPhoto.aiAnalysisStatus)}
                            <span>{selectedPhoto.aiAnalysisStatus || 'No analizada'}</span>
                          </div>
                        </div>
                        {selectedPhoto.confidenceScore && (
                          <div className="flex justify-between">
                            <span>Confianza:</span>
                            <span>{(selectedPhoto.confidenceScore * 100).toFixed(1)}%</span>
                          </div>
                        )}
                        {selectedPhoto.processingTime && (
                          <div className="flex justify-between">
                            <span>Tiempo de procesamiento:</span>
                            <span>{(selectedPhoto.processingTime / 1000).toFixed(1)}s</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Parte de planta:</span>
                          <span>{selectedPhoto.aiMetadata.plantPart}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Calidad de imagen:</span>
                          <span>{selectedPhoto.aiMetadata.imageQuality}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Iluminación:</span>
                          <span>{selectedPhoto.aiMetadata.lightingConditions}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Resultados de análisis */}
                  {selectedPhoto.aiAnalysisResults && selectedPhoto.aiAnalysisResults.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Resultados del Análisis</h4>
                      <div className="space-y-3">
                        {selectedPhoto.aiAnalysisResults.map((result, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">{result.pestType}</span>
                              <Badge variant={result.confidence > 0.7 ? 'destructive' : 'secondary'}>
                                {(result.confidence * 100).toFixed(0)}%
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              Severidad: {result.severity}
                            </p>
                            {result.recommendations && (
                              <div>
                                <p className="text-sm font-medium mb-1">Recomendaciones:</p>
                                <ul className="text-sm text-gray-600 list-disc list-inside">
                                  {result.recommendations.map((rec: string, i: number) => (
                                    <li key={i}>{rec}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Geolocalización */}
                  {selectedPhoto.gpsCoordinates && (
                    <div>
                      <h4 className="font-medium mb-2">Geolocalización</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Latitud:</span>
                          <span>{selectedPhoto.gpsCoordinates.latitude.toFixed(6)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Longitud:</span>
                          <span>{selectedPhoto.gpsCoordinates.longitude.toFixed(6)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Precisión:</span>
                          <span>{selectedPhoto.gpsCoordinates.accuracy.toFixed(0)}m</span>
                        </div>
                        {selectedPhoto.gpsCoordinates.altitude && (
                          <div className="flex justify-between">
                            <span>Altitud:</span>
                            <span>{selectedPhoto.gpsCoordinates.altitude.toFixed(0)}m</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Información del dispositivo */}
                  <div>
                    <h4 className="font-medium mb-2">Dispositivo</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Plataforma:</span>
                        <span>{selectedPhoto.deviceInfo.platform}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Idioma:</span>
                        <span>{selectedPhoto.deviceInfo.language}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alertas de Estado */}
      {!isOnline && enableOfflineMode && (
        <Alert>
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            Sin conexión a internet. Las fotos se guardarán localmente y se sincronizarán cuando se restablezca la conexión.
          </AlertDescription>
        </Alert>
      )}
      
      {enableAIAnalysis && !aiSettings.enableAIAnalysis && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            El análisis de IA está deshabilitado. Habilítalo en la configuración para obtener análisis automáticos de plagas y enfermedades.
          </AlertDescription>
        </Alert>
      )}
      
      {photos.length >= maxPhotos && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Has alcanzado el límite máximo de {maxPhotos} fotos. Elimina algunas para capturar más.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PhotoCapture;