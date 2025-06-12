// 设置管理器
const SettingsManager = {
  settings: {},
  
  // 初始化设置
  init() {
    this.loadSettings();
    this.bindEvents();
    this.updateUI();
  },
  
  // 加载设置
  loadSettings() {
    const savedSettings = localStorage.getItem(CONFIG.STORAGE_KEYS.settings);
    this.settings = savedSettings ? 
      { ...CONFIG.DEFAULT_SETTINGS, ...JSON.parse(savedSettings) } : 
      { ...CONFIG.DEFAULT_SETTINGS };
  },
  
  // 保存设置
  saveSettings() {
    localStorage.setItem(CONFIG.STORAGE_KEYS.settings, JSON.stringify(this.settings));
  },
  
  // 绑定设置相关事件
  bindEvents() {
    // 字体大小滑块
    const fontSizeSlider = DOMManager.get('fontSizeSlider');
    if (fontSizeSlider) {
      fontSizeSlider.addEventListener('input', Utils.debounce((e) => {
        this.setSetting('fontSize', parseInt(e.target.value));
        this.updateFontSizeDisplay();
        this.applyCodeBlockSettings();
      }, 100));
    }
    
    // 行高滑块
    const lineHeightSlider = DOMManager.get('lineHeightSlider');
    if (lineHeightSlider) {
      lineHeightSlider.addEventListener('input', Utils.debounce((e) => {
        this.setSetting('lineHeight', parseFloat(e.target.value));
        this.updateLineHeightDisplay();
        this.applyCodeBlockSettings();
      }, 100));
    }
    
    // 动画速度
    const animationSpeed = DOMManager.get('animationSpeed');
    if (animationSpeed) {
      animationSpeed.addEventListener('change', (e) => {
        this.setSetting('animationSpeed', e.target.value);
      });
    }
    
    // 节点颜色
    const applyNodeColor = DOMManager.get('applyNodeColor');
    if (applyNodeColor) {
      applyNodeColor.addEventListener('click', () => {
        this.applyNodeColor();
      });
    }
    
    // 显示节点值
    const showValues = DOMManager.get('showValues');
    if (showValues) {
      showValues.addEventListener('change', (e) => {
        this.setSetting('showValues', e.target.checked);
        this.toggleNodeValues();
      });
    }
    
    // 导出设置
    const exportSettings = DOMManager.get('exportSettings');
    if (exportSettings) {
      exportSettings.addEventListener('click', () => {
        this.exportSettings();
      });
    }
    
    // 重置设置
    const resetSettings = DOMManager.get('resetSettings');
    if (resetSettings) {
      resetSettings.addEventListener('click', () => {
        this.resetSettings();
      });
    }
  },
  
  // 设置值
  setSetting(key, value) {
    this.settings[key] = value;
    this.saveSettings();
  },
  
  // 获取设置值
  getSetting(key) {
    return this.settings[key];
  },
  
  // 更新UI显示
  updateUI() {
    this.updateFontSizeDisplay();
    this.updateLineHeightDisplay();
    this.syncUIWithSettings();
  },
  
  // 更新字体大小显示
  updateFontSizeDisplay() {
    const display = DOMManager.get('fontSizeDisplay');
    const slider = DOMManager.get('fontSizeSlider');
    
    if (display && slider) {
      const fontSize = this.getSetting('fontSize') || CONFIG.DEFAULT_SETTINGS.fontSize;
      display.textContent = fontSize + 'px';
      slider.value = fontSize;
    }
  },
  
  // 更新行高显示
  updateLineHeightDisplay() {
    const display = DOMManager.get('lineHeightDisplay');
    const slider = DOMManager.get('lineHeightSlider');
    
    if (display && slider) {
      const lineHeight = this.getSetting('lineHeight') || CONFIG.DEFAULT_SETTINGS.lineHeight;
      display.textContent = lineHeight.toString();
      slider.value = lineHeight;
    }
  },
  
  // 同步UI与设置
  syncUIWithSettings() {
    // 动画速度
    const animationSpeed = DOMManager.get('animationSpeed');
    if (animationSpeed) {
      animationSpeed.value = this.getSetting('animationSpeed') || CONFIG.DEFAULT_SETTINGS.animationSpeed;
    }
    
    // 节点颜色
    const nodeColor = DOMManager.get('nodeColor');
    if (nodeColor) {
      nodeColor.value = this.getSetting('nodeColor') || CONFIG.DEFAULT_SETTINGS.nodeColor;
    }
    
    // 显示节点值
    const showValues = DOMManager.get('showValues');
    if (showValues) {
      showValues.checked = this.getSetting('showValues') !== false;
    }
  },
  
  // 应用代码块设置
  applyCodeBlockSettings() {
    const fontSize = this.getSetting('fontSize') || CONFIG.DEFAULT_SETTINGS.fontSize;
    const lineHeight = this.getSetting('lineHeight') || CONFIG.DEFAULT_SETTINGS.lineHeight;
    
    const codeBlocks = document.querySelectorAll('.code-block');
    codeBlocks.forEach(block => {
      block.style.fontSize = fontSize + 'px';
      block.style.lineHeight = lineHeight.toString();
    });
    
    // 更新CSS变量
    document.documentElement.style.setProperty('--font-size-base', fontSize + 'px');
    document.documentElement.style.setProperty('--line-height-base', lineHeight.toString());
  },
  
  // 应用节点颜色
  applyNodeColor() {
    const nodeColor = DOMManager.get('nodeColor');
    if (!nodeColor) return;
    
    const color = nodeColor.value;
    this.setSetting('nodeColor', color);
    
    // 应用颜色到树节点
    TreeVisualizer.setNodeColor(color);
    
    Utils.showNotification('节点颜色已应用', 'success');
  },
  
  // 切换节点值显示
  toggleNodeValues() {
    const showValues = this.getSetting('showValues');
    const treeNodes = document.querySelectorAll('.tree-node');
    
    treeNodes.forEach(node => {
      node.style.display = showValues ? 'flex' : 'none';
    });
  },
  
  // 导出设置
  exportSettings() {
    const settingsData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      settings: this.settings,
      theme: ThemeManager.getCurrentTheme(),
      deviceInfo: Utils.getDeviceInfo()
    };
    
    const jsonString = JSON.stringify(settingsData, null, 2);
    const filename = `segment-tree-settings-${Utils.formatDate()}.json`;
    
    Utils.downloadFile(jsonString, filename, 'application/json');
    Utils.showNotification('设置已导出', 'success');
  },
  
  // 导入设置
  async importSettings(file) {
    try {
      const content = await Utils.readFile(file);
      const settingsData = JSON.parse(content);
      
      if (settingsData.settings) {
        this.settings = { ...CONFIG.DEFAULT_SETTINGS, ...settingsData.settings };
        this.saveSettings();
        this.updateUI();
        this.applyCodeBlockSettings();
        
        if (settingsData.theme) {
          ThemeManager.switchTheme(settingsData.theme);
        }
        
        Utils.showNotification('设置已导入', 'success');
      } else {
        throw new Error('无效的设置文件格式');
      }
    } catch (error) {
      console.error('导入设置失败:', error);
      Utils.showNotification('导入设置失败: ' + error.message, 'error');
    }
  },
  
  // 重置设置
  resetSettings() {
    if (!confirm('确定要重置所有设置吗？此操作不可撤销。')) {
      return;
    }
    
    // 重置到默认值
    this.settings = { ...CONFIG.DEFAULT_SETTINGS };
    this.saveSettings();
    
    // 重置主题
    ThemeManager.resetToDefault();
    
    // 更新UI
    this.updateUI();
    this.applyCodeBlockSettings();
    
    // 清除树形可视化
    TreeVisualizer.clearVisualization();
    
    Utils.showNotification('设置已重置', 'success');
  },
  
  // 获取所有设置
  getAllSettings() {
    return { ...this.settings };
  },
  
  // 批量设置
  setMultiple(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    this.updateUI();
  },
  
  // 验证设置值
  validateSetting(key, value) {
    switch (key) {
      case 'fontSize':
        return Utils.validateRange(value, 10, 24);
      case 'lineHeight':
        return value >= 1.0 && value <= 3.0;
      case 'animationSpeed':
        return ['slow', 'normal', 'fast'].includes(value);
      case 'nodeColor':
        return /^#[0-9A-F]{6}$/i.test(value);
      case 'showValues':
        return typeof value === 'boolean';
      default:
        return true;
    }
  },
  
  // 监听设置变更
  onSettingChange(callback) {
    document.addEventListener('settingChanged', callback);
  },
  
  // 触发设置变更事件
  dispatchSettingChangeEvent(key, value) {
    const event = new CustomEvent('settingChanged', {
      detail: { key, value, timestamp: Date.now() }
    });
    document.dispatchEvent(event);
  }
};

// 导出设置管理器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SettingsManager;
}
