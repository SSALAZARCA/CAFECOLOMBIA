// =====================================================
// MODAL PARA CREAR/EDITAR USUARIOS
// Café Colombia - Super Administrator Panel
// =====================================================

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Eye, EyeOff } from 'lucide-react';
import { useAdminStore } from '@/stores/adminStore';
import { toast } from 'sonner';

// =====================================================
// ESQUEMAS DE VALIDACIÓN
// =====================================================

const userSchema = z.object({
  username: z
    .string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(50, 'El nombre de usuario no puede exceder 50 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo se permiten letras, números y guiones bajos'),
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Formato de email inválido'),
  firstName: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  lastName: z
    .string()
    .min(1, 'El apellido es requerido')
    .max(50, 'El apellido no puede exceder 50 caracteres'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una mayúscula, una minúscula y un número')
    .optional(),
  role: z.enum(['admin', 'user', 'coffee_grower'], {
    required_error: 'El rol es requerido'
  }),
  status: z.enum(['active', 'inactive', 'suspended'], {
    required_error: 'El estado es requerido'
  }),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Formato de teléfono inválido')
    .optional()
    .or(z.literal('')),
  location: z
    .string()
    .max(100, 'La ubicación no puede exceder 100 caracteres')
    .optional()
    .or(z.literal(''))
});

type UserFormData = z.infer<typeof userSchema>;

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user' | 'coffee_grower';
  status: 'active' | 'inactive' | 'suspended';
  phone?: string;
  location?: string;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onSave: (user: User) => void;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { useAuthenticatedFetch } = useAdminStore();

  const isEditing = !!user;

  // Esquema dinámico para edición (password opcional)
  const dynamicSchema = isEditing 
    ? userSchema.extend({
        password: z
          .string()
          .min(8, 'La contraseña debe tener al menos 8 caracteres')
          .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una mayúscula, una minúscula y un número')
          .optional()
          .or(z.literal(''))
      })
    : userSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<UserFormData>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: {
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      role: 'user',
      status: 'active',
      phone: '',
      location: ''
    }
  });

  // =====================================================
  // EFECTOS
  // =====================================================

  useEffect(() => {
    if (isOpen) {
      if (user) {
        // Cargar datos del usuario para edición
        setValue('username', user.username);
        setValue('email', user.email);
        setValue('firstName', user.firstName);
        setValue('lastName', user.lastName);
        setValue('role', user.role);
        setValue('status', user.status);
        setValue('phone', user.phone || '');
        setValue('location', user.location || '');
        setValue('password', ''); // Password vacío para edición
      } else {
        // Resetear formulario para nuevo usuario
        reset();
      }
    }
  }, [isOpen, user, setValue, reset]);

  // =====================================================
  // MANEJO DEL FORMULARIO
  // =====================================================

  const onSubmit = async (data: UserFormData) => {
    try {
      setIsLoading(true);

      // Preparar datos para envío
      const submitData = { ...data };
      
      // Si es edición y password está vacío, no enviarlo
      if (isEditing && !submitData.password) {
        delete submitData.password;
      }

      // Limpiar campos opcionales vacíos
      if (!submitData.phone) delete submitData.phone;
      if (!submitData.location) delete submitData.location;

      const url = isEditing ? `/admin/users/${user!.id}` : '/admin/users';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await useAuthenticatedFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        const savedUser = await response.json();
        onSave(savedUser);
        toast.success(isEditing ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente');
        onClose();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error al guardar usuario');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      reset();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de usuario *
              </label>
              <input
                {...register('username')}
                type="text"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                placeholder="usuario123"
              />
              {errors.username && (
                <p className="text-red-600 text-sm mt-1">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                {...register('email')}
                type="email"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                placeholder="usuario@ejemplo.com"
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                {...register('firstName')}
                type="text"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                placeholder="Juan"
              />
              {errors.firstName && (
                <p className="text-red-600 text-sm mt-1">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellido *
              </label>
              <input
                {...register('lastName')}
                type="text"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                placeholder="Pérez"
              />
              {errors.lastName && (
                <p className="text-red-600 text-sm mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña {isEditing ? '(dejar vacío para mantener actual)' : '*'}
            </label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                disabled={isLoading}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                placeholder={isEditing ? "Dejar vacío para no cambiar" : "Mínimo 8 caracteres"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Rol y Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol *
              </label>
              <select
                {...register('role')}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
              >
                <option value="user">Usuario</option>
                <option value="coffee_grower">Cafetalero</option>
                <option value="admin">Administrador</option>
              </select>
              {errors.role && (
                <p className="text-red-600 text-sm mt-1">{errors.role.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado *
              </label>
              <select
                {...register('status')}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="suspended">Suspendido</option>
              </select>
              {errors.status && (
                <p className="text-red-600 text-sm mt-1">{errors.status.message}</p>
              )}
            </div>
          </div>

          {/* Información adicional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                {...register('phone')}
                type="tel"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                placeholder="+57 300 123 4567"
              />
              {errors.phone && (
                <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ubicación
              </label>
              <input
                {...register('location')}
                type="text"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                placeholder="Ciudad, País"
              />
              {errors.location && (
                <p className="text-red-600 text-sm mt-1">{errors.location.message}</p>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Usuario')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;