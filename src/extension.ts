import * as vscode from "vscode";
import { ColorPicker } from "./features/colorPicker";
import { FontBackgroundColor } from "./features/fontBackgroundColor";
import { getHoverInfo } from "./features/hoverTranslate";
import { changeTheme } from "./features/themeManager";

let enableColorPicker: boolean = true;
let enableColorPickerMatchRGB: boolean = true;
let enableColorPickerMatchTupleRGB: boolean = true;
let enableColorPickerMatchHex: boolean = true;

let enableFontBackgroundColor: boolean = true;
let enableHoverTranslate: boolean = false;

const fontBackgroundColor = new FontBackgroundColor();

export function activate(context: vscode.ExtensionContext) {
  // 注册字体背景颜色提供程序
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((document) => {
      if (enableFontBackgroundColor) {
        fontBackgroundColor.update(vscode.window.activeTextEditor);
      }
    }),
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (enableFontBackgroundColor) {
        fontBackgroundColor.update(vscode.window.activeTextEditor);
      }
    }),
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (enableFontBackgroundColor) fontBackgroundColor.update(editor);
    }),
    vscode.window.onDidChangeTextEditorSelection(async (event) => {
      if (enableHoverTranslate) getHoverInfo(event);
    }),
    vscode.commands.registerCommand("pycodejojo.ChangeTheme", async () => {
      changeTheme();
    }),

    vscode.workspace.onDidChangeConfiguration((event) => {
      const config: vscode.WorkspaceConfiguration =
        vscode.workspace.getConfiguration("pycodejojo");
      if (event.affectsConfiguration("pycodejojo.ColorPicker.MatchRGB")) {
        enableColorPickerMatchRGB = config.get("ColorPicker.MatchRGB", true);
      }
      if (event.affectsConfiguration("pycodejojo.ColorPicker.MatchTupleRGB")) {
        enableColorPickerMatchTupleRGB = config.get(
          "ColorPicker.MatchTupleRGB",
          true
        );
      }
      if (event.affectsConfiguration("pycodejojo.ColorPicker.MatchHex")) {
        enableColorPickerMatchHex = config.get("ColorPicker.MatchHex", true);
      }
    })
  );

  if (enableColorPicker) {
    context.subscriptions.push(
      vscode.languages.registerColorProvider("*", new ColorPicker())
    );
  }
  changeTheme();
}

export function deactivate() {
  fontBackgroundColor.dispose();
}
