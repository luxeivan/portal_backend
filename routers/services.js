const express = require("express");
const router = express.Router();
const {
  getServicesByKey,
  getServiceItemByKey,
} = require("../services/onec/services");
const logger = require("../logger");


router.get("/", async (req, res) => {
  // logger.info("Получен запрос на получение списка услуг");

  try {
    const services = await getServicesByKey();
    // logger.info("Услуги успешно получены");
    console.log("services", services);
    if (services) {
      res.json(services);
    } else {
      throw new Error("Ошибка получения данных с БД");
    }
  } catch (error) {
    logger.error(`Ошибка при получении услуг: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: "Ошибка при получении услуг",
      error: error.message,
    });
  }
});

router.get("/:key", async (req, res) => {
  // logger.info(`Получен запрос на получение услуги с ключом: ${req.params.key}`);

  try {
    const key = req.params.key;
    const services = await getServicesByKey(key);
    // logger.info(`Услуга с ключом ${key} успешно получена`);
    if (services) {
      res.json(services);
    } else {
      throw new Error("Ошибка получения данных с БД");
    }
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Ошибка при получении услуги",
      error: error.message,
    });
    logger.error(
      `Ошибка при получении услуги с ключом ${req.params.key}: ${error.message}`
    );
  }
});

router.get("/item/:key", async (req, res) => {
  // logger.info(
  //   `Получен запрос на получение элемента услуги с ключом: ${req.params.key}`
  // );

  try {
    const key = req.params.key;
    let withFields = req.query.withFields;
    if (withFields === "false") withFields = false;
    if (withFields === "true") withFields = true;

    // console.log('withFields: ', withFields)
    const services = await getServiceItemByKey(key, withFields);
    // logger.info(`Элемент услуги с ключом ${key} успешно получен`);
    // console.log('services: ', services)
    res.json(services);
  } catch (error) {
    logger.error(
      `Ошибка при получении элемента услуги с ключом ${req.params.key}: ${error.message}`
    );
    res.status(500).json({
      status: "error",
      message: "Ошибка при получении элемента услуги",
      error: error.message,
    });
  }
});

module.exports = router;
