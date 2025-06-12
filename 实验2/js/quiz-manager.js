// 测验管理器
const QuizManager = {
  userAnswers: {},
  
  // 初始化测验
  init() {
    this.bindEvents();
  },
  
  // 绑定事件
  bindEvents() {
    const submitQuiz = DOMManager.get('submitQuiz');
    if (submitQuiz) {
      submitQuiz.addEventListener('click', () => {
        this.checkQuiz();
      });
    }
    
    // 监听选项变化
    document.addEventListener('change', (e) => {
      if (e.target.type === 'radio' && e.target.name.startsWith('q')) {
        this.userAnswers[e.target.name] = e.target.value;
      }
    });
  },
  
  // 检查测验答案
  checkQuiz() {
    const questions = ['q1', 'q2', 'q3'];
    let score = 0;
    let totalQuestions = questions.length;
    const results = [];
    
    // 检查每个问题
    questions.forEach(questionId => {
      const userAnswer = this.userAnswers[questionId];
      const correctAnswer = CONFIG.QUIZ_ANSWERS[questionId];
      const isCorrect = userAnswer === correctAnswer;
      
      if (isCorrect) {
        score++;
      }
      
      results.push({
        questionId,
        userAnswer,
        correctAnswer,
        isCorrect,
        explanation: this.getExplanation(questionId)
      });
    });
    
    // 显示结果
    this.displayResults(score, totalQuestions, results);
    
    // 记录成绩
    this.recordScore(score, totalQuestions);
  },
  
  // 获取问题解释
  getExplanation(questionId) {
    const explanations = {
      q1: {
        correct: '正确！线段树的每个操作（查询、更新）的时间复杂度都是 O(log n)，因为树的高度是 log n。',
        wrong: '线段树的时间复杂度是 O(log n)。这是因为线段树是一个平衡二叉树，树的高度为 log n，每次操作最多需要遍历从根到叶的路径。'
      },
      q2: {
        correct: '正确！线段树通常需要 4n 的空间。虽然理论上只需要 2n-1 个节点，但为了方便实现，通常分配 4n 的数组空间。',
        wrong: '线段树的空间复杂度通常是 O(4n)。虽然完全二叉树只需要 2n-1 个节点，但为了实现简便和避免数组越界，通常分配 4n 的空间。'
      },
      q3: {
        correct: '正确！懒惰标记的主要作用是优化区间修改操作，避免每次都递归到叶子节点，从而提高效率。',
        wrong: '懒惰标记（Lazy Propagation）的主要作用是优化区间修改操作。它通过延迟更新子节点，只在需要时才传播修改，大大提高了区间操作的效率。'
      }
    };
    
    return explanations[questionId] || { correct: '', wrong: '' };
  },
  
  // 显示结果
  displayResults(score, total, results) {
    const resultContainer = DOMManager.get('quizResult');
    if (!resultContainer) return;
    
    const percentage = Math.round((score / total) * 100);
    let resultClass = 'quiz-result-poor';
    let emoji = '😅';
    let message = '';
    
    if (percentage >= 90) {
      resultClass = 'quiz-result-excellent';
      emoji = '🎉';
      message = '优秀！你对线段树的理解非常深入！';
    } else if (percentage >= 70) {
      resultClass = 'quiz-result-good';
      emoji = '👍';
      message = '很好！你已经掌握了线段树的基本概念！';
    } else if (percentage >= 50) {
      resultClass = 'quiz-result-fair';
      emoji = '📚';
      message = '还不错！建议再复习一下相关知识点。';
    } else {
      resultClass = 'quiz-result-poor';
      emoji = '💪';
      message = '继续努力！多看看教程和代码示例。';
    }
    
    let html = `
      <div class="${resultClass}">
        <h4>${emoji} 测验结果</h4>
        <p><strong>得分:</strong> ${score}/${total} (${percentage}%)</p>
        <p><strong>评价:</strong> ${message}</p>
        <div class="quiz-details">
    `;
    
    results.forEach((result, index) => {
      const questionNum = index + 1;
      const statusIcon = result.isCorrect ? '✅' : '❌';
      const explanation = result.isCorrect ? 
        result.explanation.correct : 
        result.explanation.wrong;
      
      html += `
        <div class="quiz-answer-detail">
          <p><strong>问题 ${questionNum}:</strong> ${statusIcon}</p>
          <p class="quiz-explanation">${explanation}</p>
        </div>
      `;
    });
    
    html += `
        </div>
        <div class="quiz-actions">
          <button class="btn" onclick="QuizManager.retakeQuiz()">🔄 重新测试</button>
          <button class="btn" onclick="QuizManager.shareResult(${score}, ${total})">📤 分享成绩</button>
        </div>
      </div>
    `;
    
    resultContainer.innerHTML = html;
    resultContainer.style.display = 'block';
    
    // 滚动到结果
    resultContainer.scrollIntoView({ behavior: 'smooth' });
  },
  
  // 重新测试
  retakeQuiz() {
    // 清除用户答案
    this.userAnswers = {};
    
    // 清除选中状态
    const radioButtons = document.querySelectorAll('input[type="radio"]');
    radioButtons.forEach(radio => {
      radio.checked = false;
    });
    
    // 隐藏结果
    const resultContainer = DOMManager.get('quizResult');
    if (resultContainer) {
      resultContainer.style.display = 'none';
    }
    
    Utils.showNotification('测验已重置，可以重新开始！', 'info');
  },
  
  // 分享结果
  shareResult(score, total) {
    const percentage = Math.round((score / total) * 100);
    const text = `我在线段树学习测验中获得了 ${score}/${total} (${percentage}%) 的成绩！🌲 #线段树学习 #数据结构`;
    
    if (navigator.share) {
      // 使用Web Share API
      navigator.share({
        title: '线段树学习测验成绩',
        text: text,
        url: window.location.href
      }).catch(err => {
        console.log('分享失败:', err);
        this.fallbackShare(text);
      });
    } else {
      this.fallbackShare(text);
    }
  },
  
  // 备用分享方法
  fallbackShare(text) {
    // 复制到剪贴板
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        Utils.showNotification('成绩已复制到剪贴板！', 'success');
      }).catch(() => {
        this.manualShare(text);
      });
    } else {
      this.manualShare(text);
    }
  },
  
  // 手动分享
  manualShare(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      document.execCommand('copy');
      Utils.showNotification('成绩已复制到剪贴板！', 'success');
    } catch (err) {
      Utils.showNotification('请手动复制分享文本', 'info');
      console.log('分享文本:', text);
    }
    
    document.body.removeChild(textarea);
  },
  
  // 记录成绩
  recordScore(score, total) {
    try {
      const scoreHistory = JSON.parse(localStorage.getItem('quizScoreHistory')) || [];
      const newScore = {
        score,
        total,
        percentage: Math.round((score / total) * 100),
        timestamp: new Date().toISOString(),
        answers: { ...this.userAnswers }
      };
      
      scoreHistory.push(newScore);
      
      // 只保留最近10次成绩
      if (scoreHistory.length > 10) {
        scoreHistory.shift();
      }
      
      localStorage.setItem('quizScoreHistory', JSON.stringify(scoreHistory));
    } catch (error) {
      console.warn('保存成绩历史失败:', error);
    }
  },
  
  // 获取成绩历史
  getScoreHistory() {
    try {
      return JSON.parse(localStorage.getItem('quizScoreHistory')) || [];
    } catch (error) {
      console.warn('读取成绩历史失败:', error);
      return [];
    }
  },
  
  // 获取统计信息
  getStatistics() {
    const history = this.getScoreHistory();
    if (history.length === 0) {
      return null;
    }
    
    const scores = history.map(h => h.percentage);
    const totalAttempts = history.length;
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / totalAttempts);
    const bestScore = Math.max(...scores);
    const latestScore = scores[scores.length - 1];
    
    return {
      totalAttempts,
      averageScore,
      bestScore,
      latestScore,
      improvement: latestScore - (scores.length > 1 ? scores[scores.length - 2] : 0)
    };
  },
  
  // 清除历史记录
  clearHistory() {
    if (confirm('确定要清除所有测验历史记录吗？')) {
      localStorage.removeItem('quizScoreHistory');
      Utils.showNotification('历史记录已清除', 'success');
    }
  }
};

// 导出测验管理器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuizManager;
}
