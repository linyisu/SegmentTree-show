document.addEventListener('DOMContentLoaded', () => {
    // 根据深度获取节点颜色（与构建可视化保持一致）
    function getNodeStylesByDepth(depth) {
        const theme = document.documentElement.getAttribute('data-theme') || 'light';
        
        const colorSchemes = {
            light: {
                0: { background: '#8b7ed8', border: '#4a3fb8' },
                1: { background: '#e89ac7', border: '#a14070' },
                2: { background: '#4db6ac', border: '#236660' },
                3: { background: '#ffb74d', border: '#b87a15' }
            },
            dark: {
                0: { background: '#5a4fcf', border: '#2d1f6b' },
                1: { background: '#c1578a', border: '#6b2742' },
                2: { background: '#2d8a7f', border: '#164039' },
                3: { background: '#d4941e', border: '#7a5210' }
            },
            'eye-care': {
                0: { background: '#9c88e6', border: '#655398' },
                1: { background: '#f0a7d1', border: '#b5688c' },
                2: { background: '#66c2b8', border: '#3c8a7d' },
                3: { background: '#ffc266', border: '#cc8f38' }
            }
        };
        
        const scheme = colorSchemes[theme] || colorSchemes.light;
        return scheme[depth] || scheme[0];
    }

    // 计算节点深度
    function calculateNodeDepth(nodeIndex, totalNodes) {
        if (totalNodes <= 1) return 0;
        
        // 使用二进制表示计算深度
        let depth = 0;
        let temp = nodeIndex;
        while (temp > 1) {
            temp = Math.floor(temp / 2);
            depth++;
        }
        
        return Math.min(depth, 3); // 最大深度为3
    }

    // 状态管理
    const QueryVisualizerState = {
        lastBuiltN: 0,
        lastBuiltContainer: null,
        isTreeRendered: false,
        domNodeElements: new Map(),
        globalTree: [],
        globalLazy: [],
        currentTreeLevelsData: [],
        currentTreeBuildOrderData: [],
        activeBuildAnimationTimeout: null
    };

    // 步进查询状态
    let stepQueryState = {
        isActive: false,
        affectedNodes: [],
        currentIndex: 0,
        queryL: 0,
        queryR: 0,
        container: null,
        result: { sum: 0, max: -Infinity, min: Infinity },
        resultDisplayed: false
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

        let n = isResizeUpdate && dataArray === null ? QueryVisualizerState.lastBuiltN : (dataArray ? dataArray.length : 0);
        if (!isResizeUpdate) {
            QueryVisualizerState.lastBuiltN = n;
            QueryVisualizerState.lastBuiltContainer = container;
            QueryVisualizerState.isTreeRendered = false;
            QueryVisualizerState.domNodeElements.clear();
            QueryVisualizerState.currentTreeLevelsData = [];
            QueryVisualizerState.currentTreeBuildOrderData = [];
            if (QueryVisualizerState.activeBuildAnimationTimeout) {
                clearTimeout(QueryVisualizerState.activeBuildAnimationTimeout);
                QueryVisualizerState.activeBuildAnimationTimeout = null;
            }

            if (n < 1 || n > 8) {
                showError('请输入 1-8 个数字');
                return;
            }

            container.innerHTML = `
                <h4>🔍 线段树区间查询过程:</h4>
                <p><strong>数组数据:</strong> [${dataArray ? dataArray.join(', ') : ''}]</p>
                <p><strong>数组长度:</strong> ${n}</p>
            `;            const treeVisual = document.createElement('div');
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

        if (!isResizeUpdate) {
            QueryVisualizerState.globalTree = new Array(4 * n).fill().map(() => ({ sum: 0, max: -Infinity, min: Infinity }));
            QueryVisualizerState.globalLazy = new Array(4 * n).fill(0);

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
            buildTree(dataArray, QueryVisualizerState.globalTree, 1, 1, n);
        }

        if (!isResizeUpdate) {
            QueryVisualizerState.currentTreeLevelsData = [];
            function collectLevels(l, r, u, depth = 0) {
                if (l > r) return;
                if (!QueryVisualizerState.currentTreeLevelsData[depth]) QueryVisualizerState.currentTreeLevelsData[depth] = [];
                const treeNode = QueryVisualizerState.globalTree[u] || { sum: 0, max: 0, min: 0 };
                const lazyValue = QueryVisualizerState.globalLazy[u] || 0;
                QueryVisualizerState.currentTreeLevelsData[depth].push({ l, r, u, depth, lazy: lazyValue, sum: treeNode.sum, max: treeNode.max, min: treeNode.min });
                if (l < r) {
                    const mid = Math.floor((l + r) / 2);
                    collectLevels(l, mid, u * 2, depth + 1);
                    collectLevels(mid + 1, r, u * 2 + 1, depth + 1);
                }
            }
            collectLevels(1, n, 1);

            const totalLevels = QueryVisualizerState.currentTreeLevelsData.length;
            const calculatedHeight = totalLevels * levelHeight + 100;
            treeVisual.style.minHeight = `${calculatedHeight}px`;
            treeVisual.style.height = `${calculatedHeight}px`;
        }

        const nodePositions = new Map();
        function calculateNodePositions(l, r, u, depth = 0, parentX = null, parentW = null) {
            const levelNodes = QueryVisualizerState.currentTreeLevelsData[depth];
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

            const actualContainerWidth = containerWidth;
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

        if (!isResizeUpdate) {
            QueryVisualizerState.currentTreeBuildOrderData = [];
            function generateBuildOrder(l, r, u, depth = 0) {
                if (l > r) return;
                const levelNodes = QueryVisualizerState.currentTreeLevelsData[depth];
                if (!levelNodes || !levelNodes.find(node => node.u === u && node.l === l && node.r === r)) return;
                const treeNode = QueryVisualizerState.globalTree[u] || { sum: 0, max: 0, min: 0 };
                const lazyValue = QueryVisualizerState.globalLazy[u] || 0;
                QueryVisualizerState.currentTreeBuildOrderData.push({ l, r, u, depth, lazy: lazyValue, sum: treeNode.sum, max: treeNode.max, min: treeNode.min });
                if (l < r) {
                    const mid = Math.floor((l + r) / 2);
                    generateBuildOrder(l, mid, u * 2, depth + 1);
                    generateBuildOrder(mid + 1, r, u * 2 + 1, depth + 1);
                }
            }
            generateBuildOrder(1, n, 1);

            let orderIndex = 0;
            function renderNextNode() {
                if (orderIndex >= QueryVisualizerState.currentTreeBuildOrderData.length) {
                    QueryVisualizerState.activeBuildAnimationTimeout = null;
                    setTimeout(() => {
                        QueryVisualizerState.isTreeRendered = true;
                        console.log('🎉 线段树渲染完成');
                    }, 1000);
                    return;
                }

                const { l, r, u, depth, lazy, sum, max, min } = QueryVisualizerState.currentTreeBuildOrderData[orderIndex];
                const position = nodePositions.get(u);
                if (!position) {
                    orderIndex++;
                    QueryVisualizerState.activeBuildAnimationTimeout = setTimeout(renderNextNode, 50);
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
                nodeDiv.style.minHeight = '80px';                // 计算节点深度和获取对应颜色
                const nodeDepth = calculateNodeDepth(u, n);
                const styles = getNodeStylesByDepth(nodeDepth);
                
                nodeDiv.style.display = 'flex';
                nodeDiv.style.flexDirection = 'column';
                nodeDiv.style.justifyContent = 'center';
                nodeDiv.style.alignItems = 'center';
                nodeDiv.style.fontSize = '13px';
                nodeDiv.style.padding = '6px';
                nodeDiv.style.boxSizing = 'border-box';
                nodeDiv.style.borderRadius = '8px';
                nodeDiv.style.border = `2px solid ${styles.border}`;
                nodeDiv.style.background = styles.background;
                nodeDiv.style.color = 'white';
                nodeDiv.style.textAlign = 'center';
                nodeDiv.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';

                nodeDiv.style.opacity = '0';
                nodeDiv.style.transform = 'translateY(-10px)';
                treeVisual.appendChild(nodeDiv);
                QueryVisualizerState.domNodeElements.set(u, nodeDiv);

                setTimeout(() => {
                    nodeDiv.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                    nodeDiv.style.opacity = '1';
                    nodeDiv.style.transform = 'translateY(0)';
                }, 50);

                orderIndex++;
                QueryVisualizerState.activeBuildAnimationTimeout = setTimeout(renderNextNode, 100);
            }
            QueryVisualizerState.activeBuildAnimationTimeout = setTimeout(renderNextNode, 500);
        } else {
            requestAnimationFrame(() => {
                QueryVisualizerState.domNodeElements.forEach((nodeDiv, u) => {
                    const position = nodePositions.get(u);
                    if (position) {
                        nodeDiv.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                        nodeDiv.style.left = `${position.x - position.nodeWidth / 2}px`;
                        nodeDiv.style.top = `${position.y}px`;
                        nodeDiv.style.width = `${position.nodeWidth}px`;
                    }
                });
            });
            QueryVisualizerState.isTreeRendered = true;
        }
    }

    // 下推懒标记
    function pushDown(u, tl, tr) {
        if (QueryVisualizerState.globalLazy[u] !== 0) {
            const delta = QueryVisualizerState.globalLazy[u];
            const len = tr - tl + 1;
            console.log(`🔽 下推节点 u=${u} [${tl},${tr}] 懒标记 ${delta}`);
            QueryVisualizerState.globalTree[u].sum += delta * len;
            QueryVisualizerState.globalTree[u].max += delta;
            QueryVisualizerState.globalTree[u].min += delta;
            if (tl !== tr) {
                QueryVisualizerState.globalLazy[u * 2] += delta;
                QueryVisualizerState.globalLazy[u * 2 + 1] += delta;
                console.log(`  - 左子节点 u=${u * 2} 接收懒标记 ${QueryVisualizerState.globalLazy[u * 2]}`);
                console.log(`  - 右子节点 u=${u * 2 + 1} 接收懒标记 ${QueryVisualizerState.globalLazy[u * 2 + 1]}`);
            }
            QueryVisualizerState.globalLazy[u] = 0;
            console.log(`  - 清除节点 u=${u} 懒标记，当前 lazy=${QueryVisualizerState.globalLazy[u]}`);
            updateNodeDisplaySafe(u, tl, tr);
            if (tl !== tr) {
                const mid = Math.floor((tl + tr) / 2);
                updateNodeDisplaySafe(u * 2, tl, mid);
                updateNodeDisplaySafe(u * 2 + 1, mid + 1, tr);
            }
        }
    }

    // 区间查询
    function queryRange(l, r, tl, tr, u) {
        console.log(`🔍 queryRange: [${l},${r}] 在节点 u=${u} [${tl},${tr}]`);
        if (l > tr || r < tl) {
            console.log(`❌ 无交集，节点 u=${u} 跳过`);
            return { sum: 0, max: -Infinity, min: Infinity };
        }
        pushDown(u, tl, tr);
        if (l <= tl && tr <= r) {
            const sum = QueryVisualizerState.globalTree[u].sum;
            const max = QueryVisualizerState.globalTree[u].max;
            const min = QueryVisualizerState.globalTree[u].min;
            console.log(`✅ 完全包含，节点 u=${u} 返回 sum=${sum}, max=${max}, min=${min}`);
            const nodeDiv = QueryVisualizerState.domNodeElements.get(u);
            if (nodeDiv) {
                nodeDiv.dataset.fullyContained = 'true';
            }
            return { sum, max, min };
        }
        const mid = Math.floor((tl + tr) / 2);
        const leftResult = queryRange(l, r, tl, mid, u * 2);
        const rightResult = queryRange(l, r, mid + 1, tr, u * 2 + 1);
        const result = {
            sum: leftResult.sum + rightResult.sum,
            max: Math.max(leftResult.max, rightResult.max),
            min: Math.min(leftResult.min, rightResult.min)
        };
        console.log(`🔄 合并节点 u=${u} 结果: sum=${result.sum}, max=${result.max}, min=${result.min}`);
        updateNodeDisplaySafe(u, tl, tr);
        return result;
    }

    // 直接查询
    function performRangeQuery(queryL, queryR, container) {
        if (!QueryVisualizerState.isTreeRendered || !QueryVisualizerState.lastBuiltContainer) {
            showError('请先构建线段树！');
            return;
        }

        console.log(`⚡ 直接查询: [${queryL}, ${queryR}]`);
          const oldResults = container.querySelectorAll('.query-result');
        oldResults.forEach(result => result.remove());
        
        QueryVisualizerState.domNodeElements.forEach((nodeDiv, u) => {
            const nodeDepth = calculateNodeDepth(u, QueryVisualizerState.lastBuiltN);
            const styles = getNodeStylesByDepth(nodeDepth);
            nodeDiv.style.background = styles.background;
            nodeDiv.style.border = `2px solid ${styles.border}`;
            nodeDiv.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
            nodeDiv.dataset.fullyContained = 'false';
        });

        const result = queryRange(queryL, queryR, 1, QueryVisualizerState.lastBuiltN, 1);
        const affectedNodes = [];
        function collectNodes(u, tl, tr) {
            if (queryL > tr || queryR < tl) return;
            affectedNodes.push({ u, tl, tr });
            if (queryL <= tl && tr <= queryR) {
                return;
            }
            if (tl < tr) {
                const mid = Math.floor((tl + tr) / 2);
                collectNodes(u * 2, tl, mid);
                collectNodes(u * 2 + 1, mid + 1, tr);
            }
        }
        collectNodes(1, 1, QueryVisualizerState.lastBuiltN);        affectedNodes.forEach(({ u, tl, tr }, index) => {
            const nodeDiv = QueryVisualizerState.domNodeElements.get(u);
            if (nodeDiv) {
                setTimeout(() => {
                    const isFullyContained = nodeDiv.dataset.fullyContained === 'true';
                    // 使用红色和橙色突出显示查询相关节点，与主题无关
                    nodeDiv.style.background = isFullyContained ? '#ff6b6b' : '#f39c12';
                    nodeDiv.style.border = isFullyContained ? '2px solid #e74c3c' : '2px solid #e67e22';
                    nodeDiv.style.boxShadow = isFullyContained ? '0 2px 12px rgba(192, 57, 43, 0.3)' : '0 2px 12px rgba(230, 126, 34, 0.3)';
                    console.log(`🟢 高亮查询节点 u=${u} [${tl},${tr}]${isFullyContained ? ' (全包含-红色)' : ' (部分包含-橙色)'}`);
                    updateNodeDisplaySafe(u, tl, tr);
                }, index * 200);
            }
        });

        if (!document.querySelector('.query-result')) {
            setTimeout(() => {                const resultDiv = document.createElement('div');
                resultDiv.className = 'query-result';
                resultDiv.style.margin = '10px';
                resultDiv.style.padding = '15px';
                resultDiv.style.background = '#fff3cd';
                resultDiv.style.borderRadius = '8px';
                resultDiv.style.border = '1px solid #ffeaa7';
                resultDiv.style.position = 'relative';
                resultDiv.innerHTML = `
                    <button class="close-btn" style="position: absolute; top: 5px; right: 8px; background: none; border: none; font-size: 18px; cursor: pointer; color: #6c757d; padding: 0; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;" title="关闭">&times;</button>
                    <strong>查询结果 [${queryL}, ${queryR}]:</strong><br>
                    总和: ${result.sum}<br>
                    最大值: ${result.max}<br>
                    最小值: ${result.min}
                `;
                const closeBtn = resultDiv.querySelector('.close-btn');
                closeBtn.addEventListener('click', () => {
                    resultDiv.remove();
                });
                container.appendChild(resultDiv);
            }, affectedNodes.length * 200 + 500);
        }
    }    // 步进查询
    function performRangeQueryStep(queryL, queryR, container) {
        console.log(`🚀 performRangeQueryStep 被调用: queryL=${queryL}, queryR=${queryR}, isActive=${stepQueryState.isActive}, currentIndex=${stepQueryState.currentIndex}`);
        
        if (!QueryVisualizerState.isTreeRendered || !QueryVisualizerState.lastBuiltContainer) {
            showError('请先构建线段树！');
            return;
        }

        // 检查是否需要初始化
        if (!stepQueryState.isActive || stepQueryState.queryL !== queryL || stepQueryState.queryR !== queryR) {
            console.log('👣 初始化步进查询');
            
            // 清除之前的查询结果
            const oldResults = container.querySelectorAll('.query-result');
            oldResults.forEach(result => result.remove());
              // 重置所有节点样式
            QueryVisualizerState.domNodeElements.forEach((nodeDiv, u) => {
                const nodeDepth = calculateNodeDepth(u, QueryVisualizerState.lastBuiltN);
                const styles = getNodeStylesByDepth(nodeDepth);
                nodeDiv.style.background = styles.background;
                nodeDiv.style.border = `2px solid ${styles.border}`;
                nodeDiv.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
                nodeDiv.dataset.fullyContained = 'false';
            });

            // 移除旧的进度条
            const oldProgress = container.querySelector('#step-progress-container');
            if (oldProgress) oldProgress.remove();

            // 创建新的进度条
            const progressContainer = document.createElement('div');
            progressContainer.id = 'step-progress-container';
            progressContainer.style.margin = '10px';
            progressContainer.style.padding = '10px';
            progressContainer.style.borderRadius = '8px';
            progressContainer.innerHTML = `
                <div id="step-progress-info">
                    步进进度: <span id="step-current">0</span>/<span id="step-total">0</span> (<span id="step-percentage">0%</span>)
                </div>
                <div style="background: #e9ecef; height: 10px; border-radius: 5px; overflow: hidden;">
                    <div id="step-progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #28a745, #20c997);"></div>
                </div>
            `;
            container.prepend(progressContainer);

            // 重置步进状态
            stepQueryState.isActive = true;
            stepQueryState.affectedNodes = [];
            stepQueryState.currentIndex = 0; // 从0开始
            stepQueryState.queryL = queryL;
            stepQueryState.queryR = queryR;
            stepQueryState.container = container;
            stepQueryState.result = { sum: 0, max: -Infinity, min: Infinity };
            stepQueryState.resultDisplayed = false;

            // 收集受影响的节点
            function collectAffectedNodes(u, tl, tr) {
                if (queryL > tr || queryR < tl) return;
                stepQueryState.affectedNodes.push({ u, tl, tr });
                // 如果当前节点被完全包含，就不继续向下递归
                if (queryL <= tl && tr <= queryR) {
                    return;
                }
                if (tl < tr) {
                    const mid = Math.floor((tl + tr) / 2);
                    collectAffectedNodes(u * 2, tl, mid);
                    collectAffectedNodes(u * 2 + 1, mid + 1, tr);
                }
            }            collectAffectedNodes(1, 1, QueryVisualizerState.lastBuiltN);
            console.log(`👣 初始化完成，受影响节点数: ${stepQueryState.affectedNodes.length}`);
            
            // 先保存当前的 fullyContained 状态
            const savedStates = new Map();
            QueryVisualizerState.domNodeElements.forEach((nodeDiv, u) => {
                savedStates.set(u, nodeDiv.dataset.fullyContained);
            });
            
            // 执行查询获取最终结果（但不显示）
            stepQueryState.result = queryRange(queryL, queryR, 1, QueryVisualizerState.lastBuiltN, 1);
            
            // 恢复之前的 fullyContained 状态
            QueryVisualizerState.domNodeElements.forEach((nodeDiv, u) => {
                nodeDiv.dataset.fullyContained = savedStates.get(u) || 'false';
            });

            // 更新总步数
            const stepTotal = container.querySelector('#step-total');
            if (stepTotal) stepTotal.textContent = stepQueryState.affectedNodes.length;
            
            // 初始化完成，等待下次点击执行第一步
            return;
        }

        // 检查是否完成所有步骤
        if (stepQueryState.currentIndex >= stepQueryState.affectedNodes.length) {
            // 防止重复显示结果
            if (stepQueryState.resultDisplayed) {
                console.log('⚠️ 结果已显示，跳过重复显示');
                return;
            }
            
            console.log('✅ 所有步进步骤完成');
            stepQueryState.resultDisplayed = true;
              const resultDiv = document.createElement('div');
            resultDiv.className = 'query-result';
            resultDiv.style.margin = '10px';
            resultDiv.style.padding = '15px';
            resultDiv.style.background = '#fff3cd';
            resultDiv.style.borderRadius = '8px';
            resultDiv.style.border = '1px solid #ffeaa7';
            resultDiv.style.position = 'relative';
            resultDiv.innerHTML = `
                <button class="close-btn" style="position: absolute; top: 5px; right: 8px; background: none; border: none; font-size: 18px; cursor: pointer; color: #6c757d; padding: 0; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;" title="关闭">&times;</button>
                <strong>查询结果 [${queryL}, ${queryR}]:</strong><br>
                总和: ${stepQueryState.result.sum}<br>
                最大值: ${stepQueryState.result.max}<br>
                最小值: ${stepQueryState.result.min}
            `;
            
            // 添加关闭按钮事件
            const closeBtn = resultDiv.querySelector('.close-btn');
            closeBtn.addEventListener('click', () => {
                resultDiv.remove();
            });
            
            container.appendChild(resultDiv);
            const progressContainer = container.querySelector('#step-progress-container');
            if (progressContainer) progressContainer.remove();
            stepQueryState.isActive = false;
            return;
        }        // 执行当前步骤
        const { u, tl, tr } = stepQueryState.affectedNodes[stepQueryState.currentIndex];
        const nodeDiv = QueryVisualizerState.domNodeElements.get(u);

        console.log(`👣 执行步骤 ${stepQueryState.currentIndex + 1}: 节点 u=${u} [${tl},${tr}] (当前currentIndex=${stepQueryState.currentIndex})`);

        if (nodeDiv) {
            // 在步进过程中正确判断是否完全包含
            const isFullyContained = (stepQueryState.queryL <= tl && tr <= stepQueryState.queryR);
            nodeDiv.dataset.fullyContained = isFullyContained ? 'true' : 'false';
            
            nodeDiv.style.background = isFullyContained ? '#ff6b6b' : '#f39c12';
            nodeDiv.style.border = isFullyContained ? '2px solid #e74c3c' : '2px solid #e67e22';
            nodeDiv.style.boxShadow = isFullyContained ? '0 2px 12px rgba(192, 57, 43, 0.3)' : '0 2px 12px rgba(230, 126, 34, 0.3)';
            console.log(`🟢 步进：高亮查询节点 u=${u} [${tl},${tr}]${isFullyContained ? ' (全包含-红色)' : ' (部分包含-橙色)'}`);
            updateNodeDisplaySafe(u, tl, tr);
        } else {
            console.warn(`❌ 节点 u=${u} 的 DOM 元素未找到`);
        }

        // 递增索引（在高亮节点后）
        stepQueryState.currentIndex++;
        console.log(`👣 步骤完成，索引递增到: ${stepQueryState.currentIndex}`);

        // 更新进度（基于递增后的索引）
        const currentStep = stepQueryState.currentIndex; // 已完成的步骤数
        const totalSteps = stepQueryState.affectedNodes.length;
        
        const stepCurrent = container.querySelector('#step-current');
        const stepPercentage = container.querySelector('#step-percentage');
        const progressBar = container.querySelector('#step-progress-bar');
        
        console.log(`📊 更新进度: ${currentStep}/${totalSteps} (${Math.round((currentStep / totalSteps) * 100)}%)`);
        
        if (stepCurrent) stepCurrent.textContent = currentStep;
        if (stepPercentage) stepPercentage.textContent = `${Math.round((currentStep / totalSteps) * 100)}%`;
        if (progressBar) progressBar.style.width = `${(currentStep / totalSteps) * 100}%`;
    }

    // 安全更新节点显示
    function updateNodeDisplaySafe(u, tl, tr) {
        const nodeDiv = QueryVisualizerState.domNodeElements.get(u);
        if (!nodeDiv) return;
        const lazyValue = QueryVisualizerState.globalLazy[u] || 0;
        const lazyDisplay = lazyValue === 0 ? '-' : lazyValue;
        let treeNode = QueryVisualizerState.globalTree[u] || { sum: 0, max: 0, min: 0 };
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
        QueryVisualizerState.lastBuiltContainer?.prepend(errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
    }    // 防止重复初始化的标记
    let isInitialized = false;

    // 初始化
    function initQueryTreeVisualizer() {
        if (isInitialized) {
            console.log('⚠️ 查询可视化模块已初始化，跳过重复初始化');
            return;
        }
        
        const inputCustomData = document.getElementById('input-custom-data-query');
        const btnRandomData = document.getElementById('btn-random-data-query');
        const btnUpdateCustomData = document.getElementById('btn-update-custom-data-query');
        const btnApplyQueryDirect = document.getElementById('btn-apply-query-direct');
        const btnApplyQueryStep = document.getElementById('btn-apply-query-step');
        const customTreeNodesData = document.getElementById('query-tree-visualizer-host');

        if (!inputCustomData || !btnRandomData || !btnUpdateCustomData || !btnApplyQueryDirect || !btnApplyQueryStep || !customTreeNodesData) {
            console.error('初始化失败：缺少必要的 DOM 元素', {
                inputCustomData: !!inputCustomData,
                btnRandomData: !!btnRandomData,
                btnUpdateCustomData: !!btnUpdateCustomData,
                btnApplyQueryDirect: !!btnApplyQueryDirect,
                btnApplyQueryStep: !!btnApplyQueryStep,
                customTreeNodesData: !!customTreeNodesData
            });
            showError('页面元素加载失败，请检查 HTML 结构！');
            return;
        }

        if (inputCustomData) inputCustomData.value = "1 1 4 5 1 4";

        if (btnRandomData) {
            btnRandomData.addEventListener('click', () => {
                const randomArray = Array.from({ length: Math.floor(Math.random() * 4) + 5 }, () => Math.floor(Math.random() * 10) + 1);
                if (inputCustomData) inputCustomData.value = randomArray.join(' ');
            });
        }

        if (btnUpdateCustomData && customTreeNodesData) {
            btnUpdateCustomData.addEventListener('click', () => {
                const inputData = inputCustomData?.value?.trim();
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
                    const outOfRange = dataArray.some(num => num < -50 || num > 50);
                    if (outOfRange) {
                        showError('每个数字必须在 -50 到 50 之间！');
                        return;
                    }
                    buildTreeVisualizationWithData(dataArray, customTreeNodesData);
                } catch (error) {
                    showError('数据格式不正确！');
                }
            });
        }

        if (btnApplyQueryDirect) {
            btnApplyQueryDirect.addEventListener('click', () => {
                if (!QueryVisualizerState.isTreeRendered) {
                    showError('请先构建线段树！');
                    return;
                }
                const queryL = parseInt(document.getElementById('input-query-left')?.value || '0');
                const queryR = parseInt(document.getElementById('input-query-right')?.value || '0');
                if (isNaN(queryL) || isNaN(queryR)) {
                    showError('请输入有效的整数参数！');
                    return;
                }
                if (queryL < 1 || queryR > QueryVisualizerState.lastBuiltN || queryL > queryR) {
                    showError(`请输入有效的区间 [1, ${QueryVisualizerState.lastBuiltN}]！`);
                    return;
                }
                performRangeQuery(queryL, queryR, QueryVisualizerState.lastBuiltContainer);
            });
        }        if (btnApplyQueryStep) {
            const handleStepQuery = () => {
                console.log('🚀 步进查询按钮被点击');
                
                if (!QueryVisualizerState.isTreeRendered) {
                    showError('请先构建线段树！');
                    return;
                }
                const queryL = parseInt(document.getElementById('input-query-left')?.value || '0');
                const queryR = parseInt(document.getElementById('input-query-right')?.value || '0');
                if (isNaN(queryL) || isNaN(queryR)) {
                    showError('请输入有效的整数参数！');
                    return;
                }
                if (queryL < 1 || queryR > QueryVisualizerState.lastBuiltN || queryL > queryR) {
                    showError(`请输入有效的区间 [1, ${QueryVisualizerState.lastBuiltN}]！`);
                    return;
                }
                performRangeQueryStep(queryL, queryR, QueryVisualizerState.lastBuiltContainer);
            };

            // 清除所有可能的旧事件监听器
            const newButton = btnApplyQueryStep.cloneNode(true);
            btnApplyQueryStep.parentNode.replaceChild(newButton, btnApplyQueryStep);
            newButton.addEventListener('click', handleStepQuery);
        }window.addEventListener('resize', debounce(() => {
            if (QueryVisualizerState.isTreeRendered && QueryVisualizerState.lastBuiltContainer && QueryVisualizerState.lastBuiltN > 0) {
                const containerStyle = window.getComputedStyle(QueryVisualizerState.lastBuiltContainer);
                if (containerStyle.display !== 'none' && QueryVisualizerState.lastBuiltContainer.offsetParent !== null) {
                    buildTreeVisualizationWithData(null, QueryVisualizerState.lastBuiltContainer, true);
                }
            }
        }, 250));
        
        isInitialized = true;
        console.log('✅ 查询可视化模块初始化完成');
    }

    window.QueryTreeVisualizer = {
        buildTreeVisualizationWithData,
        initQueryTreeVisualizer
    };

    initQueryTreeVisualizer();
});