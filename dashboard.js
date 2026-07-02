// ========== DASHBOARD LOGIC ==========

function loadDashboardStats() {
    const accounts = JSON.parse(localStorage.getItem('dulcechat_accounts') || '{}');
    const tipHistory = JSON.parse(localStorage.getItem('dulcechat_tip_history') || '[]');
    const chatLog = JSON.parse(localStorage.getItem('dulcechat_chat_log') || '[]');
    const snapshotData = JSON.parse(localStorage.getItem('dulcechat_snapshots') || '{"count": 0}');
    const sessionStart = localStorage.getItem('dulcechat_session_start');

    let totalRoses = 0;
    Object.values(accounts).forEach(acc => {
        totalRoses += acc.roses || 0;
    });
    const singleRoses = parseInt(localStorage.getItem('dulcechat_roses') || '0');
    totalRoses = Math.max(totalRoses, singleRoses);
    document.getElementById('totalRoses').textContent = totalRoses;

    const totalTips = tipHistory.reduce((sum, tip) => sum + (tip.amount || 0), 0);
    document.getElementById('totalTips').textContent = totalTips;

    const snapshotCount = snapshotData.count || 0;
    document.getElementById('snapshotCount').textContent = snapshotCount;
    document.getElementById('snapshotsSummary').textContent = snapshotCount;

    const chatMessageCount = chatLog.length;
    document.getElementById('chatMessageCount').textContent = chatMessageCount;

    const tipContainer = document.getElementById('tipHistoryContainer');
    if (tipHistory.length === 0) {
        tipContainer.innerHTML = '<div class="empty-state"><p>No tips yet. Viewers can tip to earn you roses!</p></div>';
    } else {
        tipContainer.innerHTML = tipHistory
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10)
            .map(tip => `
                <div class="list-item">
                    <div class="list-item-meta">
                        <p class="list-item-name">${tip.sender || 'Viewer'}</p>
                        <p class="list-item-time">${new Date(tip.timestamp).toLocaleString()}</p>
                    </div>
                    <div class="list-item-value">+${tip.amount}</div>
                </div>
            `)
            .join('');
    }

    const chatContainer = document.getElementById('chatLogContainer');
    if (chatLog.length === 0) {
        chatContainer.innerHTML = '<div class="empty-state"><p>No chat messages yet. Connect to chat to see activity here.</p></div>';
    } else {
        chatContainer.innerHTML = chatLog
            .slice(-10)
            .reverse()
            .map(msg => `
                <div class="list-item">
                    <div class="list-item-meta">
                        <p class="list-item-name">${msg.sender || 'User'}</p>
                        <p class="list-item-time">${new Date(msg.timestamp).toLocaleString()}</p>
                    </div>
                    <p class="list-item-value" style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #d8eaff;">${msg.text || ''}</p>
                </div>
            `)
            .join('');
    }

    if (sessionStart) {
        const start = new Date(sessionStart).getTime();
        const now = Date.now();
        const durationMs = now - start;
        const hours = Math.floor(durationMs / 3600000);
        const minutes = Math.floor((durationMs % 3600000) / 60000);
        document.getElementById('sessionDuration').textContent = `${hours}h ${minutes}m`;
    }

    if (tipHistory.length > 0) {
        const avgTip = Math.round(totalTips / tipHistory.length);
        document.getElementById('avgTip').textContent = avgTip;
    }

    if (tipHistory.length > 0) {
        const tipperMap = {};
        tipHistory.forEach(tip => {
            const sender = tip.sender || 'Guest';
            tipperMap[sender] = (tipperMap[sender] || 0) + (tip.amount || 0);
        });
        const topTipper = Object.entries(tipperMap).sort((a, b) => b[1] - a[1])[0];
        document.getElementById('topTipper').textContent = topTipper ? topTipper[0] : '--';
    }
}

document.getElementById('clearTipHistory').addEventListener('click', () => {
    if (confirm('Clear all tip history?')) {
        localStorage.setItem('dulcechat_tip_history', '[]');
        loadDashboardStats();
    }
});

document.getElementById('clearChatLog').addEventListener('click', () => {
    if (confirm('Clear all chat logs?')) {
        localStorage.setItem('dulcechat_chat_log', '[]');
        loadDashboardStats();
    }
});

document.getElementById('exportSession').addEventListener('click', () => {
    const tipHistory = JSON.parse(localStorage.getItem('dulcechat_tip_history') || '[]');
    const chatLog = JSON.parse(localStorage.getItem('dulcechat_chat_log') || '[]');
    const data = {
        exportDate: new Date().toISOString(),
        tipHistory,
        chatLog,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dulcechat-session-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
});

document.getElementById('resetAll').addEventListener('click', () => {
    if (confirm('This will delete ALL data including accounts, roses, tips, and chat logs. Continue?')) {
        localStorage.clear();
        alert('All data reset. Returning to studio...');
        window.location.href = 'index.html';
    }
});

window.addEventListener('load', loadDashboardStats);
setInterval(loadDashboardStats, 5000);
