import { useState } from 'react';
import { X, QrCode, Download, Printer, Copy, Check } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  insumo: {
    id: string;
    name: string;
    brand: string;
    batchNumber: string;
    type: string;
    activeIngredient: string;
    concentration: string;
    gracePeriodDays: number;
    expiryDate: string;
  };
}

export default function QRCodeModal({ isOpen, onClose, insumo }: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generar datos para el QR
  const qrData = {
    id: insumo.id,
    name: insumo.name,
    brand: insumo.brand,
    batch: insumo.batchNumber,
    type: insumo.type,
    activeIngredient: insumo.activeIngredient,
    concentration: insumo.concentration,
    gracePeriod: insumo.gracePeriodDays,
    expiry: insumo.expiryDate,
    timestamp: new Date().toISOString()
  };

  const qrString = JSON.stringify(qrData);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrString)}`;

  const handleCopyData = async () => {
    try {
      await navigator.clipboard.writeText(qrString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `QR_${insumo.name}_${insumo.batchNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${insumo.name}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 20px;
              }
              .qr-container {
                border: 2px solid #000;
                padding: 20px;
                margin: 20px auto;
                width: fit-content;
              }
              .info {
                margin: 10px 0;
                font-size: 14px;
              }
              .title {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 15px;
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="title">${insumo.name}</div>
              <img src="${qrUrl}" alt="QR Code" />
              <div class="info">Marca: ${insumo.brand}</div>
              <div class="info">Lote: ${insumo.batchNumber}</div>
              <div class="info">Tipo: ${insumo.type}</div>
              <div class="info">Ingrediente Activo: ${insumo.activeIngredient}</div>
              <div class="info">Concentración: ${insumo.concentration}</div>
              <div class="info">Período de Carencia: ${insumo.gracePeriodDays} días</div>
              <div class="info">Vencimiento: ${new Date(insumo.expiryDate).toLocaleDateString()}</div>
              <div class="info">Generado: ${new Date().toLocaleDateString()}</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-600" />
            Código QR - {insumo.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* QR Code */}
          <div className="text-center mb-6">
            <div className="bg-white p-4 border-2 border-gray-200 rounded-lg inline-block">
              <img 
                src={qrUrl} 
                alt="QR Code" 
                className="w-64 h-64 mx-auto"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y5ZmFmYiIvPjx0ZXh0IHg9IjE1MCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2YjczODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkVycm9yIGFsIGNhcmdhciBRUjwvdGV4dD48L3N2Zz4=';
                }}
              />
            </div>
          </div>

          {/* Información del Insumo */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Información del Insumo</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Marca:</span>
                <span className="font-medium">{insumo.brand}</span>
              </div>
              <div className="flex justify-between">
                <span>Lote:</span>
                <span className="font-medium">{insumo.batchNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Tipo:</span>
                <span className="font-medium">{insumo.type}</span>
              </div>
              <div className="flex justify-between">
                <span>Ingrediente Activo:</span>
                <span className="font-medium">{insumo.activeIngredient}</span>
              </div>
              <div className="flex justify-between">
                <span>Concentración:</span>
                <span className="font-medium">{insumo.concentration}</span>
              </div>
              <div className="flex justify-between">
                <span>Período de Carencia:</span>
                <span className="font-medium">{insumo.gracePeriodDays} días</span>
              </div>
              <div className="flex justify-between">
                <span>Vencimiento:</span>
                <span className="font-medium">{new Date(insumo.expiryDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Datos del QR */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2">Datos del QR Code</h4>
            <div className="bg-white rounded border p-3">
              <code className="text-xs text-gray-600 break-all">
                {qrString}
              </code>
            </div>
            <button
              onClick={handleCopyData}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar datos
                </>
              )}
            </button>
          </div>

          {/* Acciones */}
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Descargar
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
          </div>

          {/* Instrucciones */}
          <div className="mt-6 text-xs text-gray-500">
            <p className="mb-2">
              <strong>Instrucciones de uso:</strong>
            </p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Escanea el código QR con cualquier lector de códigos QR</li>
              <li>Los datos del insumo se mostrarán en formato JSON</li>
              <li>Úsalo para identificación rápida en campo</li>
              <li>Imprime y pega en el envase del insumo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}