# Подробная инструкция по развертыванию чат-бота BeautyBot

## Содержание
1. [Подготовка к развертыванию](#подготовка-к-развертыванию)
2. [Создание бота в Telegram](#создание-бота-в-telegram)
3. [Создание приложения VK](#создание-приложения-vk)
4. [Настройка Google Cloud](#настройка-google-cloud)
5. [Создание Google Sheets](#создание-google-sheets)
6. [Локальное развертывание](#локальное-развертывание)
7. [Развертывание на сервере через Docker](#развертывание-на-сервере-через-docker)
8. [Развертывание на VPS](#развертывание-на-vps)
9. [Настройка вебхуков](#настройка-вебхуков)
10. [Мониторинг и логирование](#мониторинг-и-логирование)
11. [Резервное копирование](#резервное-копирование)
12. [Обновление и обслуживание](#обновление-и-обслуживание)
13. [Устранение неполадок](#устранение-неполадок)

## Подготовка к развертыванию

Перед началом развертывания убедитесь, что у вас установлены следующие компоненты:
- Node.js версии 16 или выше
- Git
- Доступ к интернету

Создайте рабочую директорию для проекта:
```bash
mkdir beautybot
cd beautybot
```

Скачайте исходный код проекта:
```bash
git clone https://github.com/your-repo/beautybot.git .
```

## Создание бота в Telegram

1. Откройте Telegram и найдите @BotFather
2. Отправьте команду `/newbot`
3. Введите имя бота (например, "Салон красоты Светланы")
4. Введите username бота (должен заканчиваться на _bot)
5. Скопируйте полученный токен и сохраните его в безопасном месте

## Создание приложения VK

1. Перейдите на сайт https://vk.com/apps?act=manage
2. Нажмите "Создать приложение"
3. Выберите тип "Сообщество"
4. В настройках сообщества перейдите в раздел "Работа с API"
5. Создайте ключ доступа с правами messages, groups, photos
6. Включите Long Poll API и выберите версию API 5.131
7. В типах событий отметьте "Входящее сообщение"

## Настройка Google Cloud

1. Перейдите на сайт https://console.cloud.google.com/
2. Создайте новый проект
3. Включите Google Sheets API и Google Calendar API:
   - В меню слева выберите "API и сервисы" → "Библиотека"
   - Найдите "Google Sheets API" и включите его
   - Найдите "Google Calendar API" и включите его
4. Создайте сервисный аккаунт:
   - В меню слева выберите "IAM и администрирование" → "Сервисные аккаунты"
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

## Создание Google Sheets

1. Создайте новую таблицу Google Sheets
2. Создайте листы с названиями:
   - Schedule (расписание)
   - Bookings (бронирования)
   - Services (услуги)
   - Clients (клиенты)
3. Добавьте заголовки в каждый лист:

   **Schedule лист:**
   ```
   | Day       | Working | Start Time | End Time |
   |-----------|---------|------------|----------|
   | monday    | true    | 09:00      | 20:00    |
   | tuesday   | true    | 09:00      | 20:00    |
   | wednesday | true    | 09:00      | 20:00    |
   | thursday  | true    | 09:00      | 20:00    |
   | friday    | true    | 09:00      | 20:00    |
   | saturday  | true    | 09:00      | 20:00    |
   | sunday    | false   |            |          |
   ```

   **Bookings лист:**
   ```
   | Booking ID | User ID | User Name | Service | Date       | Time  | Status     |
   |------------|---------|-----------|---------|------------|-------|------------|
   ```

   **Services лист:**
   ```
   | Category | Service Key | Name           | Duration | Price |
   |----------|-------------|----------------|----------|-------|
   | sugaring | deep_bikini | Глубокое бикини| 30       | 1000  |
   | apparatus| lpg         | LPG            | 30       | 1500  |
   ```

   **Clients лист:**
   ```
   | User ID | Phone       | Name          | Type      | Last Service | Last Visit | Bookings Count |
   |---------|-------------|---------------|-----------|--------------|------------|----------------|
   ```

4. Предоставьте доступ сервисному аккаунту:
   - Нажмите кнопку "Доступ" (в правом верхнем углу)
   - Добавьте email сервисного аккаунта с правами редактора

## Локальное развертывание

1. Установите зависимости:
   ```bash
   npm install
   ```

2. Создайте файл `.env` в корне проекта на основе `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Откройте файл `.env` и заполните переменные:
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

4. Запустите приложение:
   ```bash
   npm start
   ```

   Для разработки с автоматической перезагрузкой:
   ```bash
   npm run dev
   ```

## Развертывание на сервере через Docker

1. Установите Docker на сервере:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   ```

2. Установите Docker Compose:
   ```bash
   sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

3. Создайте файл `docker-compose.yml` в корне проекта:
   ```yaml
   version: '3'
   services:
     beautybot:
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

4. Создайте файл `.env` с переменными окружения (см. пример выше)

5. Запустите контейнер:
   ```bash
   docker-compose up -d
   ```

6. Проверьте статус контейнера:
   ```bash
   docker-compose ps
   ```

## Развертывание на VPS

1. Установите Node.js на сервере:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. Скопируйте файлы проекта на сервер:
   ```bash
   scp -r . user@your-server:/path/to/project
   ```

3. Перейдите в директорию проекта на сервере:
   ```bash
   cd /path/to/project
   ```

4. Установите зависимости:
   ```bash
   npm install --production
   ```

5. Создайте файл `.env` с переменными окружения (см. пример выше)

6. Установите PM2 для управления процессами:
   ```bash
   npm install -g pm2
   ```

7. Запустите приложение через PM2:
   ```bash
   pm2 start src/index.js --name beautybot
   pm2 startup
   pm2 save
   ```

8. Настройте автозапуск при перезагрузке сервера:
   ```bash
   pm2 startup
   pm2 save
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
pm2 logs beautybot
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
pm2 restart beautybot
```

### Обновление зависимостей:

```bash
npm update
```

### Мониторинг ошибок:

- Настройте уведомления о критических ошибках
- Регулярно проверяйте логи на наличие предупреждений
- Мониторьте использование ресурсов сервера

### Полезные команды для диагностики:

```bash
# Проверка статуса приложения
pm2 status

# Просмотр логов в реальном времени
pm2 logs --lines 100

# Перезапуск приложения
pm2 restart beautybot

# Проверка использования ресурсов
pm2 monit
```

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

### Контактная информация поддержки:

Если у вас возникли проблемы с развертыванием или работой бота, обратитесь к разработчику:
- Email: support@beautybot.com
- Телефон: +7 (XXX) XXX-XX-XX

## Лицензия

Данный проект распространяется под лицензией MIT. Подробности смотрите в файле LICENSE.