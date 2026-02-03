const express = require("express");
const axios = require("axios");
require("dotenv").config();
const fs = require("fs");
const Readable = require('stream').Readable

const router = express.Router();

function b64toBlob(b64Data, contentType = '', sliceSize = 512) {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }
    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
}

// const SERVER_1C = process.env.SERVER_1C;
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;
const server1cHttpService = process.env.SERVER_1C_HTTP_SERVICE;
// Заголовки для авторизации на 1С
const headers = {
    Authorization: server1c_auth,
};
/**
 * @swagger
 * /api/contacts:
 *   get:
 *     summary: Получение данных публичного файла
 *     description: |
 *       Возвращает файл в формате base64
 *     tags: ["🌐 Contact"]
 *     responses:
 *       200:
 *         description: Контакты найдены
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   object:
 *                     type: string
 *                     description: GUID записи контакта
 *                     example: "e93f2105-bffe-11ee-907a-00505601574a"
 *                   description:
 *                     type: string
 *                     example: "Центральные электросети"
 *                   photos:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         ПутьКФайлу:
 *                           type: string
 *                           example: "images/contacts/123.jpg"
 *                         ПолныйПутьWindows:
 *                           type: string
 *                           example: "\\\\srv\\share\\images\\contacts\\123.jpg"
 *       500:
 *         description: Ошибка при запросе к 1С
 */

router.get("/:key/:ext", async (req, res) => {
    const key = encodeURIComponent(req.params.key);
    const ext = encodeURIComponent(req.params.ext);
    // const isFile = fs.existsSync(`./uploads/${key}.${ext}`)
    // console.log("isFile", isFile);

    try {
        const response = await axios.get(`${server1cHttpService}/public/files/${key}`, { headers })
        if (response.data) {
            // const fileBlob = b64toBlob(response.data.data.base64)
            const imgBuffer = Buffer.from(response.data.data.base64, 'base64')
            const s = new Readable()

            s.push(imgBuffer)
            s.push(null)

            s.pipe(fs.createWriteStream(`./uploads/${response.data.data.checksum}.${response.data.data.ext}`));
            // const fileBlob = atob(response.data.data.base64);
            // await fs.writeFile(`/uploads/${response.data.data.id}.${response.data.data.ext}`, fileBlob)
            // console.log(response.data)
            return res.json({ ...response.data })
        }
        return res.status(500).json({ status: "error", message: "Ошибка получения файла" })
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: "error", message: "Ошибка получения файла" })
    }
})
module.exports = router;
