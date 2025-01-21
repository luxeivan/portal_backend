const axios = require("axios");
const moment = require("moment");
require("dotenv").config();

const server1c = process.env.SERVER_1C;
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;
const botNotifyUrl =
  process.env.BOT_NOTIFY_URL || "http://127.0.0.1:3001/notifyError";

const headers = {
    Authorization: server1c_auth,
};

"/InformationRegister_ЦеныНоменклатуры_RecordType/SliceLast(,Condition='ТипЦен_Key eq '[ТипЦены]' and Номенклатура_Key eq '[Номенклатура]'')/?$format=json&$select=Цена"

const otherServices = {
    getPrice: async (type, nomenclature) => {
        try {
            const response = await axios.get(
                `${server1c}/InformationRegister_ЦеныНоменклатуры_RecordType/SliceLast(,Condition='ТипЦен_Key eq guid'${type}' and Номенклатура_Key eq guid'${nomenclature}'')/?$format=json&$select=*&$expand=Валюта`,
                {
                    headers,
                }
            );
            // console.log('response.data: ', response.data);
            if (response.data && response.data.value && response.data.value.length > 0) {
                console.log(response.data.value[0]);

                return { price: response.data.value[0]?.Цена, currency: response.data.value[0]?.Валюта.Description };
            } else {
                return null;
            }
        } catch (error) {
            console.log('getPrice: ', error.message);
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
}

module.exports = otherServices;