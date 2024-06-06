const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const pathFileStorage = process.env.PATH_FILESTORAGE;
const maxSizeFile = 10; // Максимальный размер файла в мегабайтах

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

// router.post("/documents", async function (req, res) {
//   const { documentName, files } = req.body;
//   const token = req.headers["authorization"].split(" ")[1];
//   let userId;

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     userId = decoded.id; // Извлекаем ID пользователя из токена
//   } catch (error) {
//     return res
//       .status(401)
//       .json({ status: "error", message: "Невалидный токен" });
//   }

//   const filesData = files.map((file, index) => ({
//     LineNumber: index + 1,
//     fileName: file.name,
//     fileType: file.name.split(".").pop(),
//     fileSize: "1000", // Пример размера файла, используйте фактический размер
//   }));

//   const payload = {
//     Description: documentName,
//     profile: userId,
//     files: filesData,
//   };

//   try {
//     await axios.post(
//       "http://45.89.189.5/InfoBase/odata/standard.odata/Catalog_DocumentsOfProfiles?$format=json",
//       payload,
//       {
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );
//     res.json({ status: "ok", message: "Документ успешно сохранен" });
//   } catch (error) {
//     console.error("Ошибка при отправке данных в 1С", error);
//     res.status(500).json({
//       status: "error",
//       message: "Ошибка при отправке данных в 1С",
//     });
//   }
// });

router.post("/documents", async function (req, res) {
  const { documentName, files } = req.body;
  const token = req.headers["authorization"].split(" ")[1];
  let userId;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.id; 
  } catch (error) {
    return res
      .status(401)
      .json({ status: "error", message: "Невалидный токен" });
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
    await axios.post(
      "http://45.89.189.5/InfoBase/odata/standard.odata/Catalog_DocumentsOfProfiles?$format=json",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    res.json({ status: "ok", message: "Документ успешно сохранен" });
  } catch (error) {
    console.error("Ошибка при отправке данных в 1С", error);
    res.status(500).json({
      status: "error",
      message: "Ошибка при отправке данных в 1С",
    });
  }
});

module.exports = router;

// const express = require("express");
// const jwt = require("jsonwebtoken");
// const axios = require("axios");
// const router = express.Router();
// const path = require("path");
// const fs = require("fs");
// const { v4: uuidv4 } = require("uuid");

// const pathFileStorage = process.env.PATH_FILESTORAGE;
// const maxSizeFile = 10; // Максимальный размер файла в мегабайтах

// router.post("/", async function (req, res) {
//   const uuid = uuidv4();
//   const token = req.headers["authorization"].split(" ")[1];
//   let userId;

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     userId = decoded.id; // Извлекаем ID пользователя из токена
//   } catch (error) {
//     return res
//       .status(401)
//       .json({ status: "error", message: "Невалидный токен" });
//   }

//   const dirName = `${pathFileStorage}/${userId}`;

//   if (!req.files || Object.keys(req.files).length === 0) {
//     return res.status(400).json({
//       status: "error",
//       message: "Нет файлов для загрузки",
//       files: req.files,
//     });
//   }

//   let bigFile = false;
//   Object.keys(req.files).map((item) => {
//     if (req.files[item].size > maxSizeFile * 1024 * 1024) {
//       bigFile = true;
//     }
//   });

//   if (bigFile) {
//     return res
//       .status(400)
//       .json({ status: "error", message: "Файлы больше 10МБ не принимаются" });
//   }

//   try {
//     await fs.promises.access(dirName);
//   } catch (err) {
//     if (err && err.code === "ENOENT") {
//       try {
//         await fs.promises.mkdir(dirName);
//       } catch (error) {
//         console.log(error);
//         return res.status(500).json({
//           status: "error",
//           message: "Ошибка при создании директории для файлов",
//         });
//       }
//     }
//   }

//   const arrayWriteFile = Object.keys(req.files).map((item) => {
//     return new Promise(function (resolve, reject) {
//       const filename = `${item}_${uuid}.${req.files[item].name.slice(
//         req.files[item].name.lastIndexOf(".") + 1
//       )}`;
//       req.files[item].mv(`${dirName}/${filename}`, function (err) {
//         if (err)
//           reject({
//             status: "error",
//             message: "Ошибка при записи файлов",
//             error,
//           });
//         resolve({
//           filePath: `${dirName}/${filename}`,
//           originalName: req.files[item].name,
//           mimeType: req.files[item].mimetype,
//           size: req.files[item].size,
//         });
//       });
//     });
//   });

//   Promise.all(arrayWriteFile)
//     .then(async (responses) => {
//       // Формируем данные для отправки в 1С
//       const filesData = responses.map((file, index) => ({
//         LineNumber: index + 1,
//         fileName: file.originalName,
//         fileType: file.mimeType.split("/")[1],
//         fileSize: file.size.toString(),
//       }));

//       const payload = {
//         Description: req.body.documentName,
//         profile: userId,
//         files: filesData,
//       };

//       try {
//         // Отправка данных в 1С
//         await axios.post(
//           "http://45.89.189.5/InfoBase/odata/standard.odata/Catalog_DocumentsOfProfiles?$format=json",
//           payload,
//           {
//             headers: {
//               "Content-Type": "application/json",
//               Authorization: `Bearer ${token}`,
//             },
//           }
//         );

//         res.json({ status: "ok", files: responses });
//       } catch (error) {
//         console.error("Ошибка при отправке данных в 1С", error);
//         res.status(500).json({
//           status: "error",
//           message: "Ошибка при отправке данных в 1С",
//         });
//       }
//     })
//     .catch((error) => {
//       console.error(error);
//       return res
//         .status(500)
//         .json({ status: "error", message: "Ошибка при записи файлов" });
//     });
// });

// module.exports = router;
