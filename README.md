# Online Note

A simple, distraction-free, browser-based note-taking application with Markdown support.

## Features

-   **Privacy First**: Data is stored locally. No server involved.
-   **Markdown Support**: Write in Markdown and see a real-time preview (Split View).
-   **File Persistence**: Save your notes to `.md` files on your disk and open them later. This allows you to keep your data even if you switch browsers or clear your cache.
-   **Pitch Black Theme**: High-contrast dark mode for coding/writing in low light.
-   **Auto-Save**: Automatically saves to browser LocalStorage as a backup.

## How to Run

1.  Clone this repository or download the source code.
2.  Open the `index.html` file in any modern web browser.
3.  Start writing!

## File System Access
-   **Save to Disk**: Click the "Save to Disk" button to save your current note as a file on your computer.
-   **Open File**: Click "Open File" to load a Markdown or Text file from your computer.

## Development

-   `index.html`: Structure and layout.
-   `style.css`: Pitch black theme and split-view styling.
-   `app.js`: Logic for Markdown rendering (via `marked.js`), auto-save, and File I/O.
