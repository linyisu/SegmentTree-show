// 工具函数模块
const Utils = {
  // 防抖函数
  debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },

  // 节流函数
  throttle(func, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // 深拷贝对象
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (typeof obj === 'object') {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  },

  // 生成随机ID
  generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // 格式化日期
  formatDate(date = new Date()) {
    return date.toISOString().split('T')[0];
  },

  // 验证输入范围
  validateRange(value, min, max) {
    const num = parseInt(value);
    return !isNaN(num) && num >= min && num <= max;
  },

  // 计算实际深度
  calculateActualDepth(n) {
    if (n === 1) return 1;
    return Math.floor(Math.log2(n)) + 1;
  },

  // 创建DOM元素
  createElement(tag, className = '', textContent = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (textContent) element.textContent = textContent;
    return element;
  },

  // 显示通知
  showNotification(message, type = 'info', duration = 3000) {
    const notification = this.createElement('div', `notification notification-${type}`, message);
    document.body.appendChild(notification);
    
    // 自动移除
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, duration);
    
    return notification;
  },

  // 下载文件
  downloadFile(content, filename, mimeType = 'application/json') {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  },

  // 读取文件
  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  },

  // 检查浏览器特性
  checkFeatureSupport() {
    return {
      localStorage: typeof Storage !== 'undefined',
      intersectionObserver: 'IntersectionObserver' in window,
      cssVariables: CSS.supports('color', 'var(--test-color)'),
      webGL: !!window.WebGLRenderingContext
    };
  },

  // 获取设备信息
  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenWidth: screen.width,
      screenHeight: screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1
    };
  }
};

// 导出工具函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}
