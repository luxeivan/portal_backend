const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { pool } = require("./db"); // Подключение к базе данных

const pathFileStorage = process.env.PATH_FILESTORAGE;
const maxSizeFile = 10; // Максимальный размер файла в мегабайтах

router.post("/", async function (req, res) {
  const uuid = uuidv4();
  const token = req.headers["authorization"].split(" ")[1];
  let userId;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.id; // Извлекаем ID пользователя из токена
  } catch (error) {
    return res
      .status(401)
      .json({ status: "error", message: "Невалидный токен" });
  }

  const dirName = `${pathFileStorage}/${userId}`;

  if (!req.files || Object.keys(req.files).length === 0) {
    return res
      .status(400)
      .json({
        status: "error",
        message: "Нет файлов для загрузки",
        files: req.files,
      });
  }

  let bigFile = false;
  Object.keys(req.files).map((item) => {
    if (req.files[item].size > maxSizeFile * 1024 * 1024) {
      bigFile = true;
    }
  });

  if (bigFile) {
    return res
      .status(400)
      .json({ status: "error", message: "Файлы больше 10МБ не принимаются" });
  }

  try {
    await fs.promises.access(dirName);
  } catch (err) {
    if (err && err.code === "ENOENT") {
      try {
        await fs.promises.mkdir(dirName);
      } catch (error) {
        console.log(error);
        return res
          .status(500)
          .json({ status: "error", message: "Ошибка при записи файлов" });
      }
    }
  }

  const arrayWriteFile = Object.keys(req.files).map((item) => {
    return new Promise(function (resolve, reject) {
      const filename = `${item}_${uuid}.${req.files[item].name.slice(
        req.files[item].name.lastIndexOf(".") + 1
      )}`;
      req.files[item].mv(`${dirName}/${filename}`, function (err) {
        if (err)
          reject({
            status: "error",
            message: "Ошибка при записи файлов",
            error,
          });
        resolve(`${filename}`);
      });
    });
  });

  Promise.all(arrayWriteFile)
    .then(async (responses) => {
      try {
        // Сохраняем информацию о документах в базе данных
        const insertQuery =
          "INSERT INTO documents (user_id, document_name, file_path) VALUES ($1, $2, $3)";
        const promises = responses.map((file) => {
          const documentName = req.body.documentName || "Неизвестно";
          const filePath = `${dirName}/${file}`;
          return pool.query(insertQuery, [userId, documentName, filePath]);
        });

        await Promise.all(promises);
        return res.json({ status: "ok", files: responses });
      } catch (error) {
        console.error(error);
        return res
          .status(500)
          .json({
            status: "error",
            message:
              "Ошибка при сохранении информации о документах в базе данных",
          });
      }
    })
    .catch((error) => {
      console.error(error);
      return res
        .status(500)
        .json({ status: "error", message: "Ошибка при записи файлов" });
    });
});

module.exports = router;
