const axios = require("axios");
const moment = require("moment");
require("dotenv").config();

const server1c = process.env.SERVER_1C;
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;
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
      )
      if (!response.data) {
        return false;
      }
      return response.data;
    } catch (error) {

    }
  },
  getServicesByKey: async (key = "00000000-0000-0000-0000-000000000000") => {
    try {
      const response = await axios.get(
        `${server1c}/Catalog_services?$format=json&$filter=DeletionMark eq false and usage eq true and Parent_Key eq guid'${key}' and (( year(beginDate) eq 0001 or (year(beginDate) le ${moment().year()} and month(beginDate) le ${moment().month() + 1
        } and day(beginDate) le ${moment().date()})) and ( year(endDate) eq 0001 or (year(endDate) ne 0001 and year(endDate) ge ${moment().year()} and month(endDate) ge ${moment().month()} and day(endDate) ge ${moment().date()})))`,
        {
          headers,
        }
      );
      // console.log('response.data: ', response.data);

      if (!response.data) {
        return false;
      }
      await Promise.all(response.data.value.map(async item => {
        return new Promise(async (resolve, reject) => {
          if (item.picture_Key && item.picture_Key !== '00000000-0000-0000-0000-000000000000') item.picture = await servicesOneC.getPictureFile(item.picture_Key)
          resolve(item);
        })
      }))
      return response.data;
    } catch (error) {
      console.log('getServicesByKey: ', error.message);
      return false;
    }
  },
  getServiceItemByKey: async (key, withFields = true) => {
    if (key === '00000000-0000-0000-0000-000000000000') return true;
    try {
      const resp = await Promise.all([
        axios.get(
          `${server1c}/Catalog_services?$format=json&$filter=DeletionMark eq false and usage eq true and Ref_Key eq guid'${key}'`,
          {
            headers,
          }
        ),
        withFields ? axios.get(
          `${server1c}/InformationRegister_portalFields?$format=json&$select=*&$expand=name,component,dependName,dependСondition&$filter=cast(object,'Catalog_services') eq guid'${key}'`,
          {
            headers,
          }
        ) : false,
      ]);

      if (!resp[0].data || !resp[0].data.value) {
        console.log("Что-то пошло не так при получении данных.");
        throw new Error("Что-то пошло не так при получении данных.");
      }

      if (resp[0].data.value.length === 0) {
        console.log("Услуги с таким ключом не существует.");
        throw new Error("Услуги с таким ключом не существует.");
      }
      // console.log(resp[1].data.value)
      if (withFields) {
        try {
          resp[0].data.value[0].fields = await Promise.all(
            resp[1].data.value.map((item) => {
              return new Promise(async (resolve, reject) => {
                try {
                  // -------------Если таблица
                  if (item.component_Type.includes("TableInput")) {
                    const tableFields = await axios.get(
                      `${server1c}/InformationRegister_portalFields?$format=json&$select=*&$expand=name,component,dependName,dependСondition&$filter=cast(object,'Catalog_componentsTableInput') eq guid'${item.component}'`,
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
                              tableField.component_Expanded.allValues
                            ) {
                              const allValues = await axios.get(
                                `${server1c}${tableField.component_Expanded.linkUrl}`,
                                {
                                  headers,
                                }
                              );
                              tableField.component_Expanded.options =
                                allValues.data.value
                                  .sort((a, b) => {
                                    if (
                                      a.Description.toLowerCase() <
                                      b.Description.toLowerCase()
                                    ) {
                                      return -1;
                                    }
                                    if (
                                      a.Description.toLowerCase() >
                                      b.Description.toLowerCase()
                                    ) {
                                      return 1;
                                    }
                                    return 0;
                                  })
                                  .map((item) => ({
                                    value: item.Ref_Key,
                                    label: item.Description,
                                  }));
                            }
                            resolve(tableField);
                          });
                        })
                      );
                      item.component_Expanded.fields =
                        tableFields.data.value.sort(
                          (a, b) => a.lineNum - b.lineNum
                        );
                    }
                  }
                  // -------------Если LinkInput (ссылка на справочник и установлен флаг allValues)
                  if (
                    item.component_Type.includes("LinkInput") &&
                    item.component_Expanded.allValues
                  ) {
                    const allValues = await axios.get(
                      `${server1c}${item.component_Expanded.linkUrl}`,
                      {
                        headers,
                      }
                    );
                    if (allValues.data && allValues.data.value) {
                      item.component_Expanded.options = allValues.data.value
                        .sort((a, b) => {
                          if (
                            a.Description.toLowerCase() <
                            b.Description.toLowerCase()
                          ) {
                            return -1;
                          }
                          if (
                            a.Description.toLowerCase() >
                            b.Description.toLowerCase()
                          ) {
                            return 1;
                          }
                          return 0;
                        })
                        .map((item) => ({
                          value: item.Ref_Key,
                          label: item.Description,
                        }));
                    }
                  }
                  // -------------Если GroupFieldsInput
                  if (item.component_Type.includes("GroupFieldsInput")) {
                    // console.log(`${server1c}/InformationRegister_portalFields?$format=json&$select=*&$expand=name,component,dependName,dependСondition&$filter=cast(object,'Catalog_componentsGroupFieldsInput') eq guid'${item.component}'`)
                    const tableFields = await axios.get(
                      `${server1c}/InformationRegister_portalFields?$format=json&$select=*&$expand=name,component,dependName,dependСondition&$filter=cast(object,'Catalog_componentsGroupFieldsInput') eq guid'${item.component}'`,
                      {
                        headers,
                      }
                    );
                    // console.log(item)
                    if (tableFields.data && tableFields.data.value) {
                      item.component_Expanded.fields =
                        tableFields.data.value.sort(
                          (a, b) => a.lineNum - b.lineNum
                        );
                    }
                  }
                  resolve(item);
                } catch (error) {
                  reject(error);
                }
              });
            })
          );
        } catch (error) {
          console.log(error);
          throw new Error("Что-то пошло не так при получении данных.");
        }
      }
      if (resp[0].data.value[0].categoriesFiles && resp[0].data.value[0].categoriesFiles.length > 0) {
        const typeDocs = await axios.get(
          `${server1c}/Catalog_ВидыФайлов?$format=json`,
          {
            headers,
          }
        );
        console.log('typeDocs: ', typeDocs)
        resp[0].data.value[0].categoriesFiles.map(item => {
          item.categoryName = typeDocs.data.value.find(val => val.Ref_Key === item.category_Key).Description
          return item
        })
      }
      return resp[0].data.value[0];
    } catch (error) {
      console.log('getServiceItemByKey: ', error.message);
      throw new Error("Что-то пошло не так при получении данных.");
    }
  },
};

module.exports = servicesOneC;