/* 线段树区间修改可视化模块 */

// --- Start of Adaptive Functionality State ---
let lastModifyBuiltN = 0;
let lastModifyBuiltContainer = null;
let isModifyTreeRendered = false;
let modifyDomNodeElements = new Map(); // Stores DOM node elements, keyed by 'u'
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
    effectiveWidth: containerWidth - (2 * padding)
  });// 构建带初始值的线段树 - 维护最大值、最小值、区间和
  const tree = new Array(4 * n);
  const lazy = new Array(4 * n).fill(0);
  
  // 初始化树节点
  for (let i = 0; i < 4 * n; i++) {
    tree[i] = { sum: 0, max: -Infinity, min: Infinity };
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
    buildTree(dataArray, tree, 1, 1, n);
    
    console.log('🌳 线段树构建完成:', {
      n,
      treeSize: tree.length,
      rootNode: tree[1],
      sampleNodes: [tree[2], tree[3]]
    });
  } else if (isResizeUpdate) {
    console.log('🔄 Resize更新：跳过树数据重建，仅更新布局');
  }
  
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
      nodeDiv.style.padding = '6px';      nodeDiv.style.boxSizing = 'border-box';
        // 🎨 按层级分配颜色
      const layerColors = [
        '#6c5ce7', // 第0层 - 紫色
        '#fd79a8', // 第1层 - 粉色  
        '#00b894', // 第2层 - 绿色
        '#e17055'  // 第3层 - 橙红色（替代原来的黄色 #fdcb6e）
      ];
        const layerColor = layerColors[depth] || '#74b9ff'; // 超过4层使用默认蓝色
      
      nodeDiv.style.borderRadius = '8px';
      nodeDiv.style.border = `1px solid ${layerColor}`;
      nodeDiv.style.background = layerColor;
      nodeDiv.style.color = 'white';
      nodeDiv.style.fontWeight = 'bold';
      nodeDiv.style.textAlign = 'center';
      nodeDiv.style.boxShadow = `0 2px 8px ${layerColor}40`; // 使用对应颜色的半透明阴影
      
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
      
      // 注释掉全局nodeColor设置，因为现在使用层级颜色
      // const nodeColor = window.nodeColor || '#74b9ff';
      // if (nodeColor !== '#74b9ff') {
      //   nodeDiv.style.background = nodeColor;
      //   nodeDiv.style.border = `2px solid ${nodeColor}`;
      // }
      
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

// 获取区间修改动画延迟
function getModifyAnimationDelay() {
  const animationSpeed = window.animationSpeed || 'fast'; // Assuming animationSpeed might be set globally
  const speeds = { slow: 2000, normal: 1000, fast: 500 };
  return speeds[animationSpeed] || 1000;
}

// 区间修改操作
function performRangeUpdate(modifyL, modifyR, delta, container) {
  console.log('🔧 performRangeUpdate 被调用', {
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
  }  // 清除之前的高亮 - 恢复层级颜色
  const layerColors = [
    '#6c5ce7', // 第0层 - 紫色
    '#fd79a8', // 第1层 - 粉色  
    '#00b894', // 第2层 - 绿色
    '#e17055'  // 第3层 - 橙红色
  ];
  
  modifyDomNodeElements.forEach((nodeDiv, u) => {
    // 根据节点类获取其深度    const depthClass = nodeDiv.className.match(/depth-(\d+)/);
    const depth = depthClass ? parseInt(depthClass[1]) : 0;
    const originalColor = layerColors[depth] || '#74b9ff';
    
    nodeDiv.style.background = originalColor;
    nodeDiv.style.border = `1px solid ${originalColor}`;
    nodeDiv.style.boxShadow = `0 2px 8px ${originalColor}40`;
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
    
    if (nodeDiv) {      if (type === 'lazy') {        // 懒标记节点 - 纯红色
        nodeDiv.style.background = '#e74c3c';
        nodeDiv.style.border = '1px solid #e74c3c';
        nodeDiv.style.boxShadow = '0 2px 12px rgba(231, 76, 60, 0.3)';// 更新节点内容显示懒标记 - 根据新的HTML结构
        const lazySpan = nodeDiv.querySelector('.node-lazy');
        if (lazySpan) {
          lazySpan.textContent = `lazy:${delta}`;
          // 重新应用样式确保格式正确
          lazySpan.style.flex = '1';
          lazySpan.style.textAlign = 'center';
        }      } else if (type === 'pushdown') {
        // 下推节点 - 纯橙色
        nodeDiv.style.background = '#e67e22';
        nodeDiv.style.border = '1px solid #e67e22';
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
  const length = Math.floor(Math.random() * 4) + 5; //5-8个数字
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
    console.log('✅ 绑定应用修改按钮事件');
    btnApplyModification.addEventListener('click', () => {
      console.log('⚡ 点击应用修改按钮');
      const l = parseInt(inputModifyLeft?.value || '1');
      const r = parseInt(inputModifyRight?.value || '1');
      const delta = parseInt(inputModifyValue?.value || '1');
      
      console.log('📝 修改参数:', { l, r, delta });
      console.log('🔍 状态检查:', {
        lastModifyBuiltN,
        isModifyTreeRendered,
        lastModifyBuiltContainer: !!lastModifyBuiltContainer,
        modifyDomNodeElements_size: modifyDomNodeElements.size
      });
      
      if (!lastModifyBuiltN || lastModifyBuiltN === 0) {
        console.log('❌ lastModifyBuiltN 检查失败');
        alert('请先构建线段树！');
        return;
      }
      
      if (l < 1 || r > lastModifyBuiltN || l > r) {
        console.log('❌ 区间范围检查失败');
        alert(`请输入有效的区间范围 [1, ${lastModifyBuiltN}]`);
        return;
      }
      
      console.log('✅ 所有检查通过，开始执行区间修改');
      performRangeUpdate(l, r, delta, treeContainer);
    });
  } else {
    console.log('❌ 无法绑定应用修改按钮，元素缺失:', { 
      btnApplyModification: !!btnApplyModification, 
      treeContainer: !!treeContainer 
    });
  }  
  // Optimized resize handler
  window.addEventListener('resize', debounceModify(() => {
    console.log('🚨 RESIZE事件被触发！');
    console.log('📊 当前状态:', {
      isModifyTreeRendered,
      hasContainer: !!lastModifyBuiltContainer,
      lastModifyBuiltN,
      containerExists: !!document.querySelector('.modify-tree-visual')
    });
    
    if (isModifyTreeRendered && lastModifyBuiltContainer && lastModifyBuiltN > 0) {
      console.log('✅ 条件满足，开始重新布局');
      // 获取外部容器的宽度
      const outerContainer = lastModifyBuiltContainer.parentElement || lastModifyBuiltContainer;
      const outerWidth = outerContainer.getBoundingClientRect().width;
      console.log('📏 外部容器宽度:', outerWidth);
      
      // 设置 tree-visual 宽度为外部容器的宽度
      const treeVisual = lastModifyBuiltContainer.querySelector('.modify-tree-visual');
      if (treeVisual) {
        treeVisual.style.width = `${outerWidth}px`;
        treeVisual.style.boxSizing = 'border-box'; // 确保宽度包含 padding 和 border
        treeVisual.style.padding = '25px'; // 确保 padding 不影响宽度
        console.log('✅ 设置 tree-visual 宽度:', outerWidth, '实际 clientWidth:', treeVisual.clientWidth);
        
        // 强制重绘
        treeVisual.style.display = 'none';
        treeVisual.offsetHeight; // 强制重排
        treeVisual.style.display = '';
        
        // 调用可视化更新函数，传入 null 表示 resize 更新
        buildModifyTreeVisualizationWithData(null, lastModifyBuiltContainer, true);
      } else {
        console.error('❌ 未找到 tree-visual 元素，无法更新宽度');
      }
    } else {
      console.log('❌ 条件不满足，跳过resize更新');
    }
  }, 100)); // 防抖时间 100ms
}

// Export functions
window.ModifyTreeVisualizer = class {
  constructor(container) {
    this.container = container;
  }
  
  buildTreeFromInput(input) {
    const dataArray = parseInputData(input);
    buildModifyTreeVisualizationWithData(dataArray, this.container);
  }
  
  performRangeUpdate(l, r, delta) {
    performRangeUpdate(l, r, delta, this.container);
  }
  
  clearTree() {
    if (this.container) {
      this.container.innerHTML = '';
      modifyDomNodeElements.clear();
      isModifyTreeRendered = false;
      if (activeModifyBuildAnimationTimeout) {
        clearTimeout(activeModifyBuildAnimationTimeout);
        activeModifyBuildAnimationTimeout = null;
      }
    }
  }
};

// 也保留原有的导出方式以兼容
window.ModifyTreeVisualizer.buildModifyTreeVisualizationWithData = buildModifyTreeVisualizationWithData;
window.ModifyTreeVisualizer.initModifyTreeVisualizer = initModifyTreeVisualizer;
window.ModifyTreeVisualizer.performRangeUpdate = performRangeUpdate;
window.ModifyTreeVisualizer.generateRandomData = generateRandomData;
window.ModifyTreeVisualizer.parseInputData = parseInputData;

// 添加resize事件监听器实现自适应
const debouncedModifyResize = debounceModify(() => {
  console.log('🔄 窗口resize触发，检查是否需要更新modify树...');
  
  if (isModifyTreeRendered && lastModifyBuiltContainer && lastModifyBuiltN > 0) {
    console.log('🔄 开始执行modify树自适应更新...', {
      container: !!lastModifyBuiltContainer,
      n: lastModifyBuiltN,
      isRendered: isModifyTreeRendered
    });
    
    // 使用resize模式重新构建，传入null作为dataArray表示这是resize更新
    buildModifyTreeVisualizationWithData(null, lastModifyBuiltContainer, true);
  } else {
    console.log('⏭️ 跳过modify树更新：无已渲染的树');
  }
}, 300);

// 监听窗口resize事件
window.addEventListener('resize', debouncedModifyResize);

console.log('🌟 ModifyTreeVisualizer 模块已加载', window.ModifyTreeVisualizer);