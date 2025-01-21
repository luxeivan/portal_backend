const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");

const logger = require("../../logger");
const { log } = require("console");

const pathFileStorage = process.env.PATH_FILESTORAGE;
const maxSizeFile = 10;

const documentsStore = {};

const SERVER_1C = process.env.SERVER_1C;
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;

// Адрес, по которому будем оповещать бота
// (если бот и бэкенд на одном сервере, указывайте http://127.0.0.1:3001/notifyError)
const botNotifyUrl =
  process.env.BOT_NOTIFY_URL || "http://127.0.0.1:3001/notifyError";

const headers = {
  Authorization: server1c_auth,
  "Content-Type": "application/json",
};

async function notifyBot(message, errorDetails = {}) {
  if (!botNotifyUrl) return;

  try {
    await axios.post(botNotifyUrl, {
      message,
      error: errorDetails,
    });
  } catch (notifyErr) {
    console.error("Не смогли оповестить бота:", notifyErr.message);
  }
}

// Новый маршрут для получения категорий документов из 1С
router.get("/categories", async function (req, res) {
  try {
    // Шаг 2: Получение категорий документов из 1С
    const response = await axios.get(
      // `${SERVER_1C}/Catalog_services_categoriesFiles/?$format=json&$select=**&$filter=Ref_Key eq guid'6739b454-176f-11ef-94f0-5ef3fcb042f8'&$expand=category`,
      `${SERVER_1C}/Catalog_ВидыФайлов?$format=json&$select=Description,label,Ref_Key,maximumSize`,
      { headers }
    );

    const categoriesData = response.data.value;
    console.log("Получены категории документов из 1С:", categoriesData); // Выводим категории документов

    res.json({
      status: "ok",
      categories: categoriesData,
    });
  } catch (error) {
    console.error("Ошибка при получении категорий документов из 1С:", error);

    const errorDetails = {
      config: {
        url: error?.config?.url,
        method: error?.config?.method,
      },
      response: {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
      },
      code: error?.code,
      message: error?.message,
    };

    // Оповещение бота
    await notifyBot(
      `Ошибка при получении категорий документов из 1С: ${error.message}`,
      errorDetails
    );

    res.status(500).json({
      status: "error",
      message: "Ошибка при получении категорий документов",
    });
  }
});

router.post("/", async function (req, res) {
  try {
    const userId = req.userId;
    const { documentName, files, category } = req.body;

    if (!documentName || !files) {
      console.error(
        `Отсутствуют необходимые поля в запросе от пользователя с id: ${userId}`
      );
      return res.status(400).json({
        status: "error",
        message: "Нет нужных полей",
      });
    }

    // Создаём объект документа
    const document = {
      id: uuidv4(), // Уникальный идентификатор документа
      documentName,
      category,
      files, // Массив файлов { name }
    };

    // Сохраняем документ в хранилище
    if (!documentsStore[userId]) {
      documentsStore[userId] = [];
    }
    documentsStore[userId].push(document);

    // Возвращаем успешный ответ
    res.json({
      status: "ok",
      message: "Документ успешно сохранен",
      data: document,
    });
  } catch (error) {
    console.error("Ошибка при сохранении документа:", error);
    res.status(500).json({
      status: "error",
      message: "Ошибка при сохранении документа",
    });
  }
});

router.get("/", async function (req, res) {
  const userId = req.userId;

  try {
    //добавить + параметр в фильтр(Категории)
    const requestUrl = `${SERVER_1C}/InformationRegister_connectionsOfElements/SliceLast(,Condition='element2 eq cast(guid'${userId}', 'Catalog_profile')')?$format=json&$expand=element1&$filter=usage eq true`;
    // const requestUrl = `${SERVER_1C}/InformationRegister_connectionsOfElements?$format=json&$filter=element2 eq cast(guid'${userId}', 'Catalog_profile') and usage eq true and element1_Type eq 'StandardODATA.Catalog_profileПрисоединенныеФайлы'&$expand=element1`;

    const response = await axios.get(requestUrl, { headers });

    const connections = response.data.value;

    if (!connections || connections.length === 0) {
      return res.json({
        status: "ok",
        documents: [],
      });
    }

    const documents = connections.map(
      (connection) => connection.element1_Expanded
    );

    return res.json({
      status: "ok",
      documents: documents,
    });
  } catch (error) {
    console.error(`Ошибка при получении документов из 1С: ${error.message}`);

    const errorDetails = {
      config: {
        url: error?.config?.url,
        method: error?.config?.method,
      },
      response: {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
      },
      code: error?.code,
      message: error?.message,
    };

    // Оповещение бота
    await notifyBot(
      `Ошибка при получении документов из 1С: ${error.message}`,
      errorDetails
    );

    return res.status(500).json({
      status: "error",
      message: "Ошибка при получении документов",
    });
  }
});

router.get("/by-category", async function (req, res) {
  const userId = req.userId;
  const categoryKey = req.query.categoryKey;

  try {
    const requestUrl = `${SERVER_1C}/InformationRegister_connectionsOfElements/SliceLast(,Condition='element2 eq cast(guid'${userId}', 'Catalog_profile')')?$format=json&$expand=element1&$filter=usage eq true and element1/category_Key eq guid'${categoryKey}'`;

    // const requestUrl = `${SERVER_1C}/InformationRegister_connectionsOfElements?$format=json&$expand=element1&$filter=usage eq true and element2_Key eq guid'${userId}' and element1/VidFayla_Key eq guid'${categoryKey}'`;
    const response = await axios.get(requestUrl, { headers });
    const connections = response.data.value;

    if (!connections || connections.length === 0) {
      return res.json({ status: "ok", documents: [] });
    }

    const documents = connections.map(
      (connection) => connection.element1_Expanded
    );
    return res.json({ status: "ok", documents });
  } catch (error) {
    console.error(`Ошибка при получении документов из 1С: ${error.message}`);

    const errorDetails = {
      config: {
        url: error?.config?.url,
        method: error?.config?.method,
      },
      response: {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
      },
      code: error?.code,
      message: error?.message,
    };

    // Оповещение бота
    await notifyBot(
      `Ошибка при получении документов по категориям из 1С: ${error.message}`,
      errorDetails
    );

    return res
      .status(500)
      .json({ status: "error", message: "Ошибка при получении документов" });
  }
});

router.get("/getNameDocs", async function (req, res) {
  logger.info("Получен запрос на получение наименований документов профиля");

  try {
    const response = await axios.get(
      `${server1C}/ChartOfCharacteristicTypes_НаименованиеДокументовПрофиля?$format=json`
    );

    if (response.data) {
      // logger.info("Наименования документов профиля успешно получены");
      return res.json({
        status: "ok",
        nameDocs: response.data.value,
      });
    } else {
      logger.warn("Нет данных по наименованиям документов профиля");
      return res.status(404).json({
        status: "error",
        message: "Нет данных по наименованиям документов профиля",
      });
    }
  } catch (error) {
    logger.error(
      `Ошибка при получении наименований документов из 1С. Ошибка: ${error.message}`
    );
    return res.status(500).json({
      status: "error",
      message: "Ошибка при получении данных из 1С",
    });
  }
});

router.get("/:id", async function (req, res) {
  const userId = req.userId;
  const idDocument = req.params.id;

  // logger.info(`Получен запрос на получение документа с id: ${idDocument}`);

  try {
    const response = await axios.get(
      `${server1C}/Catalog_DocumentsOfProfiles(guid'${idDocument}')?$format=json`
    );

    if (response.data) {
      if (response.data.profile === userId) {
        // logger.info(
        //   `Документ с id: ${idDocument} успешно получен для пользователя: ${userId}`
        // );
        return res.json({
          status: "ok",
          document: response.data,
        });
      } else {
        logger.warn(
          `Документ с id: ${idDocument} не принадлежит пользователю: ${userId}`
        );
        return res.status(400).json({
          status: "error",
          message: "Не верный id документа",
        });
      }
    } else {
      logger.warn(`Документ с id: ${idDocument} не найден`);
      return res.status(404).json({
        status: "error",
        message: "Документ не найден",
      });
    }
  } catch (error) {
    logger.error(
      `Ошибка при получении данных из 1С для документа с id: ${idDocument}. Ошибка: ${error.message}`
    );
    return res.status(500).json({
      status: "error",
      message: "Ошибка при получении данных из 1С",
    });
  }
});

router.put("/:id", async function (req, res) {
  const userId = req.userId;
  const idDocument = req.params.id;
  const { documentName, files, nameDoc_Key } = req.body;

  // logger.info(
  //   `Получен запрос на обновление документа с id: ${idDocument} от пользователя: ${userId}`
  // );

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
    const object = await getObjectItem(idDocument);
    if (object.attributes.profil.data.id !== userId) {
      logger.warn(
        `Документ с id: ${idDocument} не принадлежит пользователю: ${userId}`
      );
      return res.status(400).json({
        status: "error",
        message: "Неверный id объекта",
      });
    }

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

router.delete("/:id", async function (req, res) {
  const userId = req.userId;
  const fileId = req.params.id;

  try {
    // Шаг 1: Получаем существующую связь из 1С
    const connectionResponse = await axios.get(
      `${SERVER_1C}/InformationRegister_connectionsOfElements/SliceLast(,Condition='element1 eq cast(guid'${fileId}', 'Catalog_profileПрисоединенныеФайлы') and element2 eq cast(guid'${userId}', 'Catalog_profile')')?$format=json&$filter=usage eq true`,
      { headers }
    );

    const connections = connectionResponse.data.value;

    if (!connections || connections.length === 0) {
      return res.status(403).json({
        status: "error",
        message: "У вас нет доступа к этому документу",
      });
    }

    const connectionEntry = connections[0];

    // Шаг 2: Добавляем новую запись в регистр с usage: false
    const newEntry = {
      Period: moment().format(),
      Recorder: null,
      usage: false,
      element1: connectionEntry.element1,
      element1_Type: connectionEntry.element1_Type,
      element2: connectionEntry.element2,
      element2_Type: connectionEntry.element2_Type,
      reason: "Удаление документа из профиля пользователя",
    };

    // Добавляем новую запись
    await axios.post(
      `${SERVER_1C}/InformationRegister_connectionsOfElements`,
      newEntry,
      { headers }
    );

    res.json({
      status: "ok",
      message: "Документ успешно удален",
    });
  } catch (error) {
    console.error(`Ошибка при удалении документа: ${error.message}`);
    if (error.response) {
      console.error("Ответ от сервера 1С:", error.response.data);
    }
    res.status(500).json({
      status: "error",
      message: "Ошибка при удалении документа",
    });
  }
});

module.exports = router;
