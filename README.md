# Package Inspector

A VS Code extension that previews binary package files — APK, AAB, IPA, EXE, and many more — right inside the editor, with rich metadata and quick Finder/Explorer actions. No need to unzip or run external tools just to see what a package contains.

## Features

- **Custom read-only viewer** for binary package files, opened straight from the explorer or editor.
- **File metadata** at a glance: type label, size, created/modified dates, absolute path, and SHA-256 checksum.
- **Deep inspection** of common package formats:
  - **Windows `.exe`** — parses the PE header to show architecture (x86 / x64 / ARM / ARM64), PE magic (PE32 / PE32+), and subsystem (GUI, console, EFI, etc.).
  - **Android `.apk`** — manifest presence, DEX count, native ABIs, and whether `assets/` and `res/` are present.
  - **Android `.aab`** — feature modules, DEX count, and native ABIs.
  - **iOS `.ipa`** — app name, `Info.plist`, embedded provisioning profile, and `PkgInfo`.
  - **Zip-based archives** (`.vsix`, `.xpi`, `.jar`, `.war`, `.ear`, `.whl`, `.msix`, `.appx`) — entry count and contents overview.
- **Quick actions** — reveal the file in Finder/Explorer, and copy its path, name, or SHA-256 hash to the clipboard.
- **Configurable file associations** — add or remove the extensions that open in the viewer without leaving the editor.

## Supported file types

| Category | Extensions |
| --- | --- |
| Mobile | `.apk`, `.aab`, `.ipa` |
| Windows | `.exe`, `.msi`, `.msix`, `.appx` |
| macOS | `.dmg`, `.pkg` |
| Linux | `.deb`, `.rpm`, `.AppImage`, `.snap`, `.flatpak` |
| Browser / Editor extensions | `.vsix`, `.crx`, `.xpi` |
| Java | `.jar`, `.war`, `.ear` |
| Other | `.bin`, `.whl`, `.tgz`, `.phar`, `.gem`, `.wasm` |

## Usage

- Click a supported file in the Explorer to open it in the Package Inspector viewer.
- Right-click a file and choose **Open with Package Inspector**.
- From the viewer toolbar, use **Reveal in Finder** or the copy buttons for path, name, and hash.

## Commands

| Command | Description |
| --- | --- |
| `Open with Package Inspector` | Open the selected file in the viewer |
| `Reveal in Finder` | Show the file in Finder/Explorer |
| `Add Current Extension to Package Inspector` | Register the current file's extension with the viewer |
| `Remove Current Extension from Package Inspector` | Unregister the current file's extension |

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `packageInspector.extensions` | (full list above) | File extensions that should open with Package Inspector |
| `packageInspector.calculateSha256` | `true` | Calculate and display the SHA-256 hash for previewed files |
| `packageInspector.maxHashFileSizeMb` | `50` | Maximum file size (MB) for automatic SHA-256 calculation |
| `packageInspector.defaultOpenMode` | `preview` | Preferred behavior for supported binary package files |

## Development

```bash
npm install      # install dependencies
npm run compile  # bundle the extension with esbuild
npm run watch    # rebuild on change
```

Press `F5` in VS Code to launch an Extension Development Host with the extension loaded.
