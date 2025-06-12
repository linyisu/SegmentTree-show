// DOM管理器 - 缓存和管理DOM元素
const DOMManager = {
  // 缓存的DOM元素
  elements: {},
  
  // 初始化DOM元素缓存
  init() {
    this.elements = {
      // 主题切换
      themeOptions: document.querySelectorAll('.theme-option'),
      
      // 导航
      navButtons: document.querySelectorAll('.nav-btn'),
      sections: document.querySelectorAll('main section'),
      
      // 设置相关
      fontSizeSlider: document.getElementById('font-size-slider'),
      fontSizeDisplay: document.getElementById('font-size-display'),
      lineHeightSlider: document.getElementById('line-height-slider'),
      lineHeightDisplay: document.getElementById('line-height-display'),
      animationSpeed: document.getElementById('animation-speed'),
      nodeColor: document.getElementById('node-color'),
      showValues: document.getElementById('show-values'),
      
      // 树形可视化
      inputN: document.getElementById('input-n'),
      btnBuild: document.getElementById('btn-build'),
      treeContainer: document.getElementById('tree-container'),
      
      // 测验
      quizResult: document.getElementById('quiz-result'),
      submitQuiz: document.getElementById('submit-quiz'),
      
      // 按钮
      applyNodeColor: document.getElementById('apply-node-color'),
      exportSettings: document.getElementById('export-settings'),
      resetSettings: document.getElementById('reset-settings'),
      
      // 代码块
      codeBlocks: document.querySelectorAll('.code-block')
    };
    
    this.checkElementsExistence();
  },
  
  // 检查元素是否存在
  checkElementsExistence() {
    const missingElements = [];
    
    for (const [key, element] of Object.entries(this.elements)) {
      if (!element || (element.length !== undefined && element.length === 0)) {
        missingElements.push(key);
      }
    }
    
    if (missingElements.length > 0) {
      console.warn('缺失的DOM元素:', missingElements);
    }
  },
  
  // 获取元素
  get(elementKey) {
    return this.elements[elementKey];
  },
  
  // 添加事件监听器
  addEventListener(elementKey, event, handler, options = {}) {
    const element = this.get(elementKey);
    if (!element) {
      console.warn(`元素 ${elementKey} 不存在`);
      return;
    }
    
    if (element.length !== undefined) {
      // NodeList
      element.forEach(el => el.addEventListener(event, handler, options));
    } else {
      // 单个元素
      element.addEventListener(event, handler, options);
    }
  },
  
  // 移除事件监听器
  removeEventListener(elementKey, event, handler, options = {}) {
    const element = this.get(elementKey);
    if (!element) return;
    
    if (element.length !== undefined) {
      element.forEach(el => el.removeEventListener(event, handler, options));
    } else {
      element.removeEventListener(event, handler, options);
    }
  },
  
  // 设置元素属性
  setAttribute(elementKey, attribute, value) {
    const element = this.get(elementKey);
    if (!element) return;
    
    if (element.length !== undefined) {
      element.forEach(el => el.setAttribute(attribute, value));
    } else {
      element.setAttribute(attribute, value);
    }
  },
  
  // 获取元素属性
  getAttribute(elementKey, attribute) {
    const element = this.get(elementKey);
    if (!element) return null;
    
    if (element.length !== undefined) {
      return Array.from(element).map(el => el.getAttribute(attribute));
    } else {
      return element.getAttribute(attribute);
    }
  },
  
  // 设置元素样式
  setStyle(elementKey, property, value) {
    const element = this.get(elementKey);
    if (!element) return;
    
    if (element.length !== undefined) {
      element.forEach(el => el.style[property] = value);
    } else {
      element.style[property] = value;
    }
  },
  
  // 添加类名
  addClass(elementKey, className) {
    const element = this.get(elementKey);
    if (!element) return;
    
    if (element.length !== undefined) {
      element.forEach(el => el.classList.add(className));
    } else {
      element.classList.add(className);
    }
  },
  
  // 移除类名
  removeClass(elementKey, className) {
    const element = this.get(elementKey);
    if (!element) return;
    
    if (element.length !== undefined) {
      element.forEach(el => el.classList.remove(className));
    } else {
      element.classList.remove(className);
    }
  },
  
  // 切换类名
  toggleClass(elementKey, className) {
    const element = this.get(elementKey);
    if (!element) return;
    
    if (element.length !== undefined) {
      element.forEach(el => el.classList.toggle(className));
    } else {
      element.classList.toggle(className);
    }
  },
  
  // 显示/隐藏元素
  show(elementKey) {
    this.setStyle(elementKey, 'display', 'block');
  },
  
  hide(elementKey) {
    this.setStyle(elementKey, 'display', 'none');
  },
  
  // 重新扫描DOM（动态添加元素后使用）
  refresh() {
    this.init();
  }
};

// 导出DOM管理器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DOMManager;
}
