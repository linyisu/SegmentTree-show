/* 线段树可视化模块 */

// --- Start of Adaptive Functionality State ---
let lastBuiltN = 0;
let lastBuiltContainer = null;
let isTreeRendered = false;
let domNodeElements = new Map(); // Stores DOM node elements, keyed by 'u'
let domLineElements = new Map(); // Stores DOM line elements, keyed by child 'u'
let currentTreeLevelsData = [];
let currentTreeBuildOrderData = [];
let activeBuildAnimationTimeout = null; // To cancel ongoing build animation
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

// 线段树可视化 - 基于边界的智能布局算法
function buildTreeVisualization(n, container, isResizeUpdate = false) {
  if (!isResizeUpdate) {
    // This is an initial build or a full rebuild
    lastBuiltN = n;
    lastBuiltContainer = container;
    isTreeRendered = false; // Mark as not rendered until animation completes
    domNodeElements.clear();
    domLineElements.clear();
    currentTreeLevelsData = [];
    currentTreeBuildOrderData = [];

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
    treeVisual.style.borderRadius = '18px';
    treeVisual.style.borderLeft = '5px solid var(--primary-color)';
    treeVisual.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
    treeVisual.style.overflow = 'visible';
    container.appendChild(treeVisual);
  }

  const treeVisual = container.querySelector('.tree-visual');
  if (!treeVisual) {
    console.error("Tree visual element not found.");
    return;
  }

  // Recalculate containerWidth for both initial build and resize
  // clientWidth includes padding if box-sizing is border-box (default for most modern setups)
  // The original code subtracts 50, assuming 25px padding on each side of an inner content area.
  // If treeVisual's padding is 25px, then its clientWidth is the "outer" width.
  // The effective drawing width *inside* the padding is clientWidth - 2*padding_of_treeVisual.
  // However, the original code's `padding` variable (25) seems to be for node positioning *within* this area.
  const containerWidth = treeVisual.clientWidth - (25 + 25); // Available width for nodes, inside treeVisual's padding.

  const nodeMinWidth = 50;
  const levelHeight = 80;
  const nodeHorizontalPadding = 25; // Renamed from 'padding' to avoid confusion

  if (!isResizeUpdate) {
    function calculateActualDepth(num) {
      if (num === 1) return 1;
      return Math.floor(Math.log2(num)) + 1;
    }
    // const actualDepth = calculateActualDepth(n); // Not directly used later, levels.length is used

    currentTreeLevelsData = []; // Clear for new build
    function collectLevels(l, r, u, depth = 0) {
      if (!currentTreeLevelsData[depth]) currentTreeLevelsData[depth] = [];
      currentTreeLevelsData[depth].push({ l, r, u, depth });
      if (l < r) {
        const mid = Math.floor((l + r) / 2);
        collectLevels(l, mid, u * 2, depth + 1);
        collectLevels(mid + 1, r, u * 2 + 1, depth + 1);
      }
    }
    collectLevels(1, n, 1);

    const totalLevels = currentTreeLevelsData.length;
    const baseHeight = 60;
    const calculatedHeight = totalLevels * levelHeight + baseHeight + 40;
    const minHeight = Math.max(200, calculatedHeight);
    treeVisual.style.minHeight = `${minHeight}px`;
    treeVisual.style.height = `${minHeight}px`;
  }
  
  // This nodePositions map is recalculated for every build/resize
  const nodePositions = new Map();

  // Calculate node positions (uses currentTreeLevelsData)
  function calculateNodePositionsInternal(l, r, u, depth = 0, leftBound = 0, rightBound = containerWidth, parentWidth = null) {
    const y = depth * levelHeight + 30;
    const isLeafLevel = (depth === currentTreeLevelsData.length - 1);
    const nodesInCurrentLevel = currentTreeLevelsData[depth] ? currentTreeLevelsData[depth].length : 0;
    // const totalNodesPossibleInLevel = Math.pow(2, depth); // Original, might not be accurate for non-full trees if used for width division

    let x, nodeWidth;

    if (isLeafLevel) {
      if (parentWidth) {
        nodeWidth = parentWidth / 2;
      } else { // Root is also a leaf if n=1
        nodeWidth = Math.max(nodeMinWidth, (containerWidth - 2 * nodeHorizontalPadding) / (nodesInCurrentLevel || 1) );
      }
      
      const parentU = Math.floor(u / 2);
      const isLeftChild = (u % 2 === 0);
      const parentPos = nodePositions.get(parentU); // Relies on parent being processed first or available

      if (u === 1) { // Special case for n=1, root is a leaf
          x = containerWidth / 2; // Centered
      } else if (parentPos && parentWidth) { // Ensure parentPos and parentWidth are valid
          if (isLeftChild) {
            const leftHalfCenter = parentPos.x - parentWidth / 4;
            x = Math.max(nodeHorizontalPadding + nodeWidth / 2, leftHalfCenter);
          } else {
            const rightHalfCenter = parentPos.x + parentWidth / 4;
            x = Math.min(containerWidth - nodeHorizontalPadding - nodeWidth / 2, rightHalfCenter);
          }
      } else { // Fallback if parent info is not as expected (e.g. for root's children if parentWidth wasn't passed correctly for root)
          // This part of original logic might need robust handling if parentWidth for root's children is tricky
          // Simplified: divide the available space for this level
          const nodeIndexInLevel = currentTreeLevelsData[depth].findIndex(node => node.u === u);
          const spacePerNode = (containerWidth - 2 * nodeHorizontalPadding) / nodesInCurrentLevel;
          x = nodeHorizontalPadding + spacePerNode * (nodeIndexInLevel + 0.5);
          // nodeWidth was already set above for leaf level
      }

    } else { // Non-leaf level
      if (nodesInCurrentLevel === 1 && u === 1) { // Root node, not a leaf
        nodeWidth = containerWidth - 2 * nodeHorizontalPadding;
        x = containerWidth / 2;
      } else {
        // Distribute width among nodes in this level based on their bounds
        // This part of original logic is complex. Let's use a simpler distribution for non-leaf nodes for now.
        // The bounds (leftBound, rightBound) passed recursively are more reliable.
        nodeWidth = (rightBound - leftBound) * 0.8; // Example: node takes 80% of its allocated slot width
        nodeWidth = Math.max(nodeMinWidth, nodeWidth);
        x = leftBound + (rightBound - leftBound) / 2; // Center in its allocated slot
      }
    }
    
    nodeWidth = Math.max(nodeMinWidth, nodeWidth); // Ensure min width
    // Ensure node does not exceed its bounds, adjust x if necessary
    if (x - nodeWidth / 2 < leftBound) x = leftBound + nodeWidth / 2;
    if (x + nodeWidth / 2 > rightBound) x = rightBound - nodeWidth / 2;


    nodePositions.set(u, { x, y, l, r, depth, nodeWidth, leftBound, rightBound });

    if (l < r) {
      const mid = Math.floor((l + r) / 2);
      const childLeftBound = leftBound;
      const childMidPoint = leftBound + (rightBound - leftBound) / 2; // Midpoint of current node's bounds
      const childRightBound = rightBound;
      
      calculateNodePositionsInternal(l, mid, u * 2, depth + 1, childLeftBound, childMidPoint, nodeWidth);
      calculateNodePositionsInternal(mid + 1, r, u * 2 + 1, depth + 1, childMidPoint, childRightBound, nodeWidth);
    }
  }
  calculateNodePositionsInternal(1, n, 1, 0, 0, containerWidth, null);
  
  function ensureBoundariesInternal() {
    nodePositions.forEach((pos) => {
      const halfW = pos.nodeWidth / 2;
      if (pos.x - halfW < nodeHorizontalPadding) { // Check against outer padding
        pos.x = nodeHorizontalPadding + halfW;
      }
      if (pos.x + halfW > containerWidth - nodeHorizontalPadding) { // Check against outer padding
        pos.x = containerWidth - nodeHorizontalPadding - halfW;
      }
    });
  }
  ensureBoundariesInternal();

  if (!isResizeUpdate) {
    currentTreeBuildOrderData = []; // Clear for new build
    function generateBuildOrder(l, r, u, depth = 0) {
      currentTreeBuildOrderData.push({ l, r, u, depth });
      if (l < r) {
        const mid = Math.floor((l + r) / 2);
        generateBuildOrder(l, mid, u * 2, depth + 1);
        generateBuildOrder(mid + 1, r, u * 2 + 1, depth + 1);
      }
    }
    generateBuildOrder(1, n, 1);

    let orderIndex = 0;
    function renderNextNode() {
      if (orderIndex >= currentTreeBuildOrderData.length) {
        isTreeRendered = true; // Mark as fully rendered
        activeBuildAnimationTimeout = null;
        return;
      }

      const { l, r, u, depth } = currentTreeBuildOrderData[orderIndex];
      const position = nodePositions.get(u);
      if (!position) { // Should not happen if logic is correct
          orderIndex++;
          activeBuildAnimationTimeout = setTimeout(renderNextNode, 50); // Skip and continue
          return;
      }
      const nodeInfo = `${u}\\n[${l},${r}]`;
      
      const nodeDiv = document.createElement('div');
      nodeDiv.className = `tree-node depth-${depth}`;
      nodeDiv.textContent = nodeInfo;
      nodeDiv.setAttribute('data-node-id', u);
      
      nodeDiv.style.position = 'absolute';
      nodeDiv.style.left = `${position.x - position.nodeWidth / 2}px`;
      nodeDiv.style.top = `${position.y}px`;
      nodeDiv.style.width = `${position.nodeWidth}px`;
      nodeDiv.style.zIndex = '10';
      
      const nodeColor = window.nodeColor || '#74b9ff';
      if (nodeColor !== '#74b9ff') {
        nodeDiv.style.background = nodeColor;
      }
      
      nodeDiv.style.opacity = '0';
      nodeDiv.style.transform = 'translateY(-10px)';
      
      treeVisual.appendChild(nodeDiv);
      domNodeElements.set(u, nodeDiv); // Store DOM element
      
      if (depth > 0) {
        addConnectionLine(u, nodePositions, treeVisual); // This will also store the line in domLineElements
      }
      
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

    domLineElements.forEach((line, childId) => {
      const parentId = Math.floor(childId / 2);
      const childPos = nodePositions.get(childId);
      const parentPos = nodePositions.get(parentId);
      if (childPos && parentPos) {
        const deltaX = childPos.x - parentPos.x;
        const deltaY = childPos.y - parentPos.y - 35;
        const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        
        line.style.width = `${length}px`;
        line.style.left = `${parentPos.x}px`;
        line.style.top = `${parentPos.y + 35}px`;
        line.style.transform = `rotate(${angle}deg)`;
      }
    });
    isTreeRendered = true; // Ensure flag is set after resize update
  }
}

// Modified to store line element
function addConnectionLine(nodeId, nodePositions, treeVisual) {
  const parentId = Math.floor(nodeId / 2);
  const childPos = nodePositions.get(nodeId);
  const parentPos = nodePositions.get(parentId);
  
  if (!childPos || !parentPos) return;
  
  const line = document.createElement('div');
  line.className = 'tree-connection-line';
  line.style.position = 'absolute';
  line.style.background = 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))';
  line.style.zIndex = '5';
  line.style.opacity = '0';
  line.style.borderRadius = '1px';
  
  const deltaX = childPos.x - parentPos.x;
  const deltaY = childPos.y - parentPos.y - 35; 
  const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
  
  line.style.width = `${length}px`;
  line.style.height = '2px';
  line.style.left = `${parentPos.x}px`;
  line.style.top = `${parentPos.y + 35}px`;
  line.style.transformOrigin = '0 50%';
  line.style.transform = `rotate(${angle}deg)`;
  
  treeVisual.appendChild(line);
  domLineElements.set(nodeId, line); // Store DOM element for the line

  setTimeout(() => {
    line.style.transition = 'opacity 0.4s ease-in-out';
    line.style.opacity = '0.8';
  }, 200);
}

// 获取动画延迟
function getAnimationDelay() {
  const animationSpeed = window.animationSpeed || 'fast'; // Assuming animationSpeed might be set globally
  const speeds = { slow: 2000, normal: 1000, fast: 500 };
  return speeds[animationSpeed] || 1000;
}


// Modified initTreeVisualizer
function initTreeVisualizer() {
  const inputN = document.getElementById('input-n');
  const btnBuild = document.getElementById('btn-build');
  const treeContainer = document.getElementById('tree-container');
  
  if (btnBuild && treeContainer) {
    btnBuild.addEventListener('click', () => {
      const n = parseInt(inputN?.value || '8'); // Default to 8 if input is empty
      if (n >= 1 && n <= 8) {
         // Check if the container is visible before building
        const containerStyle = window.getComputedStyle(treeContainer);
        if (containerStyle.display !== 'none' && treeContainer.offsetParent !== null) {
            buildTreeVisualization(n, treeContainer, false); // false for initial build
        } else {
            alert("请先切换到“基本操作”选项卡并确保其可见，然后再构建树。");
        }
      } else {
        alert('请输入1到8之间的数组长度。');
      }
    });
  }

  window.addEventListener('resize', debounce(() => {
    if (isTreeRendered && lastBuiltContainer && lastBuiltN > 0) {
      // Check visibility before redrawing on resize
      const containerStyle = window.getComputedStyle(lastBuiltContainer);
      if (containerStyle.display !== 'none' && lastBuiltContainer.offsetParent !== null) {
          buildTreeVisualization(lastBuiltN, lastBuiltContainer, true); // true for resize update
      }
    }
  }, 250));
}

// Export functions
window.TreeVisualizer = {
  buildTreeVisualization, // Might not be needed externally if only init is called
  initTreeVisualizer
};

// Ensure init is called (e.g. from main.js or at the end of the script if appropriate)
// document.addEventListener('DOMContentLoaded', () => {
//   if (window.TreeVisualizer && window.TreeVisualizer.initTreeVisualizer) {
//     window.TreeVisualizer.initTreeVisualizer();
//   }
// });