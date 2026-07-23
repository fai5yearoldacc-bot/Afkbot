const express = require('express');
const path = require('path');
const { startBot, stopBot, getStatus, getLogs } = require('./bot');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/start', (req, res) => {
  const { host, port, username, authType, password } = req.body;

  if (!host || !username) {
    return res.status(400).json({
      success: false,
      message: 'Server IP and Bot Name are required.'
    });
  }

  const currentStatus = getStatus();
  if (currentStatus.online || currentStatus.connecting) {
    return res.status(400).json({
      success: false,
      message: 'A bot instance is already running.'
    });
  }

  const started = startBot({
    host,
    port: port || 25565,
    username,
    authType: authType || '/login',
    password: password || ''
  });

  if (started) {
    return res.json({ success: true, message: 'Bot connection initiated.' });
  } else {
    return res.status(500).json({ success: false, message: 'Failed to start bot.' });
  }
});

app.post('/stop', (req, res) => {
  const stopped = stopBot();
  if (stopped) {
    return res.json({ success: true, message: 'Bot stopped successfully.' });
  } else {
    return res.status(400).json({ success: false, message: 'No active bot to stop.' });
  }
});

app.get('/status', (req, res) => {
  res.json(getStatus());
});

app.get('/logs', (req, res) => {
  res.json({ logs: getLogs() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
