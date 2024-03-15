const { default: axios } = require('axios');
const express = require('express');
const { check, validationResult, checkSchema,body } = require("express-validator");
const getFias = express.Router();
const url = "http://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address";

const token = process.env.DADATA_TOKEN



getFias.get('/',
   body('searchString').notEmpty(),

    async (req, res) => {
        // Проверка-------------------------
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.json({ status: "error", message: "Пустое поле поиска" })
        }
        // -------------------------
        const { searchString } = req.body
        const options = {
            mode: "cors",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": "Token " + token
            },
        }
        axios.post(url, { query: searchString }, options)
            .then(result => {
                console.log(result.data)
                res.json({ status: "ok", data: result.data.suggestions })
            })
            .catch(error => {
                console.log("error", error)
                res.json({ status: "error", message: "ошибка получения ФИАС" })
            });
    })

module.exports = getFias;