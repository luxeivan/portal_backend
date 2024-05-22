const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const sendCodeToMail = require('../services/sendCodeToMail')
const sendCodeToPhone = require('../services/sendCodeToPhone')
const { createNewUser, updateUser, checkUserByEmail } = require('../services/onec/users')

const privateKey = process.env.JWT_SECRET;

const attempts = 3 //Количество попыток
const timeAttempts = 5 //Время попыток

//Прием телефона и звонок с кодом------------------------------------------------------------------------------
router.post('/phone', async (req, res) => {
    //Если нет поле phone
    //console.log(req.body)
    if (!req.body.phone) {
        return res.json({ status: 'error', message: "нет нужной информации" })
    }
    //Если телефон уже подтвержден
    if (req.session.phoneCheck) {
        return res.json({ status: 'error', message: "телефон уже подтвержден" })
    }

    //Проверяем время попыток
    if (req.session.phoneBlock) {
        return res.json({ status: 'unavailable', message: "нельзя часто отправлять запросы на подтверждение телефона" })
    }
    req.session.phone = req.body.phone //Запись телефона в сессию
    req.session.phoneCheck = false //Запись телефон не проверен в сессию        
    req.session.phoneCount = attempts //Запись количества попыток проверки в сессию        

    //Пытаемся отправить код на телефон
    try {
        const code = await sendCodeToPhone(req.body.phone)
console.log('code',code)
        //Блокируем на время
        req.session.phoneBlock = true
        setTimeout(() => {
            req.session.phoneBlock = false
        }, timeAttempts)

        req.session.phoneCode = code //Запись правильного кода проверки в сессию

        return res.json({ status: 'ok', phoneCount: req.session.phoneCount })
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ status: 'error', message: "ошибка отправки кода" })
    }

})

//Проверка кода из звонка с кодом введенным пользователем------------------------------------------------------------------------------
router.post('/phonecode', async (req, res) => {
    //Если нет поле phoneCode
    if (!req.body.phoneCode) {
        return res.json({ status: 'error', message: "нет нужной информации" })
    }
    //Если телефон уже подтвержден
    if (req.session.phoneCheck) {
        return res.json({ status: 'error', message: "телефон уже подтвержден" })
    }
    //Если количество попыток завершилось обнуляем сессию
    if (req.session.phoneCount <= 0) {
        req.session.destroy()
        return res.json({ status: 'error', message: "закончились попытки подтверждения телефона" })
    }
    //Сравниваем пришедший код и код из сессии если совпадает то подтверждаем проверку телефона
    console.log('phoneCode',req.session.phoneCode)
    if (req.body.phoneCode == req.session.phoneCode) {
        req.session.phoneCheck = true
        req.session.phoneCount = 0
        return res.json({ status: 'ok', message: "телефон подтвержден" })
    } else {
        req.session.phoneCount = req.session.phoneCount - 1
        return res.json({ status: 'error', message: "неверный код", phoneCount: req.session.phoneCount })
    }

})

//Прием email и отправка письма с кодом на почту------------------------------------------------------------------------------
router.post('/email', async (req, res) => {
    //Если нет поле email
    console.log(req.body)
    if (!req.body.email) {
        return res.json({ status: 'error', message: "нет нужной информации" })
    }

    //Если email уже подтвержден
    if (req.session.emailCheck) {
        return res.json({ status: 'error', message: "email уже подтвержден" })
    }

    //Проверяем подтвержден ли телефон
    if (!req.session.phoneCheck) {
        return res.json({ status: 'error', message: "вначале нужно подтвердить телефон" })
    }
    //Проверяем время попыток
    if (req.session.emailBlock) {
        return res.json({ status: 'unavailable', message: "нельзя часто отправлять запросы на подтверждение email" })
    }
    req.session.email = req.body.email.toLowerCase() //Запись email в сессию
    req.session.emailCheck = false //Запись email не проверен в сессию        
    req.session.emailCount = attempts //Запись количества попыток проверки в сессию        

    //Пытаемся отправить код на email
    try {
        const code = await sendCodeToMail(req.body.email)

        //Блокируем на время
        req.session.emailBlock = true
        setTimeout(() => {
            req.session.emailBlock = false
        }, timeAttempts)

        req.session.emailCode = code //Запись правильного кода проверки в сессию

        return res.json({ status: 'ok', emailcount: req.session.emailCount })
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ status: 'error', message: "ошибка отправки кода" })
    }
})


//Проверка кода из письма с кодом введенным пользователем------------------------------------------------------------------------------
router.post('/emailcode', async (req, res) => {
    //Если нет поле emailCode
    if (!req.body.emailCode) {
        return res.json({ status: 'error', message: "нет нужной информации" })
    }
    //Если email уже подтвержден
    if (req.session.emailCheck) {
        return res.json({ status: 'error', message: "email уже подтвержден" })
    }
    //Если количество попыток завершилось обнуляем сессию
    if (req.session.emailCount == 0) {
        req.session.destroy()
        return res.json({ status: 'error', message: "закончились попытки подтверждения телефона" })
    }
    //Сравниваем пришедший код и код из сессии если совпадает то подтверждаем проверку телефона
    if (req.body.emailCode == req.session.emailCode) {
        req.session.emailCheck = true
        req.session.emailCount = 0
        return res.json({ status: 'ok', message: "телефон подтвержден" })
    } else {
        req.session.emailCount = req.session.emailCount - 1
        return res.json({ status: 'error', message: "неверный код", emailCount: req.session.emailCount })
    }
})

//Проверка подтверждения почты и телефона, получение пароля от пользователя и запись нового пользователя в базу------------------------------------------------------------------------------
router.post('/newuser', async (req, res) => {
    //Если нет поле password
    if (!req.body.password) {
        return res.json({ status: 'error', message: "нет нужной информации" })
    }
    //Проверка подтвержден ли email и телефон
    if (!req.session.emailCheck || !req.session.phoneCheck) {
        return res.json({ status: 'error', message: "не вся информация подтверждена" })
    }
    //Проверка на существование пользователя
    const checkUser = await checkUserByEmail(req.session.email)
    if (checkUser) {
        //Обновление пароля и телефона пользователя с указанным email
        try {
            const newuser = await updateUser(checkUser, req.session.phone, req.body.password)
            console.log(newuser)
            //const email = req.session.email
            req.session.destroy()
            const userjwt = jwt.sign({ id: newuser.data.id, email: newuser.data.attributes.email, phone: newuser.data.attributes.phone }, privateKey, { expiresIn: `${process.env.JWT_LIVE_HOURS}h` });
            return res.json({ status: "ok", jwt: userjwt });
            // return res.json({ status: 'ok', message: `Пароль и телефон обновлен у пользователя: ${email}` })
        } catch (error) {
            console.log(error.message)
            return res.status(500).json({ status: 'error', message: "ошибка обновления пользователя", error: error.message })
        }

    }
    //Создание нового пользователя
    try {
        const newuser = await createNewUser(req.session.email, req.session.phone, req.body.password)
        req.session.destroy()
        const userjwt = jwt.sign({ id: newuser.data.id, email: newuser.data.attributes.email, phone: newuser.data.attributes.phone }, privateKey, { expiresIn: `${process.env.JWT_LIVE_HOURS}h` });
        return res.json({ status: "ok", jwt: userjwt });
        // return res.json({ status: 'ok', message: "пользователь создан", data: newuser.data })
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ status: 'error', message: "ошибка создания пользователя", error: error.message })
    }

})


//Сброс сессии по запросу от клиента------------------------------------------------------------------------------
router.post('/clearinfo', async (req, res) => {
    req.session.destroy()
    res.json({ status: 'ok', message: "отменены все предыдущие действия" })
})


module.exports = router;