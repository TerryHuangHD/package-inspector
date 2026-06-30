import * as vscode from "vscode";

const CONFIG_SECTION = "packageInspector";

export function getEnabledExtensions(): string[] {
  const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
  const raw = config.get<string[]>("extensions", [
    "apk",
    "aab",
    "ipa",
    "exe",
    "bin",
    "dmg",
    "pkg",
    "vsix",
    "crx",
    "xpi",
    "jar",
    "war",
    "ear",
    "msi",
    "msix",
    "appx",
    "deb",
    "rpm",
    "appimage",
    "snap",
    "flatpak",
    "whl",
    "tgz",
    "phar",
    "gem",
    "wasm"
  ]);

  return Array.from(
    new Set(
      raw
        .map(normalizeExtension)
        .filter(Boolean)
    )
  );
}

export function normalizeExtension(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^\*\./, "")
    .replace(/^\./, "");
}

export function isExtensionEnabled(ext: string): boolean {
  return getEnabledExtensions().includes(normalizeExtension(ext));
}

export async function addExtension(ext: string): Promise<void> {
  const normalized = normalizeExtension(ext);
  const current = getEnabledExtensions();

  if (!current.includes(normalized)) {
    const next = [...current, normalized];
    await vscode.workspace
      .getConfiguration(CONFIG_SECTION)
      .update("extensions", next, vscode.ConfigurationTarget.Global);
  }
}

export async function removeExtension(ext: string): Promise<void> {
  const normalized = normalizeExtension(ext);
  const current = getEnabledExtensions();
  const next = current.filter(item => item !== normalized);

  await vscode.workspace
    .getConfiguration(CONFIG_SECTION)
    .update("extensions", next, vscode.ConfigurationTarget.Global);
}
