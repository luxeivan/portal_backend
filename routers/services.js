const express = require('express');
const router = express.Router();
const { getServicesByKey, getServiceItemByKey } = require('../services/onec/services')

router.get('/', async (req, res) => {
    try {
        // const userId = req.userId
        //console.log(userData)
        const services = await getServicesByKey();
        res.json(services);
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Internal server error' });
    }
});
router.get('/:key', async (req, res) => {
    try {
        // const userId = req.userId
        const key = req.params.key;
        //console.log(userData)
        const services = await getServicesByKey(key);
        res.json(services);
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Internal server error' });
    }
});
router.get('/item/:key', async (req, res) => {
    try {
        // const userId = req.userId
        const key = req.params.key;
        //console.log(userData)
        const services = await getServiceItemByKey(key);
        res.json(services);
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
