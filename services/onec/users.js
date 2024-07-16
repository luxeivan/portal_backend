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
                return false
            }
            console.log(response.data)
            return response.data.value[0]

        } catch (error) {
            console.log(error.message)
            return false
        }
    },
    checkUserByEmail: async (email) => {
        try {
            const response = await axios.get(`${server1c}/Catalog_profile?$format=json&$filter=email eq '${email}'`, {
                headers
            })
            if (!response.data && !response.data.value[0]) {
                return false
            }
            console.log('checkUserByEmail',response.data)
            return response.data.value[0] ? response.data.value[0].Ref_Key : false

        } catch (error) {
            console.log(error.message)
            return false
        }
    },
    getUserById: async (key) => {
        try {
            const response = await axios.get(`${server1c}/Catalog_profile(guid'${key}')?$format=json`, {
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
            const response = await axios.post(`${server1c}/Catalog_profile?$format=json`, {
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
    updateUser: async (key, phone, password) => {
        try {
            const hashPassword = await bcrypt.hash(password, saltRounds)
            const response = await axios.patch(`${server1c}/Catalog_Profile(guid'${key}')?$format=json`, {
                Phone: phone,
                Password: hashPassword
            }, {
                headers
            })
            console.log('updateUser',response.data)
            return response.data

        } catch (error) {

        }
    }
}

module.exports = usersonec;