// 树形可视化器
const TreeVisualizer = {
  // 当前状态
  isBuilding: false,
  currentN: 8,
  
  // 初始化
  init() {
    this.bindEvents();
  },
  
  // 绑定事件
  bindEvents() {
    const btnBuild = DOMManager.get('btnBuild');
    const inputN = DOMManager.get('inputN');
    
    if (btnBuild) {
      btnBuild.addEventListener('click', () => {
        this.startBuildVisualization();
      });
    }
    
    if (inputN) {
      inputN.addEventListener('change', (e) => {
        this.currentN = parseInt(e.target.value);
      });
    }
  },
  
  // 开始构建可视化
  startBuildVisualization() {
    const inputN = DOMManager.get('inputN');
    const n = inputN ? parseInt(inputN.value) : this.currentN;
    
    if (!Utils.validateRange(n, CONFIG.TREE.MIN_N, CONFIG.TREE.MAX_N)) {
      Utils.showNotification(`数组长度必须在 ${CONFIG.TREE.MIN_N} 到 ${CONFIG.TREE.MAX_N} 之间`, 'error');
      return;
    }
    
    if (this.isBuilding) {
      Utils.showNotification('正在构建中，请稍等...', 'warning');
      return;
    }
    
    this.buildTreeVisualization(n);
  },
  
  // 构建树形可视化
  buildTreeVisualization(n) {
    const container = DOMManager.get('treeContainer');
    if (!container) {
      console.error('树容器未找到');
      return;
    }
    
    this.isBuilding = true;
    
    // 清空容器并添加标题
    container.innerHTML = '<h4>🌲 线段树构建过程:</h4>';
    container.innerHTML += `<p><strong>数组长度:</strong> ${n}</p>`;
    
    // 创建可视化容器
    const treeVisual = Utils.createElement('div', 'tree-visual');
    this.setupTreeVisualContainer(treeVisual, n);
    container.appendChild(treeVisual);
    
    // 计算布局
    const layout = this.calculateLayout(n, treeVisual);
    
    // 生成构建顺序
    const buildOrder = this.generateBuildOrder(n);
    
    // 开始动画渲染
    this.renderTreeAnimation(buildOrder, layout, treeVisual);
  },
  
  // 设置树形可视化容器
  setupTreeVisualContainer(treeVisual, n) {
    const actualDepth = Utils.calculateActualDepth(n);
    const totalLevels = actualDepth;
    const baseHeight = 60;
    const calculatedHeight = totalLevels * CONFIG.TREE.LEVEL_HEIGHT + baseHeight + 40;
    const minHeight = Math.max(200, calculatedHeight);
    
    Object.assign(treeVisual.style, {
      position: 'relative',
      width: '100%',
      padding: '25px',
      background: 'var(--card-bg)',
      borderRadius: '18px',
      borderLeft: '5px solid var(--primary-color)',
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
      overflow: 'visible',
      minHeight: `${minHeight}px`,
      height: `${minHeight}px`
    });
  },
  
  // 计算布局
  calculateLayout(n, container) {
    const containerWidth = container.clientWidth - 50;
    const nodePositions = new Map();
    
    // 递归计算节点位置
    this.calculateNodePositions(1, n, 1, 0, 0, containerWidth, null, nodePositions);
    
    // 边界检查
    this.ensureBoundaries(nodePositions, containerWidth);
    
    return { nodePositions, containerWidth };
  },
  
  // 计算节点位置
  calculateNodePositions(l, r, u, depth = 0, leftBound = 0, rightBound = 0, parentWidth = null, nodePositions) {
    const segmentLength = r - l + 1;
    const baseWidth = Math.max(CONFIG.TREE.NODE_MIN_WIDTH, segmentLength * 12);
    const nodeWidth = parentWidth ? Math.min(baseWidth, parentWidth * 0.8) : baseWidth;
    
    const availableWidth = rightBound - leftBound;
    const centerX = leftBound + availableWidth / 2;
    const nodeX = centerX - nodeWidth / 2;
    const nodeY = depth * CONFIG.TREE.LEVEL_HEIGHT + 20;
    
    nodePositions.set(u, {
      x: nodeX,
      y: nodeY,
      width: nodeWidth,
      depth: depth,
      l: l,
      r: r,
      text: l === r ? `[${l}]` : `[${l},${r}]`
    });
    
    // 递归处理子节点
    if (l < r) {
      const mid = Math.floor((l + r) / 2);
      const childWidth = availableWidth / 2;
      
      this.calculateNodePositions(l, mid, u * 2, depth + 1, leftBound, leftBound + childWidth, nodeWidth, nodePositions);
      this.calculateNodePositions(mid + 1, r, u * 2 + 1, depth + 1, leftBound + childWidth, rightBound, nodeWidth, nodePositions);
    }
  },
  
  // 边界检查
  ensureBoundaries(nodePositions, containerWidth) {
    let minX = Infinity, maxX = -Infinity;
    
    for (const pos of nodePositions.values()) {
      minX = Math.min(minX, pos.x);
      maxX = Math.max(maxX, pos.x + pos.width);
    }
    
    if (minX < 0 || maxX > containerWidth) {
      const scale = containerWidth / (maxX - minX);
      const offsetX = -minX * scale;
      
      for (const pos of nodePositions.values()) {
        pos.x = pos.x * scale + offsetX;
        pos.width = pos.width * scale;
      }
    }
  },
  
  // 生成构建顺序
  generateBuildOrder(n) {
    const buildOrder = [];
    
    const generateOrder = (l, r, u, depth = 0) => {
      buildOrder.push({ l, r, u, depth });
      
      if (l < r) {
        const mid = Math.floor((l + r) / 2);
        generateOrder(l, mid, u * 2, depth + 1);
        generateOrder(mid + 1, r, u * 2 + 1, depth + 1);
      }
    };
    
    generateOrder(1, n, 1);
    return buildOrder;
  },
  
  // 渲染树动画
  renderTreeAnimation(buildOrder, layout, treeVisual) {
    let orderIndex = 0;
    const animationDelay = this.getAnimationDelay();
    
    const renderNextNode = () => {
      if (orderIndex >= buildOrder.length) {
        this.isBuilding = false;
        Utils.showNotification('线段树构建完成！', 'success');
        return;
      }
      
      const nodeInfo = buildOrder[orderIndex];
      const position = layout.nodePositions.get(nodeInfo.u);
      
      if (position) {
        this.createTreeNode(nodeInfo, position, treeVisual);
        
        // 添加连接线
        if (nodeInfo.u > 1) {
          this.addConnectionLine(nodeInfo.u, layout.nodePositions, treeVisual);
        }
      }
      
      orderIndex++;
      setTimeout(renderNextNode, animationDelay);
    };
    
    setTimeout(renderNextNode, 500);
  },
  
  // 创建树节点
  createTreeNode(nodeInfo, position, container) {
    const node = Utils.createElement('div', `tree-node depth-${position.depth}`, position.text);
    
    Object.assign(node.style, {
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${position.width}px`,
      opacity: '0',
      transform: 'translateY(10px)'
    });
    
    container.appendChild(node);
    
    // 动画效果
    setTimeout(() => {
      node.style.opacity = '1';
      node.style.transform = 'translateY(0)';
    }, 100);
  },
  
  // 添加连接线
  addConnectionLine(nodeId, nodePositions, container) {
    const parentId = Math.floor(nodeId / 2);
    const childPos = nodePositions.get(nodeId);
    const parentPos = nodePositions.get(parentId);
    
    if (!childPos || !parentPos) return;
    
    const line = Utils.createElement('div', 'tree-connection-line');
    
    // 计算连接线位置和角度
    const deltaX = (childPos.x + childPos.width / 2) - (parentPos.x + parentPos.width / 2);
    const deltaY = childPos.y - (parentPos.y + 35);
    const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
    
    Object.assign(line.style, {
      position: 'absolute',
      background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
      width: `${length}px`,
      height: '2px',
      left: `${parentPos.x + parentPos.width / 2}px`,
      top: `${parentPos.y + 35}px`,
      transformOrigin: '0 50%',
      transform: `rotate(${angle}deg)`,
      zIndex: '1',
      opacity: '0',
      borderRadius: '1px'
    });
    
    container.appendChild(line);
    
    // 延迟显示连接线
    setTimeout(() => {
      line.style.opacity = '0.8';
    }, 200);
  },
  
  // 获取动画延迟
  getAnimationDelay() {
    const speedSetting = SettingsManager.getSetting('animationSpeed') || CONFIG.DEFAULT_SETTINGS.animationSpeed;
    return CONFIG.ANIMATION_SPEEDS[speedSetting] || CONFIG.ANIMATION_SPEEDS.fast;
  },
  
  // 清除可视化
  clearVisualization() {
    const container = DOMManager.get('treeContainer');
    if (container) {
      container.innerHTML = '<p>点击"开始构建"按钮查看线段树构建过程</p>';
    }
    this.isBuilding = false;
  },
  
  // 设置节点颜色
  setNodeColor(color) {
    const style = document.createElement('style');
    style.innerHTML = `
      .tree-node.depth-3 { 
        background: ${color} !important; 
      }
    `;
    document.head.appendChild(style);
  }
};

// 导出树形可视化器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TreeVisualizer;
}
