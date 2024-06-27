const express = require('express');
const router = express.Router();
const { createClaim, getClaims } = require('../../services/onec/claimtest')

router.post('/', async (req, res) => {
    try {
        const userId = req.userId
        const data = req.body
        const newClaim = await createClaim(data, userId);
        res.json(newClaim);
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Internal server error' });
    }
});
router.get('/', async (req, res) => {
    try {
        const userId = req.userId
        console.log(userId)
        const services = await getClaims(userId);
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
        const service = await getServicesByKey(key);
        res.json(service);
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
