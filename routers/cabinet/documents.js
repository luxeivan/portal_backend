// /src/pages/Cabinet/Documents/Documents.js

import React, { useEffect } from "react";
import { Typography, Card, Button, Modal } from "antd";
import AppHelmet from "../../../components/Global/AppHelmet";
import {
  PlusOutlined,
  FilePdfOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import SceletonCard from "../../../components/SceletonCard";
import useDocuments from "../../../stores/Cabinet/useDocuments";
import axios from "axios";

const { Title, Text } = Typography;

const Documents = () => {
  const documents = useDocuments((state) => state.documents);
  const loadingDocuments = useDocuments((state) => state.loadingDocuments);
  const setOpenModalAdd = useDocuments((state) => state.setOpenModalAdd);
  const fetchDocuments = useDocuments((state) => state.fetchDocuments);
  const deleteDocument = useDocuments((state) => state.deleteDocument);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const openDocument = (document) => {
    const backServer = process.env.REACT_APP_BACK_BACK_SERVER;
    const fileUrl = `${backServer}/api/cabinet/get-file/${document.Ref_Key}`;

    const newWindow = window.open("", "_blank");

    axios
      .get(fileUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
        responseType: "blob",
        withCredentials: true,
      })
      .then((response) => {
        const file = new Blob([response.data], { type: "application/pdf" });
        const fileURL = URL.createObjectURL(file);
        newWindow.location.href = fileURL;
      })
      .catch((error) => {
        console.error("Ошибка при открытии документа:", error);
        newWindow.document.write("<p>Не удалось загрузить документ.</p>");
      });
  };

  const confirmDelete = (id) => {
    Modal.confirm({
      title: "Вы уверены, что хотите удалить этот документ?",
      okText: "Да",
      okType: "danger",
      cancelText: "Отмена",
      onOk() {
        deleteDocument(id);
      },
    });
  };

  return (
    <div>
      <AppHelmet title={"Документы"} desc={"Документы"} />
      <Title level={1}>Документы</Title>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
        {loadingDocuments && <SceletonCard />}
        {documents &&
          documents.map((document, index) => {
            return (
              <Card
                key={index}
                hoverable
                style={{
                  width: 250,
                  height: 250,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center",
                  position: "relative",
                }}
                onClick={() => {
                  console.log(
                    "Открываем документ с Ref_Key:",
                    document.Ref_Key
                  );
                  openDocument(document);
                }}
              >
                <Button
                  type="primary"
                  shape="circle"
                  icon={<DeleteOutlined />}
                  size="small"
                  style={{ position: "absolute", top: 10, right: 10 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmDelete(document.Ref_Key);
                  }}
                />
                <Text type="secondary" style={{ fontSize: "16px" }}>
                  Категория: {document.ВидФайла}
                </Text>
                <Title level={4} style={{ margin: "8px 0" }}>
                  {document.Description}
                </Title>
                <div style={{ margin: "8px 0" }}>
                  <FilePdfOutlined
                    style={{ fontSize: "48px", color: "#e37020" }}
                  />
                </div>
                <Text type="secondary">
                  Размер файла: {Math.round(document.Размер / 1024)} КБ
                </Text>
              </Card>
            );
          })}
        <Card
          hoverable
          style={{
            width: 250,
            height: 250,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setOpenModalAdd(true)}
        >
          <PlusOutlined style={{ fontSize: "24px" }} />
        </Card>
      </div>
    </div>
  );
};

export default Documents;

// const express = require("express");
// const jwt = require("jsonwebtoken");
// const router = express.Router();
// const axios = require("axios");
// const path = require("path");
// const fs = require("fs");
// const { v4: uuidv4 } = require("uuid");

// const logger = require("../../logger");

// const pathFileStorage = process.env.PATH_FILESTORAGE;
// const maxSizeFile = 10;

// const documentsStore = {};

// const SERVER_1C = process.env.SERVER_1C;
// const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;
// const headers = {
//   Authorization: server1c_auth,
//   "Content-Type": "application/json",
// };

// /**
//  * @swagger
//  * tags:
//  *   - name: Documents
//  *     description: Маршруты для работы с документами профиля пользователя
//  */

// // Новый маршрут для получения категорий документов из 1С
// router.get("/categories", async function (req, res) {
//   try {
//     // Шаг 2: Получение категорий документов из 1С
//     const response = await axios.get(
//       `${SERVER_1C}/Catalog_services_categoriesFiles/?$format=json&$select=**&$filter=Ref_Key%20eq%20guid'6739b454-176f-11ef-94f0-5ef3fcb042f8'&$expand=category`,
//       { headers }
//     );

//     const categoriesData = response.data.value;
//     console.log("Получены категории документов из 1С:", categoriesData); // Выводим категории документов

//     res.json({
//       status: "ok",
//       categories: categoriesData,
//     });
//   } catch (error) {
//     console.error("Ошибка при получении категорий документов из 1С:", error);
//     res.status(500).json({
//       status: "error",
//       message: "Ошибка при получении категорий документов",
//     });
//   }
// });

// /**
//  * @swagger
//  * tags:
//  *   - name: Documents
//  *     description: Маршруты для работы с документами профиля пользователя
//  */

// /**
//  * @swagger
//  * /api/cabinet/documents:
//  *   post:
//  *     summary: Сохранение документа
//  *     description: Сохраняет новый документ в системе.
//  *     tags:
//  *       - Documents
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               documentName:
//  *                 type: string
//  *               files:
//  *                 type: array
//  *                 items:
//  *                   type: object
//  *                   properties:
//  *                     name:
//  *                       type: string
//  *                       description: Имя файла
//  *               nameDoc_Key:
//  *                 type: string
//  *                 description: Ключ документа
//  *     responses:
//  *       200:
//  *         description: Документ успешно сохранен
//  *       400:
//  *         description: Нет нужных полей
//  *       500:
//  *         description: Ошибка при сохранении документа
//  */

// router.post("/", async function (req, res) {
//   try {
//     const userId = req.userId;
//     const { documentName, files, category } = req.body;

//     if (!documentName || !files) {
//       console.error(
//         `Отсутствуют необходимые поля в запросе от пользователя с id: ${userId}`
//       );
//       return res.status(400).json({
//         status: "error",
//         message: "Нет нужных полей",
//       });
//     }

//     // Создаём объект документа
//     const document = {
//       id: uuidv4(), // Уникальный идентификатор документа
//       documentName,
//       category,
//       files, // Массив файлов { name }
//     };

//     // Сохраняем документ в хранилище
//     if (!documentsStore[userId]) {
//       documentsStore[userId] = [];
//     }
//     documentsStore[userId].push(document);

//     // Возвращаем успешный ответ
//     res.json({
//       status: "ok",
//       message: "Документ успешно сохранен",
//       data: document,
//     });
//   } catch (error) {
//     console.error("Ошибка при сохранении документа:", error);
//     res.status(500).json({
//       status: "error",
//       message: "Ошибка при сохранении документа",
//     });
//   }
// });

// router.get("/", async function (req, res) {
//   const userId = req.userId;

//   try {
//     const requestUrl = `${SERVER_1C}/InformationRegister_connectionsOfElements?$format=json&$filter=element2 eq cast(guid'${userId}', 'Catalog_profile') and usage eq true and element1_Type eq 'StandardODATA.Catalog_profileПрисоединенныеФайлы'&$expand=element1`;

//     const response = await axios.get(requestUrl, { headers });

//     const connections = response.data.value;

//     if (!connections || connections.length === 0) {
//       return res.json({
//         status: "ok",
//         documents: [],
//       });
//     }

//     const documents = connections.map(
//       (connection) => connection.element1_Expanded
//     );

//     return res.json({
//       status: "ok",
//       documents: documents,
//     });
//   } catch (error) {
//     console.error(`Ошибка при получении документов из 1С: ${error.message}`);
//     return res.status(500).json({
//       status: "error",
//       message: "Ошибка при получении документов",
//     });
//   }
// });

// // /**
// //  * @swagger
// //  * /api/cabinet/documents:
// //  *   get:
// //  *     summary: Получение документов
// //  *     description: Получает список всех документов пользователя.
// //  *     tags:
// //  *       - Documents
// //  *     responses:
// //  *       200:
// //  *         description: Список документов успешно получен
// //  *       404:
// //  *         description: Нет данных
// //  *       500:
// //  *         description: Ошибка при получении данных
// //  */

// // router.get("/", async function (req, res) {
// //   const userId = req.userId;

// //   try {
// //     // Получаем документы пользователя из хранилища
// //     const userDocuments = documentsStore[userId] || [];

// //     return res.json({
// //       status: "ok",
// //       documents: userDocuments,
// //     });
// //   } catch (error) {
// //     console.error(
// //       `Ошибка при получении документов для пользователя с id: ${userId}. Ошибка: ${error.message}`
// //     );
// //     return res.status(500).json({
// //       status: "error",
// //       message: "Ошибка при получении документов",
// //     });
// //   }
// // });

// /**
//  * @swagger
//  * /api/cabinet/documents/getNameDocs:
//  *   get:
//  *     summary: Получение наименований документов профиля
//  *     description: Получает наименования документов профиля.
//  *     tags:
//  *       - Documents
//  *     responses:
//  *       200:
//  *         description: Наименования документов успешно получены
//  *       404:
//  *         description: Нет данных
//  *       500:
//  *         description: Ошибка при получении данных
//  */
// router.get("/getNameDocs", async function (req, res) {
//   logger.info("Получен запрос на получение наименований документов профиля");

//   try {
//     const response = await axios.get(
//       `${server1C}/ChartOfCharacteristicTypes_НаименованиеДокументовПрофиля?$format=json`
//     );

//     if (response.data) {
//       // logger.info("Наименования документов профиля успешно получены");
//       return res.json({
//         status: "ok",
//         nameDocs: response.data.value,
//       });
//     } else {
//       logger.warn("Нет данных по наименованиям документов профиля");
//       return res.status(404).json({
//         status: "error",
//         message: "Нет данных по наименованиям документов профиля",
//       });
//     }
//   } catch (error) {
//     logger.error(
//       `Ошибка при получении наименований документов из 1С. Ошибка: ${error.message}`
//     );
//     return res.status(500).json({
//       status: "error",
//       message: "Ошибка при получении данных из 1С",
//     });
//   }
// });

// /**
//  * @swagger
//  * /api/cabinet/documents/{id}:
//  *   get:
//  *     summary: Получение документа по ID
//  *     description: Получает информацию о документе по его ID.
//  *     tags:
//  *       - Documents
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: Идентификатор документа
//  *     responses:
//  *       200:
//  *         description: Документ успешно получен
//  *       400:
//  *         description: Не верный ID документа
//  *       404:
//  *         description: Документ не найден
//  *       500:
//  *         description: Ошибка при получении данных
//  */
// router.get("/:id", async function (req, res) {
//   const userId = req.userId;
//   const idDocument = req.params.id;

//   // logger.info(`Получен запрос на получение документа с id: ${idDocument}`);

//   try {
//     const response = await axios.get(
//       `${server1C}/Catalog_DocumentsOfProfiles(guid'${idDocument}')?$format=json`
//     );

//     if (response.data) {
//       if (response.data.profile === userId) {
//         // logger.info(
//         //   `Документ с id: ${idDocument} успешно получен для пользователя: ${userId}`
//         // );
//         return res.json({
//           status: "ok",
//           document: response.data,
//         });
//       } else {
//         logger.warn(
//           `Документ с id: ${idDocument} не принадлежит пользователю: ${userId}`
//         );
//         return res.status(400).json({
//           status: "error",
//           message: "Не верный id документа",
//         });
//       }
//     } else {
//       logger.warn(`Документ с id: ${idDocument} не найден`);
//       return res.status(404).json({
//         status: "error",
//         message: "Документ не найден",
//       });
//     }
//   } catch (error) {
//     logger.error(
//       `Ошибка при получении данных из 1С для документа с id: ${idDocument}. Ошибка: ${error.message}`
//     );
//     return res.status(500).json({
//       status: "error",
//       message: "Ошибка при получении данных из 1С",
//     });
//   }
// });

// /**
//  * @swagger
//  * /api/cabinet/documents/{id}:
//  *   put:
//  *     summary: Обновление документа
//  *     description: Обновляет информацию о документе по его ID.
//  *     tags:
//  *       - Documents
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: Идентификатор документа
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               documentName:
//  *                 type: string
//  *               files:
//  *                 type: array
//  *                 items:
//  *                   type: object
//  *                   properties:
//  *                     name:
//  *                       type: string
//  *               nameDoc_Key:
//  *                 type: string
//  *                 description: Ключ документа
//  *     responses:
//  *       200:
//  *         description: Документ успешно обновлен
//  *       400:
//  *         description: Нет нужных полей или неверный ID
//  *       500:
//  *         description: Ошибка при обновлении документа
//  */
// router.put("/:id", async function (req, res) {
//   const userId = req.userId;
//   const idDocument = req.params.id;
//   const { documentName, files, nameDoc_Key } = req.body;

//   // logger.info(
//   //   `Получен запрос на обновление документа с id: ${idDocument} от пользователя: ${userId}`
//   // );

//   if (!documentName && !files) {
//     logger.warn(
//       `Не указаны необходимые поля для обновления документа с id: ${idDocument}`
//     );
//     return res.status(400).json({
//       status: "error",
//       message: "Нет нужных полей",
//     });
//   }

//   const filesData = files.map((file, index) => ({
//     LineNumber: index + 1,
//     fileName: file.name,
//     fileType: file.name.split(".").pop(),
//     fileSize: "1000",
//   }));

//   const payload = {
//     Description: documentName,
//     profile: userId,
//     files: filesData,
//     nameDoc_Key,
//   };

//   try {
//     const object = await getObjectItem(idDocument);
//     if (object.attributes.profil.data.id !== userId) {
//       logger.warn(
//         `Документ с id: ${idDocument} не принадлежит пользователю: ${userId}`
//       );
//       return res.status(400).json({
//         status: "error",
//         message: "Неверный id объекта",
//       });
//     }

//     const response = await axios.patch(
//       `${server1C}/Catalog_DocumentsOfProfiles(guid'${idDocument}')?$format=json`,
//       payload,
//       {
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );
//     if (response.data) {
//       logger.info(
//         `Документ с id: ${idDocument} успешно обновлен для пользователя: ${userId}`
//       );
//       res.json({
//         status: "ok",
//         message: "Документ успешно обновлен",
//         data: response.data,
//       });
//     }
//   } catch (error) {
//     logger.error(
//       `Ошибка при обновлении данных в 1С для документа с id: ${idDocument}. Ошибка: ${error.message}`
//     );
//     res.status(500).json({
//       status: "error",
//       message: "Ошибка при обновлении данных в 1С",
//     });
//   }
// });

// router.delete("/:id", async function (req, res) {
//   const userId = req.userId;
//   const fileId = req.params.id;

//   try {
//     const connectionResponse = await axios.get(
//       `${SERVER_1C}/InformationRegister_connectionsOfElements?$format=json&$filter=element1 eq cast(guid'${fileId}', 'Catalog_profileПрисоединенныеФайлы') and element2 eq cast(guid'${userId}', 'Catalog_profile') and usage eq true`,
//       { headers }
//     );

//     const connections = connectionResponse.data.value;

//     if (!connections || connections.length === 0) {
//       return res.status(403).json({
//         status: "error",
//         message: "У вас нет доступа к этому документу",
//       });
//     }

//     const connectionEntry = connections[0];
//     const updatePayload = {
//       Period: moment().format(),
//       usage: false,
//       element1: connectionEntry.element1,
//       element1_Type: connectionEntry.element1_Type,
//       element2: connectionEntry.element2,
//       element2_Type: connectionEntry.element2_Type,
//       reason: "Удаление документа из профиля пользователя",
//     };

//     await axios.patch(
//       `${SERVER_1C}/InformationRegister_connectionsOfElements(Period=datetime'${encodeURIComponent(
//         connectionEntry.Period
//       )}',Recorder=@Unavailable)`,
//       updatePayload,
//       { headers }
//     );

//     await axios.delete(
//       `${SERVER_1C}/Catalog_profileПрисоединенныеФайлы(guid'${fileId}')`,
//       { headers }
//     );

//     res.json({
//       status: "ok",
//       message: "Документ успешно удален",
//     });
//   } catch (error) {
//     console.error(`Ошибка при удалении документа: ${error.message}`);
//     res.status(500).json({
//       status: "error",
//       message: "Ошибка при удалении документа",
//     });
//   }
// });

// module.exports = router;
