const express = require("express");
const router = express.Router();


const { getActionById, createNewTask, getTaskById } = require("../../services/onec/tasks");
const { sanitizeValues } = require("../../middleware/sanitizeValues");


router.get("/:id", async (req, res) => {
    // const userId = req.userId;
    const id = encodeURIComponent(req.params.id)

    try {
        const action = await getActionById(id)
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
    const id = encodeURIComponent(req.params.id)

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
router.post("/", sanitizeValues, async (req, res) => {
    const userId = req.userId;
    // const data = req.body
    const { typeActionId, claimId, versionId, values, taskBasis } = req.body;

    // 1. Валидация обязательных полей
    if (!typeActionId || typeof typeActionId !== 'string') {
        return res.status(400).json({ error: "typeActionId required and must be string" });
    }
    if (!claimId || typeof claimId !== 'string') {
        return res.status(400).json({ error: "claimId required and must be string" });
    }
    if (!versionId || typeof versionId !== 'string') {
        return res.status(400).json({ error: "versionId required and must be string" });
    }


    try {
        // const task = await createNewTask(userId, data)
        const task = false
        console.log(userId,
            {
                typeActionId,
                claimId,
                taskBasis,
                versionId,
                values, // ← уже санитизированный!
            }
        );

        // const task = await createNewTask(userId, {
        //     typeActionId,
        //     claimId,
        //     taskBasis,
        //     versionId,
        //     values, // ← уже санитизированный!
        // });
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