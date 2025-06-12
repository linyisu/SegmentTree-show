// 导航管理器
const NavigationManager = {
  currentSection: 'intro',
  
  // 初始化导航
  init() {
    this.bindEvents();
    this.setActiveSection(this.currentSection);
  },
  
  // 绑定导航事件
  bindEvents() {
    // 使用事件委托监听导航按钮点击
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('nav-btn')) {
        const sectionId = e.target.getAttribute('data-section');
        if (sectionId) {
          this.showSection(sectionId);
        }
      }
    });
    
    // 监听键盘导航
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            this.showSection('intro');
            break;
          case '2':
            e.preventDefault();
            this.showSection('basic');
            break;
          case '3':
            e.preventDefault();
            this.showSection('advanced');
            break;
          case '4':
            e.preventDefault();
            this.showSection('quiz');
            break;
          case '5':
            e.preventDefault();
            this.showSection('settings');
            break;
        }
      }
    });
    
    // 监听浏览器前进后退
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.section) {
        this.setActiveSection(e.state.section, false);
      }
    });
  },
  
  // 显示指定章节
  showSection(sectionId) {
    if (!this.isValidSection(sectionId)) {
      console.warn(`无效的章节ID: ${sectionId}`);
      return;
    }
    
    if (sectionId === this.currentSection) {
      return; // 已经是当前章节
    }
    
    // 添加到浏览器历史
    history.pushState(
      { section: sectionId }, 
      '', 
      `#${sectionId}`
    );
    
    this.setActiveSection(sectionId);
  },
  
  // 设置活动章节
  setActiveSection(sectionId, updateHistory = true) {
    // 隐藏所有章节
    const sections = DOMManager.get('sections');
    if (sections) {
      sections.forEach(section => {
        section.classList.remove('active');
      });
    }
    
    // 显示目标章节
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.add('active');
    }
    
    // 更新导航按钮状态
    this.updateNavigationButtons(sectionId);
    
    // 更新当前章节
    this.currentSection = sectionId;
    
    // 触发章节变更事件
    this.dispatchSectionChangeEvent(sectionId);
    
    // 执行章节特定的初始化
    this.initializeSectionContent(sectionId);
    
    console.log(`导航到章节: ${sectionId}`);
  },
  
  // 验证章节ID
  isValidSection(sectionId) {
    const validSections = ['intro', 'basic', 'advanced', 'quiz', 'settings'];
    return validSections.includes(sectionId);
  },
  
  // 更新导航按钮状态
  updateNavigationButtons(activeSectionId) {
    const navButtons = DOMManager.get('navButtons');
    if (!navButtons) return;
    
    navButtons.forEach(button => {
      button.classList.remove('active');
      
      const sectionId = button.getAttribute('data-section');
      if (sectionId === activeSectionId) {
        button.classList.add('active');
      }
    });
  },
  
  // 初始化章节内容
  initializeSectionContent(sectionId) {
    switch (sectionId) {
      case 'intro':
        // 简介页面无需特殊初始化
        break;
        
      case 'basic':
        // 确保语法高亮已应用
        SyntaxHighlighter.applyHighlighting();
        break;
        
      case 'advanced':
        // 高级页面的语法高亮
        SyntaxHighlighter.applyHighlighting();
        break;
        
      case 'quiz':
        // 重置测验状态（如果需要）
        break;
        
      case 'settings':
        // 确保设置UI同步
        SettingsManager.updateUI();
        break;
    }
  },
  
  // 获取当前章节
  getCurrentSection() {
    return this.currentSection;
  },
  
  // 获取下一个章节
  getNextSection() {
    const sections = ['intro', 'basic', 'advanced', 'quiz', 'settings'];
    const currentIndex = sections.indexOf(this.currentSection);
    return currentIndex < sections.length - 1 ? sections[currentIndex + 1] : null;
  },
  
  // 获取上一个章节
  getPreviousSection() {
    const sections = ['intro', 'basic', 'advanced', 'quiz', 'settings'];
    const currentIndex = sections.indexOf(this.currentSection);
    return currentIndex > 0 ? sections[currentIndex - 1] : null;
  },
  
  // 导航到下一章节
  goToNext() {
    const nextSection = this.getNextSection();
    if (nextSection) {
      this.showSection(nextSection);
      return true;
    }
    return false;
  },
  
  // 导航到上一章节
  goToPrevious() {
    const previousSection = this.getPreviousSection();
    if (previousSection) {
      this.showSection(previousSection);
      return true;
    }
    return false;
  },
  
  // 触发章节变更事件
  dispatchSectionChangeEvent(sectionId) {
    const event = new CustomEvent('sectionChanged', {
      detail: { 
        section: sectionId, 
        timestamp: Date.now(),
        previous: this.currentSection
      }
    });
    document.dispatchEvent(event);
  },
  
  // 监听章节变更事件
  onSectionChange(callback) {
    document.addEventListener('sectionChanged', callback);
  },
  
  // 从URL哈希初始化章节
  initFromHash() {
    const hash = window.location.hash.substring(1);
    if (hash && this.isValidSection(hash)) {
      this.setActiveSection(hash);
    } else {
      // 设置默认章节
      this.setActiveSection('intro');
    }
  },
  
  // 获取章节信息
  getSectionInfo() {
    return {
      current: this.currentSection,
      available: ['intro', 'basic', 'advanced', 'quiz', 'settings'],
      titles: {
        intro: '📚 线段树简介',
        basic: '🔧 基本操作',
        advanced: '🚀 高级技巧',
        quiz: '🎯 互动测试',
        settings: '⚙️ 自定义设置'
      },
      descriptions: {
        intro: '了解线段树的基本概念和用途',
        basic: '学习线段树的构建和基本操作',
        advanced: '掌握懒惰标记等高级技巧',
        quiz: '通过测验检验学习成果',
        settings: '自定义界面和功能设置'
      }
    };
  },
  
  // 添加导航快捷方式提示
  showNavigationHelp() {
    const helpText = `
      导航快捷键：
      Ctrl/Cmd + 1: 线段树简介
      Ctrl/Cmd + 2: 基本操作
      Ctrl/Cmd + 3: 高级技巧
      Ctrl/Cmd + 4: 互动测试
      Ctrl/Cmd + 5: 自定义设置
    `;
    
    Utils.showNotification(helpText, 'info', 5000);
  }
};

// 导出导航管理器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NavigationManager;
}
