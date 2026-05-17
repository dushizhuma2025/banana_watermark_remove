import React from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import WatermarkPage from './pages/WatermarkPage';
import CompressPage from './pages/CompressPage';

export default function App() {
  const loc = useLocation();
  const isWatermark = loc.pathname === '/' || loc.pathname === '';
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="https://n8jmply6oexq.meoo.fun/sb-api/storage/v1/object/public/ayi_oss/public/1778544276186-touxiang_ayi_cat_touming.png"
              alt=""
              className="h-8 w-8 rounded-full"
            />
            <div>
              <a href="https://www.ayi001.xyz" target="_blank" rel="noopener noreferrer"
                className="text-sm md:text-xl font-bold tracking-tight text-primary hover:text-primary-hover transition-colors"
              >阿一AI站</a>
              <p className="text-xs text-gray-500">Faster, Better, Easier with AI.</p>
            </div>
          </div>
          <nav className="flex items-center">
            {isWatermark ? (
              <Link to="/compress"
                className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
              >阿一图片压缩</Link>
            ) : (
              <Link to="/"
                className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
              >阿一Banana去水印</Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<WatermarkPage />} />
          <Route path="/compress" element={<CompressPage />} />
        </Routes>
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
    </div>
  );
}
