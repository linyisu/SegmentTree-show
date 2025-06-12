/* 主JavaScript文件 - 应用初始化和协调 */

// 应用初始化
document.addEventListener('DOMContentLoaded', () => {
  // 首先立即应用语法高亮
  if (window.SyntaxHighlighter) {
    window.SyntaxHighlighter.applyHighlighting();
  }
  
  // 初始化各个模块
  if (window.Navigation) {
    window.Navigation.initNavigation();
  }
  
  if (window.SettingsManager) {
    window.SettingsManager.initSettings();
  }
  
  if (window.TreeVisualizer) {
    window.TreeVisualizer.initTreeVisualizer();
  }
  
  if (window.Quiz) {
    window.Quiz.initQuiz();
  }
  
  // 设置延迟高亮监听
  if (window.SyntaxHighlighter) {
    window.SyntaxHighlighter.setupLazyHighlighting();
  }
});

// 全局函数（供HTML内联事件调用）
function showSection(id) {
  if (window.Navigation) {
    window.Navigation.showSection(id);
  }
}

function checkQuiz() {
  if (window.Quiz) {
    window.Quiz.checkQuiz();
  }
}

function applyNodeColor() {
  if (window.SettingsManager) {
    window.SettingsManager.applyNodeColor();
  }
}

function exportSettings() {
  if (window.SettingsManager && window.SettingsManager.Settings) {
    window.SettingsManager.Settings.export();
  }
}

function resetSettings() {
  if (window.SettingsManager && window.SettingsManager.Settings) {
    window.SettingsManager.Settings.reset();
  }
}
