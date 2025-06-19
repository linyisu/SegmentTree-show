/* 设置管理模块 */

// 全局变量
let currentTheme = 'light';
let currentFontSize = 15;
let currentLineHeight = 1.6;
let animationSpeed = 'normal';
let nodeColor = '#74b9ff';
let showValues = true;

// 缓存 DOM 元素
const DOM = {
  themeSelect: null,
  fontSizeSlider: null,
  fontSizeDisplay: null,
  lineHeightSlider: null,
  lineHeightDisplay: null,
  animationSpeed: null,
  nodeColor: null,
  showValues: null
};

// 初始化DOM缓存
function initDOM() {
  DOM.themeSelect = document.getElementById('theme-select');
  DOM.fontSizeSlider = document.getElementById('font-size-slider');
  DOM.fontSizeDisplay = document.getElementById('font-size-display');
  DOM.lineHeightSlider = document.getElementById('line-height-slider');
  DOM.lineHeightDisplay = document.getElementById('line-height-display');
  DOM.animationSpeed = document.getElementById('animation-speed');
  DOM.nodeColor = document.getElementById('node-color');
  DOM.showValues = document.getElementById('show-values');
}

// 切换代码高亮主题
function changeTheme() {
  if (!DOM.themeSelect) return;
  
  currentTheme = DOM.themeSelect.value;
  document.querySelectorAll('.code-block').forEach(block => {
    block.className = `code-block ${currentTheme}`;
    // 确保主题切换时重新应用高亮
    if (block.dataset.originalCode && !block.dataset.highlighted) {
      if (window.SyntaxHighlighter) {
        block.innerHTML = window.SyntaxHighlighter.highlightCode(block.dataset.originalCode);
        block.dataset.highlighted = true;
      }
    }
  });
  Settings.save();
}

// 调整字体大小
function changeFontSize(size) {
  currentFontSize = parseInt(size);
  if (DOM.fontSizeDisplay) {
    DOM.fontSizeDisplay.textContent = size + 'px';
  }
  document.querySelectorAll('.code-block').forEach(block => {
    block.style.fontSize = size + 'px';
  });
  Settings.save();
}

// 调整行高
function changeLineHeight(height) {
  currentLineHeight = parseFloat(height);
  if (DOM.lineHeightDisplay) {
    DOM.lineHeightDisplay.textContent = height;
  }
  document.querySelectorAll('.code-block').forEach(block => {
    block.style.lineHeight = height;
  });
  Settings.save();
}

// 应用节点颜色
function applyNodeColor() {
  if (!DOM.nodeColor) return;
  
  nodeColor = DOM.nodeColor.value;
  const style = document.createElement('style');
  style.innerHTML = `
    .tree-node { background: ${nodeColor} !important; }
    .tree-node.depth-0 { background: ${nodeColor} !important; }
    .tree-node.depth-1 { background: ${nodeColor} !important; }
    .tree-node.depth-2 { background: ${nodeColor} !important; }
    .tree-node.depth-3 { background: ${nodeColor} !important; }
  `;
  document.head.appendChild(style);
  Settings.save();
}

// 切换节点值显示
function toggleNodeValues() {
  if (!DOM.showValues) return;
  
  showValues = DOM.showValues.checked;
  document.querySelectorAll('.tree-node').forEach(node => {
    node.style.display = showValues ? 'inline-block' : 'none';
  });
  Settings.save();
}

// 节流函数
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// 设置管理
const Settings = {
  defaults: {
    theme: 'light',
    fontSize: 15,
    lineHeight: 1.6,
    animationSpeed: 'normal',
    nodeColor: '#74b9ff',
    showValues: true
  },
  save() {
    localStorage.setItem('segmentTreeSettings', JSON.stringify({
      theme: currentTheme,
      fontSize: currentFontSize,
      lineHeight: currentLineHeight,
      animationSpeed: animationSpeed,
      nodeColor: nodeColor,
      showValues: showValues
    }));
    updateGlobalVars();
  },
  
  load() {
    const saved = localStorage.getItem('segmentTreeSettings');
    if (saved) {
      Object.assign(this.defaults, JSON.parse(saved));
      currentTheme = this.defaults.theme;
      currentFontSize = this.defaults.fontSize;
      currentLineHeight = this.defaults.lineHeight;
      animationSpeed = this.defaults.animationSpeed;
      nodeColor = this.defaults.nodeColor;
      showValues = this.defaults.showValues;

      // 更新UI控件
      if (DOM.themeSelect) DOM.themeSelect.value = currentTheme;
      if (DOM.fontSizeSlider) DOM.fontSizeSlider.value = currentFontSize;
      if (DOM.lineHeightSlider) DOM.lineHeightSlider.value = currentLineHeight;
      if (DOM.animationSpeed) DOM.animationSpeed.value = animationSpeed;
      if (DOM.nodeColor) DOM.nodeColor.value = nodeColor;
      if (DOM.showValues) DOM.showValues.checked = showValues;      // 应用设置
      changeFontSize(currentFontSize);
      changeLineHeight(currentLineHeight);
      changeTheme();
      updateGlobalVars();
    }
  },
  
  export() {
    const settings = {
      theme: currentTheme,
      fontSize: currentFontSize,
      lineHeight: currentLineHeight,
      animationSpeed: animationSpeed,
      nodeColor: nodeColor,
      showValues: showValues,
      exportDate: new Date().toISOString()
    };
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'segment-tree-settings.json';
    link.click();
  },
  
  reset() {
    if (confirm('确定要重置所有设置吗？')) {
      localStorage.removeItem('segmentTreeSettings');
      location.reload();
    }
  }
};

// 初始化设置功能
function initSettings() {
  initDOM();
  
  // 首先更新全局变量
  updateGlobalVars();
  
  // 设置事件监听器
  if (DOM.themeSelect) {
    DOM.themeSelect.addEventListener('change', changeTheme);
  }
  
  if (DOM.fontSizeSlider) {
    DOM.fontSizeSlider.addEventListener('input', debounce(e => changeFontSize(e.target.value), 100));
  }
  
  if (DOM.lineHeightSlider) {
    DOM.lineHeightSlider.addEventListener('input', debounce(e => changeLineHeight(e.target.value), 100));
  }
    if (DOM.animationSpeed) {
    DOM.animationSpeed.addEventListener('change', () => {
      animationSpeed = DOM.animationSpeed.value;
      window.animationSpeed = animationSpeed; // 确保全局变量更新
      Settings.save();
      console.log('🎬 动画速度已更新为:', animationSpeed);
    });
  }
  
  if (DOM.showValues) {
    DOM.showValues.addEventListener('change', toggleNodeValues);
  }

  // 加载保存的设置
  Settings.load();
  
  // 确保字体大小和行高显示元素存在并设置正确值
  if (DOM.fontSizeDisplay) {
    DOM.fontSizeDisplay.textContent = currentFontSize + 'px';
  }
  if (DOM.lineHeightDisplay) {
    DOM.lineHeightDisplay.textContent = currentLineHeight;
  }
}

// 导出和重置设置（全局函数供HTML调用）
function exportSettings() { 
  Settings.export(); 
}

function resetSettings() { 
  Settings.reset(); 
}

// 导出到全局作用域供其他模块使用
window.currentTheme = currentTheme;
window.animationSpeed = animationSpeed;
window.nodeColor = nodeColor;

// 更新全局变量的函数
function updateGlobalVars() {
  window.currentTheme = currentTheme;
  window.animationSpeed = animationSpeed;
  window.nodeColor = nodeColor;
}

// 导出函数供其他模块使用
window.SettingsManager = {
  changeTheme,
  changeFontSize,
  changeLineHeight,
  applyNodeColor,
  toggleNodeValues,
  initSettings,
  Settings
};
