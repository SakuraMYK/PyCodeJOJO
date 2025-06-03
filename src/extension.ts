import * as vscode from "vscode";
import { ColorPicker } from "./features/colorPicker";

let enable_ColorPicker = true;

export function activate(context: vscode.ExtensionContext) {
  if (enable_ColorPicker) {
    context.subscriptions.push(
      vscode.languages.registerColorProvider("*", new ColorPicker())
    );
  }
}

export function deactivate() {}
  