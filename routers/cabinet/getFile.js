const express = require("express");
const router = express.Router();

const pathFileStorage = process.env.PATH_FILESTORAGE;

const logger = require("../../logger");

router.get("/:filename", async function (req, res) {
  const userId = req.userId;
  const dirName = `${pathFileStorage}/${userId}`;
  const file = `${dirName}/${req.params.filename}`;
  // logger.info(
  //   `Получен запрос на скачивание файла ${req.params.filename} для пользователя с id: ${userId}`
  // );

  try {
    res.download(file, (err) => {
      if (err) {
        logger.error(
          `Ошибка при скачивании файла ${req.params.filename} для пользователя с id: ${userId}. Ошибка: ${err.message}`
        );
        res
          .status(500)
          .json({ message: "Внутренняя ошибка сервера при скачивании файла" });
      } else {
        // logger.info(
        //   `Файл ${req.params.filename} успешно скачан для пользователя с id: ${userId}`
        // );
      }
    });
  } catch (error) {
    logger.error(
      `Ошибка при скачивании файла ${req.params.filename} для пользователя с id: ${userId}. Ошибка: ${error.message}`
    );
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
});

module.exports = router;
