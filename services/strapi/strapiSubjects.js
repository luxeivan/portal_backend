const axios = require("axios");
require("dotenv").config();

const serverStrapi = process.env.SERVER_DB;

const strapi = {
  
  addSubject: async (subjectData, userId) => {
    try {
      // Предполагается, что у нас есть сущность 'subjects' в Strapi
      const response = await axios.post(`${serverStrapi}/api/subjects`, {
        data: {
          ...subjectData,
          user: userId, // Привязываем субъекта к пользователю, если требуется
        },
      });
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error("Error creating subject", error);
      throw error;
    }
  },

  getSubjects: async (userId) => {
    try {
      // Получаем субъектов, связанных с пользователем
      const response = await axios.get(
        `${serverStrapi}/api/subjects?filters[user][$eq]=${userId}`
      );
      console.log(response.data.data);
      return response.data.data;
    } catch (error) {
      console.error("Error getting subjects", error);
      throw error;
    }
  },
};

module.exports = strapiSubjects;