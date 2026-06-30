import { spawn } from "child_process";
import * as path from "path";

/**
 * Reveals the file in the OS-specific file manager (Finder / Explorer / File Manager).
 */
export function revealFile(filePath: string): void {
  if (process.platform === "darwin") {
    spawn("open", ["-R", filePath], {
      detached: true,
      stdio: "ignore"
    }).unref();
    return;
  }

  if (process.platform === "win32") {
    // Windows Explorer requires "/select,<path>" to select the file.
    spawn("explorer.exe", [`/select,${filePath}`], {
      detached: true,
      stdio: "ignore"
    }).unref();
    return;
  }

  // Linux or other POSIX: open the containing directory using xdg-open.
  spawn("xdg-open", [path.dirname(filePath)], {
    detached: true,
    stdio: "ignore"
  }).unref();
}
