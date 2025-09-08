const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
require("dotenv").config();

const server1c = process.env.SERVER_1C;
const server1chttp = process.env.SERVER_1C_HTTP_SERVICE;
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;

const botNotifyUrl =
  process.env.BOT_NOTIFY_URL || "http://127.0.0.1:3001/notifyError";

const headers = {
  Authorization: server1c_auth,
};

const saltRounds = Number(process.env.PASSWORD_SALT_ROUNDS);

const notifyBotAboutError = async (error, endpoint) => {
  if (!botNotifyUrl) return;
  try {
    await axios.post(botNotifyUrl, {
      message: `Ошибка при обращении к 1С: ${error?.message}`,
      endpoint,
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
    });
  } catch (notifyErr) {
    console.error("Не смогли оповестить бота:", notifyErr);
  }
};

// ---- Новое: тип ошибок домена ----
class DomainError extends Error {
  constructor(code, message, http = 400) {
    super(message);
    this.code = code; // 'ACCOUNT_BLOCKED' | 'INVALID_DATA' | 'NOT_FOUND' | 'UPSTREAM_ERROR'
    this.http = http; // 403 | 400 | 404 | 502 ...
    this.isDomain = true;
  }
}

// ---- Новое: нормализация ответа 1С ----
const classifyOneC = (resp) => {
  const status = resp?.status ?? 0;
  const body = resp?.data ?? {};
  const data = body?.data ?? null;
  const msg = (body?.message || body?.Message || "").toString();

  const blocked = Boolean(
    data?.block ?? body?.block ?? data?.Block ?? body?.Block
  );
  const invalid = status === 400 || /неверн/i.test(msg);
  const notFound = status === 404 || data == null || /не найден/i.test(msg);

  if (blocked)
    throw new DomainError(
      "ACCOUNT_BLOCKED",
      "Учётная запись заблокирована",
      403
    );
  if (invalid) throw new DomainError("INVALID_DATA", "Неверные данные", 400);
  if (notFound)
    throw new DomainError("NOT_FOUND", "Пользователь не найден", 404);

  return data; // OK
};

const usersonec = {
  // ---- Обновлённое ----
  getUserByEmail: async (email) => {
    const endpoint = `${server1chttp}/profile?email=${encodeURIComponent(
      email
    )}`;
    console.log("endpoint", endpoint);

    try {
      // не даём axios бросать на 4xx/5xx, сами разберём
      const resp = await axios.get(endpoint, {
        headers,
        validateStatus: () => true,
      });

      const data = classifyOneC(resp);
      return data; // OK
    } catch (error) {
      if (error?.isDomain) throw error;
      console.error("Ошибка в getUserByEmail:", error.message);
      await notifyBotAboutError(error, endpoint);
      throw new DomainError(
        "UPSTREAM_ERROR",
        "Ошибка при получении данных профиля.",
        502
      );
    }
  },

  checkUserByEmail: async (email) => {
    const endpoint = `${server1chttp}/profile?email=${encodeURIComponent(
      email
    )}`;
    try {
      const resp = await axios.get(endpoint, {
        headers,
        validateStatus: () => true,
      });

      const data = classifyOneC(resp);
      return data?.Ref_Key || false;
    } catch (e) {
      if (e?.isDomain) {
        if (e.code === "NOT_FOUND" || e.code === "INVALID_DATA") return false;
        throw e;
      }
      await notifyBotAboutError(e, endpoint);
      throw new DomainError(
        "UPSTREAM_ERROR",
        "Ошибка при проверке профиля.",
        502
      );
    }
  },


  getUserById: async (key) => {
    const endpoint = `${server1chttp}/profile/${key}`;
    try {
      const response = await axios.get(endpoint, { headers });
      if (!response.data) {
        throw new Error("Пустой ответ от 1С при запросе профиля.");
      }
      return response.data.data;
    } catch (error) {
      console.error("Ошибка в getUserById:", error.message);
      await notifyBotAboutError(error, endpoint);
      throw new Error("Ошибка при получении данных профиля.");
    }
  },

  createNewUser: async (email, phone, password) => {
    const endpoint = `${server1chttp}/profile`;
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
      throw new Error("Ошибка при создании профиля.");
    }
  },

  updateUser: async (key, phone, password) => {
    const endpoint = `${server1chttp}/profile/${key}`;
    try {
      const data = {};
      if (phone) data.phone = phone;
      if (password) data.password = await bcrypt.hash(password, saltRounds);
      const response = await axios.put(endpoint, data, { headers });
      return response.data;
    } catch (error) {
      console.error("Ошибка в updateUser:", error.message);
      await notifyBotAboutError(error, endpoint);
      throw new Error("Ошибка при обновлении профиля.");
    }
  },
};

module.exports = usersonec;

// const axios = require("axios");
// const { v4: uuidv4 } = require("uuid");
// const bcrypt = require("bcrypt");
// require("dotenv").config();

// const server1c = process.env.SERVER_1C;
// const server1chttp = process.env.SERVER_1C_HTTP_SERVICE;
// const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;

// const botNotifyUrl =
//   process.env.BOT_NOTIFY_URL || "http://127.0.0.1:3001/notifyError";

// const headers = {
//   Authorization: server1c_auth,
// };

// const saltRounds = Number(process.env.PASSWORD_SALT_ROUNDS);

// const usersonec = {
//   getUserByEmail: async (email) => {
//     // const endpoint = `${server1c}/Catalog_profile?$format=json&$filter=email eq '${email}'`;
//     const endpoint = `${server1chttp}/profile?email=${email}`;
//     console.log("endpoint",endpoint);

//     try {
//       const response = await axios.get(endpoint, { headers });
//       if (
//         !response.data ||
//         !response.data.data
//       ) {
//         throw new Error("Пользователь с указанным email не найден.");
//       }
//       return response.data.data;
//     } catch (error) {
//       console.error("Ошибка в getUserByEmail:", error.message);
//       if (botNotifyUrl) {
//         try {
//           const errorDetails = {
//             message: `Ошибка при получении данных из 1C: ${error.message}`,
//             error: {
//               config: {
//                 url: error?.config?.url,
//                 method: error?.config?.method,
//               },
//               response: {
//                 status: error?.response?.status,
//                 statusText: error?.response?.statusText,
//                 data: error?.response?.data,
//               },
//               code: error?.code,
//               message: error?.message || error?.response?.data?.message,
//             },
//           };
//           await axios.post(botNotifyUrl, errorDetails);
//         } catch (notifyErr) {
//           console.error("Не смогли оповестить бота:", notifyErr);
//         }
//       }
//       throw new Error("Ошибка при получении данных профиля.");
//     }
//   },

//   checkUserByEmail: async (email) => {
//     // const endpoint = `${server1c}/Catalog_profile?$format=json&$filter=email eq '${email}'`;
//     const endpoint = `${server1chttp}/profile?email=${email}`;
//     try {
//       const response = await axios.get(endpoint, { headers });
//       if (!response.data?.data) {
//         return false;
//       }
//       // console.log(response.data);
//       return response.data.data.Ref_Key;
//     } catch (error) {
//       console.error("Ошибка в checkUserByEmail:", error.message);
//       await notifyBotAboutError(error, endpoint);
//       if (botNotifyUrl) {
//         try {
//           const errorDetails = {
//             message: `Ошибка при получении данных из 1C: ${error.message}`,
//             error: {
//               config: {
//                 url: error?.config?.url,
//                 method: error?.config?.method,
//               },
//               response: {
//                 status: error?.response?.status,
//                 statusText: error?.response?.statusText,
//                 data: error?.response?.data,
//               },
//               code: error?.code,
//               message: error?.message || error?.response?.data?.message,
//             },
//           };
//           await axios.post(botNotifyUrl, errorDetails);
//         } catch (notifyErr) {
//           console.error("Не смогли оповестить бота:", notifyErr);
//         }
//       }
//       throw new Error("Ошибка при проверке профиля.");
//     }
//   },

//   getUserById: async (key) => {
//     // const endpoint = `${server1c}/Catalog_profile(guid'${key}')?$format=json`;
//     const endpoint = `${server1chttp}/profile/${key}`;
//     try {
//       const response = await axios.get(endpoint, { headers });
//       if (!response.data) {
//         throw new Error("Пустой ответ от 1С при запросе профиля.");
//       }
//       return response.data.data;
//     } catch (error) {
//       console.error("Ошибка в getUserById:", error.message);
//       await notifyBotAboutError(error, endpoint);
//       if (botNotifyUrl) {
//         try {
//           const errorDetails = {
//             message: `Ошибка при получении данных из 1C: ${error.message}`,
//             error: {
//               config: {
//                 url: error?.config?.url,
//                 method: error?.config?.method,
//               },
//               response: {
//                 status: error?.response?.status,
//                 statusText: error?.response?.statusText,
//                 data: error?.response?.data,
//               },
//               code: error?.code,
//               message: error?.message || error?.response?.data?.message,
//             },
//           };
//           await axios.post(botNotifyUrl, errorDetails);
//         } catch (notifyErr) {
//           console.error("Не смогли оповестить бота:", notifyErr);
//         }
//       }
//       throw new Error("Ошибка при получении данных профиля.");
//     }
//   },

//   createNewUser: async (email, phone, password) => {
//     // const endpoint = `${server1c}/Catalog_profile?$format=json`;
//     const endpoint = `${server1chttp}/profile`;
//     try {
//       const hashPassword = await bcrypt.hash(password, saltRounds);
//       const response = await axios.post(
//         endpoint,
//         { Description: email, email, phone, password: hashPassword },
//         { headers }
//       );
//       return response.data;
//     } catch (error) {
//       console.error("Ошибка в createNewUser:", error.message);
//       await notifyBotAboutError(error, endpoint);
//       if (botNotifyUrl) {
//         try {
//           const errorDetails = {
//             message: `Ошибка при получении данных из 1C: ${error.message}`,
//             error: {
//               config: {
//                 url: error?.config?.url,
//                 method: error?.config?.method,
//               },
//               response: {
//                 status: error?.response?.status,
//                 statusText: error?.response?.statusText,
//                 data: error?.response?.data,
//               },
//               code: error?.code,
//               message: error?.message || error?.response?.data?.message,
//             },
//           };
//           await axios.post(botNotifyUrl, errorDetails);
//         } catch (notifyErr) {
//           console.error("Не смогли оповестить бота:", notifyErr);
//         }
//       }
//       throw new Error("Ошибка при создании профиля.");
//     }
//   },

//   updateUser: async (key, phone, password) => {
//     // const endpoint = `${server1c}/Catalog_profile(guid'${key}')?$format=json`;
//     const endpoint = `${server1chttp}/profile/${key}`;
//     try {
//       const data = {};
//       if (phone) data.phone = phone;
//       if (password) data.password = await bcrypt.hash(password, saltRounds);
//       const response = await axios.put(endpoint, data, { headers });
//       return response.data;
//     } catch (error) {
//       console.error("Ошибка в updateUser:", error.message);
//       await notifyBotAboutError(error, endpoint);
//       if (botNotifyUrl) {
//         try {
//           const errorDetails = {
//             message: `Ошибка при получении данных из 1C: ${error.message}`,
//             error: {
//               config: {
//                 url: error?.config?.url,
//                 method: error?.config?.method,
//               },
//               response: {
//                 status: error?.response?.status,
//                 statusText: error?.response?.statusText,
//                 data: error?.response?.data,
//               },
//               code: error?.code,
//               message: error?.message || error?.response?.data?.message,
//             },
//           };
//           await axios.post(botNotifyUrl, errorDetails);
//         } catch (notifyErr) {
//           console.error("Не смогли оповестить бота:", notifyErr);
//         }
//       }
//       throw new Error("Ошибка при обновлении профиля.");
//     }
//   },
// };

// module.exports = usersonec;
