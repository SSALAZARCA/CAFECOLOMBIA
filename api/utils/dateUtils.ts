// Utilidades para manejo de fechas

export class DateUtils {
  
  /**
   * Obtiene la fecha actual en formato ISO
   */
  static now(): string {
    return new Date().toISOString();
  }

  /**
   * Obtiene la fecha actual en formato MySQL
   */
  static nowMySQL(): string {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }

  /**
   * Convierte una fecha a formato MySQL
   */
  static toMySQL(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().slice(0, 19).replace('T', ' ');
  }

  /**
   * Agrega días a una fecha
   */
  static addDays(date: Date | string, days: number): Date {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  /**
   * Agrega meses a una fecha
   */
  static addMonths(date: Date | string, months: number): Date {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  }

  /**
   * Agrega años a una fecha
   */
  static addYears(date: Date | string, years: number): Date {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    d.setFullYear(d.getFullYear() + years);
    return d;
  }

  /**
   * Calcula la diferencia en días entre dos fechas
   */
  static diffInDays(date1: Date | string, date2: Date | string): number {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calcula la diferencia en meses entre dos fechas
   */
  static diffInMonths(date1: Date | string, date2: Date | string): number {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    
    let months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth();
    months += d2.getMonth();
    
    return months;
  }

  /**
   * Obtiene el inicio del día
   */
  static startOfDay(date: Date | string): Date {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Obtiene el final del día
   */
  static endOfDay(date: Date | string): Date {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  /**
   * Obtiene el inicio del mes
   */
  static startOfMonth(date: Date | string): Date {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  /**
   * Obtiene el final del mes
   */
  static endOfMonth(date: Date | string): Date {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  /**
   * Obtiene el inicio del año
   */
  static startOfYear(date: Date | string): Date {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    return new Date(d.getFullYear(), 0, 1);
  }

  /**
   * Obtiene el final del año
   */
  static endOfYear(date: Date | string): Date {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
  }

  /**
   * Verifica si una fecha está en el pasado
   */
  static isPast(date: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d < new Date();
  }

  /**
   * Verifica si una fecha está en el futuro
   */
  static isFuture(date: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d > new Date();
  }

  /**
   * Verifica si una fecha es hoy
   */
  static isToday(date: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }

  /**
   * Formatea una fecha en formato colombiano
   */
  static formatColombian(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Formatea una fecha en formato corto
   */
  static formatShort(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  /**
   * Formatea una fecha con hora
   */
  static formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Obtiene el rango de fechas para un período específico
   */
  static getDateRange(period: string, customStart?: string, customEnd?: string): { start: Date; end: Date } {
    const now = new Date();
    let start: Date;
    let end: Date = new Date();

    switch (period) {
      case 'today':
        start = this.startOfDay(now);
        end = this.endOfDay(now);
        break;
      
      case 'yesterday':
        const yesterday = this.addDays(now, -1);
        start = this.startOfDay(yesterday);
        end = this.endOfDay(yesterday);
        break;
      
      case 'last_7_days':
        start = this.startOfDay(this.addDays(now, -7));
        end = this.endOfDay(now);
        break;
      
      case 'last_30_days':
        start = this.startOfDay(this.addDays(now, -30));
        end = this.endOfDay(now);
        break;
      
      case 'this_month':
        start = this.startOfMonth(now);
        end = this.endOfMonth(now);
        break;
      
      case 'last_month':
        const lastMonth = this.addMonths(now, -1);
        start = this.startOfMonth(lastMonth);
        end = this.endOfMonth(lastMonth);
        break;
      
      case 'this_year':
        start = this.startOfYear(now);
        end = this.endOfYear(now);
        break;
      
      case 'last_year':
        const lastYear = this.addYears(now, -1);
        start = this.startOfYear(lastYear);
        end = this.endOfYear(lastYear);
        break;
      
      case 'custom':
        if (!customStart || !customEnd) {
          throw new Error('Fechas de inicio y fin son requeridas para período personalizado');
        }
        start = this.startOfDay(new Date(customStart));
        end = this.endOfDay(new Date(customEnd));
        break;
      
      default:
        // Por defecto, últimos 30 días
        start = this.startOfDay(this.addDays(now, -30));
        end = this.endOfDay(now);
    }

    return { start, end };
  }

  /**
   * Genera un array de fechas entre dos fechas
   */
  static getDatesBetween(startDate: Date | string, endDate: Date | string): Date[] {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    const dates: Date[] = [];
    
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  }

  /**
   * Calcula la edad en años
   */
  static calculateAge(birthDate: Date | string): number {
    const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    const today = new Date();
    
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Obtiene el nombre del mes en español
   */
  static getMonthName(month: number): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month] || '';
  }

  /**
   * Obtiene el nombre del día de la semana en español
   */
  static getDayName(day: number): string {
    const days = [
      'Domingo', 'Lunes', 'Martes', 'Miércoles', 
      'Jueves', 'Viernes', 'Sábado'
    ];
    return days[day] || '';
  }

  /**
   * Convierte una duración en días a texto legible
   */
  static durationToText(days: number): string {
    if (days < 7) {
      return `${days} día${days !== 1 ? 's' : ''}`;
    } else if (days < 30) {
      const weeks = Math.floor(days / 7);
      const remainingDays = days % 7;
      let text = `${weeks} semana${weeks !== 1 ? 's' : ''}`;
      if (remainingDays > 0) {
        text += ` y ${remainingDays} día${remainingDays !== 1 ? 's' : ''}`;
      }
      return text;
    } else if (days < 365) {
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      let text = `${months} mes${months !== 1 ? 'es' : ''}`;
      if (remainingDays > 0) {
        text += ` y ${remainingDays} día${remainingDays !== 1 ? 's' : ''}`;
      }
      return text;
    } else {
      const years = Math.floor(days / 365);
      const remainingDays = days % 365;
      let text = `${years} año${years !== 1 ? 's' : ''}`;
      if (remainingDays > 0) {
        const months = Math.floor(remainingDays / 30);
        if (months > 0) {
          text += ` y ${months} mes${months !== 1 ? 'es' : ''}`;
        }
      }
      return text;
    }
  }

  /**
   * Valida si una fecha es válida
   */
  static isValidDate(date: any): boolean {
    if (!date) return false;
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
  }

  /**
   * Obtiene el timestamp en segundos
   */
  static getTimestamp(date?: Date | string): number {
    const d = date ? (typeof date === 'string' ? new Date(date) : date) : new Date();
    return Math.floor(d.getTime() / 1000);
  }

  /**
   * Convierte timestamp a fecha
   */
  static fromTimestamp(timestamp: number): Date {
    return new Date(timestamp * 1000);
  }

  /**
   * Obtiene el tiempo relativo (hace X tiempo)
   */
  static timeAgo(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSecs < 60) {
      return 'hace unos segundos';
    } else if (diffMins < 60) {
      return `hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    } else if (diffDays < 30) {
      return `hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
    } else if (diffMonths < 12) {
      return `hace ${diffMonths} mes${diffMonths !== 1 ? 'es' : ''}`;
    } else {
      return `hace ${diffYears} año${diffYears !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Obtiene las fechas de inicio y fin de una semana
   */
  static getWeekRange(date: Date | string): { start: Date; end: Date } {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para que lunes sea el primer día
    
    const start = new Date(d.setDate(diff));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    return {
      start: this.startOfDay(start),
      end: this.endOfDay(end)
    };
  }

  /**
   * Obtiene el número de la semana del año
   */
  static getWeekNumber(date: Date | string): number {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
    const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
}