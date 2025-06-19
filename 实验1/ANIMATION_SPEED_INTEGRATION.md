# 动画速度集成说明

## 功能概述
本次更新实现了动画速度、可视化设置和全局设置的完整集成，用户现在可以通过设置面板统一控制所有动画的速度。

## 主要改进

### 1. 设置系统增强 (`js/settings.js`)
- 添加了动画速度变化事件广播
- 新增 `updateAnimationVariables()` 函数来同步CSS变量
- 确保设置加载时正确初始化动画变量
- 动画速度设置现在会立即生效

### 2. CSS变量系统 (`styles/main.css`)
- 添加了 `--animation-duration` 和 `--transition-speed` CSS变量
- 支持三种速度：慢速(1.0s/0.6s)、正常(0.5s/0.3s)、快速(0.2s/0.15s)
- 全局动画现在响应用户设置

### 3. 可视化模块集成

#### 修改可视化 (`js/generate_Visualizer_modify.js`)
- 添加 `getAnimationDelay()` 和 `getBuildAnimationDelay()` 函数
- 构建动画延迟现在使用设置中的速度
- 直接修改和步进修改的动画都响应速度设置
- 添加了动画速度变化事件监听器

#### 查询可视化 (`js/generate_Visualizer_query.js` 和 `js/generate_Visualizer_query_fixed.js`)
- 添加了相同的动画速度功能
- 确保查询步进过程的动画响应设置

#### 树可视化 (`js/treeVisualizer.js`)
- 修正了动画延迟函数，默认使用'normal'速度
- 确保与全局设置一致

### 4. 组件样式更新 (`styles/components.css`)
- 按钮过渡动画现在使用 `var(--transition-speed)`
- 确保UI元素动画响应全局设置

## 动画速度映射

| 设置值 | 构建延迟 | 步进延迟 | CSS动画 | CSS过渡 |
|--------|----------|----------|---------|---------|
| slow   | 200ms    | 1000ms   | 1.0s    | 0.6s    |
| normal | 100ms    | 500ms    | 0.5s    | 0.3s    |
| fast   | 50ms     | 200ms    | 0.2s    | 0.15s   |

## 使用方法
1. 打开设置面板
2. 在"可视化设置"部分找到"动画速度"选项
3. 选择所需速度：🐌 慢速、🚀 正常、⚡ 快速
4. 所有动画将立即响应新设置

## 技术细节
- 使用事件系统 (`animationSpeedChanged`) 在模块间通信
- CSS变量确保样式统一性
- 防抖函数优化性能
- 向后兼容，默认使用正常速度

## 受影响的功能
- 线段树构建动画
- 区间修改步进过程
- 区间查询步进过程
- 按钮悬停效果
- 进度条动画
- 节点高亮效果
