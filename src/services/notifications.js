// Система уведомлений

const moment = require('moment');
const { google } = require('googleapis');
const messages = require('../config/messages');

class NotificationService {
  constructor() {
    this.notifications = [];
    this.setupGoogleCalendar();
  }

  // Настройка Google Calendar
  setupGoogleCalendar() {
    // Здесь будет логика настройки Google Calendar
    // Пока используем заглушку
    console.log('Google Calendar setup');
  }

  // Планирование уведомлений
  scheduleNotifications(booking) {
    const notifications = [];
    
    // Напоминание за 24 часа
    const reminder24h = moment(booking.date + ' ' + booking.time)
      .subtract(24, 'hours');
    
    notifications.push({
      id: `reminder_24h_${booking.bookingId}`,
      userId: booking.userId,
      type: 'reminder_24h',
      message: messages.reminder24h
        .replace('{name}', booking.userName)
        .replace('{date}', moment(booking.date).format('DD.MM.YYYY'))
        .replace('{time}', booking.time)
        .replace('{service}', booking.service.name),
      scheduledAt: reminder24h.toDate(),
      sent: false
    });
    
    // Напоминание за 2 часа
    const reminder2h = moment(booking.date + ' ' + booking.time)
      .subtract(2, 'hours');
    
    notifications.push({
      id: `reminder_2h_${booking.bookingId}`,
      userId: booking.userId,
      type: 'reminder_2h',
      message: messages.reminder2h
        .replace('{name}', booking.userName)
        .replace('{service}', booking.service.name),
      scheduledAt: reminder2h.toDate(),
      sent: false
    });
    
    this.notifications.push(...notifications);
    
    // Планирование отправки уведомлений
    this.scheduleNotificationSending(notifications[0]);
    this.scheduleNotificationSending(notifications[1]);
    
    return notifications;
  }

  // Планирование отправки уведомления
  scheduleNotificationSending(notification) {
    const now = moment();
    const scheduledTime = moment(notification.scheduledAt);
    
    if (scheduledTime.isAfter(now)) {
      const delay = scheduledTime.diff(now);
      
      setTimeout(() => {
        this.sendNotification(notification);
      }, delay);
    }
  }

  // Отправка уведомления
  async sendNotification(notification) {
    // Проверка, не было ли уведомление уже отправлено
    if (notification.sent) {
      return;
    }
    
    try {
      // Здесь будет логика отправки уведомления через Telegram или VK
      // Пока используем заглушку
      console.log(`Отправка уведомления: ${notification.message}`);
      
      // Отправка через Telegram
      if (notification.userId.startsWith('tg_')) {
        // Логика отправки через Telegram
        console.log(`Отправка через Telegram пользователю ${notification.userId}`);
      }
      
      // Отправка через VK
      else if (notification.userId.startsWith('vk_')) {
        // Логика отправки через VK
        console.log(`Отправка через VK пользователю ${notification.userId}`);
      }
      
      // Помечаем уведомление как отправленное
      notification.sent = true;
      
      // Обновляем запись в базе данных
      await this.updateNotificationStatus(notification.id, true);
    } catch (error) {
      console.error('Ошибка при отправке уведомления:', error);
    }
  }

  // Обновление статуса уведомления
  async updateNotificationStatus(notificationId, sent) {
    // Здесь будет логика обновления статуса уведомления в базе данных
    // Пока используем заглушку
    console.log(`Обновление статуса уведомления ${notificationId}: ${sent}`);
  }

  // Отправка чек-листа после записи
  async sendChecklist(userId, checklistType) {
    // Здесь будет логика отправки чек-листа
    // Пока используем заглушку
    console.log(`Отправка чек-листа ${checklistType} пользователю ${userId}`);
  }

  // Отправка запроса на отзыв
  async sendReviewRequest(userId, userName) {
    // Здесь будет логика отправки запроса на отзыв
    // Пока используем заглушку
    console.log(`Отправка запроса на отзыв пользователю ${userId}`);
  }

  // Отправка уведомления об открытии записи
  async sendBookingAvailableNotification(userId, userName) {
    // Здесь будет логика отправки уведомления об открытии записи
    // Пока используем заглушку
    console.log(`Отправка уведомления об открытии записи пользователю ${userId}`);
  }
}

module.exports = NotificationService;