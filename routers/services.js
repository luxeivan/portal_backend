const express = require("express");
const router = express.Router();
const {
  getServicesByKey,
  getServiceItemByKey,
} = require("../services/onec/services");
const logger = require("../logger");

/**
 * @swagger
 * tags:
 *   - name: Services
 *     description: Маршруты для получения информации об услугах и их элементах
 */

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: Получение списка услуг
 *     description: Возвращает список всех доступных услуг.
 *     tags:
 *       - Services
 *     responses:
 *       200:
 *         description: Успешное получение списка услуг
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       500:
 *         description: Ошибка при получении списка услуг
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Ошибка при получении услуг"
 *                 error:
 *                   type: string
 *                   example: "Описание ошибки"
 */

router.get("/", async (req, res) => {
  // logger.info("Получен запрос на получение списка услуг");

  try {
    const services = await getServicesByKey();
    // logger.info("Услуги успешно получены");
    console.log('services', services)
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

/**
 * @swagger
 * /api/services/{key}:
 *   get:
 *     summary: Получение услуги по ключу
 *     description: Возвращает данные услуги на основе предоставленного ключа.
 *     tags:
 *       - Services
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Ключ для получения услуги
 *     responses:
 *       200:
 *         description: Успешное получение услуги
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       500:
 *         description: Ошибка при получении услуги
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Ошибка при получении услуги"
 *                 error:
 *                   type: string
 *                   example: "Описание ошибки"
 */

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

/**
 * @swagger
 * /api/services/item/{key}:
 *   get:
 *     summary: Получение элемента услуги по ключу
 *     description: Возвращает данные элемента услуги на основе предоставленного ключа.
 *     tags:
 *       - Services
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Ключ для получения элемента услуги
 *     responses:
 *       200:
 *         description: Успешное получение элемента услуги
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       500:
 *         description: Ошибка при получении элемента услуги
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Ошибка при получении элемента услуги"
 *                 error:
 *                   type: string
 *                   example: "Описание ошибки"
 */

router.get("/item/:key", async (req, res) => {
  // logger.info(
  //   `Получен запрос на получение элемента услуги с ключом: ${req.params.key}`
  // );

  try {
    const key = req.params.key;
    let withFields = req.query.withFields;
    if (withFields === "false") withFields = false
    if (withFields === "true") withFields = true

    // console.log('withFields: ', withFields)
    const services = await getServiceItemByKey(key, withFields);
    // logger.info(`Элемент услуги с ключом ${key} успешно получен`);
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
