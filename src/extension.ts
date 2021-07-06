import * as vscode from "vscode";
import parser from "./parser";

export function activate(context: vscode.ExtensionContext) {
  if (vscode.workspace.workspaceFolders) {
    const folders = vscode.workspace.workspaceFolders;
    let mainFolder: string = "";
    mainFolder = folders[0].uri.path;
    mainFolder = mainFolder.replace(mainFolder[0], "");
    parser(mainFolder);
  } else {
    vscode.window.showErrorMessage("Please open a workspace");
  }
}

export function deactivate() {}
