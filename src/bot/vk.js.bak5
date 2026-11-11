// VK бот

const { VK } = require('vk-io');
const moment = require('moment');
const { services } = require('../config/services');
const messages = require('../config/messages');

class VKBot {
  constructor(token, groupId, scheduler, googleSheetsService) {
    this.vk = new VK({ token: token, pollingGroupId: groupId });
    this.scheduler = scheduler;
    this.googleSheetsService = googleSheetsService;
    this.sessions = new Map();
    this.setupHearManager();
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

  setupHearManager() {
    this.vk.updates.on('message_new', async (context) => {
      if (context.isOutbox) return;
      console.log(`VK text: ${context.senderId}: ${context.text || 'no text'}`);
      const session = this.getSession(context.senderId);

      if (context.text === '/start' || context.text === 'Начать') {
        await context.send(messages.welcome);
        return;
      }

      if (!session.user.name) {
        session.user.name = context.text;
        const msg = session.user.isReturning
          ? messages.returningUser.replace('{name}', context.text).replace('{lastService}', session.user.lastService || 'нашу услугу')
          : messages.newUser.replace('{name}', context.text);
        await context.send(msg);
        await this.showServiceMenu(context);
        return;
      }

      await this.showServiceMenu(context);
    });

    this.vk.updates.on('message_event', async (context) => {
      const payload = context.eventPayload || {};
      console.log(`VK event: ${context.senderId}:`, JSON.stringify(payload));
      const session = this.getSession(context.senderId);

      try {
        switch (payload.command) {
          case 'service':
            await this.handleServiceSelection(context, session, payload);
            break;
          case 'service_item':
            await this.handleServiceItem(context, session, payload);
            break;
          case 'date':
            await this.showTimes(context, session, payload.date);
            break;
          case 'slot':
            await this.handleSlotSelection(context, session, payload);
            break;
          case 'confirm':
            await this.confirmBooking(context, session);
            break;
          case 'back_to_services':
            await this.showServiceMenu(context);
            break;
          case 'back_to_dates':
            await this.showDates(context, session);
            break;
          case 'cancel_booking':
            session.selectedServiceType = null;
            session.selectedServiceKey = null;
            session.selectedDate = null;
            session.selectedTime = null;
            await context.send('Запись отменена. Если захотите записаться снова — напишите любое сообщение.');
            break;
          default:
            await context.send({ eventData: JSON.stringify({ type: 'show_snackbar', text: 'OK' }) });
        }
      } catch (err) {
        console.error('VK event error:', err);
        try {
          await context.send('Что-то пошло не так. Попробуйте ещё раз или напишите /start.');
        } catch (_) {}
      }
    });
  }

  async showServiceMenu(context) {
    const keyboard = [];
    const serviceTypes = Object.keys(services);
    serviceTypes.forEach(type => {
      if (Object.keys(services[type].items).length === 0) return;
      keyboard.push([{ action: { type: 'text', label: services[type].name, payload: JSON.stringify({ command: 'service', type }) } }]);
    });
    await context.send({ message: messages.serviceSelection, keyboard: { inline: true, buttons: keyboard } });
  }

  async handleServiceSelection(context, session, payload) {
    session.selectedServiceType = payload.type;
    const serviceItems = services[payload.type].items;
    const keyboard = [];
    Object.keys(serviceItems).forEach(key => {
      const item = serviceItems[key];
      keyboard.push([{ action: { type: 'text', label: `${item.name} — ${item.price}₽`, payload: JSON.stringify({ command: 'service_item', type: payload.type, key }) } }]);
    });
    keyboard.push([{ action: { type: 'text', label: '← Назад', payload: JSON.stringify({ command: 'back_to_services' }) } }]);
    await context.send({ message: 'Выберите конкретную услугу:', keyboard: { inline: true, buttons: keyboard } });
  }

  async handleServiceItem(context, session, payload) {
    session.selectedServiceType = payload.type;
    session.selectedServiceKey = payload.key;
    await this.showDates(context, session);
  }

  async showDates(context, session) {
    const item = services[session.selectedServiceType].items[session.selectedServiceKey];
    const slots = this.scheduler.getAvailableSlots(item.duration, 7);
    const datesMap = new Map();
    for (const s of slots) {
      if (!datesMap.has(s.date)) datesMap.set(s.date, { date: s.date, dayLabel: s.dayLabel });
    }
    const dates = Array.from(datesMap.values());

    if (dates.length === 0) {
      await context.send('К сожалению, свободных слотов нет. Попробуйте позже.');
      return;
    }

    const rows = [];
    for (let i = 0; i < dates.length; i += 3) {
      rows.push(dates.slice(i, i + 3).map(d => ({
        action: { type: 'text', label: d.dayLabel, payload: JSON.stringify({ command: 'date', date: d.date }) }
      })));
    }
    rows.push([{ action: { type: 'text', label: '← Назад', payload: JSON.stringify({ command: 'back_to_services' }) } }]);

    await context.send({
      message: `"${item.name}" (${item.duration} мин, ${item.price} ₽)\nВыберите удобную дату:`,
      keyboard: { inline: true, buttons: rows }
    });
  }

  async showTimes(context, session, dateStr) {
    const item = services[session.selectedServiceType].items[session.selectedServiceKey];
    session.selectedDate = dateStr;

    const slots = this.scheduler.getAvailableSlots(item.duration, 7).filter(s => s.date === dateStr);
    if (slots.length === 0) {
      await context.send('На эту дату слотов больше нет. Выберите другую.');
      return;
    }

    const rows = [];
    for (let i = 0; i < slots.length; i += 5) {
      rows.push(slots.slice(i, i + 5).map(s => ({
        action: { type: 'text', label: s.time, payload: JSON.stringify({ command: 'slot', date: s.date, time: s.time }) }
      })));
    }
    rows.push([{ action: { type: 'text', label: '← Другая дата', payload: JSON.stringify({ command: 'back_to_dates' }) } }]);

    const dateFormatted = moment(dateStr).format('DD.MM.YYYY (dd)');
    await context.send({
      message: `Свободное время ${dateFormatted}:`,
      keyboard: { inline: true, buttons: rows }
    });
  }

  async handleSlotSelection(context, session, payload) {
    session.selectedDate = payload.date;
    session.selectedTime = payload.time;
    await this.showConfirmation(context, session);
  }

  async showConfirmation(context, session) {
    const item = services[session.selectedServiceType].items[session.selectedServiceKey];
    const dateFormatted = moment(session.selectedDate).format('DD.MM.YYYY (dd)');

    const text = `${session.user.name}, проверьте запись:\n\n` +
      `Услуга: ${item.name}\n` +
      `Дата: ${dateFormatted}\n` +
      `Время: ${session.selectedTime}\n` +
      `Длительность: ${item.duration} мин\n` +
      `Стоимость: ${item.price} ₽\n\n` +
      `Всё верно?`;

    await context.send({
      message: text,
      keyboard: { inline: true, buttons: [[
        { action: { type: 'text', label: '✓ Подтвердить', payload: JSON.stringify({ command: 'confirm' }) } },
        { action: { type: 'text', label: '✗ Отмена', payload: JSON.stringify({ command: 'cancel_booking' }) } }
      ]] }
    });
  }

  async confirmBooking(context, session) {
    const item = services[session.selectedServiceType].items[session.selectedServiceKey];
    const booking = this.scheduler.bookSlot(
      session.selectedDate, session.selectedTime, context.senderId,
      { name: item.name, duration: item.duration, price: item.price }
    );

    if (!booking.success) {
      await context.send(booking.message + '\n\nВыберите другое время.');
      session.selectedTime = null;
      await this.showTimes(context, session, session.selectedDate);
      return;
    }

    if (this.googleSheetsService && process.env.GOOGLE_SHEET_ID) {
      try {
        await this.googleSheetsService.saveBooking(process.env.GOOGLE_SHEET_ID, {
          id: booking.bookingId, userId: 'vk_' + context.senderId, userName: session.user.name,
          service: item.name, date: session.selectedDate, time: session.selectedTime, status: 'confirmed'
        });
      } catch (err) {
        console.error('Failed to save booking to Google Sheets:', err);
      }
    }

    const dateFormatted = moment(session.selectedDate).format('DD.MM.YYYY (dd)');
    await context.send(
      `✓ Спасибо, ${session.user.name}!\n\n` +
      `Вы записаны:\n${item.name}\n${dateFormatted} в ${session.selectedTime}\n\n` +
      `Мы пришлём напоминание за день и за 2 часа до процедуры.`
    );

    console.log(`[BOOKING] ${session.user.name} (vk_${context.senderId}): ${item.name} на ${dateFormatted} ${session.selectedTime}`);

    session.selectedServiceType = null;
    session.selectedServiceKey = null;
    session.selectedDate = null;
    session.selectedTime = null;
  }

  start() { this.vk.updates.startPolling(); console.log('VK bot started'); }
  stop() { this.vk.updates.stopPolling(); console.log('VK bot stopped'); }
}

module.exports = VKBot;
