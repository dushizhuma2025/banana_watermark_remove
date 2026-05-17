import React, { useCallback, useRef } from 'react';

interface UploadAreaProps {
  onFiles: (files: File[]) => void;
  disabled: boolean;
}

export default function UploadArea({ onFiles, disabled }: UploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files.length > 0) {
      onFiles(Array.from(e.dataTransfer.files));
    }
  }, [onFiles, disabled]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFiles(Array.from(e.target.files));
    }
  }, [onFiles]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    if (disabled) return;
    const files: File[] = [];
    for (const item of e.clipboardData.items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        files.push(item.getAsFile()!);
      }
    }
    if (files.length > 0) onFiles(files);
  }, [onFiles, disabled]);

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-soft p-2 md:p-3 border border-emerald-100"
      onPaste={handlePaste}
    >
      <div
        id="uploadArea"
        className={`group relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
          dragging
            ? 'border-primary bg-emerald-50'
            : 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50 hover:border-emerald-400'
        } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={(e) => {
          if (e.clientX === 0 && e.clientY === 0) setDragging(false);
        }}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300">
            <i className="fas fa-image text-2xl text-primary"></i>
          </div>
          <p className="mb-2 text-lg font-medium text-gray-700">点击选择、拖拽或粘贴图片</p>
          <p className="text-sm text-gray-400">支持 JPG、PNG、WebP，可选择多张图片，最多 50 张</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
