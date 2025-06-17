function SegmentTree(arr) {
    this.arr = arr.slice();
    this.n = arr.length;
    this.tree = new Array(4 * this.n).fill(0);
    this.lazy = new Array(4 * this.n).fill(0);
    this.minTree = new Array(4 * this.n).fill(0);
    this.maxTree = new Array(4 * this.n).fill(0);
    if (this.n > 0) this.build(1, 0, this.n - 1);
}

SegmentTree.prototype.build = function(node, start, end) {
    if (start === end) {
        this.tree[node] = this.arr[start];
        this.minTree[node] = this.arr[start];
        this.maxTree[node] = this.arr[start];
        return;
    }
    const mid = Math.floor((start + end) / 2);
    this.build(2 * node, start, mid);
    this.build(2 * node + 1, mid + 1, end);
    this.tree[node] = this.tree[2 * node] + this.tree[2 * node + 1];
    this.minTree[node] = Math.min(this.minTree[2 * node], this.minTree[2 * node + 1]);
    this.maxTree[node] = Math.max(this.maxTree[2 * node], this.maxTree[2 * node + 1]);
};

SegmentTree.prototype.updateRange = function(node, start, end, l, r, val) {
    if (start > r || end < l) return;

    if (l <= start && end <= r) {
        this.lazy[node] += val;
        this.tree[node] += (end - start + 1) * val;
        this.minTree[node] += val;
        this.maxTree[node] += val;
        return;
    }

    this.pushDown(node, start, end);
    
    const mid = Math.floor((start + end) / 2);
    this.updateRange(2 * node, start, mid, l, r, val);
    this.updateRange(2 * node + 1, mid + 1, end, l, r, val);
    
    this.pushUp(node);
};

SegmentTree.prototype.pushDown = function(node, start, end) {
    if (this.lazy[node] !== 0) {
        const lazyValue = this.lazy[node];
        
        if (start !== end) {
            this.lazy[2 * node] += lazyValue;
            this.lazy[2 * node + 1] += lazyValue;
            
            const mid = Math.floor((start + end) / 2);
            
            this.tree[2 * node] += (mid - start + 1) * lazyValue;
            this.minTree[2 * node] += lazyValue;
            this.maxTree[2 * node] += lazyValue;
            
            this.tree[2 * node + 1] += (end - mid) * lazyValue;
            this.minTree[2 * node + 1] += lazyValue;
            this.maxTree[2 * node + 1] += lazyValue;
        }
        
        this.lazy[node] = 0;
    }
};

SegmentTree.prototype.pushUp = function(node) {
    this.tree[node] = this.tree[2 * node] + this.tree[2 * node + 1];
    this.minTree[node] = Math.min(this.minTree[2 * node], this.minTree[2 * node + 1]);
    this.maxTree[node] = Math.max(this.maxTree[2 * node], this.maxTree[2 * node + 1]);
};

SegmentTree.prototype.querySum = function(l, r) {
    return this.query(1, 0, this.n - 1, l, r);
};

SegmentTree.prototype.query = function(node, start, end, l, r) {
    if (start > r || end < l) return 0;
    
    if (l <= start && end <= r) {
        return this.tree[node];
    }
    
    this.pushDown(node, start, end);
    
    const mid = Math.floor((start + end) / 2);
    const leftSum = this.query(2 * node, start, mid, l, r);
    const rightSum = this.query(2 * node + 1, mid + 1, end, l, r);
    
    return leftSum + rightSum;
};

// 全局变量
let segmentTree = null;
let treeContainer = null;
let nodeElements = [];
let isAnimating = false;
let currentTreeDisplayed = false;

function setupTreeContainer() {
    treeContainer = document.getElementById('custom-tree-visualizer-host');
    if (!treeContainer) {
        console.error('未找到树容器元素');
        return;
    }
    
    treeContainer.style.cssText = `
        width: 100%;
        min-height: 200px;
        padding: 20px;
        box-sizing: border-box;
        overflow: hidden;
        position: relative;
        margin: 20px auto;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
    `;
    
    console.log('树容器已设置');
}

function adjustContainerSize() {
    if (!treeContainer || !segmentTree) return;
    
    const screenWidth = window.innerWidth;
    const levels = Math.ceil(Math.log2(segmentTree.n)) + 1;
    const estimatedHeight = levels * 140 + 100;
    
    treeContainer.style.minHeight = `${Math.max(200, estimatedHeight)}px`;
    
    if (screenWidth <= 768) {
        treeContainer.style.padding = '10px';
    } else {
        treeContainer.style.padding = '20px';
    }
}

function generateRandomData() {
    const length = Math.floor(Math.random() * 6) + 3; // 3-8个元素
    const data = [];
    for (let i = 0; i < length; i++) {
        data.push(Math.floor(Math.random() * 10) + 1); // 1-10的数字
    }
    return data.join(' ');
}

function validateArrayLength(arr) {
    if (arr.length < 1) {
        alert('数组长度不能为空');
        return false;
    }
    if (arr.length > 16) {
        alert('数组长度不能超过16个元素');
        return false;
    }
    return true;
}

function updateRangeInputLimits(arrayLength) {
    const leftInput = document.getElementById('input-modify-left');
    const rightInput = document.getElementById('input-modify-right');
    
    if (leftInput && rightInput) {
        leftInput.min = 1;
        leftInput.max = arrayLength;
        leftInput.value = 1;
        
        rightInput.min = 1;
        rightInput.max = arrayLength;
        rightInput.value = arrayLength;
    }
}

// 主要的绘制函数 - 立即显示
function drawTree() {
    if (!treeContainer || !segmentTree) return;
    
    isAnimating = true;
    createTreeNodes(false);
    isAnimating = false;
}

// 带动画的绘制函数 - 递归动画显示
function drawTreeWithAnimation() {
    if (!treeContainer || !segmentTree) return;
    
    isAnimating = true;
    currentTreeDisplayed = true;
    createTreeNodes(true);
    isAnimating = false;
}

function createTreeNodes(withAnimation = false) {
    if (!treeContainer) return;
    
    // 清空现有内容
    const existingNodes = treeContainer.querySelectorAll('.tree-node, svg');
    existingNodes.forEach(node => {
        node.style.opacity = '0';
        node.style.transform = 'scale(0.8)';
    });    setTimeout(() => {
        // 先清理连线，再清空容器
        clearAllLines();
        treeContainer.innerHTML = '';
        nodeElements = [];
        
        // 响应式参数
        const screenWidth = window.innerWidth;
        let responsiveNodeWidth = 120;
        let responsiveNodeHeight = 110;
        let responsiveFontSize = 13;
        const levelHeight = 140;
        
        if (screenWidth <= 480) {
            responsiveNodeWidth = 80;
            responsiveNodeHeight = 85;
            responsiveFontSize = 8;
        } else if (screenWidth <= 768) {
            responsiveNodeWidth = 95;
            responsiveNodeHeight = 95;
            responsiveFontSize = 10;
        }
        
        // 收集节点信息
        const nodesByLevel = [];
        const leafNodes = [];
        
        function collectNodes(node, start, end, level) {
            if (node >= segmentTree.tree.length) return;
            
            while (nodesByLevel.length <= level) {
                nodesByLevel.push([]);
            }
            
            const nodeInfo = {
                node: node,
                start: start,
                end: end,
                level: level
            };
            
            nodesByLevel[level].push(nodeInfo);
            
            if (start === end) {
                leafNodes.push(nodeInfo);
            } else {
                const mid = Math.floor((start + end) / 2);
                collectNodes(2 * node, start, mid, level + 1);
                collectNodes(2 * node + 1, mid + 1, end, level + 1);
            }
        }
        
        collectNodes(1, 0, segmentTree.n - 1, 0);
        
        // 计算布局
        const containerWidth = treeContainer.clientWidth - 40;
        const nodeSpacing = Math.max(10, (containerWidth - leafNodes.length * responsiveNodeWidth) / (leafNodes.length + 1));
        
        // 设置容器
        treeContainer.style.height = `${nodesByLevel.length * levelHeight + 40}px`;
        
        // 创建层级容器
        const levelContainers = [];
        for (let i = 0; i < nodesByLevel.length; i++) {
            const levelContainer = document.createElement('div');
            levelContainer.style.cssText = `
                position: relative;
                width: 100%;
                height: ${levelHeight}px;
                margin-bottom: 10px;
            `;
            treeContainer.appendChild(levelContainer);
            levelContainers.push(levelContainer);
        }
        
        // 计算节点位置
        function calculatePositions() {
            const positions = new Map();
            
            // 先布局叶子节点
            leafNodes.forEach((leaf, index) => {
                const x = nodeSpacing + index * (responsiveNodeWidth + nodeSpacing);
                positions.set(leaf.node, x);
            });
            
            // 自底向上计算内部节点位置
            for (let level = nodesByLevel.length - 2; level >= 0; level--) {
                nodesByLevel[level].forEach(nodeInfo => {
                    const { node, start, end } = nodeInfo;
                    const mid = Math.floor((start + end) / 2);
                    
                    const leftChild = positions.get(2 * node);
                    const rightChild = positions.get(2 * node + 1);
                    
                    if (leftChild !== undefined && rightChild !== undefined) {
                        positions.set(node, (leftChild + rightChild) / 2);
                    } else if (leftChild !== undefined) {
                        positions.set(node, leftChild);
                    } else if (rightChild !== undefined) {
                        positions.set(node, rightChild);
                    }
                });
            }
            
            return positions;
        }
        
        const positions = calculatePositions();
          // 创建节点元素
        function createNodeElement(nodeInfo, delay = 0) {
            const { node, start, end, level } = nodeInfo;
            const position = positions.get(node);
            
            // 获取节点值
            const sum = segmentTree.tree[node];
            const minVal = segmentTree.minTree[node];
            const maxVal = segmentTree.maxTree[node];
            const lazyValue = segmentTree.lazy[node];
            
            // 创建节点
            const nodeElement = document.createElement('div');
            nodeElement.className = `tree-node depth-${level}`;
            
            // 根据深度设置颜色
            let nodeBackground, nodeShadow;
            switch (level) {
                case 0:
                    nodeBackground = '#6c5ce7';
                    nodeShadow = '0 6px 16px rgba(108, 92, 231, 0.4)';
                    break;
                case 1:
                    nodeBackground = '#fd79a8';
                    nodeShadow = '0 5px 14px rgba(253, 121, 168, 0.3)';
                    break;
                case 2:
                    nodeBackground = '#00b894';
                    nodeShadow = '0 4px 12px rgba(0, 184, 148, 0.3)';
                    break;
                case 3:
                    nodeBackground = '#fdcb6e';
                    nodeShadow = '0 3px 10px rgba(253, 203, 110, 0.3)';
                    break;
                default:
                    const colors = ['#6c5ce7', '#fd79a8', '#00b894', '#fdcb6e'];
                    const colorIndex = level % colors.length;
                    nodeBackground = colors[colorIndex];
                    nodeShadow = '0 3px 8px rgba(0, 0, 0, 0.15)';
            }
            
            // 设置样式
            nodeElement.style.cssText = `
                position: absolute;
                left: ${position}px;
                top: 50%;
                transform: translateY(-50%) ${withAnimation ? 'scale(0)' : 'scale(1)'};
                width: ${responsiveNodeWidth}px;
                height: ${responsiveNodeHeight}px;
                background: ${nodeBackground};
                border: 1px solid rgba(255, 255, 255, 0.8);
                border-radius: 5px;
                color: #ffffff;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                font-family: "Segoe UI", "Microsoft YaHei", Arial, sans-serif;
                font-weight: 600;
                font-size: ${responsiveFontSize}px;
                text-align: center;
                line-height: 1.3;
                box-shadow: ${nodeShadow};
                transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                cursor: default;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.4);
                opacity: ${withAnimation ? '0' : '1'};
                z-index: 2;
                white-space: pre-line;
                box-sizing: border-box;
            `;
            
            // 设置内容
            const lazyDisplay = lazyValue === 0 ? '-' : `+${lazyValue}`;
            const lazyStyle = lazyValue === 0 ? '' : 'color: #ffeb3b; background: rgba(255, 235, 59, 0.2); border-radius: 3px; padding: 1px 3px; font-weight: bold;';
            
            nodeElement.innerHTML = `
                <div style="font-size: ${responsiveFontSize + 1}px; font-weight: bold; margin-bottom: 2px;">[${start + 1}, ${end + 1}]</div>
                <div style="margin-bottom: 1px; font-size: ${responsiveFontSize}px;">sum: ${sum}</div>
                <div style="margin-bottom: 1px; font-size: ${responsiveFontSize}px;">min: ${minVal}</div>
                <div style="margin-bottom: 1px; font-size: ${responsiveFontSize}px;">max: ${maxVal}</div>
                <div style="margin-bottom: 1px; font-size: ${responsiveFontSize}px; ${lazyStyle}">Laz: ${lazyDisplay}</div>
            `;
            
            // 添加到容器
            levelContainers[level].appendChild(nodeElement);
            
            // 存储引用
            nodeElements.push({
                node: node,
                element: nodeElement,
                start: start,
                end: end,
                level: level,
                position: position
            });            // 动画显示
            if (withAnimation) {
                setTimeout(() => {
                    nodeElement.style.opacity = '1';
                    nodeElement.style.transform = 'translateY(-50%) scale(1)';
                      // 节点动画完成后，如果是非叶子节点，立即绘制连线（此时子节点已存在）
                    if (start !== end) {
                        const timing = getAnimationTiming();
                        setTimeout(() => {
                            drawNodeConnections(node, start, end);
                        }, timing.fade); // 使用配置的淡入时间
                    }
                }, delay);
            }
            
            return nodeElement;
        }        if (withAnimation) {
            // 获取动画时间配置
            const timing = getAnimationTiming();
            
            // 按线段树构建顺序：先创建子节点，再创建父节点
            function animateNodeCreation(node, start, end, delay = 0) {
                if (node >= segmentTree.tree.length) return delay;
                
                let currentDelay = delay;
                
                if (start === end) {
                    // 叶子节点，直接创建
                    const nodeInfo = nodesByLevel.flat().find(n => n.node === node);
                    if (nodeInfo) {
                        createNodeElement(nodeInfo, currentDelay);
                        currentDelay += timing.step;
                    }
                } else {
                    // 内部节点，先创建子节点，再创建自己
                    const mid = Math.floor((start + end) / 2);
                    
                    // 先递归创建左右子树
                    const leftDelay = animateNodeCreation(2 * node, start, mid, currentDelay);
                    const rightDelay = animateNodeCreation(2 * node + 1, mid + 1, end, leftDelay + timing.step);
                    currentDelay = rightDelay;
                    
                    // 再创建当前节点
                    const nodeInfo = nodesByLevel.flat().find(n => n.node === node);
                    if (nodeInfo) {
                        createNodeElement(nodeInfo, currentDelay + timing.step);
                        currentDelay += timing.base;
                    }
                }
                
                return currentDelay;
            }
            
            // 开始递归动画
            animateNodeCreation(1, 0, segmentTree.n - 1, 200);
        } else {
            // 立即创建所有节点
            nodesByLevel.forEach(levelNodes => {
                levelNodes.forEach(nodeInfo => {
                    createNodeElement(nodeInfo, 0);
                });
            });
            
            // 立即绘制所有连线
            setTimeout(() => {
                drawAllConnectingLines();
            }, 100);
        }
        
    }, 300);
}

// 获取动画速度配置
function getAnimationTiming() {
    const speed = window.animationSpeed || 'normal';
    const timings = {
        'slow': { base: 600, step: 300, fade: 400 },
        'normal': { base: 400, step: 200, fade: 300 },
        'fast': { base: 200, step: 100, fade: 150 }
    };
    return timings[speed] || timings['normal'];
}

function initEventListeners() {
    const randomBtn = document.getElementById('btn-random-data');
    const updateBtn = document.getElementById('btn-update-custom-data');
    const inputElement = document.getElementById('input-custom-data');
    const applyBtn = document.getElementById('btn-apply-modification');
    
    if (!randomBtn || !updateBtn || !inputElement || !applyBtn) {
        console.error('某些必需的DOM元素不存在');
        return;
    }
    
    // 随机生成数据按钮
    randomBtn.addEventListener('click', function() {
        const randomData = generateRandomData();
        inputElement.value = randomData;
    });
    
    // 更新可视化按钮 - 使用递归动画
    updateBtn.addEventListener('click', function() {
        const input = inputElement.value.trim();
        
        if (!input) {
            alert('请输入以空格分隔的有效数字。');
            return;
        }
        
        const arr = input.split(/\s+/).map(Number).filter(n => !isNaN(n));
        
        if (arr.length === 0) {
            alert('请输入以空格分隔的有效数字。');
            return;
        }
        
        if (!validateArrayLength(arr)) {
            return;
        }
        
        try {
            segmentTree = new SegmentTree(arr);
            
            if (!treeContainer) {
                setupTreeContainer(); 
            }
            
            updateRangeInputLimits(arr.length);
            adjustContainerSize();
            
            // 使用递归动画显示树
            drawTreeWithAnimation();
        } catch (error) {
            console.error('构建线段树时出错:', error);
            alert('构建线段树时出错，请检查输入数据。');
        }
    });
    
    // 应用修改按钮
    applyBtn.addEventListener('click', function() {
        const left = parseInt(document.getElementById('input-modify-left').value);
        const right = parseInt(document.getElementById('input-modify-right').value);
        const value = parseInt(document.getElementById('input-modify-value').value);

        if (!segmentTree || !currentTreeDisplayed) {
            alert('请先构建并显示树。');
            return;
        }

        if (isNaN(left) || isNaN(right) || isNaN(value)) {
            alert('请输入有效的数字。');
            return;
        }
        
        if (left < 1 || left > segmentTree.n) {
            alert(`左端点必须在 1 到 ${segmentTree.n} 之间。`);
            return;
        }
        
        if (right < 1 || right > segmentTree.n) {
            alert(`右端点必须在 1 到 ${segmentTree.n} 之间。`);
            return;
        }
        
        if (left > right) {
            alert('左端点不能大于右端点。');
            return;
        }
        
        // 高亮受影响的节点
        highlightAffectedNodes(left - 1, right - 1);
          // 转换为0-indexed进行计算
        segmentTree.updateRange(1, 0, segmentTree.n - 1, left - 1, right - 1, value);
        
        // 只更新节点值，保持布局和连线不变
        updateNodeValuesOnly();
    });
      // 主题切换事件
    document.querySelectorAll('.theme-option').forEach(button => {
        button.addEventListener('click', () => {
            if (currentTreeDisplayed) {
                // 只重绘连线以适应新主题，不重新生成整个树
                setTimeout(() => {
                    clearAllLines();
                    setTimeout(drawAllConnectingLines, 100);
                }, 50);
            }
        });
    });
    
    // 初始数据设置 - 仅提供示例数据，不自动构建树
    if (!inputElement.value) {
        const exampleData = "1 3 5 7 2 4 6 8";
        inputElement.value = exampleData;
        console.log('示例数据已设置，等待用户点击更新可视化按钮');
    }
      // 窗口大小变化监听
    window.addEventListener('resize', () => {
        if (segmentTree && currentTreeDisplayed) {
            adjustContainerSize();
            // 使用新的布局调整函数而不是完全重绘
            setTimeout(adjustLayoutOnly, 150);
        }
    });
    
    // 动画速度设置变化监听
    const animSpeedSelect = document.getElementById('animation-speed');
    if (animSpeedSelect) {
        animSpeedSelect.addEventListener('change', () => {
            console.log('动画速度已更新为:', animSpeedSelect.value);
            // 如果当前有显示的树，可以立即体验新的动画速度
            if (currentTreeDisplayed) {
                console.log('下次更新可视化时将使用新的动画速度');
            }
        });
    }
}

// 高亮受影响的节点
function highlightAffectedNodes(left, right) {
    if (!nodeElements || nodeElements.length === 0) return;
    
    nodeElements.forEach(nodeData => {
        const { start, end, element } = nodeData;
        
        if (start <= right && end >= left) {
            element.classList.add('active');
            
            setTimeout(() => {
                element.classList.remove('active');
            }, 600);
        }
    });
}

// 绘制单个节点的连线
function drawNodeConnections(node, start, end) {
    if (!treeContainer || start === end) return; // 叶子节点无需连线
    
    // 确保有SVG容器
    let svg = treeContainer.querySelector('svg.connection-lines');
    if (!svg) {
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('connection-lines');
        svg.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        `;
        treeContainer.appendChild(svg);
    }
    
    // 检测当前主题
    const isDarkTheme = document.body.classList.contains('dark');
    const isEyeCareTheme = document.body.classList.contains('eye-care');
    
    let lineColor;
    if (isDarkTheme) {
        lineColor = 'rgba(255, 255, 255, 0.8)';
    } else if (isEyeCareTheme) {
        lineColor = 'rgba(74, 85, 104, 0.9)';
    } else {
        lineColor = 'rgba(74, 85, 104, 0.8)';
    }
    
    // 找到当前节点
    const parentNodeData = nodeElements.find(n => n.node === node);
    if (!parentNodeData) return;
    
    const leftChildNode = 2 * node;
    const rightChildNode = 2 * node + 1;
    
    // 找到子节点元素
    const leftChild = nodeElements.find(n => n.node === leftChildNode);
    const rightChild = nodeElements.find(n => n.node === rightChildNode);    // 获取容器的位置
    const containerRect = treeContainer.getBoundingClientRect();    // 获取父节点的准确位置
    const parentRect = parentNodeData.element.getBoundingClientRect();
    const parentCenterX = parentRect.left - containerRect.left + parentRect.width / 2;
    // 父节点底边：让连线稍微穿透边框，视觉效果更自然
    const parentBottomY = parentRect.bottom - containerRect.top + 1;
    
    // 绘制到左子节点的连线
    if (leftChild && leftChild.element) {
        const childRect = leftChild.element.getBoundingClientRect();
        const childCenterX = childRect.left - containerRect.left + childRect.width / 2;
        // 子节点顶边：让连线稍微穿透边框，视觉效果更自然
        const childTopY = childRect.top - containerRect.top - 1;
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', parentCenterX);
        line.setAttribute('y1', parentBottomY);
        line.setAttribute('x2', childCenterX);
        line.setAttribute('y2', childTopY);
        line.setAttribute('stroke', lineColor);
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-linecap', 'round');
        line.style.opacity = '0';
        line.style.transition = 'opacity 0.3s ease';
        line.classList.add(`line-${node}-${leftChildNode}`);
        
        svg.appendChild(line);
        
        // 延迟显示连线
        const timing = getAnimationTiming();
        setTimeout(() => {
            line.style.opacity = '1';
        }, timing.fade / 4);
    }    // 绘制到右子节点的连线
    if (rightChild && rightChild.element) {
        const childRect = rightChild.element.getBoundingClientRect();
        const childCenterX = childRect.left - containerRect.left + childRect.width / 2;
        // 子节点顶边：让连线稍微穿透边框，视觉效果更自然
        const childTopY = childRect.top - containerRect.top - 1;
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', parentCenterX);
        line.setAttribute('y1', parentBottomY);
        line.setAttribute('x2', childCenterX);
        line.setAttribute('y2', childTopY);
        line.setAttribute('stroke', lineColor);
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-linecap', 'round');
        line.style.opacity = '0';
        line.style.transition = 'opacity 0.3s ease';
        line.classList.add(`line-${node}-${rightChildNode}`);
        
        svg.appendChild(line);
        
        // 延迟显示连线
        const timing = getAnimationTiming();
        setTimeout(() => {
            line.style.opacity = '1';
        }, timing.fade / 2);
    }
}

// 绘制所有连接线（用于立即显示模式和重绘）
function drawAllConnectingLines() {
    if (!treeContainer || !nodeElements || nodeElements.length === 0) return;
    
    // 确保有SVG容器
    let svg = treeContainer.querySelector('svg.connection-lines');
    if (!svg) {
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('connection-lines');
        svg.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        `;
        treeContainer.appendChild(svg);
    }
    
    // 检测当前主题
    const isDarkTheme = document.body.classList.contains('dark');
    const isEyeCareTheme = document.body.classList.contains('eye-care');
    
    let lineColor;
    if (isDarkTheme) {
        lineColor = 'rgba(255, 255, 255, 0.8)';
    } else if (isEyeCareTheme) {
        lineColor = 'rgba(74, 85, 104, 0.9)';
    } else {
        lineColor = 'rgba(74, 85, 104, 0.8)';
    }
    
    // 为每个非叶子节点绘制连线
    nodeElements.forEach(nodeData => {
        const { node, start, end, element } = nodeData;
        
        // 跳过叶子节点
        if (start === end) return;
        
        const leftChildNode = 2 * node;
        const rightChildNode = 2 * node + 1;
        
        // 找到子节点元素
        const leftChild = nodeElements.find(n => n.node === leftChildNode);        // 获取容器的位置
        const containerRect = treeContainer.getBoundingClientRect();        // 获取父节点的准确位置
        const parentRect = element.getBoundingClientRect();
        const parentCenterX = parentRect.left - containerRect.left + parentRect.width / 2;
        // 父节点底边：让连线稍微穿透边框，视觉效果更自然
        const parentBottomY = parentRect.bottom - containerRect.top + 1;
        
        // 绘制到左子节点的连线
        if (leftChild && leftChild.element) {
            // 检查是否已存在这条连线
            const existingLine = svg.querySelector(`.line-${node}-${leftChildNode}`);
            if (!existingLine) {                const childRect = leftChild.element.getBoundingClientRect();
                const childCenterX = childRect.left - containerRect.left + childRect.width / 2;
                // 子节点顶边：让连线稍微穿透边框，视觉效果更自然
                const childTopY = childRect.top - containerRect.top - 1;
                
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', parentCenterX);
                line.setAttribute('y1', parentBottomY);
                line.setAttribute('x2', childCenterX);
                line.setAttribute('y2', childTopY);
                line.setAttribute('stroke', lineColor);
                line.setAttribute('stroke-width', '2');
                line.setAttribute('stroke-linecap', 'round');
                line.style.opacity = '1';
                line.classList.add(`line-${node}-${leftChildNode}`);
                
                svg.appendChild(line);
            }
        }
        
        // 绘制到右子节点的连线
        if (rightChild && rightChild.element) {
            // 检查是否已存在这条连线
            const existingLine = svg.querySelector(`.line-${node}-${rightChildNode}`);
            if (!existingLine) {                const childRect = rightChild.element.getBoundingClientRect();
                const childCenterX = childRect.left - containerRect.left + childRect.width / 2;
                // 子节点顶边：让连线稍微穿透边框，视觉效果更自然
                const childTopY = childRect.top - containerRect.top - 1;
                
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', parentCenterX);
                line.setAttribute('y1', parentBottomY);
                line.setAttribute('x2', childCenterX);
                line.setAttribute('y2', childTopY);
                line.setAttribute('stroke', lineColor);
                line.setAttribute('stroke-width', '2');
                line.setAttribute('stroke-linecap', 'round');
                line.style.opacity = '1';
                line.classList.add(`line-${node}-${rightChildNode}`);
                
                svg.appendChild(line);
            }
        }
    });
}

// 清理所有连接线
function clearAllLines() {
    const svg = treeContainer?.querySelector('svg.connection-lines');
    if (svg) {
        // 淡出效果
        svg.style.transition = 'opacity 0.3s ease';
        svg.style.opacity = '0';
        setTimeout(() => {
            svg.remove();
        }, 300);
    }
}

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    setupTreeContainer();
    initEventListeners();
});

// 调整布局而不重新生成（用于窗口resize等场景）
function adjustLayoutOnly() {
    if (!treeContainer || !segmentTree || !nodeElements || nodeElements.length === 0) return;
    
    // 重新计算响应式参数
    const screenWidth = window.innerWidth;
    let responsiveNodeWidth = 120;
    let responsiveNodeHeight = 110;
    const levelHeight = 140;
    
    if (screenWidth <= 480) {
        responsiveNodeWidth = 80;
        responsiveNodeHeight = 85;
    } else if (screenWidth <= 768) {
        responsiveNodeWidth = 95;
        responsiveNodeHeight = 95;
    }
    
    // 重新计算布局
    const containerWidth = treeContainer.clientWidth - 40;
    const leafNodes = nodeElements.filter(n => n.start === n.end);
    const nodeSpacing = Math.max(10, (containerWidth - leafNodes.length * responsiveNodeWidth) / (leafNodes.length + 1));
    
    // 重新计算节点位置
    const positions = new Map();
    
    // 先布局叶子节点
    leafNodes.forEach((leaf, index) => {
        const x = nodeSpacing + index * (responsiveNodeWidth + nodeSpacing);
        positions.set(leaf.node, x);
    });
    
    // 自底向上计算内部节点位置
    const nodesByLevel = [];
    nodeElements.forEach(nodeData => {
        while (nodesByLevel.length <= nodeData.level) {
            nodesByLevel.push([]);
        }
        nodesByLevel[nodeData.level].push(nodeData);
    });
    
    for (let level = nodesByLevel.length - 2; level >= 0; level--) {
        nodesByLevel[level].forEach(nodeData => {
            const { node, start, end } = nodeData;
            const mid = Math.floor((start + end) / 2);
            
            const leftChild = positions.get(2 * node);
            const rightChild = positions.get(2 * node + 1);
            
            if (leftChild !== undefined && rightChild !== undefined) {
                positions.set(node, (leftChild + rightChild) / 2);
            } else if (leftChild !== undefined) {
                positions.set(node, leftChild);
            } else if (rightChild !== undefined) {
                positions.set(node, rightChild);
            }
        });
    }
    
    // 更新节点位置
    nodeElements.forEach(nodeData => {
        const position = positions.get(nodeData.node);
        if (position !== undefined && nodeData.element) {
            nodeData.element.style.left = `${position}px`;
            nodeData.element.style.width = `${responsiveNodeWidth}px`;
            nodeData.element.style.height = `${responsiveNodeHeight}px`;
            nodeData.position = position;
        }
    });
    
    // 清除旧连线并重绘
    clearAllLines();
    setTimeout(() => {
        drawAllConnectingLines();
    }, 100);
}

// 只更新节点内容而不重新布局（用于应用修改等场景）
function updateNodeValuesOnly() {
    if (!segmentTree || !nodeElements || nodeElements.length === 0) return;
    
    nodeElements.forEach(nodeData => {
        const { node, start, end, element } = nodeData;
        
        // 获取更新后的节点值
        const sum = segmentTree.tree[node];
        const minVal = segmentTree.minTree[node];
        const maxVal = segmentTree.maxTree[node];
        const lazyValue = segmentTree.lazy[node];
        
        // 更新节点内容
        const responsiveFontSize = element.style.fontSize ? parseInt(element.style.fontSize) : 13;
        const lazyDisplay = lazyValue === 0 ? '-' : `+${lazyValue}`;
        const lazyStyle = lazyValue === 0 ? '' : 'color: #ffeb3b; background: rgba(255, 235, 59, 0.2); border-radius: 3px; padding: 1px 3px; font-weight: bold;';
        
        element.innerHTML = `
            <div style="font-size: ${responsiveFontSize + 1}px; font-weight: bold; margin-bottom: 2px;">[${start + 1}, ${end + 1}]</div>
            <div style="margin-bottom: 1px; font-size: ${responsiveFontSize}px;">sum: ${sum}</div>
            <div style="margin-bottom: 1px; font-size: ${responsiveFontSize}px;">min: ${minVal}</div>
            <div style="margin-bottom: 1px; font-size: ${responsiveFontSize}px;">max: ${maxVal}</div>
            <div style="margin-bottom: 1px; font-size: ${responsiveFontSize}px; ${lazyStyle}">Laz: ${lazyDisplay}</div>
        `;
    });
}

// 获取节点的精确位置信息
function getNodePosition(nodeData) {
    const element = nodeData.element;
    const offsetLeft = parseFloat(element.style.left) || 0;
    const width = parseFloat(element.style.width) || 120;
    const height = parseFloat(element.style.height) || 110;
    
    // 根据响应式设计计算层级高度
    const screenWidth = window.innerWidth;
    let levelHeight = 150;
    let topOffset = 120;
    
    if (screenWidth <= 480) {
        levelHeight = 130;
        topOffset = 100;
    } else if (screenWidth <= 768) {
        levelHeight = 140;
        topOffset = 110;
    }
    
    return {
        centerX: offsetLeft + width / 2,
        topY: nodeData.level * levelHeight + topOffset,
        bottomY: nodeData.level * levelHeight + topOffset + height,
        width: width,
        height: height
    };
}
