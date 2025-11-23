import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  Home, 
  Leaf, 
  Award,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';

// Esquema de validación
const registerSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string(),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  farmName: z.string().min(3, 'El nombre de la finca debe tener al menos 3 caracteres'),
  department: z.string().min(1, 'Selecciona un departamento'),
  municipality: z.string().min(1, 'Selecciona un municipio'),
  address: z.string().min(10, 'La dirección debe ser más específica'),
  farmSize: z.number().min(0.1, 'El tamaño de la finca debe ser mayor a 0'),
  experience: z.number().min(0, 'Los años de experiencia no pueden ser negativos'),
  coffeeVarieties: z.array(z.string()).min(1, 'Selecciona al menos una variedad de café'),
  certifications: z.array(z.string()).optional(),
  terms: z.boolean().refine(val => val === true, 'Debes aceptar los términos y condiciones')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

// Datos de departamentos y municipios de Colombia (principales cafeteros)
const DEPARTMENTS = {
  'Huila': ['Pitalito', 'Garzón', 'Neiva', 'La Plata', 'Timaná', 'Saladoblanco'],
  'Nariño': ['Pasto', 'La Unión', 'Sandoná', 'Consacá', 'Tangua', 'Yacuanquer'],
  'Cauca': ['Popayán', 'Inzá', 'Silvia', 'Caldono', 'Piendamó', 'Timbío'],
  'Tolima': ['Ibagué', 'Líbano', 'Chaparral', 'Planadas', 'Rioblanco', 'Rovira'],
  'Quindío': ['Armenia', 'Calarcá', 'Circasia', 'Filandia', 'La Tebaida', 'Montenegro'],
  'Risaralda': ['Pereira', 'Dosquebradas', 'Santa Rosa de Cabal', 'Marsella', 'Belén de Umbría'],
  'Caldas': ['Manizales', 'Chinchiná', 'Palestina', 'Villamaría', 'Neira', 'Anserma'],
  'Antioquia': ['Medellín', 'Andes', 'Ciudad Bolívar', 'Jardín', 'Jericó', 'Támesis'],
  'Cundinamarca': ['Bogotá', 'Fusagasugá', 'San Bernardo', 'Arbeláez', 'Tibacuy'],
  'Norte de Santander': ['Cúcuta', 'Ocaña', 'Pamplona', 'Chinácota', 'Villa del Rosario']
};

const COFFEE_VARIETIES = [
  'Caturra',
  'Colombia',
  'Castillo',
  'Típica',
  'Borbón',
  'Tabi',
  'Geisha',
  'Pink Bourbon',
  'Java',
  'Maragogipe'
];

const CERTIFICATIONS = [
  'Rainforest Alliance',
  'Fair Trade',
  'Orgánico',
  'UTZ',
  'Bird Friendly',
  'C.A.F.E. Practices',
  'Ninguna'
];

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedDepartment, setSelectedDepartment] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      coffeeVarieties: [],
      certifications: []
    }
  });

  const watchedCoffeeVarieties = watch('coffeeVarieties') || [];
  const watchedCertifications = watch('certifications') || [];

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          farmName: data.farmName,
          farmLocation: {
            department: data.department,
            municipality: data.municipality,
            address: data.address
          },
          farmSize: data.farmSize,
          coffeeVarieties: data.coffeeVarieties,
          certifications: data.certifications,
          experience: data.experience
        }),
      });

      if (response.ok) {
        navigate('/login', { 
          state: { 
            message: 'Registro exitoso. Revisa tu email para activar tu cuenta.',
            type: 'success'
          }
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en el registro');
      }
    } catch (error) {
      console.error('Error en registro:', error);
      alert(error instanceof Error ? error.message : 'Error en el registro');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = async () => {
    const fieldsToValidate = step === 1 
      ? ['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'phone']
      : ['farmName', 'department', 'municipality', 'address', 'farmSize', 'experience'];
    
    const isValid = await trigger(fieldsToValidate as any);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const toggleCoffeeVariety = (variety: string) => {
    const current = watchedCoffeeVarieties;
    const updated = current.includes(variety)
      ? current.filter(v => v !== variety)
      : [...current, variety];
    setValue('coffeeVarieties', updated);
  };

  const toggleCertification = (certification: string) => {
    const current = watchedCertifications;
    const updated = current.includes(certification)
      ? current.filter(c => c !== certification)
      : [...current, certification];
    setValue('certifications', updated);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-green-600 to-amber-600 rounded-xl flex items-center justify-center mb-4">
            <Leaf className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Únete a Café Colombia
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Registra tu finca y comienza a gestionar tu cultivo de café
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}>
                {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <span className="ml-2 text-sm font-medium">Datos Personales</span>
            </div>
            <div className={`w-8 h-1 ${step >= 2 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${step >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}>
                {step > 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
              </div>
              <span className="ml-2 text-sm font-medium">Información de Finca</span>
            </div>
            <div className={`w-8 h-1 ${step >= 3 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${step >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}>
                {step > 3 ? <CheckCircle className="w-5 h-5" /> : '3'}
              </div>
              <span className="ml-2 text-sm font-medium">Cultivo y Certificaciones</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-xl rounded-lg p-8">
          {/* Paso 1: Datos Personales */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Información Personal</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">Nombre</label>
                  <div className="mt-1 relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      {...register('firstName')}
                      id="firstName"
                      type="text"
                      className={`pl-10 appearance-none relative block w-full px-3 py-2 border ${
                        errors.firstName ? 'border-red-300' : 'border-gray-300'
                      } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500`}
                      placeholder="Tu nombre"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Apellido</label>
                  <div className="mt-1 relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      {...register('lastName')}
                      id="lastName"
                      type="text"
                      className={`pl-10 appearance-none relative block w-full px-3 py-2 border ${
                        errors.lastName ? 'border-red-300' : 'border-gray-300'
                      } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500`}
                      placeholder="Tu apellido"
                    />
                  </div>
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="regEmail" className="block text-sm font-medium text-gray-700">Email</label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    {...register('email')}
                    id="regEmail"
                    type="email"
                    autoComplete="email"
                    className={`pl-10 appearance-none relative block w-full px-3 py-2 border ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500`}
                    placeholder="tu@email.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Teléfono</label>
                <div className="mt-1 relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    {...register('phone')}
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    className={`pl-10 appearance-none relative block w-full px-3 py-2 border ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500`}
                    placeholder="+57 300 123 4567"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="regPassword" className="block text-sm font-medium text-gray-700">Contraseña</label>
                  <div className="mt-1 relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      {...register('password')}
                      id="regPassword"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className={`pl-10 pr-10 appearance-none relative block w-full px-3 py-2 border ${
                        errors.password ? 'border-red-300' : 'border-gray-300'
                      } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500`}
                      placeholder="Mínimo 8 caracteres"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirmar Contraseña</label>
                  <div className="mt-1 relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      {...register('confirmPassword')}
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className={`pl-10 pr-10 appearance-none relative block w-full px-3 py-2 border ${
                        errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500`}
                      placeholder="Repite la contraseña"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {/* Paso 2: Información de Finca */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Información de la Finca</h3>
              
              <div>
                <label htmlFor="farmName" className="block text-sm font-medium text-gray-700">Nombre de la Finca</label>
                <div className="mt-1 relative">
                  <Home className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    {...register('farmName')}
                    id="farmName"
                    type="text"
                    className={`pl-10 appearance-none relative block w-full px-3 py-2 border ${
                      errors.farmName ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500`}
                    placeholder="Ej: Finca El Paraíso"
                  />
                </div>
                {errors.farmName && (
                  <p className="mt-1 text-sm text-red-600">{errors.farmName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700">Departamento</label>
                  <div className="mt-1 relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <select
                      {...register('department')}
                      id="department"
                      className={`pl-10 appearance-none relative block w-full px-3 py-2 border ${
                        errors.department ? 'border-red-300' : 'border-gray-300'
                      } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500`}
                      onChange={(e) => {
                        setSelectedDepartment(e.target.value);
                        setValue('municipality', '');
                      }}
                    >
                      <option value="">Selecciona departamento</option>
                      {Object.keys(DEPARTMENTS).map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  {errors.department && (
                    <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="municipality" className="block text-sm font-medium text-gray-700">Municipio</label>
                  <div className="mt-1 relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <select
                      {...register('municipality')}
                      id="municipality"
                      className={`pl-10 appearance-none relative block w-full px-3 py-2 border ${
                        errors.municipality ? 'border-red-300' : 'border-gray-300'
                      } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500`}
                      disabled={!selectedDepartment}
                    >
                      <option value="">Selecciona municipio</option>
                      {selectedDepartment && DEPARTMENTS[selectedDepartment as keyof typeof DEPARTMENTS]?.map(mun => (
                        <option key={mun} value={mun}>{mun}</option>
                      ))}
                    </select>
                  </div>
                  {errors.municipality && (
                    <p className="mt-1 text-sm text-red-600">{errors.municipality.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">Dirección</label>
                <div className="mt-1">
                  <textarea
                    {...register('address')}
                    id="address"
                    rows={3}
                    className={`appearance-none relative block w-full px-3 py-2 border ${
                      errors.address ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500`}
                    placeholder="Vereda, kilómetro, referencias..."
                  />
                </div>
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="farmSize" className="block text-sm font-medium text-gray-700">Tamaño de la Finca (hectáreas)</label>
                  <div className="mt-1">
                    <input
                      {...register('farmSize', { valueAsNumber: true })}
                      id="farmSize"
                      type="number"
                      step="0.1"
                      min="0.1"
                      className={`appearance-none relative block w-full px-3 py-2 border ${
                        errors.farmSize ? 'border-red-300' : 'border-gray-300'
                      } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500`}
                      placeholder="Ej: 5.5"
                    />
                  </div>
                  {errors.farmSize && (
                    <p className="mt-1 text-sm text-red-600">{errors.farmSize.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="experience" className="block text-sm font-medium text-gray-700">Años de Experiencia</label>
                  <div className="mt-1">
                    <input
                      {...register('experience', { valueAsNumber: true })}
                      id="experience"
                      type="number"
                      min="0"
                      className={`appearance-none relative block w-full px-3 py-2 border ${
                        errors.experience ? 'border-red-300' : 'border-gray-300'
                      } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500`}
                      placeholder="Ej: 10"
                    />
                  </div>
                  {errors.experience && (
                    <p className="mt-1 text-sm text-red-600">{errors.experience.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {/* Paso 3: Cultivo y Certificaciones */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cultivo y Certificaciones</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Variedades de Café <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {COFFEE_VARIETIES.map(variety => {
                    const id = `coffeeVariety-${variety.replace(/\s+/g, '-')}`;
                    return (
                      <div key={variety} className="flex items-center">
                        <input
                          id={id}
                          name={`coffeeVarieties-${variety}`}
                          type="checkbox"
                          checked={watchedCoffeeVarieties.includes(variety)}
                          onChange={() => toggleCoffeeVariety(variety)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <label htmlFor={id} className="ml-2 text-sm text-gray-700">{variety}</label>
                      </div>
                    );
                  })}
                </div>
                {errors.coffeeVarieties && (
                  <p className="mt-1 text-sm text-red-600">{errors.coffeeVarieties.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Certificaciones (opcional)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {CERTIFICATIONS.map(certification => {
                    const id = `cert-${certification.replace(/\s+/g, '-')}`;
                    return (
                      <div key={certification} className="flex items-center">
                        <input
                          id={id}
                          name={`certifications-${certification}`}
                          type="checkbox"
                          checked={watchedCertifications.includes(certification)}
                          onChange={() => toggleCertification(certification)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <label htmlFor={id} className="ml-2 text-sm text-gray-700">{certification}</label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex items-center">
                  <input
                    {...register('terms')}
                    id="terms"
                    name="terms"
                    type="checkbox"
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
                    Acepto los{' '}
                    <a href="#" className="text-green-600 hover:text-green-500">
                      términos y condiciones
                    </a>{' '}
                    y la{' '}
                    <a href="#" className="text-green-600 hover:text-green-500">
                      política de privacidad
                    </a>
                  </label>
                </div>
                {errors.terms && (
                  <p className="mt-1 text-sm text-red-600">{errors.terms.message}</p>
                )}
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Anterior
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Registrando...' : 'Crear Cuenta'}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="font-medium text-green-600 hover:text-green-500">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
