import * as vscode from "vscode";
import { ColorPicker } from "./features/colorPicker";
import { FontBackgroundColor } from "./features/fontBackgroundColor";
import { getHoverInfo } from "./features/hoverTranslate";
import { choseTheme } from "./features/themeManager";

let enableFontBackgroundColor: boolean = true;
let enableHoverTranslate: boolean = false;

const fontBackgroundColor = new FontBackgroundColor();
const colorPicker = new ColorPicker();

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
    vscode.commands.registerCommand("Pycodejojo.ChoseTheme", async () => {
      choseTheme();
    }),

    vscode.workspace.onDidChangeConfiguration((event) => {
      const config = vscode.workspace.getConfiguration();

      if (event.affectsConfiguration("Pycodejojo.ColorPicker.Enable")) {
        const match = config.get("Pycodejojo.ColorPicker.Enable", true);
        colorPicker.enableMap.Enable = match;
      }
      if (event.affectsConfiguration("Pycodejojo.ColorPicker.MatchRGB")) {
        const match = config.get("Pycodejojo.ColorPicker.MatchRGB", true);
        colorPicker.enableMap.MatchRGB = match;
        fontBackgroundColor.enableMap.MatchRGB = match;
      }
      if (event.affectsConfiguration("Pycodejojo.ColorPicker.MatchTupleRGB")) {
        const match = config.get("Pycodejojo.ColorPicker.MatchTupleRGB", true);
        colorPicker.enableMap.MatchTupleRGB = match;
        fontBackgroundColor.enableMap.MatchTupleRGB = match;
      }
      if (event.affectsConfiguration("Pycodejojo.ColorPicker.MatchHex")) {
        const match = config.get("Pycodejojo.ColorPicker.MatchHex", true);
        colorPicker.enableMap.MatchHex = match;
        fontBackgroundColor.enableMap.MatchHex = match;
      }
      if (event.affectsConfiguration("Pycodejojo.FontBackgroundColor.Enable")) {
        const match = config.get("Pycodejojo.FontBackgroundColor.Enable", true);
        fontBackgroundColor.enableMap.Enable = match;
      }
      if (event.affectsConfiguration("Pycodejojo.Theme")) {
        const selectTheme = config.get("Pycodejojo.Theme");
        config.update(
          "workbench.colorTheme",
          selectTheme,
          vscode.ConfigurationTarget.Global
        );
      }
    }),

    vscode.languages.registerColorProvider("*", colorPicker)
  );

  const config = vscode.workspace.getConfiguration();
  const hasActivated = config.get("Pycodejojo.HasActivated", undefined);

  if (!hasActivated) {
    config.update(
      "Pycodejojo.HasActivated",
      true,
      vscode.ConfigurationTarget.Global
    );
    choseTheme();
  } else {
    choseTheme();
  }
}

export function deactivate() {
  fontBackgroundColor.dispose();
}
