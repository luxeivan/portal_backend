const Strapi = require("strapi-sdk-js");
require("dotenv").config();

const serverStrapi = process.env.SERVER_DB;
const strapi = new Strapi({
  url: serverStrapi,
});

const strapiSubjects = {
  // Функция для создания структуры данных субъекта,
  // включая информацию о физическом лице, ИП или Юр. лице.
  createSubjectData: (data, profileId) => {
    // Общая структура для всех типов субъектов
    const subjectData = {
      name:
        data.type === "Физическое лицо"
          ? `${data.lastname} ${data.firstname}${
              data.secondname ? " " + data.secondname : ""
            }`
          : data.shortName || data.fullName,
      type: data.type,
      profil: profileId,
      counterparty: [],
    };

    switch (data.type) {
      case "Физическое лицо":
        subjectData.counterparty.push({
          __component: "subject.fiz-lico",
          firstname: data.firstname,
          lastname: data.lastname,
          secondname: data.secondname,
          snils: data.snils,
          phone: data.phone,
          email: data.email,
          fileDoc: data.fileDoc,
          confirmationDocument: data.confirmationDocument,
          addressRegistration: data.addressRegistration,
          addressResidential: data.addressResidential,
        });
        break;

      case "ИП":
        subjectData.counterparty.push({
          __component: "subject.ip",
          inn: data.inn,
          fullName: data.fullName,
          okved: data.okved,
          firstname: data.firstname,
          lastname: data.lastname,
          secondname: data.secondname,
          confirmationDocument: data.confirmationDocument,
          addressRegistration: data.addressRegistration,
          addressResidential: data.addressResidential,
          fileDoc: data.fileDoc,
        });
        break;

      case "Юридическое лицо":
        subjectData.counterparty.push({
          __component: "subject.yur-lico",
          inn: data.inn,
          fullName: data.fullName,
          shortName: data.shortName,
          numberEgrul: data.numberEgrul,
          dateIssueEgrul: data.dateIssueEgrul,
          kpp: data.kpp,
          okved: data.okved,
          fullNameDirector: data.fullNameDirector,
          jobTitle: data.jobTitle,
          foundingPosition: data.foundingPosition,
          fullNameRepresentative: data.fullNameRepresentative,
          jobTitleRepresentative: data.jobTitleRepresentative,
          foundingRepresentative: data.foundingRepresentative,
          urAddress: data.urAddress,
          mailingAddress: data.mailingAddress,
          fileDoc: data.fileDoc,
        });
        break;
      // ... другие типы субъектов по необходимости
    }
    return subjectData;
  },

  // Функция для добавления нового субъекта в систему с использованием Strapi API.
  addSubject: async (data, profileId) => {
    const subjectData = strapiSubjects.createSubjectData(data, profileId);
    try {
      const newSubject = await strapi.create("subjects", subjectData, {
        populate: ["counterparty"],
      });
      return newSubject.data;
    } catch (error) {
      console.error("Ошибка создания субъекта", error);
      return error;
    }
  },

  // Функция для получения списка всех субъектов, связанных с определенным профилем пользователя.
  getSubjects: async (profileId) => {
    try {
      // Получаем субъектов, связанных с пользователем
      return await strapi
        .findOne("profiles", profileId, {
          populate: ["subjects"],
        })
        .then((res) => res.data.attributes.subjects.data);
    } catch (error) {
      console.error("Error getting subjects", error);
      throw error;
    }
  },

  // Функция для получения детальной информации о конкретном субъекте по его ID.
  getSubjectItem: async (id) => {
    try {
      return await strapi
        .findOne("subjects", id, {
          populate: ["profil", "counterparty"],
        })
        .then((res) => {
          //console.log(res.data)
          return res.data;
        });
    } catch (error) {
      console.error("Error getting subjects", error);
      throw error;
    }
  },

  // Функция для удаления субъекта из системы по его ID.
  deleteSubjectItem: async (id) => {
    try {
      return await strapi.delete("subjects", id).then((res) => {
        //console.log(res.data)
        return res.data;
      });
    } catch (error) {
      console.error("Error delete subject", error);
      throw error;
    }
  },
};

module.exports = strapiSubjects;
