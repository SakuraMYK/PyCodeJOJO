import vscode from "vscode";

const config = vscode.workspace.getConfiguration();

export function choseTheme() {
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
    vscode.window.showErrorMessage(
      "No themes found in PyJOJO extension package.json"
    );
  }

  // 保存当前主题，以便取消时恢复
  const currentTheme = config.get<string>(
    "workbench.colorTheme",
    "Default Dark+"
  );

  const quickPick = vscode.window.createQuickPick();
  quickPick.items = items;
  quickPick.placeholder =
    "↑↓ chose a PyCodeJOJO theme, Enter confirm, Esc cancel";
  quickPick.ignoreFocusOut = true;
  quickPick.matchOnDescription = false;
  quickPick.matchOnDetail = false;
  quickPick.canSelectMany = false;

  // 监听选择变化事件 - 实时切换主题
  quickPick.onDidChangeActive((items) => {
    if (items.length > 0) {
      const selectedItem = items[0];
      themeUpdate(selectedItem.label);
    }
  });

  // 监听确认选择事件
  quickPick.onDidAccept(() => quickPick.dispose());

  // 监听取消事件 - 恢复原主题
  quickPick.onDidHide(() => {
    if (quickPick.selectedItems.length === 0) {
      // 用户取消了选择，恢复原主题
      themeUpdate(currentTheme);
    }
    quickPick.dispose();
  });

  quickPick.show();
}

export function themeUpdate(value: string) {
  config.update(
    "workbench.colorTheme",
    value,
    vscode.ConfigurationTarget.Global
  );
  config.update("Pycodejojo.Theme", value, vscode.ConfigurationTarget.Global);
}
