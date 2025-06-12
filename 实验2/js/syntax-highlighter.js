// 语法高亮器
const SyntaxHighlighter = {
  // 正则表达式规则
  rules: {
    commentSingle: /(\/\/.*?)(\n|$)/g,
    commentMulti: /(\/\*[\s\S]*?\*\/)/g,
    strings: /("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')/g,
    numbers: /\b(\d+)\b/g,
    operators: /(<<|>>|<=|>=|==|!=|&&|\|\||[+\-*%=!&|^~<>])/g,
    functions: /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g,
    brackets: /([(){}\[\]])/g,
    symbols: /([;,.:])/g,
    pointers: /(\*|&)(?=\s*[a-zA-Z_])/g,
    preprocessor: /(#\w+)/g
  },

  // 初始化语法高亮
  init() {
    this.applyHighlighting();
    this.setupLazyHighlighting();
  },

  // 立即应用语法高亮
  applyHighlighting() {
    const codeBlocks = DOMManager.get('codeBlocks');
    if (!codeBlocks) return;

    codeBlocks.forEach(block => {
      if (!block.hasAttribute('data-highlighted')) {
        this.highlightBlock(block);
        block.setAttribute('data-highlighted', 'true');
      }
    });
  },

  // 高亮单个代码块
  highlightBlock(block) {
    const code = block.textContent || block.innerText;
    const highlightedCode = this.highlightCode(code);
    block.innerHTML = highlightedCode;
  },

  // 核心高亮函数
  highlightCode(code) {
    // 保护字符串和注释
    let protectedItems = [];
    let protectedIndex = 0;

    const saveItem = (content, type) => {
      const placeholder = `__PROTECTED_${protectedIndex++}__`;
      protectedItems.push({ placeholder, content, type });
      return placeholder;
    };

    // 1. 保护字符串
    code = code.replace(this.rules.strings, (match) => {
      return saveItem(match, 'string');
    });

    // 2. 保护注释
    code = code.replace(this.rules.commentSingle, (match, comment, ending) => {
      return saveItem(comment, 'comment') + ending;
    });
    code = code.replace(this.rules.commentMulti, (match) => {
      return saveItem(match, 'comment');
    });

    // 3. 保护预处理指令
    code = code.replace(this.rules.preprocessor, (match) => {
      return saveItem(match, 'preprocessor');
    });

    // 4. 应用语法高亮
    code = this.tokenizeAndHighlight(code);

    // 5. 恢复保护的内容
    let finalCode = code;
    for (let i = protectedItems.length - 1; i >= 0; i--) {
      const item = protectedItems[i];
      const highlightedContent = `<span class="${item.type}">${this.escapeHtml(item.content)}</span>`;
      finalCode = finalCode.replace(item.placeholder, highlightedContent);
    }

    return `<code>${finalCode}</code>`;
  },

  // 分词和高亮
  tokenizeAndHighlight(text) {
    const tokens = this.tokenize(text);
    return tokens.map(token => this.processTextToken(token)).join('');
  },

  // 简单分词
  tokenize(text) {
    const tokenPattern = /\b\w+\b|[^\w\s]|\s+/g;
    return text.match(tokenPattern) || [];
  },

  // 处理文本token
  processTextToken(token) {
    // 跳过空白字符
    if (/^\s+$/.test(token)) {
      return token;
    }

    // 关键字
    if (CONFIG.HIGHLIGHT_RULES.keywords.includes(token)) {
      return `<span class="keyword">${token}</span>`;
    }

    // 类型
    if (CONFIG.HIGHLIGHT_RULES.types.includes(token)) {
      return `<span class="type">${token}</span>`;
    }

    // 常用变量
    if (CONFIG.HIGHLIGHT_RULES.commonVars.includes(token)) {
      return `<span class="variable">${token}</span>`;
    }

    // 函数名
    if (CONFIG.HIGHLIGHT_RULES.functions.includes(token)) {
      return `<span class="function">${token}</span>`;
    }

    // 数字
    if (/^\d+$/.test(token)) {
      return `<span class="number">${token}</span>`;
    }

    // 操作符
    if (/^(<<|>>|<=|>=|==|!=|&&|\|\||[+\-*%=!&|^~<>])$/.test(token)) {
      return `<span class="operator">${token}</span>`;
    }

    // 括号
    if (/^[(){}\[\]]$/.test(token)) {
      return `<span class="bracket">${token}</span>`;
    }

    // 符号
    if (/^[;,.:]$/.test(token)) {
      return `<span class="symbol">${token}</span>`;
    }

    // 指针
    if (/^[*&]$/.test(token)) {
      return `<span class="pointer">${token}</span>`;
    }

    return token;
  },

  // HTML转义
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // 延迟加载语法高亮
  setupLazyHighlighting() {
    if (!('IntersectionObserver' in window)) {
      return; // 不支持IntersectionObserver的浏览器
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const block = entry.target;
          if (!block.hasAttribute('data-highlighted')) {
            this.highlightBlock(block);
            block.setAttribute('data-highlighted', 'true');
          }
          observer.unobserve(block);
        }
      });
    }, { threshold: 0.1 });

    // 监听新添加的代码块
    const observer2 = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const codeBlocks = node.querySelectorAll ? 
              node.querySelectorAll('.code-block:not([data-observed])') : 
              (node.matches && node.matches('.code-block:not([data-observed])') ? [node] : []);
            
            codeBlocks.forEach(block => {
              observer.observe(block);
              block.setAttribute('data-observed', 'true');
            });
          }
        });
      });
    });

    observer2.observe(document.body, { childList: true, subtree: true });
  },

  // 重新高亮所有代码块
  rehighlightAll() {
    const codeBlocks = document.querySelectorAll('.code-block');
    codeBlocks.forEach(block => {
      block.removeAttribute('data-highlighted');
      this.highlightBlock(block);
    });
  },

  // 高亮特定代码块
  highlightSpecific(selector) {
    const blocks = document.querySelectorAll(selector);
    blocks.forEach(block => {
      this.highlightBlock(block);
    });
  }
};

// 导出语法高亮器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SyntaxHighlighter;
}
