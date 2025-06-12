// 主题管理器
const ThemeManager = {
  currentTheme: 'light',
  
  // 初始化主题系统
  init() {
    console.log('主题管理器初始化...');
    this.loadSavedTheme();
    this.bindEvents();
    this.applyTheme(this.currentTheme);
  },
  
  // 加载保存的主题
  loadSavedTheme() {
    const savedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.theme);
    if (savedTheme && ['light', 'dark', 'eye-care'].includes(savedTheme)) {
      this.currentTheme = savedTheme;
    }
  },
  
  // 绑定主题切换事件
  bindEvents() {
    // 使用事件委托监听主题按钮点击
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('theme-option')) {
        const theme = e.target.getAttribute('data-theme');
        if (theme) {
          this.switchTheme(theme);
        }
      }
    });
  },
  
  // 切换主题
  switchTheme(theme) {
    if (!['light', 'dark', 'eye-care'].includes(theme)) {
      console.warn('无效的主题:', theme);
      return;
    }
    
    this.currentTheme = theme;
    this.applyTheme(theme);
    this.saveTheme(theme);
    this.updateThemeButtons(theme);
    this.dispatchThemeChangeEvent(theme);
  },
  
  // 应用主题
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${theme}`);
  },
  
  // 保存主题到本地存储
  saveTheme(theme) {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.theme, theme);
    } catch (error) {
      console.warn('保存主题失败:', error);
    }
  },
  
  // 更新主题按钮状态
  updateThemeButtons(activeTheme) {
    const themeButtons = document.querySelectorAll('.theme-option');
    themeButtons.forEach(button => {
      button.classList.remove('active');
      if (button.getAttribute('data-theme') === activeTheme) {
        button.classList.add('active');
      }
    });
  },
  
  // 获取当前主题
  getCurrentTheme() {
    return this.currentTheme;
  },
  
  // 重置到默认主题
  resetToDefault() {
    this.switchTheme('light');
  },
  
  // 触发主题变更事件
  dispatchThemeChangeEvent(theme) {
    const event = new CustomEvent('themeChanged', {
      detail: { theme, timestamp: Date.now() }
    });
    document.dispatchEvent(event);
  },
  
  // 监听主题变更事件
  onThemeChange(callback) {
    document.addEventListener('themeChanged', callback);
  },
  
  // 获取所有可用主题
  getAvailableThemes() {
    return [
      { id: 'light', name: '白天模式', icon: '☀️' },
      { id: 'dark', name: '黑夜模式', icon: '🌙' },
      { id: 'eye-care', name: '护眼模式', icon: '🌿' }
    ];
  },
  
  // 根据时间自动切换主题
  autoSwitchByTime() {
    const hour = new Date().getHours();
    let autoTheme = 'light';
    
    if (hour >= 18 || hour <= 6) {
      autoTheme = 'dark';
    } else if (hour >= 7 && hour <= 17) {
      autoTheme = 'light';
    }
    
    this.switchTheme(autoTheme);
    Utils.showNotification(`已根据时间自动切换到${this.getThemeName(autoTheme)}`, 'info');
  },
  
  // 获取主题名称
  getThemeName(theme) {
    const themes = this.getAvailableThemes();
    const themeInfo = themes.find(t => t.id === theme);
    return themeInfo ? themeInfo.name : theme;
  }
};

// 导出主题管理器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}
  loadSavedTheme() {
    const savedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.theme) || CONFIG.DEFAULT_SETTINGS.theme;
    this.switchTheme(savedTheme);
  },
  
  // 绑定主题切换事件
  bindEvents() {
    DOMManager.addEventListener('themeOptions', 'click', (e) => {
      const theme = e.target.getAttribute('data-theme');
      if (theme) {
        this.switchTheme(theme);
      }
    });
  },
  
  // 切换主题
  switchTheme(theme) {
    if (!this.isValidTheme(theme)) {
      console.warn(`无效的主题: ${theme}`);
      return;
    }
    
    // 更新HTML属性
    document.documentElement.setAttribute('data-theme', theme);
    
    // 更新按钮状态
    this.updateThemeButtons(theme);
    
    // 保存到本地存储
    localStorage.setItem(CONFIG.STORAGE_KEYS.theme, theme);
    
    // 更新当前主题
    this.currentTheme = theme;
    
    // 触发主题变更事件
    this.dispatchThemeChangeEvent(theme);
    
    console.log(`主题已切换到: ${theme}`);
  },
  
  // 验证主题是否有效
  isValidTheme(theme) {
    return ['light', 'dark', 'eye-care'].includes(theme);
  },
  
  // 更新主题按钮状态
  updateThemeButtons(activeTheme) {
    const themeOptions = DOMManager.get('themeOptions');
    if (!themeOptions) return;
    
    themeOptions.forEach(btn => {
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
  
  // 获取主题相关的CSS变量值
  getThemeVariable(variableName) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(`--${variableName}`)
      .trim();
  },
  
  // 设置主题相关的CSS变量
  setThemeVariable(variableName, value) {
    document.documentElement.style.setProperty(`--${variableName}`, value);
  },
  
  // 获取主题信息
  getThemeInfo() {
    return {
      current: this.currentTheme,
      available: ['light', 'dark', 'eye-care'],
      descriptions: {
        light: '白天模式 - 明亮清晰，适合白天使用',
        dark: '黑夜模式 - 深色背景，减少眼部疲劳',
        'eye-care': '护眼模式 - 护眼配色，长时间阅读更舒适'
      }
    };
  },
  
  // 应用自定义颜色（用于节点颜色等）
  applyCustomColor(colorVariable, colorValue) {
    this.setThemeVariable(colorVariable, colorValue);
  },
  
  // 重置到默认主题
  resetToDefault() {
    this.switchTheme(CONFIG.DEFAULT_SETTINGS.theme);
  },
  
  // 触发主题变更事件
  dispatchThemeChangeEvent(theme) {
    const event = new CustomEvent('themeChanged', {
      detail: { theme, timestamp: Date.now() }
    });
    document.dispatchEvent(event);
  },
  
  // 监听主题变更事件
  onThemeChange(callback) {
    document.addEventListener('themeChanged', callback);
  },
  
  // 根据时间自动切换主题
  autoSwitchByTime() {
    const hour = new Date().getHours();
    let theme;
    
    if (hour >= 6 && hour < 18) {
      theme = 'light';
    } else if (hour >= 18 && hour < 22) {
      theme = 'eye-care';
    } else {
      theme = 'dark';
    }
    
    this.switchTheme(theme);
  },
  
  // 根据系统偏好切换主题
  autoSwitchBySystem() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.switchTheme('dark');
    } else {
      this.switchTheme('light');
    }
  }
};

// 导出主题管理器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}
