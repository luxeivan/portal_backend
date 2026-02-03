const express = require("express");
const router = express.Router();
const logger = require("../../logger");
const { getPrice } = require("../../services/onec/otherServices");


router.get("/:type/:nomenclature", async (req, res) => {
    const userId = req.userId;
    const nomenclature = encodeURIComponent(req.params.nomenclature)
    const type = encodeURIComponent(req.params.type)
    // logger.info(
    //     `Получен запрос на получение цены номенклатуры от пользователя: ${userId}`
    // );

    try {
        const price = await getPrice(type, nomenclature)
        if (!price) res.json(false)
        res.json(price)
    } catch (error) {
        logger.error(
            `Ошибка при получения цены номенклатуры от пользователя ${userId}: ${error.message}`
        );
        res.status(500).json({
            status: "error",
            message: "Ошибка при получении заявок",
            error: error.message,
        });
    }
});



module.exports = router;