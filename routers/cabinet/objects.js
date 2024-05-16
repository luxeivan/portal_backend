const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

const {
  addObject,
  getObjects,
  getObjectItem,
  deleteObjectItem,
} = require("../../services/strapi/strapiObjects");

// Маршрут для добавления нового объекта
router.post("/", async (req, res) => {
  try {
    const userId = req.userId;
    const { body } = req;
    console.log("Received data:", body);
    const object = await addObject(body, userId);
    res.status(201).json(object);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Маршрут для получения списка объектов пользователя
router.get("/", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader.split(" ")[1];
    const userData = jwt.verify(accessToken, process.env.JWT_SECRET);
    //console.log(userData)
    const objects = await getObjects(userData.id);
    res.json(objects);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Маршрут для получения одного объекта
router.get("/:id", async (req, res) => {
  try {
    const userId = req.userId;
    const idObject = req.params.id;
    const object = await getObjectItem(idObject);
    if (object.attributes.profil.data.id === userId) {
      object.attributes.profil = undefined;
      res.json(object);
    } else {
      res
        .status(404)
        .json({ status: "error", message: "объект с данным id не найден" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const userId = req.userId;
    const idObject = req.params.id;
    const object = await getObjectItem(idObject);
    if (object.attributes.profil.data.id === userId) {
      const statusDel = await deleteObjectItem(idObject);
      res.json({
        status: "ok",
        message: `Объект ${statusDel.attributes.name} удален`,
      });
    } else {
      res.status(400).json({ status: "error", message: "Неверный id объекта" });
    }
  } catch (error) {
    console.error("Ошибка удаления объекта:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const userId = req.userId;
    const idObject = req.params.id;
    const { body } = req;
    const object = await getObjectItem(idObject);
    if (object.attributes.profil.data.id === userId) {
      const updatedObject = await updateObjectItem(idObject, body);
      res.json(updatedObject);
    } else {
      res.status(400).json({ status: "error", message: "Неверный id объекта" });
    }
  } catch (error) {
    console.error("Ошибка обновления объекта:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
