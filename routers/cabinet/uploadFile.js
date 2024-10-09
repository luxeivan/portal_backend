const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const logger = require("../../logger");
const { PDFDocument } = require("pdf-lib");

const pathFileStorage = process.env.PATH_FILESTORAGE;
const maxSizeFile = 10;

router.post("/", async function (req, res) {
  const uuid = uuidv4();
  const userId = req.userId;
  const dirName = `${pathFileStorage}/${userId}`;

  if (!req.files || Object.keys(req.files).length === 0) {
    logger.warn(`Запрос на загрузку файлов не содержит файлов. UUID: ${uuid}`);
    return res.status(400).json({
      status: "error",
      message: "Нет файлов для загрузки",
    });
  }

  let bigFile = false;
  for (const key in req.files) {
    const file = req.files[key];
    if (file.size > maxSizeFile * 1024 * 1024) {
      bigFile = true;
    }
  }

  if (bigFile) {
    logger.warn(
      `Один или несколько файлов превышают допустимый размер. UUID: ${uuid}`
    );
    return res.status(400).json({
      status: "error",
      message: "Файлы больше 10МБ не принимаются",
    });
  }

  try {
    await fs.promises.access(dirName);
  } catch (err) {
    if (err && err.code === "ENOENT") {
      await fs.promises.mkdir(dirName, { recursive: true });
    }
  }

  try {
    // Создаем новый PDF-документ
    const pdfDoc = await PDFDocument.create();

    for (const key in req.files) {
      const file = req.files[key];
      const imageBytes = await fs.promises.readFile(file.tempFilePath);

      let pdfImage;
      if (file.mimetype === "image/jpeg" || file.mimetype === "image/jpg") {
        pdfImage = await pdfDoc.embedJpg(imageBytes);
      } else if (file.mimetype === "image/png") {
        pdfImage = await pdfDoc.embedPng(imageBytes);
      } else {
        continue;
      }

      const page = pdfDoc.addPage([pdfImage.width, pdfImage.height]);
      page.drawImage(pdfImage, {
        x: 0,
        y: 0,
        width: pdfImage.width,
        height: pdfImage.height,
      });
    }

    const pdfBytes = await pdfDoc.save();
    const pdfFilename = `combined_document_${uuid}.pdf`;
    const pdfPath = `${dirName}/${pdfFilename}`;

    await fs.promises.writeFile(pdfPath, pdfBytes);
    logger.info(
      `Объединенный PDF успешно создан: ${pdfFilename}. UUID: ${uuid}`
    );

    // Удаление временных файлов
    for (const key in req.files) {
      const file = req.files[key];
      try {
        await fs.promises.unlink(file.tempFilePath);
      } catch (err) {
        logger.error(
          `Не удалось удалить временный файл: ${file.tempFilePath}. Ошибка: ${err.message}`
        );
      }
    }

    return res.json({ status: "ok", file: pdfFilename });
  } catch (error) {
    logger.error(
      `Ошибка при создании объединенного PDF файла. UUID: ${uuid}. Ошибка: ${error.message}`
    );
    return res.status(500).json({
      status: "error",
      message: "Ошибка при создании PDF файла",
    });
  }
});

module.exports = router;

// const express = require("express");
// const jwt = require("jsonwebtoken");
// const router = express.Router();
// const path = require("path");
// const fs = require("fs");
// const { v4: uuidv4 } = require("uuid");
// const logger = require("../../logger");

// const pathFileStorage = process.env.PATH_FILESTORAGE;
// const maxSizeFile = 10; // Максимальный размер файла в мегабайтах

// /**
//  * @swagger
//  * tags:
//  *   - name: UploadFile
//  *     description: Маршруты для загрузки файлов
//  */

// /**
//  * @swagger
//  * /api/cabinet/upload-file:
//  *   post:
//  *     summary: Загрузка файлов
//  *     description: Загружает файлы на сервер и сохраняет их в директорию пользователя.
//  *     tags:
//  *       - UploadFile
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         multipart/form-data:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               file:
//  *                 type: array
//  *                 items:
//  *                   type: string
//  *                   format: binary
//  *     responses:
//  *       200:
//  *         description: Файлы успешно загружены
//  *       400:
//  *         description: Нет файлов для загрузки или файл превышает допустимый размер
//  *       500:
//  *         description: Ошибка при записи файлов
//  */
// router.post("/", async function (req, res) {
//   const uuid = uuidv4();
//   const userId = req.userId;
//   const dirName = `${pathFileStorage}/${userId}`;
//   // logger.info(
//   //   `Получен запрос на загрузку файлов для пользователя: ${userId}, UUID: ${uuid}`
//   // );

//   if (!req.files || Object.keys(req.files).length === 0) {
//     logger.warn(`Запрос на загрузку файлов не содержит файлов. UUID: ${uuid}`);
//     return res
//       .status(400)
//       .json({
//         status: "error",
//         message: "Нет файлов для загрузки",
//         files: req.files,
//       });
//   }

//   let bigFile = false;
//   Object.keys(req.files).map((item) => {
//     logger.info(
//       `Размер файла ${item}: ${req.files[item].size} байт. UUID: ${uuid}`
//     );
//     if (req.files[item].size > maxSizeFile * 1024 * 1024) {
//       bigFile = true;
//     }
//   });

//   if (bigFile) {
//     logger.warn(
//       `Один или несколько файлов превышают допустимый размер. UUID: ${uuid}`
//     );
//     return res
//       .status(400)
//       .json({ status: "error", message: "Файлы больше 10МБ не принимаются" });
//   }

//   try {
//     await fs.promises.access(dirName);
//   } catch (err) {
//     if (err && err.code === "ENOENT") {
//       try {
//         await fs.promises.mkdir(dirName);
//         logger.info(`Создана директория: ${dirName}. UUID: ${uuid}`);
//       } catch (error) {
//         logger.error(
//           `Ошибка при создании директории: ${dirName}. UUID: ${uuid}. Ошибка: ${error.message}`
//         );
//         return res
//           .status(500)
//           .json({ status: "error", message: "Ошибка при записи файлов" });
//       }
//     }
//   }

//   const arrayWriteFile = Object.keys(req.files).map((item) => {
//     return new Promise(function (resolve, reject) {
//       const filename = `${item}_${uuid}.${req.files[item].name.slice(
//         req.files[item].name.lastIndexOf(".") + 1
//       )}`;
//       req.files[item].mv(`${dirName}/${filename}`, function (err) {
//         if (err) {
//           logger.error(
//             `Ошибка при записи файла: ${filename}. UUID: ${uuid}. Ошибка: ${err.message}`
//           );
//           reject({
//             status: "error",
//             message: "Ошибка при записи файлов",
//             error: err,
//           });
//         } else {
//           logger.info(`Файл успешно записан: ${filename}. UUID: ${uuid}`);
//           resolve(`${filename}`);
//         }
//       });
//     });
//   });

//   Promise.all(arrayWriteFile)
//     .then((responses) => {
//       logger.info(
//         `Все файлы успешно загружены для пользователя: ${userId}, UUID: ${uuid}`
//       );
//       return res.json({ status: "ok", files: responses });
//     })
//     .catch((error) => {
//       logger.error(
//         `Ошибка при записи файлов. UUID: ${uuid}. Ошибка: ${error.message}`
//       );
//       return res
//         .status(500)
//         .json({ status: "error", message: "Ошибка при записи файлов" });
//     });
// });

// module.exports = router;
