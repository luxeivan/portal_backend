const express = require('express');
const jwt = require('jsonwebtoken')
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const pathFileStorage = process.env.PATH_FILESTORAGE

router.post('/',
    async function (req, res) {
        const uuid = uuidv4()
        const userId = req.userId
        const dirName = `${pathFileStorage}/${userId}`

        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send('No files were uploaded.');
        }
        const arrayWriteFile = Object.keys(req.files).map(item => {
            return new Promise(function (resolve, reject) {
                const filename = `${item}_${uuid}.${req.files[item].name.split('.')[1]}`
                fs.promises.writeFile(`${dirName}/${filename}`, req.files[item].data).then(() => {
                    resolve(`/${userId}/${filename}`)
                }).catch(() => {
                    reject('Ошибка при записи файлов')
                })
            })
        })

        Promise.all(arrayWriteFile)
            .then((responses) => {
                // console.log(responses)
                return res.json({ success: true, files: responses });
            })
            .catch(error => {
                console.error(error)
            })

    }
)

module.exports = router;