const axios = require('axios')
require('dotenv').config()

const server1c = process.env.SERVER_1CTEST
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION
const headers = {
    "Authorization": server1c_auth
}

const servicesOneC = {
    getServicesByKey: async (key = "00000000-0000-0000-0000-000000000000") => {
        try {
            const response = await axios.get(`${server1c}/Catalog_Services?$format=json&$filter=DeletionMark eq false and ((public eq true) or (IsFolder eq true)) and Parent_Key eq guid'${key}'`,)
            if (!response.data) {
                return false
            }
            // console.log(response.data)
            return response.data

        } catch (error) {
            console.log(error)
            return false
        }
    },
    getServiceItemByKey: async (key) => {
        try {
            const resp = await Promise.all([
                axios.get(`${server1c}/Catalog_Services?$format=json&$filter=DeletionMark eq false and ((public eq true) or (IsFolder eq true)) and Ref_Key eq guid'${key}'`),
                axios.get(`${server1c}/Catalog_Services_fields/?$format=json&$filter=Ref_Key eq guid'${key}'&$expand=in1C,component,howDepend`)
            ]
            )
            // const response = await axios.get(`${server1c}/Catalog_Services?$format=json&$filter=DeletionMark eq false and Usage eq true and Ref_Key eq guid'${key}'`, {
            //     headers
            // })
            // if (!response.data) {
            //     return false
            // }
            resp[0].data.value[0].fields = resp[1].data.value
            // console.log(resp)
            // console.log(resp[0].data.value)
            console.log(resp)
            return resp[0].data.value[0]

        } catch (error) {
            console.log('error',error)
            return { status: "error" }
        }
    },
}

module.exports = servicesOneC;