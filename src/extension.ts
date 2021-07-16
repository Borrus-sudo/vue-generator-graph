import * as vscode from "vscode";
import parser from "./parser";
import visualize from "./vizualizer";
import getWebviewContent from "./getWebview";
import { dependencyGraph } from "./types";
import * as path from "path";
export async function activate(context: vscode.ExtensionContext) {
  let panel: vscode.WebviewPanel | undefined = undefined;
  context.subscriptions.push(
    vscode.commands.registerCommand("visualize.start", async () => {
      // Create and show a new webview
      if (!panel) {
        panel = vscode.window.createWebviewPanel(
          "visualize",
          "Generator Graph",
          vscode.ViewColumn.One,
          { enableScripts: true }
        );
      }
      if (vscode.workspace.workspaceFolders) {
        const folders = vscode.workspace.workspaceFolders;
        let mainFolder: string = "";
        mainFolder = folders[0].uri.path;
        mainFolder = mainFolder.replace(mainFolder[0], "");
        const viewGraphs:
          | Array<{
              name: string;
              graph: dependencyGraph;
            }>
          | undefined = await parser(mainFolder);
        if (!viewGraphs) {
          vscode.window.showErrorMessage("SRC directory not found.");
          return;
        }
        const onDiskFilePath = vscode.Uri.file(
          path.join(context.extensionPath, "dist", "index.js")
        );
        const builtFile: vscode.Uri =
          panel.webview.asWebviewUri(onDiskFilePath);
        panel.webview.html = getWebviewContent(builtFile);
        console.log(visualize(viewGraphs));
      } else {
        vscode.window.showErrorMessage("Please open a workspace");
      }
    })
  );
}

export function deactivate() {}
