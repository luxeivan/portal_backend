const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

const logger = require("../../logger");

const {
  addObject,
  getObjects,
  getObjectItem,
  deleteObjectItem,
  updateObjectItem,
} = require("../../services/strapi/strapiObjects");

/**
 * @swagger
 * tags:
 *   - name: Objects (ПОКА НЕ ИСПОЛЬЗУЕМ)
 *     description: Маршруты для управления объектами пользователей
 */

// Маршрут для добавления нового объекта
/**
 * @swagger
 * /api/cabinet/objects:
 *   post:
 *     summary: Добавление нового объекта
 *     description: Добавляет новый объект для пользователя.
 *     tags:
 *       - Objects (ПОКА НЕ ИСПОЛЬЗУЕМ)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Объект успешно добавлен
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.post("/", async (req, res) => {
  try {
    const userId = req.userId;
    const { body } = req;
    // logger.info(
    //   `Получены данные для добавления объекта от пользователя с id: ${userId}. Данные: ${JSON.stringify(
    //     body
    //   )}`
    // );
    const object = await addObject(body, userId);
    res.status(201).json(object);
    logger.info(`Объект успешно добавлен для пользователя с id: ${userId}`);
  } catch (error) {
    logger.error(
      `Ошибка при добавлении объекта для пользователя с id: ${userId}. Ошибка: ${error.message}`
    );
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
});

// Маршрут для получения списка объектов пользователя
/**
 * @swagger
 * /api/cabinet/objects:
 *   get:
 *     summary: Получение списка объектов пользователя
 *     description: Возвращает список всех объектов, принадлежащих пользователю.
 *     tags:
 *       - Objects (ПОКА НЕ ИСПОЛЬЗУЕМ)
 *     responses:
 *       200:
 *         description: Список объектов успешно получен
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.get("/", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader.split(" ")[1];
    const userData = jwt.verify(accessToken, process.env.JWT_SECRET);
    // logger.info(
    //   `Получен запрос на получение объектов для пользователя с id: ${userData.id}`
    // );
    const objects = await getObjects(userData.id);
    res.json(objects);
    // logger.info(
    //   `Объекты успешно получены для пользователя с id: ${userData.id}`
    // );
  } catch (error) {
    logger.error(
      `Ошибка при получении объектов для пользователя. Ошибка: ${error.message}`
    );
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
});

// Маршрут для получения одного объекта
/**
 * @swagger
 * /api/cabinet/objects/{id}:
 *   get:
 *     summary: Получение одного объекта по ID
 *     description: Возвращает информацию об объекте по его ID.
 *     tags:
 *       - Objects (ПОКА НЕ ИСПОЛЬЗУЕМ)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Идентификатор объекта
 *     responses:
 *       200:
 *         description: Объект успешно получен
 *       404:
 *         description: Объект не найден
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.get("/:id", async (req, res) => {
  try {
    const userId = req.userId;
    const idObject = req.params.id;
    // logger.info(
    //   `Получен запрос на получение объекта с id: ${idObject} для пользователя с id: ${userId}`
    // );
    const object = await getObjectItem(idObject);
    if (object.attributes.profil.data.id === userId) {
      object.attributes.profil = undefined;
      res.json(object);
      // logger.info(
      //   `Объект с id: ${idObject} успешно получен для пользователя с id: ${userId}`
      // );
    } else {
      logger.warn(
        `Объект с id: ${idObject} не найден для пользователя с id: ${userId}`
      );
      res
        .status(404)
        .json({ status: "error", message: "объект с данным id не найден" });
    }
  } catch (error) {
    logger.error(
      `Ошибка при получении объекта с id: ${idObject}. Ошибка: ${error.message}`
    );
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
});

/**
 * @swagger
 * /api/cabinet/objects/{id}:
 *   delete:
 *     summary: Удаление объекта по ID
 *     description: Удаляет объект по его ID.
 *     tags:
 *       - Objects (ПОКА НЕ ИСПОЛЬЗУЕМ)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Идентификатор объекта
 *     responses:
 *       200:
 *         description: Объект успешно удален
 *       400:
 *         description: Неверный ID объекта
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.userId;
    const idObject = req.params.id;
    // logger.info(
    //   `Получен запрос на удаление объекта с id: ${idObject} для пользователя с id: ${userId}`
    // );
    const object = await getObjectItem(idObject);
    if (object.attributes.profil.data.id === userId) {
      const statusDel = await deleteObjectItem(idObject);
      logger.info(
        `Объект с id: ${idObject} и именем ${statusDel.attributes.name} успешно удален для пользователя с id: ${userId}`
      );
      res.json({
        status: "ok",
        message: `Объект ${statusDel.attributes.name} удален`,
      });
    } else {
      logger.warn(
        `Попытка удаления объекта с неверным id: ${idObject} для пользователя с id: ${userId}`
      );
      res.status(400).json({ status: "error", message: "Неверный id объекта" });
    }
  } catch (error) {
    logger.error(
      `Ошибка удаления объекта с id: ${idObject}. Ошибка: ${error.message}`
    );
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
});

/**
 * @swagger
 * /api/cabinet/objects/{id}:
 *   put:
 *     summary: Обновление объекта по ID
 *     description: Обновляет информацию об объекте по его ID.
 *     tags:
 *       - Objects (ПОКА НЕ ИСПОЛЬЗУЕМ)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Идентификатор объекта
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Объект успешно обновлен
 *       400:
 *         description: Неверный ID объекта
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.put("/:id", async (req, res) => {
  try {
    const userId = req.userId;
    const idObject = req.params.id;
    const { body } = req;
    logger.info(
      `Получен запрос на обновление объекта с id: ${idObject} для пользователя с id: ${userId}`
    );
    const object = await getObjectItem(idObject);
    if (object.attributes.profil.data.id === userId) {
      const updatedObject = await updateObjectItem(idObject, body);
      logger.info(
        `Объект с id: ${idObject} успешно обновлен для пользователя с id: ${userId}`
      );
      res.json(updatedObject);
    } else {
      logger.warn(
        `Попытка обновления объекта с неверным id: ${idObject} для пользователя с id: ${userId}`
      );
      res.status(400).json({ status: "error", message: "Неверный id объекта" });
    }
  } catch (error) {
    logger.error(
      `Ошибка обновления объекта с id: ${idObject}. Ошибка: ${error.message}`
    );
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
});

module.exports = router;
