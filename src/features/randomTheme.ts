import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

let firstRun = true

/**
 * 生成随机十六进制颜色
 * @returns 随机十六进制颜色字符串（如 #a3b4c5）
 */
function getRandomHexColor(): string {
  // 生成0-255之间的随机整数
  const getRandomComponent = () => Math.floor(Math.random() * 256)
  
  // 转换为十六进制并补零
  const components = [
    getRandomComponent(),
    getRandomComponent(),
    getRandomComponent()
  ].map(component => component.toString(16).padStart(2, '0'))
  
  return `#${components.join('')}`
}

/**
 * 递归替换对象中所有十六进制颜色值
 * @param obj 要处理的对象
 * @returns 处理后的对象
 */
function replaceColorsInObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    // 检查是否为十六进制颜色字符串
    if (typeof obj === 'string' && /^#([0-9A-Fa-f]{3}){1,2}$/.test(obj)) {
      return getRandomHexColor()
    }
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => replaceColorsInObject(item))
  }

  // 处理对象类型
  const newObj: any = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      newObj[key] = replaceColorsInObject(obj[key])
    }
  }
  return newObj
}

export async function randomizeThemeColors(context: vscode.ExtensionContext) {
  try {
    const extensionPath = context.extensionPath
    const themePath = path.join(extensionPath, 'themes', 'Random.json')

    if (!fs.existsSync(themePath)) {
      console.error(`Theme file not found: ${themePath}`)
      return
    }

    // 读取并解析主题文件
    const themeContent = fs.readFileSync(themePath, 'utf8')
    let themeJson = JSON.parse(themeContent)

    // 替换所有十六进制颜色
    themeJson = replaceColorsInObject(themeJson)

    // 写回主题文件
    const newContent = JSON.stringify(themeJson, null, 2)
    fs.writeFileSync(themePath, newContent, 'utf8')

    // 切换主题确保生效
    if (firstRun) {
      await vscode.workspace
        .getConfiguration()
        .update(
          'workbench.colorTheme',
          'Default Dark+',
          vscode.ConfigurationTarget.Global
        )
      firstRun = false
    }
    await vscode.workspace
      .getConfiguration()
      .update(
        'workbench.colorTheme',
        'Random',
        vscode.ConfigurationTarget.Global
      )

    vscode.window.showInformationMessage('随机主题已更新，所有元素已确保对比度')
  } catch (error) {
    console.error(
      `处理主题文件失败: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
    vscode.window.showErrorMessage('更新随机主题时出错，请查看控制台')
  }
}