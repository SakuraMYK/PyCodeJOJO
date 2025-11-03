import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

/**
 * 递归遍历目录，删除所有名为__pycache__的文件夹
 * @param dirPath 当前遍历的目录路径
 * @param deletedCount 已删除的__pycache__文件夹计数（用于统计）
 */
function traverseAndDeletePycache (
  dirPath: string,
  deletedCount: { value: number }
): void {
  try {
    // 读取目录下所有条目（文件/文件夹），并获取类型信息（避免二次stat调用）
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)

      // 仅处理文件夹（文件直接忽略）
      if (entry.isDirectory()) {
        // 匹配__pycache__文件夹，执行删除
        if (entry.name === '__pycache__') {
          try {
            // 递归删除文件夹及所有内容（force=true忽略不存在的路径）
            fs.rmSync(fullPath, { recursive: true, force: true })
            deletedCount.value++
          } catch (deleteErr) {
            vscode.window.showErrorMessage(
              `Failed to delete: ${fullPath} - ${(deleteErr as Error).message}`
            )
          }
        } else {
          // 非__pycache__文件夹，继续递归遍历子目录
          traverseAndDeletePycache(fullPath, deletedCount)
        }
      }
    }
  } catch (traverseErr) {
    // 处理目录遍历错误（如权限不足）
    vscode.window.showErrorMessage(
      `Failed to access directory: ${dirPath} - ${
        (traverseErr as Error).message
      }`
    )
  }
}

/**
 * 主函数：启动工作区__pycache__文件夹清理流程
 */
export async function deleteAllPycacheFolders (): Promise<void> {
  // 1. 检查当前是否打开了VS Code工作区
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showErrorMessage('Please open a VS Code workspace first!')
    return
  }

  // 2. 获取工作区根路径（默认取第一个工作区）
  const rootPath = workspaceFolders[0].uri.fsPath
  const deletedCount = { value: 0 } // 用于统计删除数量（对象类型实现引用传递）

  traverseAndDeletePycache(rootPath, deletedCount)

  // 4. 清理完成，提示结果
  vscode.window.showInformationMessage(
    `Total deleted ${deletedCount.value} pycache folders`
  )
}

/**
 * 注册VS Code命令（供插件激活时调用）
 * @param context 插件上下文
 */
export function registerDeletePycacheCommand (
  context: vscode.ExtensionContext
): void {
  const disposable = vscode.commands.registerCommand(
    'extension.deleteAllPycache', // 命令ID（需在package.json中配置）
    deleteAllPycacheFolders
  )

  context.subscriptions.push(disposable)
}
