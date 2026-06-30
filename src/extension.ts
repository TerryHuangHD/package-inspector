import * as vscode from "vscode";
import * as path from "path";
import { PackageInspectorProvider } from "./provider/PackageInspectorProvider";
import { revealFile } from "./services/reveal";
import { addExtension, removeExtension } from "./services/settings";

export function activate(context: vscode.ExtensionContext) {
  // Register the custom editor provider
  context.subscriptions.push(PackageInspectorProvider.register(context));

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand("packageInspector.openPreview", async (uri?: vscode.Uri) => {
      const targetUri = uri ?? vscode.window.activeTextEditor?.document.uri;

      if (!targetUri || targetUri.scheme !== "file") {
        vscode.window.showWarningMessage("No local file selected.");
        return;
      }

      await vscode.commands.executeCommand(
        "vscode.openWith",
        targetUri,
        "packageInspector.viewer",
        {
          preview: false,
          viewColumn: vscode.ViewColumn.Active
        }
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("packageInspector.revealInFinder", async (uri?: vscode.Uri) => {
      const targetUri = uri ?? vscode.window.activeTextEditor?.document.uri;

      if (!targetUri || targetUri.scheme !== "file") {
        vscode.window.showWarningMessage("No local file selected.");
        return;
      }

      revealFile(targetUri.fsPath);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("packageInspector.addCurrentExtension", async (uri?: vscode.Uri) => {
      const targetUri = uri ?? vscode.window.activeTextEditor?.document.uri;
      if (!targetUri) {
        return;
      }
      const ext = path.extname(targetUri.fsPath).replace(/^\./, "").toLowerCase();
      if (ext) {
        await addExtension(ext);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("packageInspector.removeCurrentExtension", async (uri?: vscode.Uri) => {
      const targetUri = uri ?? vscode.window.activeTextEditor?.document.uri;
      if (!targetUri) {
        return;
      }
      const ext = path.extname(targetUri.fsPath).replace(/^\./, "").toLowerCase();
      if (ext) {
        await removeExtension(ext);
      }
    })
  );
}

export function deactivate() {}
