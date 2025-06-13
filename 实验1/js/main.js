/* 主JavaScript文件 - 应用初始化和协调 */

// 应用初始化
document.addEventListener('DOMContentLoaded', () => {
  // 首先初始化主题切换，确保主题属性尽早设置
  initThemeSwitcher(); // <--- 移到此处并优先执行

  // 然后立即应用语法高亮
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

// 主题切换功能
function switchTheme(themeName) {
  document.documentElement.setAttribute('data-theme', themeName); // <--- 修改：应用到 documentElement
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

// 辅助函数，避免在循环中创建匿名函数导致潜在的重复监听器问题
function handleThemeButtonClick(event) {
    switchTheme(event.currentTarget.dataset.theme);
}

function initThemeSwitcher() {
  const savedTheme = localStorage.getItem('selectedTheme');
  if (savedTheme) {
    switchTheme(savedTheme);
  } else {
    // 默认主题（例如：白天模式）
    // 确保在没有保存主题时，也调用 switchTheme 来设置初始 data-theme
    switchTheme('light'); 
  }

  const themeButtons = document.querySelectorAll('.theme-option');
  themeButtons.forEach(button => {
    // 移除旧的监听器，以防 initThemeSwitcher 被意外多次调用（虽然在此处不太可能）
    button.removeEventListener('click', handleThemeButtonClick); 
    button.addEventListener('click', handleThemeButtonClick);
  });
}
