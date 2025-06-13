/* 语法高亮功能模块 */

// 语法高亮规则 (来自附件)
const highlightRules = {
  keywords: ['void', 'int', 'if', 'else', 'for', 'while', 'do', 'return', 'struct', 'class', 'public', 'private', 'protected', 'const', 'static', 'bool', 'char', 'double', 'float', 'long', 'short', 'unsigned', 'signed', 'auto', 'break', 'continue', 'switch', 'case', 'default', 'namespace', 'using', 'include', 'define', 'ifdef', 'ifndef', 'endif', 'typedef', 'sizeof'],
  types: ['Info', 'Node', 'vector', 'string', 'pair', 'map', 'set', 'queue', 'stack', 'priority_queue', 'MAXN'],
  commonVars: ['info', 'lazy', 'tree', 'arr', 'a', 'n', 'l', 'r', 'u', 'mid', 'val', 'pos', 'ql', 'qr', 'res', 'sum', 'lc', 'rc', 'tot', 'pre', 'k'],
  commentSingle: /(\/\/.*?)(\n|$)/g,
  commentMulti: /(\/\*[\s\S]*?\*\/)/g,
  strings: /("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')/g,
  numbers: /\b(\d+)\b/g,
  operators: /(<<|>>|<=|>=|==|!=|&&|\|\||[+\-*%=!&|^~<>])/g,
  functions: /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g,
  brackets: /([(){}\[\]])/g,
  symbols: /([;,.:?])/g, // Adjusted to include '?' as per attachment's tokenizer logic
  pointers: /(\*|&)(?=\s*[a-zA-Z_])/g,
  preprocessor: /(#\w+)/g
};

// C++ 语法高亮函数 - 精细高亮每个语法元素 (来自附件)
function highlightCode(code) {
  // 预处理：保护字符串和注释
  let protectedItems = [];
  let protectedIndex = 0;
  
  function saveItem(content, type) {
    const placeholder = `__PROTECTED_${protectedIndex}__`;
    protectedItems[protectedIndex] = {
      placeholder: placeholder,
      content: `<span class="${type}">${content}</span>`,
      original: content
    };
    protectedIndex++;
    return placeholder;
  }

  // 1. 保护字符串
  code = code.replace(highlightRules.strings, (match) => {
    return saveItem(match, 'string');
  });

  // 2. 保护注释
  code = code.replace(highlightRules.commentSingle, (match, comment, ending) => {
    return saveItem(comment, 'comment') + ending;
  });
  code = code.replace(highlightRules.commentMulti, (match) => {
    return saveItem(match, 'comment');
  });

  // 3. 保护预处理指令
  code = code.replace(highlightRules.preprocessor, (match) => {
    return saveItem(match, 'preprocessor');
  });

  // 精细化token处理 - 逐字符分析
  function tokenizeAndHighlight(text) {
    const tokens = [];
    let current = '';
    let i = 0;

    while (i < text.length) {
      const char = text[i];
      
      if (char === '_' && text.substr(i, 12) === '__PROTECTED_') {
        if (current.trim()) {
          tokens.push(...processTextToken(current));
          current = '';
        }
        const endIndex = text.indexOf('__', i + 12);
        if (endIndex !== -1) {
          tokens.push(text.substring(i, endIndex + 2));
          i = endIndex + 2;
          continue;
        }
      }
      
      if (/\s/.test(char)) {
        if (current.trim()) {
          tokens.push(...processTextToken(current));
          current = '';
        }
        tokens.push(char);
        i++;
        continue;
      }
      
      if (/[+\-*%=!<>&|^~]/.test(char)) {
        if (current.trim()) {
          tokens.push(...processTextToken(current));
          current = '';
        }
        
        let operator = char;
        if (i + 1 < text.length) {
          const nextChar = text[i + 1];
          const twoChar = char + nextChar;
          if (['<<', '>>', '<=', '>=', '==', '!=', '&&', '||'].includes(twoChar)) {
            operator = twoChar;
            i++;
          }
        }
        tokens.push(`<span class="operator">${operator}</span>`);
        i++;
        continue;
      }
      
      if (/[(){}\[\]]/.test(char)) {
        if (current.trim()) {
          tokens.push(...processTextToken(current));
          current = '';
        }
        tokens.push(`<span class="bracket">${char}</span>`);
        i++;
        continue;
      }
      
      if (/[;,.:?]/.test(char)) { // Using the regex from attachment's tokenizer
        if (current.trim()) {
          tokens.push(...processTextToken(current));
          current = '';
        }
        tokens.push(`<span class="symbol">${char}</span>`);
        i++;
        continue;
      }
      
      current += char;
      i++;
    }
    
    if (current.trim()) {
      tokens.push(...processTextToken(current));
    }
    
    return tokens.join('');
  }

  function processTextToken(token) {
    const trimmed = token.trim();
    if (!trimmed) return [token];
    
    const leadingSpace = token.match(/^\s*/)[0];
    const trailingSpace = token.match(/\s*$/)[0];
    const result = [];
    
    if (leadingSpace) result.push(leadingSpace);
    
    if (highlightRules.keywords.includes(trimmed)) {
      result.push(`<span class="keyword">${trimmed}</span>`);
    }
    else if (highlightRules.types.includes(trimmed)) {
      result.push(`<span class="type">${trimmed}</span>`);
    }
    else if (/^\d+$/.test(trimmed)) {
      result.push(`<span class="number">${trimmed}</span>`);
    }
    else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
      if (highlightRules.commonVars.includes(trimmed)) {
        result.push(`<span class="variable">${trimmed}</span>`);
      } else {
        // Heuristic for functions (can be improved with lookahead for '(' if needed)
        // For now, using the attachment's specific list and a general function class
        if (['build', 'query', 'update', 'modify', 'push_up', 'push_down', 'insert', 'kth'].includes(trimmed) || 
            (token.includes('(') && token.indexOf('(') > token.indexOf(trimmed))) { // Basic check
             result.push(`<span class="function">${trimmed}</span>`);
        } else {
          result.push(`<span class="variable">${trimmed}</span>`); // Default to variable
        }
      }
    }
    else if (/[*&]/.test(trimmed)) { // For pointers/references attached to names
        let parts = trimmed.split(/([*&])/).filter(Boolean);
        parts.forEach(part => {
            if (/[*&]/.test(part)) {
                result.push(`<span class="pointer">${part}</span>`);
            } else if (part.trim()) { // Process the remaining part
                 result.push(...processTextToken(part)); // Recursive call for the name part
            }
        });
    }
    else {
      result.push(trimmed);
    }
    
    if (trailingSpace) result.push(trailingSpace);
    return result;
  }

  const highlightedCode = tokenizeAndHighlight(code);
  
  let finalCode = highlightedCode;
  for (let i = protectedItems.length - 1; i >= 0; i--) {
    const item = protectedItems[i];
    finalCode = finalCode.replace(item.placeholder, item.content);
  }

  return `<code>${finalCode}</code>`;
}

// 立即应用语法高亮 (Adjusted)
function applyHighlighting() {
  document.querySelectorAll('.code-block').forEach(block => {
    if (!block.dataset.originalCode) {
      const codeTag = block.querySelector('code');
      if (codeTag) {
        block.dataset.originalCode = codeTag.textContent;
      } else {
        block.dataset.originalCode = block.textContent;
      }
    }
    
    if (!block.dataset.highlighted && block.dataset.originalCode) {
      const highlightedContent = highlightCode(block.dataset.originalCode); // Returns "<code>...</code>"
      
      const existingCodeTag = block.querySelector('code');
      if (existingCodeTag) {
        existingCodeTag.innerHTML = highlightedContent.substring('<code>'.length, highlightedContent.length - '</code>'.length);
      } else {
        block.innerHTML = highlightedContent;
      }
      block.dataset.highlighted = true;
    }
  });
}

// 延迟加载语法高亮（用于动态添加的代码块）(Adjusted)
function setupLazyHighlighting() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const block = entry.target;
        if (!block.dataset.highlighted) {
          let originalCode = block.dataset.originalCode;
          if (!originalCode) {
            const codeTag = block.querySelector('code');
            if (codeTag) {
              originalCode = codeTag.textContent;
              block.dataset.originalCode = originalCode; // Store if fetched now
            } else {
              originalCode = block.textContent;
              block.dataset.originalCode = originalCode; // Store if fetched now
            }
          }
          
          if (originalCode) {
            const highlightedContent = highlightCode(originalCode); // Returns "<code>...</code>"
            const existingCodeTag = block.querySelector('code');
            if (existingCodeTag) {
              existingCodeTag.innerHTML = highlightedContent.substring('<code>'.length, highlightedContent.length - '</code>'.length);
            } else {
              block.innerHTML = highlightedContent;
            }
            block.dataset.highlighted = true;
          }
        }
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.code-block:not([data-observed])').forEach(block => {
    if (!block.dataset.originalCode) {
      const codeTag = block.querySelector('code');
      if (codeTag) {
        block.dataset.originalCode = codeTag.textContent;
      } else {
        block.dataset.originalCode = block.textContent;
      }
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
