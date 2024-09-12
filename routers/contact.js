const express = require("express");
const axios = require("axios");
require("dotenv").config();

const router = express.Router();

const SERVER_1C = process.env.SERVER_1C;
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;
const headers = {
  Authorization: server1c_auth,
};

// Наш новый крутой эндпоинт
router.get("/", async (req, res) => {
  try {
    // Сначала запрашиваем контактную инфу
    const contactInfoResponse = await axios.get(
      `${SERVER_1C}/InformationRegister_portalContactInformation?$format=json&$orderby=lineNum`,
      { headers }
    );

    // Теперь тянем фотки
    const photosResponse = await axios.get(
      `${SERVER_1C}/Catalog_РайоныЭлектрическихСетейПрисоединенныеФайлы?$format=json&$expand=Том&$select=Ref_Key,Description,ВладелецФайла_Key,ПутьКФайлу,Том,ТипХраненияФайла,Том/ПолныйПутьWindows,ФайлХранилище&$filter=DeletionMark%20eq%20false`,
      { headers }
    );

    const contactInfo = contactInfoResponse.data.value;
    const photos = photosResponse.data.value;

    // Объединяем массивы
    const combinedData = contactInfo.map((contact) => {
      // Ищем фотки для каждого контакта
      const matchedPhoto = photos.find(
        (photo) => photo.ВладелецФайла_Key === contact.object
      );

      // Если нашли, то добавляем фотки в объект контакта
      return {
        ...contact,
        photos: matchedPhoto
          ? {
              ПутьКФайлу: matchedPhoto.ПутьКФайлу,
              ПолныйПутьWindows: matchedPhoto.Том.ПолныйПутьWindows,
            }
          : null, // Если нет фоток, то null
      };
    });

    // Возвращаем всё это добро на фронт
    res.status(200).json(combinedData);
  } catch (error) {
    console.error("Ошибка при получении данных из 1C:", error);
    res.status(500).json({ message: "Ошибка при получении данных из 1C" });
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

// // Создаем маршрут для получения контактной информации
// router.get("/", async (req, res) => {
//   try {
//     const response = await axios.get(
//       `${SERVER_1C}/InformationRegister_portalContactInformation?$format=json&$orderby=lineNum`,
//       {
//         headers,
//       }
//     );
//     console.log(response);

//     // Возвращаем данные полученные из 1C
//     res.status(200).json(response.data);
//   } catch (error) {
//     console.error("Ошибка при получении данных из 1C:", error);
//     res.status(500).json({ message: "Ошибка при получении данных из 1C" });
//   }
// });

// // Маршрут для получения фотографий филиалов
// router.get("/photos", async (req, res) => {
//   try {
//     const response = await axios.get(
//       `${SERVER_1C}/Catalog_РайоныЭлектрическихСетейПрисоединенныеФайлы?$format=json&$expand=Том&$select=Ref_Key,Description,ВладелецФайла_Key,ПутьКФайлу,Том,ТипХраненияФайла,Том/ПолныйПутьWindows,ФайлХранилище&$filter=DeletionMark%20eq%20false`,
//       {
//         headers,
//       }
//     );
//     console.log(response);

//     // Возвращаем данные с фотографиями
//     res.status(200).json(response.data);
//   } catch (error) {
//     console.error("Ошибка при получении данных о фотографиях:", error);
//     res.status(500).json({ message: "Ошибка при получении данных о фотографиях" });
//   }
// });

// module.exports = router;
