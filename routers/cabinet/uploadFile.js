const express = require('express');
const jwt = require('jsonwebtoken')
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const logger = require("../../logger");
// const multer = require('multer')
// const upload = multer({ dest: 'uploads/' })

const pathFileStorage = process.env.PATH_FILESTORAGE
const maxSizeFile = 10 //Максимальный размер файла в мегабайтах

router.post('/',
    async function (req, res) {
        const uuid = uuidv4();
        const userId = req.userId;
        const dirName = `${pathFileStorage}/${userId}`;
        logger.info(`Получен запрос на загрузку файлов для пользователя: ${userId}, UUID: ${uuid}`);

        if (!req.files || Object.keys(req.files).length === 0) {
            logger.warn(`Запрос на загрузку файлов не содержит файлов. UUID: ${uuid}`);
            return res.status(400).json({ status: "error", message: 'Нет файлов для загрузки', files: req.files });
        }

        let bigFile = false;
        Object.keys(req.files).map(item => {
            logger.info(`Размер файла ${item}: ${req.files[item].size} байт. UUID: ${uuid}`);
            if (req.files[item].size > maxSizeFile * 1024 * 1024) {
                bigFile = true;
            }
        });

        if (bigFile) {
            logger.warn(`Один или несколько файлов превышают допустимый размер. UUID: ${uuid}`);
            return res.status(400).json({ status: "error", message: 'Файлы больше 10МБ не принимаются' });
        }

        try {
            await fs.promises.access(dirName);
        } catch (err) {
            if (err && err.code === 'ENOENT') {
                try {
                    await fs.promises.mkdir(dirName);
                    logger.info(`Создана директория: ${dirName}. UUID: ${uuid}`);
                } catch (error) {
                    logger.error(`Ошибка при создании директории: ${dirName}. UUID: ${uuid}. Ошибка: ${error.message}`);
                    return res.status(500).json({ status: "error", message: 'Ошибка при записи файлов' });
                }
            }
        }

        const arrayWriteFile = Object.keys(req.files).map(item => {
            return new Promise(function (resolve, reject) {
                const filename = `${item}_${uuid}.${req.files[item].name.slice(req.files[item].name.lastIndexOf('.') + 1)}`;
                req.files[item].mv(`${dirName}/${filename}`, function (err) {
                    if (err) {
                        logger.error(`Ошибка при записи файла: ${filename}. UUID: ${uuid}. Ошибка: ${err.message}`);
                        reject({ status: "error", message: 'Ошибка при записи файлов', error: err });
                    } else {
                        logger.info(`Файл успешно записан: ${filename}. UUID: ${uuid}`);
                        resolve(`${filename}`);
                    }
                });
            });
        });

        Promise.all(arrayWriteFile)
            .then((responses) => {
                logger.info(`Все файлы успешно загружены для пользователя: ${userId}, UUID: ${uuid}`);
                return res.json({ status: "ok", files: responses });
            })
            .catch(error => {
                logger.error(`Ошибка при записи файлов. UUID: ${uuid}. Ошибка: ${error.message}`);
                return res.status(500).json({ status: "error", message: 'Ошибка при записи файлов' });
            });
    }
);


module.exports = router;