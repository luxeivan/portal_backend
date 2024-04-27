const Strapi = require("strapi-sdk-js");
require("dotenv").config();

const serverStrapi = process.env.SERVER_DB;
const strapi = new Strapi({
  url: serverStrapi,
});

const strapiRelations = {
  // Функция для получения списка всех субъектов, связанных с определенным профилем пользователя.
  getRelations: async (profileId) => {
    try {
      // Получаем доверенности, связанных с пользователем
      return await strapi
        .findOne("profiles", profileId, {
          populate: ["relations"],
        })
        .then((res) => res.data.attributes.relations.data);
    } catch (error) {
      console.error("Error getting relations", error);
      throw error;
    }
  },

  // Функция для получения детальной информации о доверенности по его ID.
  getRelationItem: async (id) => {
    try {
      return await strapi
        .findOne("relations", id, {
          populate: ["profil", "counterparty"],
        })
        .then((res) => {
          //console.log(res.data)
          return res.data;
        });
    } catch (error) {
      console.error("Error getting relations", error);
      throw error;
    }
  },

  // Функция для удаления доверенности из системы по его ID.
  deleteRelationItem: async (id) => {
    try {
      return await strapi.delete("relations", id).then((res) => {
        //console.log(res.data)
        return res.data;
      });
    } catch (error) {
      console.error("Error delete relation", error);
      throw error;
    }
  },

  // >>> ВНИМАНИЕ: другие функции с субъекта не дублировал, х.з нужны они или нет
};

module.exports = strapiRelations;
