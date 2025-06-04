import * as vscode from "vscode";
import { ColorPicker } from "./features/colorPicker";
import { FontBackgroundColor } from "./features/fontBackgroundColor";

const fontBackgroundColor = new FontBackgroundColor();

let enable_ColorPicker = true;

export function activate(context: vscode.ExtensionContext) {
  if (enable_ColorPicker) {
    context.subscriptions.push(
      vscode.languages.registerColorProvider("*", new ColorPicker())
    );
  }

  fontBackgroundColor.update(vscode.window.activeTextEditor);

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      fontBackgroundColor.update(vscode.window.activeTextEditor);
    })
  );
}
export function deactivate() {
  fontBackgroundColor.dispose();
}
