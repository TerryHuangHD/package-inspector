# Copy as File — clipboard handoff for package files

Date: 2026-06-30
Status: Approved (design)

## Problem

In VS Code / Antigravity, a user inspecting a package file in the Package
Inspector view cannot get that file into another application the way Finder
allows by dragging. They want to drop the inspected file into Finder or a
native app (Slack, Mail, an emulator, another editor).

## Key constraint (why we are not doing literal drag-out)

Native OS-level file drag-out from a webview is **not possible** through the
VS Code extension API:

- A webview is a sandboxed iframe; the extension interacts with it only via
  `postMessage`.
- The capability that drags a real file to an external app is Electron's
  `webContents.startDrag()`, which runs in the renderer/main process and is
  **not exposed** to extensions. There is no extension-level API to initiate a
  native file drag from a webview.
- HTML5 drag (`DataTransfer`, `DownloadURL`, `text/uri-list`) works inside the
  webview but is blocked from delivering a file to a native external app under
  the Electron sandbox.
- The only VS Code component that can drag files to external apps is the core
  file Explorer, and that behavior is not extensible.

Therefore the literal "drag the icon to another app" feature is out of scope —
it cannot be built.

## Goal

Provide a one-click "copy the file to the OS clipboard" action, so the user
pastes the file with Cmd+V (Ctrl+V) into Finder or any native app that accepts
a pasted file. The chosen target apps (Finder, and native apps such as
Slack / Mail / IDEs) all accept Cmd+V paste, so this fully covers the intended
workflow.

Verified primitive: on macOS, `osascript -e 'set the clipboard to POSIX file
"<path>"'` puts a `«class furl»` (file URL reference) on the pasteboard — the
type Finder's paste treats as "paste the file."

## Approach

Add a "Copy as File" button to the existing actions row, immediately to the
right of the "Reveal in Finder" button. Clicking it copies the inspected file
itself (not its path text) onto the system clipboard. The user then pastes it
into the target app.

## Components

### 1. New service: `src/services/clipboardFile.ts`

`copyFileToClipboard(fsPath: string): Promise<void>` — mirrors the existing
[reveal.ts](../../../src/services/reveal.ts) pattern: a platform-specific
native command run via `child_process.spawn`, zero third-party dependencies.

- **macOS** (`darwin`): `osascript -e 'set the clipboard to POSIX file
  "<path>"'`. The path is escaped for the AppleScript string literal:
  backslash `\` → `\\` and double-quote `"` → `\"`, so paths with special
  characters do not break the script. Args are passed as a spawn argument
  array (no shell), so no shell-quoting concerns.
- **Windows** (`win32`): PowerShell `Set-Clipboard -Path "<path>"`, which puts
  the file on the clipboard so Explorer's Ctrl+V pastes the file.
- **Linux**: best-effort. Try `wl-copy` / `xclip` with a `text/uri-list`
  payload (`file://<path>`). If no such tool is available, fall back to copying
  the path as text and signal that a fallback occurred so the provider can
  inform the user. (User is on macOS; Linux is graceful-degrade, not a
  first-class target.)
- **Error handling**: reject on spawn error or non-zero exit code; never leak
  a process handle. The provider surfaces failures via
  `vscode.window.showErrorMessage`.

### 2. `src/webview/html.ts`

In the `.actions` block, add a button immediately after the "Reveal in Finder"
button:

```html
<button class="secondary" data-command="copyFile" title="Copy file to clipboard — paste with Cmd+V in Finder or another app">
  <span style="font-size: 16px;">📎</span> Copy as File
</button>
```

- Uses the `secondary` class so "Reveal in Finder" remains the primary CTA.
- Label: `Copy as File` (English, matching the rest of the UI).
- The large package emoji icon is unchanged (no click-to-copy on the icon, to
  avoid accidental triggers — the button is sufficient).
- The button is shown on all platforms; behavior degrades on Linux per the
  service.

### 3. `src/provider/PackageInspectorProvider.ts`

Add a `case "copyFile"` to the `onDidReceiveMessage` switch:

- Call `copyFileToClipboard(uri.fsPath)`.
- On success: `vscode.window.showInformationMessage("File copied — paste with
  <Cmd+V|Ctrl+V> in Finder, Slack, Mail, …")`, choosing the paste shortcut by
  platform (Cmd+V on macOS, Ctrl+V elsewhere).
- On failure: `vscode.window.showErrorMessage(...)` with the error reason.

No changes to the configuration-listener / `updateWebview` flow are needed.

## Data flow

1. User clicks "Copy as File" in the webview.
2. Webview script posts `{ command: "copyFile" }` to the extension host.
3. Provider calls `copyFileToClipboard(uri.fsPath)`.
4. Service spawns the platform-native clipboard command.
5. Provider shows a success or error toast.
6. User pastes (Cmd/Ctrl+V) the file into the target app.

## Testing / verification

The repository currently has no automated test framework. Verification plan:

- Clipboard primitive already verified on macOS (`«class furl»` present after
  the `osascript` call).
- Manual end-to-end: `npm run compile` → F5 (Extension Development Host) →
  open a package file → click "Copy as File" → Cmd+V in Finder (expect a file
  copy) and in a native app such as Mail/Slack (expect an attachment).
- Verify a path containing spaces and a double-quote character is handled
  correctly (escaping).

## Out of scope (YAGNI)

- Real native drag-out (not possible via the extension API).
- Making the large icon clickable for copy.
- A dedicated sidebar TreeView to inherit Explorer-style drag.
- First-class Linux clipboard-file support beyond best-effort.
