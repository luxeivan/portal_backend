const express = require("express");
const router = express.Router();
const { getGetFields } = require("../services/onec/formonec");
const logger = require("../logger");

router.get("/:key", async (req, res) => {
  try {
    const key = req.params.key;
    logger.info(`Запрос на получение полей с ключом: ${key}`); // Логируем информацию о запросе
    const fields = await getGetFields(key);
    res.json(fields);
  } catch (error) {
    logger.error("Ошибка при получении полей", { error: error.message }); // Логируем ошибку получения полей
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
