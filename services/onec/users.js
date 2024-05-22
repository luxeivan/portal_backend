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
            const response = await axios.get(`${server1c}/Catalog_Profile?$format=json&$filter=Email eq '${email}'`, {
                headers
            })
            if (!response.data) {
                return false
            }
            console.log(response.data)
            return { userid: response.data[0].objectid, ...response.data[0].elementjson }

        } catch (error) {
            console.log(error.message)
            return false
        }
    },
    checkUserByEmail: async (email) => {
        try {
            const response = await axios.get(`${server1c}/Catalog_Profile?$format=json&$filter=Email eq '${email}'`, {
                headers
            })
            if (!response.data) {
                return false
            }
            console.log(response.data)
            return response.data[0] ? response.data[0].objectid : false

        } catch (error) {
            console.log(error.message)
            return false
        }
    },
    getUserById: async (key) => {
        try {
            const response = await axios.get(`${server1c}/Catalog_Profile(guid'${key}')?$format=json`, {
                headers
            })
            if (!response.data) {
                return false
            }
            console.log(response.data)
            return response.data

        } catch (error) {
            console.log(error.message)
            return false
        }
    },
    createNewUser: async (email, phone, password) => {
        //console.log({headers})
        try {
            const hashPassword = await bcrypt.hash(password, saltRounds)
            const response = await axios.post(`${server1c}/Catalog_Profile?$format=json`, {
                Description: email,
                Email: email,
                Phone: phone,
                Password: hashPassword
            }, {
                headers
            })
            console.log(response.data)
            return response.data

        } catch (error) {
            console.log(error)
            return error
        }
    },
    updateUser: async (key, email, phone, password) => {
        try {
            const hashPassword = await bcrypt.hash(password, saltRounds)
            const response = await axios.patch(`${server1c}/Catalog_Profile(guid'${key}')?$format=json`, {
                Description: email,
                Email: email,
                Phone: phone,
                Password: hashPassword
            }, {
                headers
            })
            //console.log(response.data)
            return response.data

        } catch (error) {

        }
    }
}

module.exports = usersonec;