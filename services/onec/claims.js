const axios = require('axios')
const moment = require('moment')
const services = require('./services')
require('dotenv').config()

const server1c = process.env.SERVER_1C
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION
const headers = {
    "Authorization": server1c_auth
}

const claimsOneC = {
    getClaims: async (userId) => {
        try {
            const response = await axios.get(`${server1c}/Document_Claims?$format=json&$filter=profile eq '${userId}'`, {
                headers
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
    createClaim: async (data, userId) => {
        // console.log(data)
        const service = await services.getServiceItemByKey(data.service)
        // console.log(service)
        const values = []
        for (const [key, value] of Object.entries(data.values)) {
            // console.log(`${key}: ${value}`);
            values.push({ key, value })
        }
        const Fields = values.map((item, index) => {
            const field = service.Fields.find(field => field.idLine === item.key)
            return {
                LineNumber: index + 1,
                Name_Key: field.name_Key,
                Value: item.value,
                Value_Type: field.component_Expanded.typeOData,
                idLine: field.idLine,
                // Component: field.component,
                // Component_Type: field.component_Type,
                LinkValueRepresentation: null
            }
        })

        const response = await axios.post(`${server1c}/Document_Claims?$format=json`, {
            Fields,
            Date: moment().format(),
            Template_Key: data.service,
            profile: userId
        }, {
            headers
        })
        if (!response.data) {
            return false
        }
        // console.log(response.data)
        return response.data


    },

}

module.exports = claimsOneC;