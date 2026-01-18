// app.js

const STORAGE_KEY = 'online-notes-data';
const DEBOUNCE_DELAY = 1000; // 1 second

// DOM Elements
const noteEditor = document.getElementById('note-editor');
const previewPane = document.getElementById('markdown-preview');
const statusIndicator = document.getElementById('status-indicator');
const btnSave = document.getElementById('btn-save');
const btnOpen = document.getElementById('btn-open');

// --- Status Helper ---
function updateStatus(status) {
    statusIndicator.textContent = status;
    statusIndicator.className = 'status'; // Reset class

    if (status.includes('Saved')) {
        statusIndicator.classList.add('saved');
    } else if (status === 'Saving...') {
        statusIndicator.classList.add('saving');
    }
}

// --- Markdown Rendering ---
function renderMarkdown(text) {
    try {
        // marked is loaded via CDN in index.html
        previewPane.innerHTML = marked.parse(text);
    } catch (e) {
        // Fallback or ignore error, showing raw text is better than nothing
        console.error("Markdown parsing error:", e);
        previewPane.innerText = text;
    }
}

// --- Persistence (Local Storage) ---
function loadNote() {
    const savedNote = localStorage.getItem(STORAGE_KEY);
    if (savedNote) {
        noteEditor.value = savedNote;
        renderMarkdown(savedNote);
    }
}

function saveLocal() {
    const content = noteEditor.value;
    localStorage.setItem(STORAGE_KEY, content);
    updateStatus('Saved (Local)');
}

// Debounce for local save
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
const debouncedSaveLocal = debounce(saveLocal, DEBOUNCE_DELAY);

// --- File System Access API ---

// 1. Save to Disk
async function saveToDisk() {
    const content = noteEditor.value;
    try {
        // Use File System Access API if available
        if (window.showSaveFilePicker) {
            const handle = await window.showSaveFilePicker({
                types: [{
                    description: 'Markdown File',
                    accept: { 'text/markdown': ['.md', '.txt'] },
                }],
            });
            const writable = await handle.createWritable();
            await writable.write(content);
            await writable.close();
            updateStatus('Saved to Disk');
        } else {
            // Fallback: Blob Download
            const blob = new Blob([content], { type: 'text/markdown' });
            const notUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = notUrl;
            a.download = 'note.md';
            a.click();
            URL.revokeObjectURL(notUrl);
            updateStatus('Downloaded');
        }
    } catch (err) {
        console.error('Save failed:', err);
        // User might have cancelled
    }
}

// 2. Open File
async function openFile() {
    try {
        if (window.showOpenFilePicker) {
            const [handle] = await window.showOpenFilePicker({
                types: [{
                    description: 'Markdown File',
                    accept: { 'text/markdown': ['.md', '.txt'] },
                }],
            });
            const file = await handle.getFile();
            const contents = await file.text();

            noteEditor.value = contents;
            renderMarkdown(contents);
            saveLocal(); // Sync to local storage
            updateStatus('Opened File');
        } else {
            // Fallback: Standard Input
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
                    saveLocal();
                    updateStatus('Opened File');
                };
                reader.readAsText(file);
            };
            input.click();
        }
    } catch (err) {
        console.error('Open failed:', err);
    }
}

// --- Event Listeners ---
noteEditor.addEventListener('input', () => {
    updateStatus('Saving...');
    renderMarkdown(noteEditor.value);
    debouncedSaveLocal();
});

btnSave.addEventListener('click', saveToDisk);
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

// --- Initialization ---
loadNote();
