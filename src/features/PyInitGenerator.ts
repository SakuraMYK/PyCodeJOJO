import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

// 修改后的deleteAllInitFiles函数，增加删除文件总数统计
export async function deleteAllInitFiles (dirPath: string) {
  let deletedCount = 0 // 用于统计删除的文件数量

  function deleteRecursive (currentDir: string) {
    const items = fs.readdirSync(currentDir)

    items.forEach(item => {
      const fullPath = path.join(currentDir, item)
      const stats = fs.statSync(fullPath)

      // 如果是目录且不是特殊目录，递归处理子目录
      if (
        stats.isDirectory() &&
        item !== '__pycache__' &&
        item !== '.git' &&
        item !== '.vscode'
      ) {
        deleteRecursive(fullPath)
      }
      // 如果是__init__.py文件，删除它并计数
      else if (stats.isFile() && item === '__init__.py') {
        fs.unlinkSync(fullPath)
        console.log(`Deleted: ${fullPath}`)
        deletedCount++ // 每删除一个文件就增加计数
      }
    })
  }

  // 开始递归删除
  deleteRecursive(dirPath)

  // 打印删除的文件总数
  console.log(`Total __init__.py files deleted: ${deletedCount}`)
  // 也可以同时显示在VSCode消息提示中
  vscode.window.showInformationMessage(
    `Total __init__.py files deleted: ${deletedCount}`
  )
}

// 辅助函数：检查目录或其子目录中是否存在Python文件
function hasPythonFiles (dirPath: string): boolean {
  const items = fs.readdirSync(dirPath)

  // 检查当前目录是否有Python文件
  if (items.some(item => item.endsWith('.py') && item !== '__init__.py')) {
    return true
  }

  // 递归检查子目录
  for (const item of items) {
    const fullPath = path.join(dirPath, item)
    const stats = fs.statSync(fullPath)
    if (
      stats.isDirectory() &&
      item !== '__pycache__' &&
      item !== '.git' &&
      item !== '.vscode'
    ) {
      if (hasPythonFiles(fullPath)) {
        return true
      }
    }
  }

  return false
}

// 收集所有包含Python文件（包括子目录）的文件夹路径
function collectDirectories (dirPath: string): string[] {
  const dirs: string[] = []
  const items = fs.readdirSync(dirPath)

  items.forEach(item => {
    const fullPath = path.join(dirPath, item)
    const stats = fs.statSync(fullPath)

    if (
      stats.isDirectory() &&
      item !== '__pycache__' &&
      item !== '.git' &&
      item !== '.vscode'
    ) {
      // 只有当目录或其子目录包含Python文件时才加入结果
      if (hasPythonFiles(fullPath)) {
        dirs.push(fullPath)
      }
      // 递归收集子文件夹
      dirs.push(...collectDirectories(fullPath))
    }
  })

  return dirs
}

// 新增：显示文件夹选择框
async function selectFolders () {
  const editor = vscode.window.activeTextEditor
  if (!editor) {
    console.warn('selectFolders: No active editor found')
    return []
  }

  const documentUri = editor.document.uri
  const folderUri = vscode.workspace.getWorkspaceFolder(documentUri)
  if (!folderUri) {
    console.warn('selectFolders: File is not part of a workspace folder')
    return []
  }

  const rootPath = folderUri.uri.fsPath
  const allDirs = collectDirectories(rootPath)

  if (allDirs.length === 0) {
    vscode.window.showInformationMessage(
      'selectFolders: No valid directories found'
    )
    return []
  }

  // 转换为QuickPick选项（显示相对路径，便于用户识别）
  const options = allDirs.map(dir => ({
    label: path.relative(rootPath, dir), // 显示相对于工作区根目录的路径
    description: dir, // 完整路径作为描述
    picked: false // 默认不勾选
  }))

  // 显示多选框
  const selected = await vscode.window.showQuickPick(options, {
    canPickMany: true, // 允许多选
    title: 'select directories to generate __init__.py files', // 标题
    placeHolder: '选择要生成__init__.py文件的目录'
  })

  return selected ? selected.map(item => item.description) : []
}

export async function generateInitForSelectedDirs () {
  const selectedDirs = await selectFolders()
  if (selectedDirs.length === 0) return

  let generatedCount = 0 // 统计生成的文件数量

  // 对选中的文件夹执行操作（例如生成__init__.py）
  selectedDirs.forEach(dir => {
    const wasGenerated = generateInitFile(dir)
    if (wasGenerated) {
      generatedCount++
      vscode.window.showInformationMessage(`Generated: ${dir}`)
    } else {
      vscode.window.showInformationMessage(`No Python files found in: ${dir}`)
    }
  })

  // 打印并显示生成的文件总数
  vscode.window.showInformationMessage(
    `Total __init__.py files generated: ${generatedCount}`
  )
}

// 修改generateInitFile函数以返回是否生成了文件
function generateInitFile (dirPath: string): boolean {
  const items = fs.readdirSync(dirPath)
  const pyFiles = items.filter(
    item => item.endsWith('.py') && item !== '__init__.py'
  )

  if (pyFiles.length === 0) {
    return false // 没有Python文件，未生成
  }

  const imports: string[] = []
  const exportedClasses: string[] = []

  pyFiles.forEach(file => {
    const filePath = path.join(dirPath, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    const moduleName = path.basename(file, '.py')

    // 修改classMatches的正则表达式，只匹配顶级类
    const classMatches = content.match(/^(?<!#.*)\bclass\s+(\w+)/gm)
    if (classMatches) {
      classMatches.forEach(match => {
        const className = match.replace('class ', '')
        imports.push(`from .${moduleName} import ${className}`)
        exportedClasses.push(className)
      })
    }
  })

  if (imports.length > 0) {
    const uniqueImports = [...new Set(imports)]
    const uniqueExports = [...new Set(exportedClasses)]

    const allList = `__all__ = [\n  ${uniqueExports
      .map(cls => `'${cls}'`)
      .join(',\n  ')}\n]`

    const initContent = [...uniqueImports, '', allList].join('\n')
    const initPath = path.join(dirPath, '__init__.py')
    fs.writeFileSync(initPath, initContent)
    return true // 成功生成文件
  }

  return false // 没有可导出的类，未生成
}
