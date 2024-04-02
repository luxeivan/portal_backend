const express = require('express');
const router = express.Router();

const pathFileStorage = process.env.PATH_FILESTORAGE

router.get('/:filename', async function (req, res) {
    const userId = req.userId
    const dirName = `${pathFileStorage}/${userId}`
    const file = `${dirName}/${req.params.filename}`;
    res.download(file); // Set disposition and send it.
})

module.exports = router;