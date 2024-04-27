const axios = require("axios");
const bcrypt = require("bcrypt");
require("dotenv").config();

const strapiSubjects = require("../services/strapi/strapiSubjects");
const strapiRelations = require("../services/strapi/strapiRelations");


const serverStrapi = process.env.SERVER_DB;

const saltRounds = Number(process.env.PASSWORD_SALT_ROUNDS);

const strapi = {
  getUserByEmail: async (email) => {
    const response = await axios.get(
      `${serverStrapi}/api/profiles?filters[email][$eq]=${email}&populate=password`
    );
    //console.log(response.data.data[0])
    return response.data.data[0];
  },
  checkUserByEmail: async (email) => {
    const response = await axios.get(
      `${serverStrapi}/api/profiles?filters[email][$eq]=${email}&populate=password`
    );
    //console.log(response.data.data[0])
    return response.data.data[0] ? response.data.data[0].id : false;
  },
  getUserById: async (id) => {
    const response = await axios.get(
      `${serverStrapi}/api/profiles/${id}?populate=*`
    );
    console.log(response.data.data);
    return response.data.data;
  },
  createNewUser: async (email, phone, password) => {
    const hashPassword = await bcrypt.hash(password, saltRounds);
    const response = await axios.post(`${serverStrapi}/api/profiles?`, {
      data: {
        email,
        phone,
        password: hashPassword,
      },
    });
    console.log(response.data);
    return response.data;
  },
  updateUser: async (checkUser, phone, password) => {
    const hashPassword = await bcrypt.hash(password, saltRounds);
    const response = await axios.put(
      `${serverStrapi}/api/profiles/${checkUser}`,
      {
        data: {
          phone,
          password: hashPassword,
        },
      }
    );
    console.log(response.data);
    return response.data;
  },
};

strapi.addSubject = strapiSubjects.addSubject;
strapi.getSubjects = strapiSubjects.getSubjects;

// strapi.addRelation = strapiRelations.addRelation;
strapi.getRelations = strapiRelations.getRelations;



module.exports = strapi;