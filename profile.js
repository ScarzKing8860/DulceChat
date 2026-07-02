// ========== PROFILE LOGIC ==========

const form = document.getElementById('profileForm');
const statusMessage = document.getElementById('statusMessage');

function loadProfile() {
    const profile = JSON.parse(localStorage.getItem('dulcechat_profile') || '{}');

    document.getElementById('profileNameDisplay').textContent = profile.displayName || 'Streamer';
    document.getElementById('profileBioDisplay').textContent = profile.bio || 'No bio set yet';

    document.getElementById('displayName').value = profile.displayName || '';
    document.getElementById('username').value = profile.username || '';
    document.getElementById('profileBio').value = profile.bio || '';
    document.getElementById('defaultChatUrl').value = profile.defaultChatUrl || '';
    document.getElementById('defaultTipAmount').value = profile.defaultTipAmount || '10';
    document.getElementById('autoStartCamera').checked = profile.autoStartCamera || false;

    if (profile.theme) {
        document.getElementById(`theme${profile.theme.charAt(0).toUpperCase() + profile.theme.slice(1)}`).checked = true;
    }

    const accounts = JSON.parse(localStorage.getItem('dulcechat_accounts') || '{}');
    const tipHistory = JSON.parse(localStorage.getItem('dulcechat_tip_history') || '[]');
    const snapshotData = JSON.parse(localStorage.getItem('dulcechat_snapshots') || '{"count": 0}');

    let totalRoses = 0;
    Object.values(accounts).forEach(acc => {
        totalRoses += acc.roses || 0;
    });
    const singleRoses = parseInt(localStorage.getItem('dulcechat_roses') || '0');
    totalRoses = Math.max(totalRoses, singleRoses);

    document.getElementById('profileRosesCount').textContent = totalRoses;
    document.getElementById('profileTipsCount').textContent = tipHistory.length;
    document.getElementById('profileSnapshotsCount').textContent = snapshotData.count || 0;

    const sessionStart = localStorage.getItem('dulcechat_session_start');
    if (sessionStart) {
        const joinDate = new Date(sessionStart);
        document.getElementById('profileJoinDate').textContent = joinDate.toLocaleDateString();
    }
}

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const profile = {
        displayName: document.getElementById('displayName').value || 'Streamer',
        username: document.getElementById('username').value,
        bio: document.getElementById('profileBio').value,
        defaultChatUrl: document.getElementById('defaultChatUrl').value,
        defaultTipAmount: parseInt(document.getElementById('defaultTipAmount').value) || 10,
        autoStartCamera: document.getElementById('autoStartCamera').checked,
        theme: document.querySelector('input[name="theme"]:checked')?.value || 'dark',
        updatedAt: new Date().toISOString()
    };

    localStorage.setItem('dulcechat_profile', JSON.stringify(profile));

    statusMessage.className = 'status-message success';
    statusMessage.textContent = '✓ Profile saved successfully';
    setTimeout(() => {
        statusMessage.classList.remove('success');
    }, 3000);

    loadProfile();
});

document.getElementById('exportDataBtn').addEventListener('click', () => {
    const profile = JSON.parse(localStorage.getItem('dulcechat_profile') || '{}');
    const accounts = JSON.parse(localStorage.getItem('dulcechat_accounts') || '{}');
    const tipHistory = JSON.parse(localStorage.getItem('dulcechat_tip_history') || '[]');
    const chatLog = JSON.parse(localStorage.getItem('dulcechat_chat_log') || '[]');

    const exportData = {
        profile,
        accounts,
        tipHistory,
        chatLog,
        exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dulcechat-profile-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
});

document.getElementById('deleteAccountBtn').addEventListener('click', () => {
    if (confirm('Are you sure? This will delete your profile and all associated data. This cannot be undone.')) {
        if (confirm('Last warning: this will permanently delete everything. Continue?')) {
            localStorage.clear();
            alert('Profile deleted. Returning to studio...');
            window.location.href = 'index.html';
        }
    }
});

window.addEventListener('load', loadProfile);
