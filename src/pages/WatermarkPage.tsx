import React, { useCallback } from 'react';
import UploadArea from '../components/UploadArea';
import ResultsTable from '../components/ResultsTable';
import LoadingOverlay from '../components/LoadingOverlay';
import { useWatermarkProcessor } from '../hooks/useWatermarkProcessor';
import type { ProcessedImage } from '../types';

export default function WatermarkPage() {
  const { results, stats, processing, processFiles, deleteItem, clearAll, formatFileSize } = useWatermarkProcessor();

  const handleDownload = useCallback((item: ProcessedImage) => {
    if (!item.processedUrl) return;
    const a = document.createElement('a');
    a.href = item.processedUrl;
    a.download = `unwatermarked_${item.name.replace(/\.[^.]+$/, '')}.png`;
    a.click();
  }, []);

  const handleDownloadAll = useCallback(() => {
    const downloadable = results.filter(r => !r._deleted && r.processedUrl);
    downloadable.forEach((item, i) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = item.processedUrl!;
        a.download = `unwatermarked_${item.name.replace(/\.[^.]+$/, '')}.png`;
        a.click();
      }, i * 300);
    });
  }, [results]);

  return (
    <>
      <section className="relative pt-16 pb-12 lg:pt-20 lg:pb-16 text-center px-4 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50 via-white to-white -z-10"></div>
        <h1 className="bg-clip-text bg-gradient-to-br from-slate-900 to-slate-700 mb-6 md:text-6xl text-3xl text-transparent tracking-tighter font-extrabold">
          阿一Banana批量去水印工具
        </h1>
        <p className="text-base md:text-lg text-gray-500 max-w-2xl mx-auto mb-8">
          支持批量上传图片，并行处理，快速去除 Nano Banana 图片水印。
        </p>
        <UploadArea onFiles={processFiles} disabled={processing} />
      </section>
      <ResultsTable
        results={results}
        stats={stats}
        processing={processing}
        onDelete={deleteItem}
        onClear={clearAll}
        onDownload={handleDownload}
        onDownloadAll={handleDownloadAll}
        formatFileSize={formatFileSize}
      />
      <LoadingOverlay show={processing} text={`正在处理 (${stats.done}/${stats.total})...`} />
    </>
  );
}
