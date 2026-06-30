import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { getFileSha256 } from "./hash";
import { parsePeHeader, analyzeZip, PeInfo, ZipAnalysis } from "./packageDetector";

export interface FileInfo {
  name: string;
  extension: string;
  typeLabel: string;
  size: number;
  modified: Date;
  created: Date;
  absolutePath: string;
  sha256: string;
  peInfo?: PeInfo;
  zipAnalysis?: ZipAnalysis;
}

export function getTypeLabel(ext: string): string {
  switch (ext) {
    case "apk":
      return "Android APK";
    case "aab":
      return "Android App Bundle";
    case "ipa":
      return "iOS App Archive";
    case "exe":
      return "Windows Executable";
    case "bin":
      return "Binary File";
    case "dmg":
      return "macOS Disk Image";
    case "pkg":
      return "macOS Installer Package";
    case "vsix":
      return "VS Code Extension";
    case "crx":
      return "Google Chrome Extension";
    case "xpi":
      return "Firefox Extension";
    case "jar":
      return "Java Archive";
    case "war":
      return "Web Application Archive";
    case "ear":
      return "Enterprise Archive";
    case "msi":
      return "Windows Installer Package";
    case "msix":
      return "Windows App Package";
    case "appx":
      return "Windows App Package (Legacy)";
    case "deb":
      return "Debian Software Package";
    case "rpm":
      return "Red Hat Package";
    case "appimage":
      return "Linux AppImage";
    case "snap":
      return "Linux Snap Package";
    case "flatpak":
      return "Linux Flatpak Package";
    case "whl":
      return "Python Wheel Package";
    case "tgz":
      return "Gzipped Tar Archive";
    case "phar":
      return "PHP Archive";
    case "gem":
      return "Ruby Gem Package";
    case "wasm":
      return "WebAssembly Binary";
    default:
      return `${ext.toUpperCase()} File`;
  }
}

/**
 * Collects file stats, computes checksum, and parses binary package metadata.
 */
export async function getFileInfo(uri: vscode.Uri, forceHash?: boolean): Promise<FileInfo> {
  const filePath = uri.fsPath;
  const stat = await fs.promises.stat(filePath);
  const ext = path.extname(filePath).replace(/^\./, "").toLowerCase();

  const name = path.basename(filePath);
  const typeLabel = getTypeLabel(ext);
  const size = stat.size;
  const modified = stat.mtime;
  const created = stat.birthtime;

  // Run hash calculation
  const sha256 = await getFileSha256(filePath, size, forceHash);

  let peInfo: PeInfo | undefined;
  let zipAnalysis: ZipAnalysis | undefined;

  try {
    if (ext === "exe") {
      peInfo = await parsePeHeader(filePath);
    } else if (["apk", "aab", "ipa", "vsix", "xpi", "jar", "war", "ear", "whl", "msix", "appx"].includes(ext)) {
      zipAnalysis = await analyzeZip(filePath, ext);
    }
  } catch (err) {
    console.error("Failed to parse package metadata:", err);
  }

  return {
    name,
    extension: ext ? `.${ext}` : "",
    typeLabel,
    size,
    modified,
    created,
    absolutePath: filePath,
    sha256,
    peInfo,
    zipAnalysis
  };
}
