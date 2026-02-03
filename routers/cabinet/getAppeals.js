const express = require("express");
const router = express.Router();


const { getAppealsList, getAppeal, createNewAppeal, readAnswerOfAppeal } = require("../../services/onec/appeals");


router.get("/", async (req, res) => {
    // const userId = req.userId;
    const id = encodeURIComponent(req.params.id)

    try {
        const appeals = await getAppealsList(id)
        if (!appeals) {
            return res.json(false)
        }
        return res.json(appeals)
    } catch (error) {

        res.status(500).json({
            status: "error",
            message: "Ошибка при получении списка шаблонов обращений",
            error: error.message,
        });
    }
});
router.get("/:id", async (req, res) => {
    // const userId = req.userId;
    const id = encodeURIComponent(req.params.id)

    try {
        const appeal = await getAppeal(id)
        // console.log(action);
        if (!appeal) {
            return res.json(false)
        }
        return res.json(appeal)
    } catch (error) {

        res.status(500).json({
            status: "error",
            message: "Ошибка при получении формы обращения",
            error: error.message,
        });
    }
});

// router.get("/task/:id", async (req, res) => {
//     const userId = req.userId;
//     const id = req.params.id

//     try {
//         const task = await getTaskById(userId, id)
//         if (!task) {
//             return res.json(false)
//         }
//         return res.json(task)
//     } catch (error) {

//         res.status(500).json({
//             status: "error",
//             message: "Ошибка при получении задачи",
//             error: error.message,
//         });
//     }
// });
router.post("/", async (req, res) => {
    const userId = req.userId;
    const data = req.body
    try {
        const newAppeal = await createNewAppeal(userId, data)
        if (!newAppeal) {
            return res.json(false)
        }
        return res.json(newAppeal)
    } catch (error) {

        res.status(500).json({
            status: "error",
            message: "Ошибка при создании обращения",
            error: error.message,
        });
    }
})

//Прочитать ответ на обращение
router.post("/read", async (req, res) => {
    const userId = req.userId;
    const id = req.body.id
    console.log("id", id);
    try {
        const readAnswer = await readAnswerOfAppeal(userId, id)
        if (!readAnswer) {
            return res.json(false)
        }
        return res.json(true)
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Ошибка при прочтении ответа",
            error: error.message,
        });
    }
})



module.exports = router;