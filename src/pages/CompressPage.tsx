import React, { useCallback, useState } from 'react';
import UploadArea from '../components/UploadArea';
import LoadingOverlay from '../components/LoadingOverlay';
import { useImageCompressor } from '../hooks/useImageCompressor';
import type { CompressedImage } from '../types';

export default function CompressPage() {
  const { results, stats, processing, addFiles, startCompress, deleteItem, clearAll, formatFileSize } = useImageCompressor();
  const [mode, setMode] = useState<'ratio' | 'targetSize'>('ratio');
  const [ratioValue, setRatioValue] = useState(80);
  const [targetSize, setTargetSize] = useState(0.5);
  const [outputFormat, setOutputFormat] = useState<'original' | 'jpeg'>('original');
  const [dirty, setDirty] = useState(false);

  const markDirty = useCallback(() => setDirty(true), []);

  const handleFiles = useCallback((files: File[]) => {
    addFiles(files);
    setDirty(false);
  }, [addFiles]);

  const handleCompress = useCallback(() => {
    startCompress({
      mode,
      value: mode === 'ratio' ? ratioValue : targetSize,
      outputFormat,
    });
    setDirty(false);
  }, [startCompress, mode, ratioValue, targetSize, outputFormat]);

  const active = results.filter(r => !r._deleted);
  const pendingCount = active.filter(r => r.status === 'pending').length;
  const canCompress = !processing && active.length > 0 && (dirty || pendingCount > 0);

  return (
    <>
      <section className="relative pt-16 pb-12 lg:pt-20 lg:pb-16 text-center px-4 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50 via-white to-white -z-10"></div>
        <h1 className="bg-clip-text bg-gradient-to-br from-slate-900 to-slate-700 mb-6 md:text-6xl text-3xl text-transparent tracking-tighter font-extrabold">
          阿一在线图片压缩工具
        </h1>
        <p className="text-base md:text-lg text-gray-500 max-w-2xl mx-auto mb-8">
          支持批量上传图片，自由选择压缩比例或目标大小。
        </p>

        <UploadArea onFiles={handleFiles} disabled={processing} />

        <div className="max-w-4xl mx-auto mt-4 p-4 bg-white rounded-2xl shadow-soft border border-emerald-100">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs text-gray-500 mb-1">压缩模式</label>
              <select value={mode} onChange={e => { setMode(e.target.value as 'ratio' | 'targetSize'); markDirty(); }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ratio">按比例压缩</option>
                <option value="targetSize">按目标大小</option>
              </select>
            </div>

            {mode === 'ratio' ? (
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-gray-500 mb-1">压缩比例</label>
                <div className="flex items-center gap-2">
                  <input type="range" min={1} max={99} value={ratioValue}
                    onChange={e => { setRatioValue(Number(e.target.value)); markDirty(); }}
                    className="flex-1 accent-emerald-600"
                  />
                  <input type="number" min={1} max={99} value={ratioValue}
                    onChange={e => { setRatioValue(Math.min(99, Math.max(1, Number(e.target.value) || 1))); markDirty(); }}
                    className="w-16 px-2 py-2 border border-gray-200 rounded-lg text-sm text-center"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
            ) : (
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs text-gray-500 mb-1">目标大小</label>
                <div className="flex items-center gap-2">
                  <input type="number" min={0.01} max={100} step={0.01} value={targetSize}
                    onChange={e => { setTargetSize(Math.max(0.01, Number(e.target.value) || 0.01)); markDirty(); }}
                    className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                  <span className="text-sm text-gray-500">MB</span>
                </div>
              </div>
            )}

            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs text-gray-500 mb-1">输出格式</label>
              <select value={outputFormat} onChange={e => { setOutputFormat(e.target.value as 'original' | 'jpeg'); markDirty(); }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="original">保持原格式</option>
                <option value="jpeg">转 JPEG</option>
              </select>
            </div>

            <button onClick={handleCompress}
              disabled={!canCompress}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <i className="fas fa-compress-alt"></i>开始压缩
              </span>
            </button>
          </div>
        </div>
      </section>

      {active.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-24">
          <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-gray-100">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>压缩结果</span>
              </h3>
              <div className="flex items-center gap-2 flex-1 justify-center">
                <span className="text-sm text-gray-500">
                  共 {stats.total} 张，成功 {stats.success}，失败 {stats.failed}
                </span>
                {!processing && (
                  <button onClick={clearAll}
                    className="text-sm px-2 py-0.5 bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
                  >清空结果</button>
                )}
              </div>
              {!processing && active.some(r => r.compressedUrl) && (
                <button onClick={() => {
                  active.filter(r => r.compressedUrl).forEach((item, i) => {
                    setTimeout(() => {
                      const a = document.createElement('a');
                      a.href = item.compressedUrl;
                      const ext = item.compressedBlob?.type === 'image/jpeg' ? '.jpg' : item.name.match(/\.\w+$/)?.[0] || '';
                      a.download = `compressed_${item.name.replace(/\.[^.]+$/, '')}${ext}`;
                      a.click();
                    }, i * 300);
                  });
                }}
                  className="text-sm px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <i className="fas fa-download"></i>全部下载
                  </span>
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 text-left w-24">缩略图</th>
                    <th className="px-4 py-3 text-left">文件名</th>
                    <th className="px-4 py-3 text-left">原始大小</th>
                    <th className="px-4 py-3 text-left">压缩后大小</th>
                    <th className="px-4 py-3 text-left">压缩率</th>
                    <th className="px-4 py-3 text-right w-40">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {active.map(item => (
                    <Row key={item.id} item={item} onDelete={deleteItem} formatFileSize={formatFileSize} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <LoadingOverlay show={processing} text={`正在压缩 (${stats.done}/${stats.total})...`} />
    </>
  );
}

function formatRatio(r: number) {
  if (r <= 0) return '0%';
  if (r > 0 && r < 1) return '<1%';
  return `-${r}%`;
}

function Row({ item, onDelete, formatFileSize }: {
  item: CompressedImage;
  onDelete: (id: number) => void;
  formatFileSize: (bytes: number) => string;
}) {
  const handleDelete = () => {
    if (!window.confirm('确认删除此项？')) return;
    onDelete(item.id);
  };

  const handleDownload = () => {
    if (!item.compressedUrl) return;
    const a = document.createElement('a');
    a.href = item.compressedUrl;
    const ext = item.compressedBlob?.type === 'image/jpeg' ? '.jpg' : item.name.match(/\.\w+$/)?.[0] || '';
    a.download = `compressed_${item.name.replace(/\.[^.]+$/, '')}${ext}`;
    a.click();
  };

  return (
    <tr>
      <td className="px-4 py-3">
        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          <img src={item.originalUrl} alt="" className="w-full h-full object-cover" />
        </div>
      </td>
      <td className="px-4 py-3 max-w-[200px] truncate font-medium text-gray-800" title={item.name}>
        {item.name}
      </td>
      <td className="px-4 py-3 text-gray-500">{formatFileSize(item.originalSize)}</td>
      <td className="px-4 py-3">
        {item.status === 'success' ? (
          <span className="text-gray-800 font-medium">{formatFileSize(item.compressedSize)}</span>
        ) : item.status === 'processing' ? (
          <span className="text-amber-600"><i className="fas fa-spinner fa-pulse mr-1"></i>压缩中</span>
        ) : item.status === 'failed' ? (
          <span className="text-red-500" title={item.error}>失败</span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        {item.status === 'success' ? (
          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
            <i className="fas fa-arrow-down text-xs"></i>{formatRatio(item.ratio)}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="inline-flex items-center gap-1">
          {item.compressedUrl && (
            <button onClick={handleDownload}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <i className="fas fa-download"></i>下载
            </button>
          )}
          {(item.status === 'success' || item.status === 'failed') && (
            <button onClick={handleDelete}
              className="inline-flex items-center justify-center w-7 h-7 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="删除"
            >
              <i className="fas fa-trash-alt"></i>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
