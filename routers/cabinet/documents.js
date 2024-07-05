const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const logger = require("../../logger");

const pathFileStorage = process.env.PATH_FILESTORAGE;
const maxSizeFile = 10;

const server1C = "http://45.89.189.5/InfoBase/odata/standard.odata";

router.post("/", async function (req, res) {
  const userId = req.userId;
  const { documentName, files, nameDoc_Key } = req.body;

  if (!documentName && !files) {
    return res.status(400).json({
      status: "error",
      message: "Нет нужных полей",
    });
  }

  const filesData = files.map((file, index) => ({
    LineNumber: index + 1,
    fileName: file.name,
    fileType: file.name.split(".").pop(),
    fileSize: "1000",
  }));

  const payload = {
    Description: documentName,
    profile: userId,
    files: filesData,
    nameDoc_Key,
  };

  logger.info(
    `Получен запрос на сохранение документа от пользователя с id: ${userId}`
  );

  try {
    const response = await axios.post(
      `${server1C}/Catalog_DocumentsOfProfiles?$format=json`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (response.data) {
      logger.info(`Документ успешно сохранен для пользователя с id: ${userId}`);
      res.json({
        status: "ok",
        message: "Документ успешно сохранен",
        data: response.data,
      });
    }
  } catch (error) {
    logger.error(
      `Ошибка при отправке данных в 1С для пользователя с id: ${userId}. Ошибка: ${error.message}`
    );
    res.status(500).json({
      status: "error",
      message: "Ошибка при отправке данных в 1С",
    });
  }
});

router.get("/", async function (req, res) {
  const userId = req.userId;

  logger.info(
    `Получен запрос на получение документов пользователя с id: ${userId}`
  );

  try {
    const response = await axios.get(
      `${server1C}/Catalog_DocumentsOfProfiles?$format=json&$filter=(profile eq '${userId}') and (DeletionMark eq false)`
    );

    if (response.data) {
      logger.info(
        `Документы успешно получены для пользователя с id: ${userId}`
      );
      res.json({
        status: "ok",
        documents: response.data.value,
      });
    }
  } catch (error) {
    logger.error(
      `Ошибка при получении данных из 1С для пользователя с id: ${userId}. Ошибка: ${error.message}`
    );
    res.status(500).json({
      status: "error",
      message: "Ошибка при получении данных из 1С",
    });
  }
});

router.get("/getNameDocs", async function (req, res) {
  logger.info("Получен запрос на получение наименований документов профиля");

  try {
    const response = await axios.get(
      `${server1C}/ChartOfCharacteristicTypes_НаименованиеДокументовПрофиля?$format=json`
    );
    console.log(response.data);
    if (response.data) {
      logger.info("Наименования документов профиля успешно получены");
      res.json({
        status: "ok",
        nameDocs: response.data.value,
      });
    }
  } catch (error) {
    logger.error(
      `Ошибка при получении наименований документов из 1С. Ошибка: ${error.message}`
    );
    res.status(500).json({
      status: "error",
      message: "Ошибка при получении данных из 1С",
    });
  }
});

router.get("/:id", async function (req, res) {
  const userId = req.userId;
  const idDocument = req.params.id;

  logger.info(`Получен запрос на получение документа с id: ${idDocument}`);

  try {
    const response = await axios.get(
      `${server1C}/Catalog_DocumentsOfProfiles(guid'${idDocument}')?$format=json`
    );
    console.log(response.data);
    if (response.data) {
      if (response.data.profile === userId) {
        logger.info(
          `Документ с id: ${idDocument} успешно получен для пользователя: ${userId}`
        );
        res.json({
          status: "ok",
          document: response.data,
        });
      } else {
        logger.warn(
          `Документ с id: ${idDocument} не принадлежит пользователю: ${userId}`
        );
        res.status(400).json({
          status: "error",
          message: "Не верный id документа",
        });
      }
    }
  } catch (error) {
    logger.error(
      `Ошибка при получении данных из 1С для документа с id: ${idDocument}. Ошибка: ${error.message}`
    );
    res.status(500).json({
      status: "error",
      message: "Ошибка при получении данных из 1С",
    });
  }
});

router.put("/:id", async function (req, res) {
  const userId = req.userId;
  const idDocument = req.params.id;
  const { documentName, files, nameDoc_Key } = req.body;

  logger.info(
    `Получен запрос на обновление документа с id: ${idDocument} от пользователя: ${userId}`
  );

  if (!documentName && !files) {
    logger.warn(
      `Не указаны необходимые поля для обновления документа с id: ${idDocument}`
    );
    return res.status(400).json({
      status: "error",
      message: "Нет нужных полей",
    });
  }

  const filesData = files.map((file, index) => ({
    LineNumber: index + 1,
    fileName: file.name,
    fileType: file.name.split(".").pop(),
    fileSize: "1000",
  }));

  const payload = {
    Description: documentName,
    profile: userId,
    files: filesData,
    nameDoc_Key,
  };

  try {
    const response = await axios.patch(
      `${server1C}/Catalog_DocumentsOfProfiles(guid'${idDocument}')?$format=json`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (response.data) {
      logger.info(
        `Документ с id: ${idDocument} успешно обновлен для пользователя: ${userId}`
      );
      res.json({
        status: "ok",
        message: "Документ успешно обновлен",
        data: response.data,
      });
    }
  } catch (error) {
    logger.error(
      `Ошибка при обновлении данных в 1С для документа с id: ${idDocument}. Ошибка: ${error.message}`
    );
    res.status(500).json({
      status: "error",
      message: "Ошибка при обновлении данных в 1С",
    });
  }
});

module.exports = router;
