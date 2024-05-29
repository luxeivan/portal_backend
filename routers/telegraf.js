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
        if (response.message_id) {
          await axios.post(
            "http://5.35.9.42:1337/api/id-avarijnyh-soobshhenij-v-telegrams",
            {
              data: {
                messageID: response.message_id,
                avariynoeID: entry.id,
              },
            }
          );
          console.log("Message sent and saved to database:", response);
        }
      } catch (error) {
        console.log(error);
      }
    } else if (event === "entry.delete") {
      const entry = req.body.entry;
      try {
        // Получаем сообщение из базы данных по avarijnoeID
        const response = await axios.get(
          `http://5.35.9.42:1337/api/id-avarijnyh-soobshhenij-v-telegrams?filters[avariynoeID][$eq]=${entry.id}`
        );
        const messageId = response.data.data[0].attributes.messageID;

        // Удаляем сообщение в Telegram
        const telegramResponse = await telegram.deleteMessage(
          "630763354",
          messageId
        );

        if (telegramResponse === true) {
          // Удаляем запись из базы данных, если удаление в Telegram прошло успешно
          await axios.delete(
            `http://5.35.9.42:1337/api/id-avarijnyh-soobshhenij-v-telegrams/${response.data.data[0].id}`
          );
          console.log("Message deleted from Telegram and database:", messageId);
        } else {
          console.log("Failed to delete message in Telegram");
        }
      } catch (error) {
        console.log(error);
      }
    }
  }

  res.json("Ok");
});

module.exports = router;

// const express = require("express");
// const { Telegram } = require("telegraf");
// const axios = require("axios");
// const router = express.Router();

// const telegram = new Telegram("7221312469:AAHpG-K9hCN_U2hsgYPF8kM6387ajRnwRkY");

// router.post("/", async (req, res) => {
//   const event = req.body.event;
//   const model = req.body.model;

//   if (model === "avarijnye-otklyucheniya") {
//     if (event === "entry.create") {
//       const entry = req.body.entry;
//       const message = `Аварийное отключение:
//         Городской округ: ${entry.go}
//         Улицы: ${entry.addressDisconnected}
//         Дата: ${new Date(entry.dateDisconnected).toLocaleString()}
//         Продолжительность: ${entry.durationSolution} ч`;

//       try {
//         const response = await telegram.sendMessage("630763354", message);
//         console.log("response", response);

//         // Сохраняем сообщение в БД
//         await axios.post(
//           "http://5.35.9.42:1337/api/id-avarijnyh-soobshhenij-v-telegrams",
//           {
//             data: {
//               messageId: response.message_id,
//               avarijnoeID: entry.id,
//             },
//           }
//         );

//         res.json({ success: true });
//       } catch (error) {
//         console.log(error);
//         res.status(500).json({ success: false, error });
//       }
//     } else if (event === "entry.delete") {
//       const entry = req.body.entry;

//       try {
//         // Получаем ID сообщения из БД
//         const { data } = await axios.get(
//           `http://5.35.9.42:1337/api/id-avarijnyh-soobshhenij-v-telegrams?filters[avarijnoeID][$eq]=${entry.id}`
//         );
//         const messageId = data.data[0]?.attributes?.messageId;

//         if (messageId) {
//           // Удаляем сообщение из Телеграм
//           const response = await telegram.deleteMessage("630763354", messageId);

//           // Удаляем запись из БД
//           const recordId = data.data[0].id;
//           await axios.delete(
//             `http://5.35.9.42:1337/api/id-avarijnyh-soobshhenij-v-telegrams/${recordId}`
//           );

//           res.json({ success: true, response });
//         } else {
//           res
//             .status(404)
//             .json({ success: false, message: "Message ID not found" });
//         }
//       } catch (error) {
//         console.log(error);
//         res.status(500).json({ success: false, error });
//       }
//     } else {
//       res.status(400).json({ success: false, message: "Unsupported event" });
//     }
//   } else {
//     res.status(400).json({ success: false, message: "Unsupported model" });
//   }
// });

// module.exports = router;

// const express = require("express");
// const { Telegram } = require("telegraf");
// const axios = require("axios");
// const router = express.Router();

// const telegram = new Telegram("7221312469:AAHpG-K9hCN_U2hsgYPF8kM6387ajRnwRkY");

// router.post("/", async (req, res) => {
//   const event = req.body.event;
//   const model = req.body.model;

//   if (model === "avarijnye-otklyucheniya") {
//     if (event === "entry.create") {
//       const entry = req.body.entry;
//       const message = `Аварийное отключение:
//         Городской округ: ${entry.go}
//         Улицы: ${entry.addressDisconnected}
//         Дата: ${new Date(entry.dateDisconnected).toLocaleString()}
//         Продолжительность: ${entry.durationSolution} ч`;
//       try {
//         const response = await telegram.sendMessage("630763354", message);
//         console.log("response", response);
//       } catch (error) {
//         console.log(error);
//       }
//     }
//   } else if (event === "entry.delete") {
//     const entry = req.body.entry;
//     const messageId = entry.id;
//     try {
//       const response = await telegram.deleteMessage("630763354", messageId);
//     } catch (error) {
//       console.log(error);
//     }
//   }
// });

// module.exports = router;

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
