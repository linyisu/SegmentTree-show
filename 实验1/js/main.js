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

  // 初始化主题切换
  initThemeSwitcher();

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

// 主题切换功能
function switchTheme(themeName) {
  document.body.setAttribute('data-theme', themeName);
  localStorage.setItem('selectedTheme', themeName); // 保存用户选择

  // 更新按钮的 active状态
  const themeButtons = document.querySelectorAll('.theme-option');
  themeButtons.forEach(button => {
    if (button.dataset.theme === themeName) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
}

function initThemeSwitcher() {
  const savedTheme = localStorage.getItem('selectedTheme');
  if (savedTheme) {
    switchTheme(savedTheme);
  } else {
    // 默认主题（例如：白天模式）
    switchTheme('light');
  }

  // 为按钮添加事件监听（如果它们是动态添加的，或者确保在DOM加载后执行）
  const themeButtons = document.querySelectorAll('.theme-option');
  themeButtons.forEach(button => {
    button.addEventListener('click', () => switchTheme(button.dataset.theme));
  });
}
