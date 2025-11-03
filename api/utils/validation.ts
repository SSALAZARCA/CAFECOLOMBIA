// Utilidades de validación para el backend

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export class ValidationResult {
  public errors: ValidationError[] = [];
  
  constructor() {}

  addError(field: string, message: string, value?: any): void {
    this.errors.push({ field, message, value });
  }

  isValid(): boolean {
    return this.errors.length === 0;
  }

  getErrors(): ValidationError[] {
    return this.errors;
  }

  getFirstError(): string | null {
    return this.errors.length > 0 ? this.errors[0].message : null;
  }
}

// Validadores básicos
export const validators = {
  required: (value: any, fieldName: string): ValidationError | null => {
    if (value === undefined || value === null || value === '') {
      return { field: fieldName, message: `${fieldName} es requerido` };
    }
    return null;
  },

  email: (value: string, fieldName: string = 'email'): ValidationError | null => {
    if (!value) return null; // Solo validar si hay valor
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { field: fieldName, message: 'Formato de email inválido' };
    }
    return null;
  },

  minLength: (value: string, minLength: number, fieldName: string): ValidationError | null => {
    if (!value) return null; // Solo validar si hay valor
    
    if (value.length < minLength) {
      return { 
        field: fieldName, 
        message: `${fieldName} debe tener al menos ${minLength} caracteres`,
        value: value.length 
      };
    }
    return null;
  },

  maxLength: (value: string, maxLength: number, fieldName: string): ValidationError | null => {
    if (!value) return null; // Solo validar si hay valor
    
    if (value.length > maxLength) {
      return { 
        field: fieldName, 
        message: `${fieldName} no puede tener más de ${maxLength} caracteres`,
        value: value.length 
      };
    }
    return null;
  },

  numeric: (value: any, fieldName: string): ValidationError | null => {
    if (value === undefined || value === null || value === '') return null;
    
    if (isNaN(Number(value))) {
      return { field: fieldName, message: `${fieldName} debe ser un número válido` };
    }
    return null;
  },

  integer: (value: any, fieldName: string): ValidationError | null => {
    if (value === undefined || value === null || value === '') return null;
    
    if (!Number.isInteger(Number(value))) {
      return { field: fieldName, message: `${fieldName} debe ser un número entero` };
    }
    return null;
  },

  min: (value: number, min: number, fieldName: string): ValidationError | null => {
    if (value === undefined || value === null) return null;
    
    if (Number(value) < min) {
      return { 
        field: fieldName, 
        message: `${fieldName} debe ser mayor o igual a ${min}`,
        value: Number(value)
      };
    }
    return null;
  },

  max: (value: number, max: number, fieldName: string): ValidationError | null => {
    if (value === undefined || value === null) return null;
    
    if (Number(value) > max) {
      return { 
        field: fieldName, 
        message: `${fieldName} debe ser menor o igual a ${max}`,
        value: Number(value)
      };
    }
    return null;
  },

  phone: (value: string, fieldName: string = 'teléfono'): ValidationError | null => {
    if (!value) return null;
    
    // Formato colombiano: +57 seguido de 10 dígitos o solo 10 dígitos
    const phoneRegex = /^(\+57)?[0-9]{10}$/;
    if (!phoneRegex.test(value.replace(/\s/g, ''))) {
      return { field: fieldName, message: 'Formato de teléfono inválido (debe ser +57XXXXXXXXXX o XXXXXXXXXX)' };
    }
    return null;
  },

  url: (value: string, fieldName: string = 'URL'): ValidationError | null => {
    if (!value) return null;
    
    try {
      new URL(value);
      return null;
    } catch {
      return { field: fieldName, message: 'Formato de URL inválido' };
    }
  },

  date: (value: string, fieldName: string = 'fecha'): ValidationError | null => {
    if (!value) return null;
    
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return { field: fieldName, message: 'Formato de fecha inválido' };
    }
    return null;
  },

  coordinates: (lat: number, lng: number): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    if (lat < -90 || lat > 90) {
      errors.push({ field: 'latitude', message: 'Latitud debe estar entre -90 y 90' });
    }
    
    if (lng < -180 || lng > 180) {
      errors.push({ field: 'longitude', message: 'Longitud debe estar entre -180 y 180' });
    }
    
    return errors;
  },

  oneOf: (value: any, options: any[], fieldName: string): ValidationError | null => {
    if (value === undefined || value === null) return null;
    
    if (!options.includes(value)) {
      return { 
        field: fieldName, 
        message: `${fieldName} debe ser uno de: ${options.join(', ')}`,
        value 
      };
    }
    return null;
  },

  password: (value: string, fieldName: string = 'contraseña'): ValidationError | null => {
    if (!value) return null;
    
    const errors: string[] = [];
    
    if (value.length < 8) {
      errors.push('al menos 8 caracteres');
    }
    
    if (!/[A-Z]/.test(value)) {
      errors.push('al menos una letra mayúscula');
    }
    
    if (!/[a-z]/.test(value)) {
      errors.push('al menos una letra minúscula');
    }
    
    if (!/[0-9]/.test(value)) {
      errors.push('al menos un número');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      errors.push('al menos un carácter especial');
    }
    
    if (errors.length > 0) {
      return { 
        field: fieldName, 
        message: `${fieldName} debe contener ${errors.join(', ')}` 
      };
    }
    
    return null;
  }
};

// Validador de esquemas
export function validateSchema(data: any, schema: any): ValidationResult {
  const result = new ValidationResult();

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    const fieldRules = Array.isArray(rules) ? rules : [rules];

    for (const rule of fieldRules) {
      if (typeof rule === 'function') {
        const error = rule(value, field);
        if (error) {
          result.addError(error.field, error.message, error.value);
        }
      } else if (typeof rule === 'object' && rule.validator) {
        const error = rule.validator(value, field, ...(rule.params || []));
        if (error) {
          result.addError(error.field, error.message, error.value);
        }
      }
    }
  }

  return result;
}

// Esquemas de validación predefinidos
export const schemas = {
  adminUser: {
    email: [validators.required, validators.email],
    firstName: [validators.required, (v: string) => validators.maxLength(v, 50, 'nombre')],
    lastName: [validators.required, (v: string) => validators.maxLength(v, 50, 'apellido')],
    password: [validators.required, validators.password],
    role: [validators.required, (v: string) => validators.oneOf(v, ['super_admin', 'admin', 'moderator'], 'rol')]
  },

  coffeeGrower: {
    email: [validators.required, validators.email],
    firstName: [validators.required, (v: string) => validators.maxLength(v, 100, 'nombre')],
    lastName: [validators.required, (v: string) => validators.maxLength(v, 100, 'apellido')],
    phone: [validators.required, validators.phone],
    documentType: [validators.required, (v: string) => validators.oneOf(v, ['CC', 'CE', 'NIT'], 'tipo de documento')],
    documentNumber: [validators.required, (v: string) => validators.maxLength(v, 20, 'número de documento')],
    department: [validators.required, (v: string) => validators.maxLength(v, 100, 'departamento')],
    municipality: [validators.required, (v: string) => validators.maxLength(v, 100, 'municipio')]
  },

  farm: {
    name: [validators.required, (v: string) => validators.maxLength(v, 200, 'nombre de finca')],
    coffeeGrowerId: [validators.required, validators.integer],
    department: [validators.required, (v: string) => validators.maxLength(v, 100, 'departamento')],
    municipality: [validators.required, (v: string) => validators.maxLength(v, 100, 'municipio')],
    vereda: [(v: string) => validators.maxLength(v, 100, 'vereda')],
    totalArea: [validators.required, validators.numeric, (v: number) => validators.min(v, 0.1, 'área total')],
    coffeeArea: [validators.required, validators.numeric, (v: number) => validators.min(v, 0.1, 'área de café')],
    altitude: [validators.numeric, (v: number) => validators.min(v, 0, 'altitud')],
    varietyCoffee: [(v: string) => validators.maxLength(v, 100, 'variedad de café')],
    productionPerYear: [validators.numeric, (v: number) => validators.min(v, 0, 'producción anual')]
  },

  subscriptionPlan: {
    name: [validators.required, (v: string) => validators.maxLength(v, 100, 'nombre del plan')],
    description: [validators.required, (v: string) => validators.maxLength(v, 500, 'descripción')],
    price: [validators.required, validators.numeric, (v: number) => validators.min(v, 0, 'precio')],
    duration: [validators.required, validators.integer, (v: number) => validators.min(v, 1, 'duración')],
    durationType: [validators.required, (v: string) => validators.oneOf(v, ['days', 'months', 'years'], 'tipo de duración')],
    maxFarms: [validators.integer, (v: number) => validators.min(v, 1, 'máximo de fincas')],
    maxUsers: [validators.integer, (v: number) => validators.min(v, 1, 'máximo de usuarios')]
  },

  subscription: {
    userId: [validators.required, validators.integer],
    planId: [validators.required, validators.integer],
    startDate: [validators.required, validators.date],
    endDate: [validators.required, validators.date]
  },

  payment: {
    userId: [validators.required, validators.integer],
    subscriptionId: [validators.required, validators.integer],
    amount: [validators.required, validators.numeric, (v: number) => validators.min(v, 0.01, 'monto')],
    currency: [validators.required, (v: string) => validators.oneOf(v, ['COP', 'USD'], 'moneda')],
    paymentMethod: [validators.required, (v: string) => validators.oneOf(v, ['credit_card', 'debit_card', 'bank_transfer', 'cash'], 'método de pago')]
  },

  user: {
    email: [validators.required, validators.email],
    firstName: [validators.required, (v: string) => validators.maxLength(v, 100, 'nombre')],
    lastName: [validators.required, (v: string) => validators.maxLength(v, 100, 'apellido')],
    phone: [validators.phone],
    userType: [validators.required, (v: string) => validators.oneOf(v, ['coffee_grower', 'consumer'], 'tipo de usuario')]
  }
};

// Función helper para validar datos con esquema
export function validate(data: any, schemaName: keyof typeof schemas): ValidationResult {
  const schema = schemas[schemaName];
  if (!schema) {
    throw new Error(`Esquema de validación '${schemaName}' no encontrado`);
  }
  
  return validateSchema(data, schema);
}

// Middleware de validación para Express
export function validationMiddleware(schemaName: keyof typeof schemas) {
  return (req: any, res: any, next: any) => {
    const result = validate(req.body, schemaName);
    
    if (!result.isValid()) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: result.getErrors()
      });
    }
    
    next();
  };
}

// Sanitización de datos
export const sanitizers = {
  trim: (value: string): string => {
    return typeof value === 'string' ? value.trim() : value;
  },

  toLowerCase: (value: string): string => {
    return typeof value === 'string' ? value.toLowerCase() : value;
  },

  toUpperCase: (value: string): string => {
    return typeof value === 'string' ? value.toUpperCase() : value;
  },

  removeSpaces: (value: string): string => {
    return typeof value === 'string' ? value.replace(/\s/g, '') : value;
  },

  normalizePhone: (value: string): string => {
    if (typeof value !== 'string') return value;
    
    // Remover espacios y caracteres especiales
    let phone = value.replace(/[\s\-\(\)]/g, '');
    
    // Si no tiene código de país, agregar +57
    if (phone.length === 10 && !phone.startsWith('+')) {
      phone = '+57' + phone;
    }
    
    return phone;
  },

  normalizeEmail: (value: string): string => {
    return typeof value === 'string' ? value.toLowerCase().trim() : value;
  }
};

// Función para sanitizar objeto completo
export function sanitizeData(data: any, sanitizationRules: { [key: string]: Function[] }): any {
  const sanitized = { ...data };

  for (const [field, rules] of Object.entries(sanitizationRules)) {
    if (sanitized[field] !== undefined) {
      let value = sanitized[field];
      
      for (const rule of rules) {
        value = rule(value);
      }
      
      sanitized[field] = value;
    }
  }

  return sanitized;
}