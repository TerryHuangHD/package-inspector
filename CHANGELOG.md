# Change Log

All notable changes to the **Package Inspector** extension are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2026-06-30

### Added

- Custom read-only viewer (`packageInspector.viewer`) for binary package files.
- File metadata: type label, size, created/modified dates, absolute path, and SHA-256 checksum.
- Format-specific inspection:
  - **Windows `.exe`** — PE header architecture, PE magic, and subsystem.
  - **Android `.apk`** — manifest presence, DEX count, native ABIs, and `assets/`/`res/` detection.
  - **Android `.aab`** — feature modules, DEX count, and native ABIs.
  - **iOS `.ipa`** — app name, `Info.plist`, embedded provisioning profile, and `PkgInfo`.
  - **Zip-based archives** (`.vsix`, `.xpi`, `.jar`, `.war`, `.ear`, `.whl`, `.msix`, `.appx`) — entry count and contents overview.
- Quick actions: reveal in Finder/Explorer and copy path, name, or SHA-256 hash.
- Configurable file associations that can be added or removed from within the viewer.
