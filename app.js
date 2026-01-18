// app.js

const STORAGE_KEY = 'online-notes-data';
const DEBOUNCE_DELAY = 1000; // 1 second
const SYNC_CHANNEL = 'online-notes-sync';

// State
let currentFileHandle = null;
let lastModifiedTime = 0;
let isDirty = false;
let isSaving = false;

// Broadcast Channel
const syncChannel = new BroadcastChannel(SYNC_CHANNEL);

// DOM Elements
const noteEditor = document.getElementById('note-editor');
const lineNumbers = document.getElementById('line-numbers');
const previewPane = document.getElementById('markdown-preview');
const statusIndicator = document.getElementById('status-indicator');
const btnSave = document.getElementById('btn-save'); // Now "Save As" essentially
const btnOpen = document.getElementById('btn-open');
const conflictWarning = document.getElementById('conflict-warning');
const btnReloadConflict = document.getElementById('btn-reload-conflict');
const btnDismissConflict = document.getElementById('btn-dismiss-conflict');


// --- Configure Marked (Modern Way for Syntax Highlighting) ---
const renderer = new marked.Renderer();
renderer.code = function ({ text, lang, escaped }) {
    const language = lang || 'plaintext';
    // Check if language is supported by highlight.js
    const validLang = hljs.getLanguage(language) ? language : 'plaintext';
    try {
        const highlighted = hljs.highlight(text, { language: validLang }).value;
        return `<pre><code class="hljs language-${validLang}">${highlighted}</code></pre>`;
    } catch (e) {
        return `<pre><code class="hljs language-plaintext">${text}</code></pre>`;
    }
};
// Fix: Enable Checkboxes (Remove 'disabled' attribute)
renderer.checkbox = function ({ checked }) {
    return `<input type="checkbox" ${checked ? 'checked' : ''} class="task-list-item-checkbox">`;
};

// Use the renderer
marked.use({ renderer });
marked.setOptions({
    breaks: true,
    gfm: true
});

// --- Table Insertion Logic ---
const btnTable = document.getElementById('btn-table');
const tableModal = document.getElementById('table-modal');
const btnInsertTable = document.getElementById('btn-insert-table');
const spanCloseTable = document.getElementById('close-table');
const inputRows = document.getElementById('table-rows');
const inputCols = document.getElementById('table-cols');

function createTableMarkdown(rows, cols) {
    let table = '';
    // Header Row
    table += '|';
    for (let c = 1; c <= cols; c++) {
        table += '   |';
    }
    table += '\n|';
    // Separator Row
    for (let c = 1; c <= cols; c++) {
        table += ' --- |';
    }
    table += '\n';
    // Body Rows
    for (let r = 1; r <= rows; r++) {
        table += '|';
        for (let c = 1; c <= cols; c++) {
            table += '   |';
        }
        table += '\n';
    }
    return table + '\n';
}

function insertTextAtCursor(text) {
    const start = noteEditor.selectionStart;
    const end = noteEditor.selectionEnd;

    const before = noteEditor.value.substring(0, start);
    const after = noteEditor.value.substring(end);

    noteEditor.value = before + text + after;

    // Move cursor to end of inserted text
    noteEditor.selectionStart = noteEditor.selectionEnd = start + text.length;

    // Trigger updates
    triggerUpdate();
}

// Open Modal
btnTable.addEventListener('click', () => {
    tableModal.classList.remove('hidden');
    inputRows.focus();
});

// Close Modal Helpers
function closeTableModal() {
    tableModal.classList.add('hidden');
}

spanCloseTable.addEventListener('click', closeTableModal);

// Handle Insert
btnInsertTable.addEventListener('click', () => {
    const r = parseInt(inputRows.value);
    const c = parseInt(inputCols.value);

    // Reset errors
    inputRows.classList.remove('input-error');
    inputCols.classList.remove('input-error');

    let valid = true;
    if (isNaN(r) || r < 1) {
        inputRows.classList.add('input-error');
        valid = false;
    }
    if (isNaN(c) || c < 1) {
        inputCols.classList.add('input-error');
        valid = false;
    }

    if (!valid) return;

    const tableMd = createTableMarkdown(r, c);
    insertTextAtCursor(tableMd);
    closeTableModal();
});

// Close on outside click (Shared with Help Modal logic below, but specific check here)
window.addEventListener('click', (event) => {
    if (event.target === tableModal) {
        closeTableModal();
    }
});


// --- Interactive Checkboxes Logic ---
function toggleChecklist(index) {
    const text = noteEditor.value;
    const regex = /^(\s*-\s*\[)([ xX])(\]\s)/gm;
    let match;
    let currentIndex = 0;

    // Replace the Nth match
    const newText = text.replace(regex, (fullMatch, prefix, checked, suffix) => {
        if (currentIndex === index) {
            const newStatus = (checked === ' ' ? 'x' : ' ');
            currentIndex++;
            return `${prefix}${newStatus}${suffix}`;
        }
        currentIndex++;
        return fullMatch;
    });

    if (newText !== text) {
        noteEditor.value = newText;
        triggerUpdate();
    }
}

// Event Delegation for Checkboxes
previewPane.addEventListener('change', (e) => {
    if (e.target.type === 'checkbox') {
        const checkboxes = Array.from(previewPane.querySelectorAll('input[type="checkbox"]'));
        const index = checkboxes.indexOf(e.target);
        if (index !== -1) {
            toggleChecklist(index);
        }
    }
});

// --- Status Helper ---
function updateStatus(status) {
    statusIndicator.textContent = status;
    statusIndicator.className = 'status'; // Reset class

    if (status.includes('Saved')) {
        statusIndicator.classList.add('saved');
    } else if (status === 'Saving...') {
        statusIndicator.classList.add('saving');
    } else if (status === 'Unsaved Changes') {
        statusIndicator.style.color = '#ffcc00';
    }
}

// --- Line Numbers Logic ---
function updateLineNumbers() {
    const lines = noteEditor.value.split('\n').length;
    // Ensure at least one line number is shown even if empty
    const count = lines > 0 ? lines : 1;

    lineNumbers.innerHTML = Array(count).fill(0).map((_, i) => `<div>${i + 1}</div>`).join('');
}

// Sync Scroll
noteEditor.addEventListener('scroll', () => {
    lineNumbers.scrollTop = noteEditor.scrollTop;
});

// --- Markdown Rendering ---
function renderMarkdown(text) {
    try {
        previewPane.innerHTML = marked.parse(text);
    } catch (e) {
        console.error("Markdown parsing error:", e);
        previewPane.innerText = text; // Fallback
    }
}

// --- Core Logic: Load, Save, Sync ---

// 1. Trigger Update (Called on Input)
function triggerUpdate() {
    isDirty = true;
    updateStatus('Unsaved Changes');
    renderMarkdown(noteEditor.value);
    updateLineNumbers();
    debouncedSave(); // Auto-save trigger
}

// 2. Load Initial
function loadNote() {
    // For now, load from localStorage if available (Scratchpad mode)
    // In V9, we prioritize Files, but if no file is open, we fallback to cache.
    const savedNote = localStorage.getItem(STORAGE_KEY);
    if (savedNote) {
        noteEditor.value = savedNote;
        renderMarkdown(savedNote);
        updateLineNumbers();
        updateStatus('Loaded (Scratchpad)');
    } else {
        updateLineNumbers();
        updateStatus('New Note');
    }
}

// 3. Save (Dual Strategy)
async function performSave() {
    if (isSaving) return;
    isSaving = true;
    updateStatus('Saving...');

    const content = noteEditor.value;

    try {
        if (currentFileHandle) {
            // Save to Disk (File System)
            const writable = await currentFileHandle.createWritable();
            await writable.write(content);
            await writable.close();

            // Update metadata
            const file = await currentFileHandle.getFile();
            lastModifiedTime = file.lastModified;
            updateStatus(`Saved to ${file.name}`);

            // Notify other tabs
            syncChannel.postMessage({ type: 'update', content: content, source: 'external' });
        } else {
            // Save to Scratchpad (LocalStorage)
            localStorage.setItem(STORAGE_KEY, content);
            updateStatus('Saved (Local)');
            // Notify other tabs
            syncChannel.postMessage({ type: 'update', content: content, source: 'scratchpad' });
        }
        isDirty = false;
    } catch (err) {
        console.error('Save failed:', err);
        updateStatus('Save Failed!');
    } finally {
        isSaving = false;
    }
}

// Debounce wrapper
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
const debouncedSave = debounce(performSave, DEBOUNCE_DELAY);


// 4. File Open (Manual)
async function openFile() {
    try {
        if (window.showOpenFilePicker) {
            const [handle] = await window.showOpenFilePicker({
                types: [{
                    description: 'Markdown File',
                    accept: { 'text/markdown': ['.md', '.txt'] },
                }],
            });

            currentFileHandle = handle;
            await loadFromFileHandle(handle);

            // Clear scratchpad so we don't get confused? 
            // Optional: User might want to keep scratchpad separate.

        } else {
            // Fallback for non-FSA (Manual Read)
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.md,.txt';
            input.onchange = e => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = event => {
                    noteEditor.value = event.target.result;
                    renderMarkdown(event.target.result);
                    updateLineNumbers();
                    isDirty = true; // Treated as unsaved in scratchpad logic
                    debouncedSave();
                };
                reader.readAsText(file);
            };
            input.click();
        }
    } catch (err) {
        console.error('Open failed:', err);
    }
}

// Helper to load from handle
async function loadFromFileHandle(handle) {
    const file = await handle.getFile();
    const contents = await file.text();

    lastModifiedTime = file.lastModified;
    noteEditor.value = contents;
    renderMarkdown(contents);
    updateLineNumbers();
    isDirty = false;
    updateStatus(`Opened ${file.name}`);
}


// --- Sync Logic ---

// 1. Polling for External Changes
setInterval(async () => {
    if (!currentFileHandle || isSaving) return; // Don't poll if saving or no file

    try {
        const file = await currentFileHandle.getFile();
        if (file.lastModified > lastModifiedTime) {
            // External Change Detected!
            if (isDirty) {
                // Conflict: User has unsaved work, file changed on disk
                showConflictWarning();
            } else {
                // Safe: User hasn't touched the file, safe to reload
                console.log('Auto-reloading external changes...');
                await loadFromFileHandle(currentFileHandle);
            }
        }
    } catch (err) {
        console.warn('Poll failed:', err);
    }
}, 2000); // Check every 2s

// 2. BroadcastChannel Listener (Tab Sync)
syncChannel.onmessage = (event) => {
    const { type, content } = event.data;
    if (type === 'update') {
        if (isDirty) {
            // Another tab updated, but we have unsaved work here?
            // Actually, if it's the SAME browser, we might want to just sync?
            // But let's be safe: warn.
            showConflictWarning();
        } else {
            // Clean state, just accept the update
            noteEditor.value = content;
            renderMarkdown(content);
            updateLineNumbers();

            // If it was a file save, we should ideally update our timestamp too?
            // Since we can't easily get the file handle from another tab, 
            // we rely on the logic that we are now "Clean" and up to date.
            // But for polling to work, if tab A saved to disk, tab B needs to know the new timestamp
            // otherwise polling will think it's an external change.
            // For now, simpliest is to accept content.
        }
    }
};

// 3. Conflict UI
function showConflictWarning() {
    conflictWarning.classList.remove('hidden');
}

btnReloadConflict.addEventListener('click', async () => {
    if (currentFileHandle) {
        await loadFromFileHandle(currentFileHandle);
        conflictWarning.classList.add('hidden');
    } else {
        // Scratchpad reload from localstorage?
        loadNote();
        conflictWarning.classList.add('hidden');
    }
});

btnDismissConflict.addEventListener('click', () => {
    // User chooses to keep their version.
    // We update lastModifiedTime to NOW so we stop warning about the OLD change.
    // Effectively "Overwriting" the knowledge of the external change.
    conflictWarning.classList.add('hidden');
    // We don't save immediately, wait for next user input or manual save.
    // But we should update our timestamp reference to avoid loop.
    if (currentFileHandle) {
        currentFileHandle.getFile().then(f => {
            lastModifiedTime = f.lastModified;
        });
    }
});


// --- Event Listeners ---
noteEditor.addEventListener('input', triggerUpdate);

// Handle tab key in textarea
noteEditor.addEventListener('keydown', function (e) {
    if (e.key == 'Tab') {
        e.preventDefault();
        const start = this.selectionStart;
        const end = this.selectionEnd;
        this.value = this.value.substring(0, start) + "\t" + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + 1;
        triggerUpdate();
    }
});

// Save Button (Force Save / Save As if needed, but handles auto-save logic generally)
btnSave.addEventListener('click', performSave);
btnOpen.addEventListener('click', openFile);

// --- Help Modal Logic ---
const modal = document.getElementById('help-modal');
const btnHelp = document.getElementById('btn-help');
const spanClose = document.getElementById('close-help');

btnHelp.addEventListener('click', () => {
    modal.classList.remove('hidden');
});

spanClose.addEventListener('click', () => {
    modal.classList.add('hidden');
});

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.classList.add('hidden');
    }
});

// --- Font Size Logic ---
const fontSizeInput = document.getElementById('font-size-input');
const FONT_SIZE_KEY = 'online-notes-font-size';

function setFontSize(size) {
    const sizeVal = parseInt(size);
    if (!isNaN(sizeVal) && sizeVal >= 8 && sizeVal <= 72) {
        document.documentElement.style.setProperty('--base-font-size', sizeVal + 'px');
        fontSizeInput.value = sizeVal;
        localStorage.setItem(FONT_SIZE_KEY, sizeVal);
        setTimeout(updateLineNumbers, 0);
    }
}

fontSizeInput.addEventListener('input', (e) => {
    setFontSize(e.target.value);
});

const btnDecreaseFont = document.getElementById('btn-decrease-font');
const btnIncreaseFont = document.getElementById('btn-increase-font');

btnDecreaseFont.addEventListener('click', () => {
    const current = parseInt(fontSizeInput.value);
    if (!isNaN(current)) {
        setFontSize(current - 1);
    }
});

btnIncreaseFont.addEventListener('click', () => {
    const current = parseInt(fontSizeInput.value);
    if (!isNaN(current)) {
        setFontSize(current + 1);
    }
});

const savedFontSize = localStorage.getItem(FONT_SIZE_KEY);
if (savedFontSize) {
    setFontSize(savedFontSize);
} else {
    setFontSize(16);
}

// --- Initialization ---
loadNote();
