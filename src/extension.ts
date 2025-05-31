import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "pycodejojo" is now active!');

  const disposable = vscode.commands.registerCommand(
    "pycodejojo.helloWorld",
    () => {
      vscode.window.showInformationMessage("Hello World from PyCodeJOJO!");
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
