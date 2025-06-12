# 线段树学习平台 - 模块化版本

## 📁 项目结构

这个项目已经从单文件HTML应用重构为模块化的多文件结构，便于维护和扩展。

```
实验2/
├── index.html                    # 主HTML文件（入口）
├── README.md                     # 项目说明文档
├── 代码高亮正确 - 副本.html       # 原始单文件版本（备份）
├── css/                          # 样式文件目录
│   ├── variables.css             # CSS变量定义
│   ├── base.css                  # 基础样式
│   ├── themes.css                # 主题系统
│   ├── components.css            # 组件样式
│   ├── layout.css                # 布局样式
│   ├── tree-visualization.css    # 树形可视化样式
│   ├── syntax-highlighting.css   # 代码高亮样式
│   └── responsive.css            # 响应式设计
└── js/                           # JavaScript文件目录
    ├── config.js                 # 配置文件
    ├── utils.js                  # 工具函数
    ├── dom-manager.js            # DOM管理器
    ├── theme-manager.js          # 主题管理器
    ├── syntax-highlighter.js     # 语法高亮器
    ├── tree-visualizer.js        # 树形可视化器
    ├── settings-manager.js       # 设置管理器
    ├── quiz-manager.js           # 测验管理器
    ├── navigation.js             # 导航管理器
    └── app.js                    # 主应用入口
```

## 🔧 模块说明

### CSS模块

- **variables.css**: 定义所有CSS变量，包括颜色、尺寸等
- **base.css**: 基础样式，包括重置样式和通用样式
- **themes.css**: 三级主题系统（白天/黑夜/护眼模式）
- **components.css**: 组件样式（按钮、卡片、设置面板等）
- **layout.css**: 布局样式（头部、导航、主内容区）
- **tree-visualization.css**: 树形可视化专用样式
- **syntax-highlighting.css**: 代码语法高亮样式
- **responsive.css**: 响应式设计和媒体查询

### JavaScript模块

- **config.js**: 全局配置，包括动画速度、题目答案、默认设置等
- **utils.js**: 通用工具函数，包括防抖、节流、文件操作等
- **dom-manager.js**: DOM元素缓存和操作管理
- **theme-manager.js**: 主题切换和管理
- **syntax-highlighter.js**: C++语法高亮实现
- **tree-visualizer.js**: 线段树构建可视化
- **settings-manager.js**: 用户设置管理（字体、颜色等）
- **quiz-manager.js**: 测验系统管理
- **navigation.js**: 页面导航和路由管理
- **app.js**: 应用主入口，协调所有模块

## 🚀 功能特性

### 📚 学习内容
- 线段树基本概念介绍
- 构建、查询、更新操作详解
- 懒惰标记、可持久化、权值线段树等高级技巧
- 交互式测验系统

### 🎨 界面特性
- 三级主题切换（白天/黑夜/护眼）
- 语法高亮的代码展示
- 响应式设计，支持多种设备
- 树形结构动态可视化

### ⚙️ 自定义功能
- 代码字体大小和行高调节
- 动画速度控制
- 节点颜色自定义
- 设置导出/导入

### 🔧 技术特性
- 模块化架构，便于维护
- 事件驱动的模块通信
- 本地存储保存用户设置
- 错误处理和兼容性检查

## 🎯 使用方法

1. **直接打开**: 在浏览器中打开 `index.html` 即可使用
2. **本地服务器**: 推荐使用本地HTTP服务器运行以获得最佳体验
3. **在线部署**: 可直接部署到任何静态文件托管服务

## 🛠️ 开发说明

### 添加新功能
1. 在对应的模块文件中添加新功能
2. 在 `config.js` 中添加相关配置
3. 在 `app.js` 中注册新模块（如需要）

### 修改样式
1. 优先修改 `variables.css` 中的变量
2. 在对应的样式文件中添加新样式
3. 考虑多主题兼容性

### 调试工具
应用在全局 `window.SegmentTreeApp` 对象中暴露了所有模块，便于调试：

```javascript
// 浏览器控制台中可用
SegmentTreeApp.ThemeManager.switchTheme('dark');
SegmentTreeApp.NavigationManager.showSection('quiz');
console.log(SegmentTreeApp.SettingsManager.getAllSettings());
```

## 📝 版本历史

- **v1.0** - 单文件HTML版本
- **v2.0** - 模块化重构版本（当前）

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 发起 Pull Request

## 📄 许可证

MIT License - 详见 LICENSE 文件

## 🔗 相关链接

- [线段树详解](https://oi-wiki.org/ds/seg/)
- [JavaScript模块化开发](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [CSS变量使用指南](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
