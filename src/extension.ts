import * as vscode from "vscode";
import { join, normalize } from "path";
import parser from "./parser";
import visualize from "./vizualizer";
import getWebviewContent from "./getWebview";
import { node } from "./types";
import { existsSync } from "fs";
const bugMessage =
  "If a bug is found, feel free to report it at https://github.com/Borrus-sudo/vue-generator-graph/issues";
export async function activate(context: vscode.ExtensionContext) {
  let panel: vscode.WebviewPanel | undefined = undefined;
  context.subscriptions.push(
    vscode.commands.registerCommand("visualize.start", async () => {
      // Create and show a new webview
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
        const viewGraphs: node[] | undefined = await parser(mainFolder);
        if (!viewGraphs) {
          vscode.window.showErrorMessage(
            "Neither `src` directory nor `pages` directory were found. " +
              bugMessage
          );
          return;
        }
        const onDiskFilePath = vscode.Uri.file(
          join(context.extensionPath, "dist", "index.js")
        );
        const builtFile: vscode.Uri =
          panel.webview.asWebviewUri(onDiskFilePath);
        panel.webview.html = getWebviewContent(
          builtFile,
          visualize(viewGraphs)
        );
        panel.webview.onDidReceiveMessage(
          async (message) => {
            const directory: string = normalize(message.text);
            console.log({ directory });
            if (existsSync(directory)) {
              let uri = vscode.Uri.file(directory);
              await vscode.window.showTextDocument(uri);
            } else {
              vscode.window.showErrorMessage(
                `The directory ${directory} does not exist. Please check the import relation path. ${bugMessage}`
              );
            }
          },
          undefined,
          context.subscriptions
        );
      } else {
        vscode.window.showErrorMessage(
          "Please open a workspace. " + bugMessage
        );
      }
    })
  );
}

export function deactivate() {}
