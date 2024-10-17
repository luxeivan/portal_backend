const express = require("express");
const router = express.Router();
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const logger = require("../../logger");
const { PDFDocument } = require("pdf-lib");
const axios = require("axios");
require("dotenv").config();

const SERVER_1C = process.env.SERVER_1C;
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;
const headers = {
  Authorization: server1c_auth,
  "Content-Type": "application/json",
};

const pathFileStorage =
  process.env.PATH_FILESTORAGE ||
  "/Users/yanutstas/Desktop/Project/portal_backend/files";

router.post("/", async function (req, res) {
  const uuid = uuidv4();
  const userId = req.userId;
  const dirName = `${pathFileStorage}/${userId}`;

  console.log(
    `\n=== Upload File Route Hit ===\nUUID: ${uuid}\nUser ID: ${userId}\n`
  );

  // Получение настроек обмена из 1С
  let user_Key, mainVolume_Key;
  try {
    const exchangeSettingsResponse = await axios.get(
      `${SERVER_1C}/InformationRegister_exchangeSettings/SliceLast()?$format=json`,
      { headers }
    );
    const exchangeSettings = exchangeSettingsResponse.data.value[0];
    console.log("Получены настройки обмена из 1С:", exchangeSettings);
    user_Key = exchangeSettings.user_Key;
    mainVolume_Key = exchangeSettings.mainVolume_Key;
    console.log("user_Key:", user_Key);
    console.log("mainVolume_Key:", mainVolume_Key);
  } catch (error) {
    console.error("Ошибка при получении настроек обмена из 1С:", error);
    return res.status(500).json({
      status: "error",
      message: "Ошибка при получении настроек обмена",
    });
  }

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

  console.log(
    "Полученные файлы:",
    files.map((f) => f.name)
  );

  // Получение допустимых расширений и максимального размера из 1С
  let allowedExtensions = [];
  let maxSizeFile = 10 * 1024 * 1024; // По умолчанию 10 МБ
  const { categoryKey } = req.body; // Получаем ключ категории из запроса
  console.log("Полученный categoryKey:", categoryKey); // Логируем полученный categoryKey

  try {
    const requestUrl = `${SERVER_1C}/Catalog_services_categoriesFiles?$format=json&$filter=Ref_Key eq guid'${categoryKey}'`;
    console.log("Запрос к 1С для получения данных категории:", requestUrl); // Логируем запрос
    const response = await axios.get(requestUrl, { headers });
    console.log("Ответ от 1С по категории:", response.data); // Логируем ответ от 1С

    if (response.data.value && response.data.value.length > 0) {
      const categoryData = response.data.value[0];
      console.log("Полученные данные категории:", categoryData);
      allowedExtensions = JSON.parse(categoryData.availableExtensionsJSON);
      maxSizeFile = parseInt(categoryData.maximumSize) * 1024 * 1024;
      console.log("Допустимые расширения из 1С:", allowedExtensions);
      console.log("Максимальный размер файла из 1С:", maxSizeFile);
    } else {
      console.error("Данные из 1С не найдены для данного categoryKey.");
      return res.status(400).json({
        status: "error",
        message: "Неверный categoryKey или данные не найдены.",
      });
    }
  } catch (error) {
    console.error("Ошибка при получении данных категории из 1С:", error);
    return res.status(500).json({
      status: "error",
      message: "Ошибка при получении данных категории",
    });
  }

  // Проверка расширений и размера файлов
  let invalidFile = false;
  for (const file of files) {
    const fileExtension = file.name.split(".").pop().toUpperCase();
    console.log(`Проверка файла ${file.name}, расширение: ${fileExtension}`);
    if (!allowedExtensions.includes(fileExtension)) {
      console.warn(`Недопустимое расширение файла: ${file.name}`);
      invalidFile = true;
      break;
    }
    if (file.size > maxSizeFile) {
      console.warn(`Файл превышает максимальный размер: ${file.name}`);
      invalidFile = true;
      break;
    }
  }

  if (invalidFile) {
    logger.warn(
      `Один или несколько файлов не соответствуют требованиям. UUID: ${uuid}`
    );
    return res.status(400).json({
      status: "error",
      message: "Файлы не соответствуют требованиям по размеру или типу",
    });
  }

  try {
    // Создаём директорию, если она не существует
    await fs.promises.mkdir(dirName, { recursive: true });
    console.log(`Директория для сохранения файлов: ${dirName}`);

    // Сохраняем файлы во временную директорию
    for (const file of files) {
      const filePath = `${dirName}/${file.name}`;
      await file.mv(filePath);
      console.log(`Файл сохранён: ${filePath}`);
    }

    // Создаем новый PDF-документ
    const pdfDoc = await PDFDocument.create();
    console.log("Создан новый PDF-документ для объединения файлов");

    for (const file of files) {
      const filePath = `${dirName}/${file.name}`;
      const fileBuffer = await fs.promises.readFile(filePath);
      console.log(`Обрабатываем файл: ${file.name}`);

      if (file.mimetype === "image/jpeg" || file.mimetype === "image/jpg") {
        const pdfImage = await pdfDoc.embedJpg(fileBuffer);
        const page = pdfDoc.addPage([pdfImage.width, pdfImage.height]);
        page.drawImage(pdfImage, {
          x: 0,
          y: 0,
          width: pdfImage.width,
          height: pdfImage.height,
        });
        console.log(`Добавлено изображение JPG: ${file.name}`);
      } else if (file.mimetype === "image/png") {
        const pdfImage = await pdfDoc.embedPng(fileBuffer);
        const page = pdfDoc.addPage([pdfImage.width, pdfImage.height]);
        page.drawImage(pdfImage, {
          x: 0,
          y: 0,
          width: pdfImage.width,
          height: pdfImage.height,
        });
        console.log(`Добавлено изображение PNG: ${file.name}`);
      } else if (file.mimetype === "application/pdf") {
        const donorPdfDoc = await PDFDocument.load(fileBuffer);
        const donorPages = await pdfDoc.copyPages(
          donorPdfDoc,
          donorPdfDoc.getPageIndices()
        );
        donorPages.forEach((page) => pdfDoc.addPage(page));
        console.log(`Добавлены страницы из PDF: ${file.name}`);
      } else {
        console.warn(`Неизвестный тип файла, пропускаем: ${file.name}`);
        continue;
      }
    }

    const pdfBytes = await pdfDoc.save();
    const pdfFilename = `combined_document_${uuid}.pdf`;
    const pdfPath = `${dirName}/${pdfFilename}`;
    await fs.promises.writeFile(pdfPath, pdfBytes);
    console.log(`Объединённый PDF сохранён: ${pdfPath}`);

    // Удаление временных файлов
    for (const file of files) {
      const filePath = `${dirName}/${file.name}`;
      try {
        await fs.promises.unlink(filePath);
        console.log(`Временный файл удалён: ${filePath}`);
      } catch (err) {
        console.error(`Не удалось удалить временный файл: ${filePath}`, err);
      }
    }

    // Отправка файла в 1С
    try {
      const fileData = fs.readFileSync(pdfPath);
      const base64File = fileData.toString("base64");

      const currentDate = new Date();
      const formattedDate = currentDate
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "");
      const filePathIn1C = `claimsProject\\${formattedDate}\\${pdfFilename}`;
      console.log("Путь к файлу в 1С:", filePathIn1C);

      const payload = {
        Description: req.body.documentName,
        ВладелецФайла_Key: userId,
        Автор_Key: user_Key,
        ДатаМодификацииУниверсальная: currentDate.toISOString(),
        ДатаСоздания: currentDate.toISOString(),
        ПутьКФайлу: filePathIn1C,
        Размер: fileData.length.toString(),
        Расширение: "pdf",
        ТипХраненияФайла: "ВТомахНаДиске",
        Том_Key: mainVolume_Key,
        ВидФайла_Key: categoryKey,
        ФайлХранилище_Type: "application/octet-stream",
        ФайлХранилище_Base64Data: base64File,
      };

      console.log("Payload для загрузки в 1С:", payload);

      const uploadResponse = await axios.post(
        `${SERVER_1C}/Catalog_profileПрисоединенныеФайлы?$format=json`,
        payload,
        { headers }
      );
      console.log("Файл успешно загружен в 1С:", uploadResponse.data);
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

    // Удаляем объединенный PDF после загрузки
    try {
      await fs.promises.unlink(pdfPath);
      console.log(`Объединённый PDF удалён: ${pdfPath}`);
    } catch (err) {
      console.error(`Не удалось удалить объединённый PDF: ${pdfPath}`, err);
    }

    return res.json({ status: "ok", message: "Файл успешно загружен" });
  } catch (error) {
    console.error(
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
//       await file.mv(filePath);
//     }

//     // Создаем новый PDF-документ
//     const pdfDoc = await PDFDocument.create();

//     for (const file of files) {
//       const filePath = `${dirName}/${file.name}`;
//       const fileBuffer = await fs.promises.readFile(filePath);

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

//     await fs.promises.writeFile(pdfPath, pdfBytes);
//     logger.info(
//       `Объединенный PDF успешно создан: ${pdfFilename}. UUID: ${uuid}`
//     );

//     // Отправка файла в 1С
//     try {
//       const fileData = fs.readFileSync(pdfPath);
//       const base64File = fileData.toString("base64");

//       const currentDate = new Date();
//       const formattedDate = currentDate
//         .toISOString()
//         .slice(0, 10)
//         .replace(/-/g, "");
//       const filePathIn1C = `claimsProject/${formattedDate}/${pdfFilename}`; // Изменение: замена '\' на '/' для корректного формирования пути

//       const payload = {
//         Description: req.body.documentName,
//         ВладелецФайла_Key: userId,
//         Автор_Key: user_Key,
//         ДатаМодификацииУниверсальная: currentDate.toISOString(),
//         ДатаСоздания: currentDate.toISOString(),
//         ПутьКФайлу: filePathIn1C, // Убедитесь, что путь корректен для чтения в 1С
//         Размер: fileData.length.toString(),
//         Расширение: "pdf",
//         ТипХраненияФайла: "ВТомахНаДиске",
//         Том_Key: mainVolume_Key,
//         ВидФайла_Key: categoryKey,
//         ФайлХранилище_Type: "application/octet-stream",
//         ФайлХранилище_Base64Data: base64File,
//       };

//       const uploadResponse = await axios.post(
//         `${SERVER_1C}/Catalog_profileПрисоединенныеФайлы?$format=json`,
//         payload,
//         { headers }
//       );
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

//     // Удаляем объединенный PDF после загрузки
//     try {
//       await fs.promises.unlink(pdfPath);
//     } catch (err) {
//       logger.error(
//         `Не удалось удалить объединенный PDF: ${pdfPath}. Ошибка: ${err.message}`
//       );
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
