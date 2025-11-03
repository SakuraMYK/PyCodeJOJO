import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

function printDirectories (dirPath: string, indent: string = '') {
  const items = fs.readdirSync(dirPath)

  items.forEach(item => {
    const fullPath = path.join(dirPath, item)
    const stats = fs.statSync(fullPath)

    if (stats.isDirectory() && item !== '__pycache__' && item !== '.git' && item !== '.vscode') {
      console.log(`${indent}📁 ${fullPath}`)
      printDirectories(fullPath, indent + '  ')
    }
  })
}

// 新增函数：提取Python类名并生成__init__.py
function generateInitFile (dirPath: string) {
  const items = fs.readdirSync(dirPath)
  const pyFiles = items.filter(
    item => item.endsWith('.py') && item !== '__init__.py'
  )

  if (pyFiles.length === 0) {
    return // 如果没有Python文件，直接返回
  }

  const classNames: string[] = []

  // 读取所有Python文件并提取类名
  pyFiles.forEach(file => {
    const filePath = path.join(dirPath, file)
    const content = fs.readFileSync(filePath, 'utf-8')

    // 使用正则表达式匹配类定义
    const classMatches = content.match(/(?<!#.*)\bclass\s+(\w+)/g)
    if (classMatches) {
      classMatches.forEach(match => {
        const className = match.replace('class ', '')
        classNames.push(className)
      })
    }
  })

  // 如果找到类名，生成__init__.py内容
  if (classNames.length > 0) {
    const initContent = classNames
      .map(name => `from .${name} import ${name}`)
      .join('\n')
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
  printDirectories(folderPath)
  generateInitFile(folderPath) // 调用新函数生成__init__.py
}
