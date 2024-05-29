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
      const date = new Date(entry.dateDisconnected);
      const options = {
        timeZone: "Europe/Moscow",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
      const formattedDate = date.toLocaleString("ru-RU", options);

      const message = `<b>Городской округ:</b> ${entry.go}
<b>Улицы:</b> ${entry.addressDisconnected}
<b>Дата:</b> ${formattedDate}
<b>Продолжительность:</b> ${entry.durationSolution} ч`;

      try {
        const response = await telegram.sendMessage("-1002070621778", message, {
          message_thread_id: 4,
          parse_mode: "HTML",
        });
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
          "-1002070621778",
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
//         const response = await telegram.sendMessage("-1002070621778", message, {
//           message_thread_id: 4,
//         });
//         if (response.message_id) {
//           await axios.post(
//             "http://5.35.9.42:1337/api/id-avarijnyh-soobshhenij-v-telegrams",
//             {
//               data: {
//                 messageID: response.message_id,
//                 avariynoeID: entry.id,
//               },
//             }
//           );
//           console.log("Message sent and saved to database:", response);
//         }
//       } catch (error) {
//         console.log(error);
//       }
//     } else if (event === "entry.delete") {
//       const entry = req.body.entry;
//       try {
//         // Получаем сообщение из базы данных по avarijnoeID
//         const response = await axios.get(
//           `http://5.35.9.42:1337/api/id-avarijnyh-soobshhenij-v-telegrams?filters[avariynoeID][$eq]=${entry.id}`
//         );
//         const messageId = response.data.data[0].attributes.messageID;

//         // Удаляем сообщение в Telegram
//         const telegramResponse = await telegram.deleteMessage(
//           "-1002070621778",
//           messageId
//         );

//         if (telegramResponse === true) {
//           // Удаляем запись из базы данных, если удаление в Telegram прошло успешно
//           await axios.delete(
//             `http://5.35.9.42:1337/api/id-avarijnyh-soobshhenij-v-telegrams/${response.data.data[0].id}`
//           );
//           console.log("Message deleted from Telegram and database:", messageId);
//         } else {
//           console.log("Failed to delete message in Telegram");
//         }
//       } catch (error) {
//         console.log(error);
//       }
//     }
//   }

//   res.json("Ok");
// });

// module.exports = router;
