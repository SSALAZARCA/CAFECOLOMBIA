import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Coffee } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({ onInstall, onDismiss }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'desktop' | 'mobile' | 'unknown'>('unknown');

  useEffect(() => {
    // Detectar plataforma
    const userAgent = navigator.userAgent.toLowerCase();
    if (/android|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent)) {
      setPlatform('mobile');
    } else {
      setPlatform('desktop');
    }

    // Verificar si ya está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Escuchar evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Mostrar prompt después de un delay para mejor UX
      setTimeout(() => {
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        const lastDismissed = dismissed ? parseInt(dismissed) : 0;
        const daysSinceDismissed = (Date.now() - lastDismissed) / (1000 * 60 * 60 * 24);
        
        // Mostrar si nunca se ha descartado o han pasado más de 7 días
        if (!dismissed || daysSinceDismissed > 7) {
          setShowPrompt(true);
        }
      }, 3000);
    };

    // Escuchar evento de instalación exitosa
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      onInstall?.();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [onInstall]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
        handleDismiss();
      }
    } catch (error) {
      console.error('Error during installation:', error);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    onDismiss?.();
  };

  const getInstallInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome') && platform === 'mobile') {
      return {
        title: 'Instalar en Android',
        steps: [
          'Toca el menú (⋮) en tu navegador',
          'Selecciona "Agregar a pantalla de inicio"',
          'Confirma la instalación'
        ]
      };
    } else if (userAgent.includes('safari') && platform === 'mobile') {
      return {
        title: 'Instalar en iOS',
        steps: [
          'Toca el botón de compartir (□↗)',
          'Selecciona "Agregar a pantalla de inicio"',
          'Confirma la instalación'
        ]
      };
    } else if (platform === 'desktop') {
      return {
        title: 'Instalar en escritorio',
        steps: [
          'Haz clic en el icono de instalación en la barra de direcciones',
          'O usa el menú del navegador',
          'Confirma la instalación'
        ]
      };
    }
    
    return {
      title: 'Instalar aplicación',
      steps: [
        'Busca la opción de instalación en tu navegador',
        'Sigue las instrucciones de tu dispositivo'
      ]
    };
  };

  // No mostrar si ya está instalado
  if (isInstalled) {
    return null;
  }

  // Prompt compacto para la barra superior
  if (!showPrompt && deferredPrompt) {
    return (
      <div className="bg-green-50 border-l-4 border-green-400 p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Coffee className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">
              ¡Instala CaféColombia para acceso rápido!
            </span>
          </div>
          <button
            onClick={() => setShowPrompt(true)}
            className="text-sm text-green-600 hover:text-green-800 font-medium"
          >
            Instalar
          </button>
        </div>
      </div>
    );
  }

  // Prompt completo
  if (!showPrompt) {
    return null;
  }

  const instructions = getInstallInstructions();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Coffee className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Instalar CaféColombia
              </h3>
              <p className="text-sm text-gray-500">
                Acceso rápido desde tu dispositivo
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            {platform === 'mobile' ? (
              <Smartphone className="w-8 h-8 text-blue-500" />
            ) : (
              <Monitor className="w-8 h-8 text-blue-500" />
            )}
            <div>
              <h4 className="font-medium text-gray-900">
                Beneficios de la instalación
              </h4>
              <ul className="text-sm text-gray-600 mt-1 space-y-1">
                <li>• Acceso rápido desde tu pantalla de inicio</li>
                <li>• Funciona sin conexión a internet</li>
                <li>• Notificaciones de tareas importantes</li>
                <li>• Mejor rendimiento y experiencia</li>
              </ul>
            </div>
          </div>

          {/* Instrucciones manuales si no hay prompt automático */}
          {!deferredPrompt && (
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <h5 className="font-medium text-blue-900 mb-2">
                {instructions.title}
              </h5>
              <ol className="text-sm text-blue-800 space-y-1">
                {instructions.steps.map((step, index) => (
                  <li key={index}>{index + 1}. {step}</li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Ahora no
          </button>
          
          {deferredPrompt ? (
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isInstalling ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Instalando...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Instalar</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Entendido
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Hook para usar el estado de instalación
export const useInstallPrompt = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar si ya está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = () => {
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  return { canInstall, isInstalled };
};