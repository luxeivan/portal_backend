const express = require('express');
const router = express.Router();
 const { getGetFields } = require('../services/onec/formonec')

router.get('/', async (req, res) => {
    try {
        // const userId = req.userId
        //console.log(userData)
        const fields = await getGetFields();
        res.json(fields);
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Internal server error' });
    }
});
module.exports = router;