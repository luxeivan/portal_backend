const Strapi = require("strapi-sdk-js");
require("dotenv").config();

const serverStrapi = process.env.SERVER_DB;
const strapi = new Strapi({
  url: serverStrapi,
});

const strapiObjects = {
  // Функция для создания структуры данных объекта
  createObjectData: (data, profileId) => {
    const objectData = {
      // fullName: data.fullName || "Значение по умолчанию",
      // cadastralNumber: data.cadastralNumber || "Значение по умолчанию",
      // addressObject: data.addressObject || "Значение по умолчанию",
      // latitude: data.latitude || "Значение по умолчанию",
      // longitude: data.longitude || "Значение по умолчанию",
      // profil: profileId,

      fullName: data.fullName || "Значение по умолчанию",
      cadastralNumber: data.cadastralNumber || ["Значение по умолчанию"],
      addressObject: data.addressObject || "Значение по умолчанию",
      coordinates: data.coordinates || "Значение по умолчанию",
      // latitude: data.latitude || "Значение по умолчанию",
      // longitude: data.longitude || "Значение по умолчанию",
      profil: profileId,
    };
    return objectData;
  },

  // Функция для добавления нового объекта в систему с использованием Strapi API.
  // addObject: async (data, profileId) => {
  //   const objectData = strapiObjects.createObjectData(data, profileId);
  //   try {
  //     const newObject = await strapi.create("objects", objectData, {
  //       populate: ["counterparty"],
  //     });
  //     return newObject.data;
  //   } catch (error) {
  //     console.error("Ошибка создания объекта", error);
  //     return error;
  //   }
  // },
  addObject: async (data, profileId) => {
    const objectData = strapiObjects.createObjectData(data, profileId);
    try {
      const newObject = await strapi.create("objects", objectData);
      return newObject.data;
    } catch (error) {
      console.error("Ошибка создания объекта", error);
      return error;
    }
  },

  // Функция для получения списка всех объектов, связанных с определенным профилем пользователя.
  getObjects: async (profileId) => {
    try {
      // Получаем объекты, связанные с пользователем
      return await strapi
        .findOne("profiles", profileId, {
          populate: ["objects"],
        })
        .then((res) => res.data.attributes.objects.data);
    } catch (error) {
      console.error("Error getting objects", error);
      throw error;
    }
  },

  // Функция для получения детальной информации о конкретном объекте по его ID.
  getObjectItem: async (id) => {
    try {
      return await strapi
        .findOne("objects", id, {
          populate: ["profil", "counterparty"],
        })
        .then((res) => {
          //console.log(res.data)
          return res.data;
        });
    } catch (error) {
      console.error("Error getting objects", error);
      throw error;
    }
  },

  // Функция для удаления объекта из системы по его ID.
  deleteObjectItem: async (id) => {
    try {
      return await strapi.delete("objects", id).then((res) => {
        //console.log(res.data)
        return res.data;
      });
    } catch (error) {
      console.error("Error delete object", error);
      throw error;
    }
  },
};

module.exports = strapiObjects;
