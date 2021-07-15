import * as vscode from "vscode";
import parser from "./parser";
import visualize from "./vizualizer";
import { dependencyGraph } from "./types";
export async function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("visualize.start", async () => {
      // Create and show a new webview
      const panel = vscode.window.createWebviewPanel(
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
        const viewGraphs: Array<dependencyGraph> | undefined = await parser(
          mainFolder
        );
        if (!viewGraphs) {
          vscode.window.showErrorMessage("SRC directory not found.");
          return;
        }
        panel.webview.html = await visualize(viewGraphs);
      } else {
        vscode.window.showErrorMessage("Please open a workspace");
      }
    })
  );
}

export function deactivate() {}
