const axios = require('axios')
const public_key = 'd1b3960a2d39c09d6d6fb2e49ac99600'
const campaign_id = '989295860'

const sendCodeToPhone = async (phone) => {
    const response = await axios.get(`https://zvonok.com/manager/cabapi_external/api/v1/phones/flashcall/?campaign_id=${campaign_id}&phone=${phone}&public_key=${public_key}`)
    console.log(response.data.data)
    return response.data.data.pincode
}

module.exports = sendCodeToPhone;