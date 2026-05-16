# 阿一Banana批量去水印工具 - 产品说明文档

## 产品概述

基于开源项目 Gemini Watermark Remover 改造的本地批量去水印工具，专门去除 Gemini AI / Nano Banana 生成图片中的水印。

## 核心功能

### 1. 多图上传
- 支持 JPG、PNG、WebP 格式
- 支持点击选择、拖拽、粘贴三种上传方式
- 单次最多上传 50 张图片，单张限制 20MB

### 2. 并行处理
- 使用并发池处理，默认最大 6 路并行（基于 `navigator.hardwareConcurrency`）
- 优先使用 Web Worker 加速，Worker 不可用时自动回退到主线程
- 处理中显示进度：`正在处理 (done/total)...`

### 3. 结果展示
- 表格展示每张图的处理结果，包含：
  - **缩略图**：80x80 居中裁剪预览
  - **文件名**：原始文件名
  - **尺寸**：图片宽高（处理完成后显示）
  - **状态**：三种状态
    - 水印已移除（绿色标记）
    - 未检测到可移除水印（灰色标记）
    - 处理失败（红色标记）
  - **操作**：下载按钮 + 删除按钮

### 4. 统计摘要
- 实时显示：`共 N 张，成功 X，跳过 Y，失败 Z，已完成 M/N`
- 全部处理完成后才显示「全部下载」按钮
- 「清空结果」按钮紧跟在统计文字后

### 5. 下载功能
- **单张下载**：每行右侧下载按钮，下载格式为 PNG，文件命名 `unwatermarked_原文件名.png`
- **全部下载**：处理完成后显示，点击后逐个触发下载（每张间隔 300ms，避免浏览器拦截），已删除的图片不下载

### 6. 删除功能
- 每行操作区右侧删除图标（垃圾桶）
- 点击后弹出 confirm 确认框
- 确认后：释放该图 URL 资源、从表格移除该行、「全部下载」不再包含该图
- 全部删除后结果区域隐藏

## 水印检测逻辑

- 使用 `WatermarkEngine` 核心引擎处理
- 通过 `detectWatermarkConfig` 和 `calculateWatermarkPosition` 计算水印位置和大小
- 使用 `isConfirmedWatermarkDecision` 判定是否检测到可移除水印
- 未检测到水印时保留原图，标记为「跳过」

## 页面结构

- **首页**：`http://localhost:4173/` 直接打开工具页面（dev-preview.html）
- **上传区域**：虚线边框拖拽上传区
- **结果表格**：处理完成后展示

## 品牌信息

- 名称：阿一Banana批量去水印工具
- 品牌：阿一AI站（https://www.ayi001.xyz）
- Slogan：Faster, Better, Easier with AI.
- Logo：猫猫头像

## 构建与启动

- 构建：`pnpm build`
- 开发：`pnpm dev`（watch 模式）
- 静态服务：`node serve-dist.js`（默认端口 4173）
- 根路径 `/` 映射到 `dev-preview.html`
