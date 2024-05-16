const axios = require('axios')
require('dotenv').config()

const server1c = process.env.SERVER_1C
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION
const headers = {
    "Authorization": server1c_auth
}

const servicesOneC = {
    getServicesByKey: async (key="00000000-0000-0000-0000-000000000000") => {
        try {
            const response = await axios.get(`${server1c}/Catalog_Services?$format=json&$filter=Ref_Key eq guid'${key}'`, {
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
}

module.exports = servicesOneC;