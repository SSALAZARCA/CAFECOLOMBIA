import { useState, useEffect, useRef } from 'react';
import { useAdminStore } from '@/stores/adminStore';
import { 
  Shield, 
  Smartphone, 
  Mail, 
  Key, 
  Copy, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  QrCode,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

interface TwoFactorAuthProps {
  isSetup?: boolean;
  onComplete?: (success: boolean) => void;
  onCancel?: () => void;
}

interface TwoFactorSetup {
  qrCode: string;
  secret: string;
  backupCodes: string[];
  setupToken: string;
}

export default function TwoFactorAuth({ isSetup = false, onComplete, onCancel }: TwoFactorAuthProps) {
  const { useAuthenticatedFetch } = useAdminStore();
  const [step, setStep] = useState<'method' | 'setup' | 'verify' | 'backup'>('method');
  const [method, setMethod] = useState<'app' | 'sms' | 'email'>('app');
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [setupData, setSetupData] = useState<TwoFactorSetup | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isSetup) {
      setStep('method');
    } else {
      setStep('verify');
    }
  }, [isSetup]);

  const initiate2FASetup = async () => {
    try {
      setLoading(true);
      const response = await useAuthenticatedFetch('/admin/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, phoneNumber, email })
      });

      if (response.ok) {
        const data = await response.json();
        setSetupData(data);
        setStep('setup');
      } else {
        toast.error('Error al inicializar 2FA');
      }
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const verify2FASetup = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Ingresa un código de 6 dígitos');
      return;
    }

    try {
      setLoading(true);
      const response = await useAuthenticatedFetch('/admin/auth/2fa/verify-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: verificationCode, 
          setupToken: setupData?.setupToken,
          method 
        })
      });

      if (response.ok) {
        const data = await response.json();
        setBackupCodes(data.backupCodes || []);
        setStep('backup');
        toast.success('2FA configurado exitosamente');
      } else {
        toast.error('Código de verificación inválido');
        setVerificationCode('');
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const verify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Ingresa un código de 6 dígitos');
      return;
    }

    try {
      setLoading(true);
      const response = await useAuthenticatedFetch('/admin/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode })
      });

      if (response.ok) {
        toast.success('Verificación 2FA exitosa');
        onComplete?.(true);
      } else {
        toast.error('Código de verificación inválido');
        setVerificationCode('');
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      toast.error('Error de conexión');
      onComplete?.(false);
    } finally {
      setLoading(false);
    }
  };

  const generateBackupCodes = async () => {
    try {
      setLoading(true);
      const response = await useAuthenticatedFetch('/admin/auth/2fa/backup-codes', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setBackupCodes(data.backupCodes);
        toast.success('Códigos de respaldo generados');
      } else {
        toast.error('Error al generar códigos de respaldo');
      }
    } catch (error) {
      console.error('Error generating backup codes:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const downloadBackupCodes = () => {
    const content = `Códigos de respaldo 2FA - Café Colombia Admin\n\nFecha: ${new Date().toLocaleDateString()}\n\n${backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}\n\n⚠️ IMPORTANTE:\n- Guarda estos códigos en un lugar seguro\n- Cada código solo se puede usar una vez\n- Genera nuevos códigos si pierdes estos`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-codes-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleCodeInput = (index: number, value: string) => {
    if (value.length > 1) {
      // Si se pega un código completo
      const code = value.slice(0, 6);
      setVerificationCode(code);
      return;
    }

    const newCode = verificationCode.split('');
    newCode[index] = value;
    const updatedCode = newCode.join('').slice(0, 6);
    setVerificationCode(updatedCode);

    // Auto-focus al siguiente input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg border border-gray-200 p-6">
      <div className="text-center mb-6">
        <Shield className="h-12 w-12 text-emerald-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900">
          {isSetup ? 'Configurar Autenticación 2FA' : 'Verificación 2FA'}
        </h2>
        <p className="text-gray-600 mt-1">
          {isSetup 
            ? 'Protege tu cuenta con autenticación de dos factores' 
            : 'Ingresa tu código de verificación'
          }
        </p>
      </div>

      {step === 'method' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Selecciona un método de verificación:
            </label>
            <div className="space-y-3">
              <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="method"
                  value="app"
                  checked={method === 'app'}
                  onChange={(e) => setMethod(e.target.value as 'app')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <Smartphone className="h-5 w-5 text-gray-500 ml-3 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">App Autenticadora</div>
                  <div className="text-sm text-gray-500">Google Authenticator, Authy, etc.</div>
                </div>
              </label>
              <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="method"
                  value="sms"
                  checked={method === 'sms'}
                  onChange={(e) => setMethod(e.target.value as 'sms')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <Smartphone className="h-5 w-5 text-gray-500 ml-3 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">SMS</div>
                  <div className="text-sm text-gray-500">Código por mensaje de texto</div>
                </div>
              </label>
              <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="method"
                  value="email"
                  checked={method === 'email'}
                  onChange={(e) => setMethod(e.target.value as 'email')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <Mail className="h-5 w-5 text-gray-500 ml-3 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Email</div>
                  <div className="text-sm text-gray-500">Código por correo electrónico</div>
                </div>
              </label>
            </div>
          </div>

          {method === 'sms' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de teléfono
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+57 300 123 4567"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          )}

          {method === 'email' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {onCancel && (
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={initiate2FASetup}
              disabled={loading || (method === 'sms' && !phoneNumber) || (method === 'email' && !email)}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Configurando...' : 'Continuar'}
            </button>
          </div>
        </div>
      )}

      {step === 'setup' && setupData && (
        <div className="space-y-4">
          {method === 'app' && (
            <div className="text-center">
              <div className="bg-white p-4 rounded-lg border border-gray-200 inline-block mb-4">
                <img 
                  src={setupData.qrCode} 
                  alt="QR Code para 2FA" 
                  className="w-48 h-48"
                />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Escanea este código QR con tu app autenticadora
              </p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Clave secreta manual:</p>
                <div className="flex items-center justify-between">
                  <code className="text-sm font-mono text-gray-800">{setupData.secret}</code>
                  <button
                    onClick={() => copyToClipboard(setupData.secret)}
                    className="text-emerald-600 hover:text-emerald-700"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {method === 'sms' && (
            <div className="text-center">
              <Smartphone className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
              <p className="text-gray-600">
                Se ha enviado un código de verificación a<br />
                <strong>{phoneNumber}</strong>
              </p>
            </div>
          )}

          {method === 'email' && (
            <div className="text-center">
              <Mail className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
              <p className="text-gray-600">
                Se ha enviado un código de verificación a<br />
                <strong>{email}</strong>
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Ingresa el código de 6 dígitos:
            </label>
            <div className="flex justify-center gap-2 mb-4">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={6}
                  value={verificationCode[index] || ''}
                  onChange={(e) => handleCodeInput(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-lg font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('method')}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Atrás
            </button>
            <button
              onClick={verify2FASetup}
              disabled={loading || verificationCode.length !== 6}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Verificar'}
            </button>
          </div>
        </div>
      )}

      {step === 'verify' && !isSetup && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Ingresa tu código de verificación:
            </label>
            <div className="flex justify-center gap-2 mb-4">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={6}
                  value={verificationCode[index] || ''}
                  onChange={(e) => handleCodeInput(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-lg font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            {onCancel && (
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={verify2FA}
              disabled={loading || verificationCode.length !== 6}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Verificar'}
            </button>
          </div>
        </div>
      )}

      {step === 'backup' && (
        <div className="space-y-4">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ¡2FA Configurado!
            </h3>
            <p className="text-gray-600 mb-4">
              Guarda estos códigos de respaldo en un lugar seguro
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Códigos de Respaldo</h4>
              <div className="flex gap-2">
                <button
                  onClick={downloadBackupCodes}
                  className="text-emerald-600 hover:text-emerald-700"
                  title="Descargar códigos"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={generateBackupCodes}
                  disabled={loading}
                  className="text-emerald-600 hover:text-emerald-700"
                  title="Generar nuevos códigos"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white p-2 rounded border"
                >
                  <code className="text-sm font-mono">{code}</code>
                  <button
                    onClick={() => copyToClipboard(code)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2" />
              <div className="text-sm text-yellow-800">
                <strong>Importante:</strong> Cada código solo se puede usar una vez. 
                Guárdalos en un lugar seguro y accesible.
              </div>
            </div>
          </div>

          <button
            onClick={() => onComplete?.(true)}
            className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Finalizar
          </button>
        </div>
      )}
    </div>
  );
}