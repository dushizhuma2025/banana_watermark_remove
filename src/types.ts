export interface ProcessedImage {
  id: number;
  file: File;
  name: string;
  size: number;
  width: number;
  height: number;
  originalImg: HTMLImageElement | null;
  originalUrl: string | null;
  processedBlob: Blob | null;
  processedUrl: string | null;
  processedMeta: Record<string, unknown> | null;
  status: 'pending' | 'processing' | 'success' | 'skipped' | 'failed';
  error?: string;
  _deleted?: boolean;
}

export interface BatchStats {
  total: number;
  done: number;
  success: number;
  skipped: number;
  failed: number;
}

export interface CompressedImage {
  id: number;
  file: File;
  name: string;
  originalSize: number;
  compressedSize: number;
  originalUrl: string;
  compressedUrl: string;
  compressedBlob: Blob | null;
  ratio: number;
  status: 'pending' | 'processing' | 'success' | 'failed';
  error?: string;
  _deleted?: boolean;
}

export interface CompressStats {
  total: number;
  done: number;
  success: number;
  failed: number;
}
