// /routers/cabinet/getFile.js

const express = require("express");
const router = express.Router();
const axios = require("axios");
const logger = require("../../logger");
require("dotenv").config();

const SERVER_1C = process.env.SERVER_1C;
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;
const headers = {
  Authorization: server1c_auth,
};

router.get("/:id", async function (req, res) {
  const userId = req.userId;
  const fileId = req.params.id;

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
      `${SERVER_1C}/Catalog_profileПрисоединенныеФайлы(guid'${fileId}')/DownloadFile`,
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

module.exports = router;

// const express = require("express");
// const router = express.Router();

// const pathFileStorage = process.env.PATH_FILESTORAGE;

// const logger = require("../../logger");

// router.get("/:filename", async function (req, res) {
//   const userId = req.userId;
//   const dirName = `${pathFileStorage}/${userId}`;
//   const file = `${dirName}/${req.params.filename}`;
//   // logger.info(
//   //   `Получен запрос на скачивание файла ${req.params.filename} для пользователя с id: ${userId}`
//   // );

//   try {
//     res.download(file, (err) => {
//       if (err) {
//         logger.error(
//           `Ошибка при скачивании файла ${req.params.filename} для пользователя с id: ${userId}. Ошибка: ${err.message}`
//         );
//         res
//           .status(500)
//           .json({ message: "Внутренняя ошибка сервера при скачивании файла" });
//       } else {
//         // logger.info(
//         //   `Файл ${req.params.filename} успешно скачан для пользователя с id: ${userId}`
//         // );
//       }
//     });
//   } catch (error) {
//     logger.error(
//       `Ошибка при скачивании файла ${req.params.filename} для пользователя с id: ${userId}. Ошибка: ${error.message}`
//     );
//     res.status(500).json({ message: "Внутренняя ошибка сервера" });
//   }
// });

// module.exports = router;
