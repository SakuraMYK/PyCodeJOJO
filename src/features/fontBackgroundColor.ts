import vscode from "vscode";
import { getColorMaps } from "./colorPicker";

export class FontBackgroundColor {
  private _decorationTypes: vscode.TextEditorDecorationType[] = [];

  public update(editor: vscode.TextEditor | undefined) {
    if (!editor) return;
    this.clear(editor);
    const colorMaps = getColorMaps(editor.document);

    for (const colorMap of colorMaps) {
      const decorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: colorMap.text,
        borderRadius: "9px",
      });
      this._decorationTypes.push(decorationType);
      editor.setDecorations(decorationType, [colorMap.range]);
    }
  }

  private clear(editor: vscode.TextEditor | undefined) {
    for (const decorationType of this._decorationTypes) {
      editor?.setDecorations(decorationType, []);
      decorationType.dispose();
    }
    this._decorationTypes = [];
  }

  public dispose() {
    for (const decorationType of this._decorationTypes) {
      decorationType.dispose();
    }
    this._decorationTypes = [];
  }
}
