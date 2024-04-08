const express = require('express');
const jwt = require('jsonwebtoken')
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
// const multer = require('multer')
// const upload = multer({ dest: 'uploads/' })

const pathFileStorage = process.env.PATH_FILESTORAGE
const maxSizeFile = 10 //Максимальный размер файла в мегабайтах

router.post('/',
    async function (req, res) {
        const uuid = uuidv4()
        const userId = req.userId
        const dirName = `${pathFileStorage}/${userId}`
        //console.log(req.files)
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ status: "error", message: 'Нет файлов для загрузки', files: req.files });
        }
        let bigFile = false
        Object.keys(req.files).map(item => {
            console.log(req.files[item].size)
            if (req.files[item].size > maxSizeFile * 1024 * 1024) {
                bigFile = true
            }

        })
        if (bigFile) {
            return res.status(400).json({ status: "error", message: 'Файлы больше 10МБ не принимаются' });

        }
        try {
            await fs.promises.access(dirName)
        } catch (err) {
            if (err && err.code === 'ENOENT') {
                try {
                    await fs.promises.mkdir(dirName)
                } catch (error) {
                    console.log(error)
                    return res.status(500).json({ status: "error", message: 'Ошибка при записи файлов' });
                }
            }
        }

        const arrayWriteFile = Object.keys(req.files).map(item => {
            return new Promise(function (resolve, reject) {
                const filename = `${item}_${uuid}.${req.files[item].name.slice(filename.lastIndexOf('.') + 1)}`
                //console.log(req.files[item])
                req.files[item].mv(`${dirName}/${filename}`, function (err) {
                    if (err) reject({ status: "error", message: 'Ошибка при записи файлов', error })
                    resolve(`${filename}`)
                })
                // fs.promises.writeFile(`${dirName}/${filename}`, req.files[item].data).then(() => {
                //     resolve(`/${userId}/${filename}`)
                // }).catch((error) => {
                //     reject({ status: "error", message: 'Ошибка при записи файлов', error })
                // })
            })
        })

        Promise.all(arrayWriteFile)
            .then((responses) => {
                // console.log(responses)
                return res.json({ status: "ok", files: responses });
            })
            .catch(error => {
                console.error(error)
                return res.status(500).json({ status: "error", message: 'Ошибка при записи файлов' });
            })


    }
)

module.exports = router;