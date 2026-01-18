# Implementation Details

## Overview
This application is a static client-side web app for writing Markdown notes. It uses purely browser-native technologies alongside libraries for parsing and highlighting.

## Tech Stack
-   **Core**: HTML5, CSS3, JavaScript (ES6+).
-   **Libraries**:
    -   `marked.js`: Markdown parsing.
    -   `highlight.js`: Code block syntax highlighting.
-   **Persistence**: File System Access API (Primary) + `localStorage` (Fallback/Cache).

## Architecture

### 1. HTML Structure (`index.html`)
-   **Layout**: Flexbox container (`.app-container`) split into Header and Main.
-   **Main Area**:
    -   `.editor-container`: Contains the Line Number Gutter (`.line-numbers`) and the Textarea (`#note-editor`).
    -   `.preview-pane`: A `<div>` for rendering the parsed HTML.
-   **Modals**: Custom modals for "Insert Table" and "Help".
-   **Notifications**: A floating Conflict Warning panel (`.conflict-warning`) for external change detection.

### 2. Styling (`style.css`)
-   **Theming**:
    -   Uses CSS Variables (`--bg-color`, `--text-color`, `--base-font-size`, etc.).
    -   **Base Font Size**: Controlled by `--base-font-size` (default 16px), allowing global scaling.
-   **Dynamic Scaling**:
    -   Checkboxes and UI elements use `em` units to scale proportionally with the font size.
    -   The Gutter matches line-height.
-   **Custom UI Components**:
    -   **Checkboxes**: Completely redrawn using `appearance: none`.
    -   **Animations**: Slide-in animations for conflict warnings.

### 3. Logic (`app.js`)

#### A. Markdown Processing
-   **Marked.js Config**:
    -   Custom Renderer enabled for checkboxes.
    -   Integrates `highlight.js` for syntax highlighting.
    -   `gfm: true` enabled.

#### B. Editor Features
-   **Line Numbers**: Synchronized scrolling between Textarea and Gutter.
-   **Insert Table**: Generates a blank Markdown generic table structure.

#### C. Persistence & Sync (V9 Architecture)
-   **Hybrid Sync Model**:
    -   **File-First**: Prioritizes saving directly to disk using `window.showSaveFilePicker`.
    -   **Auto-Save**: Input is debounced (1s) and writes automatically to the open File Handle.
    -   **Cross-Tab Sync**: Uses `BroadcastChannel` API (`online-notes-sync`) to propagate changes instantly between tabs in the same browser.
    -   **External Sync**: Uses `setInterval` (2s) to Poll the file's `lastModified` timestamp. If it changes externally (e.g., VS Code), the app detects it.

#### D. Conflict Safety
-   **Dirty State Tracking**: The app tracks if the user has unsaved changes (`isDirty`).
-   **Resolution Strategy**:
    -   **Clean State**: If an external change happens and the user is idle, the app **Auto-Reloads**.
    -   **Dirty State**: If the user is typing and an external change happens, the app **Blocks Overwrite** and shows a warning UI ("External changes detected").
