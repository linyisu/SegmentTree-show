/* 线段树区间查询可视化模块 - 修复版本 */
document.addEventListener('DOMContentLoaded', () => {
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

    // ... 其他函数保持不变 ...

    // 步进查询 - 简化版本
    function performRangeQueryStep(queryL, queryR, container) {
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
            QueryVisualizerState.domNodeElements.forEach((nodeDiv) => {
                nodeDiv.style.background = 'linear-gradient(135deg, #74b9ff, #0984e3)';
                nodeDiv.style.border = '2px solid #74b9ff';
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
            }
            collectAffectedNodes(1, 1, QueryVisualizerState.lastBuiltN);
            console.log(`👣 初始化完成，受影响节点数: ${stepQueryState.affectedNodes.length}`);
            
            // 执行查询获取最终结果（但不显示）
            stepQueryState.result = queryRange(queryL, queryR, 1, QueryVisualizerState.lastBuiltN, 1);

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
            resultDiv.style.background = '#e8f4f8';
            resultDiv.style.borderRadius = '8px';
            resultDiv.style.border = '1px solid #bee5eb';
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
        }

        // 执行当前步骤
        const { u, tl, tr } = stepQueryState.affectedNodes[stepQueryState.currentIndex];
        const nodeDiv = QueryVisualizerState.domNodeElements.get(u);

        console.log(`👣 执行步骤 ${stepQueryState.currentIndex + 1}: 节点 u=${u} [${tl},${tr}]`);

        if (nodeDiv) {
            const isFullyContained = nodeDiv.dataset.fullyContained === 'true';
            nodeDiv.style.background = isFullyContained
                ? 'linear-gradient(135deg, #ff6b6b, #e74c3c)'
                : 'linear-gradient(135deg, #f39c12, #e67e22)';
            nodeDiv.style.border = isFullyContained
                ? '2px solid #e74c3c'
                : '2px solid #e67e22';
            nodeDiv.style.boxShadow = isFullyContained
                ? '0 2px 12px rgba(192, 57, 43, 0.3)'
                : '0 2px 12px rgba(230, 126, 34, 0.3)';
            console.log(`🟢 步进：高亮查询节点 u=${u} [${tl},${tr}]${isFullyContained ? ' (全包含-红色)' : ' (部分包含-橙色)'}`);
            updateNodeDisplaySafe(u, tl, tr);
        } else {
            console.warn(`❌ 节点 u=${u} 的 DOM 元素未找到`);
        }

        // 更新进度（先更新，后递增）
        const currentStep = stepQueryState.currentIndex + 1; // 当前步骤（1-based）
        const totalSteps = stepQueryState.affectedNodes.length;
        
        const stepCurrent = container.querySelector('#step-current');
        const stepPercentage = container.querySelector('#step-percentage');
        const progressBar = container.querySelector('#step-progress-bar');
        
        if (stepCurrent) stepCurrent.textContent = currentStep;
        if (stepPercentage) stepPercentage.textContent = `${Math.round((currentStep / totalSteps) * 100)}%`;
        if (progressBar) progressBar.style.width = `${(currentStep / totalSteps) * 100}%`;

        // 递增索引（在更新进度后）
        stepQueryState.currentIndex++;
        console.log(`👣 步骤完成，下一个索引: ${stepQueryState.currentIndex}`);
    }

    // ... 其他函数保持不变 ...
});
