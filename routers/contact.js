// Файл: /Users/yanutstas/Desktop/Project/portal_backend/routers/contact.js

const express = require("express");
const axios = require("axios");
require("dotenv").config();

const router = express.Router();

// Данные для доступа к 1С
const SERVER_1C = process.env.SERVER_1C;
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;

// Адрес, по которому будем оповещать бота
// (если бот и бэкенд на одном сервере, указывайте http://127.0.0.1:3001/notifyError)
const botNotifyUrl =
  process.env.BOT_NOTIFY_URL || "http://127.0.0.1:3001/notifyError";

// Заголовки для авторизации на 1С
const headers = {
  Authorization: server1c_auth,
};

// Основной маршрут GET /api/contacts
router.get("/", async (req, res) => {
  try {
    // 1) Запрашиваем контактную инфу
    const contactInfoResponse = await axios.get(
      `${SERVER_1C}/InformationRegister_portalContactInformation?$format=json&$orderby=lineNum`,
      { headers }
    );

    // 2) Тянем фотки
    const photosResponse = await axios.get(
      `${SERVER_1C}/Catalog_РайоныЭлектрическихСетейПрисоединенныеФайлы?$format=json&$expand=Том&$select=Ref_Key,Description,ВладелецФайла_Key,ПутьКФайлу,РеквизитДопУпорядочивания,Том,ТипХраненияФайла,Том/ПолныйПутьWindows,ФайлХранилище&$filter=DeletionMark%20eq%20false`,
      { headers }
    );

    const contactInfo = contactInfoResponse.data.value;
    const photos = photosResponse.data.value;

    // 3) Склеиваем данные
    const combinedData = contactInfo.map((contact) => {
      // Находим все фотки для текущего контакта
      const matchedPhotos = photos.filter(
        (photo) => photo.ВладелецФайла_Key === contact.object
      );
      return {
        ...contact,
        photos: matchedPhotos.map((photo) => ({
          ПутьКФайлу: photo.ПутьКФайлу,
          ПолныйПутьWindows: photo.Том.ПолныйПутьWindows,
        })),
      };
    });

    // 4) Отдаём данные на фронт
    res.status(200).json(combinedData);
  } catch (error) {
    // 5) Пишем лог об ошибке
    console.error("Ошибка при получении данных из 1C:", error);

    // 6) Сообщаем фронту, что случилась ошибка
    res.status(500).json({ message: "Ошибка при получении данных из 1C" });

    // 7) Если настроен адрес бота, пытаемся его оповестить
    if (botNotifyUrl) {
      try {
        await axios.post(botNotifyUrl, {
          message: `Ошибка при получении данных из 1C: ${error.message}`,
        });
      } catch (notifyErr) {
        console.error("Не смогли оповестить бота:", notifyErr);
      }
    }
  }
});

module.exports = router;

// const express = require("express");
// const axios = require("axios");
// require("dotenv").config();

// const router = express.Router();

// const SERVER_1C = process.env.SERVER_1C;
// const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;

// const headers = {
//   Authorization: server1c_auth,
// };

// // Наш новый крутой эндпоинт
// router.get("/", async (req, res) => {
//   try {
//     // Сначала запрашиваем контактную инфу
//     const contactInfoResponse = await axios.get(
//       `${SERVER_1C}/InformationRegister_portalContactInformation?$format=json&$orderby=lineNum`,
//       { headers }
//     );

//     // Теперь тянем фотки
//     const photosResponse = await axios.get(
//       `${SERVER_1C}/Catalog_РайоныЭлектрическихСетейПрисоединенныеФайлы?$format=json&$expand=Том&$select=Ref_Key,Description,ВладелецФайла_Key,ПутьКФайлу,РеквизитДопУпорядочивания,Том,ТипХраненияФайла,Том/ПолныйПутьWindows,ФайлХранилище&$filter=DeletionMark%20eq%20false`,
//       { headers }
//     );

//     const contactInfo = contactInfoResponse.data.value;
//     const photos = photosResponse.data.value;
//     // console.log(photos);

//     // Объединяем массивы
//     const combinedData = contactInfo.map((contact) => {
//       // Ищем все фотки для каждого контакта
//       const matchedPhotos = photos.filter(
//         (photo) => photo.ВладелецФайла_Key === contact.object
//       );

//       // Добавляем все найденные фотки в массив photos
//       return {
//         ...contact,
//         photos: matchedPhotos.map((photo) => ({
//           ПутьКФайлу: photo.ПутьКФайлу,
//           ПолныйПутьWindows: photo.Том.ПолныйПутьWindows,
//         })),
//       };
//     });

//     // Возвращаем всё это добро на фронт
//     res.status(200).json(combinedData);
//   } catch (error) {
//     console.error("Ошибка при получении данных из 1C:", error);
//     res.status(500).json({ message: "Ошибка при получении данных из 1C" });
//   }
// });

// module.exports = router;
