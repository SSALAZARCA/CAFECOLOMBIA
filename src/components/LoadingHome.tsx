import React from 'react';

export default function LoadingHome() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="flex items-center justify-center mb-3">
          <div className="h-8 w-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-gray-600">Cargando inicio…</p>
        <p className="mt-1 text-xs text-gray-400">Preparando módulos y datos básicos</p>
      </div>
    </div>
  );
}
