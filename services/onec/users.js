const axios = require('axios')
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
require('dotenv').config()

const server1c = process.env.SERVER_1C
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION
const headers = {
    "Authorization": server1c_auth
}

const saltRounds = Number(process.env.PASSWORD_SALT_ROUNDS)

const usersonec = {
    getUserByEmail: async (email) => {
        try {
            const response = await axios.get(`${server1c}/Catalog_profile?$format=json&$filter=email eq '${email}'`, {
                headers
            })
            if (!response.data) {
                throw new Error("Что-то пошло не так при получении данных профиля.");
            }
            // console.log(response.data)
            return response.data.value[0]

        } catch (error) {
            console.log(error.message)
            throw new Error("Что-то пошло не так при получении данных профиля.");
        }
    },
    checkUserByEmail: async (email) => {
        try {
            const response = await axios.get(`${server1c}/Catalog_profile?$format=json&$filter=email eq '${email}'`, {
                headers
            })
            if (!response.data && !response.data.value[0]) {
                throw new Error("Что-то пошло не так при получении данных профиля.");
            }
            // console.log('checkUserByEmail',response.data)
            return response.data.value[0] ? response.data.value[0].Ref_Key : false

        } catch (error) {
            console.log(error.message)
            throw new Error("Что-то пошло не так при получении данных профиля.");
        }
    },
    getUserById: async (key) => {
        try {
            const response = await axios.get(`${server1c}/Catalog_profile(guid'${key}')?$format=json`, {
                headers
            })
            if (!response.data) {
                throw new Error("Что-то пошло не так при получении данных профиля.");
            }
            // console.log(response.data)
            return response.data

        } catch (error) {
            console.log(error.message)
            throw new Error("Что-то пошло не так при получении данных профиля.");
        }
    },
    createNewUser: async (email, phone, password) => {
        //console.log({headers})
        try {
            const hashPassword = await bcrypt.hash(password, saltRounds)
            const response = await axios.post(`${server1c}/Catalog_profile?$format=json`, {
                Description: email,
                email: email,
                phone: phone,
                password: hashPassword
            }, {
                headers
            })
            // console.log(response.data)
            return response.data

        } catch (error) {
            console.log(error.message)
            throw new Error("Что-то пошло не так при получении данных профиля.");
        }
    },
    updateUser: async (key, phone, password) => {
        const data = {}
        if (phone) data.phone = phone;
        if (password) data.password = await bcrypt.hash(password, saltRounds);
        try {
            // const hashPassword = await bcrypt.hash(password, saltRounds)
            const response = await axios.patch(`${server1c}/Catalog_profile(guid'${key}')?$format=json`, data, {
                headers
            })
            console.log('updateUser', response.data)
            return response.data

        } catch (error) {
            console.log(error.message)
            throw new Error("Что-то пошло не так при получении данных профиля.");
        }
    }
}

module.exports = usersonec;