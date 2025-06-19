/* 线段树区间修改可视化模块（修复懒标记下发，延迟上层节点更新） */

(function () {
  // --- 状态管理 ---
  // 创建独立的命名空间避免变量冲突
  const ModifyVisualizerState = {
    lastBuiltN: 0, // 上次构建的数组长度
    lastBuiltContainer: null, // 上次构建的容器
    isTreeRendered: false, // 线段树是否渲染完成
    domNodeElements: new Map(), // 存储 DOM 节点，键为节点编号 u
    globalTree: [], // 线段树数组，存储 {sum, max, min}
    globalLazy: [], // 懒标记数组
    currentTreeLevelsData: [], // 树层级数据
    currentTreeBuildOrderData: [], // 构建顺序数据
    activeBuildAnimationTimeout: null // 构建动画定时器
  };

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

  // 获取动画延迟
  function getAnimationDelay() {
    const animationSpeed = window.animationSpeed || 'normal';
    const speeds = { slow: 1000, normal: 500, fast: 200 };
    return speeds[animationSpeed] || 500;
  }

  // 获取构建动画延迟
  function getBuildAnimationDelay() {
    const animationSpeed = window.animationSpeed || 'normal';
    const speeds = { slow: 200, normal: 100, fast: 50 };
    return speeds[animationSpeed] || 100;
  }

  // 构建线段树可视化
  function buildTreeVisualizationWithData(dataArray, container, isResizeUpdate = false) {
    console.log('🌲 构建线段树可视化', { dataArray, containerExists: !!container, isResizeUpdate });

    let n = isResizeUpdate && dataArray === null ? ModifyVisualizerState.lastBuiltN : (dataArray ? dataArray.length : 0);
    if (!isResizeUpdate) {
      ModifyVisualizerState.lastBuiltN = n;
      ModifyVisualizerState.lastBuiltContainer = container;
      ModifyVisualizerState.isTreeRendered = false;
      ModifyVisualizerState.domNodeElements.clear();
      ModifyVisualizerState.currentTreeLevelsData = [];
      ModifyVisualizerState.currentTreeBuildOrderData = [];
      if (ModifyVisualizerState.activeBuildAnimationTimeout) {
        clearTimeout(ModifyVisualizerState.activeBuildAnimationTimeout);
        ModifyVisualizerState.activeBuildAnimationTimeout = null;
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
      `;      const treeVisual = document.createElement('div');
      treeVisual.className = 'tree-visual';
      treeVisual.style.position = 'relative';
      treeVisual.style.width = '100%';
      treeVisual.style.padding = '25px';
      treeVisual.style.background = 'transparent';
      treeVisual.style.borderRadius = '12px';
      // 移除边框和阴影
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
      ModifyVisualizerState.globalTree = new Array(4 * n).fill().map(() => ({ sum: 0, max: -Infinity, min: Infinity }));
      ModifyVisualizerState.globalLazy = new Array(4 * n).fill(0);

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
      buildTree(dataArray, ModifyVisualizerState.globalTree, 1, 1, n);
    }

    // 收集层级数据
    if (!isResizeUpdate) {
      ModifyVisualizerState.currentTreeLevelsData = [];
      function collectLevels(l, r, u, depth = 0) {
        if (l > r) return;
        if (!ModifyVisualizerState.currentTreeLevelsData[depth]) ModifyVisualizerState.currentTreeLevelsData[depth] = [];
        const treeNode = ModifyVisualizerState.globalTree[u] || { sum: 0, max: 0, min: 0 };
        const lazyValue = ModifyVisualizerState.globalLazy[u] || 0;
        ModifyVisualizerState.currentTreeLevelsData[depth].push({ l, r, u, depth, lazy: lazyValue, sum: treeNode.sum, max: treeNode.max, min: treeNode.min });
        if (l < r) {
          const mid = Math.floor((l + r) / 2);
          collectLevels(l, mid, u * 2, depth + 1);
          collectLevels(mid + 1, r, u * 2 + 1, depth + 1);
        }
      }
      collectLevels(1, n, 1);

      const totalLevels = ModifyVisualizerState.currentTreeLevelsData.length;
      const calculatedHeight = totalLevels * levelHeight + 100;
      treeVisual.style.minHeight = `${calculatedHeight}px`;
      treeVisual.style.height = `${calculatedHeight}px`;
    }

    // 计算节点位置
    const nodePositions = new Map();
    function calculateNodePositions(l, r, u, depth = 0, parentX = null, parentW = null) {
      const levelNodes = ModifyVisualizerState.currentTreeLevelsData[depth];
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
      ModifyVisualizerState.currentTreeBuildOrderData = [];
      function generateBuildOrder(l, r, u, depth = 0) {
        if (l > r) return;
        const levelNodes = ModifyVisualizerState.currentTreeLevelsData[depth];
        if (!levelNodes || !levelNodes.find(node => node.u === u && node.l === l && node.r === r)) return;
        const treeNode = ModifyVisualizerState.globalTree[u] || { sum: 0, max: 0, min: 0 };
        const lazyValue = ModifyVisualizerState.globalLazy[u] || 0;
        ModifyVisualizerState.currentTreeBuildOrderData.push({ l, r, u, depth, lazy: lazyValue, sum: treeNode.sum, max: treeNode.max, min: treeNode.min });
        if (l < r) {
          const mid = Math.floor((l + r) / 2);
          generateBuildOrder(l, mid, u * 2, depth + 1);
          generateBuildOrder(mid + 1, r, u * 2 + 1, depth + 1);
        }
      }
      generateBuildOrder(1, n, 1);

      let orderIndex = 0;
      function renderNextNode() {
        if (orderIndex >= ModifyVisualizerState.currentTreeBuildOrderData.length) {
          ModifyVisualizerState.activeBuildAnimationTimeout = null;
          setTimeout(() => {
            ModifyVisualizerState.isTreeRendered = true;
            console.log('🎉 线段树渲染完成');
          }, 1000);
          return;
        }

        const { l, r, u, depth, lazy, sum, max, min } = ModifyVisualizerState.currentTreeBuildOrderData[orderIndex];
        const position = nodePositions.get(u);
        if (!position) {
          orderIndex++;
          ModifyVisualizerState.activeBuildAnimationTimeout = setTimeout(renderNextNode, 50);
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
        nodeDiv.style.background = ' #0984e3';
        nodeDiv.style.color = 'white';
        nodeDiv.style.textAlign = 'center';
        nodeDiv.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';

        nodeDiv.style.opacity = '0';
        nodeDiv.style.transform = 'translateY(-10px)';
        treeVisual.appendChild(nodeDiv);
        ModifyVisualizerState.domNodeElements.set(u, nodeDiv);        setTimeout(() => {
          nodeDiv.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
          nodeDiv.style.opacity = '1';
          nodeDiv.style.transform = 'translateY(0)';
        }, 50);

        orderIndex++;
        ModifyVisualizerState.activeBuildAnimationTimeout = setTimeout(renderNextNode, getBuildAnimationDelay());
      }
      ModifyVisualizerState.activeBuildAnimationTimeout = setTimeout(renderNextNode, getAnimationDelay());
    } else {
      requestAnimationFrame(() => {
        ModifyVisualizerState.domNodeElements.forEach((nodeDiv, u) => {
          const position = nodePositions.get(u);
          if (position) {
            nodeDiv.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            nodeDiv.style.left = `${position.x - position.nodeWidth / 2}px`;
            nodeDiv.style.top = `${position.y}px`;
            nodeDiv.style.width = `${position.nodeWidth}px`;
          }
        });
      });
      ModifyVisualizerState.isTreeRendered = true;
    }
  }

  // 下推懒标记
  function pushDown(u, tl, tr) {
    if (ModifyVisualizerState.globalLazy[u] !== 0) {
      const delta = ModifyVisualizerState.globalLazy[u];
      const len = tr - tl + 1;
      console.log(`🔽 下推节点 u=${u} [${tl},${tr}] 懒标记 ${delta}`);
      // 更新当前节点
      ModifyVisualizerState.globalTree[u].sum += delta * len;
      ModifyVisualizerState.globalTree[u].max += delta;
      ModifyVisualizerState.globalTree[u].min += delta;
      // 如果不是叶子节点，传播懒标记到子节点
      if (tl !== tr) {
        ModifyVisualizerState.globalLazy[u * 2] += delta;
        ModifyVisualizerState.globalLazy[u * 2 + 1] += delta;
        console.log(`  - 左子节点 u=${u * 2} 接收懒标记 ${ModifyVisualizerState.globalLazy[u * 2]}`);
        console.log(`  - 右子节点 u=${u * 2 + 1} 接收懒标记 ${ModifyVisualizerState.globalLazy[u * 2 + 1]}`);
      }
      // 清除当前节点的懒标记
      ModifyVisualizerState.globalLazy[u] = 0;
      console.log(`  - 清除节点 u=${u} 懒标记，当前 lazy=${ModifyVisualizerState.globalLazy[u]}`);
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
    let leftSum = ModifyVisualizerState.globalTree[u * 2].sum;
    let leftMax = ModifyVisualizerState.globalTree[u * 2].max;
    let leftMin = ModifyVisualizerState.globalTree[u * 2].min;
    if (ModifyVisualizerState.globalLazy[u * 2] !== 0) {
      const leftLen = mid - tl + 1;
      leftSum += ModifyVisualizerState.globalLazy[u * 2] * leftLen;
      leftMax += ModifyVisualizerState.globalLazy[u * 2];
      leftMin += ModifyVisualizerState.globalLazy[u * 2];
    }
    let rightSum = ModifyVisualizerState.globalTree[u * 2 + 1].sum;
    let rightMax = ModifyVisualizerState.globalTree[u * 2 + 1].max;
    let rightMin = ModifyVisualizerState.globalTree[u * 2 + 1].min;
    if (ModifyVisualizerState.globalLazy[u * 2 + 1] !== 0) {
      const rightLen = tr - (mid + 1) + 1;
      rightSum += ModifyVisualizerState.globalLazy[u * 2 + 1] * rightLen;
      rightMax += ModifyVisualizerState.globalLazy[u * 2 + 1];
      rightMin += ModifyVisualizerState.globalLazy[u * 2 + 1];
    }
    ModifyVisualizerState.globalTree[u].sum = leftSum + rightSum;
    ModifyVisualizerState.globalTree[u].max = Math.max(leftMax, rightMax);
    ModifyVisualizerState.globalTree[u].min = Math.min(leftMin, rightMin);
    console.log(`🔼 pushUp 节点 u=${u} [${tl},${tr}] sum=${ModifyVisualizerState.globalTree[u].sum}, max=${ModifyVisualizerState.globalTree[u].max}, min=${ModifyVisualizerState.globalTree[u].min}`);
    updateNodeDisplaySafe(u, tl, tr);
  }

  // 区间修改
  function updateRange(l, r, tl, tr, u, delta) {
    console.log(`🔧 updateRange: [${l},${r}] 在节点 u=${u} [${tl},${tr}] 增加 ${delta}`);
    if (l <= tl && tr <= r) {
      ModifyVisualizerState.globalLazy[u] += delta;
      console.log(`✅ 完全包含，节点 u=${u} 添加懒标记 ${ModifyVisualizerState.globalLazy[u]}`);
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
    if (!ModifyVisualizerState.isTreeRendered || !ModifyVisualizerState.lastBuiltContainer) {
      showError('请先构建线段树！');
      return;
    }

    console.log(`⚡ 直接修改: [${modifyL}, ${modifyR}] 增加 ${delta}`);
    updateRange(modifyL, modifyR, 1, ModifyVisualizerState.lastBuiltN, 1, delta);

    ModifyVisualizerState.domNodeElements.forEach((nodeDiv) => {
      nodeDiv.style.background = ' #0984e3';
      nodeDiv.style.border = '2px solid #74b9ff';
      nodeDiv.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
    });

    const affectedNodes = [];
    function collectNodes(u, tl, tr) {
      if (modifyL > tr || modifyR < tl) return;
      if (ModifyVisualizerState.globalLazy[u] !== 0) {
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
    collectNodes(1, 1, ModifyVisualizerState.lastBuiltN);

    affectedNodes.forEach(({ u, type, tl, tr }, index) => {
      const nodeDiv = ModifyVisualizerState.domNodeElements.get(u);
      if (nodeDiv) {
        setTimeout(() => {
          if (type === 'lazy') {
            nodeDiv.style.background = ' #ff6b6b';
            nodeDiv.style.border = '2px solid #e74c3c';
            nodeDiv.style.boxShadow = '0 2px 12px rgba(231, 76, 60, 0.3)';
            console.log(`🔴 高亮懒标记节点 u=${u} [${tl},${tr}] lazy=${ModifyVisualizerState.globalLazy[u]}`);
            updateNodeDisplaySafe(u, tl, tr);
          } else {
            nodeDiv.style.background = ' #f39c12';
            nodeDiv.style.border = '2px solid #e67e22';
            nodeDiv.style.boxShadow = '0 2px 12px rgba(230, 126, 34, 0.3)';
            console.log(`🟠 高亮过程节点 u=${u} [${tl},${tr}]`);
            updateNodeDisplaySafe(u, tl, tr);
            // 回溯更新祖先节点
            let currentU = Math.floor(u / 2);
            let parentTl = tl;
            let parentTr = tr;
            while (currentU >= 1) {
              const range = findNodeRange(currentU, 1, 1, ModifyVisualizerState.lastBuiltN);
              if (range) {
                parentTl = range.tl;
                parentTr = range.tr;
                pushUp(currentU, parentTl, parentTr);
                const parentDiv = ModifyVisualizerState.domNodeElements.get(currentU);
                if (parentDiv) {
                  parentDiv.style.background = ' #f39c12';
                  parentDiv.style.border = '2px solid #e67e22';
                  parentDiv.style.boxShadow = '0 2px 12px rgba(230, 126, 34, 0.3)';
                }
              }
              currentU = Math.floor(currentU / 2);
            }
          }
        }, index * (getBuildAnimationDelay() * 2));
      }
    });
  }

  // 步进修改
  function performRangeUpdateStep(modifyL, modifyR, delta, container) {
    if (!ModifyVisualizerState.isTreeRendered || !ModifyVisualizerState.lastBuiltContainer) {
      showError('请先构建线段树！');
      return;
    }    if (!stepModifyState.isActive || stepModifyState.modifyL !== modifyL || stepModifyState.modifyR !== modifyR || stepModifyState.delta !== delta) {
      console.log('👣 初始化步进修改');
      
      // 清除之前的修改结果
      const oldResults = container.querySelectorAll('.modify-result');
      oldResults.forEach(result => result.remove());
      
      // 重置所有节点样式
      ModifyVisualizerState.domNodeElements.forEach((nodeDiv) => {
        nodeDiv.style.background = ' #0984e3';
        nodeDiv.style.border = '2px solid #74b9ff';
        nodeDiv.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
      });

      // 移除旧的进度条
      const oldProgress = container.querySelector('#modify-step-progress-container');
      if (oldProgress) oldProgress.remove();

      // 创建新的进度条
      const progressContainer = document.createElement('div');
      progressContainer.id = 'modify-step-progress-container';
      progressContainer.style.margin = '10px';
      progressContainer.style.padding = '10px';
      progressContainer.style.borderRadius = '8px';
      progressContainer.style.background = 'rgba(248, 249, 250, 0.95)';
      progressContainer.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
      progressContainer.innerHTML = `
          <div id="modify-step-progress-info" style="margin-bottom: 8px; font-size: 14px; color: #495057;">
              步进修改进度: <span id="modify-step-current">0</span>/<span id="modify-step-total">0</span> (<span id="modify-step-percentage">0%</span>)
          </div>
          <div style="background: #e9ecef; height: 10px; border-radius: 5px; overflow: hidden;">
              <div id="modify-step-progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #e67e22, #f39c12); transition: width 0.3s ease;"></div>
          </div>
      `;
      container.prepend(progressContainer);

      stepModifyState.isActive = true;
      stepModifyState.affectedNodes = [];
      stepModifyState.currentIndex = 0;
      stepModifyState.modifyL = modifyL;
      stepModifyState.modifyR = modifyR;
      stepModifyState.delta = delta;
      stepModifyState.container = container;

      updateRange(modifyL, modifyR, 1, ModifyVisualizerState.lastBuiltN, 1, delta);

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
      collectAffectedNodes(1, 1, ModifyVisualizerState.lastBuiltN);
      console.log(`👣 初始化完成，受影响节点数: ${stepModifyState.affectedNodes.length}`);
      
      // 更新总步数
      const stepTotal = container.querySelector('#modify-step-total');
      if (stepTotal) stepTotal.textContent = stepModifyState.affectedNodes.length;
      
      // 初始化完成，等待下次点击执行第一步
      return;
    }    if (stepModifyState.currentIndex >= stepModifyState.affectedNodes.length) {
      console.log('✅ 所有步进修改步骤完成');
      
      // 显示修改完成结果
      const resultDiv = document.createElement('div');
      resultDiv.className = 'modify-result';
      resultDiv.style.margin = '10px';
      resultDiv.style.padding = '15px';
      resultDiv.style.background = '#fff3cd';
      resultDiv.style.borderRadius = '8px';
      resultDiv.style.border = '1px solid #ffeaa7';
      resultDiv.style.position = 'relative';
      resultDiv.innerHTML = `
          <button class="close-btn" style="position: absolute; top: 5px; right: 8px; background: none; border: none; font-size: 18px; cursor: pointer; color: #6c757d; padding: 0; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;" title="关闭">&times;</button>
          <strong>修改完成 [${modifyL}, ${modifyR}] 增加 ${delta}:</strong><br>
          所有受影响的节点已更新完毕！
      `;
      
      // 添加关闭按钮事件
      const closeBtn = resultDiv.querySelector('.close-btn');
      closeBtn.addEventListener('click', () => {
          resultDiv.remove();
      });
      
      container.appendChild(resultDiv);
      
      // 移除进度条
      const progressContainer = container.querySelector('#modify-step-progress-container');
      if (progressContainer) progressContainer.remove();
      
      stepModifyState.isActive = false;
      return;
    }

    const { u, type, tl, tr } = stepModifyState.affectedNodes[stepModifyState.currentIndex];
    const nodeDiv = ModifyVisualizerState.domNodeElements.get(u);

    console.log(`👣 执行步骤 ${stepModifyState.currentIndex + 1}: 节点 u=${u} [${tl},${tr}] 类型=${type}`);

    if (nodeDiv) {
      if (type === 'lazy') {
        nodeDiv.style.background = ' #ff6b6b';
        nodeDiv.style.border = '2px solid #e74c3c';
        nodeDiv.style.boxShadow = '0 2px 12px rgba(231, 76, 60, 0.3)';
        console.log(`🔴 步进：懒标记节点 u=${u} [${tl},${tr}] lazy=${ModifyVisualizerState.globalLazy[u]}`);
        updateNodeDisplaySafe(u, tl, tr);
      } else {
        nodeDiv.style.background = ' #f39c12';
        nodeDiv.style.border = '2px solid #e67e22';
        nodeDiv.style.boxShadow = '0 2px 12px rgba(230, 126, 34, 0.3)';
        console.log(`🟠 步进：过程节点 u=${u} [${tl},${tr}]`);
        pushDown(u, tl, tr);
        // 回溯更新祖先节点
        let currentU = Math.floor(u / 2);
        let parentTl = tl;
        let parentTr = tr;
        while (currentU >= 1) {
          const range = findNodeRange(currentU, 1, 1, ModifyVisualizerState.lastBuiltN);
          if (range) {
            parentTl = range.tl;
            parentTr = range.tr;
            pushUp(currentU, parentTl, parentTr);
            const parentDiv = ModifyVisualizerState.domNodeElements.get(currentU);
            if (parentDiv) {
              parentDiv.style.background = ' #f39c12';
              parentDiv.style.border = '2px solid #e67e22';
              parentDiv.style.boxShadow = '0 2px 12px rgba(230, 126, 34, 0.3)';
            }
          }
          currentU = Math.floor(currentU / 2);
        }
        updateNodeDisplaySafe(u, tl, tr);
      }    } else {
      console.warn(`❌ 节点 u=${u} 的 DOM 元素未找到`);
    }

    // 递增索引（在高亮节点后）
    stepModifyState.currentIndex++;
    console.log(`👣 步骤完成，索引递增到: ${stepModifyState.currentIndex}`);

    // 更新进度（基于递增后的索引）
    const currentStep = stepModifyState.currentIndex; // 已完成的步骤数
    const totalSteps = stepModifyState.affectedNodes.length;
    
    const stepCurrent = container.querySelector('#modify-step-current');
    const stepPercentage = container.querySelector('#modify-step-percentage');
    const progressBar = container.querySelector('#modify-step-progress-bar');
    
    console.log(`📊 更新修改进度: ${currentStep}/${totalSteps} (${Math.round((currentStep / totalSteps) * 100)}%)`);
    
    if (stepCurrent) stepCurrent.textContent = currentStep;
    if (stepPercentage) stepPercentage.textContent = `${Math.round((currentStep / totalSteps) * 100)}%`;
    if (progressBar) progressBar.style.width = `${(currentStep / totalSteps) * 100}%`;
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
    const nodeDiv = ModifyVisualizerState.domNodeElements.get(u);
    if (!nodeDiv) return;
    const lazyValue = ModifyVisualizerState.globalLazy[u] || 0;
    const lazyDisplay = lazyValue === 0 ? '-' : lazyValue;
    let treeNode = ModifyVisualizerState.globalTree[u] || { sum: 0, max: 0, min: 0 };
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
    ModifyVisualizerState.lastBuiltContainer.prepend(errorDiv);
    setTimeout(() => errorDiv.remove(), getAnimationDelay() * 6);
  }

  // 初始化
  function initTreeVisualizer() {
    const inputCustomData = document.getElementById('input-custom-data-modify');
    const btnRandomData = document.getElementById('btn-random-data-modify');
    const btnUpdateCustomData = document.getElementById('btn-update-custom-data-modify');
    const btnApplyModificationDirect = document.getElementById('btn-apply-modification-direct');
    const btnApplyModificationStep = document.getElementById('btn-apply-modification-step');
    const customTreeVisualizerHost = document.getElementById('modify-tree-visualizer-host');

    if (inputCustomData) inputCustomData.value = "1 1 4 5 1 4";

    if (btnRandomData) {
      btnRandomData.addEventListener('click', () => {
        const randomArray = Array.from({ length: Math.floor(Math.random() * 4) + 5 }, () => Math.floor(Math.random() * 10) + 1); // 1 到 10
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
          // 检查每个数字是否在 -50 到 50 之间
          const outOfRange = dataArray.some(num => num < -50 || num > 50);
          if (outOfRange) {
            showError('每个数字必须在 -50 到 50 之间！');
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
        if (!ModifyVisualizerState.isTreeRendered) {
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
        if (modifyL < 1 || modifyR > ModifyVisualizerState.lastBuiltN || modifyL > modifyR) {
          showError(`请输入有效的区间 [1, ${ModifyVisualizerState.lastBuiltN}]！`);
          return;
        }
        performRangeUpdate(modifyL, modifyR, modifyValue, ModifyVisualizerState.lastBuiltContainer);
      });
    }

    if (btnApplyModificationStep) {
      btnApplyModificationStep.addEventListener('click', () => {
        if (!ModifyVisualizerState.isTreeRendered) {
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
        if (modifyL < 1 || modifyR > ModifyVisualizerState.lastBuiltN || modifyL > modifyR) {
          showError(`请输入有效的区间 [1, ${ModifyVisualizerState.lastBuiltN}]！`);
          return;
        }
        performRangeUpdateStep(modifyL, modifyR, modifyValue, ModifyVisualizerState.lastBuiltContainer);
      });
    }

    window.addEventListener('resize', debounce(() => {
      if (ModifyVisualizerState.isTreeRendered && ModifyVisualizerState.lastBuiltContainer && ModifyVisualizerState.lastBuiltN > 0) {
        const containerStyle = window.getComputedStyle(ModifyVisualizerState.lastBuiltContainer);
        if (containerStyle.display !== 'none' && ModifyVisualizerState.lastBuiltContainer.offsetParent !== null) {
          buildTreeVisualizationWithData(null, ModifyVisualizerState.lastBuiltContainer, true);
        }
      }
    }, 250));

    // 监听动画速度变化事件
    window.addEventListener('animationSpeedChanged', (event) => {
      console.log('🎬 动画速度已更改为:', event.detail.speed);
    });
  }

  // 暴露接口
  window.ModifyTreeVisualizer = {
    buildTreeVisualizationWithData,
    initModifyTreeVisualizer: initTreeVisualizer
  };
})();