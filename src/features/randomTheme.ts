import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

let firstRun = true

// 生成具有足够对比度的随机颜色
function getContrastingColor (baseLuminance: number = 0.5): string {
  const minContrast = 4.5 // WCAG AA标准
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

// 计算颜色的亮度
function getLuminance (color: string): number {
  // 移除#号并标准化
  const hex = color.replace('#', '')
  // 处理3位十六进制颜色
  const r =
    parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.slice(0, 2), 16) / 255
  const g =
    parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.slice(2, 4), 16) / 255
  const b =
    parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.slice(4, 6), 16) / 255

  const [lr, lg, lb] = [r, g, b].map(c =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  )
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb
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
    let themeJson: any

    try {
      themeJson = JSON.parse(originalContent)
    } catch (parseError) {
      console.error(
        `Failed to parse theme file: ${(parseError as Error).message}`
      )
      return
    }

    // 识别关键背景色（编辑器背景、侧边栏背景等）
    const backgroundColors: Record<string, string> = {}

    // 收集主要背景色
    if (themeJson.colors) {
      // 编辑器背景
      if (themeJson.colors['editor.background']) {
        backgroundColors['editor.background'] =
          themeJson.colors['editor.background']
      }
      // 侧边栏背景
      if (themeJson.colors['sideBar.background']) {
        backgroundColors['sideBar.background'] =
          themeJson.colors['sideBar.background']
      }
      // 状态栏背景
      if (themeJson.colors['statusBar.background']) {
        backgroundColors['statusBar.background'] =
          themeJson.colors['statusBar.background']
      }
      // 活动栏背景
      if (themeJson.colors['activityBar.background']) {
        backgroundColors['activityBar.background'] =
          themeJson.colors['activityBar.background']
      }
      // 面板背景
      if (themeJson.colors['panel.background']) {
        backgroundColors['panel.background'] =
          themeJson.colors['panel.background']
      }
    }

    // 为每个区域生成新的背景色和对应的文本/图标颜色
    if (themeJson.colors) {
      // 处理编辑器区域
      if (backgroundColors['editor.background']) {
        const editorBg = getContrastingColor(0.5) // 适中亮度的背景
        const editorLuminance = getLuminance(editorBg)
        themeJson.colors['editor.background'] = editorBg
        // 编辑器文本
        themeJson.colors['editor.foreground'] =
          getContrastingColor(editorLuminance)
      }

      // 处理侧边栏
      if (backgroundColors['sideBar.background']) {
        const sideBarBg = getContrastingColor(0.5)
        const sideBarLuminance = getLuminance(sideBarBg)
        themeJson.colors['sideBar.background'] = sideBarBg
        // 侧边栏文本
        themeJson.colors['sideBar.foreground'] =
          getContrastingColor(sideBarLuminance)
        // 侧边栏标题
        themeJson.colors['sideBarTitle.foreground'] =
          getContrastingColor(sideBarLuminance)
        // 侧边栏图标
        themeJson.colors['sideBarSectionHeader.foreground'] =
          getContrastingColor(sideBarLuminance)
      }

      // 处理活动栏
      if (backgroundColors['activityBar.background']) {
        const activityBarBg = getContrastingColor(0.5)
        const activityBarLuminance = getLuminance(activityBarBg)
        themeJson.colors['activityBar.background'] = activityBarBg
        // 活动栏图标
        themeJson.colors['activityBar.foreground'] =
          getContrastingColor(activityBarLuminance)
        themeJson.colors['activityBar.inactiveForeground'] =
          getContrastingColor(activityBarLuminance)
      }

      // 处理状态栏
      if (backgroundColors['statusBar.background']) {
        const statusBarBg = getContrastingColor(0.5)
        const statusBarLuminance = getLuminance(statusBarBg)
        themeJson.colors['statusBar.background'] = statusBarBg
        // 状态栏文本
        themeJson.colors['statusBar.foreground'] =
          getContrastingColor(statusBarLuminance)
      }

      // 处理面板
      if (backgroundColors['panel.background']) {
        const panelBg = getContrastingColor(0.5)
        const panelLuminance = getLuminance(panelBg)
        themeJson.colors['panel.background'] = panelBg
        // 面板文本
        themeJson.colors['panel.foreground'] =
          getContrastingColor(panelLuminance)
      }

      // 处理其他关键UI元素
      const otherElements = [
        'titleBar.activeForeground',
        'titleBar.activeBackground', // 新增标题栏背景
        'titleBar.inactiveForeground',
        'titleBar.inactiveBackground',
        'menu.foreground',
        'menu.background',
        'list.foreground',
        'list.background',
        'breadcrumb.foreground',
        'breadcrumb.background',
        'quickInput.background', // 命令面板背景
        'quickInput.foreground', // 命令面板前景
        'notificationCenter.background', // 通知背景
        'notificationCenter.foreground' // 通知前景
      ]

      otherElements.forEach(key => {
        if (themeJson.colors[key]) {
          if (key.includes('background')) {
            const bgColor = getContrastingColor(0.5)
            themeJson.colors[key] = bgColor
            // 为背景色找到对应的前景色
            const fgKey = key.replace('background', 'foreground')
            if (themeJson.colors[fgKey]) {
              themeJson.colors[fgKey] = getContrastingColor(
                getLuminance(bgColor)
              )
            }
          } else if (key.includes('foreground')) {
            const bgKey = key.replace('foreground', 'background')
            if (themeJson.colors[bgKey]) {
              themeJson.colors[key] = getContrastingColor(
                getLuminance(themeJson.colors[bgKey])
              )
            }
          }
        }
      })
    }

    // 处理语法高亮颜色，确保与编辑器背景对比
    if (themeJson.tokenColors && themeJson.colors['editor.background']) {
      const editorLuminance = getLuminance(
        themeJson.colors['editor.background']
      )
      themeJson.tokenColors.forEach((token: any) => {
        if (token.settings && token.settings.foreground) {
          token.settings.foreground = getContrastingColor(editorLuminance)
        }
      })
    }

    // 处理通知弹窗样式
    if (themeJson.colors) {
      // 通知弹窗背景
      const notificationBg = getContrastingColor(0.5)
      themeJson.colors['notification.background'] = notificationBg
      // 通知弹窗文本
      themeJson.colors['notification.foreground'] = getContrastingColor(
        getLuminance(notificationBg)
      )
      // 通知边框
      themeJson.colors['notification.border'] = getContrastingColor(
        getLuminance(notificationBg)
      )
    }

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
