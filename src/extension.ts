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

      if (vscode.workspace.workspaceFolders) {
        const folders = vscode.workspace.workspaceFolders;
        let mainFolder: string = "";
        mainFolder = folders[0].uri.path;
        mainFolder = mainFolder.replace(mainFolder[0], "");
        const ctx: node[] | undefined | string = await parser(mainFolder);
        if (typeof ctx === "string") {
          vscode.window.showErrorMessage(ctx + " " + bugMessage);
          return;
        }
        if (!ctx) {
          vscode.window.showErrorMessage(
            "`src`directory were found. " + bugMessage
          );
          return;
        }
        panel = vscode.window.createWebviewPanel(
          "visualize",
          "Generator Graph",
          vscode.ViewColumn.One,
          { enableScripts: true }
        );
        const onDiskFilePath = vscode.Uri.file(
          join(context.extensionPath, "dist", "index.js")
        );
        const builtFile: vscode.Uri =
          panel.webview.asWebviewUri(onDiskFilePath);
        panel.webview.html = getWebviewContent(builtFile, visualize(ctx));
        panel.webview.onDidReceiveMessage(
          async (message) => {
            switch (message.command) {
              case "openFile":
                const directory: string = normalize(message.text);
                if (existsSync(directory)) {
                  let uri = vscode.Uri.file(directory);
                  await vscode.window.showTextDocument(uri);
                } else {
                  vscode.window.showErrorMessage(
                    `The directory ${directory} does not exist. Please check the import relation path. ${bugMessage}`
                  );
                }
                break;
              case "svgContent":
                const payloadText = message.text;
                const wsEditor = new vscode.WorkspaceEdit();
                const filePath = vscode.Uri.file(join(mainFolder, "graph.svg"));
                wsEditor.deleteFile(filePath, { ignoreIfNotExists: true });
                wsEditor.createFile(filePath, { overwrite: true });
                const origin = new vscode.Position(0, 0);
                wsEditor.insert(filePath, origin, payloadText);
                vscode.workspace.applyEdit(wsEditor);
                vscode.window.showInformationMessage(
                  `Graph saved in Graph.svg file in the root of the folder.`
                );
                break;
              default:
                break;
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
