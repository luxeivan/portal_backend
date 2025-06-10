const express = require("express");
const router = express.Router();

//НИЧЕГО НЕ ЛОГИРОВАЛ, ПОТОМУ ЧТО ОТКАЗАЛИСЬ
const logger = require("../../logger");

const {
  getRelations,
  getRelationItem,
  deleteRelationItem,
} = require("../../services/strapi/strapiRelations");

// Маршрут для получения списка субъектов пользователя
router.get("/", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader.split(" ")[1];
    const userData = jwt.verify(accessToken, process.env.JWT_SECRET);
    //console.log(userData)
    const relations = await getRelations(userData.id);
    res.json(relation);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Маршрут для получения одного субъекта
router.get("/:id", async (req, res) => {
  try {
    const userId = req.userId;
    const idRelation = req.params.id;
    const relation = await getRelationItem(idRelation);
    if (relation.attributes.profil.data.id === userId) {
      relation.attributes.profil = undefined;
      res.json(relation);
    } else {
      res
        .status(404)
        .json({ status: "error", message: "Доверенности с данным id не найден" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
    try {
      const userId = req.userId;
      const idRelation = req.params.id;
      const relation = await getRelationItem(idRelation);
      console.log(relation.attributes.profil.data.id);
      if (relation.attributes.profil.data.id === userId) {
        const statusDel = await deleteRelationItem(idRelation);
        res.json({
          status: "ok",
          message: `Доверенность ${statusDel.attributes.name} удалена`,
        });
      } else {
        res
          .status(400)
          .json({ status: "error", message: "Неверный id доверенности" });
      }
    } catch (error) {
      //console.log(error.message)
      res.status(500).json({ message: "Internal server error" });
    }
  });

// ...код ...
module.exports = router;
