# Implementation Details

## Overview
This application is a static client-side web app for writing Markdown notes. It uses purely browser-native technologies alongside the `marked` library for parsing.

## Architecture

### 1. HTML Structure (`index.html`)
-   **Layout**: Uses a Flexbox container for the main app.
-   **Main Area**: Split into two panes:
    -   `#note-editor`: A `<textarea>` for raw Markdown input.
    -   `#markdown-preview`: A `<div>` for rendering the parsed HTML.
-   **Controls**: Buttons for "Open File" and "Save to Disk".

### 2. Styling (`style.css`)
-   **Theme**: "Pitch Black" theme.
    -   Backgrounds are `#000000`.
    -   Text is `#ffffff`.
    -   Borders are subtle gray (`#333`).
-   **Typography**: Base font size set to `16pt` for readability.
-   **Split View**: A 50/50 split layout for editor and preview.

### 3. Logic (`app.js`)
-   **Markdown**: Uses `marked.parse()` to convert input text to HTML in real-time.
-   **Local Storage**: Continues to save to `online-notes-data` on every keystroke (debounced 1s) as a quick-resume cache.
-   **File System Access API**:
    -   `showSaveFilePicker()`: Allows the user to save the content directly to a file on their OS.
    -   `showOpenFilePicker()`: Allows the user to open a local file.
    -   **Fallbacks**: If the API is not supported (e.g., Firefox), it falls back to `<input type="file">` for opening and Blob downloads for saving.

## Data Persistence Strategy
1.  **Short-term**: `localStorage` handles auto-saving so you don't lose work if you accidentally close the tab.
2.  **Long-term / Portable**: The "Save to Disk" feature allows users to own their data as physical files, solving the browser-isolation limits of `localStorage`.
