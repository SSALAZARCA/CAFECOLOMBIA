// Utilidades para formateo de números, moneda y texto

export class FormatUtils {
  
  /**
   * Formatea un número como moneda colombiana
   */
  static formatCurrency(amount: number, currency: string = 'COP'): string {
    if (isNaN(amount)) return '$0';
    
    const formatter = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    
    return formatter.format(amount);
  }

  /**
   * Formatea un número con separadores de miles
   */
  static formatNumber(num: number, decimals: number = 0): string {
    if (isNaN(num)) return '0';
    
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  }

  /**
   * Formatea un porcentaje
   */
  static formatPercentage(value: number, decimals: number = 1): string {
    if (isNaN(value)) return '0%';
    
    return new Intl.NumberFormat('es-CO', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value / 100);
  }

  /**
   * Formatea un área en hectáreas
   */
  static formatArea(area: number): string {
    if (isNaN(area)) return '0 ha';
    
    if (area < 1) {
      return `${this.formatNumber(area * 10000)} m²`;
    }
    
    return `${this.formatNumber(area, 2)} ha`;
  }

  /**
   * Formatea una altitud
   */
  static formatAltitude(altitude: number): string {
    if (isNaN(altitude)) return '0 msnm';
    
    return `${this.formatNumber(altitude)} msnm`;
  }

  /**
   * Formatea un peso en kilogramos
   */
  static formatWeight(weight: number): string {
    if (isNaN(weight)) return '0 kg';
    
    if (weight >= 1000) {
      return `${this.formatNumber(weight / 1000, 1)} t`;
    }
    
    return `${this.formatNumber(weight)} kg`;
  }

  /**
   * Convierte un texto a formato título (Primera Letra Mayúscula)
   */
  static toTitleCase(text: string): string {
    if (!text) return '';
    
    return text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  }

  /**
   * Trunca un texto a una longitud específica
   */
  static truncateText(text: string, maxLength: number, suffix: string = '...'): string {
    if (!text) return '';
    
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength - suffix.length) + suffix;
  }

  /**
   * Formatea un número de teléfono colombiano
   */
  static formatPhone(phone: string): string {
    if (!phone) return '';
    
    // Remover caracteres no numéricos excepto +
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // Si tiene código de país
    if (cleaned.startsWith('+57')) {
      const number = cleaned.substring(3);
      if (number.length === 10) {
        return `+57 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
      }
    }
    
    // Si es un número de 10 dígitos
    if (cleaned.length === 10) {
      return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
    }
    
    return phone; // Retornar original si no coincide con formato esperado
  }

  /**
   * Formatea un documento de identidad
   */
  static formatDocument(document: string, type: string): string {
    if (!document) return '';
    
    const cleaned = document.replace(/\D/g, '');
    
    switch (type.toUpperCase()) {
      case 'CC':
        // Cédula de ciudadanía: formato con puntos cada 3 dígitos
        return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      
      case 'NIT':
        // NIT: formato con guión antes del dígito verificador
        if (cleaned.length > 1) {
          const main = cleaned.slice(0, -1);
          const checkDigit = cleaned.slice(-1);
          return main.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + checkDigit;
        }
        return cleaned;
      
      default:
        return document;
    }
  }

  /**
   * Formatea un email ocultando parte del dominio
   */
  static maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email;
    
    const [localPart, domain] = email.split('@');
    const maskedLocal = localPart.length > 2 
      ? localPart.substring(0, 2) + '*'.repeat(localPart.length - 2)
      : localPart;
    
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Formatea un número de tarjeta de crédito
   */
  static maskCreditCard(cardNumber: string): string {
    if (!cardNumber) return '';
    
    const cleaned = cardNumber.replace(/\D/g, '');
    
    if (cleaned.length < 4) return cardNumber;
    
    const lastFour = cleaned.slice(-4);
    const masked = '*'.repeat(cleaned.length - 4);
    
    return masked + lastFour;
  }

  /**
   * Genera un slug a partir de un texto
   */
  static generateSlug(text: string): string {
    if (!text) return '';
    
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
      .trim()
      .replace(/\s+/g, '-') // Reemplazar espacios con guiones
      .replace(/-+/g, '-'); // Remover guiones múltiples
  }

  /**
   * Formatea un tamaño de archivo
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Formatea una duración en segundos a formato legible
   */
  static formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const remainingMinutes = Math.floor((seconds % 3600) / 60);
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
  }

  /**
   * Capitaliza la primera letra de cada palabra
   */
  static capitalizeWords(text: string): string {
    if (!text) return '';
    
    return text.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  /**
   * Convierte camelCase a snake_case
   */
  static camelToSnake(text: string): string {
    return text.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  /**
   * Convierte snake_case a camelCase
   */
  static snakeToCamel(text: string): string {
    return text.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Formatea un rango de números
   */
  static formatRange(min: number, max: number, unit: string = ''): string {
    if (min === max) {
      return `${this.formatNumber(min)}${unit}`;
    }
    
    return `${this.formatNumber(min)} - ${this.formatNumber(max)}${unit}`;
  }

  /**
   * Formatea coordenadas geográficas
   */
  static formatCoordinates(lat: number, lng: number, precision: number = 6): string {
    if (isNaN(lat) || isNaN(lng)) return '';
    
    const latFormatted = lat.toFixed(precision);
    const lngFormatted = lng.toFixed(precision);
    
    return `${latFormatted}, ${lngFormatted}`;
  }

  /**
   * Formatea un estado o status con color
   */
  static formatStatus(status: string): { text: string; color: string; bgColor: string } {
    const statusMap: { [key: string]: { text: string; color: string; bgColor: string } } = {
      active: { text: 'Activo', color: 'text-green-600', bgColor: 'bg-green-100' },
      inactive: { text: 'Inactivo', color: 'text-red-600', bgColor: 'bg-red-100' },
      pending: { text: 'Pendiente', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
      completed: { text: 'Completado', color: 'text-green-600', bgColor: 'bg-green-100' },
      cancelled: { text: 'Cancelado', color: 'text-red-600', bgColor: 'bg-red-100' },
      expired: { text: 'Expirado', color: 'text-gray-600', bgColor: 'bg-gray-100' },
      suspended: { text: 'Suspendido', color: 'text-orange-600', bgColor: 'bg-orange-100' },
      failed: { text: 'Fallido', color: 'text-red-600', bgColor: 'bg-red-100' },
      processing: { text: 'Procesando', color: 'text-blue-600', bgColor: 'bg-blue-100' },
      refunded: { text: 'Reembolsado', color: 'text-purple-600', bgColor: 'bg-purple-100' }
    };
    
    return statusMap[status.toLowerCase()] || { 
      text: this.toTitleCase(status), 
      color: 'text-gray-600', 
      bgColor: 'bg-gray-100' 
    };
  }

  /**
   * Formatea un nivel de prioridad
   */
  static formatPriority(priority: string): { text: string; color: string; bgColor: string } {
    const priorityMap: { [key: string]: { text: string; color: string; bgColor: string } } = {
      low: { text: 'Baja', color: 'text-green-600', bgColor: 'bg-green-100' },
      medium: { text: 'Media', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
      high: { text: 'Alta', color: 'text-orange-600', bgColor: 'bg-orange-100' },
      critical: { text: 'Crítica', color: 'text-red-600', bgColor: 'bg-red-100' }
    };
    
    return priorityMap[priority.toLowerCase()] || { 
      text: this.toTitleCase(priority), 
      color: 'text-gray-600', 
      bgColor: 'bg-gray-100' 
    };
  }

  /**
   * Formatea un tipo de usuario
   */
  static formatUserType(userType: string): string {
    const typeMap: { [key: string]: string } = {
      coffee_grower: 'Caficultor',
      consumer: 'Consumidor',
      admin: 'Administrador',
      super_admin: 'Superadministrador',
      moderator: 'Moderador'
    };
    
    return typeMap[userType] || this.toTitleCase(userType);
  }

  /**
   * Formatea un método de pago
   */
  static formatPaymentMethod(method: string): string {
    const methodMap: { [key: string]: string } = {
      credit_card: 'Tarjeta de Crédito',
      debit_card: 'Tarjeta Débito',
      bank_transfer: 'Transferencia Bancaria',
      cash: 'Efectivo',
      wompi: 'Wompi',
      pse: 'PSE'
    };
    
    return methodMap[method] || this.toTitleCase(method);
  }

  /**
   * Genera un código de referencia único
   */
  static generateReference(prefix: string = '', length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = prefix;
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  /**
   * Valida y formatea un código postal colombiano
   */
  static formatPostalCode(code: string): string {
    if (!code) return '';
    
    const cleaned = code.replace(/\D/g, '');
    
    // Códigos postales colombianos tienen 6 dígitos
    if (cleaned.length === 6) {
      return cleaned;
    }
    
    return code; // Retornar original si no es válido
  }

  /**
   * Formatea un número de lote o referencia
   */
  static formatBatchNumber(batch: string, length: number = 6): string {
    if (!batch) return '';
    
    return batch.toUpperCase().padStart(length, '0');
  }

  /**
   * Convierte bytes a formato legible con unidades específicas
   */
  static bytesToUnit(bytes: number, unit: 'KB' | 'MB' | 'GB'): string {
    const units = { KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
    const value = bytes / units[unit];
    
    return `${value.toFixed(2)} ${unit}`;
  }

  /**
   * Formatea un score o puntuación
   */
  static formatScore(score: number, maxScore: number = 100): string {
    const percentage = (score / maxScore) * 100;
    return `${score}/${maxScore} (${this.formatPercentage(percentage)})`;
  }
}