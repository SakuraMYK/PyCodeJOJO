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
    vscode.commands.registerCommand("pycodejojo.ChoseTheme", async () => {
      choseTheme();
    }),

    vscode.workspace.onDidChangeConfiguration((event) => {
      const config = vscode.workspace.getConfiguration("pycodejojo");
      if (event.affectsConfiguration("pycodejojo.ColorPicker.Enable")) {
        const match = config.get("ColorPicker.Enable", true);
        colorPicker.enableMap.Enable = match;
      }
      if (event.affectsConfiguration("pycodejojo.ColorPicker.MatchRGB")) {
        const match = config.get("ColorPicker.MatchRGB", true);
        colorPicker.enableMap.MatchRGB = match;
        fontBackgroundColor.enableMap.MatchRGB = match;
      }
      if (event.affectsConfiguration("pycodejojo.ColorPicker.MatchTupleRGB")) {
        const match = config.get("ColorPicker.MatchTupleRGB", true);
        colorPicker.enableMap.MatchTupleRGB = match;
        fontBackgroundColor.enableMap.MatchTupleRGB = match;
      }
      if (event.affectsConfiguration("pycodejojo.ColorPicker.MatchHex")) {
        const match = config.get("ColorPicker.MatchHex", true);
        colorPicker.enableMap.MatchHex = match;
        fontBackgroundColor.enableMap.MatchHex = match;
      }
      if (event.affectsConfiguration("pycodejojo.FontBackgroundColor.Enable")) {
        const match = config.get("FontBackgroundColor.Enable", true);
        fontBackgroundColor.enableMap.Enable = match;
      }
    }),

    vscode.workspace.onDidChangeConfiguration((event) => {
      const config = vscode.workspace.getConfiguration("pycodejojo");
      if (event.affectsConfiguration("pycodejojo.Theme")) {
        const globalConfig = vscode.workspace.getConfiguration();
        const theme = config.get("Theme");
        globalConfig.update(
          "workbench.colorTheme",
          theme,
          vscode.ConfigurationTarget.Global
        );
      }
    }),
    vscode.languages.registerColorProvider("*", colorPicker)
  );

  const config = vscode.workspace.getConfiguration();
  const hasActivated = config.get("pycodejojo.HasActivated", undefined);

  if (!hasActivated) {
    config.update(
      "pycodejojo.HasActivated",
      true,
      vscode.ConfigurationTarget.Global
    );
    choseTheme();
  }
}

export function deactivate() {
  fontBackgroundColor.dispose();
}
