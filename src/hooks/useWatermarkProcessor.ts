import { useState, useCallback, useRef } from 'react';
import type { ProcessedImage, BatchStats } from '../types';
import { loadImage, processSingleImage } from './useWatermarkEngine';

const MAX_FILES = 50;
const MAX_SIZE = 20 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function createThumbnail(img: HTMLImageElement, size = 80): string {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  const scale = Math.min(size / img.width, size / img.height);
  const dx = (size - img.width * scale) / 2;
  const dy = (size - img.height * scale) / 2;
  ctx.drawImage(img, dx, dy, img.width * scale, img.height * scale);
  return c.toDataURL('image/jpeg', 0.7);
}

export function useWatermarkProcessor() {
  const [results, setResults] = useState<ProcessedImage[]>([]);
  const [stats, setStats] = useState<BatchStats>({ total: 0, done: 0, success: 0, skipped: 0, failed: 0 });
  const [processing, setProcessing] = useState(false);
  const idCounter = useRef(0);

  const computeStats = useCallback((items: ProcessedImage[]): BatchStats => {
    const active = items.filter(r => !r._deleted);
    return {
      total: active.length,
      done: active.filter(r => r.status === 'success' || r.status === 'skipped' || r.status === 'failed').length,
      success: active.filter(r => r.status === 'success').length,
      skipped: active.filter(r => r.status === 'skipped').length,
      failed: active.filter(r => r.status === 'failed').length,
    };
  }, []);

  const deleteItem = useCallback((id: number) => {
    setResults(prev => {
      const next = prev.map(r => {
        if (r.id === id) {
          if (r.originalUrl) URL.revokeObjectURL(r.originalUrl);
          if (r.processedUrl) URL.revokeObjectURL(r.processedUrl);
          return { ...r, _deleted: true };
        }
        return r;
      });
      setStats(computeStats(next));
      return next;
    });
  }, [computeStats]);

  const clearAll = useCallback(() => {
    results.forEach(r => {
      if (r.originalUrl) URL.revokeObjectURL(r.originalUrl);
      if (r.processedUrl) URL.revokeObjectURL(r.processedUrl);
    });
    setResults([]);
    setStats({ total: 0, done: 0, success: 0, skipped: 0, failed: 0 });
  }, [results]);

  const processFiles = useCallback(async (files: File[]) => {
    const valid = files.filter(f =>
      f && f.type.match('image/(jpeg|png|webp)') && f.size <= MAX_SIZE
    );
    if (valid.length === 0) return;
    if (valid.length > MAX_FILES) valid.length = MAX_FILES;

    clearAll();

    const total = valid.length;
    const items: ProcessedImage[] = valid.map(file => ({
      id: ++idCounter.current,
      file,
      name: file.name,
      size: file.size,
      width: 0,
      height: 0,
      originalImg: null,
      originalUrl: null,
      processedBlob: null,
      processedUrl: null,
      processedMeta: null,
      status: 'pending' as const,
    }));

    setResults(items);
    setStats({ total, done: 0, success: 0, skipped: 0, failed: 0 });
    setProcessing(true);

    const concurrency = Math.min(navigator.hardwareConcurrency || 4, 6);
    const queue = [...items];
    let completed = 0;

    async function worker() {
      while (queue.length > 0) {
        const entry = queue.shift()!;
        try {
          setResults(prev => prev.map(r => r.id === entry.id ? { ...r, status: 'processing' as const } : r));

          const img = await loadImage(entry.file);
          const thumbUrl = createThumbnail(img);

          const processed = await processSingleImage(entry.file, img);

          const processedUrl = URL.createObjectURL(processed.blob);

          const success = !!(processed.meta && (processed.meta as Record<string, unknown>).decisionTier !== 'skip');

          setResults(prev => prev.map(r =>
            r.id === entry.id ? {
              ...r,
              originalImg: img,
              originalUrl: thumbUrl,
              width: img.width,
              height: img.height,
              processedBlob: processed.blob,
              processedUrl,
              processedMeta: processed.meta,
              status: success ? 'success' as const : 'skipped' as const,
            } : r
          ));
        } catch (err) {
          setResults(prev => prev.map(r =>
            r.id === entry.id ? { ...r, status: 'failed' as const, error: (err as Error).message } : r
          ));
        }
        completed++;
        setStats(prev => {
          const active = results.filter(r => !r._deleted && r.status !== 'pending');
          const done = completed;
          const success = results.filter(r => r.status === 'success').length;
          const skipped = results.filter(r => r.status === 'skipped').length;
          const failed = results.filter(r => r.status === 'failed').length;
          return { total, done, success, skipped, failed };
        });
      }
    }

    const workers = Array.from({ length: Math.min(concurrency, queue.length) }, () => worker());
    await Promise.all(workers);
    setProcessing(false);
  }, [clearAll, results]);

  return { results, stats, processing, processFiles, deleteItem, clearAll, formatFileSize };
}
