const express = require("express");
const router = express.Router();

const subjectsRouter = require("./cabinet/subjects");
const relationsRouter = require("./cabinet/relation");
const objectsRouter = require("./cabinet/objects");
const profileRouter = require("./cabinet/profile");
const uploadFile = require("./cabinet/uploadFile");
const getFile = require("./cabinet/getFile");
const getFias = require("./cabinet/getFias");
const getInn = require("./cabinet/getInn");
const getCadastral = require("./cabinet/getCadastral");
const getFmsUnit = require("./cabinet/getFmsUnit");
const sendSms = require("./cabinet/sendSms");
const documentsRouter = require("./cabinet/documents");
const claims = require("./cabinet/claims");
const getDaData = require("../routers/getDaData/getDaData");
const getPrice = require("../routers/cabinet/getPrice");
const pay = require("./cabinet/pay");
const paySber = require("./cabinet/paySber");
// ... и так далее для всех остальных файлов в папке cabinet ...

router.use("/subjects", subjectsRouter);
router.use("/relations", relationsRouter);
router.use("/objects", objectsRouter);
router.use("/profile", profileRouter);
router.use("/upload-file", uploadFile);
router.use("/get-file", getFile);
router.use("/get-fias", getFias);
router.use("/get-inn", getInn);
router.use("/get-price", getPrice);
router.use("/get-cadastral", getCadastral);
router.use("/get-fms", getFmsUnit);
router.use("/send-sms", sendSms);
router.use("/documents", documentsRouter);
router.use("/claims", claims);
router.use("/getDaData", getDaData);
router.use("/pay", pay);
router.use("/pay-sber", paySber);
// ... и так далее для всех остальных импортированных роутеров ...

module.exports = router;
