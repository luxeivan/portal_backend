// const axios = require("axios");
const Strapi = require("strapi-sdk-js")
require("dotenv").config();

const serverStrapi = process.env.SERVER_DB;
const strapi = new Strapi({
  url: serverStrapi
})

const strapiSubjects = {

  addSubject: async (data, profileId) => {
    console.log(data)
    let counterparty = null
    if (data.type === "Физическое лицо") {
      counterparty = [{
        __component: "subject.fiz-lico",
        firstname: data.firstname,
        lastname: data.lastname,
        secondname: data.secondname,
        snils: data.snils,
        fileDoc: data.fileDoc,
        typeDoc: data.typeDoc,
        addressRegistration: data.addressRegistration,
        addressRegistrationFias: data.addressRegistrationFias,
        addressResidential: data.addressResidential,
        addressResidentialFias: data.addressResidentialFias,
        phone: data.phone,
        email: data.email,
        passport: {
          serialPassport: data.serialPassport,
          numberPassport: data.numberPassport,
          kodPodrazdelenia: data.kodPodrazdelenia,
          kemVidan: data.kemVidan,
          dateIssue: data.dateIssue,
        },
        otherDoc: {
          numberOtherDoc: data.numberOtherDoc,
          typeOtherDoc: data.typeOtherDoc,
          recvizityOthetDoc: data.recvizityOthetDoc,
          kemVidanOthetDoc: data.kemVidanOthetDoc,
          dateIssueOthetDoc: data.dateIssueOthetDoc,
        }
      }]
    } else if (data.type === "ИП") {
      counterparty = [{
        __component: "subject.ip",
        firstname: data.firstname,
        lastname: data.lastname,
        secondname: data.secondname,
      }]
    } else if (data.type === "Юридическое лицо") {
      counterparty = [{
        __component: "subject.yur-lico",
        firstname: data.firstname,
        lastname: data.lastname,
        secondname: data.secondname,
      }]
    }

    try {
      const newSubject = await strapi.create('subjects', {
        name: `${data.lastname} ${data.firstname}${data.secondname ? ' ' + data.secondname : ''}`,
        type: data.type,
        profil: profileId,
        counterparty
      }, {
        populate: ['counterparty']
      }).then(res => res.data)
      return newSubject;
    } catch (error) {
      console.error("Ошибка создания субъекта", error);
      return error;
    }
  },

  getSubjects: async (profileId) => {
    try {
      // Получаем субъектов, связанных с пользователем
      return await strapi.findOne('profiles', profileId, {
        populate: ['subjects']
      })
        .then(res => res.data.attributes.subjects.data)
    } catch (error) {
      console.error("Error getting subjects", error);
      throw error;
    }
  },
  getSubjectItem: async (id) => {
    try {
      return await strapi.findOne('subjects', id, {
        populate: ['profil', 'counterparty']
      })
        .then(res => {
          console.log(res.data)
          return res.data
        })
    } catch (error) {
      console.error("Error getting subjects", error);
      throw error;
    }
  },
};

module.exports = strapiSubjects;