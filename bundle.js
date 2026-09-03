const tokenBalance = document.querySelector('#tokenBalance');
const toast = document.querySelector('#toast');
let tokens = Number(tokenBalance?.textContent || 240);
let toastTimer;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function updateTokens(amount) {
  tokens += amount;
  if (tokenBalance) tokenBalance.textContent = tokens;
}

document.querySelector('#buyTokens')?.addEventListener('click', () => {
  updateTokens(100);
  showToast('100 tokens added to your wallet');
});

document.querySelectorAll('.mini-gift').forEach((button) => {
  button.addEventListener('click', () => {
    const creator = button.dataset.creator;
    if (tokens < 10) {
      showToast('You need more tokens to send a gift');
      return;
    }
    updateTokens(-10);
    showToast(`A rose gift is on its way to ${creator}`);
  });
});

document.querySelectorAll('.heart').forEach((button) => {
  button.addEventListener('click', () => {
    const isFavorite = button.textContent === '♥';
    button.textContent = isFavorite ? '♡' : '♥';
    button.style.color = isFavorite ? '' : '#ffb4c9';
  });
});

document.querySelectorAll('.filter').forEach((filter) => {
  filter.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach((item) => item.classList.remove('active'));
    filter.classList.add('active');
    const category = filter.dataset.filter;
    document.querySelectorAll('.room-card').forEach((card) => {
      card.hidden = category !== 'all' && card.dataset.category !== category;
    });
  });
});

document.querySelector('#chatForm')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const input = document.querySelector('#chatInput');
  const message = input.value.trim();
  if (!message) return;
  const item = document.createElement('p');
  item.innerHTML = '<b class="pink">You</b><span></span>';
  item.querySelector('span').textContent = message;
  document.querySelector('#chatMessages').append(item);
  input.value = '';
  showToast('Message sent');
});

document.querySelector('[data-scroll="roomGrid"]')?.addEventListener('click', () => {
  document.querySelector('#roomGrid').scrollIntoView({ behavior: 'smooth' });
});

document.querySelectorAll('.room-card').forEach((card) => {
  card.addEventListener('click', (event) => {
    if (!event.target.closest('button')) window.location.href = 'room.html';
  });
});

document.querySelector('#followButton')?.addEventListener('click', (event) => {
  const button = event.currentTarget;
  const following = button.textContent.includes('Following');
  button.textContent = following ? '+ Follow' : 'Following';
  showToast(following ? 'LunaViolet removed from following' : 'You are now following LunaViolet');
});

document.querySelectorAll('.gift-option').forEach((gift) => {
  gift.addEventListener('click', () => {
    const cost = Number(gift.dataset.cost);
    if (tokens < cost) {
      showToast('You need more tokens for this gift');
      return;
    }
    updateTokens(-cost);
    showToast(`${gift.dataset.gift} sent to LunaViolet`);
  });
});

document.querySelectorAll('.toggle').forEach((toggle) => {
  toggle.addEventListener('click', () => {
    const enabled = toggle.classList.toggle('on');
    toggle.setAttribute('aria-pressed', String(enabled));
  });
});

document.querySelectorAll('.form-stack').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    showToast('Changes saved');
  });
});
