const express = require('express');
const router = express.Router();
const sendCodeToMail = require('../services/sendCodeToMail')

router.get('/', async (req, res) => {
    try {
       await sendCodeToMail('luxeivan@gmail.com', 5289)
       res.json({status:"ok"})
    } catch (error) {
        res.json(error)
    }
    
})
module.exports = router;