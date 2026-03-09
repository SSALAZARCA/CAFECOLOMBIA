import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import apiClient from '@/services/apiClient';

interface FarmConfig {
  name: string;
  department: string;
  municipality: string;
  address: string;
  sizeHectares: number | '';
  altitude: number | '';
  soilType: string;
  coffeeVarieties: string[];
  processingMethod: string;
}

interface ProfileConfig {
  fullName: string;
  email: string;
  phone: string;
}

export default function Configuracion() {
  const { user, isAuthenticated, isLoading, getToken, login } = useAuth();
  const navigate = useNavigate();

  const [farm, setFarm] = useState<FarmConfig>({
    name: '',
    department: '',
    municipality: '',
    address: '',
    sizeHectares: '',
    altitude: '',
    soilType: 'volcánico',
    coffeeVarieties: [],
    processingMethod: 'lavado'
  });

  const [profile, setProfile] = useState<ProfileConfig>({
    fullName: '',
    email: '',
    phone: ''
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  // Cargar datos del dashboard del caficultor para prellenar
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        if (isLoading) return;
        if (!isAuthenticated) {
          navigate('/login');
          return;
        }
        // Solo caficultor puede acceder
        const role = (user as any)?.role || (user as any)?.tipo_usuario;
        if (role && role !== 'coffee_grower') {
          console.warn('Configuración: Role mismatch but staying on page for debug', role);
          // setError('Acceso restringido. Solo para caficultores.');
          // setLoading(false);
          // return;
        }

        const token = getToken();
        if (!token) {
          console.warn('Configuración: No token found, but suppressing auto-logout for debugging');
          setError('No valid session token found.');
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        // Usamos apiClient.get para consistencia y manejo de errores (offline, 401)
        const response = await apiClient.get('/api/dashboard');
        let data: any = (response as any).data || response;
        if (data.data) data = data.data;

        // Backend devuelve { success: true, data: { ... } } o directamente los datos si apiClient los desempaqueta
        // Asumimos que apiClient devuelve response.data (la estructura JSON)
        const dashboard = data.data || data;

        if (dashboard?.farm) {
          const f = dashboard.farm;
          setFarm({
            name: f.name || '',
            department: f.department || '',
            municipality: f.municipality || '',
            address: f.address || '',
            sizeHectares: f.total_area ?? '',
            altitude: f.altitude ?? '',
            soilType: f.soil_type || 'volcánico',
            coffeeVarieties: (f.coffee_varieties?.split?.(',') || []),
            processingMethod: f.processing_method || 'lavado'
          });
        }

        if (dashboard?.grower || dashboard?.user) {
          const g = dashboard.grower || dashboard.user;
          setProfile({
            fullName: g.full_name || g.name || '',
            email: dashboard.email || g.email || '',
            phone: g.phone || dashboard.user?.phone || ''
          });
        }
      } catch (err: any) {
        console.warn('Configuración: error cargando dashboard', err?.message);
        setError(null); // no bloquear la página por errores de conexión en dev
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setSavedMsg(null);
      setError(null);

      const token = getToken();
      if (!token) throw new Error('No hay sesión activa');

      const payload = {
        profile: profile,
        farm: farm
      };

      // Usar apiClient para el PUT
      await apiClient.put('/api/dashboard', payload);

      setSavedMsg('Configuración actualizada correctamente en la base de datos.');

      // Update local state and Context immediately
      if (user) {
        const updatedUser = {
          ...user,
          name: profile.fullName,
          firstName: profile.fullName.split(' ')[0],
          lastName: profile.fullName.split(' ').slice(1).join(' '),
          email: profile.email,
          phone: profile.phone
          // Preserve other fields like role, id
        };
        // Use login to refresh the session token/user data in local storage and context
        login(token, updatedUser);
      }

    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(err.message || 'Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const toggleVariety = (v: string) => {
    setFarm((prev) => {
      const exists = prev.coffeeVarieties.includes(v);
      return {
        ...prev,
        coffeeVarieties: exists
          ? prev.coffeeVarieties.filter((x) => x !== v)
          : [...prev.coffeeVarieties, v]
      };
    });
  };

  const varieties = ['Castillo', 'Caturra', 'Bourbon', 'Tabi', 'Colombia'];
  const processingMethods = ['lavado', 'natural', 'honey', 'semi_lavado', 'experimental'];
  const soilTypes = ['volcánico', 'arcilloso', 'franco', 'arenoso', 'limoso'];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Configuración del Caficultor</h1>
        <p className="text-gray-600 mt-1">Gestiona tu perfil y los datos de tu finca.</p>

        {loading && (
          <div className="mt-4 text-gray-500">Cargando datos...</div>
        )}

        {!loading && error && (
          <div className="mt-4 p-3 rounded bg-red-50 text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
            <div className="p-6 space-y-8">

              {/* Sección Perfil */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Datos Personales</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      value={profile.fullName}
                      onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 bg-gray-50"
                      value={profile.email}
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">No se puede cambiar el correo.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input
                      type="tel"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="Ej: 3001234567"
                    />
                  </div>
                </div>
              </div>

              {/* Sección Finca */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Datos de la Finca</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Finca</label>
                    <input
                      type="text"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      value={farm.name}
                      onChange={(e) => setFarm({ ...farm, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                    <input
                      type="text"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      value={farm.department}
                      onChange={(e) => setFarm({ ...farm, department: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Municipio</label>
                    <input
                      type="text"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      value={farm.municipality}
                      onChange={(e) => setFarm({ ...farm, municipality: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección / Vereda</label>
                    <input
                      type="text"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      value={farm.address}
                      onChange={(e) => setFarm({ ...farm, address: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Área Total (Hectáreas)</label>
                    <input
                      type="number"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      value={farm.sizeHectares}
                      onChange={(e) => setFarm({ ...farm, sizeHectares: parseFloat(e.target.value) || '' })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Altitud (msnm)</label>
                    <input
                      type="number"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      value={farm.altitude}
                      onChange={(e) => setFarm({ ...farm, altitude: parseFloat(e.target.value) || '' })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Suelo</label>
                    <select
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      value={farm.soilType}
                      onChange={(e) => setFarm({ ...farm, soilType: e.target.value })}
                    >
                      {soilTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Método de Beneficio</label>
                    <select
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      value={farm.processingMethod}
                      onChange={(e) => setFarm({ ...farm, processingMethod: e.target.value })}
                    >
                      {processingMethods.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Variedades de Café</label>
                  <div className="flex flex-wrap gap-2">
                    {varieties.map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => toggleVariety(v)}
                        className={`px-3 py-1 rounded-full text-sm border ${farm.coffeeVarieties.includes(v)
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              <div className="pt-6 border-t flex justify-end">
                {savedMsg && (
                  <span className="text-green-600 mr-4 self-center animate-fade-in">{savedMsg}</span>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}