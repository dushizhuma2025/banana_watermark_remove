import React, { useCallback } from 'react';
import UploadArea from './components/UploadArea';
import ResultsTable from './components/ResultsTable';
import LoadingOverlay from './components/LoadingOverlay';
import { useWatermarkProcessor } from './hooks/useWatermarkProcessor';
import type { ProcessedImage } from './types';

export default function App() {
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
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="https://n8jmply6oexq.meoo.fun/sb-api/storage/v1/object/public/ayi_oss/public/1778544276186-touxiang_ayi_cat_touming.png"
              alt="" className="h-8 w-8 rounded-full"
            />
            <div>
              <a href="https://www.ayi001.xyz" target="_blank" rel="noopener noreferrer"
                className="text-sm md:text-xl font-bold tracking-tight text-primary hover:text-primary-hover transition-colors"
              >阿一AI站</a>
              <p className="text-xs text-gray-500">Faster, Better, Easier with AI.</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
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
      </main>

      <footer className="bg-emerald-600 text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-emerald-100 text-sm mb-4">
            本工具有阿一用AI编程完成，用时2小时。
          </p>
          <div className="text-sm font-medium">
            <a href="https://www.ayi001.xyz" target="_blank" rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >阿一AI站</a>
          </div>
        </div>
      </footer>

      <LoadingOverlay show={processing} text={`正在处理 (${stats.done}/${stats.total})...`} />
    </div>
  );
}
