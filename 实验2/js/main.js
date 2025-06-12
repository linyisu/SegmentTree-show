// filepath: c:\Users\acm\OneDrive\SegmentTree-show\实验2\js\main.js
/* 主入口文件 - 应用程序启动和协调中心 */

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
  console.log('🌟 线段树可视化应用初始化完成');
  
  // 恢复主题
  const savedTheme = localStorage.getItem('theme') || 'light';
  switchTheme(savedTheme);
  
  // 先应用高亮
  applyHighlighting();
  
  // 然后加载设置
  Settings.load();
  
  // 设置延迟高亮监听
  setupLazyHighlighting();
  
  // 确保字体大小和行高显示元素存在
  if (DOM.fontSizeDisplay) {
    DOM.fontSizeDisplay.textContent = currentFontSize + 'px';
  }
  if (DOM.lineHeightDisplay) {
    DOM.lineHeightDisplay.textContent = currentLineHeight;
  }

  // 导航事件委托
  document.querySelector('nav').addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      const sectionId = e.target.getAttribute('data-section');
      showSection(sectionId);
    }
  });

  // 设置相关事件
  if (DOM.fontSizeSlider) {
    DOM.fontSizeSlider.addEventListener('input', debounce(e => changeFontSize(e.target.value), 100));
  }
  if (DOM.lineHeightSlider) {
    DOM.lineHeightSlider.addEventListener('input', debounce(e => changeLineHeight(e.target.value), 100));
  }
  if (DOM.animationSpeed) {
    DOM.animationSpeed.addEventListener('change', () => {
      animationSpeed = DOM.animationSpeed.value;
      Settings.save();
    });
  }
  if (DOM.showValues) {
    DOM.showValues.addEventListener('change', toggleNodeValues);
  }
  if (DOM.btnBuild && DOM.inputN && DOM.treeContainer) {
    DOM.btnBuild.addEventListener('click', () => {
      const n = parseInt(DOM.inputN.value);
      buildTreeVisualization(n, DOM.treeContainer);
    });
  }
});

// 全局变量
let currentTheme = 'light'; // 改为默认light主题
let currentFontSize = 14;
let currentLineHeight = 1.6;
let animationSpeed = 'fast';
let nodeColor = '#74b9ff';
let showValues = true;

// 缓存 DOM 元素
const DOM = {
  fontSizeSlider: document.getElementById('font-size-slider'),
  fontSizeDisplay: document.getElementById('font-size-display'),
  lineHeightSlider: document.getElementById('line-height-slider'),
  lineHeightDisplay: document.getElementById('line-height-display'),
  animationSpeed: document.getElementById('animation-speed'),
  nodeColor: document.getElementById('node-color'),
  showValues: document.getElementById('show-values'),
  treeContainer: document.getElementById('tree-container'),
  quizResult: document.getElementById('quiz-result'),
  inputN: document.getElementById('input-n'),
  btnBuild: document.getElementById('btn-build'),
  themeSelect: document.getElementById('theme-select') // Added for settings.js compatibility
};

// 导航切换
function showSection(id) {
  document.querySelectorAll('main section').forEach(sec => sec.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) {
    target.classList.add('active');
    const targetBtn = document.querySelector(`button[data-section="${id}"]`);
    if (targetBtn) targetBtn.classList.add('active');
  }
}

// 节流函数
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// 导出和重置设置
function exportSettings() { Settings.export(); }
function resetSettings() { Settings.reset(); }