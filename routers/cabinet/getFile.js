const express = require("express");
const router = express.Router();
const axios = require("axios");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const SERVER_1C = process.env.SERVER_1C;
const SERVER_1C_HTTP_SERVICE = process.env.SERVER_1C_HTTP_SERVICE;
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;
const pathFileStorage = process.env.PATH_FILESTORAGE;
const headers = {
  Authorization: server1c_auth,
};

/**
 * @swagger
 * /api/cabinet/get-file/by-id/{id}:
 *   get:
 *     summary: Скачать файл из 1С по GUID
 *     tags: ["🔒 Files"]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: GUID записи Catalog_profileПрисоединенныеФайлы
 *     responses:
 *       200:
 *         description: PDF-файл
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Нет доступа к файлу
 *       404:
 *         description: Файл не найден
 *       500:
 *         description: Ошибка сервера или 1С
 */


// Маршрут для получения файла из 1С по ID
router.get("/by-id/:id", async function (req, res) {
  const userId = req.userId;
  const fileId = encodeURIComponent(req.params.id);
  const sig = req.query.sig;

  // console.log(
  //   `Получен запрос на получение файла по ID. userId: ${userId}, fileId: ${fileId}`
  // );

  if (!userId) {
    console.error("userId не определён");
    return res.status(401).json({
      status: "error",
      message: "нет авторизации",
    });
  }
  let url = `${SERVER_1C_HTTP_SERVICE}/profile/${userId}/files/${fileId}`
  if(sig=="1") url=`${SERVER_1C_HTTP_SERVICE}/profile/${userId}/files/signed/${fileId}`
  try {
    const connectionResponse = await axios.get(
      url,
      { headers }
    );
    // console.log(connectionResponse.data);
    return res.json({
      ...connectionResponse.data
    });
  } catch (error) {
    console.log("Ошибка получения файла", error);
    return res.json({
      status: "error",
      message: "Ошибка получения файла",
    });
  }
  // try {
  //   const connectionResponse = await axios.get(
  //     `${SERVER_1C}/InformationRegister_connectionsOfElements?$format=json&$filter=element1 eq cast(guid'${fileId}', 'Catalog_profileПрисоединенныеФайлы') and element2 eq cast(guid'${userId}', 'Catalog_profile') and usage eq true`,
  //     { headers }
  //   );

  //   const connections = connectionResponse.data.value;

  //   if (!connections || connections.length === 0) {
  //     return res.status(403).json({
  //       status: "error",
  //       message: "У вас нет доступа к этому файлу",
  //     });
  //   }

  //   const fileInfoResponse = await axios.get(
  //     `${SERVER_1C}/Catalog_profileПрисоединенныеФайлы(guid'${fileId}')?$format=json`,
  //     { headers }
  //   );

  //   const fileInfo = fileInfoResponse.data;

  //   const fileResponse = await axios.get(
  //     `${SERVER_1C}/Catalog_profileПрисоединенныеФайлы(guid'${fileId}')`,
  //     {
  //       headers,
  //       responseType: "arraybuffer",
  //     }
  //   );

  //   const fileData = fileResponse.data;
  //   const fileName = fileInfo.Description || "document.pdf";
  //   const contentType = "application/pdf";

  //   res.setHeader("Content-Type", contentType);
  //   res.setHeader(
  //     "Content-Disposition",
  //     `inline; filename="${encodeURIComponent(fileName)}"`
  //   );
  //   res.send(fileData);
  // } catch (error) {
  //   console.error(`Ошибка при получении файла из 1С: ${error.message}`);
  //   res.status(500).json({
  //     status: "error",
  //     message: "Ошибка при получении файла",
  //   });
  // }
});

/**
 * @swagger
 * /api/cabinet/get-file/by-filename/{filename}:
 *   get:
 *     summary: Скачать файл из времён dev-хранилища по имени
 *     tags: ["🔒 Files"]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Имя файла вместе с расширением
 *     responses:
 *       200:
 *         description: Файл найден и отправлен
 *       404:
 *         description: Файл не найден
 *       500:
 *         description: Внутренняя ошибка сервера
 */


// Маршрут для получения файла по имени из файловой системы
router.get("/by-filename/:filename", async function (req, res) {
  const userId = req.userId;
  const filename = encodeURIComponent(req.params.filename);

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

