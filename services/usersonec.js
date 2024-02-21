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
            const response = await axios.get(`${server1c}/users?email=${email}`, {
                headers
            })
            if (!response.data) {
                return false
            }
            //console.log(response.data[0])
            return { userid: response.data[0].objectid, ...response.data[0].elementjson }

        } catch (error) {
            console.log(error.message)
            return false
        }
    },
    checkUserByEmail: async (email) => {
        try {
            const response = await axios.get(`${server1c}/users?email=${email}`, {
                headers
            })
            if (!response.data) {
                return false
            }
            console.log(response.data[0])
            return response.data[0] ? response.data[0].objectid : false

        } catch (error) {
            console.log(error.message)
            return false
        }
    },
    getUserById: async (id) => {
        try {
            const response = await axios.get(`${server1c}/users/${id}`, {
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
            const response = await axios.post(`${server1c}/users/${uuidv4()}`, {
                email,
                phone,
                password: hashPassword
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
    updateUser: async (checkUser, email, phone, password) => {
        try {
            const hashPassword = await bcrypt.hash(password, saltRounds)
            const response = await axios.post(`${server1c}/users/${checkUser}`, {
                email,
                phone,
                password: hashPassword
            }, {
                headers
            })
            console.log(response.data)
            return response.data

        } catch (error) {

        }
    }
}

module.exports = usersonec;