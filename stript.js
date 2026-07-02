const webcam = document.getElementById("webcam");
const buttonStart = document.getElementById("buttonStart");
const buttonStop = document.getElementById("buttonStop");
const buttonCapture = document.getElementById("buttonCapture");
const buttonToggleMute = document.getElementById("buttonToggleMute");
const buttonToggleMirror = document.getElementById("buttonToggleMirror");
const buttonAddRoses = document.getElementById("buttonAddRoses");
const fallbackMessage = document.getElementById("fallbackMessage");
const statusLabel = document.getElementById("connectionStatus");
const videoFrame = document.getElementById("videoFrame");
const cameraResolution = document.getElementById("cameraResolution");
const cameraFramerate = document.getElementById("cameraFramerate");
const rosesCountLabel = document.getElementById("rosesCount");
const tipUser = document.getElementById("tipUser");
const tipLog = document.getElementById("tipLog");
const snapshotList = document.getElementById("snapshotList");
const chatStatusLabel = document.getElementById("chatStatus");
const chatFeed = document.getElementById("chatFeed");
const chatInput = document.getElementById("chatInput");
const chatUrlInput = document.getElementById("chatUrl");
const buttonSendChat = document.getElementById("buttonSendChat");
const buttonConnectChat = document.getElementById("buttonConnectChat");

let stream = null;
let mirrored = false;
let rosesCount = 0;
let chatSocket = null;
let chatConnected = false;
const CHAT_SERVER_URL = null; // Replace with a websocket URL to connect to real chat if not entered manually


// ========== REDEEM MODAL ELEMENTS ==========
const buttonOpenRedeem = document.getElementById("buttonOpenRedeem");
const redeemModal = document.getElementById("redeemModal");
const redeemBackdrop = document.getElementById("redeemBackdrop");
const redeemClose = document.getElementById("redeemClose");
const redeemCancel = document.getElementById("redeemCancel");
const redeemRosesLabel = document.getElementById("redeemRoses");

// ========== ACCOUNT ELEMENTS ==========
const buttonAccountMenu = document.getElementById("buttonAccountMenu");
const accountModal = document.getElementById("accountModal");
const accountBackdrop = document.getElementById("accountBackdrop");
const accountClose = document.getElementById("accountClose");
const newAccountName = document.getElementById("newAccountName");
const buttonCreateAccount = document.getElementById("buttonCreateAccount");
const accountSelect = document.getElementById("accountSelect");
const accountList = document.getElementById("accountList");

let currentAccountId = null;
let accounts = {};

// ========== STORAGE & PERSISTENCE ==========

function saveRoses() {
    try {
        if (currentAccountId) {
            accounts[currentAccountId].roses = rosesCount;
            localStorage.setItem('dulcechat_accounts', JSON.stringify(accounts));
        } else {
            localStorage.setItem('dulcechat_roses', String(rosesCount));
        }
    } catch (e) {
        console.warn('Unable to save roses to localStorage', e);
    }
}

function loadRoses() {
    try {
        const raw = localStorage.getItem('dulcechat_roses');
        if (raw !== null) {
            const n = parseInt(raw, 10);
            if (!Number.isNaN(n)) {
                rosesCount = n;
                updateRosesDisplay();
            }
        }
    } catch (e) {
        console.warn('Unable to load roses from localStorage', e);
    }
}

function loadAccounts() {
    try {
        const raw = localStorage.getItem('dulcechat_accounts');
        if (raw !== null) {
            accounts = JSON.parse(raw);
        }
    } catch (e) {
        console.warn('Unable to load accounts', e);
    }
    refreshAccountUI();
}

function refreshAccountUI() {
    accountSelect.innerHTML = '<option value="">Select Account...</option>';
    accountList.innerHTML = '';
    
    Object.entries(accounts).forEach(([id, acc]) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = `${acc.name} (${acc.roses} roses)`;
        accountSelect.appendChild(option);

        const item = document.createElement('div');
        item.className = 'account-item';
        item.innerHTML = `
            <div class="account-info">
                <p class="account-name">${acc.name}</p>
                <p class="account-roses">${acc.roses} roses</p>
            </div>
            <button class="btn btn-secondary account-action-btn" data-id="${id}">Use</button>
            <button class="btn btn-secondary account-action-btn" data-id="${id}" data-delete="1">Delete</button>
        `;
        accountList.appendChild(item);
    });
}

function createAccount(name) {
    if (!name || !name.trim()) {
        showToast('Account name cannot be empty');
        return;
    }
    const id = Date.now().toString();
    accounts[id] = { name: name.trim(), roses: 0 };
    localStorage.setItem('dulcechat_accounts', JSON.stringify(accounts));
    refreshAccountUI();
    newAccountName.value = '';
    showToast(`Account "${name}" created`);
}

function switchAccount(id) {
    if (!accounts[id]) return;
    currentAccountId = id;
    rosesCount = accounts[id].roses;
    updateRosesDisplay();
    accountSelect.value = id;
    closeAccountModal();
    showToast(`Switched to "${accounts[id].name}"`);
}

function deleteAccount(id) {
    if (!accounts[id]) return;
    const name = accounts[id].name;
    delete accounts[id];
    localStorage.setItem('dulcechat_accounts', JSON.stringify(accounts));
    if (currentAccountId === id) {
        currentAccountId = null;
        rosesCount = 0;
        updateRosesDisplay();
    }
    refreshAccountUI();
    showToast(`Account "${name}" deleted`);
}

function openAccountModal() {
    if (!accountModal) return;
    accountModal.setAttribute('aria-hidden', 'false');
}

function closeAccountModal() {
    if (!accountModal) return;
    accountModal.setAttribute('aria-hidden', 'true');
}

// ========== WEBCAM / CAMERA FUNCTIONS ==========

async function setVideoFrameLive(isLive) {
    if (!videoFrame) return;
    videoFrame.classList.toggle('is-live', isLive);
}

async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720, frameRate: { ideal: 30 } }, audio: false });
        webcam.srcObject = stream;
        webcam.style.display = "block";
        fallbackMessage.style.display = "none";
        buttonStop.disabled = false;
        buttonCapture.disabled = false;
        buttonStart.disabled = true;
        setVideoFrameLive(true);
        statusLabel.textContent = "Live";
        statusLabel.style.background = "rgba(72, 187, 120, 0.16)";
        statusLabel.style.color = "#c6ffd4";
        updateCameraStats();
    } catch (error) {
        console.error("Camera start failed", error);
        fallbackMessage.style.display = "grid";
        fallbackMessage.innerHTML = `<p>Unable to access camera.</p><small>${error.message}</small>`;
        statusLabel.textContent = "Disconnected";
        statusLabel.style.background = "rgba(255, 109, 109, 0.16)";
        statusLabel.style.color = "#ffd3d3";
    }
}

function stopCamera() {
    if (!stream) return;
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
    webcam.srcObject = null;
    webcam.style.display = "none";
    fallbackMessage.style.display = "grid";
    fallbackMessage.innerHTML = `<p>Camera stopped</p><small>Click Start Camera to reconnect.</small>`;
    buttonStop.disabled = true;
    buttonCapture.disabled = true;
    buttonStart.disabled = false;
    setVideoFrameLive(false);
    statusLabel.textContent = "Paused";
    statusLabel.style.background = "rgba(160, 160, 160, 0.16)";
    statusLabel.style.color = "#f0f7ff";
    cameraResolution.textContent = "-- x --";
    cameraFramerate.textContent = "-- fps";
}

function updateCameraStats() {
    if (!stream) return;
    const [track] = stream.getVideoTracks();
    const settings = track.getSettings();
    cameraResolution.textContent = `${settings.width || 1280} x ${settings.height || 720}`;
    cameraFramerate.textContent = `${Math.round(settings.frameRate || 30)} fps`;
}

// ========== ROSES & REWARDS SYSTEM ==========

function updateRosesDisplay() {
    rosesCountLabel.textContent = rosesCount;
    if (redeemRosesLabel) redeemRosesLabel.textContent = rosesCount;
    updateRedeemOptions();
}

function addRoses(amount = 5) {
    rosesCount += amount;
    updateRosesDisplay();
    saveRoses();
}

function addTip(amount) {
    const userName = tipUser?.value.trim() || 'Guest';
    addRoses(amount);
    
    // Track tip history
    const tipHistory = JSON.parse(localStorage.getItem('dulcechat_tip_history') || '[]');
    tipHistory.push({ sender: userName, amount, timestamp: new Date().toISOString() });
    localStorage.setItem('dulcechat_tip_history', JSON.stringify(tipHistory));
    
    updateTipLog(`${userName} tipped ${amount} roses`);
    showToast(`+${amount} roses from ${userName}`);
}

function updateTipLog(text) {
    if (!tipLog) return;
    const entry = document.createElement('p');
    entry.textContent = text;
    tipLog.prepend(entry);
    const lines = tipLog.querySelectorAll('p');
    if (lines.length > 5) {
        lines[lines.length - 1].remove();
    }
}

function appendChatMessage(sender, message, kind = 'message') {
    if (!chatFeed) return;
    const entry = document.createElement('div');
    entry.className = `chat-message ${kind}`;
    entry.innerHTML = `<span>${sender}:</span> ${message}`;
    chatFeed.appendChild(entry);
    chatFeed.scrollTop = chatFeed.scrollHeight;
    
    // Track chat messages (skip system messages)
    if (kind === 'message') {
        const chatLog = JSON.parse(localStorage.getItem('dulcechat_chat_log') || '[]');
        chatLog.push({ sender, text: message, timestamp: new Date().toISOString() });
        localStorage.setItem('dulcechat_chat_log', JSON.stringify(chatLog));
    }
}

function setChatStatus(status, active = false) {
    if (!chatStatusLabel) return;
    chatStatusLabel.textContent = status;
    chatStatusLabel.style.background = active ? 'rgba(99, 204, 109, 0.14)' : 'rgba(255,255,255,0.08)';
    chatStatusLabel.style.color = active ? '#c5ffd5' : '#d8eaff';
}

function handleChatCommand(sender, text) {
    const tipMatch = text.match(/(?:\/tip|!tip|tip)\s+(\d+)/i);
    if (tipMatch) {
        const amount = Number(tipMatch[1]);
        if (amount > 0) {
            addRoses(amount);
            updateTipLog(`${sender} sent a tip of ${amount} roses via chat`);
            showToast(`+${amount} roses from chat`);
        }
    }
}

function connectChat() {
    if (chatConnected) {
        if (chatSocket) {
            chatSocket.close();
            chatSocket = null;
        }
        chatConnected = false;
        setChatStatus('Disconnected');
        appendChatMessage('System', 'Chat disconnected', 'system');
        if (buttonConnectChat) buttonConnectChat.textContent = 'Connect Chat';
        return;
    }

    const manualUrl = chatUrlInput?.value.trim();
    const targetUrl = manualUrl || CHAT_SERVER_URL;
    const isRemote = Boolean(targetUrl);

    if (isRemote) {
        appendChatMessage('System', `Connecting to ${targetUrl}...`, 'system');
        try {
            chatSocket = new WebSocket(targetUrl);
        } catch (err) {
            appendChatMessage('System', 'Invalid WebSocket URL', 'system');
            showToast('Unable to connect: invalid URL');
            return;
        }
        chatSocket.addEventListener('open', () => {
            chatConnected = true;
            setChatStatus('Connected', true);
            appendChatMessage('System', 'Connected to real chat server', 'system');
            if (buttonConnectChat) buttonConnectChat.textContent = 'Disconnect Chat';
        });
        chatSocket.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data);
                const sender = data.sender || 'Viewer';
                const text = data.message || event.data;
                appendChatMessage(sender, text);
                handleChatCommand(sender, text);
            } catch (err) {
                appendChatMessage('Viewer', event.data);
            }
        });
        chatSocket.addEventListener('close', () => {
            chatConnected = false;
            setChatStatus('Disconnected');
            appendChatMessage('System', 'Chat server disconnected', 'system');
            if (buttonConnectChat) buttonConnectChat.textContent = 'Connect Chat';
        });
        chatSocket.addEventListener('error', () => {
            chatConnected = false;
            setChatStatus('Disconnected');
            appendChatMessage('System', 'Unable to connect to chat server', 'system');
            if (buttonConnectChat) buttonConnectChat.textContent = 'Connect Chat';
        });
        return;
    }

    chatConnected = true;
    setChatStatus('Connected', true);
    appendChatMessage('System', 'Chat connected locally. Type /tip 10 to award roses.', 'system');
    if (buttonConnectChat) buttonConnectChat.textContent = 'Disconnect Chat';
    setTimeout(() => appendChatMessage('Alex', 'Love the new stream look!', 'message'), 700);
    setTimeout(() => {
        appendChatMessage('Mia', 'Can you show the spotlight effect?', 'message');
        handleChatCommand('Mia', 'Can you show the spotlight effect?');
    }, 1800);
}

function sendChatMessage() {
    if (!chatInput) return;
    const text = chatInput.value.trim();
    if (!text) return;
    appendChatMessage('You', text, 'outgoing');
    if (chatSocket && chatConnected && CHAT_SERVER_URL) {
        chatSocket.send(JSON.stringify({ sender: 'You', message: text }));
    }
    handleChatCommand('You', text);
    chatInput.value = '';
}

function captureFrame() {
    if (!stream) return;
    const canvas = document.createElement("canvas");
    canvas.width = webcam.videoWidth;
    canvas.height = webcam.videoHeight;
    const ctx = canvas.getContext("2d");
    if (mirrored) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
    }
    ctx.drawImage(webcam, 0, 0, canvas.width, canvas.height);
    const imageUrl = canvas.toDataURL("image/png");

    const card = document.createElement("div");
    card.className = "snapshot-item";
    card.innerHTML = `<img src="${imageUrl}" alt="Snapshot" />`;

    if (snapshotList.querySelector(".snapshot-empty")) {
        snapshotList.innerHTML = "";
    }
    snapshotList.prepend(card);    
    // Track snapshot count
    const snapshotData = JSON.parse(localStorage.getItem('dulcechat_snapshots') || '{\"count\": 0}');
    snapshotData.count = (snapshotData.count || 0) + 1;
    localStorage.setItem('dulcechat_snapshots', JSON.stringify(snapshotData));
        addRoses(5);
}

// ========== REDEEM MODAL & REDEMPTION ==========

function openRedeem() {
    if (!redeemModal) return;
    redeemModal.setAttribute('aria-hidden', 'false');
}

function closeRedeem() {
    if (!redeemModal) return;
    redeemModal.setAttribute('aria-hidden', 'true');
}

function showToast(text, ms = 2200) {
    let t = document.querySelector('.toast');
    if (!t) {
        t = document.createElement('div');
        t.className = 'toast';
        document.body.appendChild(t);
    }
    t.textContent = text;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), ms);
}

function updateRedeemOptions() {
    const buttons = document.querySelectorAll('.redeem-btn');
    buttons.forEach((btn) => {
        const cost = Number(btn.dataset.cost || 0);
        btn.disabled = rosesCount < cost;
    });
}

function redeem(cost, name) {
    if (rosesCount < cost) {
        showToast('Not enough roses');
        return;
    }
    rosesCount -= cost;
    saveRoses();
    updateRosesDisplay();
    showToast(`Redeemed ${name} for ${cost} roses`);
    closeRedeem();
    if (name === 'Confetti') {
        launchConfetti();
    }
    if (name === 'Spotlight') {
        flashSpotlight();
    }
    if (name === 'Shoutout') {
        showToast('Send your shoutout now!', 2800);
    }
}

// ========== VISUAL EFFECTS (Confetti, Spotlight) ==========

function launchConfetti(pieces = 28) {
    const colors = ['#ff4d8d', '#ffba08', '#7c3aed', '#55c7ff', '#fee4ff'];
    for (let i = 0; i < pieces; i += 1) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.style.background = colors[i % colors.length];
        const startX = window.innerWidth / 2 + (Math.random() - 0.5) * 220;
        const startY = window.innerHeight * 0.25 + (Math.random() - 0.5) * 120;
        confetti.style.left = `${startX}px`;
        confetti.style.top = `${startY}px`;
        const rotate = Math.random() * 360;
        confetti.style.transform = `rotate(${rotate}deg)`;

        document.body.appendChild(confetti);

        const duration = 1200 + Math.random() * 700;
        const endX = startX + (Math.random() - 0.5) * 360;
        const endY = startY + window.innerHeight * 0.45 + Math.random() * 120;
        const fallRotation = rotate + (Math.random() - 0.5) * 720;

        requestAnimationFrame(() => {
            confetti.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
            confetti.style.transform = `translate(${endX - startX}px, ${endY - startY}px) rotate(${fallRotation}deg)`;
            confetti.style.opacity = '0';
        });

        setTimeout(() => confetti.remove(), duration + 100);
    }
}

function flashSpotlight() {
    const vf = document.querySelector('.video-frame');
    if (!vf) return;
    vf.style.boxShadow = '0 0 0 0 rgba(255,255,255,0)';
    vf.style.border = '2px solid rgba(255, 214, 88, 0.9)';
    setTimeout(() => {
        vf.style.border = '';
    }, 1200);
}

// ========== CAMERA UTILITIES (Mute, Mirror) ==========

function toggleMute() {
    if (!stream) return;
    const audioTracks = stream.getAudioTracks();
    audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
    });
}

function toggleMirror() {
    mirrored = !mirrored;
    webcam.style.transform = mirrored ? "scaleX(-1)" : "scaleX(1)";
}

// ========== EVENT LISTENERS & INITIALIZATION ==========

buttonStart.addEventListener("click", startCamera);
buttonStop.addEventListener("click", stopCamera);
buttonCapture.addEventListener("click", captureFrame);
buttonAddRoses.addEventListener("click", () => addRoses(5));
if (buttonOpenRedeem) buttonOpenRedeem.addEventListener('click', openRedeem);
if (redeemClose) redeemClose.addEventListener('click', closeRedeem);
if (redeemBackdrop) redeemBackdrop.addEventListener('click', closeRedeem);
if (redeemCancel) redeemCancel.addEventListener('click', closeRedeem);

// tip buttons
document.addEventListener('click', (e) => {
    const tipBtn = e.target.closest && e.target.closest('.tip-btn');
    if (tipBtn) {
        const amount = Number(tipBtn.dataset.tip || 0);
        if (amount > 0) addTip(amount);
        return;
    }

    const btn = e.target.closest && e.target.closest('.redeem-btn');
    if (!btn) return;
    const cost = Number(btn.dataset.cost || 0);
    const name = btn.dataset.name || 'Reward';
    redeem(cost, name);
});
buttonToggleMute.addEventListener("click", toggleMute);
buttonToggleMirror.addEventListener("click", toggleMirror);
if (buttonConnectChat) buttonConnectChat.addEventListener('click', connectChat);
if (buttonSendChat) buttonSendChat.addEventListener('click', sendChatMessage);
if (chatInput) chatInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
});

// account button listeners
if (buttonAccountMenu) buttonAccountMenu.addEventListener('click', openAccountModal);
if (accountClose) accountClose.addEventListener('click', closeAccountModal);
if (accountBackdrop) accountBackdrop.addEventListener('click', closeAccountModal);
if (buttonCreateAccount) buttonCreateAccount.addEventListener('click', () => {
    createAccount(newAccountName.value);
});
if (accountSelect) accountSelect.addEventListener('change', (e) => {
    if (e.target.value) switchAccount(e.target.value);
});

// account list delegation for Use/Delete buttons
document.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest('.account-action-btn');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.delete) {
        deleteAccount(id);
    } else {
        switchAccount(id);
    }
});

window.addEventListener("beforeunload", stopCamera);

// initialize persisted state
loadAccounts();
loadRoses();
// ensure redeem buttons reflect state
updateRedeemOptions();

// Initialize session start time if not already set
if (!localStorage.getItem('dulcechat_session_start')) {
    localStorage.setItem('dulcechat_session_start', new Date().toISOString());
}
