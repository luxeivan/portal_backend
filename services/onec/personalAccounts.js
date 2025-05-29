const axios = require("axios");
const moment = require("moment");
const services = require("./services");
require("dotenv").config();

const server1c = process.env.SERVER_1C;
const server1cHttpService = process.env.SERVER_1C_HTTP_SERVICE;
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;
const botNotifyUrl =
    process.env.BOT_NOTIFY_URL || "http://127.0.0.1:3001/notifyError";

const headers = {
    Authorization: server1c_auth,
};

const personalAccountsOneC = {
    getPersonalAccounts: async (userId) => {
        try {
            const response = await axios.get(
                `${server1cHttpService}/profile/${userId}/personalAccounts`,
                {
                    headers,
                }
            );
            if (!response.data) {
                return false;
            }
            // console.log("getPersonalAccounts", response.data);
            return response.data;
        } catch (error) {
            if (botNotifyUrl) {
                try {
                    const errorDetails = {
                        message: `Ошибка при получении данных из 1C: ${error.message}`,
                        error: {
                            config: {
                                url: error?.config?.url,
                                method: error?.config?.method,
                            },
                            response: {
                                status: error?.response?.status,
                                statusText: error?.response?.statusText,
                                data: error?.response?.data,
                            },
                            code: error?.code,
                            message: error?.message || error?.response?.data?.message,
                        },
                    };
                    await axios.post(botNotifyUrl, errorDetails);
                } catch (notifyErr) {
                    console.error("Не смогли оповестить бота:", notifyErr);
                }
            }
            console.log(error);
            return error;
        }
    },
    getPersonalAccountItem: async (userId, key) => {
        try {
            const response = await axios.get(
                `${server1cHttpService}/profile/${userId}/personalAccounts/${key}`,
                {
                    headers,
                }
            );
            if (!response.data) {
                return false;
            }
            // console.log("getPersonalAccounts", response.data);
            return response.data;
        } catch (error) {
            if (botNotifyUrl) {
                try {
                    const errorDetails = {
                        message: `Ошибка при получении данных из 1C: ${error.message}`,
                        error: {
                            config: {
                                url: error?.config?.url,
                                method: error?.config?.method,
                            },
                            response: {
                                status: error?.response?.status,
                                statusText: error?.response?.statusText,
                                data: error?.response?.data,
                            },
                            code: error?.code,
                            message: error?.message || error?.response?.data?.message,
                        },
                    };
                    await axios.post(botNotifyUrl, errorDetails);
                } catch (notifyErr) {
                    console.error("Не смогли оповестить бота:", notifyErr);
                }
            }
            console.log(error);
            return error;
        }
    },
    getClaimsByPersonalAccount: async (userId,key) => {
        try {
            const response = await axios.get(
                `${server1cHttpService}/personalAccounts/${key}/сlaims/`,
                {
                    headers,
                }
            );
            if (!response.data) {
                return false;
            }
            // console.log("getPersonalAccounts", response.data);
            return response.data;
        } catch (error) {
            if (botNotifyUrl) {
                try {
                    const errorDetails = {
                        message: `Ошибка при получении данных из 1C: ${error.message}`,
                        error: {
                            config: {
                                url: error?.config?.url,
                                method: error?.config?.method,
                            },
                            response: {
                                status: error?.response?.status,
                                statusText: error?.response?.statusText,
                                data: error?.response?.data,
                            },
                            code: error?.code,
                            message: error?.message || error?.response?.data?.message,
                        },
                    };
                    await axios.post(botNotifyUrl, errorDetails);
                } catch (notifyErr) {
                    console.error("Не смогли оповестить бота:", notifyErr);
                }
            }
            console.log(error);
            return error;
        }
    },
};

module.exports = personalAccountsOneC;
