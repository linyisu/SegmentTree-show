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
  if (window.ModifyTreeVisualizer) {
    console.log('🔧 初始化区间修改可视化模块...');
    window.ModifyTreeVisualizer.initModifyTreeVisualizer();
  } else {
    console.log('❌ ModifyTreeVisualizer 模块未找到');
  }
  
  if (window.QueryTreeVisualizer) {
    console.log('🔍 初始化区间查询可视化模块...');
    window.QueryTreeVisualizer.initQueryTreeVisualizer();
  } else {
    console.log('❌ QueryTreeVisualizer 模块未找到');
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

  const themeButtons = document.querySelectorAll('.theme-option');
  let activeIndex = 0;
  themeButtons.forEach((button, index) => {
    if (button.dataset.theme === themeName) {
      button.classList.add('active');
      activeIndex = index;
    } else {
      button.classList.remove('active');
    }
  });

  updateSliderPosition(activeIndex); // 更新滑块位置
  
  // 通知查询和修改可视化更新节点样式
  if (window.updateQueryNodeStyles) {
    window.updateQueryNodeStyles();
  }
  if (window.updateModifyNodeStyles) {
    window.updateModifyNodeStyles();
  }
}

// 更新滑块位置的函数
function updateSliderPosition(activeIndex) {
  const slider = document.querySelector('.theme-slider');
  if (slider) {
    const buttonWidth = slider.parentElement.querySelector('.theme-option').offsetWidth;
    slider.style.transform = `translateX(${activeIndex * buttonWidth}px)`;
    // 更新滑块背景色以匹配当前主题的主色
    const currentThemeColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
    if (currentThemeColor) {
        slider.style.backgroundColor = currentThemeColor;
    }
  }
}

// 辅助函数，避免在循环中创建匿名函数导致潜在的重复监听器问题
function handleThemeButtonClick(event) {
    switchTheme(event.currentTarget.dataset.theme);
}

function initThemeSwitcher() {
  const savedTheme = localStorage.getItem('selectedTheme');
  const initialTheme = savedTheme || 'light'; // 默认主题为 'light'
  switchTheme(initialTheme); // 应用初始主题并更新滑块

  const themeButtons = document.querySelectorAll('.theme-option');
  themeButtons.forEach(button => {
    button.removeEventListener('click', handleThemeButtonClick); // 确保移除旧监听器
    button.addEventListener('click', handleThemeButtonClick);
  });

  // 首次加载时，确保滑块位置正确（在按钮渲染完毕后）
  // 使用 setTimeout 确保 offsetWidth 可用
  setTimeout(() => {
    const activeButton = document.querySelector('.theme-option.active');
    if (activeButton) {
        const activeIndex = Array.from(themeButtons).indexOf(activeButton);
        updateSliderPosition(activeIndex);
    }
  }, 0);
}
