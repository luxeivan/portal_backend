const express = require('express');
const router = express.Router();
 const { getGetFields } = require('../services/onec/formonec')

router.get('/:key', async (req, res) => {
    try {
        const key = req.params.key;
        // const userId = req.userId
        //console.log(userData)
        const fields = await getGetFields(key);
        res.json(fields);
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Internal server error' });
    }
});
module.exports = router;