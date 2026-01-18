# Walkthrough - Online Note Application (V8.0)

The application now features explicit controls for font size adjustments and a comprehensive revision history.

## V8.0 Refinements
-   **Font Size Buttons**: Added `[-]` and `[+]` buttons next to the font size input. This allows for quick, precise 2px adjustments without typing.
-   **Documentation**: Migrated the project history to `REVISIONS.md` and updated the README.

## V7.0 Refinements
-   **Precise Font Size Control**: Replaced the limited dropdown with a **Number Input**. You can type any size you want (min 8px, max 72px) for granular control.
-   **Scalable Checkboxes**: Checkboxes now use relative sizing (`em` units). This means if you increase the font size to 30px, the checkboxes will grow proportionally, remaining easy to click and see.

## V6.0 features
-   **Font Size Control**: A number input field in the header allows you to set the base font size.
-   **Automatic Scaling**: Editor text, Preview text, Line Numbers, and UI elements all scale synchronously.
-   **Persistence**: Your selected font size is saved to local storage and restored when you return to the app.

## V5.1 Bug Fixes
-   **Table Modal validation**: Replaced the error `alert()` with a visual shake animation and red border on invalid inputs.

## V5.0 UI Refinements
-   **Checkbox Design**: Checkboxes now have a custom style. They appear as clear, empty boxes when unchecked and turn bright green with a black tick when checked.
-   **Table Design**: Tables in the preview pane now have visible borders and zebra striping for readability.
-   **Insert Table Modal**: The "Insert Table" flow now uses a custom dark-themed styling modal instead of browser popups.

## V4.0 Updates
-   **Insert Table**: New "Table" button in the header. Click it, enter rows/cols, and a markdown table template will be inserted at your cursor.
-   **Checkbox Fix**: Checkboxes in the preview pane are now fully interactive and no longer disabled.

## V3.1 Bug Fixes
-   **Syntax Highlighting Fixed**: Updated the integration with `marked.js` to correctly support syntax highlighting for all languages (including Python) using `highlight.js`.
-   **Interactive Checkboxes**: You can now click checkboxes directly in the Preview pane, and it will update the source markdown text automatically.

## V3.0 Updates
-   **Line Numbers**: A verified line-number gutter on the left of the editor specifically for tracking code/text position.
-   **Checklists**: Support for GitHub Flavored Markdown (GFM) task lists (`- [ ] task`).
-   **Syntax Highlighting**: Code blocks in the preview are now colorized using `highlight.js` (GitHub Dark theme).

## V2.0 Features
### 1. Pitch Black Theme & UI
-   **Theme**: Deep black background (`#000000`) with high-contrast white text (`#ffffff`).
-   **Font**: Increased base font size to **16pt** for better readability.
-   **Split View**: The interface now shows the **Editor** on the left and a live **Markdown Preview** on the right.

### 2. Real-Time Markdown
-   Typing in the editor is immediately parsed and rendered as HTML in the preview pane.
-   Supports headers, lists, code blocks, blockquotes, and more (powered by `marked.js`).

### 3. File System Persistence
-   **Save to Disk**: You can now save your note to a physical `.md` file on your computer.
-   **Open File**: You can open existing text/markdown files into the editor.
-   **Cross-Browser**: This solves the "new browser" issue. You can save a file in Chrome and open it in Safari.

## V1.0 Initial Release
-   **Single Note Support**: Edit and store one note.
-   **Browser-Based**: Runs entirely in the browser (HTML/CSS/JS).
-   **Auto-Save**: Content saves to LocalStorage automatically.
-   **Design**: Minimalist interface.
