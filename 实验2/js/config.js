// 应用配置文件
const CONFIG = {
  // 动画速度配置
  ANIMATION_SPEEDS: {
    slow: 2000,
    normal: 1000,
    fast: 500
  },
  
  // 树形可视化配置
  TREE: {
    MIN_N: 1,
    MAX_N: 8,
    NODE_MIN_WIDTH: 50,
    LEVEL_HEIGHT: 80,
    PADDING: 25
  },
  
  // 语法高亮规则
  HIGHLIGHT_RULES: {
    keywords: [
      'void', 'int', 'if', 'else', 'for', 'while', 'do', 'return', 
      'struct', 'class', 'public', 'private', 'protected', 'const', 
      'static', 'bool', 'char', 'double', 'float', 'long', 'short', 
      'unsigned', 'signed', 'auto', 'break', 'continue', 'switch', 
      'case', 'default', 'namespace', 'using', 'include', 'define', 
      'ifdef', 'ifndef', 'endif', 'typedef', 'sizeof'
    ],
    types: [
      'Info', 'Node', 'vector', 'string', 'pair', 'map', 'set', 
      'queue', 'stack', 'priority_queue', 'MAXN'
    ],
    commonVars: [
      'info', 'lazy', 'tree', 'arr', 'a', 'n', 'l', 'r', 'u', 
      'mid', 'val', 'pos', 'ql', 'qr', 'res', 'sum', 'lc', 'rc', 
      'tot', 'pre', 'k'
    ],
    functions: [
      'build', 'query', 'update', 'modify', 'push_up', 'push_down', 
      'insert', 'kth'
    ]
  },
  
  // 测验答案
  QUIZ_ANSWERS: {
    q1: 'b', // O(log n)
    q2: 'c', // O(4n)
    q3: 'b'  // 优化区间修改操作
  },
  
  // 默认设置
  DEFAULT_SETTINGS: {
    theme: 'light',
    fontSize: 14,
    lineHeight: 1.6,
    animationSpeed: 'fast',
    nodeColor: '#74b9ff',
    showValues: true
  },
  
  // 本地存储键名
  STORAGE_KEYS: {
    theme: 'theme',
    settings: 'segmentTreeSettings'
  }
};

// 导出配置（如果在模块环境中）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
