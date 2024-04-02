const express = require('express');
const router = express.Router();

const subjectsRouter = require('./cabinet/subjects');
const objectsRouter = require('./cabinet/objects');
const uploadFile = require('./cabinet/uploadFile');
const getFile = require('./cabinet/getFile');
const getFias = require('./cabinet/getFias');
// ... и так далее для всех остальных файлов в папке cabinet ...

router.use('/subjects', subjectsRouter);
router.use('/objects', objectsRouter);
router.use('/upload-file', uploadFile);
router.use('/get-file', getFile);
router.use('/get-fias', getFias);
// ... и так далее для всех остальных импортированных роутеров ...

module.exports = router;
