const express = require("express");
const { getVersion } = require("../services/onec/version");
const router = express.Router();
const logger = require("../logger");


router.get("/", async (req, res) => {
  // logger.info("Получен запрос на получение списка услуг");

  try {
    const version = await getVersion();
    // logger.info("Услуги успешно получены");
    console.log("version", version);
    if (version) {
      res.json(version);
    } else {
      throw new Error("Ошибка получения версии");
    }
  } catch (error) {
    logger.error(`Ошибка при получении версии: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: "Ошибка при получении версии",
      error: error.message,
    });
  }
});

module.exports = router;