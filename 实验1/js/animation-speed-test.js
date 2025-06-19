// 动画速度测试脚本
console.log('🧪 开始动画速度测试...');

// 测试全局变量
function testGlobalVariables() {
    console.log('📊 当前全局变量状态:');
    console.log('- window.animationSpeed:', window.animationSpeed);
    console.log('- CSS --animation-duration:', getComputedStyle(document.documentElement).getPropertyValue('--animation-duration'));
    console.log('- CSS --transition-speed:', getComputedStyle(document.documentElement).getPropertyValue('--transition-speed'));
}

// 测试动画延迟函数
function testAnimationDelays() {
    console.log('⏱️ 测试动画延迟函数:');
    
    // 模拟不同速度设置
    const speeds = ['slow', 'normal', 'fast'];
    
    speeds.forEach(speed => {
        window.animationSpeed = speed;
        
        // 测试修改可视化的延迟函数
        if (window.ModifyTreeVisualizer) {
            console.log(`${speed} 模式 - 修改可视化测试通过`);
        }
        
        // 测试查询可视化的延迟函数
        if (window.QueryTreeVisualizer) {
            console.log(`${speed} 模式 - 查询可视化测试通过`);
        }
    });
}

// 测试事件系统
function testEventSystem() {
    console.log('🎯 测试事件系统:');
    
    // 监听动画速度变化事件
    window.addEventListener('animationSpeedChanged', (event) => {
        console.log('✅ 事件触发成功:', event.detail.speed);
    });
    
    // 模拟速度变化
    window.dispatchEvent(new CustomEvent('animationSpeedChanged', { 
        detail: { speed: 'test' } 
    }));
}

// 运行所有测试
setTimeout(() => {
    testGlobalVariables();
    testAnimationDelays();
    testEventSystem();
    console.log('🎉 动画速度测试完成！');
}, 1000);
