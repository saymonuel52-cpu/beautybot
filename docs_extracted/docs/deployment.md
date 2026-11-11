# Развертывание чат-бота

## Подготовка к развертыванию

### 1. Создание бота в Telegram

1. Откройте Telegram и найдите @BotFather
2. Отправьте команду `/newbot`
3. Введите имя бота (например, "Салон красоты Светланы")
4. Введите username бота (должен заканчиваться на _bot)
5. Скопируйте полученный токен и сохраните его

### 2. Создание приложения VK

1. Перейдите на сайт https://vk.com/apps?act=manage
2. Нажмите "Создать приложение"
3. Выберите тип "Сообщество"
4. В настройках сообщества перейдите в раздел "Работа с API"
5. Создайте ключ доступа с правами messages, groups, photos
6. Включите Long Poll API и выберите версию API 5.131
7. В типах событий отметьте "Входящее сообщение"

### 3. Настройка Google Cloud

1. Перейдите на сайт https://console.cloud.google.com/
2. Создайте новый проект
3. Включите Google Sheets API и Google Calendar API
4. Создайте сервисный аккаунт:
   - Перейдите в "IAM и администрирование" → "Сервисные аккаунты"
   - Нажмите "Создать сервисный аккаунт"
   - Введите имя и описание
   - Нажмите "Создать и продолжить"
   - Добавьте роль "Редактор"
   - Нажмите "Продолжить" и "Готово"
5. Создайте ключ для сервисного аккаунта:
   - Нажмите на созданный сервисный аккаунт
   - Перейдите на вкладку "Ключи"
   - Нажмите "Добавить ключ" → "Создать новый ключ"
   - Выберите тип "JSON" и нажмите "Создать"
   - Сохраните файл ключа в безопасном месте

### 4. Создание Google Sheets

1. Создайте новую таблицу Google Sheets
2. Создайте листы с названиями:
   - Schedule (расписание)
   - Bookings (бронирования)
   - Services (услуги)
   - Clients (клиенты)
3. Добавьте заголовки в каждый лист согласно документации
4. Предоставьте доступ сервисному аккаунту:
   - Нажмите кнопку "Доступ" (в правом верхнем углу)
   - Добавьте email сервисного аккаунта с правами редактора

## Локальное развертывание

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

Создайте файл `.env` на основе `.env.example`:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=ваш_токен_телеграм_бота

# VK Bot Configuration
VK_GROUP_ID=ваш_id_группы_вк
VK_TOKEN=ваш_токен_вк

# Google Sheets Configuration
GOOGLE_SHEET_ID=ваш_id_таблицы_google_sheets
GOOGLE_CLIENT_EMAIL=email_сервисного_аккаунта
GOOGLE_PRIVATE_KEY=приватный_ключ_сервисного_аккаунта

# Google Calendar Configuration
GOOGLE_CALENDAR_ID=ваш_id_календаря_google

# Master Information
MASTER_NAME=Svetlana Solovyeva
MASTER_PHONE=+7XXXXXXXXXX
MASTER_EMAIL=example@email.com

# Notification Settings
NOTIFICATION_TIME_1=24
NOTIFICATION_TIME_2=2

# Server Configuration
PORT=3000
```

### 3. Запуск приложения

```bash
npm start
```

Для разработки с автоматической перезагрузкой:

```bash
npm run dev
```

## Развертывание на сервере

### Вариант 1: Использование Docker

1. Установите Docker на сервере
2. Создайте файл `docker-compose.yml`:

```yaml
version: '3'
services:
  beauty-salon-bot:
    build: .
    ports:
      - "3000:3000"
    environment:
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - VK_GROUP_ID=${VK_GROUP_ID}
      - VK_TOKEN=${VK_TOKEN}
      - GOOGLE_SHEET_ID=${GOOGLE_SHEET_ID}
      - GOOGLE_CLIENT_EMAIL=${GOOGLE_CLIENT_EMAIL}
      - GOOGLE_PRIVATE_KEY=${GOOGLE_PRIVATE_KEY}
      - GOOGLE_CALENDAR_ID=${GOOGLE_CALENDAR_ID}
      - MASTER_NAME=${MASTER_NAME}
      - MASTER_PHONE=${MASTER_PHONE}
      - MASTER_EMAIL=${MASTER_EMAIL}
      - NOTIFICATION_TIME_1=${NOTIFICATION_TIME_1}
      - NOTIFICATION_TIME_2=${NOTIFICATION_TIME_2}
      - PORT=${PORT}
    restart: unless-stopped
```

3. Создайте файл `.env` с переменными окружения
4. Запустите контейнер:

```bash
docker-compose up -d
```

### Вариант 2: Развертывание на VPS

1. Установите Node.js на сервере:

```bash
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. Скопируйте файлы проекта на сервер
3. Установите зависимости:

```bash
npm install --production
```

4. Настройте переменные окружения
5. Запустите приложение с помощью PM2:

```bash
npm install -g pm2
pm2 start src/index.js --name beauty-salon-bot
pm2 startup
pm2 save
```

### Вариант 3: Развертывание на Heroku

1. Установите Heroku CLI
2. Войдите в аккаунт Heroku:

```bash
heroku login
```

3. Создайте приложение:

```bash
heroku create имя-вашего-приложения
```

4. Установите buildpack для Node.js:

```bash
heroku buildpacks:set heroku/nodejs
```

5. Установите переменные окружения:

```bash
heroku config:set TELEGRAM_BOT_TOKEN=ваш_токен
heroku config:set VK_GROUP_ID=ваш_id_группы
# и так далее для всех переменных
```

6. Задеплойте приложение:

```bash
git push heroku main
```

## Настройка вебхуков

### Для Telegram:

1. Установите вебхук:

```bash
curl -F "url=https://ваш-домен.com/telegram/webhook" https://api.telegram.org/bot<ТОКЕН>/setWebhook
```

### Для VK:

1. Перейдите в настройки группы VK
2. В разделе "Работа с API" → "Callback API"
3. Введите URL вашего сервера
4. Подтвердите сервер

## Мониторинг и логирование

### Просмотр логов:

```bash
# Для Docker
docker-compose logs -f

# Для PM2
pm2 logs beauty-salon-bot
```

### Метрики производительности:

- Количество обработанных сообщений
- Время отклика бота
- Количество активных сессий
- Статус подключений к API

## Резервное копирование

### Резервное копирование Google Sheets:

1. Настройте автоматическое резервное копирование таблиц Google Sheets
2. Используйте Google Apps Script для экспорта данных в формате CSV

### Резервное копирование конфигурации:

1. Регулярно сохраняйте файл .env в безопасном месте
2. Экспортируйте ключи сервисных аккаунтов

## Обновление и обслуживание

### Обновление кода:

```bash
git pull origin main
npm install
pm2 restart beauty-salon-bot
```

### Обновление зависимостей:

```bash
npm update
```

### Мониторинг ошибок:

- Настройте уведомления о критических ошибках
- Регулярно проверяйте логи на наличие предупреждений
- Мониторьте использование ресурсов сервера

## Устранение неполадок

### Распространенные проблемы:

1. **Бот не отвечает**:
   - Проверьте правильность токена
   - Убедитесь, что приложение запущено
   - Проверьте настройки вебхуков

2. **Ошибки подключения к Google Sheets**:
   - Проверьте правильность учетных данных
   - Убедитесь, что сервисный аккаунт имеет доступ к таблице
   - Проверьте квоты API Google

3. **Проблемы с уведомлениями**:
   - Проверьте настройки времени уведомлений
   - Убедитесь, что система времени сервера синхронизирована

### Полезные команды для диагностики:

```bash
# Проверка статуса приложения
pm2 status

# Просмотр логов в реальном времени
pm2 logs --lines 100

# Перезапуск приложения
pm2 restart beauty-salon-bot

# Проверка использования ресурсов
pm2 monit