import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

export async function randomizeThemeColors (context: vscode.ExtensionContext) {
  try {
    // 通过插件上下文获取扩展的安装目录
    const extensionPath = context.extensionPath
    // 拼接主题文件的绝对路径（根据实际存放位置调整）
    const themePath = path.join(extensionPath, 'themes', 'Random.json')

    // 检查文件是否存在
    if (!fs.existsSync(themePath)) {
      console.error(`主题文件不存在: ${themePath}`)
      return
    }

    // 读取文件内容
    const originalContent = fs.readFileSync(themePath, 'utf8')

    // 颜色替换逻辑（保持不变）
    const colorRegex = /"#?([0-9a-fA-F]{3}){1,2}"/g
    const newContent = originalContent.replace(colorRegex, () => {
      return (
        '"#' +
        Math.floor(Math.random() * 0xffffff)
          .toString(16)
          .padStart(6, '0') +
        '"'
      )
    })

    // 写回文件
    fs.writeFileSync(themePath, newContent, 'utf8')

    await vscode.workspace.getConfiguration().update(
      'workbench.colorTheme',
      'Random',
      vscode.ConfigurationTarget.Global // 或使用Workspace根据需求调整
    )

    vscode.window.showInformationMessage('random theme saved')
  } catch (error) {
    console.error(
      `处理主题文件失败: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}
