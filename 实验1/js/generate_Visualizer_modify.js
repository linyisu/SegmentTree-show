// 线段树实现
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
        console.error('未找到树容器元素（ID: custom-tree-visualizer-host）');
        alert('未找到树容器元素，请确保HTML中包含ID为custom-tree-visualizer-host的div');
        return false;
    }
    
    treeContainer.style.cssText = `
        width: 100%;
        min-height: 200px;
        padding: 20px;
        box-sizing: border-box;
        overflow: visible;
        position: relative;
        margin: 20px auto;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
    `;
    
    console.log('树容器已设置');
    return true;
}

function adjustContainerSize() {
    if (!treeContainer || !segmentTree) {
        console.warn('调整容器大小时，treeContainer或segmentTree未定义');
        return;
    }
    
    const screenWidth = window.innerWidth;
    const levels = Math.ceil(Math.log2(segmentTree.n)) + 1;
    const estimatedHeight = levels * 160 + 100;
    treeContainer.style.minHeight = `${Math.max(200, estimatedHeight)}px`;
    
    if (screenWidth <= 768) {
        treeContainer.style.padding = '10px';
    } else {
        treeContainer.style.padding = '20px';
    }
}

function generateRandomData() {
    const length = Math.floor(Math.random() * 6) + 3;
    const data = [];
    for (let i = 0; i < length; i++) {
        data.push(Math.floor(Math.random() * 10) + 1);
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
    } else {
        console.warn('未找到范围输入元素');
    }
}

function drawTree() {
    if (!treeContainer || !segmentTree) {
        console.error('drawTree: treeContainer或segmentTree未定义');
        return;
    }
    
    isAnimating = true;
    createTreeNodes(false);
    isAnimating = false;
}

function drawTreeWithAnimation() {
    if (!treeContainer || !segmentTree) {
        console.error('drawTreeWithAnimation: treeContainer或segmentTree未定义');
        return;
    }
    
    isAnimating = true;
    currentTreeDisplayed = true;
    createTreeNodes(true);
    isAnimating = false;
}

function createTreeNodes(withAnimation = false) {
    if (!treeContainer) {
        console.error('createTreeNodes: treeContainer未定义');
        return;
    }
    
    const existingNodes = treeContainer.querySelectorAll('.tree-node, .connection-line');
    existingNodes.forEach(node => {
        node.style.opacity = '0';
        node.style.transform = 'scale(0.8)';
        if (node.classList.contains('active')) {
            node.classList.remove('active');
        }
    });
    
    setTimeout(() => {
        treeContainer.innerHTML = '';
        nodeElements = [];
        
        const screenWidth = window.innerWidth;
        let responsiveNodeWidth = 120;
        let responsiveNodeHeight = 110;
        let responsiveFontSize = 13;
        const levelHeight = 160;
        
        if (screenWidth <= 480) {
            responsiveNodeWidth = 80;
            responsiveNodeHeight = 85;
            responsiveFontSize = 10;
        } else if (screenWidth <= 768) {
            responsiveNodeWidth = 95;
            responsiveNodeHeight = 95;
            responsiveFontSize = 11;
        }
        
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
        
        const containerWidth = treeContainer.clientWidth - 40;
        const nodeSpacing = Math.max(10, (containerWidth - leafNodes.length * responsiveNodeWidth) / (leafNodes.length + 1));
        
        treeContainer.style.height = `${nodesByLevel.length * levelHeight + 40}px`;
        
        const levelContainers = [];
        for (let i = 0; i < nodesByLevel.length; i++) {
            const levelContainer = document.createElement('div');
            levelContainer.style.cssText = `
                position: relative;
                width: 100%;
                height: ${levelHeight}px;
                margin-bottom: 10px;
                overflow: visible;
            `;
            treeContainer.appendChild(levelContainer);
            levelContainers.push(levelContainer);
        }
        
        function calculatePositions() {
            const positions = new Map();
            
            leafNodes.forEach((leaf, index) => {
                const x = nodeSpacing + index * (responsiveNodeWidth + nodeSpacing);
                positions.set(leaf.node, x);
            });
            
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
        
        function createNodeElement(nodeInfo, delay = 0) {
            const { node, start, end, level } = nodeInfo;
            const position = positions.get(node);
            
            const sum = segmentTree.tree[node];
            const minVal = segmentTree.minTree[node];
            const maxVal = segmentTree.maxTree[node];
            const lazyValue = segmentTree.lazy[node];
            
            const nodeWrapper = document.createElement('div');
            nodeWrapper.style.cssText = `
                position: absolute;
                left: ${position}px;
                top: 10px;
                width: ${responsiveNodeWidth}px;
                height: ${responsiveNodeHeight}px;
                overflow: visible;
                z-index: 2;
            `;
            
            const nodeElement = document.createElement('div');
            nodeElement.className = `tree-node depth-${level}`;
            
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
            
            nodeElement.style.cssText = `
                width: 100%;
                height: 100%;
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
                transform: ${withAnimation ? 'scale(0)' : 'scale(1)'};
                z-index: 2;
                box-sizing: border-box;
                overflow: visible;
            `;
            
            const lazyDisplay = lazyValue === 0 ? '-' : `+${lazyValue}`;
            const lazyStyle = lazyValue === 0 ? '' : 'color: #ffeb3b; background: rgba(255, 235, 59, 0.2); border-radius: 3px; padding: 1px 3px; font-weight: bold;';
            
            nodeElement.innerHTML = `
                <div style="font-size: ${responsiveFontSize + 1}px; font-weight: bold; margin-bottom: 2px;">[${start + 1}, ${end + 1}]</div>
                <div style="margin-bottom: 1px; font-size: ${responsiveFontSize}px;">sum: ${sum}</div>
                <div style="margin-bottom: 1px; font-size: ${responsiveFontSize}px;">min: ${minVal}</div>
                <div style="margin-bottom: 1px; font-size: ${responsiveFontSize}px;">max: ${maxVal}</div>
                <div style="margin-bottom: 1px; font-size: ${responsiveFontSize}px; ${lazyStyle}">Laz: ${lazyDisplay}</div>
            `;
            
            nodeWrapper.appendChild(nodeElement);
            levelContainers[level].appendChild(nodeWrapper);
            
            nodeElements.push({
                node: node,
                element: nodeElement,
                wrapper: nodeWrapper,
                start: start,
                end: end,
                level: level,
                position: position
            });
            
            console.log(`创建节点 ${node}，位置: left=${position}px, 尺寸: ${responsiveNodeWidth}x${responsiveNodeHeight}`);
            
            if (withAnimation) {
                setTimeout(() => {
                    nodeElement.style.opacity = '1';
                    nodeElement.style.transform = 'scale(1)';
                    if (start !== end) {
                        const timing = getAnimationTiming();
                        setTimeout(() => {
                            drawNodeConnections(node, start, end);
                        }, timing.fade);
                    }
                }, delay);
            }
            
            return nodeElement;
        }
        
        if (withAnimation) {
            const timing = getAnimationTiming();
            
            function animateNodeCreation(node, start, end, delay = 0) {
                if (node >= segmentTree.tree.length) return delay;
                
                let currentDelay = delay;
                
                if (start === end) {
                    const nodeInfo = nodesByLevel.flat().find(n => n.node === node);
                    if (nodeInfo) {
                        createNodeElement(nodeInfo, currentDelay);
                        currentDelay += timing.step;
                    }
                } else {
                    const mid = Math.floor((start + end) / 2);
                    const leftDelay = animateNodeCreation(2 * node, start, mid, currentDelay);
                    const rightDelay = animateNodeCreation(2 * node + 1, mid + 1, end, leftDelay + timing.step);
                    currentDelay = rightDelay;
                    const nodeInfo = nodesByLevel.flat().find(n => n.node === node);
                    if (nodeInfo) {
                        createNodeElement(nodeInfo, currentDelay + timing.step);
                        currentDelay += timing.base;
                    }
                }
                
                return currentDelay;
            }
            
            animateNodeCreation(1, 0, segmentTree.n - 1, 200);
        } else {
            nodesByLevel.forEach(levelNodes => {
                levelNodes.forEach(nodeInfo => {
                    createNodeElement(nodeInfo, 0);
                });
            });
            
            setTimeout(() => {
                drawAllConnectingLines();
            }, 100);
        }
    }, 300);
}

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
        alert('缺少必要的输入元素，请检查HTML结构');
        return;
    }
    
    randomBtn.addEventListener('click', function() {
        const randomData = generateRandomData();
        inputElement.value = randomData;
    });
    
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
            
            if (!treeContainer && !setupTreeContainer()) {
                return;
            }
            
            updateRangeInputLimits(arr.length);
            adjustContainerSize();
            
            drawTreeWithAnimation();
        } catch (error) {
            console.error('构建线段树时出错:', error);
            alert('构建线段树时出错，请检查输入数据。');
        }
    });
    
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
        
        highlightAffectedNodes(left - 1, right - 1);
        segmentTree.updateRange(1, 0, segmentTree.n - 1, left - 1, right - 1, value);
        updateNodeValuesOnly();
    });
    
    document.querySelectorAll('.theme-option').forEach(button => {
        button.addEventListener('click', () => {
            if (currentTreeDisplayed) {
                setTimeout(() => {
                    clearAllLines();
                    setTimeout(drawAllConnectingLines, 100);
                }, 50);
            }
        });
    });
    
    if (!inputElement.value) {
        const exampleData = "1 3 5 7 2 4 6 8";
        inputElement.value = exampleData;
        console.log('示例数据已设置，等待用户点击更新可视化按钮');
    }
    
    window.addEventListener('resize', () => {
        if (segmentTree && currentTreeDisplayed) {
            adjustContainerSize();
            setTimeout(adjustLayoutOnly, 150);
        }
    });
    
    const animSpeedSelect = document.getElementById('animation-speed');
    if (animSpeedSelect) {
        animSpeedSelect.addEventListener('change', () => {
            console.log('动画速度已更新为:', animSpeedSelect.value);
            if (currentTreeDisplayed) {
                console.log('下次更新可视化时将使用新的动画速度');
            }
        });
    }
}

function highlightAffectedNodes(left, right) {
    if (!nodeElements || nodeElements.length === 0) return;
    
    nodeElements.forEach(nodeData => {
        nodeData.element.classList.remove('active');
    });
    
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

function drawNodeConnections(node, start, end) {
    if (!treeContainer || start === end) return;
    
    const parentNodeData = nodeElements.find(n => n.node === node);
    if (!parentNodeData || !parentNodeData.element || !parentNodeData.wrapper) return;
    
    const containerRect = treeContainer.getBoundingClientRect();
    const parentRect = parentNodeData.element.getBoundingClientRect();
    const parentOffsetY = parentNodeData.level * 160; // 基于层级高度
    
    const leftChildNode = 2 * node;
    const rightChildNode = 2 * node + 1;
    
    const leftChild = nodeElements.find(n => n.node === leftChildNode);
    const rightChild = nodeElements.find(n => n.node === rightChildNode);
    
    const isDarkTheme = document.body.classList.contains('dark');
    const isEyeCareTheme = document.body.classList.contains('eye-care');
    let lineColor = isDarkTheme ? 'rgba(255, 255, 255, 0.8)' : 
                    isEyeCareTheme ? 'rgba(74, 85, 104, 0.9)' : 
                    'rgba(74, 85, 104, 0.8)';
    
    if (leftChild && leftChild.element) {
        const childRect = leftChild.element.getBoundingClientRect();
        
        const parentCenterX = parentRect.left - containerRect.left + parentRect.width / 2;
        const parentBottomY = parentRect.top - containerRect.top + parentRect.height + parentOffsetY;
        const childCenterX = childRect.left - containerRect.left + childRect.width / 2;
        const childTopY = childRect.top - containerRect.top + (leftChild.level * 160);
        
        const line = document.createElement('div');
        line.className = `connection-line line-${node}-${leftChildNode}`;
        
        const dx = childCenterX - parentCenterX;
        const dy = childTopY - parentBottomY;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        line.style.cssText = `
            position: absolute;
            width: ${length}px;
            height: 2px;
            background: ${lineColor};
            transform: rotate(${angle}deg);
            transform-origin: 0 0;
            left: ${parentCenterX}px;
            top: ${parentBottomY}px;
            opacity: 0;
            transition: opacity 0.3s ease, width 0.3s ease, left 0.3s ease, top 0.3s ease, transform 0.3s ease;
            z-index: 1;
            box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
        `;
        
        parentNodeData.wrapper.appendChild(line);
        
        const timing = getAnimationTiming();
        setTimeout(() => {
            line.style.opacity = '1';
        }, timing.fade / 4);
        
        console.log(`绘制连线 ${node} -> ${leftChildNode}, 长度: ${length}px, 角度: ${angle}deg, 起点: (${parentCenterX}, ${parentBottomY}), 终点: (${childCenterX}, ${childTopY})`);
    }
    
    if (rightChild && rightChild.element) {
        const childRect = rightChild.element.getBoundingClientRect();
        
        const parentCenterX = parentRect.left - containerRect.left + parentRect.width / 2;
        const parentBottomY = parentRect.top - containerRect.top + parentRect.height + parentOffsetY;
        const childCenterX = childRect.left - containerRect.left + childRect.width / 2;
        const childTopY = childRect.top - containerRect.top + (rightChild.level * 160);
        
        const line = document.createElement('div');
        line.className = `connection-line line-${node}-${rightChildNode}`;
        
        const dx = childCenterX - parentCenterX;
        const dy = childTopY - parentBottomY;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        line.style.cssText = `
            position: absolute;
            width: ${length}px;
            height: 2px;
            background: ${lineColor};
            transform: rotate(${angle}deg);
            transform-origin: 0 0;
            left: ${parentCenterX}px;
            top: ${parentBottomY}px;
            opacity: 0;
            transition: opacity 0.3s ease, width 0.3s ease, left 0.3s ease, top 0.3s ease, transform 0.3s ease;
            z-index: 1;
            box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
        `;
        
        parentNodeData.wrapper.appendChild(line);
        
        const timing = getAnimationTiming();
        setTimeout(() => {
            line.style.opacity = '1';
        }, timing.fade / 2);
        
        console.log(`绘制连线 ${node} -> ${rightChildNode}, 长度: ${length}px, 角度: ${angle}deg, 起点: (${parentCenterX}, ${parentBottomY}), 终点: (${childCenterX}, ${childTopY})`);
    }
}

function drawAllConnectingLines() {
    if (!treeContainer || !nodeElements || nodeElements.length === 0) return;
    
    clearAllLines();
    
    const isDarkTheme = document.body.classList.contains('dark');
    const isEyeCareTheme = document.body.classList.contains('eye-care');
    let lineColor = isDarkTheme ? 'rgba(255, 255, 255, 0.8)' : 
                    isEyeCareTheme ? 'rgba(74, 85, 104, 0.9)' : 
                    'rgba(74, 85, 104, 0.8)';
    
    nodeElements.forEach(nodeData => {
        const { node, start, end, element, wrapper } = nodeData;
        
        if (start === end) return;
        
        const leftChildNode = 2 * node;
        const rightChildNode = 2 * node + 1;
        
        const leftChild = nodeElements.find(n => n.node === leftChildNode);
        const rightChild = nodeElements.find(n => n.node === rightChildNode);
        
        const containerRect = treeContainer.getBoundingClientRect();
        const parentRect = element.getBoundingClientRect();
        const parentOffsetY = nodeData.level * 160;
        
        if (leftChild && leftChild.element) {
            const childRect = leftChild.element.getBoundingClientRect();
            
            const parentCenterX = parentRect.left - containerRect.left + parentRect.width / 2;
            const parentBottomY = parentRect.top - containerRect.top + parentRect.height + parentOffsetY;
            const childCenterX = childRect.left - containerRect.left + childRect.width / 2;
            const childTopY = childRect.top - containerRect.top + (leftChild.level * 160);
            
            const line = document.createElement('div');
            line.className = `connection-line line-${node}-${leftChildNode}`;
            
            const dx = childCenterX - parentCenterX;
            const dy = childTopY - parentBottomY;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            
            line.style.cssText = `
                position: absolute;
                width: ${length}px;
                height: 2px;
                background: ${lineColor};
                transform: rotate(${angle}deg);
                transform-origin: 0 0;
                left: ${parentCenterX}px;
                top: ${parentBottomY}px;
                opacity: 1;
                transition: opacity 0.3s ease, width 0.3s ease, left 0.3s ease, top 0.3s ease, transform 0.3s ease;
                z-index: 1;
                box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
            `;
            
            wrapper.appendChild(line);
        }
        
        if (rightChild && rightChild.element) {
            const childRect = rightChild.element.getBoundingClientRect();
            
            const parentCenterX = parentRect.left - containerRect.left + parentRect.width / 2;
            const parentBottomY = parentRect.top - containerRect.top + parentRect.height + parentOffsetY;
            const childCenterX = childRect.left - containerRect.left + childRect.width / 2;
            const childTopY = childRect.top - containerRect.top + (rightChild.level * 160);
            
            const line = document.createElement('div');
            line.className = `connection-line line-${node}-${rightChildNode}`;
            
            const dx = childCenterX - parentCenterX;
            const dy = childTopY - parentBottomY;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            
            line.style.cssText = `
                position: absolute;
                width: ${length}px;
                height: 2px;
                background: ${lineColor};
                transform: rotate(${angle}deg);
                transform-origin: 0 0;
                left: ${parentCenterX}px;
                top: ${parentBottomY}px;
                opacity: 1;
                transition: opacity 0.3s ease, width 0.3s ease, left 0.3s ease, top 0.3s ease, transform 0.3s ease;
                z-index: 1;
                box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
            `;
            
            wrapper.appendChild(line);
        }
    });
}

function clearAllLines() {
    const lines = treeContainer?.querySelectorAll('.connection-line');
    if (lines) {
        lines.forEach(line => {
            line.style.transition = 'opacity 0.3s ease';
            line.style.opacity = '0';
            setTimeout(() => {
                line.remove();
            }, 300);
        });
    }
}

function adjustLayoutOnly() {
    if (!treeContainer || !segmentTree || !nodeElements || nodeElements.length === 0) return;
    
    const screenWidth = window.innerWidth;
    let responsiveNodeWidth = 120;
    let responsiveNodeHeight = 110;
    let responsiveFontSize = 13;
    
    if (screenWidth <= 480) {
        responsiveNodeWidth = 80;
        responsiveNodeHeight = 85;
        responsiveFontSize = 10;
    } else if (screenWidth <= 768) {
        responsiveNodeWidth = 95;
        responsiveNodeHeight = 95;
        responsiveFontSize = 11;
    }
    
    const containerWidth = treeContainer.clientWidth - 40;
    const leafNodes = nodeElements.filter(n => n.start === n.end);
    const nodeSpacing = Math.max(10, (containerWidth - leafNodes.length * responsiveNodeWidth) / (leafNodes.length + 1));
    
    const positions = new Map();
    
    leafNodes.forEach((leaf, index) => {
        const x = nodeSpacing + index * (responsiveNodeWidth + nodeSpacing);
        positions.set(leaf.node, x);
    });
    
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
    
    nodeElements.forEach(nodeData => {
        const position = positions.get(nodeData.node);
        if (position !== undefined && nodeData.wrapper) {
            nodeData.wrapper.style.left = `${position}px`;
            nodeData.wrapper.style.width = `${responsiveNodeWidth}px`;
            nodeData.wrapper.style.height = `${responsiveNodeHeight}px`;
            nodeData.element.style.width = `${responsiveNodeWidth}px`;
            nodeData.element.style.height = `${responsiveNodeHeight}px`;
            nodeData.element.style.fontSize = `${responsiveFontSize}px`;
            nodeData.position = position;
            
            const lazyValue = segmentTree.lazy[nodeData.node];
            const lazyDisplay = lazyValue === 0 ? '-' : `+${lazyValue}`;
            const lazyStyle = lazyValue === 0 ? '' : 'color: #ffeb3b; background: rgba(255, 235, 59, 0.2); border-radius: 3px; padding: 1px 3px; font-weight: bold;';
            
            nodeData.element.innerHTML = `
                <div style="font-size: ${responsiveFontSize + 1}px; font-weight: bold; margin-bottom: 2px;">[${nodeData.start + 1}, ${nodeData.end + 1}]</div>
                <div style="margin-bottom: 1px; font-size: ${responsiveFontSize}px;">sum: ${segmentTree.tree[nodeData.node]}</div>
                <div style="margin-bottom: 1px; font-size: ${responsiveFontSize}px;">min: ${segmentTree.minTree[nodeData.node]}</div>
                <div style="margin-bottom: 1px; font-size: ${responsiveFontSize}px;">max: ${segmentTree.maxTree[nodeData.node]}</div>
                <div style="margin-bottom: 1px; font-size: ${responsiveFontSize}px; ${lazyStyle}">Laz: ${lazyDisplay}</div>
            `;
        }
    });
    
    setTimeout(() => {
        drawAllConnectingLines();
    }, 100);
}

function updateNodeValuesOnly() {
    if (!segmentTree || !nodeElements || nodeElements.length === 0) return;
    
    nodeElements.forEach(nodeData => {
        const { node, start, end, element } = nodeData;
        
        const sum = segmentTree.tree[node];
        const minVal = segmentTree.minTree[node];
        const maxVal = segmentTree.maxTree[node];
        const lazyValue = segmentTree.lazy[node];
        
        const responsiveFontSize = parseInt(element.style.fontSize) || 13;
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

document.addEventListener('DOMContentLoaded', () => {
    if (setupTreeContainer()) {
        initEventListeners();
    }
});