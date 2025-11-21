const imageInput = document.getElementById('imageInput');
const maxDimensionSlider = document.getElementById('maxDimension');
const qualitySlider = document.getElementById('quality');
const maxDimValue = document.getElementById('maxDimValue');
const qualityValue = document.getElementById('qualityValue');
const comparison = document.getElementById('comparison');
const originalImage = document.getElementById('originalImage');
const compressedImage = document.getElementById('compressedImage');
const originalStats = document.getElementById('originalStats');
const compressedStats = document.getElementById('compressedStats');
const base64Preview = document.getElementById('base64Preview');
const downloadBtn = document.getElementById('downloadBtn');

let currentFile = null;
let compressedBlob = null;

// Update slider values
maxDimensionSlider.addEventListener('input', (e) => {
    maxDimValue.textContent = e.target.value;
    if (currentFile) processImage(currentFile);
});

qualitySlider.addEventListener('input', (e) => {
    qualityValue.textContent = e.target.value;
    if (currentFile) processImage(currentFile);
});

// Handle file upload
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        currentFile = file;
        processImage(file);
    }
});

// Download compressed image
downloadBtn.addEventListener('click', () => {
    if (compressedBlob) {
        const url = URL.createObjectURL(compressedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'compressed-for-llm.jpg';
        a.click();
        URL.revokeObjectURL(url);
    }
});

function processImage(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            // Show original
            originalImage.src = e.target.result;
            displayStats(originalStats, {
                width: img.width,
                height: img.height,
                size: file.size,
                format: file.type
            }, 'Original');

            // Compress image
            compressImage(img);
            comparison.style.display = 'grid';
        };
        img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
}

function compressImage(img) {
    const maxDim = parseInt(maxDimensionSlider.value);
    const quality = parseInt(qualitySlider.value) / 100;

    // Calculate new dimensions
    let width = img.width;
    let height = img.height;
    
    if (width > maxDim || height > maxDim) {
        if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
        } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
        }
    }

    // Create canvas and draw resized image
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // Use better image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    // Convert to JPEG with quality setting
    canvas.toBlob((blob) => {
        compressedBlob = blob;
        const url = URL.createObjectURL(blob);
        compressedImage.src = url;

        // Convert to base64 for display
        canvas.toBlob((base64Blob) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result;
                displayStats(compressedStats, {
                    width: width,
                    height: height,
                    size: blob.size,
                    format: 'image/jpeg'
                }, 'Compressed', base64);
                
                // Show base64 preview
                base64Preview.textContent = base64.substring(0, 500) + '...\n\n[Total length: ' + base64.length + ' characters]';
                downloadBtn.style.display = 'block';
            };
            reader.readAsDataURL(base64Blob);
        }, 'image/jpeg', quality);
    }, 'image/jpeg', quality);
}

function displayStats(element, data, label, base64 = null) {
    const sizeKB = (data.size / 1024).toFixed(2);
    const sizeMB = (data.size / (1024 * 1024)).toFixed(2);
    
    let html = `
        <div><strong>${label} Stats:</strong></div>
        <div>Dimensions: <span class="highlight">${data.width} × ${data.height}px</span></div>
        <div>File Size: <span class="highlight">${sizeKB} KB</span> (${sizeMB} MB)</div>
        <div>Format: <span class="highlight">${data.format}</span></div>
    `;

    if (base64) {
        html += `<div>Base64 Length: <span class="highlight">${base64.length.toLocaleString()} chars</span></div>`;
    }

    element.innerHTML = html;
}
