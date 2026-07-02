// ========== VIEWER BROWSER LOGIC ==========

let currentFilter = 'all';
let allViewers = {};

function formatLastSeen(date) {
    if (!date) return 'Just joined';
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return 'Active now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function buildViewerMap() {
    allViewers = {};

    const tipHistory = JSON.parse(localStorage.getItem('dulcechat_tip_history') || '[]');
    const chatLog = JSON.parse(localStorage.getItem('dulcechat_chat_log') || '[]');

    tipHistory.forEach(tip => {
        if (!allViewers[tip.sender]) {
            allViewers[tip.sender] = {
                name: tip.sender,
                totalTips: 0,
                messages: 0,
                lastSeen: null,
                isTipper: false
            };
        }
        allViewers[tip.sender].totalTips += tip.amount || 0;
        allViewers[tip.sender].lastSeen = new Date(tip.timestamp);
        allViewers[tip.sender].isTipper = true;
    });

    chatLog.forEach(msg => {
        if (!allViewers[msg.sender]) {
            allViewers[msg.sender] = {
                name: msg.sender,
                totalTips: 0,
                messages: 0,
                lastSeen: null,
                isTipper: false
            };
        }
        allViewers[msg.sender].messages += 1;
        if (!allViewers[msg.sender].lastSeen || new Date(msg.timestamp) > allViewers[msg.sender].lastSeen) {
            allViewers[msg.sender].lastSeen = new Date(msg.timestamp);
        }
    });

    return allViewers;
}

function renderLiveViewers() {
    const container = document.getElementById('liveViewersGrid');
    buildViewerMap();

    const featured = Object.values(allViewers);
    const fallback = [
        { name: 'Ava', totalTips: 25, messages: 8, lastSeen: new Date() },
        { name: 'Theo', totalTips: 15, messages: 5, lastSeen: new Date() },
        { name: 'Mina', totalTips: 10, messages: 3, lastSeen: new Date() }
    ];
    const source = featured.length > 0 ? featured : fallback;
    const topLive = source
        .sort((a, b) => (b.totalTips || 0) - (a.totalTips || 0) || (b.messages || 0) - (a.messages || 0))
        .slice(0, 3);

    container.innerHTML = topLive.map(viewer => `
        <div class="live-viewer-card">
            <div class="live-viewer-top">
                <div>
                    <p class="viewer-name">${viewer.name}</p>
                    <p class="viewer-status">${formatLastSeen(viewer.lastSeen)}</p>
                </div>
                <span class="live-viewer-pill">● Live</span>
            </div>
            <div class="viewer-stats">
                <div class="viewer-stat">
                    <span class="viewer-stat-value">${viewer.totalTips || 0}</span>
                    <span class="viewer-stat-label">Tips</span>
                </div>
                <div class="viewer-stat">
                    <span class="viewer-stat-value">${viewer.messages || 0}</span>
                    <span class="viewer-stat-label">Chats</span>
                </div>
            </div>
            <div class="live-viewer-actions">
                <button onclick="shoutout('${viewer.name}')">Shoutout</button>
                <button onclick="messageViewer('${viewer.name}')">Message</button>
            </div>
        </div>
    `).join('');
}

function renderViewers(filter = 'all') {
    const viewersList = document.getElementById('viewersList');
    buildViewerMap();

    let filtered = Object.values(allViewers);

    if (filter === 'tippers') {
        filtered = filtered.filter(v => v.isTipper).sort((a, b) => b.totalTips - a.totalTips);
    } else if (filter === 'chatty') {
        filtered = filtered.filter(v => v.messages > 0).sort((a, b) => b.messages - a.messages);
    } else if (filter === 'recent') {
        filtered = filtered.sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
    } else {
        filtered = filtered.sort((a, b) => b.totalTips - a.totalTips || b.messages - a.messages);
    }

    if (filtered.length === 0) {
        viewersList.innerHTML = '<div class="empty-state"><p>No viewers match this filter.</p></div>';
        return;
    }

    viewersList.innerHTML = filtered.map(viewer => {
        const avatar = viewer.name.charAt(0).toUpperCase();
        return `
            <div class="viewer-card">
                <div class="viewer-header">
                    <div class="viewer-avatar">${avatar}</div>
                    <div class="viewer-info">
                        <p class="viewer-name">${viewer.name}</p>
                        <p class="viewer-status">Active now</p>
                    </div>
                    ${viewer.isTipper ? '<span class="viewer-badge">⭐ Supporter</span>' : ''}
                </div>
                <div class="viewer-stats">
                    <div class="viewer-stat">
                        <span class="viewer-stat-value">${viewer.totalTips}</span>
                        <span class="viewer-stat-label">Tips Sent</span>
                    </div>
                    <div class="viewer-stat">
                        <span class="viewer-stat-value">${viewer.messages}</span>
                        <span class="viewer-stat-label">Messages</span>
                    </div>
                </div>
                <div class="viewer-actions">
                    <button onclick="shoutout('${viewer.name}')">Shoutout</button>
                    <button onclick="block('${viewer.name}')">Block</button>
                </div>
            </div>
        `;
    }).join('');
}

function renderTopTippers() {
    const container = document.getElementById('topTippersContainer');
    const tipHistory = JSON.parse(localStorage.getItem('dulcechat_tip_history') || '[]');

    if (tipHistory.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No tips yet. When viewers send tips, they\'ll appear here.</p></div>';
        return;
    }

    const tipperMap = {};
    tipHistory.forEach(tip => {
        const sender = tip.sender || 'Guest';
        tipperMap[sender] = (tipperMap[sender] || 0) + (tip.amount || 0);
    });

    const sorted = Object.entries(tipperMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    container.innerHTML = sorted.map((entry, idx) => `
        <div class="list-item">
            <div class="list-item-main">
                <p class="list-item-name">#${idx + 1} ${entry[0]}</p>
                <p class="list-item-meta">Top supporter</p>
            </div>
            <div class="list-item-value">${entry[1]} roses</div>
        </div>
    `).join('');
}

function renderChatters() {
    const container = document.getElementById('chattersContainer');
    buildViewerMap();

    const chatters = Object.values(allViewers)
        .filter(v => v.messages > 0)
        .sort((a, b) => b.messages - a.messages)
        .slice(0, 10);

    if (chatters.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No chat activity yet. Messages will appear here as viewers chat.</p></div>';
        return;
    }

    container.innerHTML = chatters.map((chatter, idx) => `
        <div class="list-item">
            <div class="list-item-main">
                <p class="list-item-name">#${idx + 1} ${chatter.name}</p>
                <p class="list-item-meta">Active chatter</p>
            </div>
            <div class="list-item-value">${chatter.messages} msgs</div>
        </div>
    `).join('');
}

function updateStats() {
    const tipHistory = JSON.parse(localStorage.getItem('dulcechat_tip_history') || '[]');
    const chatLog = JSON.parse(localStorage.getItem('dulcechat_chat_log') || '[]');
    buildViewerMap();

    const totalViewers = Object.keys(allViewers).length;
    const totalTips = tipHistory.reduce((sum, tip) => sum + (tip.amount || 0), 0);
    const avgTip = tipHistory.length > 0 ? Math.round(totalTips / tipHistory.length) : 0;

    document.getElementById('totalViewers').textContent = totalViewers;
    document.getElementById('totalMessages').textContent = chatLog.length;
    document.getElementById('totalTips').textContent = totalTips;
    document.getElementById('avgTipSize').textContent = avgTip;
}

function shoutout(name) {
    alert(`Shouting out to ${name}! 🎉`);
}

function messageViewer(name) {
    alert(`Opening a chat with ${name}...`);
}

function block(name) {
    if (confirm(`Block ${name}?`)) {
        alert(`${name} has been blocked.`);
    }
}

document.getElementById('searchBtn').addEventListener('click', () => {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const viewersList = document.getElementById('viewersList');
    buildViewerMap();

    const filtered = Object.values(allViewers).filter(v => v.name.toLowerCase().includes(query));

    if (filtered.length === 0) {
        viewersList.innerHTML = '<div class="empty-state"><p>No results found.</p></div>';
        return;
    }

    viewersList.innerHTML = filtered.map(viewer => {
        const avatar = viewer.name.charAt(0).toUpperCase();
        return `
            <div class="viewer-card">
                <div class="viewer-header">
                    <div class="viewer-avatar">${avatar}</div>
                    <div class="viewer-info">
                        <p class="viewer-name">${viewer.name}</p>
                        <p class="viewer-status">Active now</p>
                    </div>
                    ${viewer.isTipper ? '<span class="viewer-badge">⭐ Supporter</span>' : ''}
                </div>
                <div class="viewer-stats">
                    <div class="viewer-stat">
                        <span class="viewer-stat-value">${viewer.totalTips}</span>
                        <span class="viewer-stat-label">Tips Sent</span>
                    </div>
                    <div class="viewer-stat">
                        <span class="viewer-stat-value">${viewer.messages}</span>
                        <span class="viewer-stat-label">Messages</span>
                    </div>
                </div>
                <div class="viewer-actions">
                    <button onclick="shoutout('${viewer.name}')">Shoutout</button>
                    <button onclick="block('${viewer.name}')">Block</button>
                </div>
            </div>
        `;
    }).join('');
});

document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.dataset.filter;
        renderViewers(currentFilter);
    });
});

document.getElementById('searchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('searchBtn').click();
    }
});

window.addEventListener('load', () => {
    updateStats();
    renderLiveViewers();
    renderViewers();
    renderTopTippers();
    renderChatters();
});

setInterval(() => {
    updateStats();
    renderLiveViewers();
    renderViewers(currentFilter);
    renderTopTippers();
    renderChatters();
}, 5000);
