// const { default: axios } = require("axios");
const { exec } = require("child_process");
const express = require("express");
const { v4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const url = "https://e-trust.gosuslugi.ru/app/scc/portal/api/v1/portal/ESV/verifyAndGetReports"

const remFile = (path) => {
    fs.unlink(path, (err) => {
        if (err) throw err;
        console.log(`${path} was deleted`);
    })
}

router.post("/", async (req, res) => {
    const cms = req.files.cms
    const data = req.files.data
    const cmsPath = path.join(__dirname, "..", "files", v4())
    const dataPath = path.join(__dirname, "..", "files", v4())
    cms.mv(cmsPath, (err) => {
        if (err) {
            return res.status(500).send(err);
        }
        // return res.send({ status: "success", path: path });
    });
    data.mv(dataPath, (err) => {
        if (err) {
            return res.status(500).send(err);
        }
        // return res.send({ status: "success", path: path });
    });

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
    const command = `curl -X POST ${url} -F "data=@${dataPath}" -F "cms=@${cmsPath}"`
    console.log("command", command);

    exec(command, (error, stdout) => {
        if (error) {
            console.log(`error: ${error.message}`);
            remFile(cmsPath)
            remFile(dataPath)
            return res.json({ status: "error", message: error.message });
        }
        // if (stderr) {
        //     console.log(`stderr: ${stderr}`); return res.json({ status: "error", message: stderr });
        // }
        // console.log(`stdout: ${stdout}`);
        remFile(cmsPath)
        remFile(dataPath)
        res.json({ status: "OK", data: stdout })
    });

});

module.exports = router;