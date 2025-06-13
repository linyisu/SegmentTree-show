// js/dataUpdater.js

document.addEventListener('DOMContentLoaded', () => {
    const inputCustomData = document.getElementById('input-custom-data');
    const btnUpdateCustomData = document.getElementById('btn-update-custom-data');
    const treeContainer = document.getElementById('tree-container'); // Assuming this is where the tree is visualized

    const statMax = document.getElementById('stat-max');
    const statMin = document.getElementById('stat-min');
    const statSum = document.getElementById('stat-sum');

    if (btnUpdateCustomData && inputCustomData && treeContainer && statMax && statMin && statSum) {
        btnUpdateCustomData.addEventListener('click', () => {
            const dataString = inputCustomData.value.trim();
            if (!dataString) {
                alert('请输入数据！');
                return;
            }

            const dataArray = dataString.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));

            if (dataArray.length === 0) {
                alert('请输入有效的数字数据！例如: 1, 5, 3, 7, 2, 8');
                return;
            }
            
            if (dataArray.length > 8) {
                alert('目前演示支持最多8个数据点。');
                return;
            }

            // 1. 更新统计数据
            const maxVal = Math.max(...dataArray);
            const minVal = Math.min(...dataArray);
            const sumVal = dataArray.reduce((acc, curr) => acc + curr, 0);

            statMax.textContent = maxVal;
            statMin.textContent = minVal;
            statSum.textContent = sumVal;

            // 2. (可选) 清除旧的基于长度的树（如果存在）
            // treeContainer.innerHTML = ''; // Or a more specific clearing if needed
            
            // 3. 调用线段树可视化函数 (这里假设它能接受一个数组)
            // 您需要修改 buildTreeVisualization 或创建一个新函数来处理自定义数据数组
            // 而不仅仅是长度 n。
            // For now, let's assume buildTreeVisualization can take an array
            // or you'll adapt it. If it only takes 'n', we'll use the array's length.
            if (window.TreeVisualizer && window.TreeVisualizer.buildTreeVisualizationWithData) {
                // Ideal: a function that takes the actual data
                window.TreeVisualizer.buildTreeVisualizationWithData(dataArray, treeContainer);
            } else if (window.TreeVisualizer && window.TreeVisualizer.buildTreeVisualization) {
                // Fallback: use length, but this won't show custom values in nodes
                // This part will need significant changes in treeVisualizer.js
                // to actually use the dataArray values within the segment tree nodes.
                alert('注意: 当前可视化将基于数据长度构建，节点内容可能不会反映输入值。需要修改 treeVisualizer.js 以支持数据内容。');
                window.TreeVisualizer.buildTreeVisualization(dataArray.length, treeContainer, false);
            } else {
                console.error('TreeVisualizer or buildTreeVisualization function not found.');
                alert('可视化功能未找到！');
            }
        });
    } else {
        console.warn('One or more elements for custom data input/stats were not found.');
    }
});
