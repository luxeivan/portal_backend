const express = require("express");
const router = express.Router();
const {
  getServicesByKey,
  getServiceItemByKey,
  getServicesAll
} = require("../services/onec/services");
const logger = require("../logger");

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: Список всех услуг
 *     tags: ["🌐 Services"]
 *     responses:
 *       200:
 *         description: Услуги найдены
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { type: object }
 *       500: { description: Ошибка при получении услуг }
 */

router.get("/", async (req, res) => {
  try {
    const services = await getServicesByKey();
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
 * /api/services/all:
 *   get:
 *     summary: Список структуры всех услуг
 *     tags: ["🌐 Services"]
 *     responses:
 *       200:
 *         description: Услуги найдены
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { type: object }
 *       500: { description: Ошибка при получении услуг }
 */

router.get("/all", async (req, res) => {
  try {
    const services = await getServicesAll();
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
 *     summary: Услуги по ключу
 *     tags: ["🌐 Services"]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema: { type: string }
 *         description: GUID или символьный ключ услуги
 *     responses:
 *       200: { description: Услуга найдена }
 *       500: { description: Ошибка при получении услуги }
 */

router.get("/:key", async (req, res) => {
  try {
    const key = encodeURIComponent(req.params.key);
    const services = await getServicesByKey(key);
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
 *     summary: Детали конкретной услуги
 *     tags: ["🌐 Services"]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: withFields
 *         schema:
 *           type: boolean
 *         description: Вернуть расширенные поля (true / false)
 *     responses:
 *       200: { description: Элемент услуги найден }
 *       500: { description: Ошибка при получении элемента услуги }
 */

router.get("/item/:key", async (req, res) => {
  try {
    const key = encodeURIComponent(req.params.key);
    let withFields = req.query.withFields;
    if (withFields === "false") withFields = false;
    if (withFields === "true") withFields = true;

    const services = await getServiceItemByKey(key, withFields);
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
