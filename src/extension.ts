import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "vue-generator-graph" is now active!');

	let disposable = vscode.commands.registerCommand('vue-generator-graph.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from vue-generator-graph!');
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
