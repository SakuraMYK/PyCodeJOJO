import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

let firstRun = true
// 生成具有足够对比度的随机颜色
function getContrastingColor (baseLuminance: number = 0.5): string {
  // 目标对比度至少为4.5:1（符合WCAG AA标准）
  const minContrast = 4.5
  let color: string
  let contrast: number

  do {
    // 生成随机RGB值
    const r = Math.floor(Math.random() * 256)
    const g = Math.floor(Math.random() * 256)
    const b = Math.floor(Math.random() * 256)

    // 计算亮度 (相对 luminance)
    const [lr, lg, lb] = [r, g, b].map(component => {
      const c = component / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })

    // 计算相对亮度
    const luminance = 0.2126 * lr + 0.7152 * lg + 0.0722 * lb

    // 计算对比度
    contrast =
      (Math.max(luminance, baseLuminance) + 0.05) /
      (Math.min(luminance, baseLuminance) + 0.05)

    // 转换为十六进制
    color = `#${[r, g, b]
      .map(c => c.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()}`
  } while (contrast < minContrast)

  return color
}

export async function randomizeThemeColors (context: vscode.ExtensionContext) {
  try {
    const extensionPath = context.extensionPath
    const themePath = path.join(extensionPath, 'themes', 'Random.json')

    if (!fs.existsSync(themePath)) {
      console.error(`Theme file not found: ${themePath}`)
      return
    }

    const originalContent = fs.readFileSync(themePath, 'utf8')

    // 尝试从主题中获取背景色来计算对比度
    let baseLuminance = 0.5 // 默认中间亮度
    const bgColorMatch = originalContent.match(
      /"editor.background":\s*"#?([0-9a-fA-F]{3}){1,2}"/i
    )
    if (bgColorMatch && bgColorMatch[0]) {
      const bgColor = bgColorMatch[0].split(':')[1].trim().replace(/"/g, '')
      // 解析背景色并计算其亮度作为基准
      const r = parseInt(bgColor.slice(1, 3), 16) / 255
      const g = parseInt(bgColor.slice(3, 5), 16) / 255
      const b = parseInt(bgColor.slice(5, 7), 16) / 255

      const [lr, lg, lb] = [r, g, b].map(c =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      )
      baseLuminance = 0.2126 * lr + 0.7152 * lg + 0.0722 * lb
    }

    // 替换颜色，确保与背景有足够对比度
    const colorRegex = /"#?([0-9a-fA-F]{3}){1,2}"/g
    const newContent = originalContent.replace(colorRegex, match => {
      // 跳过背景色本身的替换，避免递归问题
      if (bgColorMatch && match === bgColorMatch[0].split(':')[1].trim()) {
        return match
      }
      return `"${getContrastingColor(baseLuminance)}"`
    })

    fs.writeFileSync(themePath, newContent, 'utf8')

    if (firstRun) {
      vscode.workspace
        .getConfiguration()
        .update(
          'workbench.colorTheme',
          'Default Dark+',
          vscode.ConfigurationTarget.Global
        )
        firstRun = false
    }
    vscode.workspace
      .getConfiguration()
      .update(
        'workbench.colorTheme',
        'Random',
        vscode.ConfigurationTarget.Global
      )

    // vscode.window.showInformationMessage('Random theme updated successfully')
  } catch (error) {
    console.error(
      `Failed to process theme file: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}
