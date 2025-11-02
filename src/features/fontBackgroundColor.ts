import * as vscode from 'vscode'
import { getColorMaps, EnableMap } from './colorPicker'

export class FontBackgroundColor {
  private _decorationTypes: vscode.TextEditorDecorationType[] = []
  public enableMap: EnableMap = {
    Enable: true,
    MatchRGB: true,
    MatchTupleRGB: true,
    MatchHex3: true,
    MatchHex6: true,
    MatchHex8: true
  }

  public update (editor: vscode.TextEditor | undefined) {
    if (!editor) return
    this._clear(editor)
    if (!this.enableMap.Enable) return
    const colorMaps = getColorMaps(editor.document, this.enableMap)

    for (const colorMap of colorMaps) {
      const decorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: colorMap.text,
        borderRadius: '9px',
        color: this._getContrastColor(colorMap.color),
        overviewRulerColor: colorMap.text,
        overviewRulerLane: vscode.OverviewRulerLane.Right
      })
      this._decorationTypes.push(decorationType)
      editor.setDecorations(decorationType, [colorMap.range])
    }
  }

  private _getContrastColor (color: vscode.Color): string {
    // 将RGB值转换为线性RGB
    const toLinear = (c: number) => {
      c = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      return c
    }

    const r = toLinear(color.red)
    const g = toLinear(color.green)
    const b = toLinear(color.blue)

    // WCAG相对亮度公式
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b

    // 如果背景较亮，使用黑色文字；如果背景较暗，使用白色文字
    return luminance > 0.5 ? '#000000' : '#ffffff'
  }

  private _clear (editor: vscode.TextEditor | undefined) {
    for (const decorationType of this._decorationTypes) {
      editor?.setDecorations(decorationType, [])
      decorationType.dispose()
    }
    this._decorationTypes = []
  }

  public dispose () {
    for (const decorationType of this._decorationTypes) {
      decorationType.dispose()
    }
    this._decorationTypes = []
  }
}
