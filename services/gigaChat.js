const axios = require("axios");
const moment = require("moment");
const qs = require("qs");
const { v4 } = require("uuid");

// const clientId = process.env.GIGACHAT_CLIENT_ID;
// const clientSecret = process.env.GIGACHAT_CLIENT_SECRET;
const encodedAuthData = process.env.GIGACHAT_AUTH_DATA;
// const authData = `${clientId}:${clientSecret}`;
// const encodedAuthData1 = btoa(authData);

// Функция для получения токена доступа
const getAccessToken = async () => {
  try {
    const uuid = v4()
    const stringBody = qs.stringify({ scope: "GIGACHAT_API_PERS" })
    console.log("прошла генерация getAccessToken.")
    // console.log("uuid: ", uuid)
    // console.log("stringBody: ", stringBody)
    // console.log("encodedAuthData: ", encodedAuthData)
    // console.log("encodedAuthData1: ", encodedAuthData1)
    const response = await axios.post(
      "https://ngw.devices.sberbank.ru:9443/api/v2/oauth",
      stringBody, // или другой scope в зависимости от вашего типа доступа
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "*/*",
          RqUID: uuid,
          Authorization: `Basic ${encodedAuthData}`,
        },
      }
    );

    // const { access_token, expires_at } = response.data;
    return response.data;
  } catch (error) {
    console.error("Ошибка при получении токена доступа:", error);
    throw error;
  }
};


let token = { access_token: '', expires_at: null }
// Функция для отправки сообщения и получения ответа от GigaChat
const sendMessageToGigachat = async (message) => {

  try {
    if (token.access_token === '' || token.expires_at < moment().valueOf()) {

      token = await getAccessToken();
    }
    const response = await axios.post(
      "https://gigachat.devices.sberbank.ru/api/v1/chat/completions",
      {
        model: "GigaChat",
        messages: [{ role: "user", content: message }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token.access_token}`,
        },
      }
    );

    const botResponse = response.data.choices[0].message.content;
    return botResponse;
  } catch (error) {
    console.error("Ошибка при отправке сообщения в GigaChat:", error);
    throw error;
  }
};

module.exports = sendMessageToGigachat