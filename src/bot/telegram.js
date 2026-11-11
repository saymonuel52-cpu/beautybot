// Telegram бот

const { Telegraf } = require('telegraf');
const { services } = require('../config/services');
const messages = require('../config/messages');

class TelegramBot {
  constructor(token) {
    this.bot = new Telegraf(token);
    this.setupMiddleware();
    this.setupCommands();
    this.setupActions();
  }

  setupMiddleware() {
    this.bot.use((ctx, next) => {
      console.log(`Telegram: ${ctx.from.id} - ${ctx.from.first_name} ${ctx.from.last_name || ''}: ${ctx.message?.text || 'no text'}`);
      return next();
    });

    this.bot.use(async (ctx, next) => {
      ctx.session = ctx.session || {};
      ctx.session.user = ctx.session.user || {
        id: ctx.from.id,
        name: ctx.from.first_name,
        isReturning: false,
        lastService: null
      };
      return next();
    });
  }

  setupCommands() {
    this.bot.start((ctx) => {
      ctx.reply(messages.welcome);
      ctx.session.state = 'waiting_for_name';
    });

    this.bot.help((ctx) => {
      ctx.reply('Я бот салона красоты Светланы Соловьевой. Я могу помочь вам записаться на процедуру.\n\nДля начала записи просто отправьте мне любое сообщение.');
    });

    this.bot.command('cancel', (ctx) => {
      ctx.session.state = null;
      ctx.reply('Запись отменена. Если вы хотите записаться на процедуру, просто отправьте мне любое сообщение.');
    });
  }

  setupActions() {
    this.bot.on('text', (ctx) => {
      const text = ctx.message.text;
      const state = ctx.session.state;

      switch (state) {
        case 'waiting_for_name':
          this.handleNameInput(ctx, text);
          break;
        default:
          this.handleMainMenu(ctx);
          break;
      }
    });

    this.bot.on('callback_query', (ctx) => {
      const data = ctx.callbackQuery.data;
      const parts = data.split(':');

      if (parts[0] === 'service') {
        this.handleServiceSelection(ctx, parts);
      } else if (data.startsWith('time_')) {
        this.handleTimeSelection(ctx, data);
      } else if (data === 'new_user') {
        this.handleNewUser(ctx);
      } else if (data === 'returning_user') {
        this.handleReturningUser(ctx);
      } else if (data === 'confirm') {
        this.handleConfirmation(ctx);
      } else {
        ctx.answerCbQuery();
      }
    });
  }

  handleNameInput(ctx, name) {
    ctx.session.user.name = name;
    ctx.session.state = null;

    const message = ctx.session.user.isReturning
      ? messages.returningUser.replace('{name}', name)
      : messages.newUser.replace('{name}', name);

    if (ctx.session.user.isReturning && ctx.session.user.lastService) {
      ctx.reply(message, {
        reply_markup: {
          inline_keyboard: [
            [{ text: `Повторить ${ctx.session.user.lastService}`, callback_data: 'repeat_last' }],
            [{ text: 'Выбрать другую услугу', callback_data: 'choose_service' }]
          ]
        }
      });
    } else {
      ctx.reply(message);
      this.showServiceMenu(ctx);
    }
  }

  showServiceMenu(ctx) {
    const keyboard = [];
    const serviceTypes = Object.keys(services);

    serviceTypes.forEach(type => {
      if (Object.keys(services[type].items).length === 0) return;
      keyboard.push([{ text: services[type].name, callback_data: `service:${type}` }]);
    });

    ctx.reply(messages.serviceSelection, {
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  handleServiceSelection(ctx, parts) {
    const serviceType = parts[1];

    if (parts.length === 2) {
      ctx.session.selectedServiceType = serviceType;
      const serviceItems = services[serviceType].items;
      const keyboard = [];

      Object.keys(serviceItems).forEach(key => {
        const item = serviceItems[key];
        keyboard.push([{
          text: `${item.name} (${item.duration} мин, ${item.price} руб)`,
          callback_data: `service:${serviceType}:${key}`
        }]);
      });

      keyboard.push([{ text: 'Назад', callback_data: 'back_to_services' }]);

      ctx.editMessageText('Пожалуйста, выберите конкретную услугу:', {
        reply_markup: { inline_keyboard: keyboard }
      });
      ctx.answerCbQuery();
      return;
    }

    if (parts.length === 3) {
      ctx.session.selectedServiceKey = parts[2];
      const item = services[serviceType].items[parts[2]];
      ctx.editMessageText(`Выбрана услуга: ${item.name}\n\nСкоро здесь будет выбор времени.`);
      ctx.answerCbQuery();
      return;
    }

    ctx.answerCbQuery();
  }

  handleMainMenu(ctx) {
    const message = messages.mainMenu.replace('{name}', ctx.session.user.name);
    this.showServiceMenu(ctx);
  }

  handleNewUser(ctx) {
    ctx.session.user.isReturning = false;
    ctx.editMessageText(messages.newUser.replace('{name}', ctx.session.user.name));
    this.showServiceMenu(ctx);
    ctx.answerCbQuery();
  }

  handleReturningUser(ctx) {
    ctx.session.user.isReturning = true;
    const message = messages.returningUser
      .replace('{name}', ctx.session.user.name)
      .replace('{lastService}', ctx.session.user.lastService || 'нашу услугу');

    ctx.editMessageText(message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Да, повторить', callback_data: 'repeat_last' }],
          [{ text: 'Нет, выбрать другую', callback_data: 'choose_service' }]
        ]
      }
    });
    ctx.answerCbQuery();
  }

  handleTimeSelection(ctx, data) {
    ctx.session.selectedTime = '2026-01-10 14:00';

    const serviceType = ctx.session.selectedServiceType;
    const serviceKey = ctx.session.selectedServiceKey;
    const service = services[serviceType].items[serviceKey];

    const confirmationMessage = messages.confirmation
      .replace('{name}', ctx.session.user.name)
      .replace('{service}', service.name)
      .replace('{date}', '10.01.2026')
      .replace('{time}', '14:00')
      .replace('{duration}', service.duration)
      .replace('{price}', service.price);

    ctx.editMessageText(confirmationMessage, {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Подтвердить запись', callback_data: 'confirm' }],
          [{ text: 'Выбрать другое время', callback_data: 'choose_time' }],
          [{ text: 'Отмена', callback_data: 'cancel' }]
        ]
      }
    });
    ctx.answerCbQuery();
  }

  handleConfirmation(ctx) {
    ctx.editMessageText(`Спасибо, ${ctx.session.user.name}! Вы успешно записаны на процедуру.`);
    ctx.answerCbQuery();
  }

  start() {
    this.bot.launch();
    console.log('Telegram bot started');
  }

  stop() {
    this.bot.stop();
    console.log('Telegram bot stopped');
  }
}

module.exports = TelegramBot;
