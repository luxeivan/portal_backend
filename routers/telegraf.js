const express = require("express");
const { Telegram } = require("telegraf");
const router = express.Router();

const telegram = new Telegram("7221312469:AAHpG-K9hCN_U2hsgYPF8kM6387ajRnwRkY");

router.post("/", async (req, res) => {
  res.json(req.body);
});

router.post("/send", async (req, res) => {
  const arnoldSchwarzenegger = await telegram.sendMessage(
    "630763354",
    "Напиши любой текст, даже 123"
  );

  res.json({ arnoldSchwarzenegger });
});

router.post("/delete", async (req, res) => {
  const arnoldSchwarzenegger = await telegram.deleteMessage("630763354", "5");
  res.json({ arnoldSchwarzenegger });
});

module.exports = router;
