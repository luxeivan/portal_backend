const express = require("express");
const jwt = require("jsonwebtoken");
const pay = express.Router();

const logger = require("../../logger");
const { requestPay } = require("../../services/servicesPay");

pay.post("/", async (req, res) => {
    const zakaz = req.body.zakaz
    const amount = req.body.amount
    if (zakaz && amount) {
        const formUrl = await requestPay(zakaz, amount)
        if (formUrl) {
            res.json({ status: "ok", formUrl: formUrl })
        } else {
            res.status(500).json({ status: "error" })
        }
    } else {
        res.status(400).json({ status: "error" })
    }
});

module.exports = pay;
