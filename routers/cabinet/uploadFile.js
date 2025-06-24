const express = require("express");
const router = express.Router();
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const logger = require("../../logger");
const { PDFDocument } = require("pdf-lib");
const axios = require("axios");
const moment = require("moment");
require("dotenv").config();

const SERVER_1C = process.env.SERVER_1C;
const SERVER_1C_HTTP_SERVICE = process.env.SERVER_1C_HTTP_SERVICE;
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;
const headers = {
  Authorization: server1c_auth,
  "Content-Type": "application/json",
};

const pathFileStorage =
  process.env.PATH_FILESTORAGE ||
  "/Users/yanutstas/Desktop/Project/portal_backend/files";

/**
 * @swagger
 * /api/cabinet/upload-file:
 *   post:
 *     summary: Загрузить файлы и прикрепить к профилю
 *     description: >
 *       🔒 Требуется JWT.
 *       Принимает изображения (JPEG/PNG) и PDF, объединяет их
 *       в один PDF и сохраняет в 1С.
 *     tags: ["🔒 Files"]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [files, categoryKey, documentName]
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               categoryKey:
 *                 type: string
 *                 description: GUID категории в 1С
 *               documentName:
 *                 type: string
 *                 description: Отображаемое имя документа
 *     responses:
 *       200:
 *         description: Файл успешно загружен
 *       400:
 *         description: Нет файлов / неверный формат
 *       401:
 *         description: JWT невалиден
 *       500:
 *         description: Ошибка сервера или 1С
 */

router.post("/", async function (req, res) {
  const uuid = uuidv4();
  const userId = req.userId;
  const dirName = `${pathFileStorage}/${userId}`;

  console.log("Полный путь для сохранения файлов на сервере:", dirName);

  // Получение настроек обмена из 1С
  let user_Key, mainVolume_Key;
  // try {
  //   const exchangeSettingsResponse = await axios.get(
  //     `${SERVER_1C}/InformationRegister_exchangeSettings/SliceLast()?$format=json`,
  //     { headers }
  //   );
  //   const exchangeSettings = exchangeSettingsResponse.data.value[0];
  //   console.log("Получены настройки обмена из 1С:", exchangeSettings);
  //   user_Key = exchangeSettings.user_Key;
  //   mainVolume_Key = exchangeSettings.mainVolume_Key;
  //   console.log("user_Key:", user_Key);
  //   console.log("mainVolume_Key:", mainVolume_Key);
  // } catch (error) {
  //   console.error("Ошибка при получении настроек обмена из 1С:", error);
  //   return res.status(500).json({
  //     status: "error",
  //     message: "Ошибка при получении настроек обмена",
  //   });
  // }

  if (!req.files || Object.keys(req.files).length === 0) {
    logger.warn(`Запрос на загрузку файлов не содержит файлов. UUID: ${uuid}`);
    return res.status(400).json({
      status: "error",
      message: "Нет файлов для загрузки",
    });
  }

  const files = Array.isArray(req.files.files)
    ? req.files.files
    : [req.files.files];

  // Получение допустимых расширений и максимального размера из 1С
  let allowedExtensions = ["JPEG", "JPG", "PDF", "PNG"];
  let maxSizeFile = 10 * 1024 * 1024; // По умолчанию 10 МБ
  const { categoryKey, saveToProfile } = req.body;
   console.log("Полученный saveToProfile:", saveToProfile);
  //  console.log("Полученный categoryKey:", categoryKey);

  // Проверка расширений и размера файлов
  let invalidFile = false;
  for (const file of files) {
    const fileExtension = file.name.split(".").pop().toUpperCase();
    if (!allowedExtensions.includes(fileExtension)) {
      invalidFile = "Неподдерживаемое расширение файла";
      break;
    }
    if (file.size > maxSizeFile) {
      invalidFile = "Превышен размер файла";
      break;
    }
  }

  if (invalidFile) {
    logger.warn(
      `Один или несколько файлов не соответствуют требованиям. UUID: ${uuid}`
    );
    return res.status(400).json({
      status: "error",
      // message: "Файлы не соответствуют требованиям по размеру или типу",
      message: `${invalidFile}`
    });
  }

  try {
    // Создаём директорию, если она не существует
    await fs.promises.mkdir(dirName, { recursive: true });

    // Сохраняем файлы во временную директорию
    for (const file of files) {
      const filePath = `${dirName}/${file.name}`;
      console.log("Файл сохраняется по пути:", filePath);
      await file.mv(filePath);
    }

    // Создаем новый PDF-документ
    const pdfDoc = await PDFDocument.create();

    for (const file of files) {
      const filePath = `${dirName}/${file.name}`;
      const fileBuffer = await fs.promises.readFile(filePath);
      console.log("Файл для объединения загружен с пути:", filePath);

      let pdfImage;
      if (file.mimetype === "image/jpeg" || file.mimetype === "image/jpg") {
        pdfImage = await pdfDoc.embedJpg(fileBuffer);
        const page = pdfDoc.addPage([pdfImage.width, pdfImage.height]);
        page.drawImage(pdfImage, {
          x: 0,
          y: 0,
          width: pdfImage.width,
          height: pdfImage.height,
        });
      } else if (file.mimetype === "image/png") {
        pdfImage = await pdfDoc.embedPng(fileBuffer);
        const page = pdfDoc.addPage([pdfImage.width, pdfImage.height]);
        page.drawImage(pdfImage, {
          x: 0,
          y: 0,
          width: pdfImage.width,
          height: pdfImage.height,
        });
      } else if (file.mimetype === "application/pdf") {
        const donorPdfDoc = await PDFDocument.load(fileBuffer);
        const donorPages = await pdfDoc.copyPages(
          donorPdfDoc,
          donorPdfDoc.getPageIndices()
        );
        donorPages.forEach((page) => pdfDoc.addPage(page));
      } else {
        continue;
      }
    }

    // const pdfBytes = await pdfDoc.save();
    const pdfAsBase64 = await pdfDoc.saveAsBase64();
    // const pdfFilename = `combined_document_${uuid}.pdf`;
    // const pdfPath = `${dirName}/${pdfFilename}`;

    // console.log("Созданный PDF сохраняется по пути:", pdfPath);


    const resSaveFile = await axios.post(`${SERVER_1C_HTTP_SERVICE}/profile/${userId}/file`, {
      base64: pdfAsBase64,
      ext: "pdf"
    }, { headers })
    // console.log("res", res.data)


    // await fs.promises.writeFile(pdfPath, pdfBytes);
    // logger.info(
    //   `Объединенный PDF успешно создан: ${pdfFilename}. UUID: ${uuid}`
    // );

    // Удаляем исходные файлы после объединения
    try {
      for (const file of files) {
        const filePath = `${dirName}/${file.name}`;
        await fs.promises.unlink(filePath);
      }
    } catch (err) {
      logger.error(`Не удалось удалить файлы. Ошибка: ${err.message}`);
    }

    // Отправка файла в 1С
    // let fileRefKey;
    try {
      // const fileData = fs.readFileSync(pdfPath);
      // const base64File = fileData.toString("base64");

      // const currentDate = new Date();
      // const filePathIn1C = `${userId}/${pdfFilename}`;

      // console.log("Файл отправляется в 1С по пути:", filePathIn1C);

      if (saveToProfile) {
        const resSaveDocsProfile = await axios.post(`${SERVER_1C_HTTP_SERVICE}/profile/${userId}/docs`, {
          fileId: resSaveFile?.data?.data?.fileId,
          name: req.body.documentName,
          typeFileId: categoryKey
        }, { headers })
        console.log("resSaveDocsProfile", resSaveDocsProfile.data)
      } else {
        return res.json({ status: "ok", message: "Файл успешно загружен", fileId: resSaveFile?.data?.data?.fileId });
      }

      // const payload = {
      //   Description: req.body.documentName,
      //   ВладелецФайла_Key: userId,
      //   Автор_Key: user_Key,
      //   ДатаМодификацииУниверсальная: currentDate.toISOString(),
      //   ДатаСоздания: currentDate.toISOString(),
      //   ПутьКФайлу: filePathIn1C,
      //   Размер: fileData.length.toString(),
      //   Расширение: "pdf",
      //   ТипХраненияФайла: "ВТомахНаДиске",
      //   Том_Key: mainVolume_Key,
      //   ВидФайла_Key: categoryKey,
      // };


      //   const uploadResponse = await axios.post(
      //     `${SERVER_1C}/Catalog_profileПрисоединенныеФайлы?$format=json`,
      //     payload,
      //     { headers }
      //   );
      //   console.log("Файл успешно загружен в 1С:", uploadResponse.data);
      //   fileRefKey = uploadResponse.data.Ref_Key; // Получаем Ref_Key загруженного файла

    } catch (error) {
      console.error(
        "Ошибка при отправке файла в 1С:",
        error.response ? error.response.data : error.message
      );
      return res.status(500).json({
        status: "error",
        message: "Ошибка при загрузке файла в 1С",
      });
    }
    // Создание связи в InformationRegister_connectionsOfElements
    // try {
    //   const connectionPayload = {
    //     Period: moment().format(),
    //     usage: true,
    //     element1: fileRefKey,
    //     element1_Type: "StandardODATA.Catalog_profileПрисоединенныеФайлы",
    //     element2: userId,
    //     element2_Type: "StandardODATA.Catalog_profile",
    //     reason: "Добавление документа в профиль пользователя",
    //   };

    //   const connectionResponse = await axios.post(
    //     `${SERVER_1C}/InformationRegister_connectionsOfElements?$format=json`,
    //     connectionPayload,
    //     { headers }
    //   );
    //   console.log(
    //     "Связь успешно создана в InformationRegister_connectionsOfElements:",
    //     connectionResponse.data
    //   );
    // } catch (error) {
    //   console.error(
    //     "Ошибка при создании связи в InformationRegister_connectionsOfElements:",
    //     error.response ? error.response.data : error.message
    //   );
    //   return res.status(500).json({
    //     status: "error",
    //     message: "Ошибка при создании связи документа с профилем",
    //   });
    // }

    return res.json({ status: "ok", message: "Файл успешно загружен" });
  } catch (error) {
    console.log("error", error)
    logger.error(
      `Ошибка при обработке файлов. UUID: ${uuid}. Ошибка: ${error.message}`
    );
    return res.status(500).json({
      status: "error",
      message: "Ошибка при обработке файлов",
    });
  }
});

module.exports = router;

// const express = require("express");
// const router = express.Router();
// const fs = require("fs");
// const { v4: uuidv4 } = require("uuid");
// const logger = require("../../logger");
// const { PDFDocument } = require("pdf-lib");
// const axios = require("axios");
// require("dotenv").config();

// const SERVER_1C = process.env.SERVER_1C;
// const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;
// const headers = {
//   Authorization: server1c_auth,
//   "Content-Type": "application/json",
// };

// const pathFileStorage =
//   process.env.PATH_FILESTORAGE ||
//   "/Users/yanutstas/Desktop/Project/portal_backend/files";

// router.post("/", async function (req, res) {
//   const uuid = uuidv4();
//   const userId = req.userId;
//   const dirName = `${pathFileStorage}/${userId}`;

//   console.log("Полный путь для сохранения файлов на сервере:", dirName); // Логируем путь на сервере

//   // Получение настроек обмена из 1С
//   let user_Key, mainVolume_Key;
//   try {
//     const exchangeSettingsResponse = await axios.get(
//       `${SERVER_1C}/InformationRegister_exchangeSettings/SliceLast()?$format=json`,
//       { headers }
//     );
//     const exchangeSettings = exchangeSettingsResponse.data.value[0];
//     console.log("Получены настройки обмена из 1С:", exchangeSettings);
//     user_Key = exchangeSettings.user_Key;
//     mainVolume_Key = exchangeSettings.mainVolume_Key;
//     console.log("user_Key:", user_Key);
//     console.log("mainVolume_Key:", mainVolume_Key);
//   } catch (error) {
//     console.error("Ошибка при получении настроек обмена из 1С:", error);
//     return res.status(500).json({
//       status: "error",
//       message: "Ошибка при получении настроек обмена",
//     });
//   }

//   if (!req.files || Object.keys(req.files).length === 0) {
//     logger.warn(`Запрос на загрузку файлов не содержит файлов. UUID: ${uuid}`);
//     return res.status(400).json({
//       status: "error",
//       message: "Нет файлов для загрузки",
//     });
//   }

//   const files = Array.isArray(req.files.files)
//     ? req.files.files
//     : [req.files.files];

//   // Получение допустимых расширений и максимального размера из 1С
//   let allowedExtensions = [];
//   let maxSizeFile = 10 * 1024 * 1024; // По умолчанию 10 МБ
//   const { categoryKey } = req.body; // Получаем ключ категории из запроса
//   console.log("Полученный categoryKey:", categoryKey); // Логируем полученный categoryKey

//   try {
//     const requestUrl = `${SERVER_1C}/Catalog_services_categoriesFiles?$format=json&$filter=category_Key eq guid'${categoryKey}'&$expand=category`;
//     console.log("Запрос к 1С:", requestUrl); // Логируем запрос
//     const response = await axios.get(requestUrl, { headers });
//     console.log("Ответ от 1С:", response.data); // Логируем ответ от 1С

//     if (response.data.value && response.data.value.length > 0) {
//       const categoryData = response.data.value[0].category;
//       allowedExtensions = JSON.parse(categoryData.availableExtensionsJSON);
//       maxSizeFile = parseInt(categoryData.maximumSize) * 1024 * 1024;
//       console.log("Допустимые расширения из 1С:", allowedExtensions);
//       console.log("Максимальный размер файла из 1С:", maxSizeFile);
//     } else {
//       console.error("Данные из 1С не найдены для данного categoryKey.");
//       return res.status(400).json({
//         status: "error",
//         message: "Неверный categoryKey или данные не найдены.",
//       });
//     }
//   } catch (error) {
//     console.error("Ошибка при получении данных категории из 1С:", error);
//     return res.status(500).json({
//       status: "error",
//       message: "Ошибка при получении данных категории",
//     });
//   }

//   // Проверка расширений и размера файлов
//   let invalidFile = false;
//   for (const file of files) {
//     const fileExtension = file.name.split(".").pop().toUpperCase();
//     if (!allowedExtensions.includes(fileExtension)) {
//       invalidFile = true;
//       break;
//     }
//     if (file.size > maxSizeFile) {
//       invalidFile = true;
//       break;
//     }
//   }

//   if (invalidFile) {
//     logger.warn(
//       `Один или несколько файлов не соответствуют требованиям. UUID: ${uuid}`
//     );
//     return res.status(400).json({
//       status: "error",
//       message: "Файлы не соответствуют требованиям по размеру или типу",
//     });
//   }

//   try {
//     // Создаём директорию, если она не существует
//     await fs.promises.mkdir(dirName, { recursive: true });

//     // Сохраняем файлы во временную директорию
//     for (const file of files) {
//       const filePath = `${dirName}/${file.name}`;
//       console.log("Файл сохраняется по пути:", filePath); // Логируем путь сохранения файла
//       await file.mv(filePath);
//     }

//     // Создаем новый PDF-документ
//     const pdfDoc = await PDFDocument.create();

//     for (const file of files) {
//       const filePath = `${dirName}/${file.name}`;
//       const fileBuffer = await fs.promises.readFile(filePath);
//       console.log("Файл для объединения загружен с пути:", filePath); // Логируем путь загружаемого файла

//       let pdfImage;
//       if (file.mimetype === "image/jpeg" || file.mimetype === "image/jpg") {
//         pdfImage = await pdfDoc.embedJpg(fileBuffer);
//         const page = pdfDoc.addPage([pdfImage.width, pdfImage.height]);
//         page.drawImage(pdfImage, {
//           x: 0,
//           y: 0,
//           width: pdfImage.width,
//           height: pdfImage.height,
//         });
//       } else if (file.mimetype === "image/png") {
//         pdfImage = await pdfDoc.embedPng(fileBuffer);
//         const page = pdfDoc.addPage([pdfImage.width, pdfImage.height]);
//         page.drawImage(pdfImage, {
//           x: 0,
//           y: 0,
//           width: pdfImage.width,
//           height: pdfImage.height,
//         });
//       } else if (file.mimetype === "application/pdf") {
//         const donorPdfDoc = await PDFDocument.load(fileBuffer);
//         const donorPages = await pdfDoc.copyPages(
//           donorPdfDoc,
//           donorPdfDoc.getPageIndices()
//         );
//         donorPages.forEach((page) => pdfDoc.addPage(page));
//       } else {
//         continue;
//       }
//     }

//     const pdfBytes = await pdfDoc.save();
//     const pdfFilename = `combined_document_${uuid}.pdf`;
//     const pdfPath = `${dirName}/${pdfFilename}`;

//     console.log("Созданный PDF сохраняется по пути:", pdfPath); // Логируем путь созданного PDF

//     await fs.promises.writeFile(pdfPath, pdfBytes);
//     logger.info(
//       `Объединенный PDF успешно создан: ${pdfFilename}. UUID: ${uuid}`
//     );

//     // Удаляем объединенный PDF после загрузки
//     try {
//       for (const file of files) {
//         const filePath = `${dirName}/${file.name}`;
//         // console.log("Файл сохраняется по пути:", filePath); // Логируем путь сохранения файла
//         await fs.promises.unlink(filePath);
//       }
//     } catch (err) {
//       logger.error(
//         `Не удалось удалить файлы. Ошибка: ${err.message}`
//       );
//     }
//     // try {
//     //   await fs.promises.unlink(pdfPath);
//     // } catch (err) {
//     //   logger.error(
//     //     `Не удалось удалить объединенный PDF: ${pdfPath}. Ошибка: ${err.message}`
//     //   );
//     // }

//     // Отправка файла в 1С
//     try {
//       const fileData = fs.readFileSync(pdfPath);
//       const base64File = fileData.toString("base64");

//       const currentDate = new Date();
//       const formattedDate = currentDate
//         .toISOString()
//         .slice(0, 10)
//         .replace(/-/g, "");
//       const filePathIn1C = `${userId}/${pdfFilename}`; // заменил '\' на '/' для корректного формирования пути

//       console.log("Файл отправляется в 1С по пути:", filePathIn1C); // Логируем путь для отправки в 1С

//       const payload = {
//         Description: req.body.documentName,
//         ВладелецФайла_Key: userId,
//         Автор_Key: user_Key,
//         ДатаМодификацииУниверсальная: currentDate.toISOString(),
//         ДатаСоздания: currentDate.toISOString(),
//         ПутьКФайлу: filePathIn1C,
//         Размер: fileData.length.toString(),
//         Расширение: "pdf",
//         ТипХраненияФайла: "ВТомахНаДиске",
//         Том_Key: mainVolume_Key,
//         ВидФайла_Key: categoryKey,
//         // ФайлХранилище_Type: "application/octet-stream",
//         // ФайлХранилище_Base64Data: base64File,
//       };

//       const uploadResponse = await axios.post(
//         `${SERVER_1C}/Catalog_profileПрисоединенныеФайлы?$format=json`,
//         payload,
//         { headers }
//       );
//       //выдернуть uploadResponse.data(refkey)
//       console.log("Файл успешно загружен в 1С:", uploadResponse.data); // Логируем успешную загрузку
//     } catch (error) {
//       console.error(
//         "Ошибка при отправке файла в 1С:",
//         error.response ? error.response.data : error.message
//       );
//       return res.status(500).json({
//         status: "error",
//         message: "Ошибка при загрузке файла в 1С",
//       });
//     }

//     return res.json({ status: "ok", message: "Файл успешно загружен" });
//   } catch (error) {
//     logger.error(
//       `Ошибка при обработке файлов. UUID: ${uuid}. Ошибка: ${error.message}`
//     );
//     return res.status(500).json({
//       status: "error",
//       message: "Ошибка при обработке файлов",
//     });
//   }
// });

// module.exports = router;
