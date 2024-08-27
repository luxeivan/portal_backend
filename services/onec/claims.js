
//Старый с ошибкой
// const axios = require("axios");
// const moment = require("moment");
// const services = require("./services");
// require("dotenv").config();

// const server1c = process.env.SERVER_1C;
// const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;
// const headers = {
//   Authorization: server1c_auth,
// };

// const claimsOneC = {
//   getClaims: async (userId) => {
//     try {
//       const response = await axios.get(
//         `${server1c}/InformationRegister_connectionsOfElements?$format=json&$select=*&$expand=element2/Document_claimsProject/template&$filter=cast(element1,'Catalog_profile') eq guid'${userId}' and element2_Type eq 'StandardODATA.Document_claimsProject'`,
//         {
//           headers,
//         }
//       );
//       if (!response.data) {
//         return { status: "error", message: "Нет данных от сервера 1С" };
//       }
//       return { status: "success", data: response.data.value };
//     } catch (error) {
//       console.log("Ошибка при получении заявок: ", error.message);
//       return { status: "error", message: "Ошибка соединения с сервером 1С" };
//     }
//   },
//   getClaimItem: async (userId, Ref_key) => {
//     try {
//       const response = await axios.get(
//         `${server1c}/InformationRegister_connectionsOfElements?$format=json&$select=*&$expand=element2/Document_claimsProject/template&$filter=cast(element1,'Catalog_profile') eq guid'${userId}' and cast(element2,'Document_claimsProject') eq guid'${Ref_key}'`,
//         {
//           headers,
//         }
//       );
//       if (!response.data) {
//         return false;
//       }
//       // console.log(response.data)
//       return response.data.value[0].element2_Expanded;
//     } catch (error) {
//       console.log(error);
//       return error;
//     }
//   },
//   createClaim: async (data, userId) => {
//     // console.log(data)
//     const service = await services.getServiceItemByKey(data.service);
//     // console.log(service)
//     const values = [];
//     for (const [key, value] of Object.entries(data.values)) {
//       // console.log(`${key}: ${value}`);
//       values.push({ key, value });
//     }
//     // ------------------------------------------------------------------------
//     const fields = values
//       .filter((item) => {
//         const field = service.fields.find((field) => field.idLine === item.key);
//         if (
//           field.component_Type.includes("TableInput") ||
//           field.component_Type.includes("GroupFieldsInput")
//         )
//           return false;
//         return true;
//       })
//       .map((item, index) => {
//         const field = service.fields.find((field) => field.idLine === item.key);
//         // console.log('field',field)
//         return {
//           LineNumber: index + 1,
//           name_Key: field.name_Key,
//           value: item.value ? item.value : undefined,
//           value_Type: item.value
//             ? field.component_Expanded.typeOData
//             : undefined,
//           idLine: field.idLine,
//         };
//       });
//     // ------------------------------------------------------------------------
//     values
//       .filter((item) => {
//         const field = service.fields.find((field) => field.idLine === item.key);
//         if (field.component_Type.includes("GroupFieldsInput")) return true;
//         return false;
//       })
//       .forEach((item, index1) => {
//         const field = service.fields.find((field) => field.idLine === item.key);
//         // console.log('item',item)
//         const arr = [];
//         for (const [key, value] of Object.entries(item.value)) {
//           arr.push({ key, value });
//         }
//         // console.log('arr',arr)
//         arr.forEach((element, index2) => {
//           fields.push({
//             LineNumber: fields.length + 1,
//             name_Key: field.component_Expanded.fields.find(
//               (el) => el.idLine === element.key
//             ).name_Key,
//             nameOwner_Key: field.name_Key,
//             value: element.value,
//             value_Type: field.component_Expanded.fields.find(
//               (el) => el.idLine === element.key
//             ).component_Expanded.typeOData,
//             idLine: field.component_Expanded.fields.find(
//               (el) => el.idLine === element.key
//             ).idLine,
//           });
//         });
//       });
//     // ------------------------------------------------------------------------
//     service.fields
//       .filter((field) => field.component_Type.includes("HiddenInput"))
//       .forEach((field, index) => {
//         //console.log(index, field)
//         fields.push({
//           LineNumber: fields.length + 1 + index,
//           name_Key: field.name_Key,
//           value: field.component_Expanded.value,
//           value_Type: field.component_Expanded.value_Type,
//         });
//       });
//     // ------------------------------------------------------------------------
//     const tableFields = [];
//     let LineNumber = 1;
//     values
//       .filter((item) => {
//         const field = service.fields.find((field) => field.idLine === item.key);
//         if (field.component_Type.includes("TableInput")) return true;
//         return false;
//       })
//       .forEach((item, index) => {
//         const table = service.fields.find((field) => field.idLine === item.key);
//         // console.log(table.label)
//         item.value.forEach((valuesTable, indexRow) => {
//           const arr = [];
//           for (const [key, value] of Object.entries(valuesTable)) {
//             arr.push({ key, value });
//           }
//           arr.forEach((tableRow) => {
//             tableFields.push({
//               LineNumber,
//               lineNum: indexRow + 1,
//               nameTable_Key: table.component_Expanded.nameTable_Key,
//               name_Key: table.component_Expanded.fields.find(
//                 (item) => item.idLine === tableRow.key
//               ).name_Key,
//               value: tableRow.value ? tableRow.value : undefined,
//               value_Type: tableRow.value
//                 ? table.component_Expanded.fields.find(
//                     (item) => item.idLine === tableRow.key
//                   ).component_Expanded.typeOData
//                 : undefined,
//               idLine: table.component_Expanded.fields.find(
//                 (item) => item.idLine === tableRow.key
//               ).idLine,
//             });
//             LineNumber = LineNumber + 1;
//           });
//         });
//       });

//     const newClaim = await axios.post(
//       `${server1c}/Document_claimsProject?$format=json`,
//       {
//         fields,
//         tableFields,
//         Date: moment().format(),
//         template_Key: data.service,
//         // profile: userId
//       },
//       {
//         headers,
//       }
//     );
//     if (!newClaim.data) {
//       return false;
//     }
//     const connectionsOfElements = await axios.post(
//       `${server1c}/InformationRegister_connectionsOfElements?$format=json`,
//       {
//         Period: moment().format(),
//         usage: true,
//         element1: userId,
//         element1_Type: "StandardODATA.Catalog_profile",
//         element2: newClaim.data.Ref_Key,
//         element2_Type: "StandardODATA.Document_claimsProject",
//         reason: "Установка соединения с профилем при создании заявки",
//       },
//       {
//         headers,
//       }
//     );
//     // console.log(response.data)
//     return newClaim.data;
//   },
//   // Пример теста в services/onec/claims.js
//   simulateOneCFailure: async () => {
//     try {
//       const response = await axios.get(`${server1c}/wrongEndpoint`, {
//         headers,
//       });
//       return { status: "success", data: response.data };
//     } catch (error) {
//       console.log("Симуляция ошибки: ", error.message);
//       return {
//         status: "error",
//         message: "Ошибка соединения с сервером 1С (симуляция)",
//       };
//     }
//   },
// };

// module.exports = claimsOneC;

const axios = require('axios')
const moment = require('moment')
const services = require('./services')
require('dotenv').config()

const server1c = process.env.SERVER_1C
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION
const headers = {
    "Authorization": server1c_auth
}

const claimsOneC = {
    getClaims: async (userId) => {
        try {
            const response = await axios.get(`${server1c}/InformationRegister_connectionsOfElements?$format=json&$select=*&$expand=element2/Document_claimsProject/template&$filter=cast(element1,'Catalog_profile') eq guid'${userId}' and element2_Type eq 'StandardODATA.Document_claimsProject'`, {
                headers
            })
            if (!response.data) {
                return false
            }
            // console.log(response.data)
            return response.data.value

        } catch (error) {
            console.log(error)
            return error
        }
    },
    getClaimItem: async (userId, Ref_key) => {
        try {
            const response = await axios.get(`${server1c}/InformationRegister_connectionsOfElements?$format=json&$select=*&$expand=element2/Document_claimsProject/template&$filter=cast(element1,'Catalog_profile') eq guid'${userId}' and cast(element2,'Document_claimsProject') eq guid'${Ref_key}'`, {
                headers
            })
            if (!response.data) {
                return false
            }
            // console.log(response.data)
            return response.data.value[0].element2_Expanded

        } catch (error) {
            console.log(error)
            return error
        }
    },
    createClaim: async (data, userId) => {
        // console.log(data)
        const service = await services.getServiceItemByKey(data.service)
        // console.log(service)
        const values = []
        for (const [key, value] of Object.entries(data.values)) {
            // console.log(`${key}: ${value}`);
            values.push({ key, value })
        }
        // -Field-----------------------------------------------------------------------
        //console.log(service.fields)
        const fields = values.filter(item => {
            const field = service.fields.find(field => field.idLine === item.key)
            if (field.component_Type.includes("TableInput") || field.component_Type.includes("GroupFieldsInput") || field.component_Type.includes("AddressInput")) return false
            return true
        })
            .map((item, index) => {
                const field = service.fields.find(field => field.idLine === item.key)
                //console.log(index)
                if (index == 20) {
                    console.log('field', field)
                }
                return {
                    LineNumber: index + 1,
                    name_Key: field.name_Key,
                    value: item.value ? item.value : undefined,
                    value_Type: item.value ? field.component_Expanded.typeOData : undefined,
                    idLine: field.idLine,
                }
            })
        // --GroupFieldsInput----------------------------------------------------------------------
        values.filter(item => {
            const field = service.fields.find(field => field.idLine === item.key)
            if (field.component_Type.includes("GroupFieldsInput")) return true
            return false
        }).forEach((item, index1) => {
            const field = service.fields.find(field => field.idLine === item.key)
            // console.log('item',item)
            const arr = []
            for (const [key, value] of Object.entries(item.value)) {
                arr.push({ key, value })
            }
            //console.log('arr',arr)
            arr.forEach((element, index2) => {
                fields.push({
                    LineNumber: fields.length + 1,
                    name_Key: field.component_Expanded.fields.find(el => el.idLine === element.key).name_Key,
                    nameOwner_Key: field.name_Key,
                    value: element.value,
                    value_Type: field.component_Expanded.fields.find(el => el.idLine === element.key).component_Expanded.typeOData,
                    idLine: field.component_Expanded.fields.find(el => el.idLine === element.key).idLine,
                })

            })
        })
        // -HiddenInput-----------------------------------------------------------------------
        service.fields.filter(field => field.component_Type.includes('HiddenInput'))
            .forEach((field, index) => {
                console.log(index, field)
                fields.push({
                    LineNumber: fields.length + 1,
                    name_Key: field.name_Key,
                    value: field.defaultValue,
                    value_Type: field.defaultValue_Type,
                })
            })
        // -TableInput-----------------------------------------------------------------------
        const tableFields = []
        let LineNumber = 1
        values.filter(item => {
            const field = service.fields.find(field => field.idLine === item.key)
            if (field.component_Type.includes("TableInput")) return true
            return false
        })
            .forEach((item, index) => {
                const table = service.fields.find(field => field.idLine === item.key)
                // console.log(table.label)
                item.value.forEach((valuesTable, indexRow) => {
                    const arr = []
                    for (const [key, value] of Object.entries(valuesTable)) {
                        arr.push({ key, value })
                    }
                    arr.forEach(tableRow => {
                        tableFields.push({
                            LineNumber,
                            lineNum: indexRow + 1,
                            nameTable_Key: table.component_Expanded.nameTable_Key,
                            name_Key: table.component_Expanded.fields.find(item => item.idLine === tableRow.key).name_Key,
                            value: tableRow.value ? tableRow.value : undefined,
                            value_Type: tableRow.value ? table.component_Expanded.fields.find(item => item.idLine === tableRow.key).component_Expanded.typeOData : undefined,
                            idLine: table.component_Expanded.fields.find(item => item.idLine === tableRow.key).idLine,
                        })
                        LineNumber = LineNumber + 1
                    })
                })

            })

        const newClaim = await axios.post(`${server1c}/Document_claimsProject?$format=json`, {
            fields,
            tableFields,
            Date: moment().format(),
            template_Key: data.service,
            // profile: userId
        }, {
            headers
        })
        if (!newClaim.data) {
            return false
        }
        const connectionsOfElements = await axios.post(`${server1c}/InformationRegister_connectionsOfElements?$format=json`, {
            "Period": moment().format(),
            "usage": true,
            "element1": userId,
            "element1_Type": "StandardODATA.Catalog_profile",
            "element2": newClaim.data.Ref_Key,
            "element2_Type": "StandardODATA.Document_claimsProject",
            "reason": "Установка соединения с профилем при создании заявки"
        }, {
            headers
        })
        // console.log(response.data)
        return newClaim.data

    },

}

module.exports = claimsOneC;
