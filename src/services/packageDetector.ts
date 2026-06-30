import * as fs from "fs";
import * as yauzl from "yauzl";

export interface PeInfo {
  isPe: boolean;
  architecture?: string;
  subsystem?: string;
  magic?: string;
}

export interface ZipAnalysis {
  isZip: boolean;
  entriesCount: number;
  apkInfo?: {
    hasManifest: boolean;
    dexCount: number;
    abis: string[];
    hasAssets: boolean;
    hasRes: boolean;
  };
  aabInfo?: {
    modules: string[];
    dexCount: number;
    abis: string[];
  };
  ipaInfo?: {
    appName?: string;
    hasInfoPlist: boolean;
    hasProvisioningProfile: boolean;
    hasPkgInfo: boolean;
  };
}

/**
 * Parses PE header of a Windows executable.
 */
export async function parsePeHeader(filePath: string): Promise<PeInfo> {
  let fd: fs.promises.FileHandle | null = null;
  try {
    fd = await fs.promises.open(filePath, "r");
    // Read the first 1024 bytes (headers are typically small and at the start)
    const { buffer } = await fd.read(Buffer.alloc(1024), 0, 1024, 0);

    // Check DOS Magic 'MZ'
    if (buffer.readUInt16LE(0) !== 0x5A4D) {
      return { isPe: false };
    }

    // Get PE header offset
    const peOffset = buffer.readUInt32LE(0x3C);
    if (peOffset + 94 > buffer.length) {
      return { isPe: false };
    }

    // Check PE Signature 'PE\0\0'
    if (buffer.readUInt32LE(peOffset) !== 0x00004550) {
      return { isPe: false };
    }

    // Machine field (at peOffset + 4)
    const machine = buffer.readUInt16LE(peOffset + 4);
    let architecture = "Unknown";
    switch (machine) {
      case 0x014c:
        architecture = "x86 (32-bit)";
        break;
      case 0x8664:
        architecture = "x64 (64-bit)";
        break;
      case 0xaa64:
        architecture = "ARM64";
        break;
      case 0x01c4:
        architecture = "ARM (32-bit)";
        break;
    }

    // Optional Header Magic (at peOffset + 24)
    const magicNum = buffer.readUInt16LE(peOffset + 24);
    let magic = "Unknown";
    if (magicNum === 0x10b) {
      magic = "PE32 (32-bit)";
    } else if (magicNum === 0x20b) {
      magic = "PE32+ (64-bit)";
    }

    // Subsystem field (at peOffset + 92)
    const subsystemNum = buffer.readUInt16LE(peOffset + 92);
    let subsystem = "Unknown";
    switch (subsystemNum) {
      case 1:
        subsystem = "Native (Driver)";
        break;
      case 2:
        subsystem = "Windows GUI (Graphical)";
        break;
      case 3:
        subsystem = "Windows CUI (Console)";
        break;
      case 7:
        subsystem = "POSIX CUI";
        break;
      case 9:
        subsystem = "Windows CE GUI";
        break;
      case 10:
        subsystem = "EFI Application";
        break;
      case 11:
        subsystem = "EFI Boot Service Driver";
        break;
      case 12:
        subsystem = "EFI Runtime Driver";
        break;
      case 13:
        subsystem = "EFI ROM";
        break;
      case 14:
        subsystem = "Xbox";
        break;
      case 16:
        subsystem = "Windows Boot Application";
        break;
    }

    return {
      isPe: true,
      architecture,
      subsystem,
      magic
    };
  } catch {
    return { isPe: false };
  } finally {
    if (fd) {
      await fd.close();
    }
  }
}

/**
 * Iterates through zip file entries to gather metadata for APK, AAB, IPA.
 */
export function analyzeZip(filePath: string, ext: string): Promise<ZipAnalysis> {
  return new Promise((resolve) => {
    yauzl.open(filePath, { lazyEntries: true, autoClose: true }, (err, zipfile) => {
      if (err || !zipfile) {
        resolve({ isZip: false, entriesCount: 0 });
        return;
      }

      let entriesCount = 0;

      // APK properties
      let apkHasManifest = false;
      let apkDexCount = 0;
      const apkAbis = new Set<string>();
      let apkHasAssets = false;
      let apkHasRes = false;

      // AAB properties
      const aabModules = new Set<string>();
      let aabDexCount = 0;
      const aabAbis = new Set<string>();

      // IPA properties
      let ipaAppName: string | undefined = undefined;
      let ipaHasInfoPlist = false;
      let ipaHasProvision = false;
      let ipaHasPkgInfo = false;

      zipfile.readEntry();

      zipfile.on("entry", (entry) => {
        entriesCount++;
        const name = entry.fileName;

        if (ext === "apk") {
          if (name === "AndroidManifest.xml") {
            apkHasManifest = true;
          } else if (/^classes\d*\.dex$/.test(name)) {
            apkDexCount++;
          } else if (name.startsWith("lib/")) {
            const parts = name.split("/");
            if (parts.length > 2) {
              apkAbis.add(parts[1]);
            }
          } else if (name.startsWith("assets/")) {
            apkHasAssets = true;
          } else if (name.startsWith("res/")) {
            apkHasRes = true;
          }
        } else if (ext === "aab") {
          const parts = name.split("/");
          if (parts.length > 1) {
            const moduleName = parts[0];
            if (moduleName && moduleName !== "META-INF") {
              aabModules.add(moduleName);
            }
            if (parts[1] === "dex" && parts[2] && /^classes\d*\.dex$/.test(parts[2])) {
              aabDexCount++;
            }
            if (parts[1] === "lib" && parts[2]) {
              aabAbis.add(parts[2]);
            }
          }
        } else if (ext === "ipa") {
          const match = name.match(/^Payload\/([^/]+)\.app\/(.*)$/);
          if (match) {
            ipaAppName = match[1];
            const relativePath = match[2];
            if (relativePath === "Info.plist") {
              ipaHasInfoPlist = true;
            } else if (relativePath === "embedded.mobileprovision") {
              ipaHasProvision = true;
            } else if (relativePath === "PkgInfo") {
              ipaHasPkgInfo = true;
            }
          }
        }

        zipfile.readEntry();
      });

      zipfile.on("end", () => {
        const result: ZipAnalysis = {
          isZip: true,
          entriesCount
        };

        if (ext === "apk") {
          result.apkInfo = {
            hasManifest: apkHasManifest,
            dexCount: apkDexCount,
            abis: Array.from(apkAbis),
            hasAssets: apkHasAssets,
            hasRes: apkHasRes
          };
        } else if (ext === "aab") {
          result.aabInfo = {
            modules: Array.from(aabModules),
            dexCount: aabDexCount,
            abis: Array.from(aabAbis)
          };
        } else if (ext === "ipa") {
          result.ipaInfo = {
            appName: ipaAppName,
            hasInfoPlist: ipaHasInfoPlist,
            hasProvisioningProfile: ipaHasProvision,
            hasPkgInfo: ipaHasPkgInfo
          };
        }

        resolve(result);
      });

      zipfile.on("error", () => {
        resolve({ isZip: false, entriesCount: 0 });
      });
    });
  });
}
