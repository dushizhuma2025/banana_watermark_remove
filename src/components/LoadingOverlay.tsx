import React from 'react';

interface LoadingOverlayProps {
  show: boolean;
  text?: string;
}

export default function LoadingOverlay({ show, text = '正在处理...' }: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center">
        <i className="fas fa-spinner fa-pulse text-4xl text-primary mb-4"></i>
        <p className="text-gray-600 font-medium">{text}</p>
      </div>
    </div>
  );
}
