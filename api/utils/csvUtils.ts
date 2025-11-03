// Utilidades para manejo de archivos CSV

export interface CSVColumn {
  key: string;
  header: string;
  formatter?: (value: any) => string;
}

export class CSVUtils {
  
  /**
   * Convierte un array de objetos a formato CSV
   */
  static arrayToCSV(data: any[], columns?: CSVColumn[]): string {
    if (!data || data.length === 0) {
      return '';
    }

    // Si no se proporcionan columnas, usar todas las propiedades del primer objeto
    if (!columns) {
      const firstItem = data[0];
      columns = Object.keys(firstItem).map(key => ({
        key,
        header: key
      }));
    }

    // Crear encabezados
    const headers = columns.map(col => this.escapeCSVValue(col.header));
    const csvRows = [headers.join(',')];

    // Procesar cada fila de datos
    for (const item of data) {
      const row = columns.map(col => {
        let value = item[col.key];
        
        // Aplicar formateador si existe
        if (col.formatter && typeof col.formatter === 'function') {
          value = col.formatter(value);
        }
        
        return this.escapeCSVValue(value);
      });
      
      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Escapa un valor para CSV (maneja comillas, comas y saltos de línea)
   */
  static escapeCSVValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    let stringValue = String(value);

    // Si el valor contiene comillas, comas o saltos de línea, debe ir entre comillas
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
      // Escapar comillas dobles duplicándolas
      stringValue = stringValue.replace(/"/g, '""');
      // Envolver en comillas
      stringValue = `"${stringValue}"`;
    }

    return stringValue;
  }

  /**
   * Parsea una línea CSV respetando comillas y comas
   */
  static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Comilla escapada
          current += '"';
          i += 2;
        } else {
          // Inicio o fin de comillas
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // Separador de campo
        result.push(current);
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    // Agregar el último campo
    result.push(current);

    return result;
  }

  /**
   * Convierte CSV string a array de objetos
   */
  static csvToArray(csvString: string, hasHeaders: boolean = true): any[] {
    if (!csvString.trim()) {
      return [];
    }

    const lines = csvString.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      return [];
    }

    let headers: string[] = [];
    let dataStartIndex = 0;

    if (hasHeaders) {
      headers = this.parseCSVLine(lines[0]);
      dataStartIndex = 1;
    } else {
      // Generar headers automáticos
      const firstRow = this.parseCSVLine(lines[0]);
      headers = firstRow.map((_, index) => `column_${index + 1}`);
    }

    const result: any[] = [];

    for (let i = dataStartIndex; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const obj: any = {};

      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });

      result.push(obj);
    }

    return result;
  }

  /**
   * Genera CSV para reportes con metadatos
   */
  static generateReportCSV(data: any[], reportInfo: {
    title: string;
    generatedAt: string;
    generatedBy: string;
    filters?: any;
  }, columns: CSVColumn[]): string {
    const csvRows: string[] = [];

    // Agregar metadatos del reporte
    csvRows.push(`# ${reportInfo.title}`);
    csvRows.push(`# Generado el: ${reportInfo.generatedAt}`);
    csvRows.push(`# Generado por: ${reportInfo.generatedBy}`);
    
    if (reportInfo.filters) {
      csvRows.push(`# Filtros aplicados: ${JSON.stringify(reportInfo.filters)}`);
    }
    
    csvRows.push(''); // Línea vacía

    // Agregar datos
    const dataCSV = this.arrayToCSV(data, columns);
    csvRows.push(dataCSV);

    return csvRows.join('\n');
  }

  /**
   * Valida la estructura de un CSV
   */
  static validateCSVStructure(csvString: string, expectedColumns: string[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!csvString.trim()) {
      errors.push('El archivo CSV está vacío');
      return { isValid: false, errors, warnings };
    }

    const lines = csvString.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      errors.push('El archivo CSV debe tener al menos una fila de encabezados y una fila de datos');
      return { isValid: false, errors, warnings };
    }

    // Validar encabezados
    const headers = this.parseCSVLine(lines[0]);
    
    // Verificar columnas requeridas
    for (const expectedCol of expectedColumns) {
      if (!headers.includes(expectedCol)) {
        errors.push(`Columna requerida faltante: ${expectedCol}`);
      }
    }

    // Verificar columnas adicionales
    for (const header of headers) {
      if (!expectedColumns.includes(header)) {
        warnings.push(`Columna adicional encontrada: ${header}`);
      }
    }

    // Validar consistencia de columnas en todas las filas
    const expectedColumnCount = headers.length;
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length !== expectedColumnCount) {
        errors.push(`Fila ${i + 1}: Número incorrecto de columnas (esperado: ${expectedColumnCount}, encontrado: ${values.length})`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Limpia y normaliza datos CSV
   */
  static cleanCSVData(data: any[]): any[] {
    return data.map(row => {
      const cleanedRow: any = {};
      
      for (const [key, value] of Object.entries(row)) {
        let cleanedValue = value;
        
        if (typeof value === 'string') {
          // Limpiar espacios en blanco
          cleanedValue = value.trim();
          
          // Convertir strings vacíos a null
          if (cleanedValue === '') {
            cleanedValue = null;
          }
          
          // Intentar convertir números
          if (cleanedValue && !isNaN(Number(cleanedValue))) {
            const numValue = Number(cleanedValue);
            if (Number.isInteger(numValue)) {
              cleanedValue = numValue;
            } else {
              cleanedValue = parseFloat(cleanedValue);
            }
          }
          
          // Convertir booleanos
          if (cleanedValue === 'true' || cleanedValue === 'TRUE') {
            cleanedValue = true;
          } else if (cleanedValue === 'false' || cleanedValue === 'FALSE') {
            cleanedValue = false;
          }
        }
        
        cleanedRow[key] = cleanedValue;
      }
      
      return cleanedRow;
    });
  }

  /**
   * Genera un nombre de archivo CSV con timestamp
   */
  static generateFileName(baseName: string, extension: string = 'csv'): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `${baseName}_${timestamp}.${extension}`;
  }

  /**
   * Convierte datos de base de datos a formato CSV amigable
   */
  static formatDatabaseResults(results: any[], columnMappings: { [dbColumn: string]: CSVColumn }): string {
    const columns = Object.values(columnMappings);
    
    // Mapear los datos usando las claves de la base de datos
    const mappedData = results.map(row => {
      const mappedRow: any = {};
      
      for (const [dbColumn, csvColumn] of Object.entries(columnMappings)) {
        mappedRow[csvColumn.key] = row[dbColumn];
      }
      
      return mappedRow;
    });

    return this.arrayToCSV(mappedData, columns);
  }

  /**
   * Crea columnas CSV con formateo específico para diferentes tipos de datos
   */
  static createColumns(definitions: Array<{
    key: string;
    header: string;
    type?: 'string' | 'number' | 'currency' | 'date' | 'boolean' | 'percentage';
    format?: any;
  }>): CSVColumn[] {
    return definitions.map(def => {
      let formatter: ((value: any) => string) | undefined;

      switch (def.type) {
        case 'currency':
          formatter = (value) => {
            if (value === null || value === undefined) return '';
            const currency = def.format?.currency || 'COP';
            return new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: currency
            }).format(Number(value));
          };
          break;

        case 'number':
          formatter = (value) => {
            if (value === null || value === undefined) return '';
            const decimals = def.format?.decimals || 0;
            return new Intl.NumberFormat('es-CO', {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals
            }).format(Number(value));
          };
          break;

        case 'percentage':
          formatter = (value) => {
            if (value === null || value === undefined) return '';
            const decimals = def.format?.decimals || 1;
            return new Intl.NumberFormat('es-CO', {
              style: 'percent',
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals
            }).format(Number(value) / 100);
          };
          break;

        case 'date':
          formatter = (value) => {
            if (!value) return '';
            const date = new Date(value);
            const format = def.format?.format || 'es-CO';
            const options = def.format?.options || {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            };
            return date.toLocaleDateString(format, options);
          };
          break;

        case 'boolean':
          formatter = (value) => {
            if (value === null || value === undefined) return '';
            const trueText = def.format?.trueText || 'Sí';
            const falseText = def.format?.falseText || 'No';
            return value ? trueText : falseText;
          };
          break;

        default:
          formatter = (value) => {
            if (value === null || value === undefined) return '';
            return String(value);
          };
      }

      return {
        key: def.key,
        header: def.header,
        formatter
      };
    });
  }

  /**
   * Calcula estadísticas básicas de un dataset CSV
   */
  static calculateStats(data: any[]): {
    totalRows: number;
    totalColumns: number;
    emptyRows: number;
    duplicateRows: number;
    columnStats: { [column: string]: { emptyValues: number; uniqueValues: number } };
  } {
    if (!data || data.length === 0) {
      return {
        totalRows: 0,
        totalColumns: 0,
        emptyRows: 0,
        duplicateRows: 0,
        columnStats: {}
      };
    }

    const totalRows = data.length;
    const columns = Object.keys(data[0]);
    const totalColumns = columns.length;

    // Contar filas vacías
    const emptyRows = data.filter(row => 
      columns.every(col => !row[col] || String(row[col]).trim() === '')
    ).length;

    // Contar filas duplicadas
    const rowStrings = data.map(row => JSON.stringify(row));
    const uniqueRows = new Set(rowStrings);
    const duplicateRows = totalRows - uniqueRows.size;

    // Estadísticas por columna
    const columnStats: { [column: string]: { emptyValues: number; uniqueValues: number } } = {};
    
    for (const column of columns) {
      const values = data.map(row => row[column]);
      const emptyValues = values.filter(val => !val || String(val).trim() === '').length;
      const uniqueValues = new Set(values.filter(val => val && String(val).trim() !== '')).size;
      
      columnStats[column] = { emptyValues, uniqueValues };
    }

    return {
      totalRows,
      totalColumns,
      emptyRows,
      duplicateRows,
      columnStats
    };
  }
}