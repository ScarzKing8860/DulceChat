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

function initThemeSwitcher() {
  const savedTheme = localStorage.getItem('dulcechat_theme') || 'dark';
  applyTheme(savedTheme);

  document.querySelectorAll('.theme-btn').forEach((button) => {
    button.addEventListener('click', () => {
      applyTheme(button.dataset.theme);
    });
  });
}

document.addEventListener('DOMContentLoaded', initThemeSwitcher);
window.setTheme = setTheme;
