const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
require("dotenv").config();

const server1c = process.env.SERVER_1C;
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;

const botNotifyUrl =
  process.env.BOT_NOTIFY_URL || "http://127.0.0.1:3001/notifyError";

const headers = {
  Authorization: server1c_auth,
};

const saltRounds = Number(process.env.PASSWORD_SALT_ROUNDS);

const usersonec = {
  getUserByEmail: async (email) => {
    const endpoint = `${server1c}/Catalog_profile?$format=json&$filter=email eq '${email}'`;
    try {
      const response = await axios.get(endpoint, { headers });
      if (
        !response.data ||
        !response.data.value ||
        response.data.value.length === 0
      ) {
        throw new Error("Пользователь с указанным email не найден.");
      }
      return response.data.value[0];
    } catch (error) {
      console.error("Ошибка в getUserByEmail:", error.message);
      if (botNotifyUrl) {
        try {
          const errorDetails = {
            message: `Ошибка при получении данных из 1C: ${error.message}`,
            error: {
              config: {
                url: error?.config?.url,
                method: error?.config?.method,
              },
              response: {
                status: error?.response?.status,
                statusText: error?.response?.statusText,
                data: error?.response?.data,
              },
              code: error?.code,
              message: error?.message || error?.response?.data?.message,
            },
          };
          await axios.post(botNotifyUrl, errorDetails);
        } catch (notifyErr) {
          console.error("Не смогли оповестить бота:", notifyErr);
        }
      }
      throw new Error("Ошибка при получении данных профиля.");
    }
  },

  checkUserByEmail: async (email) => {
    const endpoint = `${server1c}/Catalog_profile?$format=json&$filter=email eq '${email}'`;
    try {
      const response = await axios.get(endpoint, { headers });
      if (!response.data?.value?.[0]) {
        return false;
      }
      return response.data.value[0].Ref_Key;
    } catch (error) {
      console.error("Ошибка в checkUserByEmail:", error.message);
      await notifyBotAboutError(error, endpoint);
      if (botNotifyUrl) {
        try {
          const errorDetails = {
            message: `Ошибка при получении данных из 1C: ${error.message}`,
            error: {
              config: {
                url: error?.config?.url,
                method: error?.config?.method,
              },
              response: {
                status: error?.response?.status,
                statusText: error?.response?.statusText,
                data: error?.response?.data,
              },
              code: error?.code,
              message: error?.message || error?.response?.data?.message,
            },
          };
          await axios.post(botNotifyUrl, errorDetails);
        } catch (notifyErr) {
          console.error("Не смогли оповестить бота:", notifyErr);
        }
      }
      throw new Error("Ошибка при проверке профиля.");
    }
  },

  getUserById: async (key) => {
    const endpoint = `${server1c}/Catalog_profile(guid'${key}')?$format=json`;
    try {
      const response = await axios.get(endpoint, { headers });
      if (!response.data) {
        throw new Error("Пустой ответ от 1С при запросе профиля.");
      }
      return response.data;
    } catch (error) {
      console.error("Ошибка в getUserById:", error.message);
      await notifyBotAboutError(error, endpoint);
      if (botNotifyUrl) {
        try {
          const errorDetails = {
            message: `Ошибка при получении данных из 1C: ${error.message}`,
            error: {
              config: {
                url: error?.config?.url,
                method: error?.config?.method,
              },
              response: {
                status: error?.response?.status,
                statusText: error?.response?.statusText,
                data: error?.response?.data,
              },
              code: error?.code,
              message: error?.message || error?.response?.data?.message,
            },
          };
          await axios.post(botNotifyUrl, errorDetails);
        } catch (notifyErr) {
          console.error("Не смогли оповестить бота:", notifyErr);
        }
      }
      throw new Error("Ошибка при получении данных профиля.");
    }
  },

  createNewUser: async (email, phone, password) => {
    const endpoint = `${server1c}/Catalog_profile?$format=json`;
    try {
      const hashPassword = await bcrypt.hash(password, saltRounds);
      const response = await axios.post(
        endpoint,
        { Description: email, email, phone, password: hashPassword },
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error("Ошибка в createNewUser:", error.message);
      await notifyBotAboutError(error, endpoint);
      if (botNotifyUrl) {
        try {
          const errorDetails = {
            message: `Ошибка при получении данных из 1C: ${error.message}`,
            error: {
              config: {
                url: error?.config?.url,
                method: error?.config?.method,
              },
              response: {
                status: error?.response?.status,
                statusText: error?.response?.statusText,
                data: error?.response?.data,
              },
              code: error?.code,
              message: error?.message || error?.response?.data?.message,
            },
          };
          await axios.post(botNotifyUrl, errorDetails);
        } catch (notifyErr) {
          console.error("Не смогли оповестить бота:", notifyErr);
        }
      }
      throw new Error("Ошибка при создании профиля.");
    }
  },

  updateUser: async (key, phone, password) => {
    const endpoint = `${server1c}/Catalog_profile(guid'${key}')?$format=json`;
    try {
      const data = {};
      if (phone) data.phone = phone;
      if (password) data.password = await bcrypt.hash(password, saltRounds);
      const response = await axios.patch(endpoint, data, { headers });
      return response.data;
    } catch (error) {
      console.error("Ошибка в updateUser:", error.message);
      await notifyBotAboutError(error, endpoint);
      if (botNotifyUrl) {
        try {
          const errorDetails = {
            message: `Ошибка при получении данных из 1C: ${error.message}`,
            error: {
              config: {
                url: error?.config?.url,
                method: error?.config?.method,
              },
              response: {
                status: error?.response?.status,
                statusText: error?.response?.statusText,
                data: error?.response?.data,
              },
              code: error?.code,
              message: error?.message || error?.response?.data?.message,
            },
          };
          await axios.post(botNotifyUrl, errorDetails);
        } catch (notifyErr) {
          console.error("Не смогли оповестить бота:", notifyErr);
        }
      }
      throw new Error("Ошибка при обновлении профиля.");
    }
  },
};

module.exports = usersonec;

// const axios = require('axios')
// const { v4: uuidv4 } = require('uuid');
// const bcrypt = require('bcrypt');
// require('dotenv').config()

// const server1c = process.env.SERVER_1C
// const server1c_auth = process.env.SERVER_1C_AUTHORIZATION

// const botNotifyUrl =
//   process.env.BOT_NOTIFY_URL || "http://127.0.0.1:3001/notifyError";

// const headers = {
//     "Authorization": server1c_auth
// }

// const saltRounds = Number(process.env.PASSWORD_SALT_ROUNDS)

// const usersonec = {
//     getUserByEmail: async (email) => {
//         try {
//             const response = await axios.get(`${server1c}/Catalog_profile?$format=json&$filter=email eq '${email}'`, {
//                 headers
//             })
//             if (!response.data) {
//                 throw new Error("Что-то пошло не так при получении данных профиля.");
//             }
//             // console.log(response.data)
//             return response.data.value[0]

//         } catch (error) {
//             console.log(error.message)
//             throw new Error("Что-то пошло не так при получении данных профиля.");
//         }
//     },
//     checkUserByEmail: async (email) => {
//         try {
//             const response = await axios.get(`${server1c}/Catalog_profile?$format=json&$filter=email eq '${email}'`, {
//                 headers
//             })
//             if (!response.data && !response.data.value[0]) {
//                 throw new Error("Что-то пошло не так при получении данных профиля.");
//             }
//             // console.log('checkUserByEmail',response.data)
//             return response.data.value[0] ? response.data.value[0].Ref_Key : false

//         } catch (error) {
//             console.log(error.message)
//             throw new Error("Что-то пошло не так при получении данных профиля.");
//         }
//     },
//     getUserById: async (key) => {
//         try {
//             const response = await axios.get(`${server1c}/Catalog_profile(guid'${key}')?$format=json`, {
//                 headers
//             })
//             if (!response.data) {
//                 throw new Error("Что-то пошло не так при получении данных профиля.");
//             }
//             // console.log(response.data)
//             return response.data

//         } catch (error) {
//             console.log(error.message)
//             throw new Error("Что-то пошло не так при получении данных профиля.");
//         }
//     },
//     createNewUser: async (email, phone, password) => {
//         //console.log({headers})
//         try {
//             const hashPassword = await bcrypt.hash(password, saltRounds)
//             const response = await axios.post(`${server1c}/Catalog_profile?$format=json`, {
//                 Description: email,
//                 email: email,
//                 phone: phone,
//                 password: hashPassword
//             }, {
//                 headers
//             })
//             // console.log(response.data)
//             return response.data

//         } catch (error) {
//             console.log(error.message)
//             throw new Error("Что-то пошло не так при получении данных профиля.");
//         }
//     },
//     updateUser: async (key, phone, password) => {
//         const data = {}
//         if (phone) data.phone = phone;
//         if (password) data.password = await bcrypt.hash(password, saltRounds);
//         try {
//             // const hashPassword = await bcrypt.hash(password, saltRounds)
//             const response = await axios.patch(`${server1c}/Catalog_profile(guid'${key}')?$format=json`, data, {
//                 headers
//             })
//             console.log('updateUser', response.data)
//             return response.data

//         } catch (error) {
//             console.log(error.message)
//             throw new Error("Что-то пошло не так при получении данных профиля.");
//         }
//     }
// }

// module.exports = usersonec;
