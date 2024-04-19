const axios = require('axios')
const public_key = 'd1b3960a2d39c09d6d6fb2e49ac99600'
const campaign_id = '989295860'


// const sendCodeToPhone = async (phone) => {
//     const response = await axios.get(`https://zvonok.com/manager/cabapi_external/api/v1/phones/flashcall/?campaign_id=${campaign_id}&phone=${phone}&public_key=${public_key}`)
//     console.log(response.data.data)
//     return response.data.data.pincode
// }
const sendCodeToPhone = async (phone) => {
    const authMegafon = process.env.AUTH_MEGAFON_SMS
    var pincode = Math.floor(1000 + Math.random() * 9000);
    const response = await axios.post('https://a2p-api.megalabs.ru/sms/v1/sms', {
        from: "M-OBLENERGO",
        to: Number(phone),
        message: `Код: ${pincode}`,
    }, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": authMegafon
        },
    })
    if (response.data.result.status.code === 0) {
        return pincode
    } else {
        throw new Error('Не удалось отправить код')
    }
    // console.log(response.data)
}

module.exports = sendCodeToPhone;