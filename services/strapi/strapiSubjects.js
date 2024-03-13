const axios = require("axios");
require("dotenv").config();

const serverStrapi = process.env.SERVER_DB;

const strapiSubjects = {
  
  addSubject: async (subjectData, profileId) => {
    try {
      // Предполагается, что у нас есть сущность 'subjects' в Strapi
      const response = await axios.post(`${serverStrapi}/api/subjects`, {
        data: {
          ...subjectData,
          profil: profileId, // Привязываем субъекта к пользователю, если требуется
        },
      });
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error("Error creating subject", error);
      throw error;
    }
  },

  getSubjects: async (profileId) => {
    try {
      // Получаем субъектов, связанных с пользователем
      const response = await axios.get(
        `${serverStrapi}/api/profiles/${profileId}?populate=subjects`
      );
      // console.log(response.data.data);
      return response.data.data.attributes.subjects.data;
    } catch (error) {
      console.error("Error getting subjects", error);
      throw error;
    }
  },
  getSubjectItem: async (id) => {
    try {
      // Получаем субъектов, связанных с пользователем
      const response = await axios.get(
        `${serverStrapi}/api/subjects/${id}?populate[0]=profil&populate[1]=counterparty`
      );
      // console.log(response.data.data);
      return response.data.data
    } catch (error) {
      console.error("Error getting subjects", error);
      throw error;
    }
  },
};

module.exports = strapiSubjects;