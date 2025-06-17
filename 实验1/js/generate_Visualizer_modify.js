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

    if (start > r || end < l) return;

    if (l <= start && end <= r) {
        this.tree[node] += (end - start + 1) * val;
        this.minTree[node] += val;
        this.maxTree[node] += val;
        if (start !== end) {
            this.lazy[2 * node] += val;
            this.lazy[2 * node + 1] += val;
        }
        return;
    }

    const mid = Math.floor((start + end) / 2);
    this.updateRange(2 * node, start, mid, l, r, val);
    this.updateRange(2 * node + 1, mid + 1, end, l, r, val);
    
    // 推送lazy propagation到子节点来获取正确的值
    if (this.lazy[2 * node] !== 0) {
        this.tree[2 * node] += (mid - start + 1) * this.lazy[2 * node];
        this.minTree[2 * node] += this.lazy[2 * node];
        this.maxTree[2 * node] += this.lazy[2 * node];
    }
    if (this.lazy[2 * node + 1] !== 0) {
        this.tree[2 * node + 1] += (end - mid) * this.lazy[2 * node + 1];
        this.minTree[2 * node + 1] += this.lazy[2 * node + 1];
        this.maxTree[2 * node + 1] += this.lazy[2 * node + 1];
    }
    
    this.tree[node] = this.tree[2 * node] + this.tree[2 * node + 1];
    this.minTree[node] = Math.min(this.minTree[2 * node], this.minTree[2 * node + 1]);
    this.maxTree[node] = Math.max(this.maxTree[2 * node], this.maxTree[2 * node + 1]);
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
        const levelHeight = 140; // 增加层高
        const containerWidth = Math.min(1200, window.innerWidth - 80);
        
        // 响应式设计：根据屏幕尺寸调整节点大小
        const screenWidth = window.innerWidth;
        let responsiveNodeWidth = nodeWidth;
        let responsiveNodeHeight = nodeHeight;
        let responsiveFontSize = 13;
        
        if (screenWidth <= 480) {
            responsiveNodeWidth = 85;
            responsiveNodeHeight = 95;
            responsiveFontSize = 10;
        } else if (screenWidth <= 768) {
            responsiveNodeWidth = 100;
            responsiveNodeHeight = 100;
            responsiveFontSize = 11;
        }
          // Create level containers
        const levelContainers = [];
        for (let i = 0; i < levels; i++) {
            const levelContainer = document.createElement('div');
            levelContainer.style.cssText = `
                display: flex;
                justify-content: space-around;
                align-items: center;
                width: 100%;
                height: ${levelHeight}px;
                position: relative;
                margin-bottom: 10px;
                padding: 0 20px;
                box-sizing: border-box;
            `;
            treeContainer.appendChild(levelContainer);
            levelContainers.push(levelContainer);
        }
        
        function createNodeElement(node, start, end, level, positionInLevel, totalInLevel) {
            if (node >= segmentTree.tree.length) return null;
            
            // Calculate node values
            let sum = segmentTree.tree[node];
            let minVal = segmentTree.minTree[node];
            let maxVal = segmentTree.maxTree[node];
            
            if (segmentTree.lazy[node] !== 0) {
                sum += (end - start + 1) * segmentTree.lazy[node];
                minVal += segmentTree.lazy[node];
                maxVal += segmentTree.lazy[node];
            }
            
            // Create node element
            const nodeElement = document.createElement('div');
            nodeElement.className = 'tree-node';            nodeElement.style.cssText = `
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
                position: relative;
                margin: 0 5px;
                transition: all 0.3s ease;
                cursor: default;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.4);
                opacity: 0;
                transform: scale(0.8) translateY(-20px);
                z-index: 2;
                flex: 1;
                max-width: ${responsiveNodeWidth}px;
            `;            // Add node content with lazy tag
            const lazyValue = segmentTree.lazy[node];
            const lazyDisplay = lazyValue === 0 ? '-' : `+${lazyValue}`;
            const lazyStyle = lazyValue === 0 ? 
                `color: #888; font-weight: normal;` : 
                `color: #ffeb3b; font-weight: bold; background: rgba(255, 235, 59, 0.2); border-radius: 3px; padding: 1px 3px;`;            const content = `
                <div style="font-size: ${responsiveFontSize + 1}px; font-weight: bold; margin-bottom: 2px;">[${start + 1}, ${end + 1}]</div>
                <div style="margin-bottom: 1px; font-size: ${responsiveFontSize}px;">sum: ${sum}</div>
                <div style="margin-bottom: 1px; font-size: ${responsiveFontSize}px;">min: ${minVal}</div>
                <div style="margin-bottom: 1px; font-size: ${responsiveFontSize}px;">max: ${maxVal}</div>
                <div class="lazy-tag" style="font-size: ${responsiveFontSize - 1}px; ${lazyStyle}">Laz: ${lazyDisplay}</div>
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
                level: level
            });
            
            // Animate node appearance
            setTimeout(() => {
                nodeElement.style.opacity = '1';
                nodeElement.style.transform = 'scale(1) translateY(0)';
            }, level * 100 + positionInLevel * 50); // Staggered animation
            
            // Create child nodes
            if (start !== end) {
                const mid = Math.floor((start + end) / 2);
                createNodeElement(2 * node, start, mid, level + 1, positionInLevel * 2, totalInLevel * 2);
                createNodeElement(2 * node + 1, mid + 1, end, level + 1, positionInLevel * 2 + 1, totalInLevel * 2);
            }
            
            return nodeElement;
        }
        
        // Create the tree starting from root
        createNodeElement(1, 0, segmentTree.n - 1, 0, 0, 1);
        
        // Add connecting lines after all nodes are created
        setTimeout(() => {
            addConnectingLines();
        }, levels * 100 + 500); // Wait for all animations to finish
        
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
        const lineColor = isDark ? '#7b68ee' : isEyeCare ? '#66bb6a' : '#a29bfe';
        
        // Draw connection lines
        nodeElements.forEach(nodeData => {
            const { node, element, start, end, level } = nodeData;
            
            if (start !== end) {
                const mid = Math.floor((start + end) / 2);
                
                // Find child nodes
                const leftChild = nodeElements.find(n => n.node === 2 * node);
                const rightChild = nodeElements.find(n => n.node === 2 * node + 1);
                
                if (leftChild && rightChild) {
                    const parentRect = element.getBoundingClientRect();
                    const treeRect = treeContainer.getBoundingClientRect();
                    const leftRect = leftChild.element.getBoundingClientRect();
                    const rightRect = rightChild.element.getBoundingClientRect();
                    
                    // Calculate relative positions
                    const parentX = parentRect.left + parentRect.width / 2 - treeRect.left;
                    const parentY = parentRect.bottom - treeRect.top;
                    const leftX = leftRect.left + leftRect.width / 2 - treeRect.left;
                    const leftY = leftRect.top - treeRect.top;
                    const rightX = rightRect.left + rightRect.width / 2 - treeRect.left;
                    const rightY = rightRect.top - treeRect.top;
                    
                    // Create line elements
                    const leftLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    leftLine.setAttribute('x1', parentX);
                    leftLine.setAttribute('y1', parentY);
                    leftLine.setAttribute('x2', leftX);
                    leftLine.setAttribute('y2', leftY);
                    leftLine.setAttribute('stroke', lineColor);
                    leftLine.setAttribute('stroke-width', '3');
                    leftLine.setAttribute('stroke-linecap', 'round');
                    
                    const rightLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    rightLine.setAttribute('x1', parentX);
                    rightLine.setAttribute('y1', parentY);
                    rightLine.setAttribute('x2', rightX);
                    rightLine.setAttribute('y2', rightY);
                    rightLine.setAttribute('stroke', lineColor);
                    rightLine.setAttribute('stroke-width', '3');
                    rightLine.setAttribute('stroke-linecap', 'round');
                    
                    svg.appendChild(leftLine);
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

function initEventListeners() {
    // 确保所有DOM元素都存在
    const randomBtn = document.getElementById('btn-random-data');
    const updateBtn = document.getElementById('btn-update-custom-data');
    const inputElement = document.getElementById('input-custom-data');
    const applyBtn = document.getElementById('btn-apply-modification');
    
    if (!randomBtn || !updateBtn || !inputElement || !applyBtn) {
        console.error('某些必需的DOM元素不存在');
        return;
    }    // 随机生成数据按钮
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
        
        // 延迟重绘以显示动画效果
        setTimeout(() => {
            adjustContainerSize();
            drawTree();        }, 800);
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
    }
    
    window.addEventListener('resize', () => {
        adjustContainerSize();
        if (segmentTree) {
            setTimeout(() => {
                drawTree();
            }, 100);
        }
    });
}

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