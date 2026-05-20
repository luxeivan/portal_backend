const axios = require("axios");
const moment = require("moment");
const services = require("./services");
require("dotenv").config();

const server1c = process.env.SERVER_1C;
const server1cHttpService = process.env.SERVER_1C_HTTP_SERVICE;
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;
// const botNotifyUrl = process.env.BOT_NOTIFY_URL || "http://127.0.0.1:3001/notifyError";

const headers = {
  Authorization: server1c_auth,
};

// ---------------------------------------------------------------------------------
const claimsOneC = {
  getClaims: async (userId, page = 1, pageSize = 10, filters = false, sort = false, dataset = false) => {
    let url = `${server1cHttpService}/profile/${userId}/claims?page=${page}&pageSize=${pageSize}`
    if (filters) {
      url = url + `&filters=${filters}`
    }
    if (sort) {
      url = url + `&sort=${sort}`
    }
    if (dataset) {
      url = url + `&dataset=${dataset}`
    }

    console.log("urlclaimsOneC", url)
    try {
      const response = await axios.get(url, { headers, });
      if (!response.data) {
        return false;
      }
      return response.data;
    } catch (error) {
      console.log(error);
      return error;
    }
  },

  // ---------------------------------------------------------------------------------
  // getClaims1: async (userId) => {
  //   try {
  //     const response = await axios.get(
  //       `${server1c}/InformationRegister_connectionsOfElements?$format=json&$select=*&$expand=element2/Document_claimsProject/template&$filter=cast(element1,'Catalog_profile') eq guid'${userId}' and element2_Type eq 'StandardODATA.Document_claimsProject'`,
  //       {
  //         headers,
  //       }
  //     );
  //     if (!response.data) {
  //       return false;
  //     }
  //     // console.log(response.data)
  //     return response.data.value;
  //   } catch (error) {
  //     console.log(error);
  //     return error;
  //   }
  // },

  // ---------------------------------------------------------------------------------
  getClaimItem: async (userId, Ref_key, dataSet = 'first', processTree = false) => {
    let url = `${server1cHttpService}/profile/${userId}/claims/${Ref_key}?dataSet=${dataSet}&processTreeId=${processTree}`
    try {
      // console.log("url", url);
      const response = await axios.get(url, { headers, });
      if (!response.data) {
        return false;
      }
      // console.log("response", response.data)
      return response.data;
    } catch (error) {
      console.log(error);
      return error;
    }
  },
  // ---------------------------------------------------------------------------------
  createNewClaim1: async (data, userId) => {
    let url = `${server1cHttpService}/profile/${userId}/claims`
    try {
      const newClaim = await axios.post(url, { ...data, }, { headers, });
      if (!newClaim.data) {
        return false;
      }
      // console.log("newClaim.data", newClaim.data);
      return newClaim.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  },

};

module.exports = claimsOneC;
