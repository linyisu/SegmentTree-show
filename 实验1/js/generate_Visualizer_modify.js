/* 线段树区间修改可视化模块（修复懒标记下发，延迟上层节点更新） */

// --- 状态管理 ---
let lastBuiltN = 0; // 上次构建的数组长度
let lastBuiltContainer = null; // 上次构建的容器
let isTreeRendered = false; // 线段树是否渲染完成
let domNodeElements = new Map(); // 存储 DOM 节点，键为节点编号 u
let globalTree = []; // 线段树数组，存储 {sum, max, min}
let globalLazy = []; // 懒标记数组
let currentTreeLevelsData = []; // 树层级数据
let currentTreeBuildOrderData = []; // 构建顺序数据
let activeBuildAnimationTimeout = null; // 构建动画定时器

// 步进修改状态
let stepModifyState = {
  isActive: false,
  affectedNodes: [],
  currentIndex: 0,
  modifyL: 0,
  modifyR: 0,
  delta: 0,
  container: null
};

// 防抖函数
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

// 构建线段树可视化
function buildTreeVisualizationWithData(dataArray, container, isResizeUpdate = false) {
  console.log('🌲 构建线段树可视化', { dataArray, containerExists: !!container, isResizeUpdate });

  let n = isResizeUpdate && dataArray === null ? lastBuiltN : (dataArray ? dataArray.length : 0);

  if (!isResizeUpdate) {
    lastBuiltN = n;
    lastBuiltContainer = container;
    isTreeRendered = false;
    domNodeElements.clear();
    currentTreeLevelsData = [];
    currentTreeBuildOrderData = [];
    if (activeBuildAnimationTimeout) {
      clearTimeout(activeBuildAnimationTimeout);
      activeBuildAnimationTimeout = null;
    }

    if (n < 1 || n > 8) {
      showError('请输入 1-8 个数字');
      return;
    }

    // 清空容器并创建结构
    container.innerHTML = `
      <h4>🔧 线段树区间修改过程:</h4>
      <p><strong>数组数据:</strong> [${dataArray.join(', ')}]</p>
      <p><strong>数组长度:</strong> ${n}</p>
    `;
    const treeVisual = document.createElement('div');
    treeVisual.className = 'tree-visual';
    treeVisual.style.position = 'relative';
    treeVisual.style.width = '100%';
    treeVisual.style.padding = '25px';
    treeVisual.style.background = '#f8f9fa';
    treeVisual.style.borderRadius = '12px';
    treeVisual.style.border = '2px solid rgba(255, 255, 255, 0.8)';
    treeVisual.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
    treeVisual.style.overflow = 'visible';
    treeVisual.style.minHeight = '200px';
    container.appendChild(treeVisual);
  }

  const treeVisual = container.querySelector('.tree-visual');
  if (!treeVisual) {
    console.error('树可视化元素未找到');
    return;
  }

  const containerWidth = treeVisual.clientWidth - 50;
  const nodeMinWidth = 50;
  const levelHeight = 100;
  const padding = 25;

  // 初始化全局数组
  if (!isResizeUpdate) {
    globalTree = new Array(4 * n).fill().map(() => ({ sum: 0, max: -Infinity, min: Infinity }));
    globalLazy = new Array(4 * n).fill(0);

    // 构建线段树
    function buildTree(arr, tree, node, start, end) {
      if (start === end) {
        const value = arr[start - 1];
        tree[node] = { sum: value, max: value, min: value };
      } else {
        const mid = Math.floor((start + end) / 2);
        buildTree(arr, tree, 2 * node, start, mid);
        buildTree(arr, tree, 2 * node + 1, mid + 1, end);
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
  }

  // 收集层级数据
  if (!isResizeUpdate) {
    currentTreeLevelsData = [];
    function collectLevels(l, r, u, depth = 0) {
      if (l > r) return;
      if (!currentTreeLevelsData[depth]) currentTreeLevelsData[depth] = [];
      const treeNode = globalTree[u] || { sum: 0, max: 0, min: 0 };
      const lazyValue = globalLazy[u] || 0;
      currentTreeLevelsData[depth].push({ l, r, u, depth, lazy: lazyValue, sum: treeNode.sum, max: treeNode.max, min: treeNode.min });
      if (l < r) {
        const mid = Math.floor((l + r) / 2);
        collectLevels(l, mid, u * 2, depth + 1);
        collectLevels(mid + 1, r, u * 2 + 1, depth + 1);
      }
    }
    collectLevels(1, n, 1);

    const totalLevels = currentTreeLevelsData.length;
    const calculatedHeight = totalLevels * levelHeight + 100;
    treeVisual.style.minHeight = `${calculatedHeight}px`;
    treeVisual.style.height = `${calculatedHeight}px`;
  }

  // 计算节点位置
  const nodePositions = new Map();
  function calculateNodePositions(l, r, u, depth = 0, parentX = null, parentW = null) {
    const levelNodes = currentTreeLevelsData[depth];
    if (!levelNodes || !levelNodes.find(node => node.u === u && node.l === l && node.r === r)) return;

    const y = depth * levelHeight + 30;
    let x, nodeWidth;
    if (u === 1) {
      nodeWidth = containerWidth - (2 * padding);
      nodeWidth = Math.max(nodeMinWidth, nodeWidth);
      x = containerWidth / 2;
    } else {
      nodeWidth = parentW / 2;
      nodeWidth = Math.max(nodeMinWidth, nodeWidth);
      const isLeftChild = (u % 2 === 0);
      x = isLeftChild ? parentX - parentW / 4 : parentX + parentW / 4;
    }

    const actualContainerWidth = containerWidth + 50;
    const halfW = nodeWidth / 2;
    if (x - halfW < padding) x = padding + halfW;
    if (x + halfW > actualContainerWidth - padding) x = actualContainerWidth - padding - halfW;

    nodePositions.set(u, { x, y, l, r, depth, nodeWidth });

    if (l < r) {
      const mid = Math.floor((l + r) / 2);
      calculateNodePositions(l, mid, u * 2, depth + 1, x, nodeWidth);
      calculateNodePositions(mid + 1, r, u * 2 + 1, depth + 1, x, nodeWidth);
    }
  }
  calculateNodePositions(1, n, 1, 0, null, null);

  // 渲染节点
  if (!isResizeUpdate) {
    currentTreeBuildOrderData = [];
    function generateBuildOrder(l, r, u, depth = 0) {
      if (l > r) return;
      const levelNodes = currentTreeLevelsData[depth];
      if (!levelNodes || !levelNodes.find(node => node.u === u && node.l === l && node.r === r)) return;
      const treeNode = globalTree[u] || { sum: 0, max: 0, min: 0 };
      const lazyValue = globalLazy[u] || 0;
      currentTreeBuildOrderData.push({ l, r, u, depth, lazy: lazyValue, sum: treeNode.sum, max: treeNode.max, min: treeNode.min });
      if (l < r) {
        const mid = Math.floor((l + r) / 2);
        generateBuildOrder(l, mid, u * 2, depth + 1);
        generateBuildOrder(mid + 1, r, u * 2 + 1, depth + 1);
      }
    }
    generateBuildOrder(1, n, 1);

    let orderIndex = 0;
    function renderNextNode() {
      if (orderIndex >= currentTreeBuildOrderData.length) {
        activeBuildAnimationTimeout = null;
        setTimeout(() => {
          isTreeRendered = true;
          console.log('🎉 线段树渲染完成');
        }, 1000);
        return;
      }

      const { l, r, u, depth, lazy, sum, max, min } = currentTreeBuildOrderData[orderIndex];
      const position = nodePositions.get(u);
      if (!position) {
        orderIndex++;
        activeBuildAnimationTimeout = setTimeout(renderNextNode, 50);
        return;
      }

      const nodeDiv = document.createElement('div');
      nodeDiv.className = `tree-node depth-${depth}`;
      nodeDiv.setAttribute('data-node-id', u);
      const lazyDisplay = lazy === 0 ? '-' : lazy;
      nodeDiv.innerHTML = `
        <div class="node-interval">[${l},${r}]</div>
        <div class="node-info">sum:${sum} min:${min}</div>
        <div class="node-info">lazy:${lazyDisplay} max:${max}</div>
      `;
      nodeDiv.style.position = 'absolute';
      nodeDiv.style.left = `${position.x - position.nodeWidth / 2}px`;
      nodeDiv.style.top = `${position.y}px`;
      nodeDiv.style.width = `${position.nodeWidth}px`;
      nodeDiv.style.zIndex = '10';
      nodeDiv.style.minHeight = '80px';
      nodeDiv.style.display = 'flex';
      nodeDiv.style.flexDirection = 'column';
      nodeDiv.style.justifyContent = 'center';
      nodeDiv.style.alignItems = 'center';
      nodeDiv.style.fontSize = '13px';
      nodeDiv.style.padding = '6px';
      nodeDiv.style.boxSizing = 'border-box';
      nodeDiv.style.borderRadius = '8px';
      nodeDiv.style.border = '2px solid #74b9ff';
      nodeDiv.style.background = 'linear-gradient(135deg, #74b9ff, #0984e3)';
      nodeDiv.style.color = 'white';
      nodeDiv.style.textAlign = 'center';
      nodeDiv.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';

      nodeDiv.style.opacity = '0';
      nodeDiv.style.transform = 'translateY(-10px)';
      treeVisual.appendChild(nodeDiv);
      domNodeElements.set(u, nodeDiv);

      setTimeout(() => {
        nodeDiv.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        nodeDiv.style.opacity = '1';
        nodeDiv.style.transform = 'translateY(0)';
      }, 50);

      orderIndex++;
      activeBuildAnimationTimeout = setTimeout(renderNextNode, 100);
    }
    activeBuildAnimationTimeout = setTimeout(renderNextNode, 500);
  } else {
    requestAnimationFrame(() => {
      domNodeElements.forEach((nodeDiv, u) => {
        const position = nodePositions.get(u);
        if (position) {
          nodeDiv.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
          nodeDiv.style.left = `${position.x - position.nodeWidth / 2}px`;
          nodeDiv.style.top = `${position.y}px`;
          nodeDiv.style.width = `${position.nodeWidth}px`;
        }
      });
    });
    isTreeRendered = true;
  }
}

// 下推懒标记
function pushDown(u, tl, tr) {
  if (globalLazy[u] !== 0) {
    const delta = globalLazy[u];
    const len = tr - tl + 1;
    console.log(`🔽 下推节点 u=${u} [${tl},${tr}] 懒标记 ${delta}`);
    // 更新当前节点
    globalTree[u].sum += delta * len;
    globalTree[u].max += delta;
    globalTree[u].min += delta;
    // 如果不是叶子节点，传播懒标记到子节点
    if (tl !== tr) {
      globalLazy[u * 2] += delta;
      globalLazy[u * 2 + 1] += delta;
      console.log(`  - 左子节点 u=${u*2} 接收懒标记 ${globalLazy[u*2]}`);
      console.log(`  - 右子节点 u=${u*2+1} 接收懒标记 ${globalLazy[u*2+1]}`);
    }
    // 清除当前节点的懒标记
    globalLazy[u] = 0;
    console.log(`  - 清除节点 u=${u} 懒标记，当前 lazy=${globalLazy[u]}`);
    // 更新当前节点和子节点的显示
    updateNodeDisplaySafe(u, tl, tr);
    if (tl !== tr) {
      const mid = Math.floor((tl + tr) / 2);
      updateNodeDisplaySafe(u * 2, tl, mid);
      updateNodeDisplaySafe(u * 2 + 1, mid + 1, tr);
    }
  }
}

// 向上更新
function pushUp(u, tl, tr) {
  if (tl === tr) return;
  const mid = Math.floor((tl + tr) / 2);
  let leftSum = globalTree[u * 2].sum;
  let leftMax = globalTree[u * 2].max;
  let leftMin = globalTree[u * 2].min;
  if (globalLazy[u * 2] !== 0) {
    const leftLen = mid - tl + 1;
    leftSum += globalLazy[u * 2] * leftLen;
    leftMax += globalLazy[u * 2];
    leftMin += globalLazy[u * 2];
  }
  let rightSum = globalTree[u * 2 + 1].sum;
  let rightMax = globalTree[u * 2 + 1].max;
  let rightMin = globalTree[u * 2 + 1].min;
  if (globalLazy[u * 2 + 1] !== 0) {
    const rightLen = tr - (mid + 1) + 1;
    rightSum += globalLazy[u * 2 + 1] * rightLen;
    rightMax += globalLazy[u * 2 + 1];
    rightMin += globalLazy[u * 2 + 1];
  }
  globalTree[u].sum = leftSum + rightSum;
  globalTree[u].max = Math.max(leftMax, rightMax);
  globalTree[u].min = Math.min(leftMin, rightMin);
  console.log(`🔼 pushUp 节点 u=${u} [${tl},${tr}] sum=${globalTree[u].sum}, max=${globalTree[u].max}, min=${globalTree[u].min}`);
  updateNodeDisplaySafe(u, tl, tr);
}

// 区间修改
function updateRange(l, r, tl, tr, u, delta) {
  console.log(`🔧 updateRange: [${l},${r}] 在节点 u=${u} [${tl},${tr}] 增加 ${delta}`);
  if (l <= tl && tr <= r) {
    globalLazy[u] += delta;
    console.log(`✅ 完全包含，节点 u=${u} 添加懒标记 ${globalLazy[u]}`);
    updateNodeDisplaySafe(u, tl, tr);
    return;
  }
  if (r < tl || l > tr) {
    console.log(`❌ 无交集，节点 u=${u} 跳过`);
    return;
  }
  pushDown(u, tl, tr);
  const mid = Math.floor((tl + tr) / 2);
  updateRange(l, r, tl, mid, u * 2, delta);
  updateRange(l, r, mid + 1, tr, u * 2 + 1, delta);
  // 回溯时调用 pushUp 更新当前节点
  pushUp(u, tl, tr);
}

// 直接修改
function performRangeUpdate(modifyL, modifyR, delta, container) {
  if (!isTreeRendered || !lastBuiltContainer) {
    showError('请先构建线段树！');
    return;
  }

  console.log(`⚡ 直接修改: [${modifyL}, ${modifyR}] 增加 ${delta}`);
  updateRange(modifyL, modifyR, 1, lastBuiltN, 1, delta);

  domNodeElements.forEach((nodeDiv) => {
    nodeDiv.style.background = 'linear-gradient(135deg, #74b9ff, #0984e3)';
    nodeDiv.style.border = '2px solid #74b9ff';
    nodeDiv.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
  });

  const affectedNodes = [];
  function collectNodes(u, tl, tr) {
    if (modifyL > tr || modifyR < tl) return;
    if (globalLazy[u] !== 0) {
      affectedNodes.push({ u, type: 'lazy', tl, tr });
      return;
    }
    affectedNodes.push({ u, type: 'process', tl, tr });
    if (tl < tr) {
      const mid = Math.floor((tl + tr) / 2);
      collectNodes(u * 2, tl, mid);
      collectNodes(u * 2 + 1, mid + 1, tr);
    }
  }
  collectNodes(1, 1, lastBuiltN);

  affectedNodes.forEach(({ u, type, tl, tr }, index) => {
    const nodeDiv = domNodeElements.get(u);
    if (nodeDiv) {
      setTimeout(() => {
        if (type === 'lazy') {
          nodeDiv.style.background = 'linear-gradient(135deg, #ff6b6b, #e74c3c)';
          nodeDiv.style.border = '2px solid #e74c3c';
          nodeDiv.style.boxShadow = '0 2px 12px rgba(231, 76, 60, 0.3)';
          console.log(`🔴 高亮懒标记节点 u=${u} [${tl},${tr}] lazy=${globalLazy[u]}`);
          updateNodeDisplaySafe(u, tl, tr);
        } else {
          nodeDiv.style.background = 'linear-gradient(135deg, #f39c12, #e67e22)';
          nodeDiv.style.border = '2px solid #e67e22';
          nodeDiv.style.boxShadow = '0 2px 12px rgba(230, 126, 34, 0.3)';
          console.log(`🟠 高亮过程节点 u=${u} [${tl},${tr}]`);
          updateNodeDisplaySafe(u, tl, tr);
          // 回溯更新祖先节点
          let currentU = Math.floor(u / 2);
          let parentTl = tl;
          let parentTr = tr;
          while (currentU >= 1) {
            const range = findNodeRange(currentU, 1, 1, lastBuiltN);
            if (range) {
              parentTl = range.tl;
              parentTr = range.tr;
              pushUp(currentU, parentTl, parentTr);
              const parentDiv = domNodeElements.get(currentU);
              if (parentDiv) {
                parentDiv.style.background = 'linear-gradient(135deg, #f39c12, #e67e22)';
                parentDiv.style.border = '2px solid #e67e22';
                parentDiv.style.boxShadow = '0 2px 12px rgba(230, 126, 34, 0.3)';
              }
            }
            currentU = Math.floor(currentU / 2);
          }
        }
      }, index * 200);
    }
  });
}

// 步进修改
function performRangeUpdateStep(modifyL, modifyR, delta, container) {
  if (!isTreeRendered || !lastBuiltContainer) {
    showError('请先构建线段树！');
    return;
  }

  if (!stepModifyState.isActive || stepModifyState.modifyL !== modifyL || stepModifyState.modifyR !== modifyR || stepModifyState.delta !== delta) {
    console.log('👣 初始化步进修改');
    domNodeElements.forEach((nodeDiv) => {
      nodeDiv.style.background = 'linear-gradient(135deg, #74b9ff, #0984e3)';
      nodeDiv.style.border = '2px solid #74b9ff';
      nodeDiv.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
    });

    stepModifyState.isActive = true;
    stepModifyState.affectedNodes = [];
    stepModifyState.currentIndex = 0;
    stepModifyState.modifyL = modifyL;
    stepModifyState.modifyR = modifyR;
    stepModifyState.delta = delta;
    stepModifyState.container = container;

    updateRange(modifyL, modifyR, 1, lastBuiltN, 1, delta);

    function collectAffectedNodes(u, tl, tr) {
      if (modifyL > tr || modifyR < tl) return;
      if (modifyL <= tl && tr <= modifyR) {
        stepModifyState.affectedNodes.push({ u, type: 'lazy', tl, tr });
        return;
      }
      stepModifyState.affectedNodes.push({ u, type: 'process', tl, tr });
      if (tl < tr) {
        const mid = Math.floor((tl + tr) / 2);
        collectAffectedNodes(u * 2, tl, mid);
        collectAffectedNodes(u * 2 + 1, mid + 1, tr);
      }
    }
    collectAffectedNodes(1, 1, lastBuiltN);
    console.log(`👣 初始化完成，受影响节点数: ${stepModifyState.affectedNodes.length}`);
  }

  if (stepModifyState.currentIndex >= stepModifyState.affectedNodes.length) {
    console.log('✅ 所有步进步骤完成');
    stepModifyState.isActive = false;
    return;
  }

  const { u, type, tl, tr } = stepModifyState.affectedNodes[stepModifyState.currentIndex];
  const nodeDiv = domNodeElements.get(u);

  console.log(`👣 执行步骤 ${stepModifyState.currentIndex + 1}: 节点 u=${u} [${tl},${tr}] 类型=${type}`);

  if (nodeDiv) {
    if (type === 'lazy') {
      nodeDiv.style.background = 'linear-gradient(135deg, #ff6b6b, #e74c3c)';
      nodeDiv.style.border = '2px solid #e74c3c';
      nodeDiv.style.boxShadow = '0 2px 12px rgba(231, 76, 60, 0.3)';
      console.log(`🔴 步进：懒标记节点 u=${u} [${tl},${tr}] lazy=${globalLazy[u]}`);
      updateNodeDisplaySafe(u, tl, tr);
    } else {
      nodeDiv.style.background = 'linear-gradient(135deg, #f39c12, #e67e22)';
      nodeDiv.style.border = '2px solid #e67e22';
      nodeDiv.style.boxShadow = '0 2px 12px rgba(230, 126, 34, 0.3)';
      console.log(`🟠 步进：过程节点 u=${u} [${tl},${tr}]`);
      pushDown(u, tl, tr);
      // 回溯更新祖先节点
      let currentU = Math.floor(u / 2);
      let parentTl = tl;
      let parentTr = tr;
      while (currentU >= 1) {
        const range = findNodeRange(currentU, 1, 1, lastBuiltN);
        if (range) {
          parentTl = range.tl;
          parentTr = range.tr;
          pushUp(currentU, parentTl, parentTr);
          const parentDiv = domNodeElements.get(currentU);
          if (parentDiv) {
            parentDiv.style.background = 'linear-gradient(135deg, #f39c12, #e67e22)';
            parentDiv.style.border = '2px solid #e67e22';
            parentDiv.style.boxShadow = '0 2px 12px rgba(230, 126, 34, 0.3)';
          }
        }
        currentU = Math.floor(currentU / 2);
      }
      updateNodeDisplaySafe(u, tl, tr);
    }
  } else {
    console.warn(`❌ 节点 u=${u} 的 DOM 元素未找到`);
  }

  stepModifyState.currentIndex++;
  console.log(`👣 步骤完成，currentIndex=${stepModifyState.currentIndex}`);
}

// 查找节点区间
function findNodeRange(targetU, u, tl, tr) {
  if (u === targetU) return { tl, tr };
  if (tl === tr) return null;
  const mid = Math.floor((tl + tr) / 2);
  const leftResult = findNodeRange(targetU, u * 2, tl, mid);
  if (leftResult) return leftResult;
  return findNodeRange(targetU, u * 2 + 1, mid + 1, tr);
}

// 安全更新节点显示
function updateNodeDisplaySafe(u, tl, tr) {
  const nodeDiv = domNodeElements.get(u);
  if (!nodeDiv) return;
  const lazyValue = globalLazy[u] || 0;
  const lazyDisplay = lazyValue === 0 ? '-' : lazyValue;
  let treeNode = globalTree[u] || { sum: 0, max: 0, min: 0 };
  let displaySum = treeNode.sum;
  let displayMax = treeNode.max;
  let displayMin = treeNode.min;
  if (lazyValue !== 0) {
    const len = tr - tl + 1;
    displaySum += lazyValue * len;
    displayMax += lazyValue;
    displayMin += lazyValue;
  }
  nodeDiv.innerHTML = `
    <div class="node-interval">[${tl},${tr}]</div>
    <div class="node-info">sum:${displaySum} min:${displayMin}</div>
    <div class="node-info">lazy:${lazyDisplay} max:${displayMax}</div>
  `;
  console.log(`🔄 更新节点 u=${u} [${tl},${tr}] 显示: sum=${displaySum}, min=${displayMin}, max=${displayMax}, lazy=${lazyDisplay}`);
}

// 显示错误
function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.style.color = 'red';
  errorDiv.style.margin = '10px';
  errorDiv.textContent = message;
  lastBuiltContainer.prepend(errorDiv);
  setTimeout(() => errorDiv.remove(), 3000);
}

// 初始化
function initTreeVisualizer() {
  const inputCustomData = document.getElementById('input-custom-data');
  const btnRandomData = document.getElementById('btn-random-data');
  const btnUpdateCustomData = document.getElementById('btn-update-custom-data');
  const btnApplyModificationDirect = document.getElementById('btn-apply-modification-direct');
  const btnApplyModificationStep = document.getElementById('btn-apply-modification-step');
  const customTreeVisualizerHost = document.getElementById('custom-tree-visualizer-host');

  if (inputCustomData) inputCustomData.value = "1 1 4 5 1 4";

  if (btnRandomData) {
    btnRandomData.addEventListener('click', () => {
      const randomArray = Array.from({ length: Math.floor(Math.random() * 4) + 5 }, () => Math.floor(Math.random() * 10) + 1);
      inputCustomData.value = randomArray.join(' ');
    });
  }

  if (btnUpdateCustomData && customTreeVisualizerHost) {
    btnUpdateCustomData.addEventListener('click', () => {
      const inputData = inputCustomData?.value?.trim() || '';
      if (!inputData) {
        showError('请输入数据！');
        return;
      }
      try {
        const dataArray = inputData.split(/\s+/).map(x => parseInt(x)).filter(x => !isNaN(x));
        if (dataArray.length === 0 || dataArray.length > 8) {
          showError('请输入 1 到 8 个有效数字！');
          return;
        }
        buildTreeVisualizationWithData(dataArray, customTreeVisualizerHost, false);
      } catch (error) {
        showError('数据格式不正确！');
      }
    });
  }

  if (btnApplyModificationDirect) {
    btnApplyModificationDirect.addEventListener('click', () => {
      if (!isTreeRendered) {
        showError('请先构建线段树！');
        return;
      }
      const modifyL = parseInt(document.getElementById('input-modify-left')?.value);
      const modifyR = parseInt(document.getElementById('input-modify-right')?.value);
      const modifyValue = parseInt(document.getElementById('input-modify-value')?.value);
      if (!Number.isInteger(modifyL) || !Number.isInteger(modifyR) || !Number.isInteger(modifyValue)) {
        showError('请输入有效的整数参数！');
        return;
      }
      if (modifyValue < -50 || modifyValue > 50) {
        showError('修改值必须在 -50 到 +50 之间！');
        return;
      }
      if (modifyL < 1 || modifyR > lastBuiltN || modifyL > modifyR) {
        showError(`请输入有效的区间 [1, ${lastBuiltN}]！`);
        return;
      }
      performRangeUpdate(modifyL, modifyR, modifyValue, lastBuiltContainer);
    });
  }

  if (btnApplyModificationStep) {
    btnApplyModificationStep.addEventListener('click', () => {
      if (!isTreeRendered) {
        showError('请先构建线段树！');
        return;
      }
      const modifyL = parseInt(document.getElementById('input-modify-left')?.value);
      const modifyR = parseInt(document.getElementById('input-modify-right')?.value);
      const modifyValue = parseInt(document.getElementById('input-modify-value')?.value);
      if (!Number.isInteger(modifyL) || !Number.isInteger(modifyR) || !Number.isInteger(modifyValue)) {
        showError('请输入有效的整数参数！');
        return;
      }
      if (modifyValue < -50 || modifyValue > 50) {
        showError('修改值必须在 -50 到 +50 之间！');
        return;
      }
      if (modifyL < 1 || modifyR > lastBuiltN || modifyL > modifyR) {
        showError(`请输入有效的区间 [1, ${lastBuiltN}]！`);
        return;
      }
      performRangeUpdateStep(modifyL, modifyR, modifyValue, lastBuiltContainer);
    });
  }

  window.addEventListener('resize', debounce(() => {
    if (isTreeRendered && lastBuiltContainer && lastBuiltN > 0) {
      const containerStyle = window.getComputedStyle(lastBuiltContainer);
      if (containerStyle.display !== 'none' && lastBuiltContainer.offsetParent !== null) {
        buildTreeVisualizationWithData(null, lastBuiltContainer, true);
      }
    }
  }, 250));
}

window.TreeVisualizer = {
  buildTreeVisualizationWithData,
  initTreeVisualizer
};