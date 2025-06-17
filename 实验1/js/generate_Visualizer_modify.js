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
    // 如果当前区间与修改区间没有交集，直接返回
    if (start > r || end < l) return;

    // 如果当前区间完全被修改区间覆盖，直接累加懒标记并返回
    if (l <= start && end <= r) {
        this.lazy[node] += val;
        this.tree[node] += (end - start + 1) * val;
        this.minTree[node] += val;
        this.maxTree[node] += val;
        return;
    }

    // 只有在需要访问子节点时，才下推懒标记
    this.pushDown(node, start, end);
    
    // 递归更新子节点
    const mid = Math.floor((start + end) / 2);
    this.updateRange(2 * node, start, mid, l, r, val);
    this.updateRange(2 * node + 1, mid + 1, end, l, r, val);
    
    // 更新当前节点
    this.pushUp(node);
};

SegmentTree.prototype.pushDown = function(node, start, end) {
    if (this.lazy[node] !== 0) {
        this.tree[node] += (end - start + 1) * this.lazy[node];
        this.minTree[node] += this.lazy[node];
        this.maxTree[node] += this.lazy[node];
        if (start !== end) {
            this.lazy[2 * node] += this.lazy[node];
            this.lazy[2 * node + 1] += this.lazy[node];
        }
        this.lazy[node] = 0;
    }
};

SegmentTree.prototype.pushUp = function(node) {
    // 确保子节点的信息是最新的（考虑懒标记）
    const leftChild = 2 * node;
    const rightChild = 2 * node + 1;
    
    // 获取左子节点的实际值
    let leftSum = this.tree[leftChild];
    let leftMin = this.minTree[leftChild];
    let leftMax = this.maxTree[leftChild];
    
    // 获取右子节点的实际值
    let rightSum = this.tree[rightChild];
    let rightMin = this.minTree[rightChild];
    let rightMax = this.maxTree[rightChild];
    
    // 合并子节点信息
    this.tree[node] = leftSum + rightSum;
    this.minTree[node] = Math.min(leftMin, rightMin);
    this.maxTree[node] = Math.max(leftMax, rightMax);
};

SegmentTree.prototype.querySum = function(l, r) {
    return this.query(1, 0, this.n - 1, l, r);
};

SegmentTree.prototype.query = function(node, start, end, l, r) {
    if (this.lazy[node] !== 0) {
        this.tree[node] += (end - start + 1) * this.lazy[node];
        if (start !== end) {
            this.lazy[2 * node] += this.lazy[node];
            this.lazy[2 * node + 1] += this.lazy[node];
        }
        this.lazy[node] = 0;
    }

    if (start > r || end < l) return 0;
    if (l <= start && end <= r) return this.tree[node];

    const mid = Math.floor((start + end) / 2);
    return this.query(2 * node, start, mid, l, r) +
           this.query(2 * node + 1, mid + 1, end, l, r);
};

let segmentTree = null;
let treeContainer = null;
let nodeElements = []; // Store DOM elements of all nodes
let isAnimating = false; // Track if animation is in progress

function setupTreeContainer() {
    // Use the existing custom-tree-visualizer-host div from HTML
    let container = document.getElementById('custom-tree-visualizer-host');
    
    if (!container) {
        // Fallback: create container if not found
        container = document.createElement('div');
        container.id = 'custom-tree-visualizer-host';
        const inputContainer = document.querySelector('.data-input-container');
        if (inputContainer) {
            inputContainer.appendChild(container);
        } else {
            document.body.appendChild(container);
        }
    }
    
    // Clear any existing content
    container.innerHTML = '';
    
    // Create tree container with flexbox layout
    treeContainer = document.createElement('div');
    treeContainer.id = 'tree-container';
    treeContainer.style.cssText = `
        position: relative;
        width: 100%;
        min-height: 200px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        padding: 20px;
        box-sizing: border-box;
    `;
    container.appendChild(treeContainer);
    
    adjustContainerSize();
}

function adjustContainerSize() {
    if (!treeContainer) return;
    
    // 根据是否有线段树来调整高度
    if (segmentTree && segmentTree.n > 0) {
        const levels = Math.ceil(Math.log2(segmentTree.n)) + 1;
        const height = Math.max(450, levels * 150 + 100); // 增加高度以适应新的节点尺寸
        treeContainer.style.minHeight = height + 'px';
    } else {
        treeContainer.style.minHeight = '200px';
    }
}

// 生成随机数据的函数
function generateRandomData() {
    const randomArray = [];
    for (let i = 0; i < 8; i++) {
        randomArray.push(Math.floor(Math.random() * 10) + 1); // 1-10之间的随机数
    }
    return randomArray.join(' '); // 用空格连接
}

// 验证数组长度的函数
function validateArrayLength(arr) {
    if (arr.length > 8) {
        alert('数组长度不能超过8个元素，请重新输入。');
        return false;
    }
    return true;
}

// 更新区间修改输入框的范围限制
function updateRangeInputLimits(arrayLength) {
    const leftInput = document.getElementById('input-modify-left');
    const rightInput = document.getElementById('input-modify-right');
    
    if (leftInput && rightInput) {
        // 设置最小值为1，最大值为数组长度
        leftInput.min = 1;
        leftInput.max = arrayLength;
        leftInput.placeholder = "1";
        
        rightInput.min = 1;
        rightInput.max = arrayLength;
        rightInput.placeholder = arrayLength.toString();
        
        // 如果当前值超出范围，重置为默认值
        if (leftInput.value && (parseInt(leftInput.value) < 1 || parseInt(leftInput.value) > arrayLength)) {
            leftInput.value = "";
        }
        if (rightInput.value && (parseInt(rightInput.value) < 1 || parseInt(rightInput.value) > arrayLength)) {
            rightInput.value = "";
        }
    }
}

// 与原构建过程样式一致的绘制函数
function drawTree() {
    if (!treeContainer || !segmentTree) return;
    
    isAnimating = true;
    createTreeNodes();
    isAnimating = false;
}

function createTreeNodes() {
    if (!treeContainer) return;
    
    // Clear existing nodes with fade out animation
    const existingNodes = treeContainer.querySelectorAll('.tree-node, svg');
    existingNodes.forEach(node => {
        node.style.opacity = '0';
        node.style.transform = 'scale(0.8)';
    });
    
    setTimeout(() => {
        // Clear container after fade out
        treeContainer.innerHTML = '';
        nodeElements = [];
          // Get theme colors
        const isDark = document.body.classList.contains('dark');
        const isEyeCare = document.body.classList.contains('eye-care');
        
        const primaryColor = isDark ? '#a2cbfe' : isEyeCare ? '#4caf50' : '#6c5ce7';
        const secondaryColor = isDark ? '#7b68ee' : isEyeCare ? '#66bb6a' : '#a29bfe';
        const textColor = '#ffffff';
        const borderColor = '#ffffff';
          // Tree layout parameters
        const levels = Math.ceil(Math.log2(segmentTree.n)) + 1;
        const nodeWidth = 120;
        const nodeHeight = 110; // 增加高度以容纳懒标记
        const levelHeight = 140; // 增加层高        // 响应式设计：根据实际容器尺寸调整节点大小
        const screenWidth = window.innerWidth;
        
        // 获取实际的父容器宽度（考虑页面缩放）
        let actualContainerWidth = screenWidth;
        if (treeContainer && treeContainer.parentElement) {
            const parentRect = treeContainer.parentElement.getBoundingClientRect();
            actualContainerWidth = Math.min(parentRect.width - 40, screenWidth - 40); // 减去边距
        }
        
        const containerPadding = 40; // 容器内边距
        const availableWidth = actualContainerWidth - containerPadding;
        
        let responsiveNodeWidth = nodeWidth;
        let responsiveNodeHeight = nodeHeight;
        let responsiveFontSize = 13;
        
        // 根据实际可用宽度调整节点大小
        if (availableWidth <= 320 || screenWidth <= 320) {
            responsiveNodeWidth = 50;
            responsiveNodeHeight = 60;
            responsiveFontSize = 6;
        } else if (availableWidth <= 480 || screenWidth <= 480) {
            responsiveNodeWidth = 65;
            responsiveNodeHeight = 75;
            responsiveFontSize = 7;
        } else if (availableWidth <= 768 || screenWidth <= 768) {
            responsiveNodeWidth = 80;
            responsiveNodeHeight = 85;
            responsiveFontSize = 8;
        } else if (availableWidth <= 1024 || screenWidth <= 1024) {
            responsiveNodeWidth = 95;
            responsiveNodeHeight = 95;
            responsiveFontSize = 10;
        }// 首先收集所有叶子节点，计算它们的理想位置
        const leafNodes = [];
        const nodesByLevel = [];
        const nodePositions = new Map();
        
        // 收集所有叶子节点
        function collectLeafNodes(node, start, end) {
            if (node >= segmentTree.tree.length) return;
            
            if (start === end) {
                leafNodes.push({ node, start, end, index: start });
            } else {
                const mid = Math.floor((start + end) / 2);
                collectLeafNodes(2 * node, start, mid);
                collectLeafNodes(2 * node + 1, mid + 1, end);
            }
        }
        
        collectLeafNodes(1, 0, segmentTree.n - 1);        // 强制限制容器尺寸，基于实际可用宽度
        const viewportWidth = window.innerWidth;
        const safeMargin = 20; // 安全边距
        const maxAllowedWidth = Math.min(availableWidth * 0.95, actualContainerWidth - safeMargin);
        
        console.log(`容器计算: 屏幕=${screenWidth}px, 实际容器=${actualContainerWidth}px, 可用=${availableWidth}px, 最大允许=${maxAllowedWidth}px`);
        
        // 动态计算最小节点间距
        const minGap = screenWidth <= 480 ? 3 : 5;
        const preferredGap = screenWidth <= 480 ? 8 : (screenWidth <= 768 ? 12 : 20);
        
        // 计算在给定间距下需要的总宽度
        const getRequiredWidth = (gap) => {
            if (leafNodes.length <= 1) return responsiveNodeWidth;
            return leafNodes.length * responsiveNodeWidth + (leafNodes.length - 1) * gap;
        };
        
        let finalGap;
        let actualContentWidth;
        
        const preferredWidth = getRequiredWidth(preferredGap);
        const minWidth = getRequiredWidth(minGap);
        
        if (preferredWidth <= maxAllowedWidth) {
            // 首选间距可以放下
            finalGap = preferredGap;
            actualContentWidth = preferredWidth;
        } else if (minWidth <= maxAllowedWidth) {
            // 计算能放下的最大间距
            if (leafNodes.length > 1) {
                finalGap = (maxAllowedWidth - leafNodes.length * responsiveNodeWidth) / (leafNodes.length - 1);
            } else {
                finalGap = 0;
            }
            actualContentWidth = maxAllowedWidth;        } else {
            // 连最小间距都放不下，强制缩小节点以适应容器
            const forcedNodeWidth = Math.floor((maxAllowedWidth - (leafNodes.length - 1) * minGap) / leafNodes.length);
            if (forcedNodeWidth < responsiveNodeWidth * 0.6) {
                // 如果节点被压缩得太小，保持最小尺寸并使用滚动
                finalGap = minGap;
                actualContentWidth = minWidth;
            } else {
                // 使用强制压缩的节点宽度
                responsiveNodeWidth = Math.max(forcedNodeWidth, responsiveNodeWidth * 0.6);
                responsiveNodeHeight = Math.max(responsiveNodeHeight * 0.8, 60);
                responsiveFontSize = Math.max(responsiveFontSize * 0.8, 7);
                finalGap = minGap;
                actualContentWidth = leafNodes.length * responsiveNodeWidth + (leafNodes.length - 1) * finalGap;
            }
        }
        
        // 确保内容宽度不超过容器最大允许宽度
        actualContentWidth = Math.min(actualContentWidth, maxAllowedWidth);
          // 计算容器内边距，确保节点不会超出边界
        const drawingPadding = 15; // 绘制区域内边距
        const drawingWidth = actualContentWidth - 2 * drawingPadding; // 实际绘制区域宽度        // 分配叶子节点位置 - 确保节点不会重合或贴边
        const leafPositions = new Map();
        leafNodes.forEach((leaf, index) => {
            let position;
            if (leafNodes.length === 1) {
                position = drawingPadding + drawingWidth / 2;
            } else {
                // 确保左右两端都有足够的边距，避免节点贴边或重合
                const nodeRadius = responsiveNodeWidth / 2;
                const extraPadding = Math.max(5, nodeRadius * 0.2); // 额外间距
                const safeDrawingWidth = drawingWidth - 2 * (nodeRadius + extraPadding);
                
                if (safeDrawingWidth > 0) {
                    const stepWidth = safeDrawingWidth / (leafNodes.length - 1);
                    position = drawingPadding + nodeRadius + extraPadding + index * stepWidth;
                } else {
                    // 如果空间不够，均匀分布但确保不超出边界
                    const stepWidth = drawingWidth / (leafNodes.length + 1);
                    position = drawingPadding + stepWidth * (index + 1);
                }
            }
            leafPositions.set(leaf.node, position);
        });
        
        // 递归计算所有节点的位置，确保严格的父子对称
        function calculatePositions(node, start, end, level) {
            if (node >= segmentTree.tree.length) return null;
            
            // 确保层级数组足够大
            while (nodesByLevel.length <= level) {
                nodesByLevel.push([]);
            }
            
            let position;
            
            if (start === end) {
                // 叶子节点使用预计算的位置
                position = leafPositions.get(node);
            } else {
                // 内部节点：计算子节点位置的平均值
                const mid = Math.floor((start + end) / 2);
                const leftChild = calculatePositions(2 * node, start, mid, level + 1);
                const rightChild = calculatePositions(2 * node + 1, mid + 1, end, level + 1);
                
                if (leftChild && rightChild) {
                    // 父节点严格位于两个子节点的中点
                    position = (leftChild.position + rightChild.position) / 2;
                } else if (leftChild) {
                    // 只有左子节点
                    position = leftChild.position;
                } else if (rightChild) {
                    // 只有右子节点
                    position = rightChild.position;                } else {
                    // 理论上不应该发生，使用容器中心
                    position = actualContentWidth / 2;
                }
            }
            
            const nodeInfo = {
                node: node,
                start: start,
                end: end,
                level: level,
                position: position
            };
            
            nodesByLevel[level].push(nodeInfo);
            nodePositions.set(node, position);
            
            return nodeInfo;
        }
        
        // 计算所有节点位置
        calculatePositions(1, 0, segmentTree.n - 1, 0);        // Create level containers based on actual levels
        const levelContainers = [];
        
        // 强制限制容器宽度，绝对不超出屏幕
        const needsScroll = actualContentWidth > maxAllowedWidth;
        const containerWidth = Math.min(actualContentWidth, maxAllowedWidth);        // 设置主容器 - 确保完全适应屏幕并有明确边界
        const finalContainerWidth = Math.min(actualContentWidth, maxAllowedWidth);
        
        treeContainer.style.width = `${finalContainerWidth}px`;
        treeContainer.style.maxWidth = `${finalContainerWidth}px`;
        treeContainer.style.margin = '0 auto';
        treeContainer.style.overflowX = 'hidden'; // 强制隐藏水平滚动，确保内容不超出
        treeContainer.style.overflowY = 'visible';
        treeContainer.style.padding = '10px';
        treeContainer.style.boxSizing = 'border-box';
        treeContainer.style.border = '1px solid rgba(255, 255, 255, 0.2)'; // 添加边界线用于调试
        treeContainer.style.position = 'relative'; // 确保定位上下文
        
        // 添加媒体查询样式适配
        if (screenWidth <= 768) {
            treeContainer.style.padding = '5px';
        }
        
        console.log(`容器设置: 内容=${actualContentWidth}px, 容器=${finalContainerWidth}px, 最大=${maxAllowedWidth}px, 绘制宽度=${drawingWidth}px`);
        console.log(`节点尺寸: 宽=${responsiveNodeWidth}px, 高=${responsiveNodeHeight}px, 字体=${responsiveFontSize}px`);
        console.log(`叶节点数量: ${leafNodes.length}, 叶节点位置:`, Array.from(leafPositions.values()));
        
        // 创建层级容器
        for (let i = 0; i < nodesByLevel.length; i++) {
            const levelContainer = document.createElement('div');
            levelContainer.style.cssText = `
                display: block;
                position: relative;
                width: 100%;
                max-width: ${finalContainerWidth - 20}px;
                height: ${levelHeight}px;
                margin-bottom: 10px;
                overflow: hidden;
                box-sizing: border-box;
            `;
            treeContainer.appendChild(levelContainer);
            levelContainers.push(levelContainer);
        }

        // 直接基于收集到的节点创建DOM元素，使用绝对定位
        function createNodeElement(nodeInfo) {
            const { node, start, end, level, position } = nodeInfo;
            
            // Calculate node values - 直接使用当前值，不要重复应用懒标记
            let sum = segmentTree.tree[node];
            let minVal = segmentTree.minTree[node];
            let maxVal = segmentTree.maxTree[node];
            
            // 当前节点的懒标记值（仅用于显示）
            const actualLazyValue = segmentTree.lazy[node];
              // Create node element
            const nodeElement = document.createElement('div');
            nodeElement.className = 'tree-node';
              // 确保节点位置在容器边界内，并保持节点完整性
            const nodeHalfWidth = responsiveNodeWidth / 2;
            const minLeft = drawingPadding;
            const maxLeft = actualContentWidth - drawingPadding - responsiveNodeWidth;
            const nodeLeft = Math.max(minLeft, Math.min(position - nodeHalfWidth, maxLeft));
            
            // 使用绝对定位，将节点放在精确的位置
            nodeElement.style.cssText = `
                position: absolute;
                left: ${nodeLeft}px;
                top: 50%;
                transform: translateY(-50%);
                width: ${responsiveNodeWidth}px;
                height: ${responsiveNodeHeight}px;
                background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor} 30%, ${secondaryColor} 70%, ${secondaryColor} 100%);
                border: 2px solid ${borderColor};
                border-radius: 15px;
                color: ${textColor};
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                font-family: "Segoe UI", "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", Arial, sans-serif;
                font-weight: bold;
                font-size: ${responsiveFontSize}px;
                text-align: center;
                line-height: 1.2;
                box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3);
                transition: all 0.3s ease;
                cursor: default;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.4);
                opacity: 0;
                z-index: 2;
            `;
            
            // Add node content with lazy tag
            const lazyDisplay = actualLazyValue === 0 ? '-' : `+${actualLazyValue}`;
            
            // 为懒标记添加高亮样式（当有值时）
            const lazyStyle = actualLazyValue === 0 ? 
                '' : 
                'color: #ffeb3b; background: rgba(255, 235, 59, 0.2); border-radius: 3px; padding: 1px 3px; font-weight: bold;';
            
            const content = `
                <div style="font-size: ${responsiveFontSize + 1}px; font-weight: bold; margin-bottom: 2px;">[${start + 1}, ${end + 1}]</div>
                <div style="margin-bottom: 1px; font-size: ${responsiveFontSize}px;">sum: ${sum}</div>
                <div style="margin-bottom: 1px; font-size: ${responsiveFontSize}px;">min: ${minVal}</div>
                <div style="margin-bottom: 1px; font-size: ${responsiveFontSize}px;">max: ${maxVal}</div>
                <div style="margin-bottom: 1px; font-size: ${responsiveFontSize}px; ${lazyStyle}">Laz: ${lazyDisplay}</div>
            `;
            nodeElement.innerHTML = content;
            
            // Add to appropriate level container
            levelContainers[level].appendChild(nodeElement);
            
            // Store node element reference
            nodeElements.push({
                node: node,
                element: nodeElement,
                start: start,
                end: end,
                level: level,
                position: position
            });
            
            // Animate node appearance
            setTimeout(() => {
                nodeElement.style.opacity = '1';
            }, level * 100); // Staggered animation by level
            
            return nodeElement;
        }
          // 按层级创建节点，保持父子位置关系
        nodesByLevel.forEach((levelNodes, levelIndex) => {
            levelNodes.forEach((nodeInfo) => {
                createNodeElement(nodeInfo);
            });
        });
        
        // Add connecting lines after all nodes are created
        setTimeout(() => {
            addConnectingLines();
        }, nodesByLevel.length * 100 + 500); // Wait for all animations to finish
        
    }, 300); // Wait for fade out
}

function addConnectingLines() {
    // Wait for DOM to be fully rendered
    setTimeout(() => {
        // Remove existing SVG if any
        const existingSvg = treeContainer.querySelector('svg');
        if (existingSvg) {
            existingSvg.remove();
        }
        
        // Create SVG overlay for connection lines
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
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
        
        // Get theme colors for lines
        const isDark = document.body.classList.contains('dark');
        const isEyeCare = document.body.classList.contains('eye-care');
        const lineColor = isDark ? '#7b68ee' : isEyeCare ? '#66bb6a' : '#a29bfe';        // Draw connection lines with precise positioning
        nodeElements.forEach(nodeData => {
            const { node, element, start, end, level } = nodeData;
            
            if (start !== end) {
                const mid = Math.floor((start + end) / 2);
                
                // Find child nodes
                const leftChild = nodeElements.find(n => n.node === 2 * node);
                const rightChild = nodeElements.find(n => n.node === 2 * node + 1);
                
                // Get parent element position
                const parentRect = element.getBoundingClientRect();
                const treeRect = treeContainer.getBoundingClientRect();
                const parentX = parentRect.left + parentRect.width / 2 - treeRect.left;
                const parentY = parentRect.bottom - treeRect.top;
                
                if (leftChild) {
                    const leftRect = leftChild.element.getBoundingClientRect();
                    const leftX = leftRect.left + leftRect.width / 2 - treeRect.left;
                    const leftY = leftRect.top - treeRect.top;
                    
                    const leftLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    leftLine.setAttribute('x1', parentX);
                    leftLine.setAttribute('y1', parentY);
                    leftLine.setAttribute('x2', leftX);
                    leftLine.setAttribute('y2', leftY);
                    leftLine.setAttribute('stroke', lineColor);
                    leftLine.setAttribute('stroke-width', '3');
                    leftLine.setAttribute('stroke-linecap', 'round');
                    leftLine.setAttribute('opacity', '0.8');
                    
                    svg.appendChild(leftLine);
                }
                
                if (rightChild) {
                    const rightRect = rightChild.element.getBoundingClientRect();
                    const rightX = rightRect.left + rightRect.width / 2 - treeRect.left;
                    const rightY = rightRect.top - treeRect.top;
                    
                    const rightLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    rightLine.setAttribute('x1', parentX);
                    rightLine.setAttribute('y1', parentY);
                    rightLine.setAttribute('x2', rightX);
                    rightLine.setAttribute('y2', rightY);
                    rightLine.setAttribute('stroke', lineColor);
                    rightLine.setAttribute('stroke-width', '3');
                    rightLine.setAttribute('stroke-linecap', 'round');
                    rightLine.setAttribute('opacity', '0.8');
                    
                    svg.appendChild(rightLine);
                }
            }
        });
        
        // Ensure nodes are above lines
        nodeElements.forEach(nodeData => {
            nodeData.element.style.zIndex = '2';
        });
    }, 50); // Small delay to ensure DOM is rendered
}

function initEventListeners() {    // 确保所有DOM元素都存在
    const randomBtn = document.getElementById('btn-random-data');
    const updateBtn = document.getElementById('btn-update-custom-data');
    const inputElement = document.getElementById('input-custom-data');
    const applyBtn = document.getElementById('btn-apply-modification');
    
    if (!randomBtn || !updateBtn || !inputElement || !applyBtn) {
        console.error('某些必需的DOM元素不存在');
        return;
    }// 随机生成数据按钮
    randomBtn.addEventListener('click', function() {
        const randomData = generateRandomData();
        inputElement.value = randomData;
    });    // 更新自定义数据按钮
    updateBtn.addEventListener('click', function() {
        const input = inputElement.value.trim();
        
        if (!input) {
            alert('请输入以空格分隔的有效数字。');
            return;
        }
        
        const arr = input.split(/\s+/).map(Number).filter(n => !isNaN(n)); // 用空格或多个空格分割
        
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
            
            // 设置区间修改输入框的范围限制
            updateRangeInputLimits(arr.length);
            
            // 在构建树后调整容器大小
            adjustContainerSize();
            drawTree();
        } catch (error) {
            console.error('构建线段树时出错:', error);
            alert('构建线段树时出错，请检查输入数据。');
        }
    });// 应用修改按钮
    document.getElementById('btn-apply-modification').addEventListener('click', function() {
        const left = parseInt(document.getElementById('input-modify-left').value);
        const right = parseInt(document.getElementById('input-modify-right').value);
        const value = parseInt(document.getElementById('input-modify-value').value);

        if (!segmentTree) {
            alert('请先构建树。');
            return;
        }

        // 更严格的验证
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
        
        // 立即重绘以显示更新后的懒标记高亮
        adjustContainerSize();
        drawTree();
    });
      // 主题切换事件
    document.querySelectorAll('.theme-option').forEach(button => {
        button.addEventListener('click', () => {
            setTimeout(drawTree, 50);
        });
    });
    
    // 初始数据设置 - 提供示例数据并自动构建树
    if (!inputElement.value) {
        // 如果没有初始值，生成示例数据
        const exampleData = "1 3 5 7 2 4 6 8";
        inputElement.value = exampleData;
        
        // 自动构建示例树
        setTimeout(() => {
            const arr = exampleData.split(/\s+/).map(Number);
            try {
                segmentTree = new SegmentTree(arr);
                updateRangeInputLimits(arr.length);
                adjustContainerSize();
                drawTree();
            } catch (error) {
                console.error('构建示例线段树时出错:', error);
            }        }, 100);
    }    window.addEventListener('resize', () => {
        adjustContainerSize();
        if (segmentTree) {
            // 使用防抖避免频繁重绘
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                console.log('窗口尺寸变化，重新绘制树结构');
                // 重新计算所有尺寸并重绘
                drawTree();
            }, 150); // 减少延迟，提高响应性
        }
    });
}

// 窗口尺寸变化处理的防抖超时变量
let resizeTimeout;

// 全局resize监听器，确保所有情况下都能响应（包括页面缩放）
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
        if (segmentTree && treeContainer) {
            console.log('全局resize - 重新绘制树结构');
            adjustContainerSize();
            drawTree();
        }
    }, 200);
});

// 监听页面缩放变化
let currentZoom = window.devicePixelRatio;
setInterval(() => {
    if (window.devicePixelRatio !== currentZoom) {
        currentZoom = window.devicePixelRatio;
        console.log('检测到页面缩放变化:', currentZoom);
        if (segmentTree && treeContainer) {
            setTimeout(() => {
                adjustContainerSize();
                drawTree();
            }, 300);
        }
    }
}, 500);

document.addEventListener('DOMContentLoaded', () => {
    // 确保在DOM加载完成后立即设置树容器
    setupTreeContainer();
    initEventListeners();
});

// 高亮受影响的节点
function highlightAffectedNodes(left, right) {
    if (!nodeElements || nodeElements.length === 0) return;
    
    nodeElements.forEach(nodeData => {
        const { start, end, element } = nodeData;
        
        // 检查节点区间是否与修改区间有重叠
        if (start <= right && end >= left) {
            // 添加高亮类
            element.classList.add('active');
            
            // 移除高亮类
            setTimeout(() => {
                element.classList.remove('active');
            }, 600);
        }
    });
}