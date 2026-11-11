// Система управления расписанием

const moment = require('moment');

class Scheduler {
  constructor() {
    this.schedule = {};
    this.bookedSlots = []; // массив { date: 'YYYY-MM-DD', time: 'HH:MM', duration: N }
    this.setupDefaultSchedule();
  }

  setupDefaultSchedule() {
    try {
      const config = require('../config/loader').loadConfig(true);
      if (config && config.schedule) {
        this.schedule = config.schedule;
        return;
      }
    } catch (e) {
      console.warn('[Scheduler] Не удалось загрузить расписание из config.json, используем дефолт');
    }

    // Дефолт, если конфиг пуст
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    weekdays.forEach(day => {
      this.schedule[day] = { working: true, start: '09:00', end: '20:00', breaks: [{ start: '13:00', end: '14:00' }] };
    });
    this.schedule.sunday = { working: false };
  }

  // Преобразование "HH:MM" в минуты от начала дня
  timeToMinutes(time) {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  // Преобразование минут в "HH:MM"
  minutesToTime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  // Ключ дня недели для moment (0=вс, 1=пн, ...)
  dayKeyFromMoment(m) {
    const map = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return map[m.day()];
  }

  // Пересекается ли [startA, endA) с [startB, endB)?
  overlaps(startA, endA, startB, endB) {
    return startA < endB && startB < endA;
  }

  // Проверка, свободен ли слот [startMin, startMin+duration) в указанный день
  isSlotFree(dateStr, startMin, duration, daySchedule) {
    const endMin = startMin + duration;
    const dayEnd = this.timeToMinutes(daySchedule.end);

    // Не выходим за конец рабочего дня
    if (endMin > dayEnd) return false;

    // Не пересекаемся с перерывами
    for (const br of daySchedule.breaks || []) {
      const bs = this.timeToMinutes(br.start);
      const be = this.timeToMinutes(br.end);
      if (this.overlaps(startMin, endMin, bs, be)) return false;
    }

    // Не пересекаемся с уже занятыми слотами
    for (const b of this.bookedSlots) {
      if (b.date !== dateStr) continue;
      const bs = this.timeToMinutes(b.time);
      const be = bs + (b.duration || 0);
      if (this.overlaps(startMin, endMin, bs, be)) return false;
    }

    return true;
  }

  // Генерация доступных слотов на N дней вперёд
  // duration — длительность услуги в минутах
  // daysAhead — сколько дней вперёд смотреть (по умолчанию 7)
  // stepMinutes — шаг сетки (30 мин по умолчанию)
  getAvailableSlots(duration, daysAhead = 7, stepMinutes = 30) {
    const slots = [];
    const today = moment().startOf('day');

    for (let d = 0; d < daysAhead; d++) {
      const day = today.clone().add(d, 'days');
      const dayKey = this.dayKeyFromMoment(day);
      const daySchedule = this.schedule[dayKey];

      if (!daySchedule || !daySchedule.working) continue;

      const dateStr = day.format('YYYY-MM-DD');
      const startMin = this.timeToMinutes(daySchedule.start);
      const endMin = this.timeToMinutes(daySchedule.end);

      for (let t = startMin; t + duration <= endMin; t += stepMinutes) {
        // Если это сегодня — не предлагаем прошедшее время (с запасом 2 часа)
        if (d === 0 && t < moment().hours() * 60 + moment().minutes() + 120) continue;

        if (this.isSlotFree(dateStr, t, duration, daySchedule)) {
          slots.push({
            date: dateStr,
            time: this.minutesToTime(t),
            dayLabel: day.format('DD.MM (dd)')
          });
        }
      }
    }

    return slots;
  }

  // Бронирование слота (пока in-memory, позже — в Google Sheets)
  bookSlot(date, time, userId, service) {
    const duration = service.duration;
    const startMin = this.timeToMinutes(time);
    const endMin = startMin + duration;

    for (const b of this.bookedSlots) {
      if (b.date !== date) continue;
      const bs = this.timeToMinutes(b.time);
      const be = bs + (b.duration || 0);
      if (this.overlaps(startMin, endMin, bs, be)) {
        return {
          success: false,
          error: 'SLOT_BUSY',
          message: 'Слот ' + time + ' уже занят. Выберите другое время.'
        };
      }
    }

    this.bookedSlots.push({
      date: date,
      time: time,
      duration: duration,
      userId: userId,
      serviceName: service.name
    });

    return {
      success: true,
      bookingId: 'booking_' + Date.now(),
      date: date,
      time: time,
      userId: userId,
      service: service
    };
  }

  // Заглушка — подключим на шаге 13
  cancelBooking(bookingId) {
    return { success: true, message: 'Бронирование отменено (заглушка)' };
  }

  // Заглушка — подключим на шаге 13
  async loadScheduleFromGoogleSheets() {
    console.log('loadScheduleFromGoogleSheets — заглушка');
  }

  async saveScheduleToGoogleSheets() {
    console.log('saveScheduleToGoogleSheets — заглушка');
  }

  checkVacationMode() {
    return false;
  }
}

module.exports = Scheduler;
