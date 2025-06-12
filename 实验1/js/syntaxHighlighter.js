/* 语法高亮功能模块 */

// 语法高亮规则
const highlightRules = {
  keywords: ['void', 'int', 'if', 'else', 'for', 'while', 'do', 'return', 'struct', 'class', 'public', 'private', 'protected', 'const', 'static', 'bool', 'char', 'double', 'float', 'long', 'short', 'unsigned', 'signed', 'auto', 'break', 'continue', 'switch', 'case', 'default', 'namespace', 'using', 'include', 'define', 'ifdef', 'ifndef', 'endif'],
  types: ['Info', 'Node', 'vector', 'string', 'pair', 'map', 'set', 'queue', 'stack', 'priority_queue'],
  commentSingle: /(\/\/.*?)(\n|$)/g,
  commentMulti: /(\/\*[\s\S]*?\*\/)/g,
  strings: /("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')/g,
  numbers: /\b(\d+)\b/g,
  operators: /\b(<<|>>|<=|>=|==|!=|&&|\|\||[+\-*%=!&|^~<>/])\b/g,
  functions: /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g
};

// C++ 语法高亮函数
function highlightCode(code) {
  // 缓存正则表达式
  const regexCache = {
    escape: /[&<>]/g,
    commentSingle: highlightRules.commentSingle,
    commentMulti: highlightRules.commentMulti,
    strings: highlightRules.strings,
    numbers: highlightRules.numbers,
    operators: highlightRules.operators
  };

  // HTML 转义映射
  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;'
  };

  // 转义 HTML 特殊字符
  code = code.replace(regexCache.escape, match => escapeMap[match]);

  let commentIndex = 0;
  const protectedComments = {};

  // 保护单行注释
  code = code.replace(regexCache.commentSingle, (match, comment, ending) => {
    const placeholder = `__COMMENT_${commentIndex}__`;
    protectedComments[commentIndex++] = `<span class="comment">${comment}</span>`;
    return placeholder + ending;
  });

  // 保护多行注释
  code = code.replace(regexCache.commentMulti, (match) => {
    const placeholder = `__COMMENT_${commentIndex}__`;
    protectedComments[commentIndex++] = `<span class="comment">${match}</span>`;
    return placeholder;
  });

  // 高亮字符串
  code = code.replace(regexCache.strings, '<span class="string">$1</span>');

  // 高亮数字
  code = code.replace(regexCache.numbers, '<span class="number">$1</span>');

  // 高亮关键字
  highlightRules.keywords.forEach(keyword => {
    code = code.replace(new RegExp(`\\b${keyword}\\b(?![^<]*</span>)`, 'g'), `<span class="keyword">${keyword}</span>`);
  });

  // 高亮类型
  highlightRules.types.forEach(type => {
    code = code.replace(new RegExp(`\\b${type}\\b(?![^<]*</span>)`, 'g'), `<span class="type">${type}</span>`);
  });

  // 高亮函数名
  code = code.replace(highlightRules.functions, '<span class="function">$1</span>');

  // 高亮运算符
  code = code.replace(regexCache.operators, '<span class="operator">$1</span>');

  // 恢复注释
  for (const [index, comment] of Object.entries(protectedComments)) {
    code = code.replace(`__COMMENT_${index}__`, comment);
  }

  return code;
}

// 立即应用语法高亮
function applyHighlighting() {
  document.querySelectorAll('.code-block').forEach(block => {
    if (!block.dataset.originalCode) {
      block.dataset.originalCode = block.textContent;
    }
    if (!block.dataset.highlighted) {
      // 确保主题类被正确应用
      if (!block.classList.contains('dark') && !block.classList.contains('light') && 
          !block.classList.contains('monokai') && !block.classList.contains('github')) {
        block.classList.add(window.currentTheme || 'dark');
      }
      block.innerHTML = highlightCode(block.dataset.originalCode);
      block.dataset.highlighted = true;
    }
  });
}

// 延迟加载语法高亮（用于动态添加的代码块）
function setupLazyHighlighting() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const block = entry.target;
        if (!block.dataset.highlighted) {
          block.innerHTML = highlightCode(block.dataset.originalCode || block.textContent);
          block.dataset.highlighted = true;
        }
      }
    });
  }, { threshold: 0.1 });

  // 监听新添加的代码块
  const newBlocks = document.querySelectorAll('.code-block:not([data-observed])');
  newBlocks.forEach(block => {
    if (!block.dataset.originalCode) {
      block.dataset.originalCode = block.textContent;
    }
    block.dataset.observed = 'true';
    observer.observe(block);
  });
}

// 导出函数供其他模块使用
window.SyntaxHighlighter = {
  highlightCode,
  applyHighlighting,
  setupLazyHighlighting
};
