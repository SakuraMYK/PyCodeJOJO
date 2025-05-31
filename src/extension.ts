import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  console.log("========================================");
  console.error("====== PyCodeJOJO extension activated  ======");
  console.warn("====== warning  ======");
  const disposable = vscode.commands.registerCommand(
    "pycodejojo.helloWorld",
    () => {}
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
