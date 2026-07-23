const mineflayer = require('mineflayer');

let bot = null;
let afkInterval = null;
let reconnectTimeout = null;
let logs = [];
let isStopping = false;
let config = null;

const MAX_LOGS = 200;

function log(message) {
  const timestamp = new Date().toLocaleTimeString();
  const formattedLog = `[${timestamp}] ${message}`;
  logs.push(formattedLog);
  if (logs.length > MAX_LOGS) {
    logs.shift();
  }
  console.log(formattedLog);
}

function startBot(options) {
  if (bot) {
    log('A bot is already running or attempting to connect.');
    return false;
  }

  isStopping = false;
  config = options;

  const { host, port, username, authType, password } = options;

  log(`Connecting to ${host}:${port} as ${username}...`);

  try {
    bot = mineflayer.createBot({
      host: host,
      port: parseInt(port, 10) || 25565,
      username: username,
      version: false
    });

    setupBotEvents(authType, password);
    return true;
  } catch (err) {
    log(`Failed to initiate bot: ${err.message}`);
    cleanup();
    return false;
  }
}

function setupBotEvents(authType, password) {
  bot.once('spawn', () => {
    log('Bot successfully spawned into the server!');

    // Handle Login/Register auth commands
    if (password && authType) {
      setTimeout(() => {
        if (bot) {
          log(`Executing auth command: ${authType} ***`);
          bot.chat(`${authType} ${password}`);
        }
      }, 3000);
    }

    // Start anti-AFK jumping
    startAntiAfk();
  });

  bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    log(`<${username}> ${message}`);
  });

  bot.on('messagestr', (message, position) => {
    if (position === 'game_info') return; // Ignore action bar noise
    if (message.trim()) {
      log(`[Server] ${message}`);
    }
  });

  bot.on('kicked', (reason) => {
    log(`Bot was kicked: ${reason}`);
  });

  bot.on('error', (err) => {
    log(`Bot error: ${err.message}`);
  });

  bot.on('end', (reason) => {
    log(`Bot disconnected: ${reason}`);
    cleanup();

    if (!isStopping && config) {
      log('Attempting automatic reconnect in 10 seconds...');
      reconnectTimeout = setTimeout(() => {
        if (!isStopping && config) {
          startBot(config);
        }
      }, 10000);
    }
  });
}

function startAntiAfk() {
  stopAntiAfk();
  afkInterval = setInterval(() => {
    if (bot) {
      bot.setControlState('jump', true);
      setTimeout(() => {
        if (bot) {
          bot.setControlState('jump', false);
        }
      }, 500);
    }
  }, 10000); // Jump every 10 seconds
}

function stopAntiAfk() {
  if (afkInterval) {
    clearInterval(afkInterval);
    afkInterval = null;
  }
}

function cleanup() {
  stopAntiAfk();
  if (bot) {
    bot.removeAllListeners();
    bot = null;
  }
}

function stopBot() {
  isStopping = true;
  config = null;

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (bot) {
    log('Stopping bot manually...');
    try {
      bot.quit();
    } catch (e) {
      log(`Error while quitting bot: ${e.message}`);
    }
    cleanup();
    log('Bot stopped.');
    return true;
  } else {
    log('No active bot to stop.');
    return false;
  }
}

function getStatus() {
  return {
    online: !!bot && !!bot.entity,
    connecting: !!bot && !bot.entity,
    username: config ? config.username : null,
    host: config ? config.host : null
  };
}

function getLogs() {
  return logs;
}

module.exports = {
  startBot,
  stopBot,
  getStatus,
  getLogs
};
