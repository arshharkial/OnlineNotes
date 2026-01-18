// app.js

const STORAGE_KEY = 'online-notes-data';
const DEBOUNCE_DELAY = 1000; // 1 second

// DOM Elements
const noteEditor = document.getElementById('note-editor');
const statusIndicator = document.getElementById('status-indicator');

// Helper to update status
function updateStatus(status) {
    statusIndicator.textContent = status;
    statusIndicator.className = 'status'; // Reset class
    
    if (status === 'Saved') {
        statusIndicator.classList.add('saved');
    } else if (status === 'Saving...') {
        statusIndicator.classList.add('saving');
    }
}

// Load data on startup
function loadNote() {
    const savedNote = localStorage.getItem(STORAGE_KEY);
    if (savedNote) {
        noteEditor.value = savedNote;
    }
}

// Save function
function saveNote() {
    const content = noteEditor.value;
    localStorage.setItem(STORAGE_KEY, content);
    updateStatus('Saved');
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Debounced save
const debouncedSave = debounce(saveNote, DEBOUNCE_DELAY);

// Input event listener
noteEditor.addEventListener('input', () => {
    updateStatus('Saving...');
    debouncedSave();
});

// Initialize
loadNote();
