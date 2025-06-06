import * as vscode from "vscode";

export async function getHoverInfo(
  event: vscode.TextEditorSelectionChangeEvent
) {
  const editor = event.textEditor;
  const position = event.selections[0].active;

  // 获取当前位置的词汇
  const wordRange = editor.document.getWordRangeAtPosition(position);
  if (wordRange) {
    const word = editor.document.getText(wordRange);

    try {
      // 获取悬浮窗信息
      const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
        "vscode.executeHoverProvider",
        editor.document.uri,
        position
      );

      if (hovers && hovers.length > 0) {
        hovers.forEach((hover, index) => {
          console.log(`--- Hover ${index + 1} ---`);
          hover.contents.forEach((content, contentIndex) => {
            if (content instanceof vscode.MarkdownString) {
              console.log(`Markdown内容 ${contentIndex + 1}:`, content.value);
            } else {
              console.log(`内容 ${contentIndex + 1}:`, content);
            }
          });
        });
      }
    } catch (error) {
      console.error("获取悬浮信息失败:", error);
    }

    // 显示悬浮窗
    vscode.commands.executeCommand("editor.action.showHover");
  }
}
