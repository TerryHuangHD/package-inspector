import { FileInfo } from "../services/fileInfo";
import { getStyles } from "./styles";
import { escapeHtml } from "../utils/escapeHtml";
import { formatBytes, formatDate } from "../utils/format";

export interface HtmlOptions {
  fileInfo: FileInfo;
  enabled: boolean;
  cspSource: string;
}

export function getHtml(options: HtmlOptions): string {
  const { fileInfo, enabled, cspSource } = options;
  const nonce = getNonce();
  const styles = getStyles();

  // Pick an emoji icon based on extension
  let icon = "📄";
  const ext = fileInfo.extension.replace(/^\./, "").toLowerCase();
  if (ext === "apk") {
    icon = "🤖";
  } else if (ext === "aab") {
    icon = "📦";
  } else if (ext === "ipa") {
    icon = "🍎";
  } else if (ext === "exe") {
    icon = "🪟";
  } else if (ext === "dmg") {
    icon = "💿";
  } else if (ext === "pkg") {
    icon = "📦";
  } else if (["vsix", "crx", "xpi"].includes(ext)) {
    icon = "🧩";
  } else if (["jar", "war", "ear"].includes(ext)) {
    icon = "☕";
  } else if (ext === "whl") {
    icon = "🐍";
  } else if (ext === "phar") {
    icon = "🐘";
  } else if (ext === "gem") {
    icon = "💎";
  } else if (ext === "wasm") {
    icon = "🕸️";
  } else if (ext === "appimage") {
    icon = "🐧";
  } else if (["msi", "msix", "appx", "deb", "rpm", "snap", "flatpak"].includes(ext)) {
    icon = "📦";
  } else if (ext === "tgz") {
    icon = "🗜️";
  }

  // Generate platform-specific reveal button label
  let revealLabel = "Reveal in Finder";
  if (process.platform === "win32") {
    revealLabel = "Show in Explorer";
  } else if (process.platform !== "darwin") {
    revealLabel = "Open Containing Folder";
  }

  // Render package specific analysis
  let packageAnalysisHtml = "";
  if (enabled) {
    if (fileInfo.peInfo && fileInfo.peInfo.isPe) {
      const pe = fileInfo.peInfo;
      packageAnalysisHtml = `
        <div class="section-title">Executable Metadata (PE)</div>
        <div class="analysis-container">
          <div class="analysis-grid">
            <div class="analysis-item">
              <div class="item-label">Target Architecture</div>
              <div class="item-value">${escapeHtml(pe.architecture || "Unknown")}</div>
            </div>
            <div class="analysis-item">
              <div class="item-label">Subsystem</div>
              <div class="item-value">${escapeHtml(pe.subsystem || "Unknown")}</div>
            </div>
            <div class="analysis-item">
              <div class="item-label">Format</div>
              <div class="item-value">${escapeHtml(pe.magic || "Unknown")}</div>
            </div>
          </div>
        </div>
      `;
    } else if (fileInfo.zipAnalysis && fileInfo.zipAnalysis.isZip) {
      const zip = fileInfo.zipAnalysis;
      if (ext === "apk" && zip.apkInfo) {
        const apk = zip.apkInfo;
        const abisHtml = apk.abis.length > 0
          ? apk.abis.map(abi => `<span class="chip">${escapeHtml(abi)}</span>`).join("")
          : '<span style="opacity:0.5;">None</span>';

        packageAnalysisHtml = `
          <div class="section-title">Package Contents (APK)</div>
          <div class="analysis-container">
            <div class="analysis-grid">
              <div class="analysis-item">
                <div class="item-label">AndroidManifest.xml</div>
                <div class="item-value">${apk.hasManifest ? "✅ Present" : "❌ Missing"}</div>
              </div>
              <div class="analysis-item">
                <div class="item-label">DEX File Count</div>
                <div class="item-value">${apk.dexCount}</div>
              </div>
              <div class="analysis-item">
                <div class="item-label">Assets Folder</div>
                <div class="item-value">${apk.hasAssets ? "✅ Present" : "❌ Absent"}</div>
              </div>
              <div class="analysis-item">
                <div class="item-label">Res Folder</div>
                <div class="item-value">${apk.hasRes ? "✅ Present" : "❌ Absent"}</div>
              </div>
              <div class="analysis-item" style="grid-column: span 2;">
                <div class="item-label">Supported ABIs</div>
                <div class="chip-container">${abisHtml}</div>
              </div>
            </div>
          </div>
        `;
      } else if (ext === "aab" && zip.aabInfo) {
        const aab = zip.aabInfo;
        const abisHtml = aab.abis.length > 0
          ? aab.abis.map(abi => `<span class="chip">${escapeHtml(abi)}</span>`).join("")
          : '<span style="opacity:0.5;">None</span>';
        const modulesHtml = aab.modules.length > 0
          ? aab.modules.map(mod => `<span class="chip">${escapeHtml(mod)}</span>`).join("")
          : '<span style="opacity:0.5;">None</span>';

        packageAnalysisHtml = `
          <div class="section-title">App Bundle Contents (AAB)</div>
          <div class="analysis-container">
            <div class="analysis-grid">
              <div class="analysis-item">
                <div class="item-label">DEX File Count</div>
                <div class="item-value">${aab.dexCount}</div>
              </div>
              <div class="analysis-item" style="grid-column: span 2;">
                <div class="item-label">Supported ABIs</div>
                <div class="chip-container">${abisHtml}</div>
              </div>
              <div class="analysis-item" style="grid-column: span 3;">
                <div class="item-label">Modules</div>
                <div class="chip-container">${modulesHtml}</div>
              </div>
            </div>
          </div>
        `;
      } else if (ext === "ipa" && zip.ipaInfo) {
        const ipa = zip.ipaInfo;
        packageAnalysisHtml = `
          <div class="section-title">App Archive Contents (IPA)</div>
          <div class="analysis-container">
            <div class="analysis-grid">
              <div class="analysis-item">
                <div class="item-label">App Directory Name</div>
                <div class="item-value">${escapeHtml(ipa.appName ? `${ipa.appName}.app` : "Unknown")}</div>
              </div>
              <div class="analysis-item">
                <div class="item-label">Info.plist</div>
                <div class="item-value">${ipa.hasInfoPlist ? "✅ Present" : "❌ Missing"}</div>
              </div>
              <div class="analysis-item">
                <div class="item-label">Mobile Provision Profile</div>
                <div class="item-value">${ipa.hasProvisioningProfile ? "✅ Present" : "❌ Missing"}</div>
              </div>
              <div class="analysis-item">
                <div class="item-label">PkgInfo File</div>
                <div class="item-value">${ipa.hasPkgInfo ? "✅ Present" : "❌ Missing"}</div>
              </div>
            </div>
          </div>
        `;
      } else {
        packageAnalysisHtml = `
          <div class="section-title">Archive Contents</div>
          <div class="analysis-container">
            <div class="analysis-grid">
              <div class="analysis-item">
                <div class="item-label">Total Files/Folders</div>
                <div class="item-value">${zip.entriesCount}</div>
              </div>
            </div>
          </div>
        `;
      }
    }
  }

  // Render the main card content
  let bodyContent = "";
  if (!enabled) {
    bodyContent = `
      <div class="fallback-card">
        <div class="fallback-icon">⚠️</div>
        <div class="fallback-title">Extension Not Enabled</div>
        <div class="fallback-desc">
          The file extension <strong>.${escapeHtml(ext)}</strong> is registered in package.json but is currently not enabled in your <code>packageInspector.extensions</code> settings.
        </div>
        <div class="actions" style="justify-content: center; border: none; padding: 0;">
          <button class="primary" data-command="addExtension">Enable .${escapeHtml(ext)}</button>
          <button class="secondary" data-command="openAnyway">Open with Default Editor</button>
        </div>
      </div>
    `;
  } else {
    const isHashSkipped = fileInfo.sha256.startsWith("Skipped");
    const isHashDisabled = fileInfo.sha256 === "Disabled in settings";

    let hashContentHtml = "";
    if (isHashSkipped) {
      hashContentHtml = `
        <span class="value-text"><span class="hash-value" style="opacity: 0.7;">${escapeHtml(fileInfo.sha256)}</span></span>
        <button class="calculate-btn" data-command="forceCalculateHash" title="Calculate Hash">Calculate</button>
      `;
    } else if (isHashDisabled) {
      hashContentHtml = `
        <span class="value-text"><span class="hash-value" style="opacity: 0.5;">${escapeHtml(fileInfo.sha256)}</span></span>
      `;
    } else {
      hashContentHtml = `
        <span class="value-text"><span class="hash-value">${escapeHtml(fileInfo.sha256)}</span></span>
        <button class="copy-icon-btn" data-command="copyHash" title="Copy SHA-256 Hash">📋</button>
      `;
    }
    bodyContent = `
      <div class="header">
        <div class="header-left">
          <div class="icon-container">${icon}</div>
          <div class="title-area">
            <div class="title-container">
              <h1>${escapeHtml(fileInfo.name)}</h1>
              <button class="copy-icon-btn" data-command="copyName" title="Copy Filename">📋</button>
            </div>
            <div class="subtitle">
              <span>${escapeHtml(fileInfo.typeLabel)}</span>
              <span class="badge enabled">Preview Enabled</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section-title">File Details</div>
      <table class="meta-table">
        <tr>
          <td class="label">Extension</td>
          <td class="value"><code>.${escapeHtml(ext)}</code></td>
        </tr>
        <tr>
          <td class="label">Size</td>
          <td class="value">${escapeHtml(formatBytes(fileInfo.size))} (${fileInfo.size.toLocaleString()} bytes)</td>
        </tr>
        <tr>
          <td class="label">Dates</td>
          <td class="value">
            <div class="dates-container">
              <div class="date-item">
                <span class="date-label">Created</span>
                <span class="date-value">${escapeHtml(formatDate(fileInfo.created))}</span>
              </div>
              <div class="date-item">
                <span class="date-label">Modified</span>
                <span class="date-value">${escapeHtml(formatDate(fileInfo.modified))}</span>
              </div>
            </div>
          </td>
        </tr>
        <tr>
          <td class="label">Absolute Path</td>
          <td class="value">
            <div class="value-container">
              <span class="value-text"><code>${escapeHtml(fileInfo.absolutePath)}</code></span>
              <button class="copy-icon-btn" data-command="copyPath" title="Copy Path">📋</button>
            </div>
          </td>
        </tr>
        <tr>
          <td class="label">SHA-256 Hash</td>
          <td class="value">
            <div class="value-container hash-value-container">
              ${hashContentHtml}
            </div>
          </td>
        </tr>
      </table>

      ${packageAnalysisHtml}

      <div class="actions">
        <button class="primary" data-command="revealInFinder">
          <span style="font-size: 16px;">📂</span> ${escapeHtml(revealLabel)}
        </button>
        <button class="secondary" data-command="openAnyway">
          Open with Default Editor
        </button>
      </div>
    `;
  }

  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>Package Inspector</title>
    <style>
      ${styles}
    </style>
  </head>
  <body>
    <div class="container">
      <button class="settings-btn" data-command="openSettings" title="Open Settings">⚙️</button>
      ${bodyContent}
    </div>

    <script nonce="${nonce}">
      const vscode = acquireVsCodeApi();
      document.querySelectorAll("button[data-command]").forEach(button => {
        button.addEventListener("click", () => {
          const command = button.getAttribute("data-command");
          if (command) {
            vscode.postMessage({ command });
          }
        });
      });

      window.addEventListener("message", event => {
        const message = event.data;
        if (message.type === "hashLoading") {
          const hashContainer = document.querySelector(".hash-value-container");
          if (hashContainer) {
            hashContainer.innerHTML = '<span class="loading-text"><span class="spin-icon">🔄</span> Calculating SHA-256...</span>';
          }
        }
      });
    </script>
  </body>
  </html>`;
}

function getNonce(): string {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
