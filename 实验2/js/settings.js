// filepath: c:\Users\acm\OneDrive\SegmentTree-show\实验2\js\settings.js
/* 设置管理模块 - 处理用户偏好设置和配置 */

// 应用设置到代码块（字体大小、行高等）
function applyCodeBlockSettings() {
  document.querySelectorAll('.code-block').forEach(block => {
    block.style.fontSize = currentFontSize + 'px';
    block.style.lineHeight = currentLineHeight;
    
    // 确保重新应用高亮
    if (block.dataset.originalCode) {
      const highlightedCode = highlightCode(block.dataset.originalCode);
      const existingCodeTag = block.querySelector('code');
      if (existingCodeTag) {
        existingCodeTag.innerHTML = highlightedCode.replace('<code>', '').replace('</code>', '');
      } else {
        block.innerHTML = highlightedCode;
      }
      block.dataset.highlighted = true;
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
  applyCodeBlockSettings();
}

// 调整行高
function changeLineHeight(height) {
  currentLineHeight = parseFloat(height);
  if (DOM.lineHeightDisplay) {
    DOM.lineHeightDisplay.textContent = height;
  }
  applyCodeBlockSettings();
}

// 应用节点颜色
function applyNodeColor() {
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
  showValues = DOM.showValues.checked;
  document.querySelectorAll('.tree-node').forEach(node => {
    node.style.display = showValues ? 'inline-block' : 'none';
  });
  Settings.save();
}

// 获取动画延迟
function getAnimationDelay() {
  const speeds = { slow: 2000, normal: 1000, fast: 500 };
  return speeds[animationSpeed] || 1000;
}

// 设置管理
const Settings = {
  defaults: {
    theme: 'dark',
    fontSize: 14,
    lineHeight: 1.6,
    animationSpeed: 'fast',
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

      DOM.themeSelect.value = currentTheme;
      DOM.fontSizeSlider.value = currentFontSize;
      DOM.lineHeightSlider.value = currentLineHeight;
      DOM.animationSpeed.value = animationSpeed;
      DOM.nodeColor.value = nodeColor;
      DOM.showValues.checked = showValues;

      changeFontSize(currentFontSize);
      changeLineHeight(currentLineHeight);
      applyCodeBlockSettings();
    }
    setTimeout(() => {
      applyHighlighting();
      setupLazyHighlighting();
    }, 100);
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

// 导出和重置设置
function exportSettings() { Settings.export(); }
function resetSettings() { Settings.reset(); }