const express = require('express');
const router = express.Router();

const subjectsRouter = require('./cabinet/subjects');
const objectsRouter = require('./cabinet/objects');
// ... и так далее для всех остальных файлов в папке cabinet ...

router.use('/subjects', subjectsRouter);
router.use('/objects', objectsRouter);
// ... и так далее для всех остальных импортированных роутеров ...

module.exports = router;
