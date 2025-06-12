// 应用入口 - 简化版
console.log('应用开始加载...');

// 简单的应用对象
const SimpleApp = {
  init() {
    console.log('简化应用初始化...');
    
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.startApp();
      });
    } else {
      this.startApp();
    }
  },
  
  startApp() {
    console.log('启动应用模块...');
    
    try {
      // 初始化主题管理器
      if (typeof ThemeManager !== 'undefined') {
        ThemeManager.init();
        console.log('主题管理器已启动');
      }
      
      // 初始化导航管理器
      if (typeof NavigationManager !== 'undefined') {
        NavigationManager.init();
        console.log('导航管理器已启动');
      }
      
      // 初始化其他模块
      this.initOtherModules();
      
      console.log('✅ 应用启动成功');
      
    } catch (error) {
      console.error('应用启动失败:', error);
    }
  },
  
  initOtherModules() {
    // 初始化设置管理器
    if (typeof SettingsManager !== 'undefined') {
      try {
        SettingsManager.init();
        console.log('设置管理器已启动');
      } catch (e) {
        console.warn('设置管理器启动失败:', e);
      }
    }
    
    // 初始化语法高亮
    if (typeof SyntaxHighlighter !== 'undefined') {
      try {
        SyntaxHighlighter.init();
        console.log('语法高亮器已启动');
      } catch (e) {
        console.warn('语法高亮器启动失败:', e);
      }
    }
    
    // 初始化树可视化
    if (typeof TreeVisualizer !== 'undefined') {
      try {
        TreeVisualizer.init();
        console.log('树可视化器已启动');
      } catch (e) {
        console.warn('树可视化器启动失败:', e);
      }
    }
    
    // 初始化测验管理器
    if (typeof QuizManager !== 'undefined') {
      try {
        QuizManager.init();
        console.log('测验管理器已启动');
      } catch (e) {
        console.warn('测验管理器启动失败:', e);
      }
    }
  }
};

// 启动应用
SimpleApp.init();
