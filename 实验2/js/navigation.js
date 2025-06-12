/* 导航管理模块 - 处理页面导航和章节切换 */

// 键盘导航支持
document.addEventListener('keydown', function(e) {
  // 如果在输入框中，不处理键盘导航
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    return;
  }
  
  const sections = ['intro', 'basic', 'advanced', 'quiz', 'settings'];
  const currentSection = document.querySelector('section.active');
  if (!currentSection) return;
  
  const currentIndex = sections.indexOf(currentSection.id);
  
  switch(e.key) {
    case 'ArrowLeft':
    case 'ArrowUp':
      e.preventDefault();
      if (currentIndex > 0) {
        showSection(sections[currentIndex - 1]);
      }
      break;
    case 'ArrowRight':
    case 'ArrowDown':
      e.preventDefault();
      if (currentIndex < sections.length - 1) {
        showSection(sections[currentIndex + 1]);
      }
      break;
    case 'Home':
      e.preventDefault();
      showSection(sections[0]);
      break;
    case 'End':
      e.preventDefault();
      showSection(sections[sections.length - 1]);
      break;
  }
});

// 滚动到顶部功能
function scrollToTop() {
  document.querySelector('main').scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

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

// 为每个节切换添加滚动到顶部
const originalShowSection = window.showSection;
window.showSection = function(id) {
  originalShowSection(id);
  scrollToTop();
};

// 进度指示器
function updateProgress() {
  const sections = ['intro', 'basic', 'advanced', 'quiz', 'settings'];
  const currentSection = document.querySelector('section.active');
  if (!currentSection) return;
  
  const currentIndex = sections.indexOf(currentSection.id);
  const progress = ((currentIndex + 1) / sections.length) * 100;
  
  // 如果有进度条元素，更新它
  const progressBar = document.querySelector('.progress-bar');
  if (progressBar) {
    progressBar.style.width = `${progress}%`;
  }
}

// 监听导航变化以更新进度
const observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
      updateProgress();
    }
  });
});

// 观察所有section元素的class变化
document.querySelectorAll('section').forEach(section => {
  observer.observe(section, { attributes: true });
});
