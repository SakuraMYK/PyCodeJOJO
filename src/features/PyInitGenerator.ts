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

  // 也可以同时显示在VSCode消息提示中
  vscode.window.showInformationMessage(
    `🗑️ Total __init__.py files deleted: ${deletedCount}`
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

export async function generateInitForSelectedDirs () {
  const selectedDirs = await selectFolders()
  if (selectedDirs.length === 0) return

  // 获取工作区根目录（与selectFolders保持一致）
  if (!vscode.workspace.workspaceFolders?.length) {
    vscode.window.showErrorMessage('No workspace folders found')
    return
  }
  const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath

  let generatedCount = 0

  // 拼接完整路径后再处理
  selectedDirs.forEach(relativeDir => {
    const fullDirPath = path.join(rootPath, relativeDir)
    const wasGenerated = generateInitFile(fullDirPath)
    if (wasGenerated) {
      generatedCount++
    }
  })

  vscode.window.showInformationMessage(
    `✅ Traversed ${selectedDirs.length} directories, successfully generated ${generatedCount} __init__.py files`
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

async function selectFolders () {
  if (vscode.workspace.workspaceFolders?.length === 0) {
    console.warn('selectFolders: No workspace folders found')
    return []
  }

  const rootPath = vscode.workspace.workspaceFolders![0].uri.fsPath
  const allDirs = collectDirectories(rootPath)

  if (allDirs.length === 0) {
    vscode.window.showInformationMessage(
      '📁 No valid directories found (no Python files detected)'
    )
    return []
  }

  // 构建目录层级结构
  interface DirNode {
    path: string
    name: string
    children: DirNode[]
    depth: number
  }

  // 根节点作为虚拟父节点
  const rootNode: DirNode = {
    path: rootPath,
    name: path.basename(rootPath),
    children: [],
    depth: -1
  }

  // 构建目录树
  allDirs.forEach(dir => {
    let currentNode = rootNode
    const relativePath = path.relative(rootPath, dir)
    const pathParts = relativePath.split(path.sep)

    pathParts.forEach((part, index) => {
      const fullPath = path.join(rootPath, ...pathParts.slice(0, index + 1))
      let child = currentNode.children.find(c => c.name === part)

      if (!child) {
        child = {
          path: fullPath,
          name: part,
          children: [],
          depth: index
        }
        currentNode.children.push(child)
      }

      currentNode = child
    })
  })

  // 递归生成树状结构选项
  const options: vscode.QuickPickItem[] = []
  // 修改 selectFolders 函数中的 traverseNode 方法
  function traverseNode (
    node: DirNode,
    isLastChild: boolean = false,
    prefix: string = ''
  ) {
    if (node.depth >= 0) {
      // 跳过虚拟根节点
      const icon = '📂'
      // 根节点的子元素（depth=0）不添加前缀空格，确保与第一行对齐
      const depthPrefix =
        node.depth === 0 ? '' : prefix + (isLastChild ? '└─' : '├─')

      options.push({
        label: `${depthPrefix}${icon} ${node.name}`,
        description: path.relative(rootPath, node.path),
        picked: false
      })
    }

    // 处理子节点前缀：根节点的子元素不加前缀空格
    const childPrefix =
      node.depth === -1
        ? ''
        : node.depth === 0
        ? ''
        : prefix + (isLastChild ? '  ' : '│ ')

    // 递归处理子节点
    node.children.forEach((child, index) => {
      const isLast = index === node.children.length - 1
      traverseNode(child, isLast, childPrefix)
    })
  }
  // 从根节点开始遍历生成选项
  traverseNode(rootNode)

  // 显示多选框
  const selected = await vscode.window.showQuickPick(options, {
    canPickMany: true,
    title: 'Select directories to generate __init__.py files',
    placeHolder: '选择要生成__init__.py文件的目录'
  })

  return selected ? selected.map(item => item.description!) : []
}
