import { useRef } from 'react';
import { WatermarkEngine } from '../core/watermarkEngine';
import type { ProcessedImage } from '../types';

let engineInstance: WatermarkEngine | null = null;

async function getEngine(): Promise<WatermarkEngine> {
  if (!engineInstance) {
    engineInstance = await WatermarkEngine.create();
  }
  return engineInstance;
}

export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function canvasToBlob(canvas: HTMLCanvasElement | OffscreenCanvas): Promise<Blob> {
  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob();
  }
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/png');
  });
}

export async function processSingleImage(
  file: File,
  img: HTMLImageElement
): Promise<{ blob: Blob; meta: Record<string, unknown> | null }> {
  const engine = await getEngine();
  const canvas = await engine.removeWatermarkFromImage(img);
  const blob = await canvasToBlob(canvas);
  return {
    blob,
    meta: (canvas as HTMLCanvasElement & { __watermarkMeta?: Record<string, unknown> }).__watermarkMeta || null,
  };
}

export function isConfirmedWatermarkDecision(item: ProcessedImage): boolean {
  const meta = item.processedMeta;
  if (!meta) return false;
  return (meta as Record<string, unknown>).decisionTier !== 'skip';
}
