// Список услуг с длительностью и ценой
const services = {
  // Шугаринг
  sugaring: {
    name: "Шугаринг",
    items: {
      face: {
        name: "Лицо",
        duration: 15,
        price: 300
      },
      upper_lip: {
        name: "Верхняя губа",
        duration: 10,
        price: 200
      },
      armpits: {
        name: "Подмышки",
        duration: 15,
        price: 400
      },
      arms: {
        name: "Руки",
        duration: 30,
        price: 700
      },
      legs: {
        name: "Ноги",
        duration: 45,
        price: 1200
      },
      deep_bikini: {
        name: "Глубокое бикини",
        duration: 30,
        price: 1000
      },
      waist_glutes_stomach: {
        name: "Поясница/ягодицы/живот",
        duration: 45,
        price: 1500
      }
    }
  },
  
  // Комплексы (шугаринг)
  sugaring_complex: {
    name: "Комплексы (шугаринг)",
    items: {
      bikini_armpits: {
        name: "Бикини + подмышки",
        duration: 60,
        price: 1800
      },
      bikini_armpits_legs: {
        name: "Бикини + подмышки + ноги",
        duration: 90,
        price: 2500
      }
    }
  },
  
  // Аппаратные процедуры
  apparatus: {
    name: "Аппаратные процедуры",
    items: {
      lpg: {
        name: "LPG",
        duration: 30,
        price: 1500
      },
      cavitation: {
        name: "Кавитация",
        duration: 30,
        price: 1200
      },
      rf_lifting: {
        name: "RF-лифтинг",
        duration: 45,
        price: 2000
      },
      vacuum_massage: {
        name: "Вакуумный массаж",
        duration: 30,
        price: 1000
      }
    }
  },
  
  // Абонементы
  subscriptions: {
    name: "Абонементы",
    items: {
      // Будут добавлены по запросу клиента
    }
  }
};

// Дополнительные услуги (soft cross-sell)
const additionalServices = {
  sugaring: {
    name: "Поймышки",
    duration: 10,
    price: 250
  },
  apparatus: {
    name: "Массаж лица",
    duration: 15,
    price: 500
  }
};

module.exports = {
  services,
  additionalServices
};