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

// Маршрут для добавления нового объекта
router.post("/", async (req, res) => {
  try {
    const userId = req.userId;
    const { body } = req;
    logger.info(
      `Получены данные для добавления объекта от пользователя с id: ${userId}. Данные: ${JSON.stringify(
        body
      )}`
    );
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
router.get("/", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader.split(" ")[1];
    const userData = jwt.verify(accessToken, process.env.JWT_SECRET);
    logger.info(
      `Получен запрос на получение объектов для пользователя с id: ${userData.id}`
    );
    const objects = await getObjects(userData.id);
    res.json(objects);
    logger.info(
      `Объекты успешно получены для пользователя с id: ${userData.id}`
    );
  } catch (error) {
    logger.error(
      `Ошибка при получении объектов для пользователя. Ошибка: ${error.message}`
    );
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
});

// Маршрут для получения одного объекта
router.get("/:id", async (req, res) => {
  try {
    const userId = req.userId;
    const idObject = req.params.id;
    logger.info(
      `Получен запрос на получение объекта с id: ${idObject} для пользователя с id: ${userId}`
    );
    const object = await getObjectItem(idObject);
    if (object.attributes.profil.data.id === userId) {
      object.attributes.profil = undefined;
      res.json(object);
      logger.info(
        `Объект с id: ${idObject} успешно получен для пользователя с id: ${userId}`
      );
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

router.delete("/:id", async (req, res) => {
  try {
    const userId = req.userId;
    const idObject = req.params.id;
    logger.info(
      `Получен запрос на удаление объекта с id: ${idObject} для пользователя с id: ${userId}`
    );
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
