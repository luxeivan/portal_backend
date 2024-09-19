// const axios = require("axios");
const express = require("express");
const sendMessageToGigachat = require("../services/gigaChat")
// const { validationResult, query } = require("express-validator");
const gigaChatRouter = express.Router();

gigaChatRouter.post('/', async (req, res) => {
    const message = req.body.message
    try {
        const answer = await sendMessageToGigachat(message)
        res.json({ status: "ОК", answer })
    } catch (error) {
        res.json({ status: "error", error: error.message })

    }
})

module.exports = gigaChatRouter;