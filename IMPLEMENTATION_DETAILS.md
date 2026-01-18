# Implementation Details

## Overview
This application is a static client-side web app for writing Markdown notes. It uses purely browser-native technologies alongside libraries for parsing and highlighting.

## Tech Stack
-   **Core**: HTML5, CSS3, JavaScript (ES6+).
-   **Libraries**:
    -   `marked.js`: Markdown parsing.
    -   `highlight.js`: Code block syntax highlighting.
-   **Persistence**: `localStorage` (Cache) + File System Access API (Disk I/O).

## Architecture

### 1. HTML Structure (`index.html`)
-   **Layout**: Flexbox container (`.app-container`) split into Header and Main.
-   **Main Area**:
    -   `.editor-container`: Contains the Line Number Gutter (`.line-numbers`) and the Textarea (`#note-editor`).
    -   `.preview-pane`: A `<div>` for rendering the parsed HTML.
-   **Modals**: Custom modals for "Insert Table" and "Help", hidden by default via CSS classes.

### 2. Styling (`style.css`)
-   **Theming**:
    -   Uses CSS Variables (`--bg-color`, `--text-color`, `--base-font-size`, etc.) for easy theming and dynamic adjustments.
    -   **Base Font Size**: Controlled by `--base-font-size` (default 16px), allowing global scaling.
-   **Dynamic Scaling**:
    -   Checkboxes and UI elements use `em` units to scale proportionally with the font size.
    -   The Gutter uses fixed width but matches line-height.
-   **Custom UI Components**:
    -   **Checkboxes**: Completely redrawn using `appearance: none`, styled with green background/tick on checked state.
    -   **Tables**: Zebra striping and clearer borders for better visibility.
    -   **Animations**: Error shake animation for validation failures.

### 3. Logic (`app.js`)

#### A. Markdown Processing
-   **Marked.js Config**:
    -   Custom Renderer enabled for finer control (e.g., custom checkboxes).
    -   Integrates `highlight.js` in the `highlight` option for code blocks.
    -   `gfm: true` and `breaks: true` enabled.

#### B. Editor Features
-   **Line Numbers**:
    -   Calculated by counting newline characters in the text.
    -   Synchronized scrolling between Textarea and Gutter.
-   **Insert Table**:
    -   Generates a blank Markdown generic table structure based on generic Row/Col inputs.
    -   Validation uses visual cues (CSS classes) rather than native alerts.

#### C. Settings & Persistence
-   **Font Size**:
    -   Value stored in `localStorage` key `online-notes-font-size`.
    -   On load, it applies the value to `document.documentElement.style.setProperty('--base-font-size', ...)`.
-   **File System**:
    -   Uses `window.showSaveFilePicker` and `window.showOpenFilePicker`.
    -   Fallbacks implemented for non-Chromium browsers (`<input type="file">`, Blob URL download).

#### D. Auto-Save
-   **Debouncing**: Input events are debounced (1s) before saving to `localStorage` to prevent performance issues.
