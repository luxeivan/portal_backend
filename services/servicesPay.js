const axios = require("axios");
const qs = require("qs")
const { v4 } = require('uuid')
const url = process.env.BANK_URL
const userName = process.env.BANK_USERNAME
const password = process.env.BANK_PASSWORD
const requestPay = async (zakaz, amount) => {
    console.log("zakaz",zakaz)
    console.log("amount",amount)
    const dataRequest = {
        amount: amount * 100,
        userName: userName,
        password: password,
        returnUrl: `https://portal.mosoblenergo.ru/cabinet/claimers/${zakaz}?pay=success`,
        description: 'Оплата заявки',
        language: 'ru',
        failUrl: `https://portal.mosoblenergo.ru/cabinet/claimers/${zakaz}?pay=fail`,
        orderNumber: v4(),
    };
    try {
        const response = await axios.post(url, qs.stringify(dataRequest), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        })
        // if (response.data.result.status.code === 0) {
        //     return pincode
        // } else {
        // }
        console.log(response.data);
        
        if(response.data?.formUrl){
            return response.data?.formUrl
        }else{
            return false
        }
    } catch (error) {
        console.log(error)
        throw new Error('Не удалось совершить оплату')
    }
}
module.exports = { requestPay };