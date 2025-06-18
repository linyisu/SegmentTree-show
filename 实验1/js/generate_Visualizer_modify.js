/* 线段树区间修改可视化模块 */

// --- Start of Adaptive Functionality State ---
let lastModifyBuiltN = 0;
let lastModifyBuiltContainer = null;
let isModifyTreeRendered = false;
let modifyDomNodeElements = new Map(); // Stores DOM node elements, keyed by 'u'
let modifyDomLineElements = new Map(); // Stores DOM line elements, keyed by child 'u'
let currentModifyTreeLevelsData = [];
let currentModifyTreeBuildOrderData = [];
let activeModifyBuildAnimationTimeout = null; // To cancel ongoing build animation
// --- End of Adaptive Functionality State ---

// Debounce function
function debounceModify(func, wait) {
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

// 线段树区间修改可视化 - 基于边界的智能布局算法（带初始数据）
function buildModifyTreeVisualizationWithData(dataArray, container, isResizeUpdate = false) {
  console.log('🌲 buildModifyTreeVisualizationWithData 被调用', { 
    dataArray, 
    containerExists: !!container, 
    isResizeUpdate 
  });
  const n = dataArray.length;
  
  if (!isResizeUpdate) {
    // This is an initial build or a full rebuild
    lastModifyBuiltN = n;
    lastModifyBuiltContainer = container;
    isModifyTreeRendered = false; // Mark as not rendered until animation completes
    modifyDomNodeElements.clear();
    modifyDomLineElements.clear();
    currentModifyTreeLevelsData = [];
    currentModifyTreeBuildOrderData = [];

    if (activeModifyBuildAnimationTimeout) {
      clearTimeout(activeModifyBuildAnimationTimeout);
      activeModifyBuildAnimationTimeout = null;
    }

    if (n < 1 || n > 8) {
      alert('请输入1-8个数字');
      return;
    }
    
    // 清空容器内容并创建固定的结构
    container.innerHTML = '<h4>🔧 线段树区间修改过程:</h4>';
    container.innerHTML += `<p><strong>数组数据:</strong> [${dataArray.join(', ')}]</p>`;
    container.innerHTML += `<p><strong>数组长度:</strong> ${n}</p>`;
    const treeVisual = document.createElement('div');
    treeVisual.className = 'modify-tree-visual';
    treeVisual.style.position = 'relative';
    treeVisual.style.width = '100%';
    treeVisual.style.padding = '25px'; // Padding is part of treeVisual itself
    treeVisual.style.background = 'var(--card-bg)';
    treeVisual.style.borderRadius = '12px'; // 改为12px圆角
    treeVisual.style.border = '2px solid rgba(255, 255, 255, 0.8)'; // 添加白边
    treeVisual.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)'; // 调整阴影
    treeVisual.style.overflow = 'visible';
    treeVisual.style.minHeight = '200px'; // 设置最小高度，确保盒子可见
    container.appendChild(treeVisual);
  }
  const treeVisual = container.querySelector('.modify-tree-visual');
  if (!treeVisual) {
    console.error("Modify tree visual element not found.");
    return;
  }  const containerWidth = treeVisual.clientWidth - 50; // 与原始实现相同
  const nodeMinWidth = 50; // 与原始实现相同
  const levelHeight = 100; // 增加层级间距，从80px增加到100px
  const padding = 25; // 与原始实现相同
  // 构建带初始值的线段树 - 维护最大值、最小值、区间和
  const tree = new Array(4 * n);
  const lazy = new Array(4 * n).fill(0);
  
  // 初始化树节点
  for (let i = 0; i < 4 * n; i++) {
    tree[i] = { sum: 0, max: -Infinity, min: Infinity };
  }
  
  // 构建初始线段树
  function buildTree(arr, tree, node, start, end) {
    if (start === end) {
      const value = arr[start - 1]; // 数组索引从0开始，区间从1开始
      tree[node] = { sum: value, max: value, min: value };
    } else {
      const mid = Math.floor((start + end) / 2);
      buildTree(arr, tree, 2 * node, start, mid);
      buildTree(arr, tree, 2 * node + 1, mid + 1, end);
      // 合并左右子节点的信息
      const leftChild = tree[2 * node];
      const rightChild = tree[2 * node + 1];
      tree[node] = {
        sum: leftChild.sum + rightChild.sum,
        max: Math.max(leftChild.max, rightChild.max),
        min: Math.min(leftChild.min, rightChild.min)
      };
    }
  }
    buildTree(dataArray, tree, 1, 1, n);
  
  console.log('🌳 线段树构建完成:', {
    n,
    treeSize: tree.length,
    rootNode: tree[1],
    sampleNodes: [tree[2], tree[3]]
  });
  
  if (!isResizeUpdate) {
    // This is an initial build: collect tree levels data with actual values
    currentModifyTreeLevelsData = []; // Clear for new build

    function collectModifyLevelsWithData(l, r, u, depth = 0) {
      if (l > r) return; // Base case: invalid range, do not process
      if (!currentModifyTreeLevelsData[depth]) currentModifyTreeLevelsData[depth] = [];
      const treeNode = tree[u] || { sum: 0, max: 0, min: 0 };
      const lazyValue = lazy[u] || 0;
      currentModifyTreeLevelsData[depth].push({ 
        l, r, u, depth, 
        lazy: lazyValue, 
        sum: treeNode.sum,
        max: treeNode.max,
        min: treeNode.min
      });
      if (l < r) { // Only recurse if the range can be split further
        const mid = Math.floor((l + r) / 2);
        collectModifyLevelsWithData(l, mid, u * 2, depth + 1);
        if (mid < r) { // Ensure right child is only processed if its range is valid
            collectModifyLevelsWithData(mid + 1, r, u * 2 + 1, depth + 1);
        }
      }    }
    collectModifyLevelsWithData(1, n, 1);
    
    console.log('📊 层级数据收集完成:', {
      totalLevels: currentModifyTreeLevelsData.length,
      levelCounts: currentModifyTreeLevelsData.map(level => level.length),
      sampleData: currentModifyTreeLevelsData[0]
    });

    const totalLevels = currentModifyTreeLevelsData.length;
    const baseHeight = 60;
    const calculatedHeight = totalLevels * levelHeight + baseHeight + 40;
    const minHeight = Math.max(200, calculatedHeight);
    treeVisual.style.minHeight = `${minHeight}px`;
    treeVisual.style.height = `${minHeight}px`;  }
  
  const nodePositions = new Map();

  // 修改后的位置计算函数调用
  function calculateModifyNodePositionsWithData(l, r, u, depth = 0, parentX = null, parentW = null) {
    // Check if this node should exist based on currentModifyTreeLevelsData
    const levelNodes = currentModifyTreeLevelsData[depth];
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
        calculateModifyNodePositionsWithData(l, mid, u * 2, depth + 1, x, nodeWidth);
        if (mid < r) { // Ensure right child is only processed if its range is valid
            calculateModifyNodePositionsWithData(mid + 1, r, u * 2 + 1, depth + 1, x, nodeWidth);
        }
    }
  }
  // 调用位置计算函数
  calculateModifyNodePositionsWithData(1, n, 1, 0, null, null);
  
  console.log('📍 节点位置计算完成:', {
    totalPositions: nodePositions.size,
    samplePositions: Array.from(nodePositions.entries()).slice(0, 3)
  });
  
    if (!isResizeUpdate) {
    // This is a new build: generate render order and start animation with actual data
    currentModifyTreeBuildOrderData = []; // Clear for new build

    function generateModifyBuildOrderWithData(l, r, u, depth = 0) {
      if (l > r) return;
      
      const levelNodes = currentModifyTreeLevelsData[depth];
      if (!levelNodes || !levelNodes.find(node => node.u === u && node.l === l && node.r === r)) {
          return; 
      }

      const treeNode = tree[u] || { sum: 0, max: 0, min: 0 };
      const lazyValue = lazy[u] || 0;
      currentModifyTreeBuildOrderData.push({ 
        l, r, u, depth, 
        lazy: lazyValue, 
        sum: treeNode.sum,
        max: treeNode.max,
        min: treeNode.min
      }); 
      
      if (l < r) {
        const mid = Math.floor((l + r) / 2);
        generateModifyBuildOrderWithData(l, mid, u * 2, depth + 1);
        if (mid < r) {
            generateModifyBuildOrderWithData(mid + 1, r, u * 2 + 1, depth + 1);
        }
      }
    }
    generateModifyBuildOrderWithData(1, n, 1);

    let orderIndex = 0;
    function renderNextModifyNodeWithData() {      if (orderIndex >= currentModifyTreeBuildOrderData.length) {
        isModifyTreeRendered = true;
        activeModifyBuildAnimationTimeout = null;
        return;
      }

      const { l, r, u, depth, lazy, sum, max, min } = currentModifyTreeBuildOrderData[orderIndex];
      const position = nodePositions.get(u);
      if (!position) {
          orderIndex++;
          activeModifyBuildAnimationTimeout = setTimeout(renderNextModifyNodeWithData, 50);
          return;
      }        // 创建节点显示内容，按新的布局格式
      const nodeDiv = document.createElement('div');
      nodeDiv.className = `modify-tree-node depth-${depth}`;
      nodeDiv.setAttribute('data-node-id', u);
      
      // 创建节点内容的HTML结构
      nodeDiv.innerHTML = `
        <div class="node-interval">[${l},${r}]</div>
        <div class="node-row">
          <span class="node-sum">sum:${sum}</span>
          <span class="node-max">max:${max}</span>
        </div>
        <div class="node-row">
          <span class="node-min">min:${min}</span>
          <span class="node-lazy">lazy:${lazy}</span>
        </div>
      `;
        nodeDiv.style.position = 'absolute';
      nodeDiv.style.left = `${position.x - position.nodeWidth / 2}px`;
      nodeDiv.style.top = `${position.y}px`;
      nodeDiv.style.width = `${position.nodeWidth}px`;
      nodeDiv.style.zIndex = '10';      nodeDiv.style.minHeight = '80px'; // 增加节点高度以容纳更大字体
      nodeDiv.style.display = 'flex';
      nodeDiv.style.flexDirection = 'column';
      nodeDiv.style.justifyContent = 'center';
      nodeDiv.style.alignItems = 'center';
      nodeDiv.style.fontSize = '13px'; // 增大字体到与原始实现相同
      nodeDiv.style.lineHeight = '1.3';
      nodeDiv.style.padding = '6px';
      nodeDiv.style.boxSizing = 'border-box';
      nodeDiv.style.borderRadius = '8px';
      nodeDiv.style.border = '2px solid #74b9ff';
      nodeDiv.style.background = 'linear-gradient(135deg, #74b9ff, #0984e3)';
      nodeDiv.style.color = 'white';
      nodeDiv.style.fontWeight = 'bold';
      nodeDiv.style.textAlign = 'center';
      nodeDiv.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
      
      // 添加内部样式
      const intervalDiv = nodeDiv.querySelector('.node-interval');
      if (intervalDiv) {
        intervalDiv.style.fontSize = '13px'; // 增大区间字体
        intervalDiv.style.fontWeight = 'bold';
        intervalDiv.style.marginBottom = '2px';
      }
      
      const rowDivs = nodeDiv.querySelectorAll('.node-row');
      rowDivs.forEach(row => {
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.width = '100%';
        row.style.fontSize = '13px'; // 增大数值字体
        row.style.marginBottom = '1px';
      });
      
      // 为数值添加样式
      const spans = nodeDiv.querySelectorAll('span');
      spans.forEach(span => {
        span.style.flex = '1';
        span.style.textAlign = 'center';
        span.style.fontSize = '13px'; // 确保所有文字大小一致
      });
      
      const nodeColor = window.nodeColor || '#74b9ff';
      if (nodeColor !== '#74b9ff') {
        nodeDiv.style.background = nodeColor;
        nodeDiv.style.border = `2px solid ${nodeColor}`;
      }
      
      nodeDiv.style.opacity = '0';
      nodeDiv.style.transform = 'translateY(-10px)';
        treeVisual.appendChild(nodeDiv);
      modifyDomNodeElements.set(u, nodeDiv); // Store DOM element
      
      if (depth > 0) {
        addModifyConnectionLine(u, nodePositions, treeVisual); // This will also store the line in modifyDomLineElements
        console.log(`🔗 添加连线: 节点${u} -> 父节点${Math.floor(u/2)}`);
      }
      
      setTimeout(() => {
        nodeDiv.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        nodeDiv.style.opacity = '1';
        nodeDiv.style.transform = 'translateY(0)';
      }, 50);

      orderIndex++;
      const animationDelay = getModifyAnimationDelay();
      activeModifyBuildAnimationTimeout = setTimeout(renderNextModifyNodeWithData, animationDelay / 6);
    }
    
    activeModifyBuildAnimationTimeout = setTimeout(renderNextModifyNodeWithData, 500); // Initial call for animation
  } else {
    // This is a resize update: update existing DOM elements
    modifyDomNodeElements.forEach((nodeDiv, u) => {
      const position = nodePositions.get(u);
      if (position) {
        nodeDiv.style.left = `${position.x - position.nodeWidth / 2}px`;
        nodeDiv.style.top = `${position.y}px`;
        nodeDiv.style.width = `${position.nodeWidth}px`;
      }    });

    modifyDomLineElements.forEach((line, childId) => {
      const parentId = Math.floor(childId / 2);
      const childPos = nodePositions.get(childId);
      const parentPos = nodePositions.get(parentId);      if (childPos && parentPos) {
        const deltaX = childPos.x - parentPos.x;
        const deltaY = childPos.y - parentPos.y - 40; // 增加偏移量以适应更高的节点
        const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        
        line.style.width = `${length}px`;
        line.style.left = `${parentPos.x}px`;
        line.style.top = `${parentPos.y + 40}px`; // 增加偏移量以适应更高的节点
        line.style.transform = `rotate(${angle}deg)`;
      }
    });
    isModifyTreeRendered = true; // Ensure flag is set after resize update
  }
}

// Modified to store line element for modify tree
function addModifyConnectionLine(nodeId, nodePositions, treeVisual) {
  const parentId = Math.floor(nodeId / 2);
  const childPos = nodePositions.get(nodeId);
  const parentPos = nodePositions.get(parentId);
  
  if (!childPos || !parentPos) return;
  
  const line = document.createElement('div');
  line.className = 'modify-tree-connection-line';
  line.style.position = 'absolute';
  line.style.background = 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))';
  line.style.zIndex = '5';
  line.style.opacity = '0';
  line.style.borderRadius = '1px';
    const deltaX = childPos.x - parentPos.x;
  const deltaY = childPos.y - parentPos.y - 40; // 增加偏移量以适应更高的节点
  const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
  
  line.style.width = `${length}px`;
  line.style.height = '2px'; // 与原始实现相同的高度
  line.style.left = `${parentPos.x}px`;
  line.style.top = `${parentPos.y + 40}px`; // 增加偏移量以适应更高的节点
  line.style.transformOrigin = '0 50%';
  line.style.transform = `rotate(${angle}deg)`;
  
  treeVisual.appendChild(line);
  modifyDomLineElements.set(nodeId, line); // Store DOM element for the line

  setTimeout(() => {
    line.style.transition = 'opacity 0.4s ease-in-out';
    line.style.opacity = '0.8'; // 与原始实现相同的不透明度
  }, 200);
}

// 获取区间修改动画延迟
function getModifyAnimationDelay() {
  const animationSpeed = window.animationSpeed || 'fast'; // Assuming animationSpeed might be set globally
  const speeds = { slow: 2000, normal: 1000, fast: 500 };
  return speeds[animationSpeed] || 1000;
}

// 区间修改操作
function performRangeUpdate(modifyL, modifyR, delta, container) {
  if (!isModifyTreeRendered || !lastModifyBuiltContainer) {
    alert('请先构建线段树！');
    return;
  }

  // 清除之前的高亮
  modifyDomNodeElements.forEach((nodeDiv) => {
    nodeDiv.style.background = 'linear-gradient(135deg, #74b9ff, #0984e3)';
    nodeDiv.style.border = '2px solid #74b9ff';
    nodeDiv.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
  });

  const affectedNodes = [];
  
  // 模拟区间修改过程
  function updateRange(l, r, u, tl, tr, delta) {
    if (modifyL > tr || modifyR < tl) {
      return; // 完全不相交
    }
    
    if (modifyL <= tl && tr <= modifyR) {
      // 完全包含，懒标记
      affectedNodes.push({ u, type: 'lazy', tl, tr });
      return;
    }
    
    // 部分相交，需要下推
    affectedNodes.push({ u, type: 'pushdown', tl, tr });
    const mid = Math.floor((tl + tr) / 2);
    updateRange(l, r, u * 2, tl, mid, delta);
    if (mid < tr) {
      updateRange(l, r, u * 2 + 1, mid + 1, tr, delta);
    }
  }

  updateRange(modifyL, modifyR, 1, 1, lastModifyBuiltN, delta);

  // 动画显示受影响的节点
  let animationIndex = 0;
  function animateNextNode() {
    if (animationIndex >= affectedNodes.length) {
      return;
    }

    const { u, type } = affectedNodes[animationIndex];
    const nodeDiv = modifyDomNodeElements.get(u);
    
    if (nodeDiv) {
      if (type === 'lazy') {
        // 懒标记节点 - 红色
        nodeDiv.style.background = 'linear-gradient(135deg, #ff6b6b, #e74c3c)';
        nodeDiv.style.border = '2px solid #e74c3c';
        nodeDiv.style.boxShadow = '0 2px 12px rgba(231, 76, 60, 0.3)';        // 更新节点内容显示懒标记 - 根据新的HTML结构
        const lazySpan = nodeDiv.querySelector('.node-lazy');
        if (lazySpan) {
          lazySpan.textContent = `lazy:${delta}`;
          // 重新应用样式确保格式正确
          lazySpan.style.flex = '1';
          lazySpan.style.textAlign = 'center';
        }
      } else if (type === 'pushdown') {
        // 下推节点 - 橙色
        nodeDiv.style.background = 'linear-gradient(135deg, #f39c12, #e67e22)';
        nodeDiv.style.border = '2px solid #e67e22';
        nodeDiv.style.boxShadow = '0 2px 12px rgba(230, 126, 34, 0.3)';
      }
    }

    animationIndex++;
    setTimeout(animateNextNode, 600);
  }

  setTimeout(animateNextNode, 300);
}

// 初始化显示区间修改可视化的容器
function initializeModifyTreeContainer(container) {
  container.innerHTML = ''; // 不显示任何标题
  
  const treeVisual = document.createElement('div');
  treeVisual.className = 'modify-tree-visual';
  treeVisual.style.position = 'relative';
  treeVisual.style.width = '100%';
  treeVisual.style.padding = '25px';
  treeVisual.style.background = 'var(--card-bg)';
  treeVisual.style.borderRadius = '12px';
  treeVisual.style.border = '2px solid rgba(255, 255, 255, 0.8)';
  treeVisual.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
  treeVisual.style.overflow = 'visible';
  treeVisual.style.minHeight = '200px';
  treeVisual.style.display = 'flex';
  treeVisual.style.alignItems = 'center';
  treeVisual.style.justifyContent = 'center';
  treeVisual.style.color = 'var(--text-color)';
  treeVisual.style.fontSize = '16px';
  treeVisual.style.opacity = '0.7';
  
  treeVisual.innerHTML = '<div style="text-align: center;">🔧 请输入数组数据并点击"更新可视化"按钮查看线段树区间修改动画</div>';
  
  container.appendChild(treeVisual);
}

// 随机生成数组数据
function generateRandomData() {
  const length = Math.floor(Math.random() * 8) + 1; // 1-8个数字
  const data = [];
  for (let i = 0; i < length; i++) {
    data.push(Math.floor(Math.random() * 10) + 1); // 1-10之间的数字
  }
  return data.join(' ');
}

// 解析输入的数组数据
function parseInputData(inputString) {
  if (!inputString.trim()) {
    return null;
  }
  
  const numbers = inputString.trim().split(/\s+/).map(num => parseInt(num)).filter(num => !isNaN(num));
  
  if (numbers.length === 0) {
    return null;
  }
  
  if (numbers.length > 8) {
    alert('数组长度不能超过8个数字');
    return null;
  }
  
  if (numbers.some(num => num < 1 || num > 100)) {
    alert('数字应该在1-100范围内');
    return null;
  }
  
  return numbers;
}

// Modified initModifyTreeVisualizer
function initModifyTreeVisualizer() {
  console.log('🔧 初始化区间修改可视化模块...');
  
  const inputCustomData = document.getElementById('input-custom-data');
  const btnRandomData = document.getElementById('btn-random-data');
  const btnUpdateCustomData = document.getElementById('btn-update-custom-data');
  const treeContainer = document.getElementById('custom-tree-visualizer-host');
  const inputModifyLeft = document.getElementById('input-modify-left');
  const inputModifyRight = document.getElementById('input-modify-right');
  const inputModifyValue = document.getElementById('input-modify-value');
  const btnApplyModification = document.getElementById('btn-apply-modification');
  
  console.log('🔍 查找到的HTML元素:', {
    inputCustomData: !!inputCustomData,
    btnRandomData: !!btnRandomData,
    btnUpdateCustomData: !!btnUpdateCustomData,
    treeContainer: !!treeContainer,
    inputModifyLeft: !!inputModifyLeft,
    inputModifyRight: !!inputModifyRight,
    inputModifyValue: !!inputModifyValue,
    btnApplyModification: !!btnApplyModification
  });
    // 初始化时显示区间修改可视化的盒子
  if (treeContainer) {
    initializeModifyTreeContainer(treeContainer);
  }
  
  // 随机生成数据按钮
  if (btnRandomData && inputCustomData) {
    console.log('✅ 绑定随机生成按钮事件');
    btnRandomData.addEventListener('click', () => {
      console.log('🎲 点击随机生成按钮');
      const randomData = generateRandomData();
      console.log('📊 生成的随机数据:', randomData);
      inputCustomData.value = randomData;
      console.log('✅ 数据已填入输入框');
    });  } else {
    console.log('❌ 无法绑定随机生成按钮，元素缺失:', { btnRandomData: !!btnRandomData, inputCustomData: !!inputCustomData });
  }
  
  // 更新可视化按钮
  if (btnUpdateCustomData && treeContainer && inputCustomData) {
    console.log('✅ 绑定更新可视化按钮事件');
    btnUpdateCustomData.addEventListener('click', () => {
      console.log('🚀 点击更新可视化按钮');
      console.log('📝 输入框内容:', `"${inputCustomData.value}"`);
      const inputData = parseInputData(inputCustomData.value);
      console.log('🔍 解析结果:', inputData);
      if (!inputData) {
        if (!inputCustomData.value.trim()) {
          alert('请输入数组数据或点击随机生成');
        }
        return;
      }
      
      const n = inputData.length;
      console.log('📏 数组长度:', n);
      console.log('🎨 开始构建树可视化...');
      buildModifyTreeVisualizationWithData(inputData, treeContainer, false);
    });
  } else {
    console.log('❌ 无法绑定更新可视化按钮，元素缺失:', { 
      btnUpdateCustomData: !!btnUpdateCustomData, 
      treeContainer: !!treeContainer, 
      inputCustomData: !!inputCustomData 
    });
  }

  // 应用修改按钮
  if (btnApplyModification && treeContainer) {
    btnApplyModification.addEventListener('click', () => {
      const l = parseInt(inputModifyLeft?.value || '1');
      const r = parseInt(inputModifyRight?.value || '1');
      const delta = parseInt(inputModifyValue?.value || '1');
      
      if (!lastModifyBuiltN || lastModifyBuiltN === 0) {
        alert('请先构建线段树！');
        return;
      }
      
      if (l < 1 || r > lastModifyBuiltN || l > r) {
        alert(`请输入有效的区间范围 [1, ${lastModifyBuiltN}]`);
        return;
      }
      
      performRangeUpdate(l, r, delta, treeContainer);
    });
  }
  window.addEventListener('resize', debounceModify(() => {
    if (isModifyTreeRendered && lastModifyBuiltContainer && lastModifyBuiltN > 0) {
      // 直接重绘，不检查可见性
      buildModifyTreeVisualizationWithData([], lastModifyBuiltContainer, true); // true for resize update
    }
  }, 250));
}

// Export functions
window.ModifyTreeVisualizer = {
  buildModifyTreeVisualizationWithData,
  initModifyTreeVisualizer,
  performRangeUpdate,
  generateRandomData,
  parseInputData
};

console.log('🌟 ModifyTreeVisualizer 模块已加载', window.ModifyTreeVisualizer);
