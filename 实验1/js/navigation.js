/* 导航功能模块 */

// 导航切换
function showSection(id) {
  document.querySelectorAll('main section').forEach(sec => sec.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) {
    target.classList.add('active');
    const targetBtn = document.querySelector(`button[onclick="showSection('${id}')"]`);
    if (targetBtn) targetBtn.classList.add('active');
  }
}

// 初始化导航事件
function initNavigation() {
  // 导航事件委托
  const nav = document.querySelector('nav');
  if (nav) {
    nav.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') {
        const onclickAttr = e.target.getAttribute('onclick');
        if (onclickAttr) {
          const match = onclickAttr.match(/'([^']+)'/);
          if (match) {
            const sectionId = match[1];
            showSection(sectionId);
          }
        }
      }
    });
  }
}

// 导出函数供其他模块使用
window.Navigation = {
  showSection,
  initNavigation
};
