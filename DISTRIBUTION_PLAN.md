# Distribution Strategy Plan (Desktop & Mobile)

## Executive Summary
**Goal**: Convert the current browser-based "Online Notes" into a standalone, installable application for non-technical users on all major platforms (Windows, macOS, Linux, iOS, Android).

**Current State**: Static Web App (HTML/CSS/JS) relying on Browser APIs (File System Access).
**Desired State**: "Click-to-install" executables (`.exe`, `.dmg`, `.apk`) with native file system access.

---

## Gap Analysis

### 1. Architecture & Capabilities
| Feature | Current (Web) | Required (Desktop) | Required (Mobile) | Gap / Action Item |
| :--- | :--- | :--- | :--- | :--- |
| **Runtime** | Browser (Chrome/Safari) | Electron or Tauri | Capacitor or React Native | Need to wrap the web code in a native container. |
| **File I/O** | `window.showSaveFilePicker` (Browser Native) | Node.js `fs` + `dialog` | Native Filesystem API | **Critical**: Abstract I/O logic. Current `app.js` direct API calls won't work in Electron/Mobile. Need an Adapter pattern. |
| **Updates** | Refresh Page | Auto-Updater | App Store Updates | Need to implement an update checking mechanism or rely on Store updates. |
| **Offline** | Works if cached / PWA | Native Offline | Native Offline | Already partially solved, but bundling ensures 100% offline availability. |

### 2. User Experience (UX)
| Feature | Current (Web) | Required (Desktop) | Required (Mobile) | Gap / Action Item |
| :--- | :--- | :--- | :--- | :--- |
| **Installation** | "Save as Bookmark" or PWA | Installer Wizard | App Store Download | Need build tools to generate installers. |
| **Menu System** | In-page HTML buttons | OS Native Menus (File, Edit) | Touch Interfaces / Gestures | **Desktop**: Move "File > Open" to macOS menubar. **Mobile**: Optimize buttons for touch (min 44px targets). |
| **Window Mgmt** | Browser Tabs | Multi-window support | Stack Navigation | Current single-page implementation is fine, but Mobile needs careful layout testing for the "Split View". |

---

## Technical Recommendation

### Desktop (Windows, macOS, Linux)
**Technology**: **Electron** (Recommended for simplicity) or **Tauri** (Recommended for file size).
*   **Why Electron**: It bundles Chromium, ensuring your app looks *exactly* the same as it does in Chrome now. It has a massive community and easy access to Node.js for file saving.
*   **Trade-off**: Larger file size (~80MB installer), but easier for a web developer to maintain.

### Mobile (iOS, Android)
**Technology**: **Capacitor** (by Ionic).
*   **Why**: It allows you to take your existing `index.html` / `app.js` and wrap it into an iOS/Android project. It provides a Javascript Plugin (`@capacitor/filesystem`) to replace the browser logic.
*   **Trade-off**: Managing Apple/Google signing certificates is complex (required for distribution).

---

## Implementation Roadmap

### Phase 1: Abstraction Layer (Refactoring)
*   **Goal**: Make `app.js` unaware of *where* it is running.
*   **Task**: Create an `IOAdapter` interface.
    *   `IOAdapter.saveFile(content, filename)`
    *   `IOAdapter.openFile()`
*   **Implementations**:
    *   `WebAdapter`: Uses the existing `window.showSaveFilePicker`.
    *   `ElectronAdapter`: Uses `ipcRenderer` to talk to Main Process (Node `fs`).
    *   `CapacitorAdapter`: Uses `Capacitor.Plugins.Filesystem`.

### Phase 2: Desktop Build (Electron)
*   **Goal**: Generate `.dmg` and `.exe`.
*   **Steps**:
    1.  Initialize `npm` project.
    2.  Install `electron` and `electron-builder`.
    3.  Create `main.js` (Electron entry point) to create the window and handle File I/O IPC events.
    4.  Configure `electron-builder` to sign code (for macOS transparency) and build installers.

### Phase 3: Mobile Build (Capacitor)
*   **Goal**: Generate `.apk` and iOS Archive.
*   **Steps**:
    1.  Install `@capacitor/core` and `@capacitor/cli`.
    2.  Initialize Capacitor: `npx cap init`.
    3.  Add platforms: `npx cap add android`, `npx cap add ios`.
    4.  Refactor UI for Mobile:
        *   The "Split View" (50/50) is bad for phones.
        *   Implement a "Tab" switcher or "Edit Mode vs Read Mode" toggle for small screens.

---

## Summary for Non-Tech Usage
To achieve the goal of "Non-tech person usage":
1.  **Distribution**: You cannot ask them to run `git clone`. You must provide a **Download Link** for a `.zip` or Installer.
2.  **Code Signing**: Operating Systems (especially macOS and Windows) aggressively block unsigned apps ("Publisher Unknown"). You will likely need to:
    *   Pay Apple ($99/yr) for a Developer Account.
    *   Pay Microsoft (~$19-99) or use an EV Cert (expensive) to avoid "SmartScreen" warnings.
    *   *Alternative*: Instruct users on how to bypass warnings (bad UX, but free).

## Next Steps
1.  Refactor `app.js` to separate UI logic from File Storage logic.
2.  Set up an **Electron** wrapper to prove the "Single Executable" concept quickly.
