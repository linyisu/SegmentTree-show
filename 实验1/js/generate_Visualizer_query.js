/* 线段树区间查询可视化模块 */
(function () {
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
        result: { sum: 0, max: -Infinity, min: Infinity }
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

            // 清空容器并创建结构
            container.innerHTML = `
                <h4>🔍 线段树区间查询过程:</h4>
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
            QueryVisualizerState.globalTree = new Array(4 * n).fill().map(() => ({ sum: 0, max: -Infinity, min: Infinity }));
            QueryVisualizerState.globalLazy = new Array(4 * n).fill(0);

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
            buildTree(dataArray, QueryVisualizerState.globalTree, 1, 1, n);
        }

        // 收集层级数据
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

        // 计算节点位置
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

        // 渲染节点
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
                    <div class="node-info">lazy:<span class="lazy-tag">${lazyDisplay}</span> max:${max}</div>
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
        const result = queryRange(queryL, queryR, 1, QueryVisualizerState.lastBuiltN, 1);

        QueryVisualizerState.domNodeElements.forEach((nodeDiv) => {
            nodeDiv.style.background = 'linear-gradient(135deg, #74b9ff, #0984e3)';
            nodeDiv.style.border = '2px solid #74b9ff';
            nodeDiv.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
            nodeDiv.classList.remove('active');
        });

        const affectedNodes = [];
        function collectNodes(u, tl, tr) {
            if (queryL > tr || queryR < tl) return;
            affectedNodes.push({ u, tl, tr });
            if (tl < tr) {
                const mid = Math.floor((tl + tr) / 2);
                collectNodes(u * 2, tl, mid);
                collectNodes(u * 2 + 1, mid + 1, tr);
            }
        }
        collectNodes(1, 1, QueryVisualizerState.lastBuiltN);

        affectedNodes.forEach(({ u, tl, tr }, index) => {
            const nodeDiv = QueryVisualizerState.domNodeElements.get(u);
            if (nodeDiv) {
                setTimeout(() => {
                    nodeDiv.style.background = 'linear-gradient(135deg, #2ecc71, #27ae60)';
                    nodeDiv.style.border = '2px solid #27ae60';
                    nodeDiv.style.boxShadow = '0 2px 12px rgba(39, 174, 96, 0.3)';
                    nodeDiv.classList.add('active');
                    console.log(`🟢 高亮查询节点 u=${u} [${tl},${tr}]`);
                    updateNodeDisplaySafe(u, tl, tr);
                }, index * 200);
            }
        });

        setTimeout(() => {
            const resultDiv = document.createElement('div');
            resultDiv.className = 'query-result';
            resultDiv.style.margin = '10px';
            resultDiv.style.padding = '10px';
            resultDiv.style.background = '#e8f4f8';
            resultDiv.style.borderRadius = '8px';
            resultDiv.innerHTML = `
                <strong>查询结果 [${queryL}, ${queryR}]:</strong><br>
                总和: ${result.sum}<br>
                最大值: ${result.max}<br>
                最小值: ${result.min}
            `;
            container.appendChild(resultDiv);
            setTimeout(() => resultDiv.remove(), 5000);
        }, affectedNodes.length * 200 + 500);
    }

    // 步进查询
    function performRangeQueryStep(queryL, queryR, container) {
        if (!QueryVisualizerState.isTreeRendered || !QueryVisualizerState.lastBuiltContainer) {
            showError('请先构建线段树！');
            return;
        }

        if (!stepQueryState.isActive || stepQueryState.queryL !== queryL || stepQueryState.queryR !== queryR) {
            console.log('👣 初始化步进查询');
            QueryVisualizerState.domNodeElements.forEach((nodeDiv) => {
                nodeDiv.style.background = 'linear-gradient(135deg, #74b9ff, #0984e3)';
                nodeDiv.style.border = '2px solid #74b9ff';
                nodeDiv.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
                nodeDiv.classList.remove('active');
            });

            const oldProgress = container.querySelector('#step-progress-container');
            if (oldProgress) oldProgress.remove();

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
                    <div id="step-progress-bar" style="width: 0%; height: 100%;"></div>
                </div>
            `;
            container.prepend(progressContainer);

            stepQueryState.isActive = true;
            stepQueryState.affectedNodes = [];
            stepQueryState.currentIndex = 0;
            stepQueryState.queryL = queryL;
            stepQueryState.queryR = queryR;
            stepQueryState.container = container;
            stepQueryState.result = { sum: 0, max: -Infinity, min: Infinity };

            function collectAffectedNodes(u, tl, tr) {
                if (queryL > tr || queryR < tl) return;
                stepQueryState.affectedNodes.push({ u, tl, tr });
                if (tl < tr) {
                    const mid = Math.floor((tl + tr) / 2);
                    collectAffectedNodes(u * 2, tl, mid);
                    collectAffectedNodes(u * 2 + 1, mid + 1, tr);
                }
            }
            collectAffectedNodes(1, 1, QueryVisualizerState.lastBuiltN);
            console.log(`👣 初始化完成，受影响节点数: ${stepQueryState.affectedNodes.length}`);
            stepQueryState.result = queryRange(queryL, queryR, 1, QueryVisualizerState.lastBuiltN, 1);

            const stepTotal = container.querySelector('#step-total');
            if (stepTotal) stepTotal.textContent = stepQueryState.affectedNodes.length;
        }

        if (stepQueryState.currentIndex >= stepQueryState.affectedNodes.length) {
            console.log('✅ 所有步进步骤完成');
            const resultDiv = document.createElement('div');
            resultDiv.className = 'query-result';
            resultDiv.style.margin = '10px';
            resultDiv.style.padding = '10px';
            resultDiv.style.background = '#e8f4f8';
            resultDiv.style.borderRadius = '8px';
            resultDiv.innerHTML = `
                <strong>查询结果 [${queryL}, ${queryR}]:</strong><br>
                总和: ${stepQueryState.result.sum}<br>
                最大值: ${stepQueryState.result.max}<br>
                最小值: ${stepQueryState.result.min}
            `;
            container.appendChild(resultDiv);
            setTimeout(() => resultDiv.remove(), 5000);
            const progressContainer = container.querySelector('#step-progress-container');
            if (progressContainer) progressContainer.remove();
            stepQueryState.isActive = false;
            return;
        }

        const { u, tl, tr } = stepQueryState.affectedNodes[stepQueryState.currentIndex];
        const nodeDiv = QueryVisualizerState.domNodeElements.get(u);

        console.log(`👣 执行步骤 ${stepQueryState.currentIndex + 1}: 节点 u=${u} [${tl},${tr}]`);

        if (nodeDiv) {
            nodeDiv.style.background = 'linear-gradient(135deg, #2ecc71, #27ae60)';
            nodeDiv.style.border = '2px solid #27ae60';
            nodeDiv.style.boxShadow = '0 2px 12px rgba(39, 174, 96, 0.3)';
            nodeDiv.classList.add('active');
            console.log(`🟢 步进：高亮查询节点 u=${u} [${tl},${tr}]`);
            updateNodeDisplaySafe(u, tl, tr);
        } else {
            console.warn(`❌ 节点 u=${u} 的 DOM 元素未找到`);
        }

        const stepCurrent = container.querySelector('#step-current');
        const stepPercentage = container.querySelector('#step-percentage');
        const progressBar = container.querySelector('#step-progress-bar');
        const totalSteps = stepQueryState.affectedNodes.length;
        const currentStep = stepQueryState.currentIndex + 1;
        if (stepCurrent) stepCurrent.textContent = currentStep;
        if (stepPercentage) stepPercentage.textContent = `${Math.round((currentStep / totalSteps) * 100)}%`;
        if (progressBar) progressBar.style.width = `${(currentStep / totalSteps) * 100}%`;

        stepQueryState.currentIndex++;
        console.log(`👣 步骤完成，currentIndex=${stepQueryState.currentIndex}`);
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
            <div class="node-info">lazy:<span class="lazy-tag">${lazyDisplay}</span> max:${displayMax}</div>
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
        QueryVisualizerState.lastBuiltContainer.prepend(errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
    }

    // 初始化
    function initQueryTreeVisualizer() {
        const inputCustomData = document.getElementById('input-custom-data');
        const btnRandomData = document.getElementById('btn-random-data');
        const btnUpdateCustomData = document.getElementById('btn-update-custom-data');
        const btnApplyQueryDirect = document.getElementById('btn-apply-query-direct');
        const btnApplyQueryStep = document.getElementById('btn-apply-query-step');
        const customTreeVisualizerHost = document.getElementById('custom-tree-visualizer-host');

        if (!inputCustomData || !btnRandomData || !btnUpdateCustomData || !btnApplyQueryDirect || !btnApplyQueryStep || !customTreeVisualizerHost) {
            console.error('初始化失败：缺少必要的 DOM 元素', {
                inputCustomData: !!inputCustomData,
                btnRandomData: !!btnRandomData,
                btnUpdateCustomData: !!btnUpdateCustomData,
                btnApplyQueryDirect: !!btnApplyQueryDirect,
                btnApplyQueryStep: !!btnApplyQueryStep,
                customTreeVisualizerHost: !!customTreeVisualizerHost
            });
            showError('页面元素加载失败，请检查 HTML 结构！');
            return;
        }

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

        if (btnApplyQueryDirect) {
            btnApplyQueryDirect.addEventListener('click', () => {
                if (!QueryVisualizerState.isTreeRendered) {
                    showError('请先构建线段树！');
                    return;
                }
                const queryL = parseInt(document.getElementById('input-query-left')?.value);
                const queryR = parseInt(document.getElementById('input-query-right')?.value);
                if (!Number.isInteger(queryL) || !Number.isInteger(queryR)) {
                    showError('请输入有效的整数参数！');
                    return;
                }
                if (queryL < 1 || queryR > QueryVisualizerState.lastBuiltN || queryL > queryR) {
                    showError(`请输入有效的区间 [1, ${QueryVisualizerState.lastBuiltN}]！`);
                    return;
                }
                performRangeQuery(queryL, queryR, QueryVisualizerState.lastBuiltContainer);
            });
        }

        if (btnApplyQueryStep) {
            btnApplyQueryStep.addEventListener('click', () => {
                if (!QueryVisualizerState.isTreeRendered) {
                    showError('请先构建线段树！');
                    return;
                }
                const queryL = parseInt(document.getElementById('input-query-left')?.value);
                const queryR = parseInt(document.getElementById('input-query-right')?.value);
                if (!Number.isInteger(queryL) || !Number.isInteger(queryR)) {
                    showError('请输入有效的整数参数！');
                    return;
                }
                if (queryL < 1 || queryR > QueryVisualizerState.lastBuiltN || queryL > queryR) {
                    showError(`请输入有效的区间 [1, ${QueryVisualizerState.lastBuiltN}]！`);
                    return;
                }
                performRangeQueryStep(queryL, queryR, QueryVisualizerState.lastBuiltContainer);
            });
        }

        window.addEventListener('resize', debounce(() => {
            if (QueryVisualizerState.isTreeRendered && QueryVisualizerState.lastBuiltContainer && QueryVisualizerState.lastBuiltN > 0) {
                const containerStyle = window.getComputedStyle(QueryVisualizerState.lastBuiltContainer);
                if (containerStyle.display !== 'none' && QueryVisualizerState.lastBuiltContainer.offsetParent !== null) {
                    buildTreeVisualizationWithData(null, QueryVisualizerState.lastBuiltContainer, true);
                }
            }
        }, 250));
    }

    // 暴露接口
    window.QueryTreeVisualizer = {
        buildTreeVisualizationWithData,
        initQueryTreeVisualizer
    };
})();