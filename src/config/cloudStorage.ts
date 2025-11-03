// Cloud Storage configuration for CaféColombia PWA
import { getFirebaseStorage } from './firebase';

// Cloud storage provider types
export type StorageProvider = 'firebase' | 'aws' | 'gcp' | 'azure';

// Cloud storage configuration interface
export interface CloudStorageConfig {
  provider: StorageProvider;
  bucket: string;
  region?: string;
  accessKey?: string;
  secretKey?: string;
  maxFileSize: number;
  allowedFileTypes: string[];
  enableCompression: boolean;
  enableEncryption: boolean;
  retentionDays: number;
}

// File upload configuration
export interface FileUploadConfig {
  maxSize: number;
  allowedTypes: string[];
  compressionQuality: number;
  generateThumbnails: boolean;
  thumbnailSizes: number[];
  enableProgressTracking: boolean;
  chunkSize: number; // for large file uploads
}

// Storage paths configuration
export interface StoragePaths {
  images: {
    original: string;
    processed: string;
    thumbnails: string;
    analysis: string;
  };
  documents: {
    reports: string;
    certificates: string;
    manuals: string;
  };
  ai: {
    models: string;
    cache: string;
    results: string;
    logs: string;
  };
  backups: {
    database: string;
    configurations: string;
    userdata: string;
  };
}

// Get cloud storage configuration from environment variables
const getCloudStorageConfig = (): CloudStorageConfig => {
  return {
    provider: 'firebase', // Default to Firebase
    bucket: import.meta.env.VITE_STORAGE_BUCKET || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    region: 'us-central1', // Default Firebase region
    accessKey: import.meta.env.STORAGE_ACCESS_KEY || '',
    secretKey: import.meta.env.STORAGE_SECRET_KEY || '',
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedFileTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'application/pdf',
      'text/csv',
      'application/json'
    ],
    enableCompression: true,
    enableEncryption: true,
    retentionDays: 365 // 1 year
  };
};

// File upload configuration
const getFileUploadConfig = (): FileUploadConfig => {
  return {
    maxSize: 10 * 1024 * 1024, // 10MB for individual files
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic'
    ],
    compressionQuality: 0.8,
    generateThumbnails: true,
    thumbnailSizes: [150, 300, 600],
    enableProgressTracking: true,
    chunkSize: 1024 * 1024 // 1MB chunks
  };
};

// Storage paths configuration
const getStoragePaths = (): StoragePaths => {
  return {
    images: {
      original: 'images/original',
      processed: 'images/processed',
      thumbnails: 'images/thumbnails',
      analysis: 'images/analysis'
    },
    documents: {
      reports: 'documents/reports',
      certificates: 'documents/certificates',
      manuals: 'documents/manuals'
    },
    ai: {
      models: 'ai/models',
      cache: 'ai/cache',
      results: 'ai/results',
      logs: 'ai/logs'
    },
    backups: {
      database: 'backups/database',
      configurations: 'backups/configurations',
      userdata: 'backups/userdata'
    }
  };
};

// File metadata interface
export interface FileMetadata {
  id: string;
  name: string;
  originalName: string;
  size: number;
  type: string;
  path: string;
  url?: string;
  thumbnailUrl?: string;
  uploadedAt: Date;
  uploadedBy?: string;
  farmId?: string;
  lotId?: string;
  tags?: string[];
  aiAnalyzed?: boolean;
  analysisResults?: any;
  expiresAt?: Date;
}

// Upload progress interface
export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  url?: string;
  thumbnailUrl?: string;
}

// Storage quota interface
export interface StorageQuota {
  used: number; // bytes
  total: number; // bytes
  available: number; // bytes
  percentage: number; // 0-100
  nearLimit: boolean;
  exceedsLimit: boolean;
}

// Cloud storage service interface
export interface CloudStorageService {
  // File operations
  uploadFile(file: File, path: string, metadata?: Partial<FileMetadata>): Promise<FileMetadata>;
  downloadFile(path: string): Promise<Blob>;
  deleteFile(path: string): Promise<void>;
  getFileUrl(path: string, expiresIn?: number): Promise<string>;
  
  // Metadata operations
  getFileMetadata(path: string): Promise<FileMetadata>;
  updateFileMetadata(path: string, metadata: Partial<FileMetadata>): Promise<void>;
  listFiles(path: string, limit?: number): Promise<FileMetadata[]>;
  
  // Batch operations
  uploadFiles(files: File[], basePath: string): Promise<FileMetadata[]>;
  deleteFiles(paths: string[]): Promise<void>;
  
  // Storage management
  getStorageQuota(): Promise<StorageQuota>;
  cleanupExpiredFiles(): Promise<number>;
  
  // Image processing
  generateThumbnail(imagePath: string, size: number): Promise<string>;
  compressImage(imagePath: string, quality: number): Promise<string>;
}

// Validate cloud storage configuration
export const validateCloudStorageConfig = (): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const config = getCloudStorageConfig();
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!config.bucket) {
    errors.push('Storage bucket is required');
  }

  // Check file size limits
  if (config.maxFileSize > 100 * 1024 * 1024) {
    warnings.push('Maximum file size is very large (> 100MB)');
  }

  if (config.maxFileSize < 1024 * 1024) {
    warnings.push('Maximum file size is very small (< 1MB)');
  }

  // Check allowed file types
  if (config.allowedFileTypes.length === 0) {
    warnings.push('No allowed file types specified');
  }

  // Check retention period
  if (config.retentionDays < 30) {
    warnings.push('File retention period is very short (< 30 days)');
  }

  if (config.retentionDays > 2555) { // 7 years
    warnings.push('File retention period is very long (> 7 years)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Check if cloud storage is configured
export const isCloudStorageConfigured = (): boolean => {
  const config = getCloudStorageConfig();
  return !!(config.bucket && (config.provider === 'firebase' || (config.accessKey && config.secretKey)));
};

// Get storage provider status
export const getStorageProviderStatus = async (): Promise<{
  provider: StorageProvider;
  available: boolean;
  error?: string;
}> => {
  const config = getCloudStorageConfig();
  
  try {
    switch (config.provider) {
      case 'firebase':
        const firebaseStorage = getFirebaseStorage();
        return {
          provider: 'firebase',
          available: !!firebaseStorage,
          error: firebaseStorage ? undefined : 'Firebase Storage not initialized'
        };
      
      default:
        return {
          provider: config.provider,
          available: false,
          error: `Provider ${config.provider} not implemented`
        };
    }
  } catch (error) {
    return {
      provider: config.provider,
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Export configurations
export const cloudStorageConfig = getCloudStorageConfig();
export const fileUploadConfig = getFileUploadConfig();
export const storagePaths = getStoragePaths();

// Export configuration getters
export {
  getCloudStorageConfig,
  getFileUploadConfig,
  getStoragePaths
};

// Default export
export default {
  config: cloudStorageConfig,
  upload: fileUploadConfig,
  paths: storagePaths,
  isConfigured: isCloudStorageConfigured,
  validate: validateCloudStorageConfig,
  getProviderStatus: getStorageProviderStatus
};