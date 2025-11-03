import * as vscode from 'vscode'
import { ColorPicker } from './features/colorPicker'
import { FontBackgroundColor } from './features/fontBackgroundColor'
import { getHoverInfo } from './features/hoverTranslate'
import { switchTheme } from './features/themeManager'
import { randomizeThemeColors } from './features/randomTheme'
import {
  generateInitForSelectedDirs,
  deleteAllInitFiles
} from './features/PyInitGenerator'

let enableFontBackgroundColor: boolean = true
let enableHoverTranslate: boolean = false

const fontBackgroundColor = new FontBackgroundColor()
const colorPicker = new ColorPicker()

export function activate (context: vscode.ExtensionContext) {
  // 注册字体背景颜色提供程序
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(document => {
      if (enableFontBackgroundColor) {
        fontBackgroundColor.update(vscode.window.activeTextEditor)
      }
    }),
    vscode.workspace.onDidChangeTextDocument(event => {
      if (enableFontBackgroundColor) {
        fontBackgroundColor.update(vscode.window.activeTextEditor)
      }
    }),
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (enableFontBackgroundColor) {
        fontBackgroundColor.update(editor)
      }
    }),
    vscode.window.onDidChangeTextEditorSelection(async event => {
      if (enableHoverTranslate) {
        getHoverInfo(event)
      }
    }),

    // ========= 注册命令 =========
    vscode.commands.registerCommand('Pycodejojo.SwitchTheme', async () => {
      switchTheme()
    }),
    vscode.commands.registerCommand('Pycodejojo.RandomTheme', async () => {
      randomizeThemeColors(context)
    }),
    vscode.commands.registerCommand(
      'Pycodejojo.GeneratePythonInitFile',
      async () => {
        generateInitForSelectedDirs()
      }
    ),
    vscode.commands.registerCommand(
      'Pycodejojo.DeleteAllPythonInitFile',
      async () => {
        deleteAllInitFiles(vscode.workspace.workspaceFolders![0].uri.fsPath)
      }
    ),

    // ======== 注册事件 =========
    vscode.workspace.onDidChangeConfiguration(event => {
      const config = vscode.workspace.getConfiguration()

      if (event.affectsConfiguration('Pycodejojo.ColorPicker.Enable')) {
        const match = config.get('Pycodejojo.ColorPicker.Enable', true)
        colorPicker.enableMap.Enable = match
      }
      if (event.affectsConfiguration('Pycodejojo.ColorPicker.MatchRGB')) {
        const match = config.get('Pycodejojo.ColorPicker.MatchRGB', true)
        colorPicker.enableMap.MatchRGB = match
        fontBackgroundColor.enableMap.MatchRGB = match
      }
      if (event.affectsConfiguration('Pycodejojo.ColorPicker.MatchTupleRGB')) {
        const match = config.get('Pycodejojo.ColorPicker.MatchTupleRGB', true)
        colorPicker.enableMap.MatchTupleRGB = match
        fontBackgroundColor.enableMap.MatchTupleRGB = match
      }

      if (event.affectsConfiguration('Pycodejojo.ColorPicker.MatchHex3')) {
        const match = config.get('Pycodejojo.ColorPicker.MatchHex3', true)
        colorPicker.enableMap.MatchHex3 = match
        fontBackgroundColor.enableMap.MatchHex3 = match
      }
      if (event.affectsConfiguration('Pycodejojo.ColorPicker.MatchHex6')) {
        const match = config.get('Pycodejojo.ColorPicker.MatchHex6', true)
        colorPicker.enableMap.MatchHex6 = match
        fontBackgroundColor.enableMap.MatchHex6 = match
      }
      if (event.affectsConfiguration('Pycodejojo.ColorPicker.MatchHex8')) {
        const match = config.get('Pycodejojo.ColorPicker.MatchHex8', true)
        colorPicker.enableMap.MatchHex8 = match
        fontBackgroundColor.enableMap.MatchHex8 = match
      }

      if (event.affectsConfiguration('Pycodejojo.FontBackgroundColor.Enable')) {
        const match = config.get('Pycodejojo.FontBackgroundColor.Enable', true)
        fontBackgroundColor.enableMap.Enable = match
      }
      if (event.affectsConfiguration('Pycodejojo.Theme')) {
        const selectTheme = config.get('Pycodejojo.Theme')
        config.update(
          'workbench.colorTheme',
          selectTheme,
          vscode.ConfigurationTarget.Global
        )
      }
    }),

    vscode.languages.registerColorProvider('*', colorPicker)
  )

  const config = vscode.workspace.getConfiguration()
  const hasActivated = config.get('Pycodejojo.HasActivated', undefined)

  if (!hasActivated) {
    config.update(
      'Pycodejojo.HasActivated',
      true,
      vscode.ConfigurationTarget.Global
    )
    switchTheme()
  }
}

export function deactivate () {
  fontBackgroundColor.dispose()
}
