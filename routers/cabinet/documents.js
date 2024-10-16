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

const documentsStore = {}; // Ключ — userId, значение — массив документов пользователя

const SERVER_1C = process.env.SERVER_1C;
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;
const headers = {
  Authorization: server1c_auth,
};

/**
 * @swagger
 * tags:
 *   - name: Documents
 *     description: Маршруты для работы с документами профиля пользователя
 */

// Новый маршрут для получения категорий документов из 1С
router.get("/categories", async function (req, res) {
  try {
    // Шаг 2: Получение категорий документов из 1С
    const response = await axios.get(
      `${SERVER_1C}/Catalog_services_categoriesFiles/?$format=json&$select=**&$filter=Ref_Key%20eq%20guid'6739b454-176f-11ef-94f0-5ef3fcb042f8'&$expand=category`,
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
    res.status(500).json({
      status: "error",
      message: "Ошибка при получении категорий документов",
    });
  }
});

/**
 * @swagger
 * tags:
 *   - name: Documents
 *     description: Маршруты для работы с документами профиля пользователя
 */

/**
 * @swagger
 * /api/cabinet/documents:
 *   post:
 *     summary: Сохранение документа
 *     description: Сохраняет новый документ в системе.
 *     tags:
 *       - Documents
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               documentName:
 *                 type: string
 *               files:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Имя файла
 *               nameDoc_Key:
 *                 type: string
 *                 description: Ключ документа
 *     responses:
 *       200:
 *         description: Документ успешно сохранен
 *       400:
 *         description: Нет нужных полей
 *       500:
 *         description: Ошибка при сохранении документа
 */

// router.post("/", async function (req, res) {
//   try {
//     const userId = req.userId;
//     const { documentName, files, nameDoc_Key } = req.body;

//     if (!documentName && !files) {
//       logger.error(
//         `Отсутствуют необходимые поля в запросе от пользователя с id: ${userId}`
//       );
//       return res.status(400).json({
//         status: "error",
//         message: "Нет нужных полей",
//       });
//     }

//     const filesData = files.map((file, index) => ({
//       LineNumber: index + 1,
//       fileName: file.name,
//       fileType: file.name.split(".").pop(),
//       fileSize: "1000",
//     }));

//     const payload = {
//       Description: documentName,
//       profile: userId,
//       files: filesData,
//       nameDoc_Key,
//     };

//     // logger.info(
//     //   `Получен запрос на сохранение документа от пользователя с id: ${userId}`
//     // );

//     const response = await axios.post(
//       `${server1C}/Catalog_DocumentsOfProfiles?$format=json`,
//       payload,
//       {
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     if (response.data) {
//       logger.info(`Документ успешно сохранен для пользователя с id: ${userId}`);
//       res.json({
//         status: "ok",
//         message: "Документ успешно сохранен",
//         data: response.data,
//       });
//     }
//   } catch (error) {
//     // logger.error(
//     //   `Ошибка при отправке данных в 1С для пользователя с id: ${userId}. Ошибка: ${error.message}`
//     // );
//     res.status(500).json({
//       status: "error",
//       message: "Ошибка при отправке данных в 1С",
//     });
//   }
// });

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

/**
 * @swagger
 * /api/cabinet/documents:
 *   get:
 *     summary: Получение документов
 *     description: Получает список всех документов пользователя.
 *     tags:
 *       - Documents
 *     responses:
 *       200:
 *         description: Список документов успешно получен
 *       404:
 *         description: Нет данных
 *       500:
 *         description: Ошибка при получении данных
 */

// router.get("/", async function (req, res) {
//   const userId = req.userId;

//   // logger.info(
//   //   `Получен запрос на получение документов пользователя с id: ${userId}`
//   // );

//   try {
//     const response = await axios.get(
//       `${server1C}/Catalog_DocumentsOfProfiles?$format=json&$filter=(profile eq '${userId}') and (DeletionMark eq false)`
//     );

//     if (response.data) {
//       logger.info(
//         `Документы успешно получены для пользователя с id: ${userId}`
//       );
//       return res.json({
//         status: "ok",
//         documents: response.data.value,
//       });
//     } else {
//       logger.warn(`Нет данных для пользователя с id: ${userId}`);
//       return res.status(404).json({
//         status: "error",
//         message: "Нет данных",
//       });
//     }
//   } catch (error) {
//     logger.error(
//       `Ошибка при получении данных из 1С для пользователя с id: ${userId}. Ошибка: ${error.message}`
//     );
//     return res.status(500).json({
//       status: "error",
//       message: "Ошибка при получении данных из 1С",
//     });
//   }
// });

router.get("/", async function (req, res) {
  const userId = req.userId;

  try {
    // Получаем документы пользователя из хранилища
    const userDocuments = documentsStore[userId] || [];

    return res.json({
      status: "ok",
      documents: userDocuments,
    });
  } catch (error) {
    console.error(
      `Ошибка при получении документов для пользователя с id: ${userId}. Ошибка: ${error.message}`
    );
    return res.status(500).json({
      status: "error",
      message: "Ошибка при получении документов",
    });
  }
});

/**
 * @swagger
 * /api/cabinet/documents/getNameDocs:
 *   get:
 *     summary: Получение наименований документов профиля
 *     description: Получает наименования документов профиля.
 *     tags:
 *       - Documents
 *     responses:
 *       200:
 *         description: Наименования документов успешно получены
 *       404:
 *         description: Нет данных
 *       500:
 *         description: Ошибка при получении данных
 */
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

/**
 * @swagger
 * /api/cabinet/documents/{id}:
 *   get:
 *     summary: Получение документа по ID
 *     description: Получает информацию о документе по его ID.
 *     tags:
 *       - Documents
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Идентификатор документа
 *     responses:
 *       200:
 *         description: Документ успешно получен
 *       400:
 *         description: Не верный ID документа
 *       404:
 *         description: Документ не найден
 *       500:
 *         description: Ошибка при получении данных
 */
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

/**
 * @swagger
 * /api/cabinet/documents/{id}:
 *   put:
 *     summary: Обновление документа
 *     description: Обновляет информацию о документе по его ID.
 *     tags:
 *       - Documents
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Идентификатор документа
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               documentName:
 *                 type: string
 *               files:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *               nameDoc_Key:
 *                 type: string
 *                 description: Ключ документа
 *     responses:
 *       200:
 *         description: Документ успешно обновлен
 *       400:
 *         description: Нет нужных полей или неверный ID
 *       500:
 *         description: Ошибка при обновлении документа
 */
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

module.exports = router;
