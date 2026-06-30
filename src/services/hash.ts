import * as vscode from "vscode";
import * as crypto from "crypto";
import * as fs from "fs";

/**
 * Calculates the SHA-256 hash of a file if enabled and under the size limit.
 */
export async function getFileSha256(filePath: string, fileSize: number, force?: boolean): Promise<string> {
  const config = vscode.workspace.getConfiguration("packageInspector");
  const calculate = config.get<boolean>("calculateSha256", true);
  const maxMb = config.get<number>("maxHashFileSizeMb", 512);

  if (!calculate && !force) {
    return "Disabled in settings";
  }

  const maxBytes = maxMb * 1024 * 1024;
  if (fileSize > maxBytes && !force) {
    return `Skipped (File size exceeds limit of ${maxMb} MB)`;
  }

  return new Promise((resolve) => {
    try {
      const hash = crypto.createHash("sha256");
      const stream = fs.createReadStream(filePath);

      stream.on("data", (data) => {
        hash.update(data);
      });

      stream.on("end", () => {
        resolve(hash.digest("hex"));
      });

      stream.on("error", (err) => {
        resolve(`Error calculating hash: ${err.message}`);
      });
    } catch (err: any) {
      resolve(`Error calculating hash: ${err?.message || err}`);
    }
  });
}
