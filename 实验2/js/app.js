// 主应用入口文件
const App = {
  // 应用初始化状态
  initialized: false,
  
  // 启动应用
  init() {
    if (this.initialized) {
      console.warn('应用已经初始化');
      return;
    }
    
    console.log('🌲 线段树学习应用启动中...');
    
    // 检查浏览器兼容性
    this.checkBrowserCompatibility();
    
    // 初始化DOM管理器
    DOMManager.init();
    
    // 初始化各个模块
    this.initializeModules();
    
    // 绑定全局事件
    this.bindGlobalEvents();
    
    // 设置错误处理
    this.setupErrorHandling();
    
    // 应用初始设置
    this.applyInitialSettings();
    
    // 标记为已初始化
    this.initialized = true;
    
    console.log('✅ 线段树学习应用初始化完成');
    
    // 显示欢迎信息
    this.showWelcomeMessage();
  },
  
  // 检查浏览器兼容性
  checkBrowserCompatibility() {
    const features = Utils.checkFeatureSupport();
    
    if (!features.localStorage) {
      console.warn('浏览器不支持localStorage，某些功能可能无法正常工作');
    }
    
    if (!features.cssVariables) {
      console.warn('浏览器不支持CSS变量，样式可能显示异常');
    }
    
    // 检查是否为现代浏览器
    const isModernBrowser = 'fetch' in window && 'Promise' in window && 'Map' in window;
    if (!isModernBrowser) {
      Utils.showNotification(
        '检测到您使用的是较旧的浏览器，建议升级到最新版本以获得最佳体验', 
        'warning', 
        8000
      );
    }
  },
  
  // 初始化所有模块
  initializeModules() {
    try {
      // 按顺序初始化模块
      ThemeManager.init();
      SettingsManager.init();
      SyntaxHighlighter.init();
      TreeVisualizer.init();
      QuizManager.init();
      NavigationManager.init();
      
      console.log('所有模块初始化成功');
    } catch (error) {
      console.error('模块初始化失败:', error);
      Utils.showNotification('应用初始化时发生错误，某些功能可能无法正常工作', 'error');
    }
  },
  
  // 绑定全局事件
  bindGlobalEvents() {
    // 窗口调整大小事件
    window.addEventListener('resize', Utils.debounce(() => {
      this.handleWindowResize();
    }, 250));
    
    // 页面可见性变化
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });
    
    // 在线/离线状态
    window.addEventListener('online', () => {
      Utils.showNotification('网络连接已恢复', 'success');
    });
    
    window.addEventListener('offline', () => {
      Utils.showNotification('网络连接已断开，某些功能可能受限', 'warning');
    });
    
    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      this.handleGlobalKeyboard(e);
    });
    
    // 模块间通信事件
    this.setupModuleListeners();
  },
  
  // 设置模块间通信监听
  setupModuleListeners() {
    // 主题变更事件
    ThemeManager.onThemeChange((e) => {
      console.log('主题已变更为:', e.detail.theme);
      // 重新应用语法高亮以适应新主题
      SyntaxHighlighter.rehighlightAll();
    });
    
    // 章节变更事件
    NavigationManager.onSectionChange((e) => {
      console.log('章节已切换到:', e.detail.section);
      // 可以在这里添加分析跟踪等
    });
    
    // 设置变更事件
    SettingsManager.onSettingChange((e) => {
      console.log('设置已变更:', e.detail.key, '=', e.detail.value);
    });
  },
  
  // 处理窗口调整大小
  handleWindowResize() {
    // 可以在这里添加响应式调整逻辑
    const deviceInfo = Utils.getDeviceInfo();
    console.log('窗口大小已变更:', deviceInfo.viewportWidth, 'x', deviceInfo.viewportHeight);
  },
  
  // 处理页面可见性变化
  handleVisibilityChange() {
    if (document.hidden) {
      console.log('页面变为不可见');
      // 可以暂停某些动画或操作
    } else {
      console.log('页面变为可见');
      // 可以恢复动画或刷新数据
    }
  },
  
  // 处理全局键盘事件
  handleGlobalKeyboard(e) {
    // F1 - 显示帮助
    if (e.key === 'F1') {
      e.preventDefault();
      this.showHelp();
    }
    
    // Esc - 关闭模态框或重置
    if (e.key === 'Escape') {
      this.handleEscapeKey();
    }
    
    // Ctrl/Cmd + / - 显示快捷键帮助
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      NavigationManager.showNavigationHelp();
    }
  },
  
  // 处理ESC键
  handleEscapeKey() {
    // 可以在这里关闭打开的模态框等
    const notifications = document.querySelectorAll('.notification');
    notifications.forEach(notification => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    });
  },
  
  // 设置错误处理
  setupErrorHandling() {
    // 全局错误处理
    window.addEventListener('error', (e) => {
      console.error('全局错误:', e.error);
      this.handleError(e.error, '页面运行时错误');
    });
    
    // Promise错误处理
    window.addEventListener('unhandledrejection', (e) => {
      console.error('未处理的Promise拒绝:', e.reason);
      this.handleError(e.reason, 'Promise错误');
      e.preventDefault();
    });
  },
  
  // 错误处理
  handleError(error, context = '未知错误') {
    const errorInfo = {
      message: error.message || error,
      stack: error.stack,
      context: context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // 记录错误（如果有错误收集服务）
    console.error('应用错误:', errorInfo);
    
    // 向用户显示友好的错误信息
    if (this.initialized) {
      Utils.showNotification(
        '发生了一个错误，请刷新页面重试。如果问题持续存在，请联系技术支持。',
        'error',
        5000
      );
    }
  },
  
  // 应用初始设置
  applyInitialSettings() {
    // 从URL hash初始化导航
    NavigationManager.initFromHash();
    
    // 应用保存的设置
    SettingsManager.applyCodeBlockSettings();
    
    // 初始语法高亮
    SyntaxHighlighter.applyHighlighting();
  },
  
  // 显示欢迎信息
  showWelcomeMessage() {
    setTimeout(() => {
      Utils.showNotification(
        '🌲 欢迎来到线段树学习平台！使用 Ctrl+/ 查看快捷键帮助',
        'info',
        4000
      );
    }, 1000);
  },
  
  // 显示帮助信息
  showHelp() {
    const helpContent = `
      <div class="help-modal">
        <h3>🌲 线段树学习平台帮助</h3>
        <div class="help-section">
          <h4>🧭 导航</h4>
          <p>• 点击左侧菜单切换章节</p>
          <p>• 使用 Ctrl+数字键 快速导航</p>
          <p>• 支持浏览器前进后退</p>
        </div>
        <div class="help-section">
          <h4>🎨 主题</h4>
          <p>• 右上角可切换白天/黑夜/护眼模式</p>
          <p>• 主题设置会自动保存</p>
        </div>
        <div class="help-section">
          <h4>⚙️ 设置</h4>
          <p>• 可调节代码字体大小和行高</p>
          <p>• 支持自定义树节点颜色</p>
          <p>• 设置可导出和导入</p>
        </div>
        <div class="help-section">
          <h4>🌲 可视化</h4>
          <p>• 在"基本操作"页面体验树构建过程</p>
          <p>• 可调节动画速度</p>
        </div>
        <div class="help-section">
          <h4>🎯 测验</h4>
          <p>• 完成测验检验学习成果</p>
          <p>• 支持成绩分享和历史记录</p>
        </div>
      </div>
    `;
    
    Utils.showNotification(helpContent, 'info', 10000);
  },
  
  // 获取应用状态
  getStatus() {
    return {
      initialized: this.initialized,
      currentTheme: ThemeManager.getCurrentTheme(),
      currentSection: NavigationManager.getCurrentSection(),
      settings: SettingsManager.getAllSettings(),
      deviceInfo: Utils.getDeviceInfo()
    };
  },
  
  // 重启应用
  restart() {
    if (confirm('确定要重启应用吗？这将重置所有临时状态。')) {
      this.initialized = false;
      location.reload();
    }
  }
};

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

// 导出应用实例
if (typeof module !== 'undefined' && module.exports) {
  module.exports = App;
}

// 全局调试访问
window.SegmentTreeApp = {
  App,
  DOMManager,
  ThemeManager,
  SettingsManager,
  SyntaxHighlighter,
  TreeVisualizer,
  QuizManager,
  NavigationManager,
  Utils,
  CONFIG
};
