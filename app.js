// GIF.js library for GIF creation
const GIF_SCRIPT = document.createElement('script');
GIF_SCRIPT.src = 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js';
document.head.appendChild(GIF_SCRIPT);

let frames = [];
let isRecording = false;
let animationId = null;

// Wait for GIF.js to load
function init() {
    // Setup drag and drop
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
}

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

function handleFiles(files) {
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => addFrame(e.target.result, file.name);
        reader.readAsDataURL(file);
    });
}

function addFrame(dataUrl, name = 'Frame') {
    const img = new Image();
    img.onload = () => {
        frames.push({
            image: img,
            dataUrl: dataUrl,
            delay: parseInt(document.getElementById('frameDelay').value) || 100
        });
        updateFramePreview();
        updateStats();
        showNotification(`Added frame: ${name}`);
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
        <div class="frame-item" data-index="${i}">
            <img src="${frame.dataUrl}" alt="Frame ${i + 1}">
            <span class="frame-num">#${i + 1}</span>
            <button class="remove-frame" onclick="removeFrame(${i})">×</button>
        </div>
    `).join('');
}

function removeFrame(index) {
    frames.splice(index, 1);
    updateFramePreview();
    updateStats();
}

function clearFrames() {
    if (frames.length === 0) return;
    if (!confirm('Clear all frames?')) return;
    frames = [];
    updateFramePreview();
    updateStats();
    document.getElementById('result').innerHTML = '';
}

function updateStats() {
    document.getElementById('frameCount').textContent = frames.length;
    const size = frames.reduce((acc, f) => acc + (f.dataUrl.length * 0.75), 0);
    document.getElementById('totalSize').textContent = (size / 1024 / 1024).toFixed(2) + ' MB';
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
