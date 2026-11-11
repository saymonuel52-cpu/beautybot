const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', '..', 'config.json');

let cachedConfig = null;

function loadConfig(forceReload = false) {
  if (cachedConfig && !forceReload) return cachedConfig;
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      let raw = fs.readFileSync(CONFIG_PATH, 'utf8');
      raw = raw.replace(/^\\uFEFF/, '');
      cachedConfig = JSON.parse(raw);
    } else {
      cachedConfig = {};
    }
  } catch (err) {
    console.error('[config] Ошибка загрузки:', err.message);
    cachedConfig = {};
  }
  return cachedConfig;
}

module.exports = { loadConfig, CONFIG_PATH };
