import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
// 删除指定目录及其子目录下所有的__init__.py文件
function deleteInitFiles (dirPath: string) {
  const items = fs.readdirSync(dirPath)

  items.forEach(item => {
    const fullPath = path.join(dirPath, item)
    const stats = fs.statSync(fullPath)

    // 如果是目录且不是特殊目录，递归处理子目录
    if (
      stats.isDirectory() &&
      item !== '__pycache__' &&
      item !== '.git' &&
      item !== '.vscode'
    ) {
      deleteInitFiles(fullPath)
    }
    // 如果是__init__.py文件，删除它
    else if (stats.isFile() && item === '__init__.py') {
      fs.unlinkSync(fullPath)
      vscode.window.showInformationMessage(`Deleted: ${fullPath}`)
    }
  })
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
    vscode.window.showWarningMessage('No active editor found')
    return []
  }

  const documentUri = editor.document.uri
  const folderUri = vscode.workspace.getWorkspaceFolder(documentUri)
  if (!folderUri) {
    vscode.window.showWarningMessage('File is not part of a workspace folder')
    return []
  }

  const rootPath = folderUri.uri.fsPath
  const allDirs = collectDirectories(rootPath)

  if (allDirs.length === 0) {
    vscode.window.showInformationMessage('No valid directories found')
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
    title: 'Select directories to process' // 标题
  })

  return selected ? selected.map(item => item.description) : []
}

// 修改原函数，使用选择的文件夹
export async function processSelectedFolders () {
  const selectedDirs = await selectFolders()
  if (selectedDirs.length === 0) return

  // 对选中的文件夹执行操作（例如生成__init__.py）
  selectedDirs.forEach(dir => {
    generateInitFile(dir)
    vscode.window.showInformationMessage(`Processed: ${dir}`)
  })
}

// 新增函数：提取Python类名并生成__init__.py
function generateInitFile (dirPath: string) {
  const items = fs.readdirSync(dirPath)
  const pyFiles = items.filter(
    item => item.endsWith('.py') && item !== '__init__.py'
  )

  if (pyFiles.length === 0) {
    return
  }

  const imports: string[] = []

  // 读取所有Python文件并提取类名，关联文件名
  pyFiles.forEach(file => {
    const filePath = path.join(dirPath, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    // 提取文件名（不含扩展名）作为模块名
    const moduleName = path.basename(file, '.py')

    // 匹配类定义（排除注释中的类定义）
    const classMatches = content.match(/(?<!#.*)\bclass\s+(\w+)/g)
    if (classMatches) {
      classMatches.forEach(match => {
        const className = match.replace('class ', '')
        // 从模块（文件）中导入类
        imports.push(`from .${moduleName} import ${className}`)
      })
    }
  })

  // 去重并生成__init__.py内容
  if (imports.length > 0) {
    const uniqueImports = [...new Set(imports)] // 避免重复导入
    const initContent = uniqueImports.join('\n')
    const initPath = path.join(dirPath, '__init__.py')
    fs.writeFileSync(initPath, initContent)
  }
}

export async function printCurrentFolderPath () {
  const editor = vscode.window.activeTextEditor

  if (!editor) {
    console.warn('No active editor found')
    return
  }

  const documentUri = editor.document.uri
  const folderUri = vscode.workspace.getWorkspaceFolder(documentUri)

  if (!folderUri) {
    console.warn('File is not part of a workspace folder')
    return
  }

  const folderPath = folderUri.uri.fsPath
  generateInitFile(folderPath) // 调用新函数生成__init__.py
  processSelectedFolders()
}
