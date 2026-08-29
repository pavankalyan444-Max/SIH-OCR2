// Legal Metrology AI Inspection - Frontend Logic

const API_URL = '/inspect/product';

// State
const state = {
    files: {
        front: null,
        back: null,
        side: null
    },
    result: null
};

// DOM Elements
const elements = {
    // Upload
    dropZones: {
        front: document.getElementById('drop-front'),
        back: document.getElementById('drop-back'),
        side: document.getElementById('drop-side')
    },
    fileInputs: {
        front: document.getElementById('file-front'),
        back: document.getElementById('file-back'),
        side: document.getElementById('file-side')
    },
    previews: {
        front: document.getElementById('preview-front'),
        back: document.getElementById('preview-back'),
        side: document.getElementById('preview-side')
    },
    previewImages: {
        front: document.getElementById('img-front'),
        back: document.getElementById('img-back'),
        side: document.getElementById('img-side')
    },
    filenames: {
        front: document.getElementById('filename-front'),
        back: document.getElementById('filename-back'),
        side: document.getElementById('filename-side')
    },
    dropContents: {
        front: document.getElementById('drop-content-front'),
        back: document.getElementById('drop-content-back'),
        side: document.getElementById('drop-content-side')
    },
    statuses: {
        front: document.getElementById('status-front'),
        back: document.getElementById('status-back'),
        side: document.getElementById('status-side')
    },
    uploadCards: {
        front: document.querySelector('[data-view="front"]'),
        back: document.querySelector('[data-view="back"]'),
        side: document.querySelector('[data-view="side"]')
    },
    btnInspect: document.getElementById('btn-inspect'),
    btnNew: document.getElementById('btn-new'),
    
    // Results
    uploadSection: document.getElementById('upload-section'),
    resultsSection: document.getElementById('results-section'),
    categoryBadge: document.getElementById('category-badge'),
    fieldsGrid: document.getElementById('fields-grid'),
    qualityGrid: document.getElementById('quality-grid'),
    evidenceGrid: document.getElementById('evidence-grid'),
    errorToast: document.getElementById('error-toast')
};

// Field display configuration
const FIELD_CONFIG = {
    product_name: { label: 'Product Name', icon: '' },
    brand: { label: 'Brand', icon: '' },
    mrp: { label: 'MRP', icon: '₹' },
    net_quantity: { label: 'Net Quantity', icon: '' },
    manufacturer: { label: 'Manufacturer', icon: '' },
    packer: { label: 'Packer', icon: '' },
    importer: { label: 'Importer', icon: '' },
    country_of_origin: { label: 'Country of Origin', icon: '' },
    manufacturing_date: { label: 'Manufacturing Date', icon: '' },
    expiry_date: { label: 'Expiry Date', icon: '' },
    batch_number: { label: 'Batch Number', icon: '' }
};

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
    setupDropZones();
    setupFileInputs();
    setupRemoveButtons();
    setupInspectButton();
    setupNewButton();
}

function setupDropZones() {
    Object.keys(elements.dropZones).forEach(view => {
        const zone = elements.dropZones[view];
        const input = elements.fileInputs[view];
        
        zone.addEventListener('click', () => input.click());
        
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('drag-over');
        });
        
        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over');
        });
        
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file) handleFileSelect(view, file);
        });
    });
}

function setupFileInputs() {
    Object.keys(elements.fileInputs).forEach(view => {
        elements.fileInputs[view].addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) handleFileSelect(view, file);
        });
    });
}

function setupRemoveButtons() {
    document.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const view = btn.dataset.view;
            removeFile(view);
        });
    });
}

function setupInspectButton() {
    elements.btnInspect.addEventListener('click', handleInspect);
}

function setupNewButton() {
    elements.btnNew.addEventListener('click', resetToUpload);
}

function handleFileSelect(view, file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showError(`${view.charAt(0).toUpperCase() + view.slice(1)} image must be an image file`);
        return;
    }
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
        showError(`${view.charAt(0).toUpperCase() + view.slice(1)} image is too large (max 10MB)`);
        return;
    }
    
    state.files[view] = file;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        elements.previewImages[view].src = e.target.result;
        elements.filenames[view].textContent = file.name;
        elements.dropContents[view].hidden = true;
        elements.previews[view].hidden = false;
        elements.uploadCards[view].classList.add('has-image');
        elements.statuses[view].textContent = '✓ Ready';
        elements.statuses[view].className = 'card-status success';
        checkAllUploaded();
    };
    reader.readAsDataURL(file);
}

function removeFile(view) {
    state.files[view] = null;
    elements.fileInputs[view].value = '';
    elements.previewImages[view].src = '';
    elements.filenames[view].textContent = '';
    elements.dropContents[view].hidden = false;
    elements.previews[view].hidden = true;
    elements.uploadCards[view].classList.remove('has-image');
    elements.statuses[view].textContent = '';
    elements.statuses[view].className = 'card-status';
    checkAllUploaded();
}

function checkAllUploaded() {
    const allUploaded = Object.values(state.files).every(f => f !== null);
    elements.btnInspect.disabled = !allUploaded;
}

async function handleInspect() {
    // Show loading state
    elements.btnInspect.classList.add('loading');
    elements.btnInspect.disabled = true;
    hideError();
    
    // Prepare form data
    const formData = new FormData();
    formData.append('front_image', state.files.front);
    formData.append('back_image', state.files.back);
    formData.append('side_image', state.files.side);
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || 'Inspection failed');
        }
        
        state.result = data;
        showResults(data);
    } catch (error) {
        showError(error.message);
    } finally {
        elements.btnInspect.classList.remove('loading');
        elements.btnInspect.disabled = false;
    }
}

function showResults(data) {
    // Hide upload, show results
    elements.uploadSection.hidden = true;
    elements.resultsSection.hidden = false;
    
    // Category
    const category = data.category || 'unknown';
    elements.categoryBadge.textContent = category.toUpperCase();
    elements.categoryBadge.className = 'category-badge ' + category;
    
    // Fields
    renderFields(data.fields || {});
    
    // Quality
    renderQuality(data.quality || {});
    
    // Evidence
    renderEvidence(data.evidence || {}, data.images || {});
}

function renderFields(fields) {
    const grid = elements.fieldsGrid;
    grid.innerHTML = '';
    
    Object.entries(FIELD_CONFIG).forEach(([key, config]) => {
        const field = fields[key];
        const item = document.createElement('div');
        item.className = 'field-item';
        
        if (!field || field.value === null) {
            item.classList.add('not-found');
            item.innerHTML = `
                <span class="field-label">${config.label}</span>
                <span class="field-value not-found">Not detected</span>
                <div class="field-meta">
                    <span class="confidence-badge NOT_FOUND">NOT FOUND</span>
                </div>
            `;
        } else if (field.status === 'CONFLICT') {
            item.classList.add('conflict');
            let candidatesHtml = field.candidates.map(c => `
                <div class="candidate-item">
                    <span class="candidate-value">${c.value}</span>
                    <span class="candidate-source">${c.source}</span>
                    <span class="candidate-confidence">conf: ${c.confidence.toFixed(2)} (${c.level})</span>
                </div>
            `).join('');
            
            item.innerHTML = `
                <span class="field-label">${config.label}</span>
                <span class="field-value conflict">CONFLICT DETECTED</span>
                <div class="field-meta">
                    <span class="confidence-badge CONFLICT">CONFLICT</span>
                </div>
                <div class="candidates-list">${candidatesHtml}</div>
            `;
        } else {
            const value = config.icon ? `${config.icon}${field.value}` : field.value;
            const unit = field.unit ? ` ${field.unit}` : '';
            const sources = field.sources ? field.sources.map(s => s.image).join(', ') : 'unknown';
            
            item.innerHTML = `
                <span class="field-label">${config.label}</span>
                <span class="field-value">${value}${unit}</span>
                <div class="field-meta">
                    <span class="confidence-badge ${field.level || 'LOW'}">${field.level || 'LOW'}</span>
                    <span class="sources-list">Source: ${sources}</span>
                </div>
            `;
        }
        
        grid.appendChild(item);
    });
}

function renderQuality(quality) {
    const grid = elements.qualityGrid;
    grid.innerHTML = '';
    
    const views = ['front', 'back', 'side'];
    views.forEach(view => {
        const q = quality[view] || { status: 'UNKNOWN', reasons: [], metrics: {} };
        const item = document.createElement('div');
        item.className = `quality-item ${q.status === 'GOOD' ? 'good' : q.status === 'BAD' ? 'bad' : ''}`;
        
        const statusText = q.status === 'GOOD' ? 'Good' : q.status === 'BAD' ? 'Issues Found' : 'Unknown';
        const statusClass = q.status === 'GOOD' ? 'good' : q.status === 'BAD' ? 'bad' : '';
        const icon = q.status === 'GOOD' ? '✓' : q.status === 'BAD' ? '⚠' : '?';
        
        let reasonsHtml = '';
        if (q.reasons && q.reasons.length > 0) {
            reasonsHtml = `<div class="quality-reasons">${q.reasons.join(', ')}</div>`;
        }
        
        item.innerHTML = `
            <span class="quality-label">${view.toUpperCase()} VIEW</span>
            <div class="quality-status ${statusClass}">
                <span class="status-icon">${icon}</span>
                <span>${statusText}</span>
            </div>
            ${reasonsHtml}
        `;
        
        grid.appendChild(item);
    });
}

function renderEvidence(evidence, images) {
    const grid = elements.evidenceGrid;
    grid.innerHTML = '';
    
    const views = ['front', 'back', 'side'];
    views.forEach(view => {
        const item = document.createElement('div');
        item.className = 'evidence-item';
        
        // Use fields evidence image if available, otherwise OCR, otherwise original
        let imgSrc = '';
        const ev = evidence[view] || {};
        if (ev.fields) imgSrc = ev.fields;
        else if (ev.ocr) imgSrc = ev.ocr;
        else if (ev.original) imgSrc = ev.original;
        
        // Make path relative for serving
        if (imgSrc) {
            // Remove any leading path components, just use filename
            const filename = imgSrc.split(/[\\/]/).pop();
            imgSrc = `/static/../evidence/${filename}`;
        }
        
        item.innerHTML = `
            <span class="evidence-label">${view.toUpperCase()} VIEW</span>
            <img class="evidence-image" src="${imgSrc}" alt="${view} evidence" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <div class="evidence-placeholder" style="display:none; width:100%; aspect-ratio:4/3; background:#f5f5f5; border:1px dashed #ccc; border-radius:4px; display:flex; align-items:center; justify-content:center; color:#888; font-size:0.85rem;">No evidence image</div>
        `;
        
        grid.appendChild(item);
    });
}

function resetToUpload() {
    // Reset state
    state.files = { front: null, back: null, side: null };
    state.result = null;
    
    // Reset UI
    ['front', 'back', 'side'].forEach(view => {
        elements.fileInputs[view].value = '';
        elements.previewImages[view].src = '';
        elements.filenames[view].textContent = '';
        elements.dropContents[view].hidden = false;
        elements.previews[view].hidden = true;
        elements.uploadCards[view].classList.remove('has-image');
        elements.statuses[view].textContent = '';
        elements.statuses[view].className = 'card-status';
    });
    
    elements.btnInspect.disabled = true;
    elements.uploadSection.hidden = false;
    elements.resultsSection.hidden = true;
    hideError();
}

function showError(message) {
    elements.errorToast.textContent = message;
    elements.errorToast.hidden = false;
    setTimeout(hideError, 5000);
}

function hideError() {
    elements.errorToast.hidden = true;
}