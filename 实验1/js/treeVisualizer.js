/* 线段树可视化模块 */

// --- Start of Adaptive Functionality State ---
let lastBuiltN = 0;
let lastBuiltDataArray = null; // For custom data
let lastBuiltContainer = null;
let isTreeRendered = false;
let domNodeElements = new Map(); // Stores DOM node elements, keyed by 'u'
let domLineElements = new Map(); // Stores DOM line elements, keyed by child 'u'
let currentTreeLevelsData = [];
let currentTreeBuildOrderData = [];
let activeBuildAnimationTimeout = null; // To cancel ongoing build animation
let segmentTreeDataMap = new Map(); // Stores {sum, min, max} for nodes when building with data
// --- End of Adaptive Functionality State ---

// Debounce function
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

// Helper function to construct segment tree data from an array
function constructSegmentTreeNode(dataArray, l, r, u) { // l, r are 1-based indices
    if (l > r) return null; // Should not happen with correct initial call

    const currentNodeData = { l, r, sum: 0, min: Infinity, max: -Infinity, isLeaf: (l === r) };
    segmentTreeDataMap.set(u, currentNodeData);

    if (l === r) { // Leaf node
        if (l - 1 >= 0 && l - 1 < dataArray.length) {
            const val = dataArray[l - 1];
            currentNodeData.sum = val;
            currentNodeData.min = val;
            currentNodeData.max = val;
        } else { // Should ideally not happen if l,r are within 1..dataArray.length
            currentNodeData.sum = 0;
            currentNodeData.min = 0; // Or some other indicator of invalid leaf
            currentNodeData.max = 0;
        }
        return currentNodeData;
    }

    const mid = Math.floor((l + r) / 2);
    const leftChildResult = constructSegmentTreeNode(dataArray, l, mid, u * 2);
    const rightChildResult = constructSegmentTreeNode(dataArray, mid + 1, r, u * 2 + 1);

    if (leftChildResult) {
        currentNodeData.sum += leftChildResult.sum;
        currentNodeData.min = Math.min(currentNodeData.min, leftChildResult.min);
        currentNodeData.max = Math.max(currentNodeData.max, leftChildResult.max);
    }
    if (rightChildResult) {
        currentNodeData.sum += rightChildResult.sum;
        currentNodeData.min = Math.min(currentNodeData.min, rightChildResult.min);
        currentNodeData.max = Math.max(currentNodeData.max, rightChildResult.max);
    }
    return currentNodeData;
}


// 线段树可视化 - 基于边界的智能布局算法 (Original, based on n)
function buildTreeVisualization(n, container, isResizeUpdate = false) {
  if (!isResizeUpdate) {
    // This is an initial build or a full rebuild
    lastBuiltN = n;
    lastBuiltDataArray = null; // Clear custom data when building by N
    lastBuiltContainer = container;
    isTreeRendered = false; // Mark as not rendered until animation completes
    domNodeElements.clear();
    domLineElements.clear();
    currentTreeLevelsData = [];
    currentTreeBuildOrderData = [];
    segmentTreeDataMap.clear(); // Clear any previous custom data map

    if (activeBuildAnimationTimeout) {
      clearTimeout(activeBuildAnimationTimeout);
      activeBuildAnimationTimeout = null;
    }

    if (n < 1 || n > 8) {
      alert('请输入1-8');
      return;
    }    
    container.innerHTML = '<h4>🌲 线段树构建过程:</h4>';
    container.innerHTML += `<p><strong>数组长度:</strong> ${n}</p>`;
    const treeVisual = document.createElement('div');
    treeVisual.className = 'tree-visual';
    treeVisual.style.position = 'relative';
    treeVisual.style.width = '100%';
    treeVisual.style.padding = '25px'; // Padding is part of treeVisual itself
    treeVisual.style.background = 'var(--card-bg)';
    treeVisual.style.borderRadius = '12px'; // 改为12px圆角
    treeVisual.style.border = '2px solid rgba(255, 255, 255, 0.8)'; // 添加白边
    treeVisual.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)'; // 调整阴影
    treeVisual.style.overflow = 'visible';
    container.appendChild(treeVisual);
  }

  const treeVisual = container.querySelector('.tree-visual');
  if (!treeVisual) {
    console.error("Tree visual element not found for buildTreeVisualization.");
    return;
  }

  const containerWidth = treeVisual.clientWidth - 50; // Effective drawing width after treeVisual's own 25px padding
  const nodeMinWidth = 50;
  const levelHeight = 80;
  const padding = 25; // Internal padding within the containerWidth

  if (!isResizeUpdate) {
    // This is an initial build: collect tree levels data
    currentTreeLevelsData = []; // Clear for new build
    function collectLevels(l, r, u, depth = 0) {
      if (l > r) return; // Base case: invalid range, do not process
      if (!currentTreeLevelsData[depth]) currentTreeLevelsData[depth] = [];
      currentTreeLevelsData[depth].push({ l, r, u, depth });
      if (l < r) { // Only recurse if the range can be split further
        const mid = Math.floor((l + r) / 2);
        collectLevels(l, mid, u * 2, depth + 1);
        if (mid < r) { // Ensure right child is only processed if its range is valid
            collectLevels(mid + 1, r, u * 2 + 1, depth + 1);
        }
      }
    }
    collectLevels(1, n, 1);

    const totalLevels = currentTreeLevelsData.length;
    // Adjusted height calculation (similar to the one developed before)
    const maxNodeH = 40; 
    let calculatedH = 0;
    if (totalLevels > 0) {
        const contentH = (totalLevels - 1) * levelHeight + maxNodeH;
        const style = window.getComputedStyle(treeVisual);
        const paddingTopVal = parseFloat(style.paddingTop) || 0;
        const paddingBottomVal = parseFloat(style.paddingBottom) || 0;
        calculatedH = contentH + paddingTopVal + paddingBottomVal + 30; // +30 for initial y offset
    } else {
        calculatedH = 50; 
    }
    const minH = Math.max(80, calculatedH);
    treeVisual.style.minHeight = `${minH}px`;
    treeVisual.style.height = `${minH}px`;
  }
  
  const nodePositions = new Map();

  // 修改后的 calculateNodePositions 函数
  function calculateNodePositions(l, r, u, depth = 0, parentX = null, parentW = null) {
    // Check if this node should exist based on currentTreeLevelsData
    // This is a more robust way to ensure we only calculate positions for valid nodes
    const levelNodes = currentTreeLevelsData[depth];
    if (!levelNodes || !levelNodes.find(node => node.u === u && node.l === l && node.r === r)) {
        return; // Do not calculate position for a node that doesn't exist in the collected levels
    }

    const y = depth * levelHeight + 30; // Initial top offset for nodes
    let x, nodeW;

    if (u === 1) { // Root node
        nodeW = containerWidth - (2 * padding); // Root spans containerWidth minus internal paddings
        nodeW = Math.max(nodeMinWidth, nodeW);
        x = containerWidth / 2; // Centered within containerWidth
    } else { // Child Node
        if (parentW == null || parentX == null) {
            nodeW = nodeMinWidth; // Fallback
            const tempParentPos = nodePositions.get(Math.floor(u/2)); // Attempt to get from map if available
            x = tempParentPos ? tempParentPos.x : containerWidth / 2; // Fallback center
        } else {
            nodeW = parentW / 2; // Child width is half of parent's width
            nodeW = Math.max(nodeMinWidth, nodeW);

            const isLeftChild = (u % 2 === 0);
            if (isLeftChild) {
                x = parentX - parentW / 4; // Center in parent's left half-width
            } else { // Right child
                x = parentX + parentW / 4; // Center in parent's right half-width
            }
        }
    }

    // Boundary clamping: Ensure the node (its edges) stays within the designated internal padding
    const halfW = nodeW / 2;
    if (x - halfW < padding) { // Left edge should not be less than internal 'padding'
        x = padding + halfW;
    }
    if (x + halfW > containerWidth - padding) { // Right edge should not exceed 'containerWidth - padding'
        x = containerWidth - padding - halfW;
    }
    
    nodePositions.set(u, { x, y, l, r, depth, nodeWidth: nodeW });

    if (l < r) { // If not a data leaf, recurse for children
        const mid = Math.floor((l + r) / 2);
        calculateNodePositions(l, mid, u * 2, depth + 1, x, nodeW);
        if (mid < r) { // Ensure right child is only processed if its range is valid
            calculateNodePositions(mid + 1, r, u * 2 + 1, depth + 1, x, nodeW);
        }
    }
  }
  
  // Initial call to the modified calculateNodePositions
  calculateNodePositions(1, n, 1, 0, null, null); 
  
  if (!isResizeUpdate) {
    // This is a new build: generate render order and start animation
    currentTreeBuildOrderData = []; // Clear for new build

    function generateBuildOrder(l, r, u, depth = 0) {
      if (l > r) return;
      
      const levelNodes = currentTreeLevelsData[depth];
      if (!levelNodes || !levelNodes.find(node => node.u === u && node.l === l && node.r === r)) {
          return; 
      }

      currentTreeBuildOrderData.push({ l, r, u, depth }); 
      
      if (l < r) {
        const mid = Math.floor((l + r) / 2);
        generateBuildOrder(l, mid, u * 2, depth + 1);
        if (mid < r) {
            generateBuildOrder(mid + 1, r, u * 2 + 1, depth + 1);
        }
      }
    }
    generateBuildOrder(1, n, 1);

    let orderIndex = 0;
    function renderNextNode() {
      if (orderIndex >= currentTreeBuildOrderData.length) {
        isTreeRendered = true;
        activeBuildAnimationTimeout = null;
        return;
      }

      const { l, r, u, depth } = currentTreeBuildOrderData[orderIndex]; 
      const position = nodePositions.get(u);
      if (!position) {
          orderIndex++;
          activeBuildAnimationTimeout = setTimeout(renderNextNode, 50);
          return;
      }
      // Generic node info for buildTreeVisualization (by length N)
      const nodeInfo = `ID: ${u}<br>[${l}, ${r}]`; 
      
      const nodeDiv = document.createElement('div');
      nodeDiv.className = `tree-node depth-${depth}`;
      nodeDiv.innerHTML = nodeInfo; // No .replace(/\n/g, '<br>') needed if using <br> directly
      nodeDiv.setAttribute('data-node-id', u);
      
      nodeDiv.style.position = 'absolute';
      nodeDiv.style.left = `${position.x - position.nodeWidth / 2}px`;
      nodeDiv.style.top = `${position.y}px`;
      nodeDiv.style.width = `${position.nodeWidth}px`;
      nodeDiv.style.zIndex = '10';
      
      nodeDiv.style.opacity = '0';
      nodeDiv.style.transform = 'translateY(-10px)';
      
      treeVisual.appendChild(nodeDiv);
      domNodeElements.set(u, nodeDiv); // Store DOM element
      
      if (depth > 0) addConnectionLine(u, nodePositions, treeVisual);
      
      setTimeout(() => {
        nodeDiv.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        nodeDiv.style.opacity = '1';
        nodeDiv.style.transform = 'translateY(0)';
      }, 50);

      orderIndex++;
      const animationDelay = getAnimationDelay();
      activeBuildAnimationTimeout = setTimeout(renderNextNode, animationDelay / 6);
    }
    activeBuildAnimationTimeout = setTimeout(renderNextNode, 500); // Initial call for animation
  } else {
    // This is a resize update: update existing DOM elements
    domNodeElements.forEach((nodeDiv, u) => {
      const position = nodePositions.get(u);
      if (position) {
        nodeDiv.style.left = `${position.x - position.nodeWidth / 2}px`;
        nodeDiv.style.top = `${position.y}px`;
        nodeDiv.style.width = `${position.nodeWidth}px`;
      }
    });

    domLineElements.forEach((line, childId) => { // Assuming addConnectionLine stores lines in domLineElements
      const parentId = Math.floor(childId / 2);
      const childPos = nodePositions.get(childId);
      const parentPos = nodePositions.get(parentId);
      if (childPos && parentPos) {
        const deltaX = childPos.x - parentPos.x;
        const deltaY = childPos.y - parentPos.y - (parseFloat(window.getComputedStyle(domNodeElements.get(parentId)).height) / 2 || 17.5); // Adjust based on parent node height
        const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        line.style.width = `${length}px`;
        line.style.left = `${parentPos.x}px`;
        line.style.top = `${parentPos.y + (parseFloat(window.getComputedStyle(domNodeElements.get(parentId)).height) / 2 || 17.5)}px`;
        line.style.transform = `rotate(${angle}deg)`;
      }
    });
    isTreeRendered = true; // Ensure flag is set after resize update
  }
}

// New function to build visualization from actual data array
function buildTreeVisualizationWithData(dataArray, container, isResizeUpdate = false) {
  const n = dataArray.length; // Number of elements

  if (!isResizeUpdate) {
    lastBuiltN = 0; // Clear N when building by data
    lastBuiltDataArray = dataArray;
    lastBuiltContainer = container;
    isTreeRendered = false;
    domNodeElements.clear();
    domLineElements.clear();
    currentTreeLevelsData = [];
    currentTreeBuildOrderData = [];
    segmentTreeDataMap.clear(); // Clear and rebuild for new data

    if (activeBuildAnimationTimeout) {
      clearTimeout(activeBuildAnimationTimeout);
      activeBuildAnimationTimeout = null;
    }

    if (n === 0) {
      alert('数据数组不能为空！');
      return;
    }
    if (n > 8) { // Keep the limit for now
        alert('当前演示支持最多8个数据点。');
        return;
    }

    // Construct the segment tree data (sum, min, max for each node)
    constructSegmentTreeNode(dataArray, 1, n, 1);

    container.innerHTML = '<h4>🌲 线段树 (自定义数据):</h4>';
    container.innerHTML += `<p><strong>数据:</strong> [${dataArray.join(', ')}]</p>`;
    const treeVisual = document.createElement('div');
    treeVisual.className = 'tree-visual';
    // Rely on CSS for styling .tree-visual
    container.appendChild(treeVisual);
  }

  const treeVisual = container.querySelector('.tree-visual');
  if (!treeVisual) {
    console.error("Tree visual element not found for buildTreeVisualizationWithData.");
    return;
  }

  // Constants for layout (can be fine-tuned)
  const containerWidth = treeVisual.clientWidth - 50; // Effective drawing width (treeVisual padding: 25px each side)
  const nodeMinWidth = 60; // Might need more width for more data
  const levelHeight = 90;  // Increased for more text
  const padding = 25;      // Internal padding within the drawing area

  if (!isResizeUpdate) {
    currentTreeLevelsData = [];
    function collectLevels(l, r, u, depth = 0) {
      if (l > r) return;
      if (!currentTreeLevelsData[depth]) currentTreeLevelsData[depth] = [];
      currentTreeLevelsData[depth].push({ l, r, u, depth }); // Store l,r (1-based)
      if (l < r) {
        const mid = Math.floor((l + r) / 2);
        collectLevels(l, mid, u * 2, depth + 1);
        if (mid < r) { // Ensure right child is only processed if its range is valid
             collectLevels(mid + 1, r, u * 2 + 1, depth + 1);
        }
      }
    }
    collectLevels(1, n, 1); // Use 1-based indexing for ranges [1, n]

    const totalLevels = currentTreeLevelsData.length;
    const maxNodeH = 70; // Estimated max height of a node with more text
    let calculatedH = 0;
    if (totalLevels > 0) {
        const contentH = (totalLevels - 1) * levelHeight + maxNodeH;
        const style = window.getComputedStyle(treeVisual);
        const paddingTopVal = parseFloat(style.paddingTop) || 0;
        const paddingBottomVal = parseFloat(style.paddingBottom) || 0;
        calculatedH = contentH + paddingTopVal + paddingBottomVal + 30; // +30 for initial y offset
    } else {
        calculatedH = 50;
    }
    const minH = Math.max(100, calculatedH); // Min height for the container
    treeVisual.style.minHeight = `${minH}px`;
    treeVisual.style.height = `${minH}px`;
  }

  const nodePositions = new Map();

  // calculateNodePositions (similar to the one in buildTreeVisualization)
  function calculateNodePositions(l, r, u, depth = 0, parentX = null, parentW = null) {
    const levelNodes = currentTreeLevelsData[depth];
    if (!levelNodes || !levelNodes.find(node => node.u === u && node.l === l && node.r === r)) {
        return;
    }
    const y = depth * levelHeight + 30; // Initial top offset for nodes
    let x, nodeW;

    if (u === 1) { // Root node
        nodeW = containerWidth - (2 * padding);
        nodeW = Math.max(nodeMinWidth, nodeW);
        x = containerWidth / 2;
    } else { // Child Node
        if (parentW == null || parentX == null) {
            nodeW = nodeMinWidth;
            const tempParentPos = nodePositions.get(Math.floor(u/2));
            x = tempParentPos ? tempParentPos.x : containerWidth / 2;
        } else {
            nodeW = parentW / 2;
            nodeW = Math.max(nodeMinWidth, nodeW);
            const isLeftChild = (u % 2 === 0);
            if (isLeftChild) {
                x = parentX - parentW / 4;
            } else {
                x = parentX + parentW / 4;
            }
        }
    }
    const halfW = nodeW / 2;
    if (x - halfW < padding) x = padding + halfW;
    if (x + halfW > containerWidth - padding) x = containerWidth - padding - halfW;
    
    nodePositions.set(u, { x, y, l, r, depth, nodeWidth: nodeW });

    if (l < r) {
        const mid = Math.floor((l + r) / 2);
        calculateNodePositions(l, mid, u * 2, depth + 1, x, nodeW);
         if (mid < r) {
            calculateNodePositions(mid + 1, r, u * 2 + 1, depth + 1, x, nodeW);
        }
    }
  }
  calculateNodePositions(1, n, 1, 0, null, null);

  if (!isResizeUpdate) {
    currentTreeBuildOrderData = [];
    function generateBuildOrder(l, r, u, depth = 0) {
      if (l > r) return;
      const levelNodes = currentTreeLevelsData[depth];
      if (!levelNodes || !levelNodes.find(node => node.u === u && node.l === l && node.r === r)) return;
      currentTreeBuildOrderData.push({ l, r, u, depth });
      if (l < r) {
        const mid = Math.floor((l + r) / 2);
        generateBuildOrder(l, mid, u * 2, depth + 1);
        if (mid < r) generateBuildOrder(mid + 1, r, u * 2 + 1, depth + 1);
      }
    }
    generateBuildOrder(1, n, 1);

    let orderIndex = 0;
    function renderNextNodeWithData() {
      if (orderIndex >= currentTreeBuildOrderData.length) {
        isTreeRendered = true;
        activeBuildAnimationTimeout = null;
        return;
      }
      const { l, r, u, depth } = currentTreeBuildOrderData[orderIndex];
      const position = nodePositions.get(u);
      if (!position) {
          orderIndex++;
          activeBuildAnimationTimeout = setTimeout(renderNextNodeWithData, 50);
          return;
      }

      const nodeSegmentData = segmentTreeDataMap.get(u);
      let nodeTextContent = `ID: ${u}<br>[${l}, ${r}]`;

      const showValuesCheckbox = document.getElementById('show-values');
      const shouldShowValues = showValuesCheckbox ? showValuesCheckbox.checked : true;

      if (shouldShowValues && nodeSegmentData) {
          if (nodeSegmentData.isLeaf) {
              nodeTextContent += `<br>Val: ${nodeSegmentData.sum}`;
          } else {
              nodeTextContent += `<br>Sum: ${nodeSegmentData.sum}`;
              nodeTextContent += `<br><span class='node-minmax'>(Min: ${nodeSegmentData.min}, Max: ${nodeSegmentData.max})</span>`;
          }
      }
      
      const nodeDiv = document.createElement('div');
      nodeDiv.className = `tree-node depth-${depth}`;
      nodeDiv.innerHTML = nodeTextContent; // Already contains <br>
      nodeDiv.setAttribute('data-node-id', u);
      
      nodeDiv.style.position = 'absolute';
      nodeDiv.style.left = `${position.x - position.nodeWidth / 2}px`;
      nodeDiv.style.top = `${position.y}px`;
      nodeDiv.style.width = `${position.nodeWidth}px`;
      nodeDiv.style.zIndex = '10';
      // Height will be auto or set by CSS based on content.
      // Ensure .tree-node in CSS allows for variable height or set a larger min-height.
      
      nodeDiv.style.opacity = '0';
      nodeDiv.style.transform = 'translateY(-10px)';
      
      treeVisual.appendChild(nodeDiv);
      domNodeElements.set(u, nodeDiv);
      
      if (depth > 0) addConnectionLine(u, nodePositions, treeVisual);
      
      setTimeout(() => {
        nodeDiv.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        nodeDiv.style.opacity = '1';
        nodeDiv.style.transform = 'translateY(0)';
      }, 50);

      orderIndex++;
      const animationDelay = getAnimationDelay();
      activeBuildAnimationTimeout = setTimeout(renderNextNodeWithData, animationDelay / 6);
    }
    activeBuildAnimationTimeout = setTimeout(renderNextNodeWithData, 500);
  } else { // Resize update for buildTreeVisualizationWithData
    domNodeElements.forEach((nodeDiv, u) => {
      const position = nodePositions.get(u);
      if (position) {
        nodeDiv.style.left = `${position.x - position.nodeWidth / 2}px`;
        nodeDiv.style.top = `${position.y}px`;
        nodeDiv.style.width = `${position.nodeWidth}px`;
      }
    });
     domLineElements.forEach((line, childId) => {
      const parentId = Math.floor(childId / 2);
      const childPos = nodePositions.get(childId);
      const parentPos = nodePositions.get(parentId);
      if (childPos && parentPos && domNodeElements.has(parentId) && domNodeElements.has(childId)) {
        const parentNodeDiv = domNodeElements.get(parentId);
        // const childNodeDiv = domNodeElements.get(childId); // Not strictly needed for line start/end points from center
        const parentStyle = window.getComputedStyle(parentNodeDiv);
        const parentHeight = parseFloat(parentStyle.height);
        
        const lineStartOffsetY = parentHeight / 2; // Start line from vertical center of parent
        const lineEndOffsetY = - (parseFloat(window.getComputedStyle(domNodeElements.get(childId)).height) / 2); // Adjust to aim for child center, approx.

        const deltaX = childPos.x - parentPos.x;
        // Adjust deltaY to go from center of parent to center of child
        const deltaY = (childPos.y ) - (parentPos.y + lineStartOffsetY);


        const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        
        line.style.width = `${length}px`;
        line.style.left = `${parentPos.x}px`;
        line.style.top = `${parentPos.y + lineStartOffsetY}px`;
        line.style.transform = `rotate(${angle}deg)`;
      }
    });
    isTreeRendered = true;
  }
}


// Modified to store line element
function addConnectionLine(nodeId, nodePositions, treeVisual) {
  const parentId = Math.floor(nodeId / 2);
  const childPos = nodePositions.get(nodeId);
  const parentPos = nodePositions.get(parentId);
  
  if (!childPos || !parentPos || !domNodeElements.has(parentId) || !domNodeElements.has(childId)) return;
  
  const parentNodeDiv = domNodeElements.get(parentId);
  // const childNodeDiv = domNodeElements.get(childId); // For child's center

  const parentStyle = window.getComputedStyle(parentNodeDiv);
  const parentHeight = parseFloat(parentStyle.height);
  // const childStyle = window.getComputedStyle(childNodeDiv);
  // const childHeight = parseFloat(childStyle.height);


  const line = document.createElement('div');
  line.className = 'tree-connection-line';
  line.style.position = 'absolute';
  line.style.background = 'var(--primary-color)'; // Solid color for lines
  line.style.zIndex = '5';
  line.style.opacity = '0';
  line.style.borderRadius = '1px';
  
  // Calculate line from center of parent to top-center of child (or approximate center)
  const lineStartOffsetY = parentHeight / 2;
  // const lineEndOffsetY = childPos.y - (parentPos.y + lineStartOffsetY); // y-diff to child's top edge

  const deltaX = childPos.x - parentPos.x;
  // const deltaY = childPos.y - (parentPos.y + lineStartOffsetY); // From parent center to child top
  const deltaY = (childPos.y ) - (parentPos.y + lineStartOffsetY); // More accurate for center-to-center if child y is its center


  const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
  
  line.style.width = `${length}px`;
  line.style.height = '2px';
  line.style.left = `${parentPos.x}px`; // Line starts at parent's x center
  line.style.top = `${parentPos.y + lineStartOffsetY}px`; // Line starts at parent's y center
  line.style.transformOrigin = '0 50%';
  line.style.transform = `rotate(${angle}deg)`;
  
  treeVisual.appendChild(line);
  domLineElements.set(nodeId, line); // Store DOM element for the line

  setTimeout(() => {
    line.style.transition = 'opacity 0.4s ease-in-out';
    line.style.opacity = '0.8';
  }, 200);
}

function getAnimationDelay() {
  const animationSpeed = window.animationSpeed || 'fast'; 
  const speeds = { slow: 2000, normal: 1000, fast: 500 };
  return speeds[animationSpeed] || 1000;
}


// Modified initTreeVisualizer
function initTreeVisualizer() {
  const inputN = document.getElementById('input-n');
  const btnBuild = document.getElementById('btn-build');
  const treeContainer = document.getElementById('tree-container'); // This is the common container
  
  if (btnBuild && treeContainer) {
    btnBuild.addEventListener('click', () => {
      const nVal = parseInt(inputN?.value || '8'); 
      if (nVal >= 1 && nVal <= 8) {
        const containerStyle = window.getComputedStyle(treeContainer);
        if (containerStyle.display !== 'none' && treeContainer.offsetParent !== null) {
            // Call original buildTreeVisualization for the "Basic Operations" section
            buildTreeVisualization(nVal, treeContainer, false); 
        } else {
            alert("请先切换到“基本操作”选项卡并确保其可见，然后再构建树。");
        }
      } else {
        alert('请输入1到8之间的数组长度。');
      }
    });
  }

  // Resize listener needs to know if it's resizing a data-based tree or N-based tree
  window.addEventListener('resize', debounce(() => {
    if (isTreeRendered && lastBuiltContainer) {
      const containerStyle = window.getComputedStyle(lastBuiltContainer);
      if (containerStyle.display !== 'none' && lastBuiltContainer.offsetParent !== null) {
          if (lastBuiltDataArray && lastBuiltDataArray.length > 0) { // Resizing a data-based tree
            buildTreeVisualizationWithData(lastBuiltDataArray, lastBuiltContainer, true);
          } else if (lastBuiltN > 0) { // Resizing an N-based tree
            buildTreeVisualization(lastBuiltN, lastBuiltContainer, true);
          }
      }
    }
  }, 250));
}

// Export functions
window.TreeVisualizer = {
  buildTreeVisualization, 
  buildTreeVisualizationWithData, // Export the new function
  initTreeVisualizer
};

// document.addEventListener('DOMContentLoaded', () => {
//   if (window.TreeVisualizer && window.TreeVisualizer.initTreeVisualizer) {
//     window.TreeVisualizer.initTreeVisualizer();
//   }
// });
