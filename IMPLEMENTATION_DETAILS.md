# Implementation Details

## Overview
This application is designed as a static client-side web application. It relies entirely on standard web technologies (HTML, CSS, JavaScript) and uses the browser's `localStorage` API for data persistence.

## Architecture

### 1. HTML Structure (`index.html`)
The application uses a simple semantic HTML5 structure:
-   **Header**: Contains the application title and the save status indicator.
-   **Main**: Hosts the full-screen implementation of the `<textarea>` for note editing.
-   **Footer**: Displays a small privacy notice.

### 2. Styling (`style.css`)
-   **CSS Variables**: Used for theming to easily support both light and dark modes.
-   **Dark Mode**: Implements `@media (prefers-color-scheme: dark)` to automatically switch colors based on the user's OS settings.
-   **Font**: Uses 'Inter' from Google Fonts for a clean, modern look.
-   **Responsiveness**: Flexbox is used to ensure the layout works on all screen sizes.

### 3. Logic (`app.js`)
-   **Storage Key**: Data is saved under the key `online-notes-data`.
-   **Debouncing**: To prevent excessive writes to local storage, the save operation is debounced by 1 second. This means the save function only triggers after the user has stopped typing for 1 second.
-   **Event Listeners**:
    -   `input`: Detected on the textarea to trigger the save process and update the status to "Saving...".
    -   `window` load: Triggers `loadNote()` to retrieve data from local storage when the page is opened.

## Data Persistence
The `localStorage` API provides a simple key-value store. This allows the data to persist even if the browser window is closed or the computer is shut down. Note that clearing the browser's cache/cookies "for all time" might clear this storage depending on the browser implementation.

## Security & Privacy
Since there is no backend, there is no risk of data interception in transit (once the page is loaded). However, data is stored in plain text in the browser's storage, so anyone with physical access to the unlocked browser could potentially read the note.
