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
