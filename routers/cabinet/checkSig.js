// const { default: axios } = require("axios");
const { exec } = require("child_process");
const express = require("express");
const { v4 } = require("uuid");
const fs = require("fs/promises");
const path = require("path");
const { default: axios } = require("axios");
const router = express.Router();
const urlCheckSig = "https://e-trust.gosuslugi.ru/app/scc/portal/api/v1/portal/ESV/verifyAndGetReports"
// const urlCheckSig = "https://e-trust.gosuslugi.ru/app/scc/portal/api/v1/portal/ESV/verifyAndGetReports"

const SERVER_1C_HTTP_SERVICE = process.env.SERVER_1C_HTTP_SERVICE;
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;
const headers = {
  Authorization: server1c_auth,
};

const remFile = (path) => {
  fs.unlink(path, (err) => {
    if (err) throw err;
    console.log(`${path} was deleted`);
  })
}
const getFile = async (userId, fileId, sig = false) => {
  let url = `${SERVER_1C_HTTP_SERVICE}/profile/${userId}/files/${fileId}`
  if (sig) url = `${SERVER_1C_HTTP_SERVICE}/profile/${userId}/files/signed/${fileId}`
  try {
    const connectionResponse = await axios.get(
      url,
      { headers }
    );
    // console.log("url", url);
    // console.log("fileId", connectionResponse.data);
    return connectionResponse?.data?.data
  } catch (error) {
    console.log("Ошибка получения файла", error);
    return false
  }
}

router.post("/", async (req, res) => {
  const userId = req.userId;
  const documentId = req.body.documentId
  const sigId = req.body.sigId
  // console.log("documentId", documentId);
  // console.log("sigId", sigId);
  let docFile
  let sigFile
  if (sigId && documentId) {
    docFile = await getFile(userId, documentId)
    sigFile = await getFile(userId, sigId, true)
  }
  // console.log("docFile", docFile);
  // console.log("sigFile", sigFile);
  const docPath = path.join(__dirname, "..", "..", "files", v4())
  const sigPath = path.join(__dirname, "..", "..", "files", v4())
  if (docFile?.base64 && sigFile?.base64) {
    try {
      await fs.writeFile(docPath, docFile.base64, 'base64')
      await fs.writeFile(sigPath, sigFile.base64, 'base64')
    } catch (error) {
      console.log("Ошибка записи файла на диск", error);
    }
  }else{
    console.log("Чтото не так с файлами");
    return res.status(500).json({status:"error",message:"Чтото не так с файлами"})    
  }
  // cms.mv(cmsPath, (err) => {
  //   if (err) {
  //     return res.status(500).send(err);
  //   }
  //   // return res.send({ status: "success", path: path });
  // });
  // data.mv(dataPath, (err) => {
  //   if (err) {
  //     return res.status(500).send(err);
  //   }
  //   // return res.send({ status: "success", path: path });
  // });





  // const data = req.body
  // console.log("body", body)
  // console.log("files", files)
  // console.log("data", data)
  // const body = new FormData()
  // body.append("captchaText", "00")
  // body.append("captchaUuid", "a7c98e54-9c24-4e9b-bf69-58b678fcec95")
  // body.append("VerifySignatureOnly", false)
  // body.append("methodName", "verifyCMSSignatureDetached")
  // // body.append("cms", "")
  // // body.append("data", "")
  // console.log("readStream", fs.readFileSync(cmsPath));

  // body.append("cms", fs.readFileSync(cmsPath))
  // body.append("data", fs.readFileSync(dataPath))
  // // console.log("body", Object.fromEntries(body.entries()))
  // try {
  //     const response = await axios.post(url, body, { headers: { "Content-Type": "multipart/form-data","User-Agent":"PostmanRuntime/7.49.1" } })
  //     console.log(response.data)

  // } catch (error) {
  //     console.log("error", error)
  // }



  const command = `curl -X POST ${urlCheckSig} -F "data=@${docPath}" -F "cms=@${sigPath}"`
  // console.log("command", command);

  exec(command, (error, stdout) => {
    if (error) {
      console.log(`error: ${error.message}`);
      remFile(sigPath)
      remFile(docPath)
      return res.json({ status: "error", message: error.message });
    }
    // if (stderr) {
    //     console.log(`stderr: ${stderr}`); return res.json({ status: "error", message: stderr });
    // }
    // console.log(`stdout: ${stdout}`);
    remFile(sigPath)
    remFile(docPath)
    res.json({ status: "OK", data: stdout })
  });

});

module.exports = router;