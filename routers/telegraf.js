const express = require("express");
const { Telegram } = require("telegraf");
const axios = require("axios");
const router = express.Router();

const telegram = new Telegram("7221312469:AAHpG-K9hCN_U2hsgYPF8kM6387ajRnwRkY");

router.post("/", async (req, res) => {
  const event = req.body.event;
  const model = req.body.model;

  if (model === "avarijnye-otklyucheniya") {
    if (event === "entry.create") {
      const entry = req.body.entry;
      const message = `Аварийное отключение:
        Городской округ: ${entry.go}
        Улицы: ${entry.addressDisconnected}
        Дата: ${new Date(entry.dateDisconnected).toLocaleString()}
        Продолжительность: ${entry.durationSolution} ч`;
      try {
        const response = await telegram.sendMessage("630763354", message);
        console.log("response", response);
      } catch (error) {
        console.log(error);
      }
    }
  }
});

module.exports = router;

// const express = require("express");
// const { Telegram } = require("telegraf");
// const router = express.Router();

// const telegram = new Telegram("7221312469:AAHpG-K9hCN_U2hsgYPF8kM6387ajRnwRkY");

// router.post("/", async (req, res) => {
//   console.log(req.body);
//   res.json("Ok");
// });

// router.post("/send", async (req, res) => {
//   const arnoldSchwarzenegger = await telegram.sendMessage(
//     "630763354",
//     "Напиши любой текст, даже 123"
//   );

//   res.json({ arnoldSchwarzenegger });
// });

// router.post("/delete", async (req, res) => {
//   const arnoldSchwarzenegger = await telegram.deleteMessage("630763354", "5");
//   res.json({ arnoldSchwarzenegger });
// });

// module.exports = router;
