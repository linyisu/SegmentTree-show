/* 线段树区间修改可视化模块 */

// --- Start of Adaptive Functionality State ---
let lastModifyBuiltN = 0;
let lastModifyBuiltContainer = null;
let isModifyTreeRendered = false;
let modifyDomNodeElements = new Map(); // Stores DOM node elements, keyed by 'u'
let currentModifyTreeLevelsData = [];
let currentModifyTreeBuildOrderData = [];
let activeModifyBuildAnimationTimeout = null; // To cancel ongoing build animation

// 全局线段树数据
let globalTree = [];
let globalLazy = [];
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
  
  // 如果是 resize 更新且 dataArray 为 null，使用已保存的数据长度
  let n;
  if (isResizeUpdate && dataArray === null) {
    n = lastModifyBuiltN;
    console.log('🔄 Resize 更新，使用保存的数据长度:', n);
  } else {
    n = dataArray ? dataArray.length : 0;
  }
  
  if (!isResizeUpdate) {
    // This is an initial build or a full rebuild
    lastModifyBuiltN = n;
    lastModifyBuiltContainer = container;
    isModifyTreeRendered = false; // Mark as not rendered until animation completes
    modifyDomNodeElements.clear();
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
    treeVisual.style.borderRadius = '12px';
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
  }  // 🔧 强制重新获取容器宽度，特别是在resize时
  const treeVisualElement = isResizeUpdate ? 
    lastModifyBuiltContainer.querySelector('.modify-tree-visual') : treeVisual;
    
  if (!treeVisualElement) {
    console.error("Modify tree visual element not found.");
    return;
  }
  
  // 强制重新计算尺寸，确保获取最新值
  if (isResizeUpdate) {
    // 触发重流以获取准确的最新尺寸
    treeVisualElement.offsetHeight; // 强制重新计算
  }
  
  const containerWidth = treeVisualElement.clientWidth - 50;
  const nodeMinWidth = 50;
  const levelHeight = 100;
  const padding = 25;
  
  console.log('📏 容器信息 (强制更新尺寸):', {
    isResize: isResizeUpdate,
    clientWidth: treeVisualElement.clientWidth,
    containerWidth,
    effectiveWidth: containerWidth - (2 * padding)  });// 构建带初始值的线段树 - 维护最大值、最小值、区间和
  globalTree = new Array(4 * n);
  globalLazy = new Array(4 * n).fill(0);
  
  // 初始化树节点
  for (let i = 0; i < 4 * n; i++) {
    globalTree[i] = { sum: 0, max: -Infinity, min: Infinity };
  }
  
  // 🔧 修复：只在非resize更新时构建树数据
  if (!isResizeUpdate && dataArray) {
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
    buildTree(dataArray, globalTree, 1, 1, n);    
    console.log('🌳 线段树构建完成:', {
      n,
      treeSize: globalTree.length,
      rootNode: globalTree[1],
      sampleNodes: [globalTree[2], globalTree[3]]
    });
  } else if (isResizeUpdate) {
    console.log('🔄 Resize更新：跳过树数据重建，仅更新布局');
  }
  
  if (!isResizeUpdate) {    // This is an initial build: collect tree levels data with actual values
    currentModifyTreeLevelsData = []; // Clear for new build
    
    function collectModifyLevelsWithData(l, r, u, depth = 0) {
      if (l > r) return; // Base case: invalid range, do not process
      if (!currentModifyTreeLevelsData[depth]) currentModifyTreeLevelsData[depth] = [];
      const treeNode = globalTree[u] || { sum: 0, max: 0, min: 0 };
      const lazyValue = globalLazy[u] || 0;
      currentModifyTreeLevelsData[depth].push({        l, r, u, depth, 
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
  // 🎯 保持原始位置计算函数 - 完全恢复原始节点宽度逻辑
  function calculateModifyNodePositionsWithData(l, r, u, depth = 0, parentX = null, parentW = null) {
    // Check if this node should exist based on currentModifyTreeLevelsData
    const levelNodes = currentModifyTreeLevelsData[depth];
    if (!levelNodes || !levelNodes.find(node => node.u === u && node.l === l && node.r === r)) {
        return; // Do not calculate position for a node that doesn't exist in the collected levels
    }

    const y = depth * levelHeight + 30;
    let x, nodeWidth;    if (u === 1) { // Root node - 保持原始超长宽度
        nodeWidth = containerWidth - (2 * padding); // 原始逻辑：根节点横跨整个容器
        nodeWidth = Math.max(nodeMinWidth, nodeWidth);        x = (containerWidth + 50) / 2; // 修复居中：基于实际treeVisual宽度居中
        
        console.log('🌳 根节点 (强制更新尺寸):', { 
          treeVisualWidth: treeVisualElement.clientWidth,
          containerWidth, 
          nodeWidth: Math.round(nodeWidth), 
          x: Math.round(x) 
        });
    } else { // Child Node - 保持原始递减宽度
        if (parentW == null || parentX == null) {
            console.error(`Parent data not passed for node ${u}`);
            nodeWidth = nodeMinWidth; // Fallback
            const tempParentPos = nodePositions.get(Math.floor(u/2)); // Attempt to get from map if available
            x = tempParentPos ? tempParentPos.x : containerWidth / 2; // Fallback center
        } else {
            nodeWidth = parentW / 2; // 原始逻辑：子节点宽度是父节点的一半
            nodeWidth = Math.max(nodeMinWidth, nodeWidth);

            const isLeftChild = (u % 2 === 0);
            if (isLeftChild) {
                x = parentX - parentW / 4; // Center in parent's left half-width
            } else { // Right child
                x = parentX + parentW / 4; // Center in parent's right half-width
            }
            
            console.log(`🌿 子节点 u=${u} (原始递减宽度):`, { 
              isLeftChild, 
              parentW: Math.round(parentW), 
              nodeWidth: Math.round(nodeWidth), 
              x: Math.round(x) 
            });
        }
    }    // 修复边界检查逻辑 - 使用实际容器边界
    const actualContainerWidth = containerWidth + 50; // 实际treeVisual宽度
    const halfW = nodeWidth / 2;
    if (x - halfW < padding) { // Left edge should not be less than internal 'padding'
        x = padding + halfW;
    }
    if (x + halfW > actualContainerWidth - padding) { // Right edge should not exceed actual container width
        x = actualContainerWidth - padding - halfW;
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
      }      const treeNode = globalTree[u] || { sum: 0, max: 0, min: 0 };
      const lazyValue = globalLazy[u] || 0;
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
        activeModifyBuildAnimationTimeout = null;
        
        // 延迟设置渲染完成标志，确保所有节点动画都完成
        setTimeout(() => {
          isModifyTreeRendered = true;
          console.log('🎉 线段树渲染完成，可以进行区间修改操作');
        }, 1000); // 等待所有动画完成
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
      nodeDiv.setAttribute('data-node-id', u);      // 创建节点内容的HTML结构
      const lazyDisplay = lazy === 0 ? '-' : lazy;
      nodeDiv.innerHTML = `
        <div class="node-interval">[${l},${r}]</div>
        <div class="node-row">
          <span class="node-sum">sum:${sum}</span>
          <span class="node-min">min:${min}</span>
        </div>
        <div class="node-row">
          <span class="node-lazy">lazy:${lazyDisplay}</span>
          <span class="node-max">max:${max}</span>
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
    // This is a resize update: update existing DOM elements with smooth animation
    console.log('🔄 RESIZE更新: 开始更新现有DOM元素位置和大小');
    console.log('📊 当前nodePositions Map内容:', Array.from(nodePositions.entries()));
    let updateCount = 0;
    
    modifyDomNodeElements.forEach((nodeDiv, u) => {
      const position = nodePositions.get(u);
      if (position) {
        // 记录更新前的状态
        const oldLeft = nodeDiv.style.left;
        const oldWidth = nodeDiv.style.width;
        
        // 直接计算新值，确保使用最新的位置信息
        const newLeft = `${position.x - position.nodeWidth / 2}px`;
        const newTop = `${position.y}px`;
        const newWidth = `${position.nodeWidth}px`;
        
        console.log(`🔍 节点 u=${u} 详细对比:`, {
          positionData: position,
          calculated: {
            left: position.x - position.nodeWidth / 2,
            width: position.nodeWidth
          },
          old: { left: oldLeft, width: oldWidth },
          new: { left: newLeft, width: newWidth }
        });
        
        // 强制清除现有样式并重新设置
        nodeDiv.style.transition = '';
        nodeDiv.style.left = '';
        nodeDiv.style.width = '';
        
        // 强制重流
        nodeDiv.offsetHeight;
        
        // 重新设置样式
        nodeDiv.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        nodeDiv.style.left = newLeft;
        nodeDiv.style.top = newTop;
        nodeDiv.style.width = newWidth;
        
        // 再次强制触发重绘
        nodeDiv.offsetHeight;
        
        updateCount++;
      } else {
        console.warn(`❌ 节点 u=${u} 没有找到位置信息`);
      }
    });
    
    console.log(`✅ RESIZE更新完成: 更新了${updateCount}个节点`);
    
    // 验证DOM更新是否生效
    setTimeout(() => {
      console.log('🔍 验证DOM更新结果:');
      modifyDomNodeElements.forEach((nodeDiv, u) => {
        const computedStyle = window.getComputedStyle(nodeDiv);
        console.log(`节点 u=${u} 最终样式:`, {
          left: nodeDiv.style.left,
          width: nodeDiv.style.width,
          computedLeft: computedStyle.left,
          computedWidth: computedStyle.width
        });
      });
    }, 100);
    
    // 清除过渡动画以避免影响后续操作
    setTimeout(() => {
      modifyDomNodeElements.forEach((nodeDiv) => {
        nodeDiv.style.transition = '';
      });
    }, 300);
    
    isModifyTreeRendered = true; // Ensure flag is set after resize update
  }
}

// ========== 线段树区间修改核心函数 ==========

// 下推懒标记
function pushDown(u, tl, tr) {
  if (globalLazy[u] !== 0) {
    const delta = globalLazy[u];
    const len = tr - tl + 1;
    
    // 更新当前节点的值
    globalTree[u].sum += delta * len;
    globalTree[u].max += delta;
    globalTree[u].min += delta;
    
    // 如果不是叶子节点，下推到子节点
    if (tl !== tr) {
      globalLazy[u * 2] += delta;
      globalLazy[u * 2 + 1] += delta;
    }
    
    globalLazy[u] = 0;
  }
}

// 向上更新节点信息
function pushUp(u) {
  const left = globalTree[u * 2];
  const right = globalTree[u * 2 + 1];
  
  globalTree[u].sum = left.sum + right.sum;
  globalTree[u].max = Math.max(left.max, right.max);
  globalTree[u].min = Math.min(left.min, right.min);
}

// 区间修改函数
function updateRange(l, r, tl, tr, u, delta) {
  console.log(`🔧 updateRange: [${l},${r}] 在节点 u=${u} [${tl},${tr}] 增加 ${delta}`);
  
  // 下推懒标记
  pushDown(u, tl, tr);
  
  // 如果当前区间完全包含在修改区间内
  if (l <= tl && tr <= r) {
    globalLazy[u] += delta;
    pushDown(u, tl, tr);
    console.log(`✅ 节点 u=${u} [${tl},${tr}] 完全包含，添加懒标记 ${delta}`);
    return;
  }
  
  // 如果没有交集
  if (r < tl || l > tr) {
    console.log(`❌ 节点 u=${u} [${tl},${tr}] 与修改区间无交集`);
    return;
  }
  
  // 递归修改子节点
  const mid = Math.floor((tl + tr) / 2);
  updateRange(l, r, tl, mid, u * 2, delta);
  updateRange(l, r, mid + 1, tr, u * 2 + 1, delta);
  
  // 下推子节点的懒标记，然后向上更新
  pushDown(u * 2, tl, mid);
  pushDown(u * 2 + 1, mid + 1, tr);
  pushUp(u);
  
  console.log(`🔄 节点 u=${u} [${tl},${tr}] 更新完成，新值:`, globalTree[u]);
}

// ========== 线段树区间修改核心函数结束 ==========

// 获取区间修改动画延迟
function getModifyAnimationDelay() {
  const animationSpeed = window.animationSpeed || 'fast'; // Assuming animationSpeed might be set globally
  const speeds = { slow: 2000, normal: 1000, fast: 500 };
  return speeds[animationSpeed] || 1000;
}

// 区间修改操作 - 直接完成版本
function performRangeUpdate(modifyL, modifyR, delta, container) {
  console.log('🔧 performRangeUpdate 被调用', {
    modifyL, modifyR, delta,
    isModifyTreeRendered,
    lastModifyBuiltContainer: !!lastModifyBuiltContainer,
    modifyDomNodeElements_size: modifyDomNodeElements.size
  });
  
  if (!isModifyTreeRendered || !lastModifyBuiltContainer) {
    alert('请先构建线段树！');
    console.warn('线段树状态检查失败');
    return;
  }

  console.log(`⚡ 开始直接完成修改: 区间[${modifyL}, ${modifyR}] 增加 ${delta}`);

  // 1. 执行实际的区间更新
  updateRange(modifyL, modifyR, 1, lastModifyBuiltN, 1, delta);
  console.log('✅ 区间更新完成');

  // 2. 重置所有节点样式
  modifyDomNodeElements.forEach((nodeDiv) => {
    nodeDiv.style.background = 'linear-gradient(135deg, #74b9ff, #0984e3)';
    nodeDiv.style.border = '2px solid #74b9ff';
    nodeDiv.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
  });

  // 3. 收集并高亮受影响的节点
  const affectedNodes = [];
  
  function collectAffectedNodes(u, tl, tr) {
    // 检查当前节点是否与修改区间有交集
    if (modifyL > tr || modifyR < tl) {
      return; // 完全不相交
    }
    
    if (modifyL <= tl && tr <= modifyR) {
      // 完全包含，这是懒标记节点
      affectedNodes.push({ u, type: 'lazy', tl, tr });
      return; // 不需要继续向下
    }
    
    // 部分相交，这是下推节点
    affectedNodes.push({ u, type: 'pushdown', tl, tr });
    
    // 继续检查子节点
    if (tl < tr) {
      const mid = Math.floor((tl + tr) / 2);
      collectAffectedNodes(u * 2, tl, mid);
      collectAffectedNodes(u * 2 + 1, mid + 1, tr);
    }
  }
  
  collectAffectedNodes(1, 1, lastModifyBuiltN);
  console.log(`📊 收集到 ${affectedNodes.length} 个受影响的节点:`, affectedNodes);

  // 4. 立即高亮所有受影响的节点并更新显示
  affectedNodes.forEach(({ u, type, tl, tr }, index) => {
    const nodeDiv = modifyDomNodeElements.get(u);
    
    if (nodeDiv) {
      setTimeout(() => {
        if (type === 'lazy') {
          // 懒标记节点 - 红色
          nodeDiv.style.background = 'linear-gradient(135deg, #ff6b6b, #e74c3c)';
          nodeDiv.style.border = '2px solid #e74c3c';
          nodeDiv.style.boxShadow = '0 2px 12px rgba(231, 76, 60, 0.3)';
          console.log(`🔴 高亮懒标记节点 u=${u} [${tl},${tr}]`);
        } else {
          // 下推节点 - 橙色
          nodeDiv.style.background = 'linear-gradient(135deg, #f39c12, #e67e22)';
          nodeDiv.style.border = '2px solid #e67e22';
          nodeDiv.style.boxShadow = '0 2px 12px rgba(230, 126, 34, 0.3)';
          console.log(`🟠 高亮下推节点 u=${u} [${tl},${tr}]`);
        }
          // 立即更新节点显示的数值
        updateNodeDisplayWithLazyPush(u, tl, tr);
      }, index * 200); // 错开动画时间
    }
  });

  // 5. 立即更新所有相关节点显示（确保数据同步）
  console.log('🔄 立即更新所有相关节点显示');
  setTimeout(() => {
    // 遍历整个树，更新所有可能受影响的节点
    function updateAllRelatedNodes(u, tl, tr) {
      // 如果这个节点存在于DOM中，就更新它
      if (modifyDomNodeElements.has(u)) {
        updateNodeDisplayWithLazyPush(u, tl, tr);
      }
      
      // 如果当前节点区间与修改区间有交集，递归更新子节点
      if (tl < tr && (modifyL <= tr && modifyR >= tl)) {
        const mid = Math.floor((tl + tr) / 2);
        updateAllRelatedNodes(u * 2, tl, mid);
        updateAllRelatedNodes(u * 2 + 1, mid + 1, tr);
      }
    }
    
    updateAllRelatedNodes(1, 1, lastModifyBuiltN);
    console.log('✅ 所有相关节点显示更新完成');
  }, 100); // 很快执行，确保数据同步

  // 6. 最终确保所有节点都是最新状态
  setTimeout(() => {
    console.log('🎯 直接完成修改 - 最终确保所有节点状态正确');
    modifyDomNodeElements.forEach((nodeDiv, u) => {
      const nodeInfo = findNodeRange(u, 1, 1, lastModifyBuiltN);
      if (nodeInfo) {
        updateNodeDisplayWithLazyPush(u, nodeInfo.tl, nodeInfo.tr);
      }
    });}, affectedNodes.length * 200 + 500);
}

// 辅助函数：根据节点编号找到对应的区间范围
function findNodeRange(targetU, u, tl, tr) {
  if (u === targetU) {
    return { tl, tr };
  }
  
  if (tl === tr) {
    return null; // 叶子节点，没找到
  }
  
  const mid = Math.floor((tl + tr) / 2);
  
  // 在左子树中查找
  const leftResult = findNodeRange(targetU, u * 2, tl, mid);
  if (leftResult) return leftResult;
  
  // 在右子树中查找
  const rightResult = findNodeRange(targetU, u * 2 + 1, mid + 1, tr);
  if (rightResult) return rightResult;
  
  return null;
}

// 区间修改操作 - 步进版本
let stepModifyState = {
  isActive: false,
  affectedNodes: [],
  currentIndex: 0,
  modifyL: 0,
  modifyR: 0,
  delta: 0,
  container: null
};

function performRangeUpdateStep(modifyL, modifyR, delta, container) {
  console.log('👣 performRangeUpdateStep 被调用', {
    modifyL, modifyR, delta,
    isModifyTreeRendered,
    lastModifyBuiltContainer: !!lastModifyBuiltContainer,
    modifyDomNodeElements_size: modifyDomNodeElements.size
  });
  
  if (!isModifyTreeRendered || !lastModifyBuiltContainer) {
    alert('请先构建线段树！');
    if (!isModifyTreeRendered)
      console.warn('线段树尚未渲染，请先构建线段树');
    if (!lastModifyBuiltContainer)
      console.warn('线段树容器未找到，请先构建线段树');
    return;
  }

  // 如果已经在步进模式中，重置状态
  if (stepModifyState.isActive) {
    resetStepModifyState();
  }

  // 清除之前的高亮
  modifyDomNodeElements.forEach((nodeDiv) => {
    nodeDiv.style.background = 'linear-gradient(135deg, #74b9ff, #0984e3)';
    nodeDiv.style.border = '2px solid #74b9ff';
    nodeDiv.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
  });

  // 初始化步进状态
  stepModifyState.isActive = true;
  stepModifyState.affectedNodes = [];
  stepModifyState.currentIndex = 0;
  stepModifyState.modifyL = modifyL;  stepModifyState.modifyR = modifyR;
  stepModifyState.delta = delta;
  stepModifyState.container = container;
  
  // 🔧 不要立即执行修改，而是在步进过程中逐步执行
  // updateRange(modifyL, modifyR, 1, lastModifyBuiltN, 1, delta);
    // 模拟收集受影响的节点用于步进显示
  function collectAffectedNodes(modifyL, modifyR, u, tl, tr) {
    if (modifyL > tr || modifyR < tl) {
      return; // 完全不相交
    }
    
    if (modifyL <= tl && tr <= modifyR) {
      // 完全包含，懒标记
      stepModifyState.affectedNodes.push({ u, type: 'lazy', tl, tr });
      return;
    }
    
    // 部分相交，需要下推
    stepModifyState.affectedNodes.push({ u, type: 'pushdown', tl, tr });
    const mid = Math.floor((tl + tr) / 2);
    collectAffectedNodes(modifyL, modifyR, u * 2, tl, mid);
    if (mid < tr) {
      collectAffectedNodes(modifyL, modifyR, u * 2 + 1, mid + 1, tr);
    }
  }

  collectAffectedNodes(modifyL, modifyR, 1, 1, lastModifyBuiltN);

  // 显示步进控制提示
  showStepControls();
  
  console.log('👣 步进修改初始化完成，受影响节点数:', stepModifyState.affectedNodes.length);
}

function showStepControls() {
  // 创建步进控制面板
  let controlPanel = document.getElementById('step-control-panel');
  if (!controlPanel) {
    controlPanel = document.createElement('div');
    controlPanel.id = 'step-control-panel';
    controlPanel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border: 2px solid #74b9ff;
      border-radius: 12px;
      padding: 15px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      z-index: 1000;
      text-align: center;
      min-width: 280px;
      max-width: 320px;
    `;
    document.body.appendChild(controlPanel);
  }

  updateStepControlPanel();
}

function updateStepControlPanel() {
  const controlPanel = document.getElementById('step-control-panel');
  if (!controlPanel) return;

  const totalSteps = stepModifyState.affectedNodes.length;
  const currentStep = stepModifyState.currentIndex + 1;
  const isFinished = stepModifyState.currentIndex >= totalSteps;
  
  console.log(`🎮 updateStepControlPanel: currentIndex=${stepModifyState.currentIndex}, totalSteps=${totalSteps}, currentStep=${currentStep}, isFinished=${isFinished}`);
  
  controlPanel.innerHTML = `
    <h4 style="margin: 0 0 10px 0; font-size: 16px;">👣 步进修改模式</h4>
    <p style="margin: 5px 0; font-size: 14px;"><strong>区间:</strong> [${stepModifyState.modifyL}, ${stepModifyState.modifyR}] <strong>值:</strong> +${stepModifyState.delta}</p>
    <p style="margin: 5px 0; font-size: 14px;"><strong>进度:</strong> ${Math.min(currentStep, totalSteps)} / ${totalSteps}</p>
    <div style="margin: 10px 0;">
      <button id="btn-next-step" ${isFinished ? 'disabled' : ''} 
              style="margin: 2px; padding: 6px 12px; border: none; border-radius: 4px; font-size: 12px;
                     background: ${isFinished ? '#ccc' : '#74b9ff'}; color: white; cursor: ${isFinished ? 'not-allowed' : 'pointer'};">
        ${isFinished ? '✅ 完成' : '👣 下一步'}
      </button><br>
      <button id="btn-finish-steps" ${isFinished ? 'disabled' : ''}
              style="margin: 2px; padding: 6px 12px; border: none; border-radius: 4px; font-size: 12px;
                     background: ${isFinished ? '#ccc' : '#e74c3c'}; color: white; cursor: ${isFinished ? 'not-allowed' : 'pointer'};">
        ⚡ 直接完成
      </button>
      <button id="btn-close-steps"
              style="margin: 2px; padding: 6px 12px; border: none; border-radius: 4px; font-size: 12px;
                     background: #95a5a6; color: white; cursor: pointer;">
        ❌ 关闭
      </button>
    </div>  `;
  
  // 绑定按钮事件（使用onclick属性直接绑定）
  const btnNextStep = document.getElementById('btn-next-step');
  const btnFinishSteps = document.getElementById('btn-finish-steps');
  const btnCloseSteps = document.getElementById('btn-close-steps');

  if (btnNextStep && !isFinished) {
    btnNextStep.onclick = function() {
      console.log('🖱️ "下一步" 按钮被点击');
      executeNextStep();
    };
  }

  if (btnFinishSteps && !isFinished) {
    btnFinishSteps.onclick = function() {
      console.log('🖱️ "直接完成" 按钮被点击');
      finishAllSteps();
    };
  }

  if (btnCloseSteps) {
    btnCloseSteps.onclick = function() {
      console.log('🖱️ "关闭" 按钮被点击');
      closeStepControls();
    };
  }
}

function executeNextStep() {
  console.log(`👣 executeNextStep: currentIndex=${stepModifyState.currentIndex}, totalNodes=${stepModifyState.affectedNodes.length}`);
  
  if (stepModifyState.currentIndex >= stepModifyState.affectedNodes.length) {
    console.log('👣 所有步骤已完成');
    return;
  }

  const { u, type, tl, tr } = stepModifyState.affectedNodes[stepModifyState.currentIndex];
  const nodeDiv = modifyDomNodeElements.get(u);
  
  console.log(`👣 执行步骤 ${stepModifyState.currentIndex + 1}: 节点 u=${u} [${tl},${tr}] 类型=${type}`);
  
  if (nodeDiv) {
    if (type === 'lazy') {
      // 懒标记节点 - 红色，这种节点完全包含在修改区间内
      nodeDiv.style.background = 'linear-gradient(135deg, #ff6b6b, #e74c3c)';
      nodeDiv.style.border = '2px solid #e74c3c';
      nodeDiv.style.boxShadow = '0 2px 12px rgba(231, 76, 60, 0.3)';
      
      // 添加懒标记并下推
      globalLazy[u] += stepModifyState.delta;
      pushDown(u, tl, tr);
      
      console.log(`👣🔴 步进：懒标记节点 u=${u} [${tl},${tr}] 添加懒标记 ${stepModifyState.delta}`);
      updateNodeDisplayWithLazyPush(u, tl, tr);
    } else if (type === 'pushdown') {
      // 下推节点 - 橙色，这种节点部分相交，需要下推到子节点
      nodeDiv.style.background = 'linear-gradient(135deg, #f39c12, #e67e22)';
      nodeDiv.style.border = '2px solid #e67e22';
      nodeDiv.style.boxShadow = '0 2px 12px rgba(230, 126, 34, 0.3)';
      
      // 下推懒标记到子节点
      pushDown(u, tl, tr);
      
      console.log(`👣🟠 步进：下推节点 u=${u} [${tl},${tr}] 执行下推操作`);
      updateNodeDisplayWithLazyPush(u, tl, tr);
    }
  } else {
    console.log(`❌ 节点 u=${u} 的DOM元素未找到`);
  }
  
  stepModifyState.currentIndex++;
  console.log(`👣 步骤完成，currentIndex 更新为: ${stepModifyState.currentIndex}`);
  
  // 立即更新面板
  setTimeout(() => {
    updateStepControlPanel();
  }, 100);
}

function finishAllSteps() {
  // 快速执行剩余所有步骤
  while (stepModifyState.currentIndex < stepModifyState.affectedNodes.length) {
    executeNextStep();
  }
}

function closeStepControls() {
  resetStepModifyState();
  const controlPanel = document.getElementById('step-control-panel');
  if (controlPanel) {
    controlPanel.remove();
  }
}

function resetStepModifyState() {
  stepModifyState.isActive = false;
  stepModifyState.affectedNodes = [];
  stepModifyState.currentIndex = 0;
  stepModifyState.modifyL = 0;
  stepModifyState.modifyR = 0;
  stepModifyState.delta = 0;  stepModifyState.container = null;
}

// 初始化区间修改可视化模块
function initModifyTreeVisualizer() {
  console.log('🔧 初始化区间修改可视化模块...');
  
  // 获取所有需要的DOM元素
  const inputCustomData = document.getElementById('input-custom-data');
  const btnRandomData = document.getElementById('btn-random-data');
  const btnUpdateCustomData = document.getElementById('btn-update-custom-data');
  const btnApplyModificationDirect = document.getElementById('btn-apply-modification-direct');
  const btnApplyModificationStep = document.getElementById('btn-apply-modification-step');
  const customTreeVisualizerHost = document.getElementById('custom-tree-visualizer-host');
  
  // 初始化默认数据
  if (inputCustomData) {
    inputCustomData.value = "1 1 4 5 1 4";
  }
  
  // 绑定随机生成按钮事件
  if (btnRandomData) {
    btnRandomData.addEventListener('click', () => {
      console.log('🎲 随机生成数据按钮被点击');
      const randomArray = [];
      const length = Math.floor(Math.random() * 6) + 3; // 3-8个数字
      for (let i = 0; i < length; i++) {
        randomArray.push(Math.floor(Math.random() * 10) + 1); // 1-10的随机数
      }
      const randomDataString = randomArray.join(' ');
      if (inputCustomData) {
        inputCustomData.value = randomDataString;
      }
      console.log('🎲 生成的随机数据:', randomDataString);
    });
  } else {
    console.log('❌ 随机生成按钮未找到');
  }
  
  // 绑定更新可视化按钮事件
  if (btnUpdateCustomData && customTreeVisualizerHost) {
    btnUpdateCustomData.addEventListener('click', () => {
      console.log('🚀 更新可视化按钮被点击');
      const inputData = inputCustomData?.value?.trim() || '';
      if (!inputData) {
        alert('请输入数据或点击随机生成按钮！');
        return;
      }
      
      try {
        const dataArray = inputData.split(/\s+/).map(x => parseInt(x)).filter(x => !isNaN(x));
        if (dataArray.length === 0 || dataArray.length > 8) {
          alert('请输入1到8个有效数字！');
          return;
        }
        
        console.log('📊 构建线段树，数据:', dataArray);
        buildModifyTreeVisualizationWithData(dataArray, customTreeVisualizerHost, false);
      } catch (error) {
        console.error('❌ 解析数据时出错:', error);
        alert('数据格式不正确，请输入用空格分隔的数字！');
      }
    });
  } else {
    console.log('❌ 更新可视化按钮或容器未找到');
  }
    // 绑定直接完成修改按钮事件
  if (btnApplyModificationDirect) {
    btnApplyModificationDirect.addEventListener('click', () => {
      console.log('⚡ 直接完成修改按钮被点击');
      if (!isModifyTreeRendered) {
        alert('请先构建线段树！');
        return;
      }
      
      // 获取修改参数
      const modifyL = parseInt(document.getElementById('input-modify-left')?.value);
      const modifyR = parseInt(document.getElementById('input-modify-right')?.value);
      const modifyValue = parseInt(document.getElementById('input-modify-value')?.value);
      
      if (isNaN(modifyL) || isNaN(modifyR) || isNaN(modifyValue)) {
        alert('请输入有效的修改参数！');
        return;
      }
      
      if (modifyL < 1 || modifyR > lastModifyBuiltN || modifyL > modifyR) {
        alert(`请输入有效的区间范围 [1, ${lastModifyBuiltN}]！`);
        return;
      }
      
      performRangeUpdate(modifyL, modifyR, modifyValue, lastModifyBuiltContainer);
    });
  } else {
    console.log('❌ 直接完成修改按钮未找到');
  }
  
  // 绑定步进修改按钮事件
  if (btnApplyModificationStep) {
    btnApplyModificationStep.addEventListener('click', () => {
      console.log('👣 步进修改按钮被点击');
      if (!isModifyTreeRendered) {
        alert('请先构建线段树！');
        return;
      }
      
      // 获取修改参数
      const modifyL = parseInt(document.getElementById('input-modify-left')?.value);
      const modifyR = parseInt(document.getElementById('input-modify-right')?.value);
      const modifyValue = parseInt(document.getElementById('input-modify-value')?.value);
      
      if (isNaN(modifyL) || isNaN(modifyR) || isNaN(modifyValue)) {
        alert('请输入有效的修改参数！');
        return;
      }
      
      if (modifyL < 1 || modifyR > lastModifyBuiltN || modifyL > modifyR) {
        alert(`请输入有效的区间范围 [1, ${lastModifyBuiltN}]！`);
        return;
      }
      
      performRangeUpdateStep(modifyL, modifyR, modifyValue, lastModifyBuiltContainer);
    });
  } else {
    console.log('❌ 步进修改按钮未找到');
  }
  
  // 绑定窗口resize事件
  window.addEventListener('resize', debounceModify(() => {
    if (isModifyTreeRendered && lastModifyBuiltContainer && lastModifyBuiltN > 0) {
      // 检查容器是否可见
      const containerStyle = window.getComputedStyle(lastModifyBuiltContainer);
      if (containerStyle.display !== 'none' && lastModifyBuiltContainer.offsetParent !== null) {
        console.log('🔄 窗口resize，重新渲染线段树');
        buildModifyTreeVisualizationWithData(null, lastModifyBuiltContainer, true);
      }
    }
  }, 250));
  
  console.log('✅ 区间修改可视化模块初始化完成');
}

// 导出模块
window.ModifyTreeVisualizer = {
  buildModifyTreeVisualizationWithData,
  initModifyTreeVisualizer
};

// 更新节点显示信息（包括懒标记和树节点值）
function updateNodeDisplayWithLazyPush(u, tl, tr) {
  console.log(`🔄 updateNodeDisplayWithLazyPush: 更新节点 u=${u} [${tl},${tr}]`);
  
  const nodeDiv = modifyDomNodeElements.get(u);
  if (!nodeDiv) {
    console.log(`❌ 节点 u=${u} 的DOM元素未找到`);
    return;
  }
  
  // 确保懒标记已经下推到当前节点
  pushDown(u, tl, tr);
  
  const treeNode = globalTree[u] || { sum: 0, max: 0, min: 0 };
  const lazyValue = globalLazy[u] || 0;
  const lazyDisplay = lazyValue === 0 ? '-' : lazyValue;
  
  // 更新节点的HTML内容
  nodeDiv.innerHTML = `
    <div class="node-interval">[${tl},${tr}]</div>
    <div class="node-row">
      <span class="node-sum">sum:${treeNode.sum}</span>
      <span class="node-min">min:${treeNode.min}</span>
    </div>
    <div class="node-row">
      <span class="node-lazy">lazy:${lazyDisplay}</span>
      <span class="node-max">max:${treeNode.max}</span>
    </div>
  `;
  
  console.log(`✅ 节点 u=${u} 显示已更新:`, {
    sum: treeNode.sum,
    min: treeNode.min,
    max: treeNode.max,
    lazy: lazyDisplay,
    原始lazy: lazyValue
  });
}