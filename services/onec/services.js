const axios = require('axios')
const moment = require('moment')
require('dotenv').config()

const server1c = process.env.SERVER_1C
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION
const headers = {
    "Authorization": server1c_auth
}

const servicesOneC = {
    getServicesByKey: async (key = "00000000-0000-0000-0000-000000000000") => {
        try {
            const response = await axios.get(`${server1c}/Catalog_Services?$format=json&$filter=DeletionMark eq false and Usage eq true and Parent_Key eq guid'${key}' and (( year(BeginDate) eq 0001 or (year(BeginDate) le ${moment().year()} and month(BeginDate) le ${moment().month() + 1} and day(BeginDate) le ${moment().date()})) and ( year(EndDate) eq 0001 or (year(EndDate) ne 0001 and year(EndDate) ge ${moment().year()} and month(EndDate) ge ${moment().month()} and day(EndDate) ge ${moment().date()})))`, {
                headers
            })
            if (!response.data) {
                return false
            }
            // console.log(response.data)
            return response.data

        } catch (error) {
            console.log(error.message)
            return false
        }
    },
    getServiceItemByKey: async (key) => {
        try {
            const resp = await Promise.all([
                axios.get(`${server1c}/Catalog_Services?$format=json&$filter=DeletionMark eq false and Usage eq true and Ref_Key eq guid'${key}'`, {
                    headers
                }),
                axios.get(`${server1c}/InformationRegister_portalFields?$format=json&$select=*&$expand=name,component,dependName,dependСondition&$filter=cast(object,'Catalog_Services') eq guid'${key}'`, {
                    headers
                })
            ]
            )
            // const response = await axios.get(`${server1c}/Catalog_Services?$format=json&$filter=DeletionMark eq false and Usage eq true and Ref_Key eq guid'${key}'`, {
            //     headers
            // })
            // if (!response.data) {
            //     return false
            // }
            resp[0].data.value[0].Fields = await Promise.all(resp[1].data.value.map((item, index) => {
                return new Promise(async (resolve, reject) => {
                    if (item.component_Type.includes("ComponentsTableInput")) {
                        const tableFields = await axios.get(`${server1c}/Catalog_ComponentsTableInput_Fields?$format=json&$filter=Ref_Key eq guid'${item.component}'&$expand=component`, {
                            headers
                        })
                        item.component_Expanded.Fields = tableFields.data.value
                    }
                    resolve(item)
                })

            })
            )
            // resp[0].data.value[0].Fields = resp[1].data.value
            // console.log(resp)
            // console.log(resp[0].data.value)
            // console.log(resp[1].data)
            return resp[0].data.value[0]

        } catch (error) {
            console.log(error.data)
            return { status: "error" }
        }
    },
}

module.exports = servicesOneC;