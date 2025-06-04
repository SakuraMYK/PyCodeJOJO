import * as vscode from "vscode";
import { ColorPicker, getColorMaps } from "./features/colorPicker";

let enable_ColorPicker = true;

export function activate(context: vscode.ExtensionContext) {
  if (enable_ColorPicker) {
    context.subscriptions.push(
      vscode.languages.registerColorProvider("*", new ColorPicker())
    );
  }

  // context.subscriptions.push(
  //   vscode.workspace.onDidChangeTextDocument((event) => {
  //     getColorMaps(event.document).forEach((colorMap) => {
  //       vscode.window.activeTextEditor?.setDecorations(
  //         vscode.window.createTextEditorDecorationType({
  //           backgroundColor: colorMap.text,
  //           borderRadius: "9px",
  //         }),
  //         [colorMap.range]
  //       );
  //     });
  //   })
  // );
}
// #ffffff
// rgba(106, 13, 13, 0.2)
// rgba(1, 1,  1,1)
export function deactivate() {}
