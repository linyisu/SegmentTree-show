/* 线段树区间修改可视化模块 - 简化版本用于调试 */

// --- 状态变量 ---
let lastModifyBuiltN = 0;
let lastModifyBuiltContainer = null;
let isModifyTreeRendered = false;
let modifyDomNodeElements = new Map();
let modifyDomLineElements = new Map();
let currentModifyTreeLevelsData = [];
let currentModifyTreeBuildOrderData = [];
let activeModifyBuildAnimationTimeout = null;

// 防抖函数
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
  
  return numbers;
}

// 主要的构建函数
function buildModifyTreeVisualizationWithData(dataArray, container, isResizeUpdate = false) {
  console.log('🌲 构建函数被调用', { dataArray, containerExists: !!container });
  
  const n = dataArray.length;
  
  if (!isResizeUpdate) {
    lastModifyBuiltN = n;
    lastModifyBuiltContainer = container;
    isModifyTreeRendered = false;
    modifyDomNodeElements.clear();
    modifyDomLineElements.clear();

    if (activeModifyBuildAnimationTimeout) {
      clearTimeout(activeModifyBuildAnimationTimeout);
      activeModifyBuildAnimationTimeout = null;
    }

    if (n < 1 || n > 8) {
      alert('请输入1-8个数字');
      return;
    }
    
    // 清空容器并添加内容
    container.innerHTML = '<h4>🔧 线段树区间修改过程:</h4>';
    container.innerHTML += `<p><strong>数组数据:</strong> [${dataArray.join(', ')}]</p>`;
    
    const treeVisual = document.createElement('div');
    treeVisual.className = 'modify-tree-visual';
    treeVisual.style.position = 'relative';
    treeVisual.style.width = '100%';
    treeVisual.style.padding = '25px';
    treeVisual.style.background = '#f8f9fa';
    treeVisual.style.borderRadius = '12px';
    treeVisual.style.border = '2px solid #e9ecef';
    treeVisual.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
    treeVisual.style.overflow = 'visible';
    treeVisual.style.minHeight = '300px';
    container.appendChild(treeVisual);
  }

  const treeVisual = container.querySelector('.modify-tree-visual');
  if (!treeVisual) {
    console.error("Tree visual element not found.");
    return;
  }

  console.log('✅ 容器准备完成');

  // 构建线段树数据
  const tree = new Array(4 * n);
  for (let i = 0; i < 4 * n; i++) {
    tree[i] = { sum: 0, max: -Infinity, min: Infinity };
  }
  
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
  
  buildTree(dataArray, tree, 1, 1, n);
  console.log('📊 线段树数据构建完成', tree);

  // 简单的布局 - 创建几个测试节点
  function createTestNodes() {
    console.log('🎨 开始创建节点...');
    
    // 创建根节点
    const rootNode = document.createElement('div');
    rootNode.style.position = 'absolute';
    rootNode.style.left = '50%';
    rootNode.style.top = '50px';
    rootNode.style.transform = 'translateX(-50%)';
    rootNode.style.width = '120px';
    rootNode.style.height = '80px';
    rootNode.style.background = 'linear-gradient(135deg, #74b9ff, #0984e3)';
    rootNode.style.color = 'white';
    rootNode.style.display = 'flex';
    rootNode.style.flexDirection = 'column';
    rootNode.style.justifyContent = 'center';
    rootNode.style.alignItems = 'center';
    rootNode.style.borderRadius = '8px';
    rootNode.style.fontSize = '11px';
    rootNode.style.fontWeight = 'bold';
    rootNode.style.border = '2px solid #0984e3';
    rootNode.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
    
    const rootData = tree[1];
    rootNode.innerHTML = `[1,${n}]<br>sum:${rootData.sum}<br>max:${rootData.max}<br>min:${rootData.min}<br>lazy:0`;
    
    treeVisual.appendChild(rootNode);
    modifyDomNodeElements.set(1, rootNode);
    
    console.log('✅ 根节点创建成功');
  }

  if (!isResizeUpdate) {
    createTestNodes();
    isModifyTreeRendered = true;
  }

  console.log('🎉 构建完成');
}

// 区间修改操作
function performRangeUpdate(modifyL, modifyR, delta, container) {
  console.log('⚡ 执行区间修改', { modifyL, modifyR, delta });
  
  if (!isModifyTreeRendered || !lastModifyBuiltContainer) {
    alert('请先构建线段树！');
    return;
  }

  // 重置节点颜色
  modifyDomNodeElements.forEach((nodeDiv) => {
    nodeDiv.style.background = 'linear-gradient(135deg, #74b9ff, #0984e3)';
    nodeDiv.style.border = '2px solid #0984e3';
  });

  // 高亮根节点表示修改
  setTimeout(() => {
    const rootNode = modifyDomNodeElements.get(1);
    if (rootNode) {
      rootNode.style.background = 'linear-gradient(135deg, #ff6b6b, #e74c3c)';
      rootNode.style.border = '2px solid #e74c3c';
      
      // 更新懒标记显示
      const currentContent = rootNode.innerHTML;
      const updatedContent = currentContent.replace(/lazy:\d+/, `lazy:${delta}`);
      rootNode.innerHTML = updatedContent;
    }
  }, 300);
  
  console.log('✅ 区间修改动画完成');
}

// 初始化容器
function initializeModifyTreeContainer(container) {
  container.innerHTML = '';
  
  const treeVisual = document.createElement('div');
  treeVisual.className = 'modify-tree-visual';
  treeVisual.style.position = 'relative';
  treeVisual.style.width = '100%';
  treeVisual.style.padding = '25px';
  treeVisual.style.background = '#f8f9fa';
  treeVisual.style.borderRadius = '12px';
  treeVisual.style.border = '2px solid #e9ecef';
  treeVisual.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
  treeVisual.style.overflow = 'visible';
  treeVisual.style.minHeight = '200px';
  treeVisual.style.display = 'flex';
  treeVisual.style.alignItems = 'center';
  treeVisual.style.justifyContent = 'center';
  treeVisual.style.color = '#666';
  treeVisual.style.fontSize = '16px';
  
  treeVisual.innerHTML = '<div style="text-align: center;">🔧 请输入数组数据并点击"更新可视化"按钮</div>';
  
  container.appendChild(treeVisual);
}

// 初始化函数
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
  
  console.log('🔍 元素查找结果:', {
    inputCustomData: !!inputCustomData,
    btnRandomData: !!btnRandomData,
    btnUpdateCustomData: !!btnUpdateCustomData,
    treeContainer: !!treeContainer,
    inputModifyLeft: !!inputModifyLeft,
    inputModifyRight: !!inputModifyRight,
    inputModifyValue: !!inputModifyValue,
    btnApplyModification: !!btnApplyModification
  });
  
  // 初始化容器
  if (treeContainer) {
    initializeModifyTreeContainer(treeContainer);
  }
  
  // 随机生成按钮
  if (btnRandomData && inputCustomData) {
    console.log('✅ 绑定随机生成按钮');
    btnRandomData.addEventListener('click', () => {
      console.log('🎲 生成随机数据');
      const randomData = generateRandomData();
      inputCustomData.value = randomData;
      console.log('📊 生成的数据:', randomData);
    });
  }
  
  // 更新可视化按钮
  if (btnUpdateCustomData && treeContainer && inputCustomData) {
    console.log('✅ 绑定更新可视化按钮');
    btnUpdateCustomData.addEventListener('click', () => {
      console.log('🚀 点击更新可视化');
      const inputData = parseInputData(inputCustomData.value);
      if (!inputData) {
        alert('请输入有效的数组数据');
        return;
      }
      
      console.log('📊 解析的数据:', inputData);
      buildModifyTreeVisualizationWithData(inputData, treeContainer, false);
    });
  }

  // 应用修改按钮
  if (btnApplyModification && treeContainer) {
    console.log('✅ 绑定应用修改按钮');
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

  console.log('🎉 模块初始化完成');
}

// 导出函数
window.ModifyTreeVisualizer = {
  buildModifyTreeVisualizationWithData,
  initModifyTreeVisualizer,
  performRangeUpdate,
  generateRandomData,
  parseInputData
};

console.log('🌟 ModifyTreeVisualizer 模块已加载', window.ModifyTreeVisualizer);
