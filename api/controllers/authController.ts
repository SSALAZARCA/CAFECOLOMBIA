import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../lib/database';
import { generateToken } from '../middleware/auth';
import { asyncHandler, NotFoundError, UnauthorizedError, ConflictError } from '../middleware/errorHandler';
import { UserRole } from '@prisma/client';

// Esquemas de validación
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  role: z.nativeEnum(UserRole).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'La contraseña actual es requerida'),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
});

// Login de usuario
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);

  // Buscar usuario por email
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError('Credenciales inválidas');
  }

  if (!user.isActive) {
    throw new UnauthorizedError('Usuario inactivo');
  }

  // Verificar contraseña
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Credenciales inválidas');
  }

  // Generar token
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  // Respuesta sin contraseña
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    message: 'Login exitoso',
    user: userWithoutPassword,
    token,
  });
});

// Registro de usuario
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, role = UserRole.TRABAJADOR } = registerSchema.parse(req.body);

  // Verificar si el usuario ya existe
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ConflictError('El usuario ya existe');
  }

  // Hash de la contraseña
  const hashedPassword = await bcrypt.hash(password, 10);

  // Crear usuario
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  // Generar token
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  res.status(201).json({
    message: 'Usuario registrado exitosamente',
    user,
    token,
  });
});

// Obtener perfil del usuario actual
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError('Usuario');
  }

  res.json({
    user,
  });
});

// Actualizar perfil del usuario
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  const updateSchema = z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
  });

  const { firstName, lastName } = updateSchema.parse(req.body);

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      updatedAt: true,
    },
  });

  res.json({
    message: 'Perfil actualizado exitosamente',
    user,
  });
});

// Cambiar contraseña
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

  // Obtener usuario con contraseña
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  if (!user) {
    throw new NotFoundError('Usuario');
  }

  // Verificar contraseña actual
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new UnauthorizedError('Contraseña actual incorrecta');
  }

  // Hash de la nueva contraseña
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  // Actualizar contraseña
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword },
  });

  res.json({
    message: 'Contraseña cambiada exitosamente',
  });
});

// Logout (invalidar token - en una implementación real se usaría una blacklist)
export const logout = asyncHandler(async (req: Request, res: Response) => {
  // En una implementación real, aquí se agregaría el token a una blacklist
  res.json({
    message: 'Logout exitoso',
  });
});

// Verificar token
export const verifyToken = asyncHandler(async (req: Request, res: Response) => {
  // Si llegamos aquí, el token es válido (verificado por el middleware)
  res.json({
    valid: true,
    user: req.user,
  });
});
