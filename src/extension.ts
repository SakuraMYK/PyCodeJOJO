import * as vscode from "vscode";
import { ColorPicker } from "./features/colorPicker";
import { FontBackgroundColor } from "./features/fontBackgroundColor";
import { getHoverInfo } from "./features/hoverTranslate";

const fontBackgroundColor = new FontBackgroundColor();

export function activate(context: vscode.ExtensionContext) {
  // 注册字体背景颜色提供程序
  context.subscriptions.push(
    vscode.languages.registerColorProvider("*", new ColorPicker()),
    vscode.workspace.onDidOpenTextDocument((document) => {
      fontBackgroundColor.update(vscode.window.activeTextEditor);
    }),
    vscode.workspace.onDidChangeTextDocument((event) => {
      fontBackgroundColor.update(vscode.window.activeTextEditor);
    }),
    vscode.window.onDidChangeTextEditorSelection(async (event) => {
      getHoverInfo(event);
    })
  );
}

export function deactivate() {
  fontBackgroundColor.dispose();
}
