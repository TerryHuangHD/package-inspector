# Copy as File Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Copy as File" button next to "Reveal in Finder" that copies the inspected package file itself onto the OS clipboard, so the user can paste it (Cmd/Ctrl+V) into Finder or a native app.

**Architecture:** A new zero-dependency service (`clipboardFile.ts`) wraps a platform-native clipboard command via `child_process.spawn`, mirroring the existing `reveal.ts`. The webview gains a button that posts a `copyFile` message; the provider handles that message by calling the service and showing a result toast.

**Tech Stack:** TypeScript, VS Code Extension API (`^1.90.0`), esbuild bundler, `child_process` (Node builtin), `osascript` (macOS) / PowerShell `Set-Clipboard` (Windows) / `wl-copy`/`xclip` (Linux). Unit tests run with Node's built-in test runner (`node --test`) on esbuild-bundled output — no new runtime or test dependencies.

## Global Constraints

- **Zero new third-party dependencies.** Use only Node builtins and native OS commands, matching `src/services/reveal.ts`.
- **Spawn pattern:** use `child_process.spawn` with an args array (never a shell string with an interpolated path) so file paths cannot cause shell injection. The macOS/Windows branches must not use a shell.
- **UI language is English** to match existing buttons ("Reveal in Finder", "Open with Default Editor").
- **The new button uses the `secondary` CSS class** so "Reveal in Finder" stays the primary CTA, and is placed immediately to the right of the Reveal button inside the existing `.actions` block.
- **The large package emoji icon is not made clickable** (out of scope).
- **VS Code engine floor:** `^1.90.0` (already in `package.json`).
- **`docs/` is gitignored** — commit plan/spec/doc files with an explicit `git add <path>` (force) as needed.
- **Paste shortcut in user-facing copy is platform-aware:** `Cmd+V` on `darwin`, `Ctrl+V` elsewhere.

---

### Task 1: `clipboardFile` service (with unit-tested path escaping)

**Files:**
- Create: `src/services/clipboardFile.ts`
- Create: `src/services/clipboardFile.test.ts`
- Modify: `package.json:38-43` (add a `test:unit` script)
- Modify: `.gitignore` (ignore the test build dir)

**Interfaces:**
- Consumes: nothing (leaf module; imports only `child_process`).
- Produces:
  - `escapeAppleScriptString(value: string): string` — escapes `\` then `"` for an AppleScript double-quoted literal.
  - `copyFileToClipboard(filePath: string): Promise<void>` — resolves when the file is placed on the OS clipboard; rejects on spawn error, non-zero exit, or unsupported platform with no tool.

- [ ] **Step 1: Add the test build dir to `.gitignore`**

Append this line to `.gitignore` (under the "Build output" section, after `out/`):

```
out-tests/
```

- [ ] **Step 2: Add the `test:unit` script to `package.json`**

In the `"scripts"` block (currently `package.json:38-43`), add a `test:unit` entry so the block reads:

```json
  "scripts": {
    "vscode:prepublish": "npm run package",
    "compile": "node esbuild.js",
    "watch": "node esbuild.js --watch",
    "package": "node esbuild.js --production",
    "test:unit": "esbuild src/services/clipboardFile.test.ts --bundle --platform=node --format=cjs --external:vscode --outfile=out-tests/clipboardFile.test.cjs && node --test out-tests/clipboardFile.test.cjs"
  },
```

(`--platform=node` makes esbuild treat `node:test`, `node:assert`, and `child_process` as external builtins, so they are required at runtime by Node, not bundled.)

- [ ] **Step 3: Write the failing test**

Create `src/services/clipboardFile.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeAppleScriptString } from "./clipboardFile";

test("leaves a normal path untouched", () => {
  assert.equal(escapeAppleScriptString("/Users/me/app.apk"), "/Users/me/app.apk");
});

test("escapes a double quote", () => {
  assert.equal(escapeAppleScriptString('a"b'), 'a\\"b');
});

test("escapes a backslash", () => {
  assert.equal(escapeAppleScriptString("a\\b"), "a\\\\b");
});

test("escapes backslash before quote (order matters)", () => {
  // input: a \ " b   ->   a \\ \" b
  assert.equal(escapeAppleScriptString('a\\"b'), 'a\\\\\\"b');
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npm run test:unit`
Expected: esbuild fails to resolve `escapeAppleScriptString` / the file `./clipboardFile` (the implementation does not exist yet), so the command exits non-zero before any test passes.

- [ ] **Step 5: Write the implementation**

Create `src/services/clipboardFile.ts`:

```ts
import { spawn } from "child_process";

/**
 * Escapes a string for safe embedding inside an AppleScript double-quoted
 * string literal. Backslashes must be escaped before quotes so an existing
 * backslash-quote sequence is handled correctly.
 */
export function escapeAppleScriptString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * Copies the file itself (not its path text) onto the OS clipboard, so the
 * user can paste it with Cmd/Ctrl+V into Finder or another native app.
 *
 * Mirrors the native, zero-dependency approach of `reveal.ts`.
 * Rejects on spawn error, non-zero exit, or (Linux) when no clipboard tool
 * is available — the caller decides how to surface or fall back.
 */
export function copyFileToClipboard(filePath: string): Promise<void> {
  if (process.platform === "darwin") {
    const script = `set the clipboard to POSIX file "${escapeAppleScriptString(filePath)}"`;
    return runToCompletion("osascript", ["-e", script]);
  }

  if (process.platform === "win32") {
    // -LiteralPath copies the file object (a FileDropList) so Explorer's
    // Ctrl+V pastes the file rather than its path text. Single quotes are
    // PowerShell literal-string delimiters; escape a literal quote by doubling.
    const psLiteral = filePath.replace(/'/g, "''");
    return runToCompletion("powershell", [
      "-NoProfile",
      "-Command",
      `Set-Clipboard -LiteralPath '${psLiteral}'`,
    ]);
  }

  // Linux / other POSIX: best effort. Put a file:// URI on the clipboard as
  // text/uri-list via wl-copy (Wayland) or xclip (X11), whichever exists.
  return copyFileToClipboardLinux(filePath);
}

function copyFileToClipboardLinux(filePath: string): Promise<void> {
  const uri = `file://${filePath}`;
  // wl-copy accepts the payload as an argument (no shell needed).
  return runToCompletion("wl-copy", ["--type", "text/uri-list", uri]).catch(() =>
    // Fall back to xclip, feeding the URI via stdin.
    runWithStdin("xclip", ["-selection", "clipboard", "-t", "text/uri-list"], uri)
  );
}

function runToCompletion(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "ignore" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });
}

function runWithStdin(command: string, args: string[], input: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["pipe", "ignore", "ignore"] });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
    child.stdin.end(input);
  });
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm run test:unit`
Expected: PASS — `# pass 4`, `# fail 0`.

- [ ] **Step 7: Verify the bundle still compiles**

Run: `npm run compile`
Expected: esbuild completes with no errors (exit 0).

- [ ] **Step 8: Manually verify the real macOS clipboard primitive**

This confirms `copyFileToClipboard` actually places a file on the pasteboard
(the bundled service is `child_process`-only, so it is node-runnable in
isolation).

Run:

```bash
npx esbuild src/services/clipboardFile.ts --bundle --platform=node --format=cjs --external:vscode --outfile=out-tests/clipboardFile.cjs && \
node -e "require('./out-tests/clipboardFile.cjs').copyFileToClipboard(process.cwd()+'/package.json').then(()=>console.log('ok'))" && \
osascript -e 'clipboard info'
```

Expected: prints `ok`, then `clipboard info` output contains `«class furl»` (a file reference is on the clipboard). On a non-macOS box, skip this step.

- [ ] **Step 9: Commit**

```bash
git add src/services/clipboardFile.ts src/services/clipboardFile.test.ts package.json .gitignore
git commit -m "feat: add clipboardFile service to copy a file to the OS clipboard"
```

---

### Task 2: "Copy as File" button in the webview

**Files:**
- Modify: `src/webview/html.ts:287-294` (the `.actions` block)

**Interfaces:**
- Consumes: the existing webview click handler at `src/webview/html.ts:317-324`, which posts `{ command }` for any `button[data-command]`. The new button's `data-command="copyFile"` is delivered to the provider with no script changes.
- Produces: a `copyFile` webview message (handled in Task 3).

- [ ] **Step 1: Add the button after "Reveal in Finder"**

In `src/webview/html.ts`, the `.actions` block currently reads:

```ts
      <div class="actions">
        <button class="primary" data-command="revealInFinder">
          <span style="font-size: 16px;">📂</span> ${escapeHtml(revealLabel)}
        </button>
        <button class="secondary" data-command="openAnyway">
          Open with Default Editor
        </button>
      </div>
```

Replace it with (the new button sits immediately to the right of Reveal):

```ts
      <div class="actions">
        <button class="primary" data-command="revealInFinder">
          <span style="font-size: 16px;">📂</span> ${escapeHtml(revealLabel)}
        </button>
        <button class="secondary" data-command="copyFile" title="Copy file to clipboard — then paste it into Finder or another app">
          <span style="font-size: 16px;">📎</span> Copy as File
        </button>
        <button class="secondary" data-command="openAnyway">
          Open with Default Editor
        </button>
      </div>
```

- [ ] **Step 2: Verify the bundle compiles and the button is present**

Run: `npm run compile`
Expected: exit 0.

Run: `grep -c 'data-command="copyFile"' out/extension.js`
Expected: prints `1` (the button string is bundled into the output).

- [ ] **Step 3: Commit**

```bash
git add src/webview/html.ts
git commit -m "feat: add Copy as File button next to Reveal in Finder"
```

---

### Task 3: Wire the `copyFile` message in the provider (+ end-to-end verification)

**Files:**
- Modify: `src/provider/PackageInspectorProvider.ts:1-6` (import)
- Modify: `src/provider/PackageInspectorProvider.ts:70-122` (message switch)

**Interfaces:**
- Consumes: `copyFileToClipboard(filePath: string): Promise<void>` from Task 1; the `copyFile` message from Task 2; `uri.fsPath` already in scope in `resolveCustomEditor`.
- Produces: user-facing behavior (a success/warn/error toast). No new exports.

- [ ] **Step 1: Import the service**

Add to the imports at the top of `src/provider/PackageInspectorProvider.ts` (after the `reveal` import on line 4):

```ts
import { copyFileToClipboard } from "../services/clipboardFile";
```

- [ ] **Step 2: Add the `copyFile` case to the message switch**

In the `webviewPanel.webview.onDidReceiveMessage` switch, add a new case (place it right after the `revealInFinder` case, before `copyPath`):

```ts
        case "copyFile":
          try {
            await copyFileToClipboard(uri.fsPath);
            const pasteKey = process.platform === "darwin" ? "Cmd+V" : "Ctrl+V";
            vscode.window.showInformationMessage(
              `File copied — paste with ${pasteKey} in Finder, Slack, Mail, …`
            );
          } catch (err) {
            if (process.platform === "linux") {
              await vscode.env.clipboard.writeText(uri.fsPath);
              vscode.window.showWarningMessage(
                "No clipboard file tool (wl-copy/xclip) found — copied the file path as text instead."
              );
            } else {
              const reason = err instanceof Error ? err.message : String(err);
              vscode.window.showErrorMessage(`Could not copy file to clipboard: ${reason}`);
            }
          }
          break;
```

- [ ] **Step 3: Verify the bundle compiles**

Run: `npm run compile`
Expected: exit 0, no TypeScript errors.

- [ ] **Step 4: End-to-end manual verification (macOS)**

1. Press `F5` in VS Code to launch the Extension Development Host.
2. Open any supported package file (e.g. a `.vsix` or `.apk`) so the Package Inspector view renders.
3. Click **📎 Copy as File**. Expect the toast: `File copied — paste with Cmd+V in Finder, Slack, Mail, …`.
4. Switch to Finder, open any folder, press `Cmd+V`. Expect a **copy of the file** to appear (not a text file containing the path).
5. Switch to Mail or Slack, press `Cmd+V` in a message. Expect the file to attach.

- [ ] **Step 5: Verify a path with special characters**

1. In a scratch folder, create a file whose name contains a space and a double quote, e.g. `my "weird" app.vsix` (the extension must be a registered type).
2. Open it in the Package Inspector, click **Copy as File**, and `Cmd+V` in Finder.
3. Expect the correct file to paste with no AppleScript error toast (this exercises `escapeAppleScriptString`).

- [ ] **Step 6: Commit**

```bash
git add src/provider/PackageInspectorProvider.ts
git commit -m "feat: handle copyFile message to copy the package file to the clipboard"
```

---

## Notes for the implementer

- If `npm run test:unit` reports `esbuild: command not found`, run `npm install` first (esbuild is a devDependency).
- The `out-tests/` directory is disposable build output (gitignored); delete it freely.
- Do not add the button to `package.json` `commands`/`menus` — it lives only in the webview and is dispatched via `postMessage`, consistent with the other in-webview buttons (`copyPath`, `copyHash`, etc.).
