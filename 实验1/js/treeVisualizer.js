/* 线段树可视化模块 */

// --- Start of Adaptive Functionality State ---
let lastBuiltN = 0;
let lastBuiltContainer = null;
let isTreeRendered = false;
let domNodeElements = new Map(); // Stores DOM node elements, keyed by 'u'
let domLineElements = new Map(); // Stores DOM line elements, keyed by child 'u'
let currentTreeLevelsData = [];
let currentTreeBuildOrderData = [];
let activeBuildAnimationTimeout = null; // To cancel ongoing build animation
// --- End of Adaptive Functionality State ---

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 线段树可视化 - 基于边界的智能布局算法
function buildTreeVisualization(n, container, isResizeUpdate = false) {
  if (!isResizeUpdate) {
    // This is an initial build or a full rebuild
    lastBuiltN = n;
    lastBuiltContainer = container;
    isTreeRendered = false; // Mark as not rendered until animation completes
    domNodeElements.clear();
    domLineElements.clear();
    currentTreeLevelsData = [];
    currentTreeBuildOrderData = [];

    if (activeBuildAnimationTimeout) {
      clearTimeout(activeBuildAnimationTimeout);
      activeBuildAnimationTimeout = null;
    }

    if (n < 1 || n > 8) {
      alert('请输入1-8');
      return;    }
    
    // 清空容器内容并创建固定的结构
    container.innerHTML = '<h4>🌲 线段树构建过程:</h4>';
    container.innerHTML += `<p><strong>数组长度:</strong> ${n}</p>`;    const treeVisual = document.createElement('div');
    treeVisual.className = 'tree-visual';
    treeVisual.style.position = 'relative';
    treeVisual.style.width = '100%';
    treeVisual.style.padding = '25px'; // Padding is part of treeVisual itself
    treeVisual.style.background = 'transparent';
    treeVisual.style.borderRadius = '12px'; // 改为12px圆角
    // 移除边框和阴影
    treeVisual.style.overflow = 'visible';
    treeVisual.style.minHeight = '200px'; // 设置最小高度，确保盒子可见
    container.appendChild(treeVisual);
  }

  const treeVisual = container.querySelector('.tree-visual');
  if (!treeVisual) {
    console.error("Tree visual element not found.");
    return;
  }

  const containerWidth = treeVisual.clientWidth - 50; // Effective drawing width after treeVisual's own 25px padding
  const nodeMinWidth = 50;
  const levelHeight = 80;
  const padding = 25; // Internal padding within the containerWidth

  if (!isResizeUpdate) {
    // This is an initial build: collect tree levels data
    currentTreeLevelsData = []; // Clear for new build
    function collectLevels(l, r, u, depth = 0) {
      if (l > r) return; // Base case: invalid range, do not process
      if (!currentTreeLevelsData[depth]) currentTreeLevelsData[depth] = [];
      currentTreeLevelsData[depth].push({ l, r, u, depth });
      if (l < r) { // Only recurse if the range can be split further
        const mid = Math.floor((l + r) / 2);
        collectLevels(l, mid, u * 2, depth + 1);
        if (mid < r) { // Ensure right child is only processed if its range is valid
            collectLevels(mid + 1, r, u * 2 + 1, depth + 1);
        }
      }
    }
    collectLevels(1, n, 1);

    const totalLevels = currentTreeLevelsData.length;
    const baseHeight = 60;
    const calculatedHeight = totalLevels * levelHeight + baseHeight + 40;
    const minHeight = Math.max(200, calculatedHeight);
    treeVisual.style.minHeight = `${minHeight}px`;
    treeVisual.style.height = `${minHeight}px`;
  }
  
  const nodePositions = new Map();

  // 修改后的 calculateNodePositions 函数
  function calculateNodePositions(l, r, u, depth = 0, parentX = null, parentW = null) {
    // Check if this node should exist based on currentTreeLevelsData
    // This is a more robust way to ensure we only calculate positions for valid nodes
    const levelNodes = currentTreeLevelsData[depth];
    if (!levelNodes || !levelNodes.find(node => node.u === u && node.l === l && node.r === r)) {
        return; // Do not calculate position for a node that doesn't exist in the collected levels
    }

    const y = depth * levelHeight + 30;
    let x, nodeWidth;

    if (u === 1) { // Root node
        nodeWidth = containerWidth - (2 * padding); // Root spans containerWidth minus internal paddings
        nodeWidth = Math.max(nodeMinWidth, nodeWidth);
        x = containerWidth / 2; // Centered within containerWidth
    } else { // Child Node
        if (parentW == null || parentX == null) {
            console.error(`Parent data not passed for node ${u}`);
            nodeWidth = nodeMinWidth; // Fallback
            const tempParentPos = nodePositions.get(Math.floor(u/2)); // Attempt to get from map if available
            x = tempParentPos ? tempParentPos.x : containerWidth / 2; // Fallback center
        } else {
            nodeWidth = parentW / 2; // Child width is half of parent's width
            nodeWidth = Math.max(nodeMinWidth, nodeWidth);

            const isLeftChild = (u % 2 === 0);
            if (isLeftChild) {
                x = parentX - parentW / 4; // Center in parent's left half-width
            } else { // Right child
                x = parentX + parentW / 4; // Center in parent's right half-width
            }
        }
    }

    // Boundary clamping: Ensure the node (its edges) stays within the designated internal padding
    const halfW = nodeWidth / 2;
    if (x - halfW < padding) { // Left edge should not be less than internal 'padding'
        x = padding + halfW;
    }
    if (x + halfW > containerWidth - padding) { // Right edge should not exceed 'containerWidth - padding'
        x = containerWidth - padding - halfW;
    }
    
    nodePositions.set(u, { x, y, l, r, depth, nodeWidth });

    if (l < r) { // If not a data leaf, recurse for children
        const mid = Math.floor((l + r) / 2);
        calculateNodePositions(l, mid, u * 2, depth + 1, x, nodeWidth);
        if (mid < r) { // Ensure right child is only processed if its range is valid
            calculateNodePositions(mid + 1, r, u * 2 + 1, depth + 1, x, nodeWidth);
        }
    }
  }
  
  // Initial call to the modified calculateNodePositions
  calculateNodePositions(1, n, 1, 0, null, null); 
  
  if (!isResizeUpdate) {
    // This is a new build: generate render order and start animation
    currentTreeBuildOrderData = []; // Clear for new build

    function generateBuildOrder(l, r, u, depth = 0) {
      if (l > r) return;
      
      const levelNodes = currentTreeLevelsData[depth];
      if (!levelNodes || !levelNodes.find(node => node.u === u && node.l === l && node.r === r)) {
          return; 
      }

      currentTreeBuildOrderData.push({ l, r, u, depth }); 
      
      if (l < r) {
        const mid = Math.floor((l + r) / 2);
        generateBuildOrder(l, mid, u * 2, depth + 1);
        if (mid < r) {
            generateBuildOrder(mid + 1, r, u * 2 + 1, depth + 1);
        }
      }
    }
    generateBuildOrder(1, n, 1);

    let orderIndex = 0;
    function renderNextNode() {
      if (orderIndex >= currentTreeBuildOrderData.length) {
        isTreeRendered = true;
        activeBuildAnimationTimeout = null;
        return;
      }

      const { l, r, u, depth } = currentTreeBuildOrderData[orderIndex]; 
      const position = nodePositions.get(u);
      if (!position) {
          orderIndex++;
          activeBuildAnimationTimeout = setTimeout(renderNextNode, 50);
          return;
      }
      const nodeInfo = `${u}\\\\n[${l},${r}]`; 
      
      const nodeDiv = document.createElement('div');
      nodeDiv.className = `tree-node depth-${depth}`;
      nodeDiv.innerHTML = nodeInfo.replace(/\\\\n/g, '<br>');
      nodeDiv.setAttribute('data-node-id', u);
      
      nodeDiv.style.position = 'absolute';
      nodeDiv.style.left = `${position.x - position.nodeWidth / 2}px`;
      nodeDiv.style.top = `${position.y}px`;
      nodeDiv.style.width = `${position.nodeWidth}px`;
      nodeDiv.style.zIndex = '10';
      
      const nodeColor = window.nodeColor || '#74b9ff';
      if (nodeColor !== '#74b9ff') {
        nodeDiv.style.background = nodeColor;
      }
      
      nodeDiv.style.opacity = '0';
      nodeDiv.style.transform = 'translateY(-10px)';
      
      treeVisual.appendChild(nodeDiv);
      domNodeElements.set(u, nodeDiv); // Store DOM element
      
      if (depth > 0) {
        addConnectionLine(u, nodePositions, treeVisual); // This will also store the line in domLineElements
      }
      
      setTimeout(() => {
        nodeDiv.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        nodeDiv.style.opacity = '1';
        nodeDiv.style.transform = 'translateY(0)';
      }, 50);

      orderIndex++;
      const animationDelay = getAnimationDelay();
      activeBuildAnimationTimeout = setTimeout(renderNextNode, animationDelay / 6);
    }
    activeBuildAnimationTimeout = setTimeout(renderNextNode, 500); // Initial call for animation
  } else {
    // This is a resize update: update existing DOM elements
    domNodeElements.forEach((nodeDiv, u) => {
      const position = nodePositions.get(u);
      if (position) {
        nodeDiv.style.left = `${position.x - position.nodeWidth / 2}px`;
        nodeDiv.style.top = `${position.y}px`;
        nodeDiv.style.width = `${position.nodeWidth}px`;
      }
    });

    domLineElements.forEach((line, childId) => {
      const parentId = Math.floor(childId / 2);
      const childPos = nodePositions.get(childId);
      const parentPos = nodePositions.get(parentId);
      if (childPos && parentPos) {
        const deltaX = childPos.x - parentPos.x;
        const deltaY = childPos.y - parentPos.y - 35;
        const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        
        line.style.width = `${length}px`;
        line.style.left = `${parentPos.x}px`;
        line.style.top = `${parentPos.y + 35}px`;
        line.style.transform = `rotate(${angle}deg)`;
      }
    });
    isTreeRendered = true; // Ensure flag is set after resize update
  }
}

// Modified to store line element
function addConnectionLine(nodeId, nodePositions, treeVisual) {
  const parentId = Math.floor(nodeId / 2);
  const childPos = nodePositions.get(nodeId);
  const parentPos = nodePositions.get(parentId);
  
  if (!childPos || !parentPos) return;
  
  const line = document.createElement('div');
  line.className = 'tree-connection-line';
  line.style.position = 'absolute';
  line.style.background = 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))';
  line.style.zIndex = '5';
  line.style.opacity = '0';
  line.style.borderRadius = '1px';
  
  const deltaX = childPos.x - parentPos.x;
  const deltaY = childPos.y - parentPos.y - 35; 
  const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
  
  line.style.width = `${length}px`;
  line.style.height = '2px';
  line.style.left = `${parentPos.x}px`;
  line.style.top = `${parentPos.y + 35}px`;
  line.style.transformOrigin = '0 50%';
  line.style.transform = `rotate(${angle}deg)`;
  
  treeVisual.appendChild(line);
  domLineElements.set(nodeId, line); // Store DOM element for the line

  setTimeout(() => {
    line.style.transition = 'opacity 0.4s ease-in-out';
    line.style.opacity = '0.8';
  }, 200);
}

// 获取动画延迟
function getAnimationDelay() {
  const animationSpeed = window.animationSpeed || 'fast'; // Assuming animationSpeed might be set globally
  const speeds = { slow: 2000, normal: 1000, fast: 500 };
  return speeds[animationSpeed] || 1000;
}

// 初始化显示构建过程可视化的容器
function initializeTreeContainer(container) {
  container.innerHTML = ''; // 不显示任何标题
  const treeVisual = document.createElement('div');
  treeVisual.className = 'tree-visual';
  treeVisual.style.position = 'relative';
  treeVisual.style.width = '100%';
  treeVisual.style.padding = '25px';
  treeVisual.style.background = 'transparent';
  treeVisual.style.borderRadius = '12px';
  // 移除边框和阴影
  treeVisual.style.overflow = 'visible';
  treeVisual.style.minHeight = '200px';
  treeVisual.style.display = 'flex';
  treeVisual.style.alignItems = 'center';
  treeVisual.style.justifyContent = 'center';
  treeVisual.style.color = 'var(--text-color)';
  treeVisual.style.fontSize = '16px';
  treeVisual.style.opacity = '0.7';
  
  treeVisual.innerHTML = '<div style="text-align: center;">📱 点击上方"开始构建"按钮查看线段树构建动画</div>';
  
  container.appendChild(treeVisual);
}

// Modified initTreeVisualizer
function initTreeVisualizer() {
  const inputN = document.getElementById('input-n');
  const btnBuild = document.getElementById('btn-build');
  const treeContainer = document.getElementById('tree-container');
  
  // 初始化时显示构建过程可视化的盒子
  if (treeContainer) {
    initializeTreeContainer(treeContainer);
  }
  if (btnBuild && treeContainer) {
    btnBuild.addEventListener('click', () => {
      const n = parseInt(inputN?.value || '8'); // Default to 8 if input is empty
      if (n >= 1 && n <= 8) {
        buildTreeVisualization(n, treeContainer, false); // false for initial build
      } else {
        alert('请输入1到8之间的数组长度。');
      }
    });
  }

  window.addEventListener('resize', debounce(() => {
    if (isTreeRendered && lastBuiltContainer && lastBuiltN > 0) {
      // Check visibility before redrawing on resize
      const containerStyle = window.getComputedStyle(lastBuiltContainer);
      if (containerStyle.display !== 'none' && lastBuiltContainer.offsetParent !== null) {
          buildTreeVisualization(lastBuiltN, lastBuiltContainer, true); // true for resize update
      }
    }
  }, 250));
}

// Export functions
window.TreeVisualizer = {
  buildTreeVisualization, // Might not be needed externally if only init is called
  initTreeVisualizer
};