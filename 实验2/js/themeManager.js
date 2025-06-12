// filepath: c:\Users\acm\OneDrive\SegmentTree-show\实验2\js\themeManager.js
/* 主题管理模块 - 处理三种主题模式的切换 */

// 主题切换功能
function switchTheme(theme) {
      // 更新data-theme属性
      document.documentElement.setAttribute('data-theme', theme);
      
      // 更新按钮状态
      document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.remove('active');
      });
      document.querySelector(`[data-theme="${theme}"]`).classList.add('active');
      
      // 保存到localStorage
      localStorage.setItem('theme', theme);
      
      // 更新currentTheme变量
      currentTheme = theme;
    }