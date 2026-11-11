const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const CONFIG_PATH = path.join(__dirname, '..', '..', 'config.json');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Отдаём статические файлы (HTML, CSS)
app.use(express.static(path.join(__dirname, 'public')));

// Главная страница админки
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'settings.html'));
});

// API для сохранения настроек
app.post('/api/settings', (req, res) => {
  try {
    const settings = req.body;
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(settings, null, 2), 'utf8');
    res.json({ success: true, message: 'Настройки сохранены' });
  } catch (error) {
    console.error('Ошибка сохранения настроек:', error);
    res.status(500).json({ success: false, message: 'Ошибка сохранения' });
  }
});

// API для загрузки текущих настроек
app.get('/api/settings', (req, res) => {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf8');
      res.json(JSON.parse(data));
    } else {
      res.json({});
    }
  } catch (error) {
    res.status(500).json({ error: 'Ошибка чтения настроек' });
  }
});

app.listen(PORT, () => {
  console.log(`Веб-панель доступна по адресу: http://localhost:${PORT}/admin`);
});
