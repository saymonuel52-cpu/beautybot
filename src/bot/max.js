// MAX бот (адаптер, аналогичный vk.js)

const { Bot } = require('@maxhub/max-bot-api');
const moment = require('moment');
const { services } = require('../config/services');
const messages = require('../config/messages');

class MaxBot {
  constructor(token, scheduler, googleSheetsService) {
    this.bot = new Bot(token);
    this.scheduler = scheduler;
    this.googleSheetsService = googleSheetsService;
    this.sessions = new Map();
    this.setupHandlers();
  }

  getSession(userId) {
    if (!this.sessions.has(userId)) {
      this.sessions.set(userId, {
        user: { id: userId, name: null, isReturning: false, lastService: null },
        selectedServiceType: null,
        selectedServiceKey: null,
        selectedDate: null,
        selectedTime: null
      });
    }
    return this.sessions.get(userId);
  }

  setupHandlers() {
    // Обработка запуска бота
    this.bot.on('bot_started', async (ctx) => {
      const userId = ctx.user.user_id;
      const session = this.getSession(userId);
      await ctx.reply(messages.welcome);
    });

    // Обработка текстовых сообщений
    this.bot.on('message_created', async (ctx) => {
      const userId = ctx.user.user_id;
      const session = this.getSession(userId);
      const text = ctx.message.body?.text || '';

      if (text === '/start' || text === 'Начать') {
        await ctx.reply(messages.welcome);
        return;
      }

      if (!session.user.name) {
        session.user.name = text;
        const msg = session.user.isReturning
          ? messages.returningUser.replace('{name}', text).replace('{lastService}', session.user.lastService || 'нашу услугу')
          : messages.newUser.replace('{name}', text);
        await ctx.reply(msg);
        await this.showServiceMenu(ctx);
        return;
      }

      await this.showServiceMenu(ctx);
    });

    // Обработка нажатий на inline-кнопки
    this.bot.on('message_callback', async (ctx) => {
      const userId = ctx.user.user_id;
      const session = this.getSession(userId);
      let payload;
      try {
        payload = JSON.parse(ctx.callback.payload || '{}');
      } catch {
        payload = {};
      }
      console.log(`MAX event: ${userId}:`, JSON.stringify(payload));

      try {
        switch (payload.command) {
          case 'service':
            await this.handleServiceSelection(ctx, session, payload);
            break;
          case 'service_item':
            await this.handleServiceItem(ctx, session, payload);
            break;
          case 'date':
            await this.showTimes(ctx, session, payload.date);
            break;
          case 'slot':
            await this.handleSlotSelection(ctx, session, payload);
            break;
          case 'confirm':
            await this.confirmBooking(ctx, session);
            break;
          case 'back_to_services':
            await this.showServiceMenu(ctx);
            break;
          case 'back_to_dates':
            await this.showDates(ctx, session);
            break;
          case 'cancel_booking':
            session.selectedServiceType = null;
            session.selectedServiceKey = null;
            session.selectedDate = null;
            session.selectedTime = null;
            await ctx.reply('Запись отменена. Если захотите записаться снова — напишите любое сообщение.');
            break;
          default:
            await ctx.answerOnCallback({ notification: 'OK' });
        }
      } catch (err) {
        console.error('MAX event error:', err);
        try {
          await ctx.reply('Что-то пошло не так. Попробуйте ещё раз или напишите /start.');
        } catch (_) {}
      }
    });
  }

  async showServiceMenu(ctx) {
    const keyboard = [];
    const serviceTypes = Object.keys(services);
    serviceTypes.forEach(type => {
      if (Object.keys(services[type].items).length === 0) return;
      keyboard.push([{
        type: 'callback',
        text: services[type].name,
        payload: JSON.stringify({ command: 'service', type })
      }]);
    });

    await ctx.reply(messages.serviceSelection, {
      attachments: [{
        type: 'inline_keyboard',
        payload: { buttons: keyboard }
      }]
    });
  }

  async handleServiceSelection(ctx, session, payload) {
    session.selectedServiceType = payload.type;
    const serviceItems = services[payload.type].items;
    const keyboard = [];
    Object.keys(serviceItems).forEach(key => {
      const item = serviceItems[key];
      keyboard.push([{
        type: 'callback',
        text: `${item.name} — ${item.price}₽`,
        payload: JSON.stringify({ command: 'service_item', type: payload.type, key })
      }]);
    });
    keyboard.push([{
      type: 'callback',
      text: '← Назад',
      payload: JSON.stringify({ command: 'back_to_services' })
    }]);

    await ctx.reply('Выберите конкретную услугу:', {
      attachments: [{ type: 'inline_keyboard', payload: { buttons: keyboard } }]
    });
  }

  async handleServiceItem(ctx, session, payload) {
    session.selectedServiceType = payload.type;
    session.selectedServiceKey = payload.key;
    await this.showDates(ctx, session);
  }

  async showDates(ctx, session) {
    const item = services[session.selectedServiceType].items[session.selectedServiceKey];
    const slots = this.scheduler.getAvailableSlots(item.duration, 7);
    const datesMap = new Map();
    for (const s of slots) {
      if (!datesMap.has(s.date)) datesMap.set(s.date, { date: s.date, dayLabel: s.dayLabel });
    }
    const dates = Array.from(datesMap.values());

    if (dates.length === 0) {
      await ctx.reply('К сожалению, свободных слотов нет. Попробуйте позже.');
      return;
    }

    const rows = [];
    for (let i = 0; i < dates.length; i += 3) {
      rows.push(dates.slice(i, i + 3).map(d => ({
        type: 'callback',
        text: d.dayLabel,
        payload: JSON.stringify({ command: 'date', date: d.date })
      })));
    }
    rows.push([{
      type: 'callback',
      text: '← Назад',
      payload: JSON.stringify({ command: 'back_to_services' })
    }]);

    await ctx.reply(`"${item.name}" (${item.duration} мин, ${item.price} ₽)\nВыберите удобную дату:`, {
      attachments: [{ type: 'inline_keyboard', payload: { buttons: rows } }]
    });
  }

  async showTimes(ctx, session, dateStr) {
    const item = services[session.selectedServiceType].items[session.selectedServiceKey];
    session.selectedDate = dateStr;

    const slots = this.scheduler.getAvailableSlots(item.duration, 7).filter(s => s.date === dateStr);
    if (slots.length === 0) {
      await ctx.reply('На эту дату слотов больше нет. Выберите другую.');
      return;
    }

    const rows = [];
    for (let i = 0; i < slots.length; i += 5) {
      rows.push(slots.slice(i, i + 5).map(s => ({
        type: 'callback',
        text: s.time,
        payload: JSON.stringify({ command: 'slot', date: s.date, time: s.time })
      })));
    }
    rows.push([{
      type: 'callback',
      text: '← Другая дата',
      payload: JSON.stringify({ command: 'back_to_dates' })
    }]);

    const dateFormatted = moment(dateStr).format('DD.MM.YYYY (dd)');
    await ctx.reply(`Свободное время ${dateFormatted}:`, {
      attachments: [{ type: 'inline_keyboard', payload: { buttons: rows } }]
    });
  }

  async handleSlotSelection(ctx, session, payload) {
    session.selectedDate = payload.date;
    session.selectedTime = payload.time;
    await this.showConfirmation(ctx, session);
  }

  async showConfirmation(ctx, session) {
    const item = services[session.selectedServiceType].items[session.selectedServiceKey];
    const dateFormatted = moment(session.selectedDate).format('DD.MM.YYYY (dd)');

    const text = `${session.user.name}, проверьте запись:\n\n` +
      `Услуга: ${item.name}\n` +
      `Дата: ${dateFormatted}\n` +
      `Время: ${session.selectedTime}\n` +
      `Длительность: ${item.duration} мин\n` +
      `Стоимость: ${item.price} ₽\n\n` +
      `Всё верно?`;

    await ctx.reply(text, {
      attachments: [{
        type: 'inline_keyboard',
        payload: {
          buttons: [[
            { type: 'callback', text: '✓ Подтвердить', payload: JSON.stringify({ command: 'confirm' }) },
            { type: 'callback', text: '✗ Отмена', payload: JSON.stringify({ command: 'cancel_booking' }) }
          ]]
        }
      }]
    });
  }

  async confirmBooking(ctx, session) {
    const item = services[session.selectedServiceType].items[session.selectedServiceKey];
    const booking = this.scheduler.bookSlot(
      session.selectedDate, session.selectedTime, ctx.user.user_id,
      { name: item.name, duration: item.duration, price: item.price }
    );

    if (!booking.success) {
      await ctx.reply(booking.message + '\n\nВыберите другое время.');
      session.selectedTime = null;
      await this.showTimes(ctx, session, session.selectedDate);
      return;
    }

    if (this.googleSheetsService && process.env.GOOGLE_SHEET_ID) {
      try {
        await this.googleSheetsService.saveBooking(process.env.GOOGLE_SHEET_ID, {
          id: booking.bookingId, userId: 'max_' + ctx.user.user_id, userName: session.user.name,
          service: item.name, date: session.selectedDate, time: session.selectedTime, status: 'confirmed'
        });
      } catch (err) {
        console.error('Failed to save booking to Google Sheets:', err);
      }
    }

    const dateFormatted = moment(session.selectedDate).format('DD.MM.YYYY (dd)');
    await ctx.reply(
      `✓ Спасибо, ${session.user.name}!\n\n` +
      `Вы записаны:\n${item.name}\n${dateFormatted} в ${session.selectedTime}\n\n` +
      `Мы пришлём напоминание за день и за 2 часа до процедуры.`
    );

    console.log(`[BOOKING] ${session.user.name} (max_${ctx.user.user_id}): ${item.name} на ${dateFormatted} ${session.selectedTime}`);

    session.selectedServiceType = null;
    session.selectedServiceKey = null;
    session.selectedDate = null;
    session.selectedTime = null;
  }

  start() {
    this.bot.start();
    console.log('MAX bot started');
  }

  stop() {
    if (this.bot.stop) this.bot.stop();
    console.log('MAX bot stopped');
  }
}

module.exports = MaxBot;
