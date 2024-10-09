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
      `${SERVER_1C}/Catalog_РайоныЭлектрическихСетейПрисоединенныеФайлы?$format=json&$expand=Том&$select=Ref_Key,Description,ВладелецФайла_Key,ПутьКФайлу,РеквизитДопУпорядочивания,Том,ТипХраненияФайла,Том/ПолныйПутьWindows,ФайлХранилище&$filter=DeletionMark%20eq%20false`,
      { headers }
    );

    const contactInfo = contactInfoResponse.data.value;
    const photos = photosResponse.data.value;
console.log(photos);

    // Объединяем массивы
    const combinedData = contactInfo.map((contact) => {
      // Ищем все фотки для каждого контакта
      const matchedPhotos = photos.filter(
        (photo) => photo.ВладелецФайла_Key === contact.object
      );

      // Добавляем все найденные фотки в массив photos
      return {
        ...contact,
        photos: matchedPhotos.map((photo) => ({
          ПутьКФайлу: photo.ПутьКФайлу,
          ПолныйПутьWindows: photo.Том.ПолныйПутьWindows,
        })),
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
