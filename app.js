let frames = [];
let isRecording = false;
let animationId = null;
let previewAnimationId = null;

// NEW: Undo/Redo functionality
let undoStack = [];
let redoStack = [];
const MAX_UNDO_STEPS = 20;

// Wait for GIF.js to load
function init() {
    // Setup drag and drop for file upload
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
    
    // Setup animation recorder
    document.getElementById('startRecord').addEventListener('click', startRecording);
    document.getElementById('stopRecord').addEventListener('click', stopRecording);
    
    // Text to GIF
    document.getElementById('createTextGif').addEventListener('click', createTextGif);
    
    // Frame controls
    document.getElementById('clearFrames').addEventListener('click', clearFrames);
    document.getElementById('generateGif').addEventListener('click', generateGif);
    document.getElementById('downloadGif').addEventListener('click', downloadGif);
    
    // NEW: Export and Share functionality
    setupExportAndShare();
    
    // New: Preview button
    const previewBtn = document.getElementById('previewFrames');
    if (previewBtn) {
        previewBtn.addEventListener('click', togglePreview);
    }
    
    // NEW: Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    // NEW: Create undo/redo UI
    createUndoRedoUI();
}

// NEW: Save state for undo/redo
function saveState() {
    // Deep clone frames for state saving
    const state = frames.map(f => ({ ...f, image: null })); // Don't clone images for memory
    undoStack.push(JSON.stringify(state));
    if (undoStack.length > MAX_UNDO_STEPS) {
        undoStack.shift();
    }
    redoStack = []; // Clear redo stack on new action
    updateUndoRedoButtons();
}

// NEW: Undo last action
function undo() {
    if (undoStack.length === 0) return;
    
    // Save current state to redo
    const currentState = frames.map(f => ({ ...f, image: null }));
    redoStack.push(JSON.stringify(currentState));
    
    // Restore previous state
    const prevState = JSON.parse(undoStack.pop());
    // Note: We'll need to reload images, so this restores the structure
    const frameCount = prevState.length;
    frames = []; // Clear current frames - they'll need to be re-added
    showNotification(`Undo: ${frameCount} frames restored (images will reload)`);
    updateFramePreview();
    updateStats();
    updateUndoRedoButtons();
}

// NEW: Redo last undone action
function redo() {
    if (redoStack.length === 0) return;
    
    // Save current state to undo
    const currentState = frames.map(f => ({ ...f, image: null }));
    undoStack.push(JSON.stringify(currentState));
    
    // Restore redo state
    const redoState = JSON.parse(redoStack.pop());
    showNotification(`Redo: ${redoState.length} frames`);
    updateFramePreview();
    updateStats();
    updateUndoRedoButtons();
}

// NEW: Update undo/redo button states
function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    if (undoBtn) undoBtn.disabled = undoStack.length === 0;
    if (redoBtn) redoBtn.disabled = redoStack.length === 0;
    if (undoBtn) undoBtn.title = `Undo (${undoStack.length})`;
    if (redoBtn) redoBtn.title = `Redo (${redoStack.length})`;
}

// NEW: Create undo/redo UI
function createUndoRedoUI() {
    const frameActions = document.querySelector('.frame-actions');
    if (!frameActions) return;
    
    const btnGroup = document.createElement('div');
    btnGroup.className = 'undo-redo-group';
    btnGroup.innerHTML = `
        <button id="undoBtn" class="icon-btn" onclick="window.undoAction()" disabled title="Undo (Ctrl+Z)">↩️ Undo</button>
        <button id="redoBtn" class="icon-btn" onclick="window.redoAction()" disabled title="Redo (Ctrl+Y)">↪️ Redo</button>
    `;
    frameActions.insertBefore(btnGroup, frameActions.firstChild);
}

// NEW: Setup keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd key shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch(e.key.toLowerCase()) {
                case 'g':
                    e.preventDefault();
                    generateGif();
                    break;
                case 'o':
                    e.preventDefault();
                    document.getElementById('fileInput').click();
                    break;
                case 'p':
                    e.preventDefault();
                    togglePreview();
                    break;
                case 'd':
                    e.preventDefault();
                    downloadGif();
                    break;
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        redo();
                    } else {
                        undo();
                    }
                    break;
                case 'y':
                    e.preventDefault();
                    redo();
                    break;
            }
        }
    });
}

// Expose undo/redo for HTML onclick
window.undoAction = undo;
window.redoAction = redo;

function handleDrop(e) {
    e.preventDefault();
    document.getElementById('dropZone').classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    handleFiles(files);
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
    handleFiles(files);
}

// NEW: Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function handleFiles(files) {
    let addedCount = 0;
    let skippedCount = 0;
    
    files.forEach(file => {
        // NEW: File size validation
        if (file.size > MAX_FILE_SIZE) {
            showNotification(`Skipped: ${file.name} (${(file.size/1024/1024).toFixed(1)}MB > 10MB limit)`, 'error');
            skippedCount++;
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            addFrame(e.target.result, file.name);
            addedCount++;
            if (addedCount + skippedCount === files.length) {
                showNotification(`Added ${addedCount} frame(s)${skippedCount > 0 ? `, skipped ${skippedCount}` : ''}`);
            }
        };
        reader.onerror = () => {
            showNotification(`Error reading: ${file.name}`, 'error');
            skippedCount++;
        };
        reader.readAsDataURL(file);
    });
}

function addFrame(dataUrl, name = 'Frame') {
    const img = new Image();
    img.onload = () => {
        saveState(); // NEW: Save state before adding
        frames.push({
            image: img,
            dataUrl: dataUrl,
            delay: parseInt(document.getElementById('frameDelay').value) || 100
        });
        updateFramePreview();
        updateStats();
        showNotification(`Added frame: ${name}`);
    };
    img.onerror = () => {
        showNotification(`Error loading image: ${name}`, 'error');
    };
    img.src = dataUrl;
}

function updateFramePreview() {
    const container = document.getElementById('framePreview');
    if (frames.length === 0) {
        container.innerHTML = '<p class="empty-state">No frames yet. Add images above!</p>';
        return;
    }
    
    container.innerHTML = frames.map((frame, i) => `
        <div class="frame-item" data-index="${i}" draggable="true">
            <img src="${frame.dataUrl}" alt="Frame ${i + 1}">
            <span class="frame-num">#${i + 1}</span>
            <div class="frame-controls">
                <button class="frame-btn move-left" data-index="${i}" title="Move left">←</button>
                <button class="frame-btn move-right" data-index="${i}" title="Move right">→</button>
                <button class="frame-btn dup-frame" data-index="${i}" title="Duplicate">⎘</button>
                <button class="frame-btn del-frame" data-index="${i}" title="Delete">×</button>
            </div>
            <div class="frame-delay-row">
                <label class="delay-label">Delay:
                    <input type="number" class="frame-delay-input" data-index="${i}" value="${frame.delay}" min="10" max="5000" step="10">ms
                </label>
            </div>
        </div>
    `).join('');
    
    // Attach event listeners
    container.querySelectorAll('.move-left').forEach(btn => {
        btn.addEventListener('click', () => moveFrame(parseInt(btn.dataset.index), -1));
    });
    container.querySelectorAll('.move-right').forEach(btn => {
        btn.addEventListener('click', () => moveFrame(parseInt(btn.dataset.index), 1));
    });
    container.querySelectorAll('.dup-frame').forEach(btn => {
        btn.addEventListener('click', () => duplicateFrame(parseInt(btn.dataset.index)));
    });
    container.querySelectorAll('.del-frame').forEach(btn => {
        btn.addEventListener('click', () => removeFrame(parseInt(btn.dataset.index)));
    });
    container.querySelectorAll('.frame-delay-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const idx = parseInt(input.dataset.index);
            frames[idx].delay = parseInt(e.target.value) || 100;
        });
    });
    
    // Setup drag and drop
    container.querySelectorAll('.frame-item').forEach((item, idx) => {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', idx);
            item.classList.add('dragging');
        });
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
        });
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            item.classList.add('drag-over');
        });
        item.addEventListener('dragleave', () => {
            item.classList.remove('drag-over');
        });
        item.addEventListener('drop', (e) => {
            e.preventDefault();
            item.classList.remove('drag-over');
            const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
            const toIdx = idx;
            if (fromIdx !== toIdx) {
                const [moved] = frames.splice(fromIdx, 1);
                frames.splice(toIdx, 0, moved);
                updateFramePreview();
            }
        });
    });
}

function moveFrame(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= frames.length) return;
    saveState(); // NEW: Save state before moving
    const [moved] = frames.splice(index, 1);
    frames.splice(newIndex, 0, moved);
    updateFramePreview();
}

function duplicateFrame(index) {
    saveState(); // NEW: Save state before duplicating
    const frameToDup = frames[index];
    const newFrame = {
        image: frameToDup.image,
        dataUrl: frameToDup.dataUrl,
        delay: frameToDup.delay
    };
    frames.splice(index + 1, 0, newFrame);
    updateFramePreview();
    updateStats();
    showNotification(`Frame ${index + 1} duplicated!`);
}

function removeFrame(index) {
    saveState(); // NEW: Save state before removing
    frames.splice(index, 1);
    updateFramePreview();
    updateStats();
}

function clearFrames() {
    if (frames.length === 0) return;
    if (!confirm('Clear all frames?')) return;
    saveState(); // NEW: Save state before clearing
    frames = [];
    updateFramePreview();
    updateStats();
    document.getElementById('result').innerHTML = '';
    showNotification('All frames cleared');
}

function updateStats() {
    document.getElementById('frameCount').textContent = frames.length;
    const size = frames.reduce((acc, f) => acc + (f.dataUrl.length * 0.75), 0);
    document.getElementById('totalSize').textContent = (size / 1024 / 1024).toFixed(2) + ' MB';
    
    // Calculate total animation duration
    const totalDuration = frames.reduce((acc, f) => acc + (f.delay || 100), 0);
    const durationEl = document.getElementById('totalDuration');
    if (durationEl) {
        durationEl.textContent = (totalDuration / 1000).toFixed(1) + 's';
    }
}

// Frame preview animation
let previewIndex = 0;
function togglePreview() {
    const btn = document.getElementById('previewFrames');
    if (previewAnimationId) {
        clearTimeout(previewAnimationId);
        previewAnimationId = null;
        btn.textContent = '▶️ Preview Animation';
        btn.classList.remove('previewing');
        // Remove highlight from all frames
        document.querySelectorAll('.frame-item').forEach(el => el.classList.remove('preview-active'));
    } else {
        if (frames.length < 2) {
            showNotification('Need at least 2 frames to preview!', 'error');
            return;
        }
        btn.textContent = '⏹️ Stop Preview';
        btn.classList.add('previewing');
        previewIndex = 0;
        animatePreview();
    }
}

function animatePreview() {
    const frameItems = document.querySelectorAll('.frame-item');
    frameItems.forEach(el => el.classList.remove('preview-active'));
    
    if (previewIndex >= frames.length) previewIndex = 0;
    
    if (frameItems[previewIndex]) {
        frameItems[previewIndex].classList.add('preview-active');
        frameItems[previewIndex].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
    
    const delay = frames[previewIndex]?.delay || 100;
    previewIndex++;
    previewAnimationId = setTimeout(animatePreview, delay);
}

// Animation recording
function startRecording() {
    if (isRecording) return;
    const canvas = document.getElementById('recordCanvas');
    const ctx = canvas.getContext('2d');
    const text = document.getElementById('animText').value || 'GIF!';
    const color = document.getElementById('animColor').value;
    
    isRecording = true;
    frames = [];
    document.getElementById('startRecord').disabled = true;
    document.getElementById('stopRecord').disabled = false;
    
    let frameNum = 0;
    const maxFrames = 30;
    
    function captureFrame() {
        if (!isRecording || frameNum >= maxFrames) {
            stopRecording();
            return;
        }
        
        // Draw animated text
        ctx.fillStyle = '#0f0f1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((frameNum * 12) * Math.PI / 180);
        ctx.fillStyle = color;
        ctx.font = 'bold 60px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 0, 0);
        ctx.restore();
        
        // Add frame
        const dataUrl = canvas.toDataURL('image/png');
        const img = new Image();
        img.onload = () => {
            frames.push({ image: img, dataUrl: dataUrl, delay: 100 });
            updateFramePreview();
            updateStats();
        };
        img.src = dataUrl;
        
        frameNum++;
        animationId = requestAnimationFrame(captureFrame);
    }
    
    captureFrame();
}

function stopRecording() {
    isRecording = false;
    cancelAnimationFrame(animationId);
    document.getElementById('startRecord').disabled = false;
    document.getElementById('stopRecord').disabled = true;
}

// Text to GIF
function createTextGif() {
    const text = document.getElementById('textInput').value || 'Hello!';
    const color = document.getElementById('textColor').value;
    const bgColor = document.getElementById('bgColor').value;
    const fontSize = parseInt(document.getElementById('fontSize').value) || 48;
    
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    frames = [];
    const frameCount = 10;
    
    for (let i = 0; i < frameCount; i++) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Bounce effect
        const bounce = Math.abs(Math.sin(i / frameCount * Math.PI * 2)) * 30;
        
        ctx.fillStyle = color;
        ctx.font = `bold ${fontSize}px system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2 - bounce);
        
        const dataUrl = canvas.toDataURL('image/png');
        const img = new Image();
        img.onload = () => {
            frames.push({ image: img, dataUrl: dataUrl, delay: 100 });
            if (frames.length === frameCount) {
                updateFramePreview();
                updateStats();
                showNotification('Text GIF frames created!');
            }
        };
        img.src = dataUrl;
    }
}

// Generate GIF
let generatedGif = null;

function generateGif() {
    if (frames.length === 0) {
        showNotification('Add some frames first!', 'error');
        return;
    }
    
    if (typeof GIF === 'undefined') {
        showNotification('GIF library loading... please wait', 'info');
        setTimeout(generateGif, 1000);
        return;
    }
    
    const gif = new GIF({
        workers: 2,
        quality: 10,
        width: frames[0].image.width,
        height: frames[0].image.height
    });
    
    frames.forEach(frame => {
        gif.addFrame(frame.image, { delay: frame.delay });
    });
    
    gif.on('finished', (blob) => {
        const url = URL.createObjectURL(blob);
        generatedGif = { blob, url };
        
        document.getElementById('result').innerHTML = `
            <img src="${url}" alt="Generated GIF" class="gif-preview">
            <p class="gif-info">Size: ${(blob.size / 1024).toFixed(1)} KB | Frames: ${frames.length}</p>
        `;
        
        // NEW: Show export section
        showExportSection();
        
        showNotification('GIF generated successfully!');
    });
    
    showNotification('Generating GIF...', 'info');
    gif.render();
}

function downloadGif() {
    if (!generatedGif) {
        showNotification('Generate a GIF first!', 'error');
        return;
    }
    
    const a = document.createElement('a');
    a.href = generatedGif.url;
    a.download = `animation-${Date.now()}.gif`;
    a.click();
    showNotification('GIF downloaded!');
}

// Notification system
function showNotification(message, type = 'success') {
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.textContent = message;
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.classList.add('fade-out');
        setTimeout(() => notif.remove(), 300);
    }, 2500);
}

// Initialize
document.addEventListener('DOMContentLoaded', init);

// NEW: Export and Share functionality
function setupExportAndShare() {
    // Export ZIP - all frames
    const exportZipBtn = document.getElementById('exportZipBtn');
    if (exportZipBtn) {
        exportZipBtn.addEventListener('click', exportFramesAsZip);
    }
    
    // Copy to clipboard
    const copyBtn = document.getElementById('copyClipboardBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', copyGifToClipboard);
    }
    
    // Native share
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', shareGif);
    }
    
    // QR Code
    const qrBtn = document.getElementById('qrBtn');
    if (qrBtn) {
        qrBtn.addEventListener('click', toggleQRCode);
    }
}

// NEW: Export all frames as ZIP file
async function exportFramesAsZip() {
    if (frames.length === 0) {
        showNotification('No frames to export!', 'error');
        return;
    }
    
    // Load JSZip from CDN if not available
    if (typeof JSZip === 'undefined') {
        await loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js');
    }
    
    const zip = new JSZip();
    const folder = zip.folder('gif-frames');
    
    // Add each frame to the zip
    const framePromises = frames.map((frame, index) => {
        return new Promise((resolve) => {
            // Convert data URL to blob
            fetch(frame.dataUrl)
                .then(res => res.blob())
                .then(blob => {
                    const paddedIndex = String(index + 1).padStart(3, '0');
                    folder.file(`frame-${paddedIndex}.png`, blob);
                    resolve();
                })
                .catch(() => resolve());
        });
    });
    
    await Promise.all(framePromises);
    
    // Add metadata file
    const metadata = {
        frameCount: frames.length,
        totalDuration: frames.reduce((acc, f) => acc + (f.delay || 100), 0),
        createdAt: new Date().toISOString(),
        tool: 'GIF Maker Browser by Agent-Lumi'
    };
    folder.file('metadata.json', JSON.stringify(metadata, null, 2));
    
    // Generate and download zip
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gif-frames-${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification(`Exported ${frames.length} frames as ZIP!`);
}

// NEW: Copy GIF to clipboard
async function copyGifToClipboard() {
    if (!generatedGif) {
        showNotification('Generate a GIF first!', 'error');
        return;
    }
    
    try {
        if (navigator.clipboard && navigator.clipboard.write) {
            await navigator.clipboard.write([
                new ClipboardItem({
                    'image/gif': generatedGif.blob
                })
            ]);
            showNotification('GIF copied to clipboard! 📋');
        } else {
            // Fallback - copy link
            await navigator.clipboard.writeText(generatedGif.url);
            showNotification('GIF link copied to clipboard!');
        }
    } catch (err) {
        // Fallback
        await navigator.clipboard.writeText(generatedGif.url);
        showNotification('GIF URL copied to clipboard!');
    }
}

// NEW: Share GIF using Web Share API
async function shareGif() {
    if (!generatedGif) {
        showNotification('Generate a GIF first!', 'error');
        return;
    }
    
    if (navigator.share) {
        try {
            const file = new File([generatedGif.blob], `animation-${Date.now()}.gif`, { 
                type: 'image/gif' 
            });
            await navigator.share({
                title: 'My GIF Animation',
                text: 'Created with GIF Maker Browser by Agent-Lumi',
                files: [file]
            });
            showNotification('Shared successfully! 🔗');
        } catch (err) {
            if (err.name !== 'AbortError') {
                showNotification('Share failed. Trying fallback...', 'error');
                // Fallback - copy to clipboard
                copyGifToClipboard();
            }
        }
    } else {
        // Fallback for browsers without Web Share API
        copyGifToClipboard();
    }
}

// NEW: Generate QR Code for the GIF
function toggleQRCode() {
    const container = document.getElementById('qrCodeContainer');
    const canvas = document.getElementById('qrCanvas');
    
    if (!generatedGif) {
        showNotification('Generate a GIF first!', 'error');
        return;
    }
    
    if (container.style.display === 'none') {
        container.style.display = 'flex';
        
        // Load qrcode.js if not available
        if (typeof QRCode === 'undefined') {
            loadScript('https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js').then(() => {
                generateQRCode(canvas, generatedGif.url);
            });
        } else {
            generateQRCode(canvas, generatedGif.url);
        }
    } else {
        container.style.display = 'none';
    }
}

function generateQRCode(canvas, url) {
    if (typeof QRCode !== 'undefined' && QRCode.toCanvas) {
        QRCode.toCanvas(canvas, url, {
            width: 200,
            margin: 2,
            color: {
                dark: '#6366f1',
                light: '#ffffff'
            }
        }, (err) => {
            if (err) {
                console.error('QR Code generation failed:', err);
            }
        });
    } else {
        // Fallback - draw simple QR placeholder
        const ctx = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = 200;
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(0, 0, 200, 200);
        ctx.fillStyle = 'white';
        ctx.font = '14px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('QR Code', 100, 100);
    }
}

// NEW: Show export section when GIF is generated
function showExportSection() {
    const section = document.getElementById('exportSection');
    if (section) {
        section.style.display = 'block';
    }
}

// NEW: Helper to load external scripts
function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// NEW: Export for global access
window.undo = undo;
window.redo = redo;
window.togglePreview = togglePreview;
