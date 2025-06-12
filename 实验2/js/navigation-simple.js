// 导航管理器 - 简化版
const NavigationManager = {
  currentSection: 'intro',
  
  // 初始化
  init() {
    console.log('导航管理器初始化...');
    this.bindEvents();
    this.showSection('intro');
  },
  
  // 绑定事件
  bindEvents() {
    console.log('绑定导航事件...');
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('nav-btn')) {
        const section = e.target.getAttribute('data-section');
        console.log('点击导航按钮:', section);
        if (section) {
          this.showSection(section);
        }
      }
    });
  },
  
  // 显示章节
  showSection(sectionId) {
    console.log('切换到章节:', sectionId);
    
    // 隐藏所有章节
    const sections = document.querySelectorAll('main section');
    sections.forEach(section => {
      section.classList.remove('active');
    });
    
    // 显示目标章节
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.add('active');
    }
    
    // 更新导航按钮
    this.updateNavButtons(sectionId);
    this.currentSection = sectionId;
  },
  
  // 更新导航按钮状态
  updateNavButtons(activeSection) {
    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-section') === activeSection) {
        btn.classList.add('active');
      }
    });
  },
  
  // 获取当前章节
  getCurrentSection() {
    return this.currentSection;
  }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NavigationManager;
}
