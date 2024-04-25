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
        fileDoc: data.fileDoc,
        confirmationDocument:data.confirmationDocument,
        addressRegistration: data.addressRegistration,
        addressResidential: data.addressResidential,
        snils: data.snils,
        phone: data.phone,
        email: data.email,        
      }]
    } else if (data.type === "ИП") {
      counterparty = [{
        __component: "subject.ip",
        inn: data.inn,
        okved: data.okved,
        firstname: data.firstname,
        lastname: data.lastname,
        secondname: data.secondname,
        confirmationDocument:data.confirmationDocument,
        addressRegistration: data.addressRegistration,
        addressResidential: data.addressResidential,
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
          //console.log(res.data)
          return res.data
        })
    } catch (error) {
      console.error("Error getting subjects", error);
      throw error;
    }
  },
  deleteSubjectItem: async (id) => {
    try {
      return await strapi.delete('subjects', id)
        .then(res => {
          //console.log(res.data)
          return res.data
        })
    } catch (error) {
      console.error("Error delete subject", error);
      throw error;
    }
  },

};

module.exports = strapiSubjects;

// const Strapi = require("strapi-sdk-js")
// require("dotenv").config();

// const serverStrapi = process.env.SERVER_DB;
// const strapi = new Strapi({
//   url: serverStrapi
// })

// const strapiSubjects = {

//   addSubject: async (data, profileId) => {
//     console.log(data)
//     let counterparty = null
//     if (data.type === "Физическое лицо") {
//       counterparty = [{
//         __component: "subject.fiz-lico",
//         firstname: data.firstname,
//         lastname: data.lastname,
//         secondname: data.secondname,
//         fileDoc: data.fileDoc,
//         confirmationDocument:data.confirmationDocument,
//         addressRegistration: data.addressRegistration,
//         addressResidential: data.addressResidential,
//         snils: data.snils,
//         phone: data.phone,
//         email: data.email,        
//       }]
//     } else if (data.type === "ИП") {
//       counterparty = [{
//         __component: "subject.ip",
//         firstname: data.firstname,
//         lastname: data.lastname,
//         secondname: data.secondname,
//       }]
//     } else if (data.type === "Юридическое лицо") {
//       counterparty = [{
//         __component: "subject.yur-lico",
//         firstname: data.firstname,
//         lastname: data.lastname,
//         secondname: data.secondname,
//       }]
//     }

//     try {
//       const newSubject = await strapi.create('subjects', {
//         name: `${data.lastname} ${data.firstname}${data.secondname ? ' ' + data.secondname : ''}`,
//         type: data.type,
//         profil: profileId,
//         counterparty
//       }, {
//         populate: ['counterparty']
//       }).then(res => res.data)
//       return newSubject;
//     } catch (error) {
//       console.error("Ошибка создания субъекта", error);
//       return error;
//     }
//   },

//   getSubjects: async (profileId) => {
//     try {
//       // Получаем субъектов, связанных с пользователем
//       return await strapi.findOne('profiles', profileId, {
//         populate: ['subjects']
//       })
//         .then(res => res.data.attributes.subjects.data)
//     } catch (error) {
//       console.error("Error getting subjects", error);
//       throw error;
//     }
//   },
//   getSubjectItem: async (id) => {
//     try {
//       return await strapi.findOne('subjects', id, {
//         populate: ['profil', 'counterparty']
//       })
//         .then(res => {
//           //console.log(res.data)
//           return res.data
//         })
//     } catch (error) {
//       console.error("Error getting subjects", error);
//       throw error;
//     }
//   },
//   deleteSubjectItem: async (id) => {
//     try {
//       return await strapi.delete('subjects', id)
//         .then(res => {
//           //console.log(res.data)
//           return res.data
//         })
//     } catch (error) {
//       console.error("Error delete subject", error);
//       throw error;
//     }
//   },

// };

// module.exports = strapiSubjects;