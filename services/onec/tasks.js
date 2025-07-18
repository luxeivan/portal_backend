const axios = require("axios");
const moment = require("moment");
require("dotenv").config();

// const server1c = process.env.SERVER_1C;
const server1cHttpService = process.env.SERVER_1C_HTTP_SERVICE;
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;


const headers = {
    Authorization: server1c_auth,
};

const tasksOneC = {
    getActionById: async (id) => {
        try {
            const response = await axios.get(
                `${server1cHttpService}/portalFields/tasks/${id}`,
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
    createNewTask: async (userId, data) => {
        try {
            const response = await axios.post(
                `${server1cHttpService}/profile/${userId}/claims/${data.claimId}/tasks`,
                {
                    ...data
                },
                {
                    headers,
                }
            );
            console.log(response.data);
            
            if (!response.data) {
                return false;
            }
            return response.data.data;
        } catch (error) {
            console.log(error);
            return false;

        }

    }
}

module.exports = tasksOneC;