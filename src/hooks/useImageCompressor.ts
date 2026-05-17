import { useState, useCallback, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import type { CompressedImage, CompressStats } from '../types';

const MAX_CONCURRENCY = 4;

export function useImageCompressor() {
  const [results, setResults] = useState<CompressedImage[]>([]);
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState<CompressStats>({ total: 0, done: 0, success: 0, failed: 0 });
  const idRef = useRef(0);
  const resultsRef = useRef<CompressedImage[]>([]);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }, []);

  const syncResults = useCallback((fn: (prev: CompressedImage[]) => CompressedImage[]) => {
    setResults(prev => {
      const next = fn(prev);
      resultsRef.current = next;
      return next;
    });
  }, []);

  const addFiles = useCallback((files: File[]) => {
    const items: CompressedImage[] = files.map(f => ({
      id: ++idRef.current,
      file: f,
      name: f.name,
      originalSize: f.size,
      compressedSize: 0,
      originalUrl: URL.createObjectURL(f),
      compressedUrl: '',
      compressedBlob: null,
      ratio: 0,
      status: 'pending' as const,
    }));
    syncResults(prev => [...prev.filter(r => !r._deleted), ...items]);
    setStats(prev => ({ ...prev, total: prev.total + items.length }));
  }, [syncResults]);

  const startCompress = useCallback(async (
    opts: { mode: 'ratio' | 'targetSize'; value: number; outputFormat: 'original' | 'jpeg' }
  ) => {
    const toProcess = resultsRef.current.filter(r => !r._deleted && r.file);
    if (toProcess.length === 0) return;

    toProcess.forEach(item => {
      if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl);
    });
    syncResults(prev => prev.map(r =>
      toProcess.some(tp => tp.id === r.id)
        ? { ...r, compressedUrl: '', compressedBlob: null, compressedSize: 0, ratio: 0, status: 'pending' as const, error: undefined }
        : r
    ));

    setProcessing(true);
    setStats({ total: toProcess.length, done: 0, success: 0, failed: 0 });

    const compressOpts: Record<string, unknown> = {};
    if (opts.mode === 'ratio') {
      compressOpts.initialQuality = Math.min(opts.value / 100, 0.99);
    } else {
      compressOpts.maxSizeMB = opts.value;
    }
    if (opts.outputFormat === 'jpeg') {
      compressOpts.fileType = 'image/jpeg';
    }
    compressOpts.useWebWorker = true;
    compressOpts.maxIteration = 10;

    const pool = async <T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>) => {
      const queue = [...items];
      const workers: Promise<void>[] = [];
      const next = async () => {
        while (queue.length > 0) {
          const item = queue.shift()!;
          await fn(item);
        }
      };
      for (let i = 0; i < concurrency; i++) workers.push(next());
      await Promise.all(workers);
    };

    await pool(toProcess, MAX_CONCURRENCY, async (item) => {
      syncResults(prev => prev.map(r => r.id === item.id ? { ...r, status: 'processing' as const } : r));
      try {
        const blob = await imageCompression(item.file, compressOpts);
        const url = URL.createObjectURL(blob);
        syncResults(prev => prev.map(r => r.id === item.id ? {
          ...r,
          compressedBlob: blob,
          compressedUrl: url,
          compressedSize: blob.size,
          ratio: Math.round((1 - blob.size / item.originalSize) * 100),
          status: 'success' as const,
        } : r));
        setStats(prev => ({ ...prev, done: prev.done + 1, success: prev.success + 1 }));
      } catch (err) {
        syncResults(prev => prev.map(r => r.id === item.id ? { ...r, status: 'failed' as const, error: String(err) } : r));
        setStats(prev => ({ ...prev, done: prev.done + 1, failed: prev.failed + 1 }));
      }
    });

    setProcessing(false);
  }, [syncResults]);

  const deleteItem = useCallback((id: number) => {
    syncResults(prev => {
      const item = prev.find(r => r.id === id);
      if (item?.originalUrl) URL.revokeObjectURL(item.originalUrl);
      if (item?.compressedUrl) URL.revokeObjectURL(item.compressedUrl);
      return prev.map(r => r.id === id ? { ...r, _deleted: true } : r);
    });
  }, [syncResults]);

  const clearAll = useCallback(() => {
    resultsRef.current.forEach(r => {
      if (r.originalUrl) URL.revokeObjectURL(r.originalUrl);
      if (r.compressedUrl) URL.revokeObjectURL(r.compressedUrl);
    });
    resultsRef.current = [];
    setResults([]);
    setStats({ total: 0, done: 0, success: 0, failed: 0 });
  }, []);

  return { results, stats, processing, addFiles, startCompress, deleteItem, clearAll, formatFileSize };
}
