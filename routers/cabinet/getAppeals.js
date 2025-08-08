const express = require("express");
const router = express.Router();


const { getAppealsList, getAppeal } = require("../../services/onec/appeals");


router.get("/", async (req, res) => {
    // const userId = req.userId;
    const id = req.params.id

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
    const id = req.params.id

    try {
        const action = await getAppeal(id)
        // console.log(action);
        if (!action) {
            return res.json(false)
        }
        return res.json(action)
    } catch (error) {

        res.status(500).json({
            status: "error",
            message: "Ошибка при получении экшена",
            error: error.message,
        });
    }
});

router.get("/task/:id", async (req, res) => {
    const userId = req.userId;
    const id = req.params.id

    try {
        const task = await getTaskById(userId, id)
        if (!task) {
            return res.json(false)
        }
        return res.json(task)
    } catch (error) {

        res.status(500).json({
            status: "error",
            message: "Ошибка при получении задачи",
            error: error.message,
        });
    }
});
router.post("/", async (req, res) => {
    const userId = req.userId;
    const data = req.body
    try {
        const task = await createNewTask(userId, data)
        if (!task) {
            return res.json(false)
        }
        return res.json(task)
    } catch (error) {

        res.status(500).json({
            status: "error",
            message: "Ошибка при создании задачи",
            error: error.message,
        });
    }
})



module.exports = router;