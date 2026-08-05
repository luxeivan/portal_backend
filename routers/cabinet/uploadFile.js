const express = require("express");
const router = express.Router();
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const logger = require("../../logger");
const { PDFDocument } = require("pdf-lib");
const axios = require("axios");
// const moment = require("moment");
require("dotenv").config();

// const SERVER_1C = process.env.SERVER_1C;
const SERVER_1C_HTTP_SERVICE = process.env.SERVER_1C_HTTP_SERVICE;
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;
const headers = {
  Authorization: server1c_auth,
  "Content-Type": "application/json",
};
const sigExtensions = ["SIG", "P7S", "SIGN", "SGN", "PKCS7"];
const allowedExtensions = ["JPEG", "JPG", "PDF", "PNG", "SIG", "P7S", "SIGN", "SGN"];
const maxSizeFile = 10 * 1024 * 1024; // По умолчанию 10 МБ

const pathFileStorage =
  process.env.PATH_FILESTORAGE ||
  "/uploads/";
async function convertToPdf(dirName, files) {
  // Создаем новый PDF-документ
  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const filePath = `${dirName}/${file.name}`;
    const fileBuffer = await fs.promises.readFile(filePath);
    // console.log("Файл для объединения загружен с пути:", filePath);

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
  return await pdfDoc.saveAsBase64();
  // const pdfFilename = `combined_document_${uuid}.pdf`;
  // const pdfPath = `${dirName}/${pdfFilename}`;

  // console.log("Созданный PDF сохраняется по пути:", pdfPath);
}
function checkFiles(files) {
  // Проверка расширений и размера файлов
  let invalidFile = false;
  for (const file of files) {
    const fileExtension = file.name.split(".").pop().toUpperCase();
    if (!allowedExtensions.includes(fileExtension)) {
      invalidFile = "Неподдерживаемое расширение файла";
      break;
    }
    if (file.size > maxSizeFile) {
      invalidFile = "Превышен размер файла. Максимально 10 МБ";
      break;
    }
  }
  // console.log("checkFiles",invalidFile);

  return invalidFile
}
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
  // const type = req.query.type;
  const dirName = `${pathFileStorage}/${userId}`;

  // console.log("Полный путь для сохранения файлов на сервере:", dirName);


  if (!req.files || Object.keys(req.files).length === 0) {
    logger.warn(`Запрос на загрузку файлов не содержит файлов. userId: ${userId}`);
    return res.status(400).json({
      status: "error",
      message: "Нет файлов для загрузки",
    });
  }

  let files = Array.isArray(req.files.files)
    ? req.files.files
    : [req.files.files];

  // Получение допустимых расширений и максимального размера из 1С

  const { categoryKey, saveToProfile } = req.body;
  // console.log("Полученный saveToProfile:", saveToProfile);
  //  console.log("Полученный categoryKey:", categoryKey);

  // console.log("files",files);
  const invalidFile = checkFiles(files)
  if (invalidFile) {
    logger.warn(
      `Один или несколько файлов не соответствуют требованиям. userId: ${userId}`
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
    files = files.map(file => {
      file.name = uuidv4() + "." + file.name.split(".").pop()
      file.originalName = file.name
      return file
    })
    // Сохраняем файлы во временную директорию
    for (const file of files) {
      const filePath = `${dirName}/${file.name}`;
      // console.log("Файл сохраняется по пути:", filePath);
      await file.mv(filePath);
    }

    let fileBase64 = ""
    let extForSave = "pdf"
    let originalName = ""

    if (files.length === 1 && sigExtensions.includes(files[0].name.split(".").pop().toUpperCase())) {

      const filePath = `${dirName}/${files[0].name}`;
      const fileBuffer = await fs.promises.readFile(filePath);
      extForSave = files[0].name.split(".").pop()
      originalName = files[0].originalName
      fileBase64 = fileBuffer.toString('base64')


    } else {
      fileBase64 = await convertToPdf(dirName, files)
    }
    try {

      const resSaveFile = await axios.post(`${SERVER_1C_HTTP_SERVICE}/profile/${userId}/file`, {
        base64: fileBase64,
        ext: extForSave,
        originalName
      }, { headers })

      console.log({
        ext: extForSave,
        originalName
      });

    } catch (error) {
      logger.error(
        `Ошибка при сохранении файла в 1С. userId: ${userId}. Ошибка: ${error.message || typeof error === 'string' ? error : JSON.parse(error)}`
      );
    }

    // console.log("res", res.data)


    // Удаляем исходные файлы после объединения
    try {
      for (const file of files) {
        const filePath = `${dirName}/${file.name}`;
        await fs.promises.unlink(filePath);
      }
    } catch (err) {
      logger.error(`Не удалось удалить файлы. Ошибка: ${err.message}`);
    }

    try {

      if (saveToProfile) {
        const resSaveDocsProfile = await axios.post(`${SERVER_1C_HTTP_SERVICE}/profile/${userId}/docs`, {
          fileId: resSaveFile?.data?.data?.fileId,
          name: req.body.documentName,
          typeFileId: categoryKey
        }, { headers })
        // console.log("resSaveDocsProfile", resSaveDocsProfile.data)
      } else {
        return res.json({ status: "ok", message: "Файл успешно загружен", fileId: resSaveFile?.data?.data?.fileId });
      }


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

    return res.json({ status: "ok", message: "Файл успешно загружен" });
  } catch (error) {
    // console.log("typeof", typeof error)
    // console.log("errorMessage", error.message)
    logger.error(
      `Ошибка при обработке файлов. userId: ${userId}. Ошибка: ${error.message || typeof error === 'string' ? error : JSON.parse(error)}`
    );
    let message = "Ошибка при обработке файлов"
    if (error === "The input is not a PNG file!") {
      message = "Файл не является PNG"
    } else if (error === "The input is not a JPG file!" || error === "The input is not a JPEG file!") {
      message = "Файл не является JPG"
    } else if (typeof error === 'object' && error.message.includes("Failed to parse PDF document")) {
      message = "Файл не является PDF"
    } else {

    }
    return res.status(500).json({
      status: "error",
      message,
      error
    });
  }
});

module.exports = router;