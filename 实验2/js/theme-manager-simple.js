// 主题管理器 - 简化版
const ThemeManager = {
  currentTheme: 'light',
  
  // 初始化
  init() {
    console.log('主题管理器初始化...');
    this.loadSavedTheme();
    this.bindEvents();
    this.applyTheme(this.currentTheme);
  },
  
  // 加载保存的主题
  loadSavedTheme() {
    try {
      const saved = localStorage.getItem('theme');
      if (saved && ['light', 'dark', 'eye-care'].includes(saved)) {
        this.currentTheme = saved;
      }
    } catch (e) {
      console.warn('无法加载保存的主题');
    }
  },
  
  // 绑定事件
  bindEvents() {
    console.log('绑定主题切换事件...');
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('theme-option')) {
        const theme = e.target.getAttribute('data-theme');
        console.log('点击主题按钮:', theme);
        if (theme) {
          this.switchTheme(theme);
        }
      }
    });
  },
  
  // 切换主题
  switchTheme(theme) {
    console.log('切换主题到:', theme);
    if (!['light', 'dark', 'eye-care'].includes(theme)) {
      console.warn('无效主题:', theme);
      return;
    }
    
    this.currentTheme = theme;
    this.applyTheme(theme);
    this.saveTheme(theme);
    this.updateButtons(theme);
  },
  
  // 应用主题
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    console.log('主题已应用:', theme);
  },
  
  // 保存主题
  saveTheme(theme) {
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      console.warn('无法保存主题');
    }
  },
  
  // 更新按钮状态
  updateButtons(activeTheme) {
    const buttons = document.querySelectorAll('.theme-option');
    buttons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-theme') === activeTheme) {
        btn.classList.add('active');
      }
    });
  },
  
  // 获取当前主题
  getCurrentTheme() {
    return this.currentTheme;
  },
  
  // 主题变更事件
  onThemeChange(callback) {
    document.addEventListener('themeChanged', callback);
  }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}
