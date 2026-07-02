function applyTheme(theme) {
  document.body.dataset.theme = theme;
  localStorage.setItem('dulcechat_theme', theme);
  document.querySelectorAll('.theme-btn').forEach((button) => {
    const isActive = button.dataset.theme === theme;
    button.classList.toggle('active', isActive);
  });
}

function setTheme(theme) {
  applyTheme(theme);
}

function initViewerCounter() {
  const viewerLabel = document.getElementById('viewerCount');
  if (!viewerLabel) return;

  let viewers = 1842;
  const tick = () => {
    const delta = Math.random() > 0.5 ? 1 : -1;
    viewers = Math.max(1480, viewers + delta);
    viewerLabel.textContent = `${viewers.toLocaleString()} watching`;
  };

  tick();
  window.setInterval(tick, 3500);
}

function initThemeSwitcher() {
  const savedTheme = localStorage.getItem('dulcechat_theme') || 'dark';
  applyTheme(savedTheme);

  document.querySelectorAll('.theme-btn').forEach((button) => {
    button.addEventListener('click', () => {
      applyTheme(button.dataset.theme);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initThemeSwitcher();
  initViewerCounter();
});
window.setTheme = setTheme;
