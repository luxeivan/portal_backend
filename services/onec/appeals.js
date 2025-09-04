const axios = require("axios");
// const moment = require("moment");
require("dotenv").config();

// const server1c = process.env.SERVER_1C;
const server1cHttpService = process.env.SERVER_1C_HTTP_SERVICE;
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;


const headers = {
    Authorization: server1c_auth,
};

const appealsOneC = {
    getAppealsList: async () => {
        try {
            const response = await axios.get(
                `${server1cHttpService}/appeals/folder/all`,
                {
                    headers,
                }
            );
            // console.log(response.data.data);

            if (!response.data) {
                return false;
            }
            return response.data.data;
        } catch (error) {
            return false;

        }
    },
    getAppealsByClaims: async (userId, id) => {
        try {
            const response = await axios.get(
                `${server1cHttpService}/profile/${userId}/appeals/${id}`,
                {
                    headers,
                }
            );
            // console.log(response.data.data);

            if (!response.data) {
                return false;
            }
            return response.data.data;
        } catch (error) {
            return false;

        }
    },
    getAppeal: async (id) => {
        try {
            const response = await axios.get(
                `${server1cHttpService}/portalFields/appeals/${id}`,
                {
                    headers,
                }
            );
            // console.log(response.data);

            if (!response.data) {
                return false;
            }
            return response.data.data;
        } catch (error) {
            return false;
        }
    },
    createNewAppeal: async (userId, data) => {
        try {
            const response = await axios.post(
                `${server1cHttpService}/profile/${userId}/appeals`,
                {
                    ...data
                },
                {
                    headers,
                }
            );

            if (!response.data) {
                return false;
            }
            return response.data.data;
        } catch (error) {
            console.log(error);
            return false;

        }

    },
    readAnswerOfAppeal: async (userId, id) => {
        // console.log("id",id);
        
        try {
            const response = await axios.get(
                `${server1cHttpService}/profile/${userId}/appeals/${id}/readAnswer`,
                {
                    headers,
                }
            );

            if (!response.data) {
                return false;
            }
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }
}

module.exports = appealsOneC;