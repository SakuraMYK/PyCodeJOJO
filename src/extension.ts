import * as vscode from "vscode";
import { ColorPicker } from "./features/colorPicker";
import { FontBackgroundColor } from "./features/fontBackgroundColor";

let decorationType: vscode.TextEditorDecorationType;
const fontBackgroundColor = new FontBackgroundColor();

export function activate(context: vscode.ExtensionContext) {
  // 注册颜色选择器提供程序
  context.subscriptions.push(
    vscode.languages.registerColorProvider("*", new ColorPicker())
  );

  // 注册字体背景颜色提供程序
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((document) => {
      fontBackgroundColor.update(vscode.window.activeTextEditor);
    }),
    vscode.workspace.onDidChangeTextDocument((event) => {
      fontBackgroundColor.update(vscode.window.activeTextEditor);
    })
  );
}

export function deactivate() {
  fontBackgroundColor.dispose();
}
