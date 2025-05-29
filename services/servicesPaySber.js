const axios = require("axios");
const { v4 } = require("uuid");

const registerOrderSber = async (zakaz, amount) => {
  const payload = {
    userName: process.env.SBER_USERNAME,
    password: process.env.SBER_PASSWORD,
    orderNumber: v4(),
    amount: amount * 100, // копейки
    description: "Оплата заявки",
    language: "ru",
    returnUrl: `https://portal.mosoblenergo.ru/cabinet/claimers/${zakaz}?pay=success`,
    failUrl: `https://portal.mosoblenergo.ru/cabinet/claimers/${zakaz}?pay=fail`,
  };

  const { data } = await axios.post(process.env.SBER_URL, payload, {
    headers: { "Content-Type": "application/json" },
  });

  if (data?.formUrl) return data.formUrl;
  throw new Error(`Сбер ошибка: ${data.errorMessage || data.error}`);
};

module.exports = { registerOrderSber };
