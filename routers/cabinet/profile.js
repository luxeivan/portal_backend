const express = require('express');
const router = express.Router();
const { getUserById } = require('../../services/strapi')

router.get('/', async (req, res) => {
    try {
        const userId = req.userId
        //console.log(userData)
        const profile = await getUserById(userId);
        res.json({
            firstname: profile.attributes.firstname,
            lastname: profile.attributes.lastname,
            email: profile.attributes.email,
            phone: profile.attributes.phone,
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
