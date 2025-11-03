import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

let firstRun = true

/**
 * 颜色系统核心类 - 提供和谐配色方案
 */
class ColorSystem {
  private baseHue: number // 基础色相 (0-360)
  private saturation: number // 饱和度 (0-100)
  private lightnessRange: [number, number] // 亮度范围 [min, max] (0-100)
  private isDarkTheme: boolean // 判断是否为深色主题

  constructor (isDark: boolean = true) {
    this.isDarkTheme = isDark
    // 随机基础色相，避开不适合代码编辑器的极端颜色
    const safeHues = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
    this.baseHue =
      safeHues[Math.floor(Math.random() * safeHues.length)] + Math.random() * 30

    // 根据主题明暗调整饱和度范围
    this.saturation = this.isDarkTheme
      ? 30 + Math.random() * 40
      : 20 + Math.random() * 30

    // 根据主题明暗调整亮度范围
    this.lightnessRange = this.isDarkTheme ? [10, 90] : [30, 100]
  }

  /**
   * 生成主色调（用于主要UI元素）
   */
  getPrimaryColor (): string {
    return this.hsvToHex(
      this.baseHue,
      this.saturation,
      this.isDarkTheme ? 50 : 40 // 中等亮度
    )
  }

  /**
   * 生成辅助色（用于强调元素）
   * 使用互补色（色相+180度）
   */
  getSecondaryColor (): string {
    const complementaryHue = (this.baseHue + 180) % 360
    return this.hsvToHex(
      complementaryHue,
      this.saturation,
      this.isDarkTheme ? 60 : 50 // 稍亮一些
    )
  }

  /**
   * 生成背景色（暗色调）
   */
  getBackgroundColor (): string {
    return this.hsvToHex(
      this.baseHue,
      this.saturation * 0.3, // 降低饱和度
      this.isDarkTheme
        ? this.lightnessRange[0] + Math.random() * 10 // 10-20% 亮度 (深色)
        : this.lightnessRange[1] - Math.random() * 15 // 85-100% 亮度 (浅色)
    )
  }

  /**
   * 生成前景色（文本等）
   */
  getForegroundColor (): string {
    return this.hsvToHex(
      this.baseHue,
      this.saturation * 0.2, // 低饱和度
      this.isDarkTheme
        ? this.lightnessRange[1] - Math.random() * 10 // 80-90% 亮度 (深色背景)
        : 20 + Math.random() * 10 // 20-30% 亮度 (浅色背景，降低亮度使文字更深)
    )
  }
  /**
   * 生成强调色（用于特殊标记、选中状态等）
   */
  getAccentColor (): string {
    const offset = (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 10)
    const accentHue = (this.baseHue + offset + 360) % 360
    return this.hsvToHex(
      accentHue,
      Math.min(100, this.saturation + 10), // 稍高饱和度
      this.isDarkTheme ? 70 : 60 // 较高亮度
    )
  }

  /**
   * 生成中性色（用于边框、分割线等）
   */
  getNeutralColor (): string {
    return this.hsvToHex(
      this.baseHue,
      this.saturation * 0.1, // 极低饱和度
      this.isDarkTheme
        ? 20 + Math.random() * 30 // 20-50% 亮度 (深色)
        : 50 + Math.random() * 30 // 50-80% 亮度 (浅色)
    )
  }

  /**
   * 生成语法高亮色
   */
  getSyntaxColor (variation: number = 0): string {
    const hueOffset = (variation * 60) % 360
    const hue = (this.baseHue + hueOffset + 360) % 360

    // 增强对比度的亮度计算
    let lightness: number
    if (this.isDarkTheme) {
      // 深色背景下使用更高亮度（70-90%）确保文字清晰
      lightness = 70 + Math.random() * 20
    } else {
      // 浅色背景下使用更低亮度（20-40%）增强对比度
      lightness = 20 + Math.random() * 20
    }

    return this.hsvToHex(hue, this.saturation + 5, lightness)
  }
  // 新增对比度检查辅助方法（可选，用于更严格的验证）
  public ensureContrast (hexColor: string, bgHex: string): string {
    const fgLightness = hexToLightness(hexColor)
    const bgLightness = hexToLightness(bgHex)

    // 计算对比度
    const contrast =
      (Math.max(fgLightness, bgLightness) + 0.05) /
      (Math.min(fgLightness, bgLightness) + 0.05)

    // 如果对比度低于4.5:1则调整
    if (contrast < 4.5) {
      const hsv = this.hexToHsv(hexColor)
      hsv.v = this.isDarkTheme ? 90 : 20 // 强制使用最高对比度值
      return this.hsvToHex(hsv.h, hsv.s, hsv.v)
    }
    return hexColor
  }

  /**
   * HSV转十六进制颜色
   */
  public hsvToHex (h: number, s: number, v: number): string {
    s /= 100
    v /= 100

    const c = v * s
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = v - c

    let r = 0,
      g = 0,
      b = 0

    if (h >= 0 && h < 60) {
      r = c
      g = x
      b = 0
    } else if (h >= 60 && h < 120) {
      r = x
      g = c
      b = 0
    } else if (h >= 120 && h < 180) {
      r = 0
      g = c
      b = x
    } else if (h >= 180 && h < 240) {
      r = 0
      g = x
      b = c
    } else if (h >= 240 && h < 300) {
      r = x
      g = 0
      b = c
    } else if (h >= 300 && h < 360) {
      r = c
      g = 0
      b = x
    }

    const toHex = (component: number) => {
      const hex = Math.round((component + m) * 255).toString(16)
      return hex.padStart(2, '0')
    }

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }

  /**
   * 根据颜色用途获取对应颜色
   */
  getColorByKey (key: string): string {
    // 详细的颜色映射表，覆盖所有你提供的键
    const keyMap: Record<string, () => string> = {
      // 背景相关
      background: () => this.getBackgroundColor(),
      'editor.background': () => this.getBackgroundColor(),
      'panel.background': () => this.getBackgroundColor(),
      'sideBar.background': () =>
        this.adjustColor(this.getBackgroundColor(), 5),
      'titleBar.activeBackground': () => this.getPrimaryColor(),
      'titleBar.inactiveBackground': () =>
        this.adjustColor(this.getPrimaryColor(), -10),
      'activityBar.background': () =>
        this.adjustColor(this.getPrimaryColor(), -15),
      'statusBar.background': () => this.getPrimaryColor(),
      'statusBar.noFolderBackground': () =>
        this.adjustColor(this.getPrimaryColor(), -10),
      'listFilterWidget.background': () =>
        this.adjustColor(this.getBackgroundColor(), 10),
      'notification.background': () => this.getBackgroundColor(),
      'textBlockQuote.background': () =>
        this.adjustColor(this.getBackgroundColor(), 10),
      'textCodeBlock.background': () =>
        this.adjustColor(this.getBackgroundColor(), 5),
      'textPreformat.background': () =>
        this.adjustColor(this.getBackgroundColor(), 5),
      'dropdown.background': () =>
        this.adjustColor(this.getBackgroundColor(), 10),
      'dropdown.listBackground': () =>
        this.adjustColor(this.getBackgroundColor(), 15),
      'input.background': () => this.adjustColor(this.getBackgroundColor(), 10),
      'checkbox.background': () =>
        this.adjustColor(this.getBackgroundColor(), 10),
      'button.background': () => this.getAccentColor(),
      'button.secondaryBackground': () =>
        this.adjustColor(this.getAccentColor(), -15),
      'badge.background': () => this.getAccentColor(),
      'inputValidation.errorBackground': () =>
        this.blendColors(this.getBackgroundColor(), '#ff0000', 0.1),
      'inputValidation.infoBackground': () =>
        this.blendColors(this.getBackgroundColor(), '#0000ff', 0.1),
      'inputValidation.warningBackground': () =>
        this.blendColors(this.getBackgroundColor(), '#ffff00', 0.1),
      'list.activeSelectionBackground': () =>
        this.blendColors(this.getBackgroundColor(), this.getAccentColor(), 0.2),
      'list.focusBackground': () =>
        this.blendColors(this.getBackgroundColor(), this.getAccentColor(), 0.1),
      'list.hoverBackground': () =>
        this.blendColors(
          this.getBackgroundColor(),
          this.getAccentColor(),
          0.15
        ),
      'list.inactiveSelectionBackground': () =>
        this.blendColors(this.getBackgroundColor(), this.getAccentColor(), 0.1),
      'scrollbarSlider.background': () =>
        this.blendColors(
          this.getBackgroundColor(),
          this.getForegroundColor(),
          0.2
        ),
      'scrollbarSlider.activeBackground': () =>
        this.blendColors(
          this.getBackgroundColor(),
          this.getForegroundColor(),
          0.4
        ),
      'scrollbarSlider.hoverBackground': () =>
        this.blendColors(
          this.getBackgroundColor(),
          this.getForegroundColor(),
          0.3
        ),
      'toolbar.hoverBackground': () =>
        this.blendColors(
          this.getBackgroundColor(),
          this.getForegroundColor(),
          0.1
        ),
      'toolbar.activeBackground': () =>
        this.blendColors(
          this.getBackgroundColor(),
          this.getForegroundColor(),
          0.2
        ),
      'inputOption.activeBackground': () =>
        this.blendColors(this.getBackgroundColor(), this.getAccentColor(), 0.2),

      // 前景相关
      foreground: () => this.getForegroundColor(),
      'editor.foreground': () => this.getForegroundColor(),
      'panel.foreground': () => this.getForegroundColor(),
      'titleBar.activeForeground': () => this.getForegroundColor(),
      'titleBar.inactiveForeground': () =>
        this.adjustColor(this.getForegroundColor(), -20),
      'activityBar.foreground': () => {
        // 为活动图标使用更高对比度的颜色
        const baseColor = this.getForegroundColor()
        return this.ensureContrast(
          baseColor,
          this.getColorByKey('activityBar.background')
        )
      },
      'activityBar.inactiveForeground': () => {
        // 为非活动图标调整亮度，但确保足够对比度
        const baseColor = this.adjustColor(this.getForegroundColor(), -10)
        return this.ensureContrast(
          baseColor,
          this.getColorByKey('activityBar.background')
        )
      },
      'activityBarBadge.foreground': () => this.getForegroundColor(),
      'statusBar.foreground': () => this.getForegroundColor(),
      'statusBar.noFolderForeground': () => this.getForegroundColor(),
      descriptionForeground: () =>
        this.adjustColor(this.getForegroundColor(), -10),
      errorForeground: () => this.adjustColor('#ff4444', 0),
      'icon.foreground': () => this.getForegroundColor(),
      'textLink.foreground': () => this.getAccentColor(),
      'textLink.activeForeground': () =>
        this.adjustColor(this.getAccentColor(), 10),
      'textPreformat.foreground': () => this.getForegroundColor(),
      'textSeparator.foreground': () => this.getNeutralColor(),
      'button.foreground': () => this.getForegroundColor(),
      'button.secondaryForeground': () => this.getForegroundColor(),
      'checkbox.foreground': () => this.getForegroundColor(),
      'dropdown.foreground': () => this.getForegroundColor(),
      'input.foreground': () => this.getForegroundColor(),
      'input.placeholderForeground': () =>
        this.adjustColor(
          this.getForegroundColor(),
          this.isDarkTheme ? -20 : -10
        ),
      'inputOption.activeForeground': () => this.getForegroundColor(),
      'inputValidation.errorForeground': () => this.adjustColor('#ff4444', 0),
      'inputValidation.infoForeground': () => this.adjustColor('#2196f3', 0),
      'inputValidation.warningForeground': () => this.adjustColor('#ffeb3b', 0),
      'badge.foreground': () => this.getForegroundColor(),
      'progressBar.background': () => this.getAccentColor(),
      'list.activeSelectionForeground': () => this.getForegroundColor(),
      'list.activeSelectionIconForeground': () => this.getForegroundColor(),
      'list.focusForeground': () => this.getForegroundColor(),
      'list.focusHighlightForeground': () => this.getAccentColor(),
      'list.highlightForeground': () => this.getAccentColor(),
      'list.hoverForeground': () => this.getForegroundColor(),
      'list.inactiveSelectionForeground': () => this.getForegroundColor(),
      'list.inactiveSelectionIconForeground': () => this.getForegroundColor(),
      'list.invalidItemForeground': () =>
        this.adjustColor(this.getForegroundColor(), -30),
      'list.errorForeground': () => this.adjustColor('#ff4444', 0),
      'list.warningForeground': () => this.adjustColor('#ffeb3b', 0),
      'notification.foreground': () => this.getForegroundColor(),

      // 边框相关
      'titleBar.border': () => this.getNeutralColor(),
      'titleBar.activeBorder': () => this.getAccentColor(),
      'activityBar.border': () => this.getNeutralColor(),
      contrastActiveBorder: () => this.getAccentColor(),
      contrastBorder: () => this.getNeutralColor(),
      focusBorder: () => this.getAccentColor(),
      'widget.border': () => this.getNeutralColor(),
      'sash.hoverBorder': () => this.getAccentColor(),
      'window.activeBorder': () => this.getNeutralColor(),
      'window.inactiveBorder': () =>
        this.adjustColor(this.getNeutralColor(), -20),
      'textBlockQuote.border': () => this.getAccentColor(),
      'toolbar.hoverOutline': () => this.getNeutralColor(),
      'button.border': () => this.getNeutralColor(),
      'button.separator': () => this.getNeutralColor(),
      'checkbox.border': () => this.getNeutralColor(),
      'checkbox.selectBorder': () => this.getAccentColor(),
      'dropdown.border': () => this.getNeutralColor(),
      'input.border': () => this.getNeutralColor(),
      'inputOption.activeBorder': () => this.getAccentColor(),
      'inputValidation.errorBorder': () => this.adjustColor('#ff4444', 0),
      'inputValidation.infoBorder': () => this.adjustColor('#2196f3', 0),
      'inputValidation.warningBorder': () => this.adjustColor('#ffeb3b', 0),
      'list.focusOutline': () => this.getNeutralColor(),
      'list.focusAndSelectionOutline': () => this.getNeutralColor(),
      'listFilterWidget.outline': () => this.getNeutralColor(),
      'listFilterWidget.noMatchesOutline': () => this.adjustColor('#ff4444', 0),
      'tree.indentGuidesStroke': () => this.getNeutralColor(),
      'tree.inactiveIndentGuidesStroke': () =>
        this.adjustColor(this.getNeutralColor(), -20),
      'notification.border': () => this.getNeutralColor(),

      // 其他
      'widget.shadow': () =>
        this.blendColors('#000000', this.getBackgroundColor(), 0.4),
      'scrollbar.shadow': () =>
        this.blendColors('#834444', this.getBackgroundColor(), 0.3),
      'list.dropBackground': () =>
        this.blendColors(this.getAccentColor(), '#ffffff', 0.3),
      'listFilterWidget.shadow': () =>
        this.blendColors('#000000', this.getBackgroundColor(), 0.2)
    }

    // 如果有匹配的用途键则使用对应颜色，否则使用随机和谐色
    return keyMap[key] ? keyMap[key]() : this.getRandomHarmoniousColor()
  }

  /**
   * 调整颜色亮度
   */
  public adjustColor (hex: string, percent: number): string {
    // 解析hex为HSV
    const hsv = this.hexToHsv(hex)
    // 调整亮度
    hsv.v = Math.max(0, Math.min(100, hsv.v + percent))
    // 转回hex
    return this.hsvToHex(hsv.h, hsv.s, hsv.v)
  }

  /**
   * 混合两种颜色
   */
  private blendColors (color1: string, color2: string, ratio: number): string {
    // 解析颜色为RGB
    const rgb1 = this.hexToRgb(color1)
    const rgb2 = this.hexToRgb(color2)

    // 混合颜色
    const r = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio)
    const g = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio)
    const b = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio)

    // 转回hex
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
  }

  /**
   * 十六进制转RGB
   */
  private hexToRgb (hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : { r: 0, g: 0, b: 0 }
  }

  /**
   * 十六进制转HSV
   */
  public hexToHsv (hex: string): { h: number; s: number; v: number } {
    const rgb = this.hexToRgb(hex)
    const r = rgb.r / 255
    const g = rgb.g / 255
    const b = rgb.b / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0,
      s = 0
    const v = max

    const d = max - min
    s = max === 0 ? 0 : d / max

    if (max === min) {
      h = 0 // 灰色
    } else {
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0)
          break
        case g:
          h = (b - r) / d + 2
          break
        case b:
          h = (r - g) / d + 4
          break
      }
      h *= 60
    }

    return { h, s: s * 100, v: v * 100 }
  }

  /**
   * 生成与主色调和谐的随机颜色
   */
  private getRandomHarmoniousColor (): string {
    // 在基础色相±60度范围内生成和谐色
    const hueOffset = (Math.random() - 0.5) * 120
    const hue = (this.baseHue + hueOffset + 360) % 360
    const lightness = this.isDarkTheme
      ? 30 + Math.random() * 50 // 30-80% 亮度 (深色)
      : 40 + Math.random() * 40 // 40-80% 亮度 (浅色)

    return this.hsvToHex(hue, this.saturation, lightness)
  }
}

/**
 * 递归替换对象中所有十六进制颜色值（使用和谐配色系统）
 */
function replaceColorsInObject (
  obj: any,
  colorSystem: ColorSystem,
  key: string = ''
): any {
  // 处理null和非对象类型
  if (obj === null || typeof obj !== 'object') {
    // 检查是否为十六进制颜色字符串
    if (typeof obj === 'string' && /^#([0-9A-Fa-f]{3}){1,2}$/.test(obj)) {
      return colorSystem.getColorByKey(key)
    }
    return obj
  }

  // 处理数组
  if (Array.isArray(obj)) {
    // 特殊处理tokenColors数组
    if (key.endsWith('tokenColors')) {
      return obj.map((item, index) => {
        // 为不同的语法标记生成不同的颜色变化
        const variation = index % 6 // 6种基本变化
        return replaceTokenColor(item, colorSystem, variation)
      })
    }
    return obj.map((item, index) =>
      replaceColorsInObject(item, colorSystem, `${key}[${index}]`)
    )
  }

  // 处理对象类型
  const newObj: any = { ...obj } // 创建对象副本而非新对象，避免丢失属性
  for (const objKey in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, objKey)) {
      const nestedKey = key ? `${key}.${objKey}` : objKey
      newObj[objKey] = replaceColorsInObject(
        obj[objKey],
        colorSystem,
        nestedKey
      )
    }
  }
  return newObj
}

/**
 * 专门处理tokenColors中的颜色
 */
/**
 * 专门处理tokenColors中的颜色，增强变量名对比度
 */
function replaceTokenColor (
  token: any,
  colorSystem: ColorSystem,
  variation: number
): any {
  if (!token || typeof token !== 'object') return token

  const newToken = { ...token }

  // 统一处理settings中的颜色属性
  if (newToken.settings && typeof newToken.settings === 'object') {
    // 处理前景色并确保对比度
    if (
      typeof newToken.settings.foreground === 'string' &&
      /^#([0-9A-Fa-f]{3}){1,2}$/.test(newToken.settings.foreground)
    ) {
      let baseColor

      // 增强变量名的对比度 - 检测变量相关的语法标记
      const isVariable =
        token.name &&
        (token.name.includes('variable') ||
          token.name.includes('identifier') ||
          token.name.includes('property'))

      if (isVariable) {
        // 为变量使用更高对比度的颜色
        baseColor = colorSystem.getSyntaxColor(variation)
        const hsv = colorSystem.hexToHsv(baseColor)

        // 增加饱和度和亮度对比度
        hsv.s = Math.min(100, hsv.s + 15) // 提高饱和度
        if (colorSystem['isDarkTheme']) {
          hsv.v = Math.min(95, hsv.v + 10) // 深色主题提高亮度
        } else {
          hsv.v = Math.max(15, hsv.v - 10) // 浅色主题降低亮度
        }
        baseColor = colorSystem.hsvToHex(hsv.h, hsv.s, hsv.v)
      } else {
        baseColor = colorSystem.getSyntaxColor(variation)
      }

      // 强制确保变量名与背景的对比度至少为7:1（比标准更高）
      const minContrast = isVariable ? 7 : 4.5
      newToken.settings.foreground = ensureMinimumContrast(
        baseColor,
        colorSystem.getBackgroundColor(),
        minContrast,
        colorSystem
      )
    }

    // 处理背景色
    if (
      typeof newToken.settings.background === 'string' &&
      /^#([0-9A-Fa-f]{3}){1,2}$/.test(newToken.settings.background)
    ) {
      newToken.settings.background = colorSystem.adjustColor(
        colorSystem.getBackgroundColor(),
        5 + Math.random() * 10
      )
    }
  }

  return newToken
}

/**
 * 确保颜色间的最小对比度，特别是针对变量名
 */
function ensureMinimumContrast (
  fgHex: string,
  bgHex: string,
  minContrast: number,
  colorSystem: ColorSystem
): string {
  let currentContrast = calculateContrast(fgHex, bgHex)
  let hsv = colorSystem.hexToHsv(fgHex)
  const isDarkTheme = colorSystem['isDarkTheme']

  // 如果对比度不足，逐步调整直到达到要求
  while (currentContrast < minContrast) {
    if (isDarkTheme) {
      // 深色背景下提高前景色亮度
      hsv.v = Math.min(100, hsv.v + 2)
    } else {
      // 浅色背景下降低前景色亮度
      hsv.v = Math.max(0, hsv.v - 2)
    }

    // 同时略微提高饱和度增强辨识度
    hsv.s = Math.min(100, hsv.s + 1)

    fgHex = colorSystem.hsvToHex(hsv.h, hsv.s, hsv.v)
    currentContrast = calculateContrast(fgHex, bgHex)

    // 防止无限循环的安全机制
    if (hsv.v >= 100 || hsv.v <= 0) break
  }

  return fgHex
}

/**
 * 计算两种颜色的对比度（WCAG标准）
 */
function calculateContrast (fgHex: string, bgHex: string): number {
  const fgLightness = hexToLightness(fgHex)
  const bgLightness = hexToLightness(bgHex)

  return (
    (Math.max(fgLightness, bgLightness) + 0.05) /
    (Math.min(fgLightness, bgLightness) + 0.05)
  )
}

export async function randomizeThemeColors (context: vscode.ExtensionContext) {
  try {
    const extensionPath = context.extensionPath
    const themePath = path.join(extensionPath, 'themes', 'Random.json')

    // 检查主题文件是否存在
    if (!fs.existsSync(themePath)) {
      console.error(`主题文件未找到: ${themePath}`)
      vscode.window.showErrorMessage(`Theme file not found: ${themePath}`)
      return
    }

    // 读取原始主题内容作为备份
    const originalContent = fs.readFileSync(themePath, 'utf8')
    if (!originalContent.trim()) {
      console.error(`主题文件内容为空: ${themePath}`)
      vscode.window.showErrorMessage(`Theme file is empty: ${themePath}`)
      return
    }

    // 尝试解析主题文件
    let themeJson
    try {
      themeJson = JSON.parse(originalContent)
    } catch (parseError) {
      console.error(`主题文件解析错误: ${(parseError as Error).message}`)
      vscode.window.showErrorMessage(`Theme file parsing error. Please check the JSON format`)
      return
    }

    // 检测是否为深色主题
    const isDarkTheme =
      themeJson.type === 'dark' ||
      (themeJson.colors &&
        themeJson.colors['editor.background'] &&
        hexToLightness(themeJson.colors['editor.background']) < 50)

    // 初始化颜色系统
    const colorSystem = new ColorSystem(isDarkTheme)

    // 使用颜色系统替换所有颜色
    const newThemeJson = replaceColorsInObject(themeJson, colorSystem)

    // 写回主题文件
    const newContent = JSON.stringify(newThemeJson, null, 2)
    if (!newContent.trim()) {
      // 如果新内容为空，恢复原始内容
      fs.writeFileSync(themePath, originalContent, 'utf8')
      console.error('生成的主题内容为空，已恢复原始内容')
      vscode.window.showErrorMessage('Generated theme content is empty, original content has been restored')
      return
    }

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

    vscode.window.showInformationMessage('Random theme has been updated')
  } catch (error) {
    console.error(
      `处理主题文件失败: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
    vscode.window.showErrorMessage('Error updating random theme. Please check the console')
  }
}

// 辅助函数：从hex颜色计算亮度
function hexToLightness (hex: string): number {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return 50

  const r = parseInt(result[1], 16) / 255
  const g = parseInt(result[2], 16) / 255
  const b = parseInt(result[3], 16) / 255

  // 计算相对亮度 (WCAG标准)
  const [R, G, B] = [r, g, b].map(component =>
    component <= 0.03928
      ? component / 12.92
      : Math.pow((component + 0.055) / 1.055, 2.4)
  )

  return (0.2126 * R + 0.7152 * G + 0.0722 * B) * 100
}
