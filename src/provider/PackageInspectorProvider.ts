import * as vscode from "vscode";
import * as path from "path";
import { getFileInfo, FileInfo } from "../services/fileInfo";
import { revealFile } from "../services/reveal";
import { copyFileToClipboard } from "../services/clipboardFile";
import { addExtension, removeExtension, isExtensionEnabled } from "../services/settings";
import { getHtml } from "../webview/html";

export class PackageInspectorProvider implements vscode.CustomReadonlyEditorProvider {
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new PackageInspectorProvider(context);
    return vscode.window.registerCustomEditorProvider(
      "packageInspector.viewer",
      provider,
      {
        webviewOptions: {
          retainContextWhenHidden: true
        },
        supportsMultipleEditorsPerDocument: false
      }
    );
  }

  constructor(private readonly context: vscode.ExtensionContext) { }

  async openCustomDocument(uri: vscode.Uri): Promise<vscode.CustomDocument> {
    return {
      uri,
      dispose: () => { }
    };
  }

  async resolveCustomEditor(
    document: vscode.CustomDocument,
    webviewPanel: vscode.WebviewPanel
  ): Promise<void> {
    const uri = document.uri;
    const ext = path.extname(uri.fsPath).replace(/^\./, "").toLowerCase();
    let currentFileInfo: FileInfo | undefined;
    let forceCalculateHash = false;

    webviewPanel.webview.options = {
      enableScripts: true
    };

    const updateWebview = async () => {
      const enabled = isExtensionEnabled(ext);
      currentFileInfo = await getFileInfo(uri, forceCalculateHash);
      webviewPanel.webview.html = getHtml({
        fileInfo: currentFileInfo,
        enabled,
        cspSource: webviewPanel.webview.cspSource
      });
    };

    // Initial render
    await updateWebview();

    // Listen for settings changes to re-render dynamically
    const configListener = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("packageInspector")) {
        updateWebview();
      }
    });

    webviewPanel.onDidDispose(() => {
      configListener.dispose();
    });

    // Handle messages from the webview
    webviewPanel.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case "revealInFinder":
          revealFile(uri.fsPath);
          break;

        case "copyFile":
          try {
            await copyFileToClipboard(uri.fsPath);
            const pasteKey = process.platform === "darwin" ? "Cmd+V" : "Ctrl+V";
            vscode.window.showInformationMessage(
              `File copied — paste with ${pasteKey} in Finder, Slack, Mail, …`
            );
          } catch (err) {
            // The service routes every non-darwin/non-win32 platform to the
            // best-effort wl-copy/xclip path; match that here so the graceful
            // path-text fallback fires for any of them (not just "linux").
            if (process.platform !== "darwin" && process.platform !== "win32") {
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

        case "copyPath":
          await vscode.env.clipboard.writeText(uri.fsPath);
          vscode.window.showInformationMessage("Path copied to clipboard.");
          break;

        case "copyName":
          if (currentFileInfo) {
            await vscode.env.clipboard.writeText(currentFileInfo.name);
            vscode.window.showInformationMessage("Filename copied to clipboard.");
          }
          break;

        case "copyHash":
          if (currentFileInfo) {
            await vscode.env.clipboard.writeText(currentFileInfo.sha256);
            vscode.window.showInformationMessage("SHA-256 Hash copied to clipboard.");
          }
          break;

        case "forceCalculateHash":
          webviewPanel.webview.postMessage({ type: "hashLoading" });
          forceCalculateHash = true;
          await updateWebview();
          break;

        case "addExtension":
          await addExtension(ext);
          vscode.window.showInformationMessage(`Added .${ext} to Package Inspector.`);
          // webview is automatically updated by the configuration listener
          break;

        case "removeExtension":
          await removeExtension(ext);
          vscode.window.showInformationMessage(`Removed .${ext} from Package Inspector.`);
          // webview is automatically updated by the configuration listener
          break;

        case "openSettings":
          await vscode.commands.executeCommand("workbench.action.openSettings", "packageInspector");
          break;

        case "openAnyway":
          // Open the file with the default editor
          await vscode.commands.executeCommand("vscode.openWith", uri, "default");
          break;
      }
    });
  }
}
