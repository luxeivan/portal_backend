import http from "k6/http";
import { check, sleep, group } from "k6";

export let options = {
  scenarios: {
    high_load: {
      executor: "constant-arrival-rate",
      rate: 20000, // 20,000 запросов в секунду
      timeUnit: "1s",
      duration: "10m", // Длительность теста: 10 минут
      preAllocatedVUs: 5000,
      maxVUs: 10000,
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<5000"], // 95% запросов должны быть быстрее 5 секунд
    http_req_failed: ["rate<0.05"], // Не более 5% неудачных запросов
  },
};

const serviceIds = [
  "a90f7aa3-16ef-11ef-8681-c8d9d20cde1f",
  "41292f39-9910-11ef-9501-5cf3fcb042f1",
  // serviceId
];

// Функция для выбора случайного serviceId
function getRandomServiceId() {
  return serviceIds[Math.floor(Math.random() * serviceIds.length)];
}

// Функция для генерации случайных данных заявки
function getRandomClaimData(serviceId) {
  return {
    service: serviceId,
    values: {

      field1: `value_${Math.floor(Math.random() * 1000000)}`,
      field2: `value_${Math.floor(Math.random() * 1000000)}`,
    
    },
  };
}

export default function () {
  // Цикл для увеличения количества запросов на одного VU
  for (let i = 0; i < 10; i++) {
    const serviceId = getRandomServiceId();

    group("Получение данных услуги", function () {
      let resService = http.get(
        `http://localhost:3100/api/services/${serviceId}`
      );
      check(resService, {
        "Статус код 200 на получение услуги": (r) => r.status === 200,
      });
    });

    group("Получение формы заявки", function () {
      let resForm = http.get(
        `http://localhost:3100/api/services/item/${serviceId}`
      );
      check(resForm, {
        "Статус код 200 на получение формы заявки": (r) => r.status === 200,
      });
    });

    group("Отправка заявки", function () {
      const claimData = getRandomClaimData(serviceId);
      let resClaim = http.post(
        "http://localhost:3100/api/claims",
        JSON.stringify(claimData),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      check(resClaim, {
        "Статус код 200 на отправку заявки": (r) => r.status === 200,
      });
    });

    // Дополнительные эндпоинты для увеличения нагрузки
    group("Получение списка услуг", function () {
      let resServices = http.get("http://localhost:3100/api/services");
      check(resServices, {
        "Статус код 200 на получение списка услуг": (r) => r.status === 200,
      });
    });

    group("Получение горячих вопросов", function () {
      let resQuestions = http.get("http://localhost:3100/api/hotQuestions");
      check(resQuestions, {
        "Статус код 200 на получение горячих вопросов": (r) => r.status === 200,
      });
    });
  }
}
