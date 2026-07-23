const botForm = document.getElementById('botForm');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusBadge = document.getElementById('statusBadge');
const statusText = document.getElementById('statusText');
const alertBox = document.getElementById('alertBox');
const consoleLogs = document.getElementById('consoleLogs');
const clearLogsBtn = document.getElementById('clearLogsBtn');

let lastLogCount = 0;

function showAlert(message) {
  alertBox.textContent = message;
  alertBox.classList.remove('hidden');
}

function hideAlert() {
  alertBox.classList.add('hidden');
  alertBox.textContent = '';
}

function updateUIStatus(status) {
  if (status.online) {
    statusBadge.className = 'status-badge online';
    statusText.textContent = `Online (${status.username})`;
    startBtn.disabled = true;
    stopBtn.disabled = false;
  } else if (status.connecting) {
    statusBadge.className = 'status-badge connecting';
    statusText.textContent = 'Connecting...';
    startBtn.disabled = true;
    stopBtn.disabled = true;
  } else {
    statusBadge.className = 'status-badge';
    statusText.textContent = 'Offline';
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
}

async function fetchStatus() {
  try {
    const res = await fetch('/status');
    const data = await res.json();
    updateUIStatus(data);
  } catch (err) {
    console.error('Failed to fetch status:', err);
  }
}

async function fetchLogs() {
  try {
    const res = await fetch('/logs');
    const data = await res.json();
    
    if (data.logs && data.logs.length !== lastLogCount) {
      consoleLogs.innerHTML = '';
      data.logs.forEach(log => {
        const div = document.createElement('div');
        div.className = 'log-entry';
        div.textContent = log;
        consoleLogs.appendChild(div);
      });
      consoleLogs.scrollTop = consoleLogs.scrollHeight;
      lastLogCount = data.logs.length;
    }
  } catch (err) {
    console.error('Failed to fetch logs:', err);
  }
}

botForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert();

  const payload = {
    username: document.getElementById('username').value.trim(),
    host: document.getElementById('host').value.trim(),
    port: document.getElementById('port').value.trim() || 25565,
    authType: document.getElementById('authType').value,
    password: document.getElementById('password').value
  };

  startBtn.disabled = true;

  try {
    const res = await fetch('/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!data.success) {
      showAlert(data.message);
      startBtn.disabled = false;
    }
  } catch (err) {
    showAlert('Error sending start command to server.');
    startBtn.disabled = false;
  }
});

stopBtn.addEventListener('click', async () => {
  hideAlert();
  stopBtn.disabled = true;

  try {
    const res = await fetch('/stop', { method: 'POST' });
    const data = await res.json();
    if (!data.success) {
      showAlert(data.message);
    }
  } catch (err) {
    showAlert('Error sending stop command to server.');
  }
});

clearLogsBtn.addEventListener('click', () => {
  consoleLogs.innerHTML = '';
  lastLogCount = 0;
});

// Polling intervals for status and logs
setInterval(fetchStatus, 3000);
setInterval(fetchLogs, 2000);

// Initial fetch
fetchStatus();
fetchLogs();
