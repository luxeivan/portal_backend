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
            const response = await axios.get(`${server1c}/InformationRegister_ConnectionsOfElements?$format=json&$expand=Element2&$filter=cast(Element1,'Catalog_Profile') eq guid'${userId}' and Element2_Type eq 'StandardODATA.Document_ClaimsProject'`, {
                headers
            })
            if (!response.data) {
                return false
            }
            // console.log(response.data)
            return response.data.value

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
        // ------------------------------------------------------------------------
        const Fields = values.filter(item => {
            const field = service.Fields.find(field => field.idLine === item.key)
            if (field.component_Type.includes("ComponentsTableInput")) return false
            return true
        })
            .map((item, index) => {
                const field = service.Fields.find(field => field.idLine === item.key)
                // console.log('field',field)
                return {
                    LineNumber: index + 1,
                    Name_Key: field.name_Key,
                    Value: item.value ? item.value : undefined,
                    Value_Type: item.value ? field.component_Expanded.typeOData : undefined,
                    idLine: field.idLine,
                    // Component: field.component,
                    // Component_Type: field.component_Type,
                    LinkValueRepresentation: null
                }
            })
        // ------------------------------------------------------------------------
        service.Fields.filter(field => field.component_Type.includes('ComponentsHiddenInput'))
            .forEach((field, index) => {
                console.log(index, field)
                Fields.push({
                    LineNumber: Fields.length + 1 + index,
                    Name_Key: field.name_Key,
                    Value: field.component_Expanded.value,
                    Value_Type: field.component_Expanded.value_Type,
                    LinkValueRepresentation: null
                })
            })
        // ------------------------------------------------------------------------
        const TableFields = []
        let LineNumber = 1
        values.filter(item => {
            const field = service.Fields.find(field => field.idLine === item.key)
            if (field.component_Type.includes("ComponentsTableInput")) return true
            return false
        })
            .forEach((item, index) => {
                const table = service.Fields.find(field => field.idLine === item.key)
                // console.log(table.label)
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
                            Name_Key: table.component_Expanded.Fields.find(item => item.idLine === tableRow.key).name_Key,
                            Value: tableRow.value ? tableRow.value : undefined,
                            Value_Type: tableRow.value ? table.component_Expanded.Fields.find(item => item.idLine === tableRow.key).component_Expanded.typeOData : undefined,
                            idLine: table.component_Expanded.Fields.find(item => item.idLine === tableRow.key).idLine,
                        })
                        LineNumber = LineNumber + 1
                    })
                })

            })

        const newClaim = await axios.post(`${server1c}/Document_ClaimsProject?$format=json`, {
            Fields,
            TableFields,
            Date: moment().format(),
            Template_Key: data.service,
            profile: userId
        }, {
            headers
        })
        if (!newClaim.data) {
            return false
        }
        const connectionsOfElements = await axios.post(`${server1c}/InformationRegister_ConnectionsOfElements?$format=json`, {
            "Period": moment().format(),
            "Usage": true,
            "Element1": userId,
            "Element1_Type": "StandardODATA.Catalog_Profile",
            "Element2": newClaim.data.Ref_Key,
            "Element2_Type": "StandardODATA.Document_ClaimsProject",
            "Reason": "Установка соединения с профилем при создании заявки"
        }, {
            headers
        })
        // console.log(response.data)
        return newClaim.data


    },

}

module.exports = claimsOneC;