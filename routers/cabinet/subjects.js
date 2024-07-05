const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const {
  addSubject,
  getSubjects,
  getSubjectItem,
  deleteSubjectItem,
} = require("../../services/strapi/strapiSubjects");

const logger = require("../../logger");

// Маршрут для добавления нового субъекта
router.post("/", async (req, res) => {
  try {
    const userId = req.userId;
    const { body } = req;
    logger.info(`Запрос на добавление субъекта от пользователя: ${userId}`);
    const subject = await addSubject(body, userId); // Вызывает функцию для добавления субъекта
    res.status(201).json(subject);
    logger.info(`Субъект успешно добавлен для пользователя: ${userId}`);
  } catch (error) {
    logger.error(
      `Ошибка при добавлении субъекта для пользователя: ${userId}. Ошибка: ${error.message}`
    );
    res.status(500).json({ message: "Internal server error" });
  }
});

// Маршрут для получения списка субъектов пользователя
router.get("/", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader.split(" ")[1];
    const userData = jwt.verify(accessToken, process.env.JWT_SECRET);
    logger.info(
      `Запрос на получение субъектов для пользователя: ${userData.id}`
    );
    const subjects = await getSubjects(userData.id);
    res.json(subjects);
    logger.info(`Субъекты успешно получены для пользователя: ${userData.id}`);
  } catch (error) {
    logger.error(
      `Ошибка при получении субъектов для пользователя: ${
        userData?.id || "неизвестного"
      }. Ошибка: ${error.message}`
    );
    res.status(500).json({ message: "Internal server error" });
  }
});

// Маршрут для получения одного субъекта
router.get("/:id", async (req, res) => {
  try {
    const userId = req.userId;
    const idSubject = req.params.id;
    logger.info(
      `Запрос на получение субъекта с id: ${idSubject} для пользователя: ${userId}`
    );
    const subject = await getSubjectItem(idSubject);
    if (subject.attributes.profil.data.id === userId) {
      subject.attributes.profil = undefined;
      res.json(subject);
      logger.info(
        `Субъект с id: ${idSubject} успешно получен для пользователя: ${userId}`
      );
    } else {
      logger.warn(
        `Субъект с id: ${idSubject} не найден для пользователя: ${userId}`
      );
      res
        .status(404)
        .json({ status: "error", message: "субъект с данным id не найден" });
    }
  } catch (error) {
    logger.error(
      `Ошибка при получении субъекта с id: ${idSubject} для пользователя: ${userId}. Ошибка: ${error.message}`
    );
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const userId = req.userId;
    const idSubject = req.params.id;
    logger.info(
      `Запрос на удаление субъекта с id: ${idSubject} для пользователя: ${userId}`
    );
    const subject = await getSubjectItem(idSubject);
    console.log(subject.attributes.profil.data.id);
    if (subject.attributes.profil.data.id === userId) {
      const statusDel = await deleteSubjectItem(idSubject);
      res.json({
        status: "ok",
        message: `Субъект ${statusDel.attributes.name} удален`,
      });
      logger.info(
        `Субъект с id: ${idSubject} успешно удален для пользователя: ${userId}`
      );
    } else {
      logger.warn(
        `Попытка удаления субъекта с id: ${idSubject} для пользователя: ${userId} не удалась. Неверный id субъекта.`
      );
      res
        .status(400)
        .json({ status: "error", message: "Неверный id субъекта" });
    }
  } catch (error) {
    logger.error(
      `Ошибка при удалении субъекта с id: ${idSubject} для пользователя: ${userId}. Ошибка: ${error.message}`
    );
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
});

module.exports = router;
