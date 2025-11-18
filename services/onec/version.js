const axios = require("axios");
require("dotenv").config();

// const server1c = process.env.SERVER_1C;
const server1cHttpService = process.env.SERVER_1C_HTTP_SERVICE;
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;

const headers = {
  Authorization: server1c_auth,
};

const versionOneC = {
  getVersion: async (key) => {
    try {
      const response = await axios.get(
        `${server1cHttpService}/version`,
        {
          headers,
        }
      );
      if (!response.data) {
      }
      return response.data;
    } catch (error) {
        console.log(error);
      return false;
      
    }
  }
}

module.exports = versionOneC;