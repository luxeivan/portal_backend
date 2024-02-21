const axios = require('axios')
require('dotenv').config()

const serverStrapi = process.env.SERVER_DB

const strapi = {
    getUserByEmail: async (email) => {
        const response = await axios.get(`${serverStrapi}/api/user-portals?filters[email][$eq]=${email}&populate=password`)
        //console.log(response.data.data[0])
        return response.data.data[0]
    },
    checkUserByEmail: async (email) => {
        const response = await axios.get(`${serverStrapi}/api/user-portals?filters[email][$eq]=${email}&populate=password`)
        //console.log(response.data.data[0])
        return response.data.data[0] ? response.data.data[0].id : false
    },
    getUserById: async (id) => {
        const response = await axios.get(`${serverStrapi}/api/user-portals/${id}?populate=*`)
        console.log(response.data.data)
        return response.data.data
    },
    createNewUser: async (email, phone, password) => {
        const response = await axios.post(`${serverStrapi}/api/user-portals?`, {
            data: {
                email,
                phone,
                password
            }
        })
        console.log(response.data)
        return response.data
    },
    updateUser: async (checkUser, phone, password) => {
        const response = await axios.put(`${serverStrapi}/api/user-portals/${checkUser}`, {
            data: {
                phone,
                password
            }
        })
        console.log(response.data)
        return response.data
    }
}

module.exports = strapi;