const axios = require("axios");
require("dotenv").config();

const server1c = process.env.SERVER_1C;
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;
const botNotifyUrl =
  process.env.BOT_NOTIFY_URL || "http://127.0.0.1:3001/notifyError";

const headers = {
  Authorization: server1c_auth,
};

const formOneC = {
  getGetFields: async (key = "00000000-0000-0000-0000-000000000000") => {
    try {
      const response = await axios.get(
        `${server1c}/Catalog_Services_Fields/?$format=json&$filter=Ref_Key eq guid'${key}' and Usage eq true&$select=*&$expand=Name,NameTable,ValueTemplate,ValueVariants`,
        {
          headers,
        }
      );
      if (!response.data) {
        return false;
      }
      // console.log(response.data)
      return response.data;
    } catch (error) {
      console.log(error.message);
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
      return false;
    }
  },
};

module.exports = formOneC;
