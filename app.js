// app.js

const STORAGE_KEY = 'online-notes-data';
const DEBOUNCE_DELAY = 1000; // 1 second

// DOM Elements
const noteEditor = document.getElementById('note-editor');
const lineNumbers = document.getElementById('line-numbers');
const previewPane = document.getElementById('markdown-preview');
const statusIndicator = document.getElementById('status-indicator');
const btnSave = document.getElementById('btn-save');
const btnOpen = document.getElementById('btn-open');

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
    renderMarkdown(noteEditor.value);
    updateLineNumbers();
    debouncedSaveLocal();
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
        renderMarkdown(newText);
        debouncedSaveLocal();
        updateStatus('Saved (Local)');
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

// --- Persistence (Local Storage) ---
function loadNote() {
    const savedNote = localStorage.getItem(STORAGE_KEY);
    if (savedNote) {
        noteEditor.value = savedNote;
        renderMarkdown(savedNote);
        updateLineNumbers();
    } else {
        updateLineNumbers(); // Init for empty state
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
// (Kept same as V2)

// 1. Save to Disk
async function saveToDisk() {
    const content = noteEditor.value;
    try {
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
            updateLineNumbers();
            saveLocal();
            updateStatus('Opened File');
        } else {
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
    updateLineNumbers();
    debouncedSaveLocal();
});

// Handle tab key in textarea (Optional but nice for code lines)
noteEditor.addEventListener('keydown', function (e) {
    if (e.key == 'Tab') {
        e.preventDefault();
        const start = this.selectionStart;
        const end = this.selectionEnd;

        // set textarea value to: text before caret + tab + text after caret
        this.value = this.value.substring(0, start) + "\t" + this.value.substring(end);

        // put caret at right place
        this.selectionStart = this.selectionEnd = start + 1;

        // Trigger update
        renderMarkdown(this.value);
        debouncedSaveLocal();
    }
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
