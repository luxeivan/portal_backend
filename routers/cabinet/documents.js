const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const pathFileStorage = process.env.PATH_FILESTORAGE;
const maxSizeFile = 10;

router.post("/upload", async function (req, res) {
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
    return res.status(400).json({
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
        return res.status(500).json({
          status: "error",
          message: "Ошибка при создании директории для файлов",
        });
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
        resolve({ filename, path: `${dirName}/${filename}` });
      });
    });
  });

  Promise.all(arrayWriteFile)
    .then(async (responses) => {
      res.json({ status: "ok", files: responses });
    })
    .catch((error) => {
      console.error(error);
      return res
        .status(500)
        .json({ status: "error", message: "Ошибка при записи файлов" });
    });
});

router.post("/", async function (req, res) {
  const userId = req.userId;
  const { documentName, files } = req.body;

  if (!documentName && !files) {
    res.status(400).json({
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
  };

  try {
    const response = await axios.post(
      "http://45.89.189.5/InfoBase/odata/standard.odata/Catalog_DocumentsOfProfiles?$format=json",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (response.data) {
      res.json({
        status: "ok",
        message: "Документ успешно сохранен",
        data: response.data,
      });
    }
  } catch (error) {
    console.error("Ошибка при отправке данных в 1С", error);
    res.status(500).json({
      status: "error",
      message: "Ошибка при отправке данных в 1С",
    });
  }
});

router.get("/", async function (req, res) {
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

  try {
    const response = await axios.get(
      `http://45.89.189.5/InfoBase/odata/standard.odata/Catalog_DocumentsOfProfiles?$format=json&$filter=profile eq '${userId}'`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data) {
      res.json({
        status: "ok",
        documents: response.data.value,
      });
    }
  } catch (error) {
    console.error("Ошибка при получении данных из 1С", error);
    res.status(500).json({
      status: "error",
      message: "Ошибка при получении данных из 1С",
    });
  }
});

module.exports = router;
