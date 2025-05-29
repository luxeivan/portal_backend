const express = require("express");
const paySber = express.Router();
const { registerOrderSber } = require("../../services/servicesPaySber");

paySber.post("/", async (req, res) => {
  const { zakaz, amount } = req.body;
  if (!zakaz || !amount) return res.status(400).json({ status: "error" });

  try {
    const formUrl = await registerOrderSber(zakaz, amount);
    return res.json({ status: "ok", formUrl });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e.message });
  }
});

module.exports = paySber;
