const express = require("express");
const axios = require("axios");
require("dotenv").config();

const router = express.Router();

const SERVER_1C = process.env.SERVER_1C;
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;
const headers = {
  Authorization: server1c_auth,
};

// Создаем маршрут для получения контактной информации
router.get("/", async (req, res) => {
  try {
    const response = await axios.get(
      `${SERVER_1C}/InformationRegister_portalContactInformation?$format=json&$orderby=lineNum`,
      {
        headers,
      }
    );
    console.log(response);

    // Возвращаем данные полученные из 1C
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Ошибка при получении данных из 1C:", error);
    res.status(500).json({ message: "Ошибка при получении данных из 1C" });
  }
});

module.exports = router;
