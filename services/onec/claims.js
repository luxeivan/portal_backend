const axios = require("axios");
const moment = require("moment");
const services = require("./services");
require("dotenv").config();

const server1c = process.env.SERVER_1C;
const server1cHttpService = process.env.SERVER_1C_HTTP_SERVICE;
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;
const botNotifyUrl =
  process.env.BOT_NOTIFY_URL || "http://127.0.0.1:3001/notifyError";

const headers = {
  Authorization: server1c_auth,
};

const claimsOneC = {
  getClaims: async (userId) => {
    try {
      const response = await axios.get(
        `${server1cHttpService}/profile/${userId}/claims`,
        {
          headers,
        }
      );
      if (!response.data) {
        return false;
      }
      // console.log("getClaims", response.data);
      return response.data;
    } catch (error) {
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
      console.log(error);
      return error;
    }
  },
  getClaims1: async (userId) => {
    try {
      const response = await axios.get(
        `${server1c}/InformationRegister_connectionsOfElements?$format=json&$select=*&$expand=element2/Document_claimsProject/template&$filter=cast(element1,'Catalog_profile') eq guid'${userId}' and element2_Type eq 'StandardODATA.Document_claimsProject'`,
        {
          headers,
        }
      );
      if (!response.data) {
        return false;
      }
      // console.log(response.data)
      return response.data.value;
    } catch (error) {
      console.log(error);
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
      return error;
    }
  },
  getClaimItem: async (userId, Ref_key) => {
    try {
      const response = await axios.get(
        `${server1cHttpService}/profile/${userId}/claims/${Ref_key}/all`,
        // `${server1c}/InformationRegister_connectionsOfElements?$format=json&$select=*&$expand=element2/Document_claimsProject/template&$filter=cast(element1,'Catalog_profile') eq guid'${userId}' and cast(element2,'Document_claimsProject') eq guid'${Ref_key}'`,
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
      console.log(error);
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
      return error;
    }
  },
  createNewClaim1: async (data, userId) => {
    try {
      const newClaim = await axios.post(
        `${server1cHttpService}/profile/${userId}/claims`,
        // `${server1cHttpService}/newClaimProject/${userId}/${data.serviceId}/${data.versionId}`,
        {
          ...data,
        },
        {
          headers,
        }
      );
      if (!newClaim.data) {
        return false;
      }
      console.log("newClaim.data", newClaim.data);

      return newClaim.data;
    } catch (error) {
      console.log(error);
      if (botNotifyUrl) {
        try {
          const errorDetails = {
            message: `Ошибка при сохранении новой заявки в 1С: ${error.message}`,
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
      throw error;
    }
  },
  // createClaim: async (data, userId) => {
  //   // console.log(data)
  //   const service = await services.getServiceItemByKey(data.service);
  //   // console.log(service)
  //   const values = [];
  //   for (const [key, value] of Object.entries(data.values)) {
  //     // console.log(`${key}: ${value}`);
  //     values.push({ key, value });
  //   }
  //   // -Field-----------------------------------------------------------------------
  //   //console.log(service.fields)
  //   const fields = values
  //     .filter((item) => {
  //       const field = service.fields.find((field) => field.idLine === item.key);
  //       if (
  //         field.component_Type.includes("TableInput") ||
  //         field.component_Type.includes("GroupFieldsInput") ||
  //         field.component_Type.includes("AddressInput")
  //       )
  //         return false;
  //       return true;
  //     })
  //     .map((item, index) => {
  //       const field = service.fields.find((field) => field.idLine === item.key);
  //       if (field.component_Type.includes("AddressInput")) {
  //         item.value = item.value?.fullAddress;
  //         console.log(field.component_Type);
  //         console.log(item.value);
  //       }
  //       return {
  //         LineNumber: index + 1,
  //         name_Key: field.name_Key,
  //         nameOwner_Key: field.nameOwner_Key,
  //         value: item.value,
  //         value_Type: field.component_Expanded.typeOData,
  //         idLine: field.idLine,
  //       };
  //     });
  //   // // --GroupFieldsInput----------------------------------------------------------------------
  //   // values.filter(item => {
  //   //     const field = service.fields.find(field => field.idLine === item.key)
  //   //     if (field.component_Type.includes("AddressInput")) return true
  //   //     return false
  //   // }).map((item, index) => {
  //   //     const field = service.fields.find(field => field.idLine === item.key)
  //   //     return {
  //   //         LineNumber: index + 1,
  //   //         name_Key: field.name_Key,
  //   //         value: item.value?.fullAddress,
  //   //         value_Type: field.component_Expanded.typeOData,
  //   //         idLine: field.idLine,
  //   //     }
  //   // })
  //   // --GroupFieldsInput----------------------------------------------------------------------
  //   values
  //     .filter((item) => {
  //       const field = service.fields.find((field) => field.idLine === item.key);
  //       if (field.component_Type.includes("GroupFieldsInput")) return true;
  //       return false;
  //     })
  //     .forEach((item, index1) => {
  //       const field = service.fields.find((field) => field.idLine === item.key);
  //       // console.log('item',item)
  //       const arr = [];
  //       for (const [key, value] of Object.entries(item.value)) {
  //         arr.push({ key, value });
  //       }
  //       //console.log('arr',arr)
  //       arr.forEach((element, index2) => {
  //         const fieldTemp = field.component_Expanded.fields.find(
  //           (el) => el.idLine === element.key
  //         );
  //         if (
  //           !element.value &&
  //           fieldTemp.component_Expanded.typeOData === "Edm.DateTime"
  //         ) {
  //           element.value = moment("0001-01-01").format();
  //           // console.log("element.value: ",element.value);
  //         }
  //         // console.log(fieldTemp);
  //         if (fieldTemp.component_Type.includes("AddressInput")) {
  //           element.value = element.value?.fullAddress;
  //           fieldTemp.component_Expanded.typeOData = "Edm.String";
  //           console.log(element.value);
  //           console.log(fieldTemp.component_Expanded);
  //         }
  //         fields.push({
  //           LineNumber: fields.length + 1,
  //           name_Key: fieldTemp.name_Key,
  //           nameOwner_Key: field.name_Key,
  //           value: element.value,
  //           value_Type: fieldTemp.component_Expanded.typeOData
  //             ? fieldTemp.component_Expanded.typeOData
  //             : undefined,
  //           idLine: fieldTemp.idLine,
  //         });
  //       });
  //     });
  //   // -HiddenInput-----------------------------------------------------------------------
  //   service.fields
  //     .filter((field) => field.component_Type.includes("HiddenInput"))
  //     .forEach((field, index) => {
  //       console.log(index, field);
  //       fields.push({
  //         LineNumber: fields.length + 1,
  //         name_Key: field.name_Key,
  //         value: field.defaultValue,
  //         value_Type: field.defaultValue_Type,
  //       });
  //     });
  //   // -TableInput-----------------------------------------------------------------------
  //   const tableFields = [];
  //   let LineNumber = 1;
  //   values
  //     .filter((item) => {
  //       const field = service.fields.find((field) => field.idLine === item.key);
  //       if (field.component_Type.includes("TableInput")) return true;
  //       return false;
  //     })
  //     .forEach((item, index) => {
  //       const table = service.fields.find((field) => field.idLine === item.key);
  //       // console.log(table.label)
  //       item.value.forEach((valuesTable, indexRow) => {
  //         const arr = [];
  //         for (const [key, value] of Object.entries(valuesTable)) {
  //           arr.push({ key, value });
  //         }
  //         arr.forEach((tableRow) => {
  //           // if (tableRow.value && tableRow.value === "" && table.component_Expanded.fields.find(item => item.idLine === tableRow.key).component_Expanded.typeOData === "Edm.DateTime") tableRow.value = moment("0001-01-001").format()
  //           tableFields.push({
  //             LineNumber,
  //             lineNum: indexRow + 1,
  //             nameTable_Key: table.component_Expanded.nameTable_Key,
  //             name_Key: table.component_Expanded.fields.find(
  //               (item) => item.idLine === tableRow.key
  //             ).name_Key,
  //             value: tableRow.value,
  //             value_Type: table.component_Expanded.fields.find(
  //               (item) => item.idLine === tableRow.key
  //             ).component_Expanded.typeOData,
  //             idLine: table.component_Expanded.fields.find(
  //               (item) => item.idLine === tableRow.key
  //             ).idLine,
  //           });
  //           LineNumber = LineNumber + 1;
  //         });
  //       });
  //     });

  //   const newClaim = await axios.post(
  //     `${server1c}/Document_claimsProject?$format=json`,
  //     {
  //       fields,
  //       tableFields,
  //       Date: moment().format(),
  //       template_Key: data.service,
  //       versionChecksum: service.versionChecksum,
  //       idVersion: service.idVersion,
  //       // profile: userId
  //     },
  //     {
  //       headers,
  //     }
  //   );
  //   if (!newClaim.data) {
  //     return false;
  //   }
  //   const connectionsOfElements = await axios.post(
  //     `${server1c}/InformationRegister_connectionsOfElements?$format=json`,
  //     {
  //       Period: moment().format(),
  //       usage: true,
  //       element1: userId,
  //       element1_Type: "StandardODATA.Catalog_profile",
  //       element2: newClaim.data.Ref_Key,
  //       element2_Type: "StandardODATA.Document_claimsProject",
  //       reason: "Установка соединения с профилем при создании заявки",
  //     },
  //     {
  //       headers,
  //     }
  //   );
  //   // console.log(response.data)
  //   return newClaim.data;
  // },
  // createNewClaim: async (data, userId) => {
  //   const values = data.values;
  //   let fields = [];
  //   let tableFields = [];

  //   // const pushToFields = (field, value, group = false) => {
  //   //     fields.push({
  //   //         name_Key: field.name_Key,
  //   //         nameOwner_Key: field.nameOwner_Key,
  //   //         label: field.label,
  //   //         value: values,
  //   //         value_Type: "Edm.String",
  //   //         idLine: field.idLine,
  //   //     })
  //   // }

  //   //Обработка адреса-------------------------------------------
  //   const handlerAddressField = (address, values) => {
  //     console.log("address: ", address);
  //     console.log("address_values: ", values);
  //     if (!values?.fullAddress) return false;
  //     return fields.push({
  //       name_Key: address.name_Key,
  //       nameOwner_Key: address.nameOwner_Key,
  //       label: address.label,
  //       value: values.fullAddress,
  //       value_Type: "Edm.String",
  //       idLine: address.idLine,
  //     });
  //   };
  //   //Обработка групп полей-------------------------------------------
  //   const handlerGroupFields = (group) => {
  //     // console.log("group: ", group);
  //     //Перебираем все поля в группе
  //     try {
  //       group.component_Expanded.fields.forEach((field) => {
  //         if (
  //           typeof values[field.idLine] === "undefined" ||
  //           values[field.idLine] === ""
  //         )
  //           return false;
  //         //Если адрес в группе
  //         if (field.component_Type.includes("AddressInput")) {
  //           return handlerAddressField(field, values[field.idLine]);
  //         }
  //         //Если группа в группе
  //         if (field.component_Type.includes("GroupFieldsInput")) {
  //           return handlerGroupFields(field);
  //         }
  //         //Если таблица
  //         if (field.component_Type.includes("TableFieldsInput")) {
  //           return handlerTableField(field, values[field.idLine]);
  //         }
  //         console.log("group: ", group);
  //         return fields.push({
  //           name_Key: field.name_Key,
  //           nameOwner_Key: group.name_Key,
  //           label: field.label,
  //           value: values[field.idLine],
  //           value_Type: field.component_Expanded.typeOData,
  //           idLine: field.idLine,
  //         });
  //       });
  //     } catch (error) {
  //       console.log(error);
  //       throw error;
  //     }
  //   };

  //   //Обработка таблиц
  //   const handlerTableField = (tableField, arrValues) => {
  //     console.log("tableField: ", tableField);
  //     console.log("values_table: ", values);
  //     arrValues.forEach((values, indexRow) => {
  //       tableField.component_Expanded.fields.forEach((field) => {
  //         // if (!values[field.idLine]) return false
  //         // //Если адрес в группе
  //         // if (field.component_Type.includes("AddressInput")) {
  //         //     return handlerAddressField(field, values[field.idLine])
  //         // }
  //         // //Если группа в таблице
  //         // if (field.component_Type.includes("GroupFieldsInput")) {
  //         //     return handlerGroupFields(field, values[field.idLine])
  //         // }
  //         return tableFields.push({
  //           name_Key: field.name_Key,
  //           lineNum: indexRow + 1,
  //           nameOwner_Key: tableField.name_Key,
  //           nameTable_Key: tableField.component_Expanded.nameTable_Key,
  //           label: field.label,
  //           value: values[field.idLine],
  //           value_Type: field.component_Expanded.typeOData,
  //           idLine: field.idLine,
  //         });
  //       });
  //     });
  //   };
  //   //-------------------------------------------

  //   //Запрос шаблона заявки из 1С
  //   const service = await services.getServiceItemByKey(data.service);

  //   //Перебор всех полей в заявке
  //   service.fields.forEach((field) => {
  //     if (values[field.idLine] === "") {
  //       return false;
  //     }

  //     //Если Divider
  //     if (field.component_Type.includes("Divider")) {
  //       return false;
  //     }

  //     //Если скрытое поле
  //     if (field.component_Type.includes("HiddenInput")) {
  //       return fields.push({
  //         // LineNumber: index + 1,
  //         name_Key: field.name_Key,
  //         nameOwner_Key: field.nameOwner_Key,
  //         label: field.label,
  //         value: field.value,
  //         value_Type: field.component_Expanded.typeOData,
  //         idLine: field.idLine,
  //       });
  //     }
  //     //Если адрес
  //     if (field.component_Type.includes("AddressInput")) {
  //       return handlerAddressField(field, values[field.idLine]);
  //     }

  //     //Если группа
  //     // console.log("field: ", field.component_Type);
  //     if (field.component_Type.includes("GroupFieldsInput")) {
  //       return handlerGroupFields(field);
  //     }
  //     //Если таблица
  //     if (field.component_Type.includes("TableInput")) {
  //       return handlerTableField(field, values[field.idLine]);
  //     }

  //     return fields.push({
  //       // LineNumber: index + 1,
  //       name_Key: field.name_Key,
  //       nameOwner_Key: field.nameOwner_Key,
  //       label: field.label,
  //       value: data.values[field.idLine],
  //       value_Type: field.component_Expanded.typeOData,
  //       idLine: field.idLine,
  //     });
  //   });
  //   fields = fields.map((item, index) => {
  //     item.LineNumber = index + 1;
  //     return item;
  //   });
  //   tableFields = tableFields.map((item, index) => {
  //     item.LineNumber = index + 1;
  //     return item;
  //   });
  //   // console.log("fields: ", fields);
  //   console.log("tableFields: ", tableFields);

  //   const newClaim = await axios.post(
  //     `${server1c}/Document_claimsProject?$format=json`,
  //     {
  //       fields,
  //       tableFields,
  //       Date: moment().format(),
  //       template_Key: data.service,
  //       versionChecksum: service.versionChecksum,
  //       idVersion: service.idVersion,
  //       // profile: userId
  //     },
  //     {
  //       headers,
  //     }
  //   );
  //   if (!newClaim.data) {
  //     return false;
  //   }
  //   const connectionsOfElements = await axios.post(
  //     `${server1c}/InformationRegister_connectionsOfElements?$format=json`,
  //     {
  //       Period: moment().format(),
  //       usage: true,
  //       element1: userId,
  //       element1_Type: "StandardODATA.Catalog_profile",
  //       element2: newClaim.data.Ref_Key,
  //       element2_Type: "StandardODATA.Document_claimsProject",
  //       reason: "Установка соединения с профилем при создании заявки",
  //     },
  //     {
  //       headers,
  //     }
  //   );

  //   return newClaim.data;

  //   return { status: "Проверка ОК" };
  // },

};

module.exports = claimsOneC;
