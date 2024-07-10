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
        const Fields = values.filter(item => {
            const field = service.Fields.find(field => field.idLine === item.key)
            if (field.component_Type.includes("ComponentsTableInput")) return false
            return true
        })
            .map((item, index) => {
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
        const TableFields = []
        let LineNumber = 1
        values.filter(item => {
            const field = service.Fields.find(field => field.idLine === item.key)
            if (field.component_Type.includes("ComponentsTableInput")) return true
            return false
        })
            .forEach((item, index) => {
                const table = service.Fields.find(field => field.idLine === item.key)
                // console.log(table.component_Expanded)
                item.value.forEach((valuesTable, indexRow) => {
                    const arr = []
                    for (const [key, value] of Object.entries(valuesTable)) {
                        arr.push({ key, value })
                    }
                    arr.forEach(tableRow => {
                        TableFields.push({
                            LineNumber,
                            LineNum: indexRow + 1,
                            NameTable_Key: table.component_Expanded.nameTable_Key,
                            Name_Key: tableRow.key,
                            Value: tableRow.value,
                            Value_Type: table.component_Expanded.Fields.find(item => item.name_Key === tableRow.key).component_Expanded.typeOData,
                            idLine: table.component_Expanded.Fields.find(item => item.name_Key === tableRow.key).Ref_Key,
                        })
                        LineNumber = LineNumber + 1
                    })
                })

            })

        const response = await axios.post(`${server1c}/Document_Claims?$format=json`, {
            Fields,
            TableFields,
            Date: moment().format(),
            Template_Key: data.service,
            profile: userId
        }, {
            headers
        })
        if (!response.data) {
            return false
        }
        console.log(response.data)
        return response.data


    },

}

module.exports = claimsOneC;