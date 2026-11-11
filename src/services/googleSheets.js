// Интеграция с Google Sheets

const { google } = require('googleapis');
const { JWT } = require('google-auth-library');

class GoogleSheetsService {
  constructor(credentials) {
    this.credentials = credentials;
    this.auth = null;
    this.sheets = null;
    this.setupAuth();
  }

  // Настройка аутентификации
  setupAuth() {
    try {
      this.auth = new JWT({
        email: this.credentials.client_email,
        key: this.credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
      
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      console.log('Google Sheets authentication successful');
    } catch (error) {
      console.error('Google Sheets authentication error:', error);
    }
  }

  // Получение данных из таблицы
  async getSheetData(sheetId, range) {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: range
      });
      
      return response.data.values;
    } catch (error) {
      console.error('Error getting sheet data:', error);
      throw error;
    }
  }

  // Запись данных в таблицу
  async updateSheetData(sheetId, range, values) {
    try {
      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: range,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: values
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error updating sheet data:', error);
      throw error;
    }
  }

  // Добавление данных в таблицу
  async appendSheetData(sheetId, range, values) {
    try {
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: range,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: values
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error appending sheet data:', error);
      throw error;
    }
  }

  // Получение расписания из таблицы
  async getSchedule(sheetId) {
    try {
      // Получаем данные о расписании
      const scheduleData = await this.getSheetData(sheetId, 'Schedule!A:D');
      
      // Преобразуем данные в объект расписания
      const schedule = {};
      
      // Пропускаем заголовок
      for (let i = 1; i < scheduleData.length; i++) {
        const row = scheduleData[i];
        const day = row[0];
        const working = row[1] === 'true';
        const start = row[2];
        const end = row[3];
        
        schedule[day] = {
          working: working,
          start: start,
          end: end
        };
      }
      
      return schedule;
    } catch (error) {
      console.error('Error getting schedule:', error);
      throw error;
    }
  }

  // Сохранение расписания в таблицу
  async saveSchedule(sheetId, schedule) {
    try {
      // Преобразуем объект расписания в массив данных
      const values = [['Day', 'Working', 'Start Time', 'End Time']];
      
      Object.keys(schedule).forEach(day => {
        const daySchedule = schedule[day];
        values.push([
          day,
          daySchedule.working.toString(),
          daySchedule.start || '',
          daySchedule.end || ''
        ]);
      });
      
      // Обновляем данные в таблице
      await this.updateSheetData(sheetId, 'Schedule!A:D', values);
      
      return true;
    } catch (error) {
      console.error('Error saving schedule:', error);
      throw error;
    }
  }

  // Получение записей из таблицы
  async getBookings(sheetId) {
    try {
      // Получаем данные о записях
      const bookingsData = await this.getSheetData(sheetId, 'Bookings!A:G');
      
      // Преобразуем данные в массив записей
      const bookings = [];
      
      // Пропускаем заголовок
      for (let i = 1; i < bookingsData.length; i++) {
        const row = bookingsData[i];
        const booking = {
          id: row[0],
          userId: row[1],
          userName: row[2],
          service: row[3],
          date: row[4],
          time: row[5],
          status: row[6]
        };
        
        bookings.push(booking);
      }
      
      return bookings;
    } catch (error) {
      console.error('Error getting bookings:', error);
      throw error;
    }
  }

  // Сохранение записи в таблицу
  async saveBooking(sheetId, booking) {
    try {
      // Преобразуем объект записи в массив данных
      const values = [[
        booking.id,
        booking.userId,
        booking.userName,
        booking.service,
        booking.date,
        booking.time,
        booking.status
      ]];
      
      // Добавляем данные в таблицу
      await this.appendSheetData(sheetId, 'Bookings!A:G', values);
      
      return true;
    } catch (error) {
      console.error('Error saving booking:', error);
      throw error;
    }
  }
}

module.exports = GoogleSheetsService;