import vscode from "vscode";

export function changeTheme() {
  // 获取当前扩展实例
  const extension = vscode.extensions.getExtension("PyJOJO.pycodejojo");

  // 动态读取主题列表
  const items =
    extension?.packageJSON?.contributes?.themes?.map((theme: any) => ({
      label: theme.label,
    })) || [];

  // 如果没有找到主题，显示错误信息
  if (items.length === 0) {
    items.push({
      label: "Default Dark+",
    });
  }

  const config = vscode.workspace.getConfiguration();

  // 保存当前主题，以便取消时恢复
  const currentTheme = config.get("workbench.colorTheme");

  const quickPick = vscode.window.createQuickPick();
  quickPick.items = items;
  quickPick.placeholder = "↑↓ choose a theme, ESC cancel";
  quickPick.ignoreFocusOut = true;
  quickPick.matchOnDescription = false;
  quickPick.matchOnDetail = false;
  quickPick.canSelectMany = false;

  // 监听选择变化事件 - 实时切换主题
  quickPick.onDidChangeActive(async (items) => {
    if (items.length > 0) {
      const selectedItem = items[0];
      const themeId = selectedItem.label;
      await config.update(
        "workbench.colorTheme",
        themeId,
        vscode.ConfigurationTarget.Global
      );
    }
  });

  // 监听确认选择事件
  quickPick.onDidAccept(() => quickPick.dispose());

  // 监听取消事件 - 恢复原主题
  quickPick.onDidHide(() => {
    if (quickPick.selectedItems.length === 0) {
      // 用户取消了选择，恢复原主题
      config.update(
        "workbench.colorTheme",
        currentTheme,
        vscode.ConfigurationTarget.Global
      );
    }
    quickPick.dispose();
  });

  quickPick.show();
}
