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
