import {
    WatermarkEngine,
    detectWatermarkConfig,
    calculateWatermarkPosition
} from './core/watermarkEngine.js';
import { WatermarkWorkerClient, canUseWatermarkWorker } from './core/workerClient.js';
import {
    isConfirmedWatermarkDecision,
    resolveDisplayWatermarkInfo
} from './core/watermarkDisplay.js';
import { canvasToBlob } from './core/canvasBlob.js';
import {
    loadImage,
    setStatusMessage,
    showLoading,
    hideLoading
} from './utils.js';

const TEXT = {
    loading: '正在加载资源...',
    processing: '正在处理 ({done}/{total})...',
    removed: '水印已移除',
    skipped: '未检测到可移除水印，已保留原图',
    failed: '处理失败',
    success: '成功',
    done: '全部处理完成',
    unsupported: '浏览器不支持复制图片',
    copied: '已复制！',
    copy: '复制',
    copyFailed: '复制失败'
};

let enginePromise = null;
let workerClient = null;
let results = [];

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const resultsSection = document.getElementById('resultsSection');
const resultsBody = document.getElementById('resultsBody');
const resultSummary = document.getElementById('resultSummary');
const clearAllBtn = document.getElementById('clearAllBtn');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const loadingText = document.getElementById('loadingText');

async function getEngine() {
    if (!enginePromise) {
        enginePromise = WatermarkEngine.create().catch((error) => {
            enginePromise = null;
            throw error;
        });
    }
    return enginePromise;
}

function getEstimatedWatermarkInfo(item) {
    if (!item?.originalImg) return null;
    const { width, height } = item.originalImg;
    const config = detectWatermarkConfig(width, height);
    const position = calculateWatermarkPosition(width, height, config);
    return {
        size: config.logoSize,
        position,
        config
    };
}

function disableWorkerClient(reason) {
    if (!workerClient) return;
    console.warn('disable worker path, fallback to main thread:', reason);
    workerClient.dispose();
    workerClient = null;
}

async function init() {
    try {
        showLoading(TEXT.loading);

        if (canUseWatermarkWorker()) {
            try {
                workerClient = new WatermarkWorkerClient({
                    workerUrl: './workers/watermark-worker.js'
                });
            } catch (workerError) {
                console.warn('worker unavailable, fallback to main thread:', workerError);
                workerClient = null;
            }
        }

        if (!workerClient) {
            getEngine().catch((error) => {
                console.warn('main thread engine warmup failed:', error);
            });
        }

        hideLoading();
        setupEventListeners();
    } catch (error) {
        hideLoading();
        console.error('initialize error:', error);
    }
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

function setupEventListeners() {
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);

    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('border-primary', 'bg-emerald-50');
    });

    document.addEventListener('dragleave', (e) => {
        if (e.clientX === 0 && e.clientY === 0) {
            uploadArea.classList.remove('border-primary', 'bg-emerald-50');
        }
    });

    document.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('border-primary', 'bg-emerald-50');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(Array.from(e.dataTransfer.files));
        }
    });

    document.addEventListener('paste', (e) => {
        const items = e.clipboardData.items;
        const files = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file' && items[i].type.startsWith('image/')) {
                files.push(items[i].getAsFile());
            }
        }
        if (files.length > 0) handleFiles(files);
    });

    clearAllBtn.addEventListener('click', clearResults);
    downloadAllBtn.addEventListener('click', downloadAll);
    window.addEventListener('beforeunload', () => {
        disableWorkerClient('beforeunload');
    });
}

function clearResults() {
    results.forEach(r => {
        if (r.originalUrl) URL.revokeObjectURL(r.originalUrl);
        if (r.processedUrl) URL.revokeObjectURL(r.processedUrl);
    });
    results = [];
    resultsBody.innerHTML = '';
    resultsSection.style.display = 'none';
    fileInput.value = '';
}

function handleFileSelect(e) {
    handleFiles(Array.from(e.target.files));
}

function handleFiles(files) {
    const MAX_FILES = 50;
    const validFiles = files.filter((file) => {
        if (!file || !file.type.match('image/(jpeg|png|webp)')) return false;
        if (file.size > 20 * 1024 * 1024) return false;
        return true;
    });

    if (validFiles.length === 0) return;

    if (validFiles.length > MAX_FILES) {
        setStatusMessage(`最多处理 ${MAX_FILES} 张图片，已自动截取前 ${MAX_FILES} 张`, 'warn');
        validFiles.length = MAX_FILES;
    }

    clearResults();
    processBatch(validFiles);
}

async function processBatch(files) {
    resultsSection.style.display = 'block';
    const total = files.length;

    files.forEach((file) => {
        const row = document.createElement('tr');
        row.id = `row-${results.length}`;
        row.innerHTML = `
            <td class="px-4 py-3"><div class="result-img bg-gray-100 flex items-center justify-center text-gray-300 text-xs">加载中...</div></td>
            <td class="px-4 py-3 max-w-[200px] truncate font-medium text-gray-800" title="${file.name}">${file.name}</td>
            <td class="px-4 py-3 text-gray-500">${formatFileSize(file.size)}</td>
            <td class="px-4 py-3"><span class="inline-flex items-center gap-1 text-amber-600"><svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>处理中</span></td>
            <td class="px-4 py-3 text-right">--</td>
        `;
        resultsBody.appendChild(row);
        results.push({ file, originalUrl: null, processedUrl: null, processedBlob: null, originalImg: null });
    });

    updateSummary();

    const concurrency = Math.min(navigator.hardwareConcurrency || 4, 6);
    const queue = [...files];
    let completed = 0;

    async function worker() {
        while (queue.length > 0) {
            const file = queue.shift();
            const idx = files.indexOf(file);
            try {
                await processOne(file, idx);
            } catch (err) {
                updateRowStatus(idx, 'failed', err.message);
            }
            completed++;
            loadingText.textContent = TEXT.processing.replace('{done}', completed).replace('{total}', total);
            updateSummary();
        }
    }

    showLoading(TEXT.processing.replace('{done}', 0).replace('{total}', total));

    const workers = Array.from({ length: Math.min(concurrency, queue.length) }, () => worker());
    await Promise.all(workers);

    hideLoading();
    setStatusMessage(TEXT.done, 'success');
    updateSummary();
}

async function processOne(file, idx) {
    const entry = results[idx];
    const img = await loadImage(file);
    entry.originalImg = img;
    entry.originalUrl = img.src;

    const thumbUrl = await createThumbnail(img);
    const thumbCell = document.querySelector(`#row-${idx} td:first-child .result-img`);
    if (thumbCell) {
        thumbCell.innerHTML = '';
        const tImg = document.createElement('img');
        tImg.src = thumbUrl;
        tImg.className = 'w-full h-full object-cover rounded-lg';
        thumbCell.appendChild(tImg);
    }

    let processed;
    try {
        processed = await processImageWithBestPath(file, img);
    } catch (err) {
        updateRowStatus(idx, 'failed', err.message);
        return;
    }

    entry.processedMeta = processed.meta;
    entry.processedBlob = processed.blob;
    entry.processedUrl = URL.createObjectURL(processed.blob);

    const isSuccess = isConfirmedWatermarkDecision(entry);
    const statusLabel = isSuccess ? TEXT.removed : TEXT.skipped;
    const statusClass = isSuccess ? 'text-emerald-600' : 'text-gray-500';

    const row = document.getElementById(`row-${idx}`);
    if (!row) return;

    const sizeLabel = `${img.width} x ${img.height}`;
    row.cells[2].textContent = sizeLabel;
    row.cells[3].innerHTML = `<span class="inline-flex items-center gap-1 ${statusClass}"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${isSuccess ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'}"></path></svg>${statusLabel}</span>`;

    const dlBtn = document.createElement('button');
    dlBtn.className = 'inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors';
    dlBtn.innerHTML = '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>下载';
    dlBtn.onclick = () => downloadImage(entry);
    const actionGroup = document.createElement('div');
    actionGroup.className = 'inline-flex items-center gap-1';
    row.cells[4].textContent = '';
    actionGroup.appendChild(dlBtn);

    const delBtn = document.createElement('button');
    delBtn.className = 'inline-flex items-center justify-center w-7 h-7 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors';
    delBtn.title = '删除';
    delBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>';
    delBtn.onclick = () => deleteRow(idx);
    actionGroup.appendChild(delBtn);
    row.cells[4].appendChild(actionGroup);
}

async function createThumbnail(img, size = 80) {
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');
    const scale = Math.min(size / img.width, size / img.height);
    const dx = (size - img.width * scale) / 2;
    const dy = (size - img.height * scale) / 2;
    ctx.drawImage(img, dx, dy, img.width * scale, img.height * scale);
    return c.toDataURL('image/jpeg', 0.7);
}

function updateRowStatus(idx, status, msg) {
    const row = document.getElementById(`row-${idx}`);
    if (!row) return;
    const entry = results[idx];
    if (entry) entry._failed = true;

    const icon = '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>';

    row.cells[3].innerHTML = `<span class="inline-flex items-center gap-1 text-red-500">${icon}${TEXT.failed}${msg ? ': ' + msg : ''}</span>`;
    row.cells[4].textContent = '--';
}

function updateSummary() {
    const active = results.filter(r => !r._deleted);
    const total = active.length;
    const done = active.filter(r => r.processedUrl || r._failed).length;
    const successCount = active.filter(r => r.processedBlob && isConfirmedWatermarkDecision(r)).length;
    const skipCount = active.filter(r => r.processedBlob && !isConfirmedWatermarkDecision(r)).length;
    const failCount = active.filter(r => r._failed).length;
    resultSummary.textContent = `共 ${total} 张，成功 ${successCount}，跳过 ${skipCount}，失败 ${failCount}，已完成 ${done}/${total}`;
    if (total > 0 && done === total && failCount < total) {
        downloadAllBtn.classList.remove('hidden');
    } else {
        downloadAllBtn.classList.add('hidden');
    }
}

async function processImageWithBestPath(file, fallbackImage, options = {}) {
    if (workerClient) {
        try {
            return await workerClient.processBlob(file, options);
        } catch (error) {
            console.warn('worker process failed, fallback to main thread:', error);
            disableWorkerClient(error);
        }
    }

    const engine = await getEngine();
    const canvas = await engine.removeWatermarkFromImage(fallbackImage, options);
    const blob = await canvasToBlob(canvas);
    return {
        blob,
        meta: canvas.__watermarkMeta || null
    };
}

function downloadImage(item) {
    const a = document.createElement('a');
    a.href = item.processedUrl;
    a.download = `unwatermarked_${item.file.name.replace(/\.[^.]+$/, '')}.png`;
    a.click();
}

function deleteRow(idx) {
    const entry = results[idx];
    if (!entry || entry._deleted) return;
    if (!confirm('确定要删除此项吗？')) return;
    entry._deleted = true;
    if (entry.originalUrl && entry.originalUrl !== entry.file?.src) URL.revokeObjectURL(entry.originalUrl);
    if (entry.processedUrl) URL.revokeObjectURL(entry.processedUrl);
    const row = document.getElementById(`row-${idx}`);
    if (row) row.remove();
    updateSummary();
    if (results.every(r => r._deleted)) {
        resultsSection.style.display = 'none';
        downloadAllBtn.classList.add('hidden');
    }
}

function downloadAll() {
    results.forEach((item, i) => {
        if (!item.processedUrl || item._deleted) return;
        setTimeout(() => {
            const a = document.createElement('a');
            a.href = item.processedUrl;
            a.download = `unwatermarked_${item.file.name.replace(/\.[^.]+$/, '')}.png`;
            a.click();
        }, i * 300);
    });
}

init();
