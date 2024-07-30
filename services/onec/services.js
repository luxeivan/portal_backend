// const axios = require("axios");
// const moment = require("moment");
// require("dotenv").config();

// const server1c = process.env.SERVER_1C;
// const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;
// const headers = {
//   Authorization: server1c_auth,
// };

// const servicesOneC = {
//   getServicesByKey: async (key = "00000000-0000-0000-0000-000000000000") => {
//     try {
//       const response = await axios.get(
//         `${server1c}/Catalog_services_broken?$format=json&$filter=DeletionMark eq false and usage eq true and Parent_Key eq guid'${key}' and (( year(beginDate) eq 0001 or (year(beginDate) le ${moment().year()} и month(beginDate) le ${
//           moment().month() + 1
//         } и day(beginDate) le ${moment().date()})) и ( year(endDate) eq 0001 или (year(endDate) ne 0001 и year(endDate) ge ${moment().year()} и month(endDate) ge ${moment().month()} и day(endDate) ge ${moment().date()})))`,
//         {
//           headers,
//         }
//       );
//       if (!response.data) {
//         return false;
//       }
//       return response.data;
//     } catch (error) {
//       console.log("Ошибка в getServicesByKey:", error.message);
//       console.log(
//         "Подробности ошибки:",
//         error.response ? error.response.data : "Нет данных ответа"
//       );
//       return false;
//     }
//   },
//   getServiceItemByKey: async (key) => {
//     console.log(key);
//     try {
//       const resp = await Promise.all([
//         axios.get(
//           `${server1c}/Catalog_services_broken?$format=json&$filter=DeletionMark eq false и usage eq true и Ref_Key eq guid'${key}'`,
//           {
//             headers,
//           }
//         ),
//         axios.get(
//           `${server1c}/InformationRegister_portalFields?$format=json&$select=*&$expand=name,component,dependName,dependСondition&$filter=cast(object,'Catalog_services') eq guid'${key}'`,
//           {
//             headers,
//           }
//         ),
//       ]);

//       try {
//         resp[0].data.value[0].fields = await Promise.all(
//           resp[1].data.value.map((item, index) => {
//             return new Promise(async (resolve, reject) => {
//               if (item.component_Type.includes("TableInput")) {
//                 const tableFields = await axios.get(
//                   `${server1c}/InformationRegister_portalFields?$format=json&$select=*&$expand=name,component,dependName,dependСondition&$filter=cast(object,'Catalog_componentsTableInput') eq guid'${item.component}'`,
//                   {
//                     headers,
//                   }
//                 );
//                 item.component_Expanded.fields = tableFields.data.value.sort(
//                   (a, b) => a.lineNum - b.lineNum
//                 );
//               }
//               resolve(item);
//             });
//           })
//         );
//       } catch (error) {
//         console.log("Ошибка при обработке полей:", error.message);
//         console.log(
//           "Подробности ошибки:",
//           error.response ? error.response.data : "Нет данных ответа"
//         );
//         return false;
//       }

//       console.log("resp", resp[0].data.value[0]);
//       return resp[0].data.value[0];
//     } catch (error) {
//       console.log("Ошибка в getServiceItemByKey:", error.message);
//       console.log(
//         "Подробности ошибки:",
//         error.response ? error.response.data : "Нет данных ответа"
//       );
//       return { status: "error" };
//     }
//   },
// };

// module.exports = servicesOneC;

//Старый код до моих исправлений
const axios = require("axios");
const moment = require("moment");
require("dotenv").config();

const server1c = process.env.SERVER_1C;
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;
const headers = {
  Authorization: server1c_auth,
};

const servicesOneC = {
  getServicesByKey: async (key = "00000000-0000-0000-0000-000000000000") => {
    try {
      const response = await axios.get(
        `${server1c}/Catalog_services?$format=json&$filter=DeletionMark eq false and usage eq true and Parent_Key eq guid'${key}' and (( year(beginDate) eq 0001 or (year(beginDate) le ${moment().year()} and month(beginDate) le ${moment().month() + 1
        } and day(beginDate) le ${moment().date()})) and ( year(endDate) eq 0001 or (year(endDate) ne 0001 and year(endDate) ge ${moment().year()} and month(endDate) ge ${moment().month()} and day(endDate) ge ${moment().date()})))`,
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
      return false;
    }
  },
  getServiceItemByKey: async (key) => {
    // console.log(key);
    try {
      const resp = await Promise.all([
        axios.get(
          `${server1c}/Catalog_services?$format=json&$filter=DeletionMark eq false and usage eq true and Ref_Key eq guid'${key}'`,
          {
            headers,
          }
        ),
        axios.get(
          `${server1c}/InformationRegister_portalFields?$format=json&$select=*&$expand=name,component,dependName,dependСondition&$filter=cast(object,'Catalog_services') eq guid'${key}'`,
          {
            headers,
          }
        ),
      ]);
      // const response = await axios.get(`${server1c}/Catalog_Services?$format=json&$filter=DeletionMark eq false and Usage eq true and Ref_Key eq guid'${key}'`, {
      //     headers
      // })
      // if (!response.data) {
      //     return false
      // }
      // console.log(resp[1].data.value)
      // const Fields = []
      // let IdLineTable = false
      // let tempArr = []
      // resp[1].data.value.sort((a, b) => a.lineNum - b.lineNum).forEach(element => {
      //     if (element.nameTable) {
      //         IdLineTable = element.IdLineTable
      //         tempArr.push(element)
      //         // if (!Object.hasOwn(temp, element.nameTable_Key)) temp[element.nameTable_Key] = []
      //         // temp[element.nameTable_Key].pu
      //     } else if (!element.nameTable && IdLineTable) {
      //         Fields.push({component_Type:'ComponentsTableInput', idLine: IdLineTable, Fields: tempArr })
      //         IdLineTable = false
      //         tempArr = []
      //     } else {
      //         Fields.push(element)
      //     }
      // });
      // resp[0].data.value[0].Fields = Fields
      try {
        resp[0].data.value[0].fields = await Promise.all(
          resp[1].data.value.map((item, index) => {
            return new Promise(async (resolve, reject) => {
              // -------------Если таблица
              if (item.component_Type.includes("TableInput")) {
                const tableFields = await axios.get(
                  `${server1c}/InformationRegister_portalFields?$format=json&$select=*&$expand=name,component,dependName,dependСondition&$filter=cast(object,'Catalog_componentsTableInput') eq guid'${item.component}'`,
                  {
                    headers,
                  }
                );
                console.log('tableFields.data.value', tableFields.data.value)
                tableFields.data.value = await Promise.all(tableFields.data.value.map(tableField => {
                  return new Promise(async (resolve, reject) => {
                    if (tableField.component_Type.includes("LinkInput") && tableField.component_Expanded.allValues) {
                      // console.log(item.component_Expanded.linkUrl)
                      const allValues = await axios.get(
                        `${server1c}${tableField.component_Expanded.linkUrl}`,
                        {
                          headers,
                        }
                      );
                      // console.log('allValues', allValues.data.value)
                      tableField.component_Expanded.options = allValues.data.value.sort((a, b) => {
                        if (a.Description.toLowerCase() < b.Description.toLowerCase()) {
                          return -1;
                        }
                        if (a.Description.toLowerCase() > b.Description.toLowerCase()) {
                          return 1;
                        }
                        return 0;
                      }).map(item => ({ value: item.Ref_Key, label: item.Description }))
                    }
                    resolve(tableField)
                  })
                }))
                // console.log(tableFields.data.value)
                item.component_Expanded.fields = tableFields.data.value.sort(
                  (a, b) => a.lineNum - b.lineNum
                );
              }
              // -------------Если LinkInput (ссылка на справочник и установлен флаг allValues)
              if (item.component_Type.includes("LinkInput") && item.component_Expanded.allValues) {
                console.log(item.component_Expanded.linkUrl)
                const allValues = await axios.get(
                  `${server1c}${item.component_Expanded.linkUrl}`,
                  {
                    headers,
                  }
                );
                // console.log('allValues', allValues.data.value)
                item.component_Expanded.options = allValues.data.value.sort((a, b) => {
                  if (a.Description.toLowerCase() < b.Description.toLowerCase()) {
                    return -1;
                  }
                  if (a.Description.toLowerCase() > b.Description.toLowerCase()) {
                    return 1;
                  }
                  return 0;
                }).map(item => ({ value: item.Ref_Key, label: item.Description }))
              }
              // -------------Если GroupFieldsInput
              if (item.component_Type.includes("GroupFieldsInput")) {
                const tableFields = await axios.get(
                  `${server1c}/InformationRegister_portalFields?$format=json&$select=*&$expand=name,component,dependName,dependСondition&$filter=cast(object,'Catalog_componentsGroupFieldsInput') eq guid'${item.component}'`,
                  {
                    headers,
                  }
                );
                // console.log(tableFields.data.value)
                item.component_Expanded.fields = tableFields.data.value.sort(
                  (a, b) => a.lineNum - b.lineNum
                );
              }
              resolve(item);
            });
          })
        );
      } catch (error) {
        console.log(error);
        return false;
      }

      // resp[0].data.value[0].Fields = resp[1].data.value
      // console.log(resp[0].data.value)
      // console.log(resp[1].data)
      // console.log("resp", resp[0].data.value[0]);
      return resp[0].data.value[0];
    } catch (error) {
      console.log(error);
      return { status: "error" };
    }
  },
};

module.exports = servicesOneC;
