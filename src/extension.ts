import * as vscode from "vscode";
import { ColorPicker } from "./features/colorPicker";
import { FontBackgroundColor } from "./features/fontBackgroundColor";
import { getHoverInfo } from "./features/hoverTranslate";
import { changeTheme } from "./features/themeManager";

const fontBackgroundColor = new FontBackgroundColor();

export function activate(context: vscode.ExtensionContext) {
  // 注册字体背景颜色提供程序
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((document) => {
      fontBackgroundColor.update(vscode.window.activeTextEditor);
    }),
    vscode.workspace.onDidChangeTextDocument((event) => {
      fontBackgroundColor.update(vscode.window.activeTextEditor);
    }),
    vscode.window.onDidChangeTextEditorSelection(async (event) => {
      getHoverInfo(event);
    }),

    vscode.languages.registerColorProvider("*", new ColorPicker()),
    vscode.commands.registerCommand("pycodejojo.ChangeTheme", async () => {
      changeTheme();
    })
  );
}

export function deactivate() {
  fontBackgroundColor.dispose();
}
