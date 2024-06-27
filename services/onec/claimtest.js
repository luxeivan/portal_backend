const axios = require('axios')
require('dotenv').config()

const server1c = process.env.SERVER_1CTEST
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION
const headers = {
    "Authorization": server1c_auth
}

const claimsOneC = {
    getClaims: async (userId) => {
        try {
            const response = await axios.get(`${server1c}/Document_Claims?$format=json&$filter=profile eq '${userId}'`)
            if (!response.data) {
                return false
            }
            // console.log(response.data)
            return response.data

        } catch (error) {
            console.log(error)
            return error
        }
    },
    createClaim: async (data, userId) => {
        try {
            const response = await axios.post(`${server1c}/Document_Claims?$format=json`, {
                ...data,
                profile: userId
            })
            if (!response.data) {
                return false
            }
            // console.log(response.data)
            return response.data

        } catch (error) {
            console.log(error)
            return error
        }
    },

}

module.exports = claimsOneC;