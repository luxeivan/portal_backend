const express = require("express");
const router = express.Router();
const axios = require("axios");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const SERVER_1C = process.env.SERVER_1C;
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;
const pathFileStorage = process.env.PATH_FILESTORAGE;
const headers = {
  Authorization: server1c_auth,
};

// Маршрут для получения файла из 1С по ID
router.get("/by-id/:id", async function (req, res) {
  const userId = req.userId;
  const fileId = req.params.id;

  console.log(
    `Получен запрос на получение файла по ID. userId: ${userId}, fileId: ${fileId}`
  );

  if (!userId) {
    console.error("userId не определён");
    return res.status(401).json({
      status: "error",
      message: "нет авторизации",
    });
  }

  try {
    const connectionResponse = await axios.get(
      `${SERVER_1C}/InformationRegister_connectionsOfElements?$format=json&$filter=element1 eq cast(guid'${fileId}', 'Catalog_profileПрисоединенныеФайлы') and element2 eq cast(guid'${userId}', 'Catalog_profile') and usage eq true`,
      { headers }
    );

    const connections = connectionResponse.data.value;

    if (!connections || connections.length === 0) {
      return res.status(403).json({
        status: "error",
        message: "У вас нет доступа к этому файлу",
      });
    }

    const fileInfoResponse = await axios.get(
      `${SERVER_1C}/Catalog_profileПрисоединенныеФайлы(guid'${fileId}')?$format=json`,
      { headers }
    );

    const fileInfo = fileInfoResponse.data;

    const fileResponse = await axios.get(
      `${SERVER_1C}/Catalog_profileПрисоединенныеФайлы(guid'${fileId}')`,
      {
        headers,
        responseType: "arraybuffer",
      }
    );

    const fileData = fileResponse.data;
    const fileName = fileInfo.Description || "document.pdf";
    const contentType = "application/pdf";

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(fileName)}"`
    );
    res.send(fileData);
  } catch (error) {
    console.error(`Ошибка при получении файла из 1С: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: "Ошибка при получении файла",
    });
  }
});

// Маршрут для получения файла по имени из файловой системы
router.get("/by-filename/:filename", async function (req, res) {
  const userId = req.userId;
  const filename = req.params.filename;

  console.log(
    `Получен запрос на скачивание файла ${filename} для пользователя ${userId}`
  );

  try {
    const filePath = path.join(pathFileStorage, userId, filename);

    console.log(`Путь к файлу: ${filePath}`);

    // Проверяем, существует ли файл
    if (fs.existsSync(filePath)) {
      res.download(filePath, filename, (err) => {
        if (err) {
          console.error(`Ошибка при отправке файла: ${err.message}`);
          res.status(500).json({ message: "Ошибка при отправке файла" });
        } else {
          console.log(`Файл ${filename} успешно отправлен`);
        }
      });
    } else {
      console.error(`Файл ${filePath} не найден`);
      res.status(404).json({ message: "Файл не найден" });
    }
  } catch (error) {
    console.error(`Ошибка при скачивании файла: ${error.message}`);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
});

module.exports = router;

