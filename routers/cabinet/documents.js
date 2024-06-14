const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const pathFileStorage = process.env.PATH_FILESTORAGE;
const maxSizeFile = 10;

const server1C = "http://45.89.189.5/InfoBase/odata/standard.odata";

router.post("/", async function (req, res) {
  const userId = req.userId;
  const { documentName, files, nameDoc_Key } = req.body;

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
    nameDoc_Key,
  };

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
  const userId = req.userId;

  try {
    const response = await axios.get(
      `${server1C}/Catalog_DocumentsOfProfiles?$format=json&$filter=(profile eq '${userId}') and (DeletionMark eq false)`
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

router.get("/getNameDocs", async function (req, res) {
  try {
    const response = await axios.get(
      `${server1C}/ChartOfCharacteristicTypes_НаименованиеДокументовПрофиля?$format=json`
    );
    console.log(response.data);
    if (response.data) {
      res.json({
        status: "ok",
        nameDocs: response.data.value,
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

router.get("/:id", async function (req, res) {
  const userId = req.userId;
  const idDocument = req.params.id;
  try {
    const response = await axios.get(
      `${server1C}/Catalog_DocumentsOfProfiles(guid'${idDocument}')?$format=json`
    );
    console.log(response.data);
    if (response.data) {
      if (response.data.profile === userId) {
        res.json({
          status: "ok",
          document: response.data,
        });
      } else {
        res.status(400).json({
          status: "error",
          message: "Не верный id документа",
        });
      }
    }
  } catch (error) {
    console.error("Ошибка при получении данных из 1С", error);
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
    nameDoc_Key
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
      res.json({
        status: "ok",
        message: "Документ успешно обновлен",
        data: response.data,
      });
    }
  } catch (error) {
    console.error("Ошибка при обновлении данных в 1С", error);
    res.status(500).json({
      status: "error",
      message: "Ошибка при обновлении данных в 1С",
    });
  }
});


module.exports = router;
