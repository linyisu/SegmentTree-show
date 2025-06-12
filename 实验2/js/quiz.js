// filepath: c:\Users\acm\OneDrive\SegmentTree-show\实验2\js\quiz.js
/* 测验功能模块 - 处理线段树相关的交互式测验 */

// 测试检查
function checkQuiz() {
  const answers = { q1: 'b', q2: 'c', q3: 'b' };
  let score = 0;
  let results = [];

  for (const [question, correct] of Object.entries(answers)) {
    const selected = document.querySelector(`input[name="${question}"]:checked`);
    if (!selected) {
      results.push(`❌ 问题 ${question.slice(1)}: 未选择答案`);
      continue;
    }
    if (selected.value === correct) {
      score++;
      results.push(`✅ 问题 ${question.slice(1)}: 正确`);
    } else {
      results.push(`❌ 问题 ${question.slice(1)}: 错误`);
    }
  }

  const total = Object.keys(answers).length;
  DOM.quizResult.style.display = 'block';
  DOM.quizResult.innerHTML = `
    <h3>🎯 测试结果</h3>
    <p><strong>得分: ${score}/${total} (${Math.round(score / total * 100)}%)</strong></p>
    ${results.join('<br>')}
    <p style="margin-top: 15px;">
      ${score === total ? '🎉 完美！你已经完全掌握了线段树的基础知识！' :
        score >= total * 0.7 ? '👍 不错！继续加油学习线段树！' :
        '💪 还需要更多练习，建议重新阅读相关内容。'}
    </p>
  `;
  DOM.quizResult.style.background = score === total ? 'var(--success-bg)' :
    score >= total * 0.7 ? 'var(--warning-bg)' : 'var(--error-bg)';
  DOM.quizResult.style.color = 'white';
}