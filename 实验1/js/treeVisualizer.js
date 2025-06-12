/* 线段树可视化模块 */

// 线段树可视化 - 基于边界的智能布局算法
function buildTreeVisualization(n, container) {
  if (n < 1 || n > 8) {
    alert('请输入1-8');
    return;
  }

  container.innerHTML = '<h4>🌲 线段树构建过程:</h4>';
  container.innerHTML += `<p><strong>数组长度:</strong> ${n}</p>`;
  const treeVisual = document.createElement('div');
  treeVisual.className = 'tree-visual';
  treeVisual.style.position = 'relative';
  treeVisual.style.width = '100%';
  treeVisual.style.padding = '25px';
  treeVisual.style.background = 'var(--card-bg)';
  treeVisual.style.borderRadius = '18px';
  treeVisual.style.borderLeft = '5px solid var(--primary-color)';
  treeVisual.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
  treeVisual.style.overflow = 'visible';
  container.appendChild(treeVisual);

  // 获取实际容器宽度，考虑padding
  const containerWidth = treeVisual.clientWidth - 50;
  const nodeMinWidth = 50;
  const levelHeight = 80;
  const padding = 25;

  // 计算实际层数（不是最大理论深度）
  function calculateActualDepth(n) {
    if (n === 1) return 1;
    return Math.floor(Math.log2(n)) + 1;
  }
  
  const actualDepth = calculateActualDepth(n);

  // 首先收集所有层级的节点信息
  const levels = [];
  function collectLevels(l, r, u, depth = 0) {
    if (!levels[depth]) levels[depth] = [];
    levels[depth].push({ l, r, u, depth });
    
    if (l < r) {
      const mid = Math.floor((l + r) / 2);
      collectLevels(l, mid, u * 2, depth + 1);
      collectLevels(mid + 1, r, u * 2 + 1, depth + 1);
    }
  }

  collectLevels(1, n, 1);

  // 动态设置容器高度 - 根据实际层数计算
  const totalLevels = levels.length;
  const baseHeight = 60; // 基础高度
  const calculatedHeight = totalLevels * levelHeight + baseHeight + 40; // 减少额外缓冲
  const minHeight = Math.max(200, calculatedHeight); // 最小高度降低到200px
  treeVisual.style.minHeight = `${minHeight}px`;
  treeVisual.style.height = `${minHeight}px`; // 同时设置固定高度

  // 节点位置信息存储
  const nodePositions = new Map();

  // 计算每个节点的精确位置 - 父子节点宽度继承关系
  function calculateNodePositions(l, r, u, depth = 0, leftBound = 0, rightBound = containerWidth, parentWidth = null) {
    const y = depth * levelHeight + 30;
    
    // 检查是否为最底层（叶子节点层）
    const isLeafLevel = (depth === levels.length - 1);
    const nodesInLevel = levels[depth].length;
    const totalNodesInLevel = Math.pow(2, depth);
    
    let x, nodeWidth;
    
    if (isLeafLevel) {
      // 叶子节点：宽度为父节点的一半，且与父节点边界对齐
      if (parentWidth) {
        nodeWidth = parentWidth / 2;
      } else {
        nodeWidth = Math.max(nodeMinWidth, (containerWidth - 2 * padding) / totalNodesInLevel);
      }
      
      // 判断是左子节点还是右子节点
      const parentU = Math.floor(u / 2);
      const isLeftChild = (u % 2 === 0);
      const parentPos = nodePositions.get(parentU) || { x: containerWidth / 2 };
      
      if (isLeftChild) {
        // 左子节点：基于父节点左半部分的中心
        const leftHalfCenter = parentPos.x - parentWidth / 4;
        x = Math.max(padding + nodeWidth / 2, leftHalfCenter);
      } else {
        // 右子节点：基于父节点右半部分的中心
        const rightHalfCenter = parentPos.x + parentWidth / 4;
        x = Math.min(containerWidth - padding - nodeWidth / 2, rightHalfCenter);
      }
    } else {
      // 非叶子层：铺满整行或均匀分布，确保不超出边界
      if (nodesInLevel === 1) {
        // 只有一个节点时：填满整个可用宽度
        nodeWidth = containerWidth - 2 * padding;
        x = containerWidth / 2;
      } else {
        // 多个节点时：均分可用宽度
        const availableWidth = containerWidth - 2 * padding;
        nodeWidth = availableWidth / nodesInLevel;
        // 确保节点宽度不小于最小值
        nodeWidth = Math.max(nodeWidth, nodeMinWidth);
        
        const nodeIndex = levels[depth].findIndex(node => node.u === u);
        x = padding + nodeWidth * (nodeIndex + 0.5);
      }
    }
    
    nodePositions.set(u, {
      x: x,
      y: y,
      l: l,
      r: r,
      depth: depth,
      nodeWidth: nodeWidth,
      leftBound: leftBound,
      rightBound: rightBound
    });

    if (l < r) {
      const mid = Math.floor((l + r) / 2);
      
      // 为子树分配边界，传递当前节点宽度给子节点
      const boundWidth = (rightBound - leftBound) / 2;
      
      calculateNodePositions(l, mid, u * 2, depth + 1, 
        leftBound, leftBound + boundWidth, nodeWidth);
      calculateNodePositions(mid + 1, r, u * 2 + 1, depth + 1, 
        leftBound + boundWidth, rightBound, nodeWidth);
    }
  }

  // 计算所有节点位置
  calculateNodePositions(1, n, 1, 0, 0, containerWidth, null);
  
  // 边界检查和调整函数，确保所有节点都在容器内
  function ensureBoundaries() {
    nodePositions.forEach((pos, u) => {
      const halfWidth = pos.nodeWidth / 2;
      // 确保节点不超出左边界
      if (pos.x - halfWidth < padding) {
        pos.x = padding + halfWidth;
      }
      // 确保节点不超出右边界
      if (pos.x + halfWidth > containerWidth - padding) {
        pos.x = containerWidth - padding - halfWidth;
      }
    });
  }
  
  ensureBoundaries();

  // 按build递归顺序收集节点
  const buildOrder = [];
  
  function generateBuildOrder(l, r, u, depth = 0) {
    buildOrder.push({ l, r, u, depth });
    
    if (l < r) {
      const mid = Math.floor((l + r) / 2);
      generateBuildOrder(l, mid, u * 2, depth + 1);
      generateBuildOrder(mid + 1, r, u * 2 + 1, depth + 1);
    }
  }

  generateBuildOrder(1, n, 1);

  // 动画渲染
  let orderIndex = 0;
  
  function renderNextNode() {
    if (orderIndex >= buildOrder.length) {
      return;
    }

    const { l, r, u, depth } = buildOrder[orderIndex];
    const position = nodePositions.get(u);
    const nodeInfo = `${u}\n[${l},${r}]`;
    
    // 创建节点元素 - 使用绝对定位
    const nodeDiv = document.createElement('div');
    nodeDiv.className = `tree-node depth-${depth}`;
    nodeDiv.textContent = nodeInfo;
    nodeDiv.setAttribute('data-node-id', u);
    
    // 设置绝对定位和动态宽度
    nodeDiv.style.position = 'absolute';
    nodeDiv.style.left = `${position.x - position.nodeWidth / 2}px`;
    nodeDiv.style.top = `${position.y}px`;
    nodeDiv.style.width = `${position.nodeWidth}px`;
    nodeDiv.style.zIndex = '10';
    
    // 应用自定义颜色
    const nodeColor = window.nodeColor || '#74b9ff';
    if (nodeColor !== '#74b9ff') {
      nodeDiv.style.background = nodeColor;
    }
    
    // 初始状态（仅透明度为0，大小已是最终大小）
    nodeDiv.style.opacity = '0';
    nodeDiv.style.transform = 'translateY(-10px)';
    
    treeVisual.appendChild(nodeDiv);
    
    // 添加连接线（如果不是根节点）
    if (depth > 0) {
      addConnectionLine(u, nodePositions, treeVisual);
    }
    
    // 延迟显示动画 - 只改变透明度和位置，不改变大小
    setTimeout(() => {
      nodeDiv.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
      nodeDiv.style.opacity = '1';
      nodeDiv.style.transform = 'translateY(0)';
    }, 50);

    orderIndex++;
    const animationDelay = getAnimationDelay();
    setTimeout(renderNextNode, animationDelay / 6);
  }

  // 开始渲染
  setTimeout(renderNextNode, 500);
}

// 添加父子节点间的连接线
function addConnectionLine(nodeId, nodePositions, treeVisual) {
  const parentId = Math.floor(nodeId / 2);
  const childPos = nodePositions.get(nodeId);
  const parentPos = nodePositions.get(parentId);
  
  if (!childPos || !parentPos) return;
  
  // 创建连接线
  const line = document.createElement('div');
  line.className = 'tree-connection-line';
  line.style.position = 'absolute';
  line.style.background = 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))';
  line.style.zIndex = '5';
  line.style.opacity = '0';
  line.style.borderRadius = '1px';
  
  // 计算连接线的位置和角度
  const deltaX = childPos.x - parentPos.x;
  const deltaY = childPos.y - parentPos.y - 35; // 35是节点高度
  const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
  
  line.style.width = `${length}px`;
  line.style.height = '2px';
  line.style.left = `${parentPos.x}px`;
  line.style.top = `${parentPos.y + 35}px`; // 从父节点底部开始
  line.style.transformOrigin = '0 50%';
  line.style.transform = `rotate(${angle}deg)`;
  
  treeVisual.appendChild(line);
  
  // 延迟显示连接线
  setTimeout(() => {
    line.style.transition = 'opacity 0.4s ease-in-out';
    line.style.opacity = '0.8';
  }, 200);
}

// 获取动画延迟
function getAnimationDelay() {
  const animationSpeed = window.animationSpeed || 'fast';
  const speeds = { slow: 2000, normal: 1000, fast: 500 };
  return speeds[animationSpeed] || 1000;
}

// 初始化树可视化功能
function initTreeVisualizer() {
  const inputN = document.getElementById('input-n');
  const btnBuild = document.getElementById('btn-build');
  const treeContainer = document.getElementById('tree-container');
  
  if (btnBuild && treeContainer) {
    btnBuild.addEventListener('click', () => {
      const n = parseInt(inputN?.value || '8');
      buildTreeVisualization(n, treeContainer);
    });
  }
}

// 导出函数供其他模块使用
window.TreeVisualizer = {
  buildTreeVisualization,
  initTreeVisualizer
};
