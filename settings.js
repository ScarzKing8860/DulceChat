const settings = {
    autoStart: false,
    chatAlerts: true,
    compactLayout: false
};

function loadSettings() {
    const saved = JSON.parse(localStorage.getItem('dulcechat_settings') || '{}');
    Object.assign(settings, saved);
    document.getElementById('autoStartToggle').classList.toggle('active', settings.autoStart);
    document.getElementById('chatAlertsToggle').classList.toggle('active', settings.chatAlerts);
    document.getElementById('compactLayoutToggle').classList.toggle('active', settings.compactLayout);
    document.getElementById('autoStartToggle').setAttribute('aria-pressed', String(settings.autoStart));
    document.getElementById('chatAlertsToggle').setAttribute('aria-pressed', String(settings.chatAlerts));
    document.getElementById('compactLayoutToggle').setAttribute('aria-pressed', String(settings.compactLayout));
}

function saveSettings() {
    localStorage.setItem('dulcechat_settings', JSON.stringify(settings));
}

function bindToggle(id, key) {
    const button = document.getElementById(id);
    button.addEventListener('click', () => {
        settings[key] = !settings[key];
        button.classList.toggle('active', settings[key]);
        button.setAttribute('aria-pressed', String(settings[key]));
        saveSettings();
    });
}

bindToggle('autoStartToggle', 'autoStart');
bindToggle('chatAlertsToggle', 'chatAlerts');
bindToggle('compactLayoutToggle', 'compactLayout');

document.getElementById('clearLocalData').addEventListener('click', () => {
    const confirmed = window.confirm('Clear all saved DulceChat data from this browser?');
    if (!confirmed) return;
    localStorage.clear();
    window.location.reload();
});

loadSettings();
