# AGENTS.md

Guidance for AI coding agents working in this repository.

## The project in one paragraph

A VS Code extension that provides a custom read-only editor view (`packageInspector.viewer`) for inspecting binary package files (such as APK, AAB, IPA, EXE, VSIX, JAR, and others). It displays basic file metadata (name, size, timestamps, absolute path, SHA-256 hash) and extracts package-specific details: PE headers for Windows executables (`.exe`) and ZIP contents for ZIP-based formats (DEX counts, ABIs, manifest availability for `.apk` and `.aab`; App name, provisioning profile, Info.plist for `.ipa`; entry count for general ZIPs). It also offers utilities to reveal files in the OS file explorer, copy paths/hashes to the clipboard, and dynamically manage file extension associations.

## Commands

```bash
npm install      # Install dependencies
npm run compile  # Bundle the extension with esbuild to out/extension.js (development build)
npm run watch    # Rebuild in watch mode on changes
npm run package  # Production build with esbuild (minified, no sourcemaps)
```

`F5` in VS Code launches an Extension Development Host with the extension loaded.

## Architecture

### Component breakdown

1. **`src/extension.ts` — Entrypoint**
   - Registers the Custom Editor Provider (`PackageInspectorProvider`).
   - Registers extension commands (`packageInspector.openPreview`, `packageInspector.revealInFinder`, `packageInspector.addCurrentExtension`, `packageInspector.removeCurrentExtension`).

2. **`src/provider/PackageInspectorProvider.ts` — Custom Editor Provider**
   - Implements `vscode.CustomReadonlyEditorProvider` for the `packageInspector.viewer` view type.
   - Manages the webview lifecycle, rendering, configuration update listeners (to re-render on setting changes), and handles message passing from the webview (e.g., triggering quick copy actions, revealing files, adding/removing active extensions).

3. **`src/services/` — Core business logic**
   - [fileInfo.ts](file:///Users/kmshiori/Git/package-inspector/src/services/fileInfo.ts): Synthesizes basic file statistics (path, name, size, timestamps, SHA-256 hash) and coordinates deeper inspection via `packageDetector.ts`.
   - [packageDetector.ts](file:///Users/kmshiori/Git/package-inspector/src/services/packageDetector.ts): Parsers for specific formats. Includes `parsePeHeader()` (extracting architecture, subsystem, magic from Portable Executable headers) and `analyzeZip()` (opening zip files using `yauzl` to count entries and detect mobile app files/attributes like `AndroidManifest.xml`, DEX files, native ABIs, and provisioning profiles).
   - [hash.ts](file:///Users/kmshiori/Git/package-inspector/src/services/hash.ts): Computes file SHA-256 checksums if allowed by user settings (respects size limits unless forced).
   - [reveal.ts](file:///Users/kmshiori/Git/package-inspector/src/services/reveal.ts): Uses `child_process.spawn` to reveal files in the OS-specific file explorer (`open -R` on macOS, `explorer.exe /select,` on Windows, `xdg-open` on Linux).
   - [settings.ts](file:///Users/kmshiori/Git/package-inspector/src/services/settings.ts): Wraps reading and updating VS Code configuration (`packageInspector.extensions`).

4. **`src/webview/` — UI representation**
   - [html.ts](file:///Users/kmshiori/Git/package-inspector/src/webview/html.ts) / [styles.ts](file:///Users/kmshiori/Git/package-inspector/src/webview/styles.ts): Generate the raw HTML and CSS (tailored UI with layout, actions, metadata grid, format-specific details, and toggle actions) sent to the custom editor webview.

## Things easy to get wrong

- **WebView Security & CSP**: The webview uses a strict Content Security Policy (`cspSource`). Ensure script sources, styles, and other assets are loaded securely.
- **Yauzl Async / Auto-Close**: `yauzl` handles ZIP files using lazy/auto-close options. Keep in mind that directory and zip entry scanning must be done asynchronously and handles errors properly without leaking file handles.
- **Zero-Dependency Core / Native Utilities**:
  - PE header parsing reads bytes directly from the file via `fs.promises.open` and `fd.read`.
  - Revealing files uses native shell processes (`open`, `explorer.exe`, `xdg-open`) without heavy third-party packages.
- **Configuration Listeners**: The provider listens to configuration changes (`packageInspector`) and automatically calls `updateWebview()`. Do not trigger manual reloading of the webview for changes that are already covered by config listeners.
