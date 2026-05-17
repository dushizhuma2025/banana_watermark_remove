import React from 'react';
import type { ProcessedImage, BatchStats } from '../types';
import { isConfirmedWatermarkDecision } from '../hooks/useWatermarkEngine';

interface ResultsTableProps {
  results: ProcessedImage[];
  stats: BatchStats;
  processing: boolean;
  onDelete: (id: number) => void;
  onClear: () => void;
  onDownload: (item: ProcessedImage) => void;
  onDownloadAll: () => void;
  formatFileSize: (bytes: number) => string;
}

function getStatusDisplay(item: ProcessedImage) {
  switch (item.status) {
    case 'processing':
      return { label: '处理中', cls: 'text-amber-600', icon: 'fa-spinner fa-pulse' };
    case 'success':
      return { label: '水印已移除', cls: 'text-emerald-600', icon: 'fa-check-circle' };
    case 'skipped':
      return { label: '未检测到水印', cls: 'text-gray-500', icon: 'fa-ban' };
    case 'failed':
      return { label: '处理失败', cls: 'text-red-500', icon: 'fa-exclamation-triangle' };
    default:
      return { label: '等待中', cls: 'text-gray-400', icon: 'fa-clock' };
  }
}

export default function ResultsTable({
  results, stats, processing, onDelete, onClear, onDownload, onDownloadAll, formatFileSize
}: ResultsTableProps) {
  const active = results.filter(r => !r._deleted);
  if (active.length === 0) return null;

  const hasDownloadable = active.some(r => r.processedUrl);

  return (
    <section className="max-w-7xl mx-auto px-4 pb-24">
      <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-gray-100">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>处理结果</span>
          </h3>
          <div className="flex items-center gap-2 flex-1 justify-center">
            <span className="text-sm text-gray-500">
              共 {stats.total} 张，成功 {stats.success}，跳过 {stats.skipped}，失败 {stats.failed}，已完成 {stats.done}/{stats.total}
            </span>
            {!processing && active.length > 0 && (
              <button onClick={onClear}
                className="text-sm px-2 py-0.5 bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
              >
                清空结果
              </button>
            )}
          </div>
          {!processing && hasDownloadable && (
            <button onClick={onDownloadAll}
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
                <th className="px-4 py-3 text-left">尺寸</th>
                <th className="px-4 py-3 text-left">状态</th>
                <th className="px-4 py-3 text-right w-40">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {active.map(item => (
                <Row key={item.id} item={item} onDownload={onDownload} onDelete={onDelete} formatFileSize={formatFileSize} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Row({ item, onDownload, onDelete, formatFileSize }: {
  item: ProcessedImage;
  onDownload: (item: ProcessedImage) => void;
  onDelete: (id: number) => void;
  formatFileSize: (bytes: number) => string;
}) {
  const sd = getStatusDisplay(item);

  return (
    <tr>
      <td className="px-4 py-3">
        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          {item.originalUrl ? (
            <img src={item.originalUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <i className="fas fa-spinner fa-pulse text-gray-300"></i>
          )}
        </div>
      </td>
      <td className="px-4 py-3 max-w-[200px] truncate font-medium text-gray-800" title={item.name}>
        {item.name}
      </td>
      <td className="px-4 py-3 text-gray-500">
        {item.width > 0 ? `${item.width} x ${item.height}` : formatFileSize(item.size)}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1 ${sd.cls}`}>
          <i className={`fas ${sd.icon} text-xs`}></i>{sd.label}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="inline-flex items-center gap-1">
          {item.processedUrl && (
            <button onClick={() => onDownload(item)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <i className="fas fa-download"></i>下载
            </button>
          )}
          {item.processedUrl && (
            <button onClick={() => onDelete(item.id)}
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
