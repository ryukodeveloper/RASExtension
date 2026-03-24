/*

DO NOT REMOVE THIS NOTE!
CREATED BY RYUKO DEVELOPER!

*/

const logContainer = document.getElementById('log-container');
const cookieDisplay = document.getElementById('cookieDisplay');
const startBtn = document.getElementById('startBtn');
const inputs = ['shareUrl', 'shareCount', 'interval'];
let cookieString;
let globalIsRunning = false;

function addLog(message, type = 'info', time = null) {
    const div = document.createElement('div');
    div.className = 'log-entry';
    if (type === 'error') div.classList.add('log-error');
    if (type === 'success') div.classList.add('log-success');
    const timestamp = time || new Date().toLocaleTimeString();
    div.textContent = `[${timestamp}] ${message}`;
    logContainer.appendChild(div);
    logContainer.scrollTop = logContainer.scrollHeight;
}

async function updateButtonUI(isRunning) {
    globalIsRunning = isRunning;
    if (isRunning) {
        startBtn.textContent = "Stop Sharing Process";
        startBtn.classList.remove('from-blue-600', 'to-indigo-600', 'hover:from-blue-500', 'hover:to-indigo-500');
        startBtn.classList.add('from-red-600', 'to-red-700', 'hover:from-red-500', 'hover:to-red-600');
        inputs.forEach(id => document.getElementById(id).disabled = true);
    } else {
        startBtn.textContent = "Start Sharing";
        startBtn.classList.remove('from-red-600', 'to-red-700', 'hover:from-red-500', 'hover:to-red-600');
        startBtn.classList.add('from-blue-600', 'to-indigo-600', 'hover:from-blue-500', 'hover:to-indigo-500');
        inputs.forEach(id => document.getElementById(id).disabled = false);
    }
}

async function loadPersistentState() {
    const data = await chrome.storage.local.get(["logs", "isRunning", "shareData"]);
    if (data.logs) {
        logContainer.innerHTML = '';
        data.logs.forEach(l => addLog(l.msg, l.isError ? 'error' : 'info', l.time));
    }
    if (data.shareData) {
        document.getElementById('shareUrl').value = data.shareData.url || '';
        document.getElementById('shareCount').value = data.shareData.count || 10;
        document.getElementById('interval').value = data.shareData.interval || 1500;
    }
    updateButtonUI(data.isRunning || false);
}

async function getSession() {
    chrome.cookies.getAll({ domain: "facebook.com" }, (cookies) => {
        const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join("; ");
        if (!cookieStr.includes("c_user")) {
            addLog("Please log-in your facebook account in this browser to continue!", "error");
            cookieDisplay.value = "Status: No active session found. Please log-in your facebook account!";
        } else {
            cookieString = cookieStr;
            cookieDisplay.value = cookieString;
        }
    });
}

loadPersistentState();
getSession();

startBtn.onclick = async () => {
    if (globalIsRunning) {
        chrome.runtime.sendMessage({ action: "stopSharing" });
        updateButtonUI(false);
    } else {
        const shareUrl = document.getElementById('shareUrl').value;
        const shareCount = parseInt(document.getElementById('shareCount').value);
        const interval = parseInt(document.getElementById('interval').value);

        if (!shareUrl || !shareCount || !interval || !cookieString) {
            addLog("Error: Missing session or fields.", "error");
            return;
        }

        updateButtonUI(true);
        addLog(`Initiating sharing process...`, "success");
        chrome.runtime.sendMessage({ 
            action: "startSharing", 
            data: { cookie: cookieString, url: shareUrl, count: shareCount, interval: interval } 
        });
    }
};

document.getElementById('clearBtn').onclick = async () => {
    if (confirm("Reset everything? This stops all processes and wipes logs.")) {
        chrome.runtime.sendMessage({ action: "clearStorage" });
        logContainer.innerHTML = '<div class="text-blue-500/50 text-[10px] mb-2">Terminal Reset.</div>';
        updateButtonUI(false);
    }
};

document.getElementById('copyCookie').onclick = () => {
    if(!cookieDisplay.value.includes("Status:")) {
        cookieDisplay.select();
        document.execCommand('copy');
        addLog("Cookie copied.", "success");
    }
};

document.querySelectorAll('a[target="_blank"]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: link.href });
    });
});

chrome.runtime.onMessage.addListener((request) => {
    if (request.type === "LOG") addLog(request.msg, request.isError ? 'error' : 'info', request.time);
    if (request.type === "STATUS_UPDATE") updateButtonUI(request.isRunning);
});
