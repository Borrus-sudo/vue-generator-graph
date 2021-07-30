import * as vscode from "vscode";
import * as path from "path";
import parser from "./parser";
import visualize from "./vizualizer";
import getWebviewContent from "./getWebview";
import { dependencyGraph } from "./types";

export async function activate(context: vscode.ExtensionContext) {
  let panel: vscode.WebviewPanel | undefined = undefined;
  context.subscriptions.push(
    vscode.commands.registerCommand("visualize.start", async () => {
      // Create and show a new webview
      let uri = vscode.Uri.file("E:/jdev/WebArtisan.dev/src/App.vue");
      await vscode.commands.executeCommand("vscode.openFolder", uri);
      panel = vscode.window.createWebviewPanel(
        "visualize",
        "Generator Graph",
        vscode.ViewColumn.One,
        { enableScripts: true }
      );
      if (vscode.workspace.workspaceFolders) {
        const folders = vscode.workspace.workspaceFolders;
        let mainFolder: string = "";
        mainFolder = folders[0].uri.path;
        mainFolder = mainFolder.replace(mainFolder[0], "");
        const viewGraphs:
          | Array<{
              name: string;
              graph: "none" | dependencyGraph;
            }>
          | undefined = await parser(mainFolder);
        if (!viewGraphs) {
          vscode.window.showErrorMessage(
            " Neither `src` directory nor `pages` directory wasfound."
          );
          return;
        }
        const onDiskFilePath = vscode.Uri.file(
          path.join(context.extensionPath, "dist", "index.js")
        );
        const builtFile: vscode.Uri =
          panel.webview.asWebviewUri(onDiskFilePath);
        panel.webview.html = getWebviewContent(
          builtFile,
          visualize(viewGraphs)
        );
      } else {
        vscode.window.showErrorMessage("Please open a workspace");
      }
    })
  );
}

export function deactivate() {}
