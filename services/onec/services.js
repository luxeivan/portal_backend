const axios = require("axios");
const moment = require("moment");
require("dotenv").config();

const server1c = process.env.SERVER_1C;
const server1cHttpService = process.env.SERVER_1C_HTTP_SERVICE;
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;
const botNotifyUrl =
  process.env.BOT_NOTIFY_URL || "http://127.0.0.1:3001/notifyError";

const headers = {
  Authorization: server1c_auth,
};

const servicesOneC = {
  getPictureFile: async (key) => {
    try {
      const response = await axios.get(
        `${server1c}/Catalog_Файлы(guid'${key}')?$format=json`,
        {
          headers,
        }
      );
      if (!response.data) {
      }
      return response.data;
    } catch (error) {
      return false;
    }
  },

  getServicesByKey: async (key = "00000000-0000-0000-0000-000000000000") => {
    try {
      const response = await axios
        .get(`${server1cHttpService}/services/folder/${key}`,
          {
            headers,
          }
        )

      return response.data;
    } catch (error) {
      console.log("getServicesByKey: ", error.message);

      return false;
    }
  },

  getServicesAll: async () => {
    // console.log("getServicesAll...");
    try {
      const response = await axios
        .get(`${server1cHttpService}/services/folder/all`,
          {
            headers,
          }
        )

      return response.data;
    } catch (error) {
      console.log("getServicesAll: ", error.message);
      return false;
    }
  },

  getServiceItemByKey: async (key, withFields = true) => {
    if (key === "00000000-0000-0000-0000-000000000000") return true;
    let serviceItem = {};

    try {
      const resp = await Promise.all([
        axios
          .get(
            // `${server1c}/Catalog_services?$format=json&$filter=DeletionMark eq false and usage eq true and Ref_Key eq guid'${key}'`,
            `${server1cHttpService}/services/${key}`,
            {
              headers,
            }
          )
          .catch((err) => {
            throw new Error("Ошибка получения услуги");
          }),
        withFields
          ? axios
            .get(`${server1cHttpService}/portalFields/services/${key}'`, {
              headers,
            })
            .catch((err) => {
              throw new Error("Ошибка получения полей услуги");
            })
          : false,
      ]);

      if (!resp[0].data) {
        throw new Error("Что-то пошло не так при получении данных.");
      } else {
        serviceItem = resp[0].data;
      }

      if (resp[0].data.length === 0) {
        console.log("Услуги с таким ключом не существует.");
        throw new Error("Услуги с таким ключом не существует.");
      }
      // -------------Функция получения группы-------------------------------------------
      const getGroupInput = async (guid, item) => {
        const groupFields = await axios.get(
          `${server1c}/InformationRegister_portalFields?$format=json&$select=*&$expand=name,dependName,dependСondition,component&$filter=cast(object,'Catalog_componentsGroupFieldsInput') eq guid'${guid}'`,
          {
            headers,
          }
        );

        if (groupFields.data && groupFields.data.value) {
          item.component_Expanded.fields = groupFields.data.value.sort(
            (a, b) => a.lineNum - b.lineNum
          );
          // -------------Проход по типам получаемых полей в группе
          await Promise.all(
            item.component_Expanded.fields.map(async (item) => {
              return new Promise(async (resolve, reject) => {
                // -------------Если группа
                if (item.component_Type.includes("GroupFieldsInput")) {
                  try {
                    return resolve(await getGroupInput(item.component, item));
                  } catch (error) {
                    return reject(new Error("Ошибка получения группы"));
                  }
                }
                // -------------Если таблица
                if (item.component_Type.includes("TableInput")) {
                  try {
                    return resolve(await getTableInput(item.component, item));
                  } catch (error) {
                    return reject(new Error("Ошибка получения таблицы"));
                  }
                }
                // -------------Если LinkInput (ссылка на справочник и установлен флаг allValues)
                if (
                  item.component_Type.includes("LinkInput") &&
                  item.component_Expanded?.allValues
                ) {
                  try {
                    return resolve(await getLinkInput(item));
                  } catch (error) {
                    return reject(
                      new Error("Ошибка получения справочника ссылочного типа")
                    );
                  }
                }
                return resolve(item);
              });
            })
          );
        }
        return item;
      };

      // -------------Функция получения LinkInput-------------------------------------------
      const getLinkInput = async (item) => {
        const allValues = await axios.get(
          `${server1c}${item.component_Expanded.linkUrl}`,
          {
            headers,
          }
        );
        if (allValues.data && allValues.data.value) {
          item.component_Expanded.options = allValues.data.value
            .sort((a, b) => {
              if (a.Description?.toLowerCase() < b.Description?.toLowerCase()) {
                return -1;
              }
              if (a.Description?.toLowerCase() > b.Description?.toLowerCase()) {
                return 1;
              }
              return 0;
            })
            .map((item) => ({
              value: item.Ref_Key,
              label: item.Description,
              unit: item["ЕдиницаИзмерения"]?.Description,
            }));
        }
        return item;
      };

      // -------------Функция получения TableInput-------------------------------------------
      const getTableInput = async (guid, item) => {
        const tableFields = await axios.get(
          `${server1c}/InformationRegister_portalFields?$format=json&$select=*&$expand=name,component,dependName,dependСondition&$filter=cast(object,'Catalog_componentsTableInput') eq guid'${guid}'`,
          {
            headers,
          }
        );
        if (tableFields.data && tableFields.data.value) {
          tableFields.data.value = await Promise.all(
            tableFields.data.value.map((tableField) => {
              return new Promise(async (resolve, reject) => {
                if (
                  tableField.component_Type.includes("LinkInput") &&
                  tableField.component_Expanded?.allValues
                ) {
                  return resolve(await getLinkInput(tableField));
                }
                resolve(tableField);
              });
            })
          );
          item.component_Expanded.fields = tableFields.data.value.sort(
            (a, b) => a.lineNum - b.lineNum
          );
        }
        return item;
      };

      // -------------Если надо получать поля услуги-------------------------------------------
      if (withFields) {
        serviceItem.data.fields = resp[1].data.data.fields;
        serviceItem.data.styles = resp[1].data.data.styles;
        serviceItem.data.links = resp[1].data.data.links;
        serviceItem.data.externalService = resp[1].data.data.externalService;
        serviceItem.data.versionId = resp[1].data.data.versionId;

      }
      return serviceItem;
    } catch (error) {
      console.log("error: ", error.message);
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
      throw new Error(error.message);
    }
  },
};

module.exports = servicesOneC;
