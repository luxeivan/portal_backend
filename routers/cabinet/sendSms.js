const { default: axios } = require('axios');
const express = require('express');
const sendSms = express.Router();
const { query,validationResult } = require("express-validator");

const authMegafon = process.env.AUTH_MEGAFON_SMS

sendSms.get('/',
    query('to').notEmpty(),
    query('sms').notEmpty(),
    async function (req, res) {
         // Проверка-------------------------
         const result = validationResult(req);
         if (!result.isEmpty()) {
             return res.json({ status: "error", message: "Нехватает нужных полей" })
         }
         // -------------------------
        const userId = req.userId
        try {
            console.log(req.query)
            const response = await axios.post('https://a2p-api.megalabs.ru/sms/v1/sms', {
                from: "M-OBLENERGO",
                to: req.query.to,
                sms: req.query.sms,
            }, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": authMegafon
                },
            })
            console.log(response.data)
            res.json({ status: "ок", message: "СМС отправлена" }); // Set disposition and send it.
        } catch (error) {
            console.log(error)
            res.json({ status: "error", message: "Ошибка отправки СМС" });
        }
    })

module.exports = sendSms;