import { useState } from 'react';
import Header from './Header';
import Navigation from './Navigation';
import { ConnectionStatus } from './ui/ConnectionStatus';
import { InstallPrompt } from './ui/InstallPrompt';
import { BackendStatusIndicator } from './BackendConnectionStatus';
import { usePWA } from '../hooks/usePWA';
import ErrorBoundary from './ErrorBoundary';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { status, onlineStatus } = usePWA();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Install Prompt */}
      <ErrorBoundary fallback={<div className="hidden" />}>
        <InstallPrompt />
      </ErrorBoundary>
      
      {/* Connection Status Bar */}
      {(!onlineStatus.isOnline || onlineStatus.pendingSyncCount > 0) && (
        <div className="bg-white border-b border-gray-200 px-4 py-2">
          <ErrorBoundary fallback={<div className="text-sm text-gray-500">Estado de conexión no disponible</div>}>
            <div className="flex items-center justify-between">
              <ConnectionStatus showDetails={false} />
              <BackendStatusIndicator />
            </div>
          </ErrorBoundary>
        </div>
      )}
      
      <div className="flex">
        {/* Navigation Sidebar */}
        <ErrorBoundary fallback={<div className="hidden" />}>
          <Navigation isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </ErrorBoundary>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
          <ErrorBoundary fallback={<div className="h-16 bg-white border-b border-gray-200" />}>
            <Header onMenuClick={() => setSidebarOpen(true)} />
          </ErrorBoundary>
          <main className="flex-1 p-4">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </div>
  );
}