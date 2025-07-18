const express = require("express");
const router = express.Router();


const { getActionById, createNewTask } = require("../../services/onec/tasks");


router.get("/:id", async (req, res) => {
    const userId = req.userId;
    const id = req.params.id

    try {
        const task = await getActionById(id)
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